from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt

# Import our database models
from database import get_db, init_db, User, Course, Purchase, async_session_maker

# Load environment variables
load_dotenv()

app = FastAPI(title="Mimarlik Portal API", version="1.0.0")

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")

# Pydantic models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    surname: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    birth_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    country: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    surname: str
    email: str
    phone: str
    birth_date: str
    country: str
    city: str
    role: str
    created_at: datetime
    is_active: bool

class CourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    instructor: str = Field(..., min_length=1, max_length=255)
    price: int = Field(default=0, ge=0)
    category: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., min_length=1, max_length=50)
    duration: str = Field(..., min_length=1, max_length=50)
    image_url: Optional[str] = None

class CourseResponse(BaseModel):
    id: str
    title: str
    description: str
    instructor: str
    price: int
    category: str
    difficulty: str
    duration: str
    image_url: Optional[str]
    created_at: datetime
    is_active: bool

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow().timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    payload = verify_jwt_token(credentials.credentials)
    user_id = payload.get("user_id")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_db()
    # Create admin user if not exists
    await create_admin_user()

async def create_admin_user():
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == "admin@mimarim.com"))
        admin_exists = result.scalar_one_or_none()
        
        if not admin_exists:
            admin_data = User(
                id=str(uuid.uuid4()),
                name="Admin",
                surname="User",
                email="admin@mimarim.com",
                phone="+90 555 123 4567",
                birth_date="1990-01-01",
                country="Turkey",
                city="Istanbul",
                role="admin",
                hashed_password=hash_password("admin123"),
                created_at=datetime.now(timezone.utc),
                is_active=True
            )
            db.add(admin_data)
            await db.commit()
            logger.info("Admin user created: admin@mimarim.com / admin123")

# Routes
@app.get("/")
async def root():
    return {"message": "Mimarlik Portal API is running!", "status": "success"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Auth routes
@api_router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        surname=user_data.surname,
        email=user_data.email,
        phone=user_data.phone,
        birth_date=user_data.birth_date,
        country=user_data.country,
        city=user_data.city,
        role="user",
        hashed_password=hash_password(user_data.password),
        created_at=datetime.now(timezone.utc),
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        surname=new_user.surname,
        email=new_user.email,
        phone=new_user.phone,
        birth_date=new_user.birth_date,
        country=new_user.country,
        city=new_user.city,
        role=new_user.role,
        created_at=new_user.created_at,
        is_active=new_user.is_active
    )

@api_router.post("/login")
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    token = create_jwt_token(user.id, user.email, user.role)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            name=user.name,
            surname=user.surname,
            email=user.email,
            phone=user.phone,
            birth_date=user.birth_date,
            country=user.country,
            city=user.city,
            role=user.role,
            created_at=user.created_at,
            is_active=user.is_active
        )
    }

@api_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        surname=current_user.surname,
        email=current_user.email,
        phone=current_user.phone,
        birth_date=current_user.birth_date,
        country=current_user.country,
        city=current_user.city,
        role=current_user.role,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )

# Course routes
@api_router.get("/courses", response_model=List[CourseResponse])
async def get_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.is_active == True))
    courses = result.scalars().all()
    
    return [CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        instructor=course.instructor,
        price=course.price,
        category=course.category,
        difficulty=course.difficulty,
        duration=course.duration,
        image_url=course.image_url,
        created_at=course.created_at,
        is_active=course.is_active
    ) for course in courses]

@api_router.get("/course/{course_id}", response_model=CourseResponse)
async def get_course_detail(course_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.id == course_id, Course.is_active == True))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        instructor=course.instructor,
        price=course.price,
        category=course.category,
        difficulty=course.difficulty,
        duration=course.duration,
        image_url=course.image_url,
        created_at=course.created_at,
        is_active=course.is_active
    )

@api_router.post("/purchase/{course_id}")
async def purchase_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if course exists
    result = await db.execute(select(Course).where(Course.id == course_id, Course.is_active == True))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already purchased
    result = await db.execute(select(Purchase).where(Purchase.user_id == current_user.id, Purchase.course_id == course_id))
    existing_purchase = result.scalar_one_or_none()
    
    if existing_purchase:
        raise HTTPException(status_code=400, detail="Course already purchased")
    
    # Create purchase record
    new_purchase = Purchase(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        course_id=course_id,
        purchase_date=datetime.now(timezone.utc),
        amount=course.price
    )
    
    db.add(new_purchase)
    await db.commit()
    
    return {"message": "Course purchased successfully", "purchase_id": new_purchase.id}

@api_router.get("/my-courses", response_model=List[CourseResponse])
async def get_my_courses(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get purchased courses
    result = await db.execute(
        select(Course).join(Purchase, Course.id == Purchase.course_id)
        .where(Purchase.user_id == current_user.id, Course.is_active == True)
    )
    courses = result.scalars().all()
    
    return [CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        instructor=course.instructor,
        price=course.price,
        category=course.category,
        difficulty=course.difficulty,
        duration=course.duration,
        image_url=course.image_url,
        created_at=course.created_at,
        is_active=course.is_active
    ) for course in courses]

# Admin routes
@api_router.get("/admin/courses", response_model=List[CourseResponse])
async def get_admin_courses(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this endpoint")
    
    result = await db.execute(select(Course))
    courses = result.scalars().all()
    
    return [CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        instructor=course.instructor,
        price=course.price,
        category=course.category,
        difficulty=course.difficulty,
        duration=course.duration,
        image_url=course.image_url,
        created_at=course.created_at,
        is_active=course.is_active
    ) for course in courses]

@api_router.post("/admin/courses", response_model=CourseResponse)
async def create_admin_course(
    course_data: CourseCreate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create courses")
    
    new_course = Course(
        id=str(uuid.uuid4()),
        title=course_data.title,
        description=course_data.description,
        instructor=course_data.instructor,
        price=course_data.price,
        category=course_data.category,
        difficulty=course_data.difficulty,
        duration=course_data.duration,
        image_url=course_data.image_url,
        created_at=datetime.now(timezone.utc),
        is_active=True
    )
    
    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)
    
    return CourseResponse(
        id=new_course.id,
        title=new_course.title,
        description=new_course.description,
        instructor=new_course.instructor,
        price=new_course.price,
        category=new_course.category,
        difficulty=new_course.difficulty,
        duration=new_course.duration,
        image_url=new_course.image_url,
        created_at=new_course.created_at,
        is_active=new_course.is_active
    )

@api_router.put("/admin/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update courses")
    
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Update course fields
    course.title = course_data.title
    course.description = course_data.description
    course.instructor = course_data.instructor
    course.price = course_data.price
    course.category = course_data.category
    course.difficulty = course_data.difficulty
    course.duration = course_data.duration
    course.image_url = course_data.image_url
    
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        instructor=course.instructor,
        price=course.price,
        category=course.category,
        difficulty=course.difficulty,
        duration=course.duration,
        image_url=course.image_url,
        created_at=course.created_at,
        is_active=course.is_active
    )

@api_router.delete("/admin/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete courses")
    
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Soft delete
    course.is_active = False
    await db.commit()
    
    return {"message": "Course deleted successfully"}

# Include API router in app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
