from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = "your-secret-key-here"  # In production, use environment variable

# Helper function to hash passwords
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    gender: str
    email: EmailStr
    phone: str
    birth_date: str
    country: str
    city: str
    role: str = "user"  # user or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    gender: str
    email: EmailStr
    password: str
    phone: str
    birth_date: str
    country: str
    city: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    price: float
    currency: str = "TRY"
    videos: List[dict] = []  # [{title: str, vimeo_url: str, description: str}]
    thumbnail_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class CourseCreate(BaseModel):
    title: str
    description: str
    price: float
    currency: str = "TRY"
    videos: List[dict] = []
    thumbnail_url: Optional[str] = None

class Purchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    course_id: str
    amount: float
    currency: str
    status: str = "completed"  # For prototype - always completed
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Auth helper functions
def create_access_token(user_id: str):
    payload = {"user_id": user_id, "exp": datetime.now(timezone.utc).timestamp() + 86400}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication routes
@api_router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict.pop('password')
    user = User(**user_dict)
    
    # Store in database
    user_doc = user.dict()
    user_doc['hashed_password'] = hashed_password
    await db.users.insert_one(user_doc)
    
    return user

@api_router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(login_data.password, user_doc['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    access_token = create_access_token(user_doc['id'])
    return Token(access_token=access_token)

@api_router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Course routes
@api_router.get("/courses", response_model=List[Course])
async def get_courses():
    courses = await db.courses.find({"is_active": True}).to_list(1000)
    return [Course(**course) for course in courses]

@api_router.post("/admin/courses", response_model=Course)
async def create_course(course_data: CourseCreate, admin_user: User = Depends(get_admin_user)):
    course = Course(**course_data.dict())
    course_doc = course.dict()
    await db.courses.insert_one(course_doc)
    return course

@api_router.get("/admin/courses", response_model=List[Course])
async def get_all_courses_admin(admin_user: User = Depends(get_admin_user)):
    courses = await db.courses.find().to_list(1000)
    return [Course(**course) for course in courses]

@api_router.put("/admin/courses/{course_id}", response_model=Course)
async def update_course(course_id: str, course_data: CourseCreate, admin_user: User = Depends(get_admin_user)):
    course_doc = await db.courses.find_one({"id": course_id})
    if not course_doc:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = course_data.dict()
    await db.courses.update_one({"id": course_id}, {"$set": update_data})
    
    updated_course = await db.courses.find_one({"id": course_id})
    return Course(**updated_course)

@api_router.delete("/admin/courses/{course_id}")
async def delete_course(course_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

# Purchase routes (Mock for prototype)
@api_router.post("/purchase/{course_id}", response_model=Purchase)
async def purchase_course(course_id: str, current_user: User = Depends(get_current_user)):
    # Check if course exists
    course = await db.courses.find_one({"id": course_id, "is_active": True})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already purchased
    existing_purchase = await db.purchases.find_one({"user_id": current_user.id, "course_id": course_id})
    if existing_purchase:
        raise HTTPException(status_code=400, detail="Course already purchased")
    
    # Create purchase (mock - always successful)
    purchase = Purchase(
        user_id=current_user.id,
        course_id=course_id,
        amount=course['price'],
        currency=course['currency']
    )
    
    purchase_doc = purchase.dict()
    await db.purchases.insert_one(purchase_doc)
    
    return purchase

@api_router.get("/my-courses", response_model=List[Course])
async def get_my_courses(current_user: User = Depends(get_current_user)):
    # Get purchased course IDs
    purchases = await db.purchases.find({"user_id": current_user.id, "status": "completed"}).to_list(1000)
    course_ids = [purchase['course_id'] for purchase in purchases]
    
    if not course_ids:
        return []
    
    # Get courses
    courses = await db.courses.find({"id": {"$in": course_ids}, "is_active": True}).to_list(1000)
    return [Course(**course) for course in courses]

@api_router.get("/course/{course_id}", response_model=Course)
async def get_course_detail(course_id: str, current_user: User = Depends(get_current_user)):
    # Check if user purchased the course
    purchase = await db.purchases.find_one({"user_id": current_user.id, "course_id": course_id, "status": "completed"})
    if not purchase:
        raise HTTPException(status_code=403, detail="Course not purchased")
    
    course = await db.courses.find_one({"id": course_id, "is_active": True})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return Course(**course)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Create admin user on startup
@app.on_event("startup")
async def create_admin():
    admin_exists = await db.users.find_one({"email": "admin@mimarim.com"})
    if not admin_exists:
        admin_data = {
            "id": str(uuid.uuid4()),
            "first_name": "Admin",
            "last_name": "User",
            "gender": "other",
            "email": "admin@mimarim.com",
            "phone": "+90 555 123 4567",
            "birth_date": "1990-01-01",
            "country": "Turkey",
            "city": "Istanbul",
            "role": "admin",
            "hashed_password": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
        await db.users.insert_one(admin_data)
        logger.info("Admin user created: admin@mimarim.com / admin123")