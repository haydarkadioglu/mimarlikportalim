#!/usr/bin/env python3
"""
Test Free Course Functionality for Mimar Portal
Tests the new free course features (price = 0)
"""

import requests
import sys
import json
from datetime import datetime

class FreeCourseAPITester:
    def __init__(self, base_url="https://mimarim-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.free_course_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Generate unique test data
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_data = {
            "first_name": "Free",
            "last_name": "User",
            "gender": "female",
            "email": f"freeuser_{timestamp}@test.com",
            "password": "FreePass123!",
            "phone": "+90 555 987 6543",
            "birth_date": "1995-05-15",
            "country": "Turkey",
            "city": "Ankara"
        }
        
        self.free_course_data = {
            "title": f"Free Architecture Course {timestamp}",
            "description": "This is a completely free course for architecture students",
            "price": 0,  # FREE COURSE
            "currency": "TRY",
            "thumbnail_url": "https://example.com/free-course.jpg",
            "videos": [
                {
                    "title": "Free Introduction",
                    "vimeo_url": "https://player.vimeo.com/video/111111111",
                    "description": "Free introduction to architecture"
                },
                {
                    "title": "Basic Concepts - Free",
                    "vimeo_url": "https://player.vimeo.com/video/222222222",
                    "description": "Basic architecture concepts - completely free"
                }
            ]
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
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

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Login as admin"""
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
        return success

    def test_user_registration_and_login(self):
        """Register and login test user"""
        # Register
        success1, _ = self.run_test(
            "Free User Registration",
            "POST",
            "register",
            200,
            data=self.test_user_data
        )
        
        if not success1:
            return False
            
        # Login
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        success2, response = self.run_test(
            "Free User Login",
            "POST",
            "login",
            200,
            data=login_data
        )
        if success2 and 'access_token' in response:
            self.user_token = response['access_token']
        
        return success1 and success2

    def test_create_free_course(self):
        """Create a free course (price = 0)"""
        if not self.admin_token:
            print("❌ SKIPPED - No admin token")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Create Free Course (Price = 0)",
            "POST",
            "admin/courses",
            200,
            data=self.free_course_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.free_course_id = response['id']
            print(f"   Free Course ID: {self.free_course_id}")
            print(f"   Course Price: {response.get('price', 'N/A')}")
            
            # Verify it's actually free
            if response.get('price') == 0:
                print(f"   ✅ Confirmed: Course is FREE (price = 0)")
            else:
                print(f"   ❌ Warning: Course price is not 0: {response.get('price')}")
        
        return success

    def test_purchase_free_course(self):
        """Test purchasing a free course (should be auto-approved)"""
        if not self.user_token or not self.free_course_id:
            print("❌ SKIPPED - No user token or free course ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Purchase Free Course (Auto-approve)",
            "POST",
            f"purchase/{self.free_course_id}",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Purchase Amount: {response.get('amount', 'N/A')}")
            print(f"   Purchase Status: {response.get('status', 'N/A')}")
            
            # Verify free course purchase
            if response.get('amount') == 0:
                print(f"   ✅ Confirmed: Free course purchase (amount = 0)")
            if response.get('status') == 'completed':
                print(f"   ✅ Confirmed: Auto-approved (status = completed)")
        
        return success

    def test_access_free_course(self):
        """Test accessing the free course after purchase"""
        if not self.user_token or not self.free_course_id:
            print("❌ SKIPPED - No user token or free course ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Access Free Course Content",
            "GET",
            f"course/{self.free_course_id}",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Course Title: {response.get('title', 'N/A')}")
            print(f"   Video Count: {len(response.get('videos', []))}")
            print(f"   Course Price: {response.get('price', 'N/A')}")
        
        return success

    def test_free_course_in_my_courses(self):
        """Test that free course appears in user's courses"""
        if not self.user_token:
            print("❌ SKIPPED - No user token")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Free Course in My Courses",
            "GET",
            "my-courses",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Total Courses: {len(response)}")
            free_courses = [c for c in response if c.get('price') == 0]
            print(f"   Free Courses: {len(free_courses)}")
            
            if self.free_course_id:
                found_course = next((c for c in response if c.get('id') == self.free_course_id), None)
                if found_course:
                    print(f"   ✅ Found our test free course in user's courses")
                else:
                    print(f"   ❌ Test free course not found in user's courses")
        
        return success

    def cleanup_free_course(self):
        """Delete the test free course"""
        if not self.admin_token or not self.free_course_id:
            print("❌ SKIPPED - No admin token or free course ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Delete Free Course (Cleanup)",
            "DELETE",
            f"admin/courses/{self.free_course_id}",
            200,
            headers=headers
        )
        return success

    def run_all_tests(self):
        """Run all free course tests"""
        print("🆓 Starting Free Course Feature Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)

        test_results = []
        
        # Setup
        test_results.append(("Admin Login", self.test_admin_login()))
        test_results.append(("User Registration & Login", self.test_user_registration_and_login()))
        
        # Free course tests
        test_results.append(("Create Free Course", self.test_create_free_course()))
        test_results.append(("Purchase Free Course", self.test_purchase_free_course()))
        test_results.append(("Access Free Course", self.test_access_free_course()))
        test_results.append(("Free Course in My Courses", self.test_free_course_in_my_courses()))
        
        # Cleanup
        test_results.append(("Cleanup Free Course", self.cleanup_free_course()))

        # Print results
        print("\n" + "=" * 60)
        print("📊 FREE COURSE TEST RESULTS")
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
            print(f"\n🎉 All free course tests passed!")
            return 0

def main():
    """Main test runner"""
    tester = FreeCourseAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())