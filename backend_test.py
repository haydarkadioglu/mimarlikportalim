#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Mimar Portal
Tests all authentication, course management, and purchase endpoints
"""

import requests
import sys
import json
from datetime import datetime
import uuid

class MimarPortalAPITester:
    def __init__(self, base_url="https://mimarim-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.user_token = None
        self.admin_token = None
        self.test_user_id = None
        self.test_course_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Generate unique test data
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_data = {
            "first_name": "Test",
            "last_name": "User",
            "gender": "male",
            "email": f"testuser_{timestamp}@test.com",
            "password": "TestPass123!",
            "phone": "+90 555 123 4567",
            "birth_date": "1990-01-01",
            "country": "Turkey",
            "city": "Istanbul"
        }
        
        self.test_course_data = {
            "title": f"Test Course {timestamp}",
            "description": "This is a test course for architecture education",
            "price": 299.99,
            "currency": "TRY",
            "thumbnail_url": "https://example.com/thumbnail.jpg",
            "videos": [
                {
                    "title": "Introduction Video",
                    "vimeo_url": "https://player.vimeo.com/video/123456789",
                    "description": "Course introduction"
                },
                {
                    "title": "Advanced Concepts",
                    "vimeo_url": "https://player.vimeo.com/video/987654321",
                    "description": "Advanced architecture concepts"
                }
            ]
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "register",
            200,
            data=self.test_user_data
        )
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   User ID: {self.test_user_id}")
        return success

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        success, response = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            data=login_data
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"   Token received: {self.user_token[:20]}...")
        return success

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@mimarim.com",
            "password": "admin123"
        }
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "login",
            200,
            data=admin_data
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token received: {self.admin_token[:20]}...")
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.user_token:
            print("❌ SKIPPED - No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "me",
            200,
            headers=headers
        )
        return success

    def test_get_courses_public(self):
        """Test getting public courses list"""
        success, response = self.run_test(
            "Get Public Courses",
            "GET",
            "courses",
            200
        )
        if success:
            print(f"   Found {len(response)} courses")
        return success

    def test_create_course_admin(self):
        """Test creating a course as admin"""
        if not self.admin_token:
            print("❌ SKIPPED - No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Create Course (Admin)",
            "POST",
            "admin/courses",
            200,
            data=self.test_course_data,
            headers=headers
        )
        if success and 'id' in response:
            self.test_course_id = response['id']
            print(f"   Course ID: {self.test_course_id}")
        return success

    def test_get_admin_courses(self):
        """Test getting all courses as admin"""
        if not self.admin_token:
            print("❌ SKIPPED - No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Get Admin Courses",
            "GET",
            "admin/courses",
            200,
            headers=headers
        )
        if success:
            print(f"   Found {len(response)} courses in admin panel")
        return success

    def test_update_course_admin(self):
        """Test updating a course as admin"""
        if not self.admin_token or not self.test_course_id:
            print("❌ SKIPPED - No admin token or course ID available")
            return False
            
        updated_data = self.test_course_data.copy()
        updated_data['title'] = f"Updated {updated_data['title']}"
        updated_data['price'] = 399.99
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Update Course (Admin)",
            "PUT",
            f"admin/courses/{self.test_course_id}",
            200,
            data=updated_data,
            headers=headers
        )
        return success

    def test_purchase_course(self):
        """Test purchasing a course"""
        if not self.user_token or not self.test_course_id:
            print("❌ SKIPPED - No user token or course ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Purchase Course",
            "POST",
            f"purchase/{self.test_course_id}",
            200,
            headers=headers
        )
        return success

    def test_get_my_courses(self):
        """Test getting user's purchased courses"""
        if not self.user_token:
            print("❌ SKIPPED - No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get My Courses",
            "GET",
            "my-courses",
            200,
            headers=headers
        )
        if success:
            print(f"   User has {len(response)} purchased courses")
        return success

    def test_get_course_detail(self):
        """Test getting course detail (after purchase)"""
        if not self.user_token or not self.test_course_id:
            print("❌ SKIPPED - No user token or course ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Course Detail",
            "GET",
            f"course/{self.test_course_id}",
            200,
            headers=headers
        )
        if success and 'videos' in response:
            print(f"   Course has {len(response['videos'])} videos")
        return success

    def test_delete_course_admin(self):
        """Test deleting a course as admin"""
        if not self.admin_token or not self.test_course_id:
            print("❌ SKIPPED - No admin token or course ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Delete Course (Admin)",
            "DELETE",
            f"admin/courses/{self.test_course_id}",
            200,
            headers=headers
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print(f"\n🔒 Testing Unauthorized Access...")
        
        # Test admin endpoint without token
        success, _ = self.run_test(
            "Admin Courses (No Token)",
            "GET",
            "admin/courses",
            401
        )
        
        # Test user endpoint without token
        success2, _ = self.run_test(
            "My Courses (No Token)",
            "GET",
            "my-courses",
            401
        )
        
        return success and success2

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Mimar Portal API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)

        # Test sequence
        test_results = []
        
        # Authentication tests
        test_results.append(("User Registration", self.test_user_registration()))
        test_results.append(("User Login", self.test_user_login()))
        test_results.append(("Admin Login", self.test_admin_login()))
        test_results.append(("Get Current User", self.test_get_current_user()))
        
        # Course management tests
        test_results.append(("Get Public Courses", self.test_get_courses_public()))
        test_results.append(("Create Course (Admin)", self.test_create_course_admin()))
        test_results.append(("Get Admin Courses", self.test_get_admin_courses()))
        test_results.append(("Update Course (Admin)", self.test_update_course_admin()))
        
        # Purchase and user course tests
        test_results.append(("Purchase Course", self.test_purchase_course()))
        test_results.append(("Get My Courses", self.test_get_my_courses()))
        test_results.append(("Get Course Detail", self.test_get_course_detail()))
        
        # Security tests
        test_results.append(("Unauthorized Access", self.test_unauthorized_access()))
        
        # Cleanup
        test_results.append(("Delete Course (Admin)", self.test_delete_course_admin()))

        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        failed_tests = []
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} - {test_name}")
            if not result:
                failed_tests.append(test_name)
        
        print(f"\n📈 Overall: {self.tests_passed}/{self.tests_run} tests passed")
        
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test}")
            return 1
        else:
            print(f"\n🎉 All tests passed successfully!")
            return 0

def main():
    """Main test runner"""
    tester = MimarPortalAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())