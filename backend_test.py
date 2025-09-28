#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for AutoClick System
Tests all API endpoints, automation engine, and database functionality
"""

import requests
import json
import time
import sys
import uuid
from datetime import datetime
from typing import Dict, List, Optional

class AutoClickAPITester:
    def __init__(self, base_url="https://webclicker.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_sites = []  # Track created sites for cleanup
        
    def log_test(self, name: str, success: bool, details: str = "", response_data: dict = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test_name": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_base}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test health check endpoint"""
        success, data, status = self.make_request('GET', '/health')
        if success and status == 200:
            self.log_test("Health Check", True, f"Status: {status}, Engine running: {data.get('engine_running', 'unknown')}")
        else:
            self.log_test("Health Check", False, f"Status: {status}, Error: {data}")
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data, status = self.make_request('GET', '/')
        if success and status == 200:
            self.log_test("Root Endpoint", True, f"Status: {status}, Message: {data.get('message', 'N/A')}")
        else:
            self.log_test("Root Endpoint", False, f"Status: {status}, Error: {data}")
        return success

    def test_system_status(self):
        """Test system status endpoint"""
        success, data, status = self.make_request('GET', '/status')
        if success and status == 200:
            details = f"Running: {data.get('is_running')}, Paused: {data.get('is_paused')}, Sites: {data.get('total_sites_count')}"
            self.log_test("System Status", True, details)
        else:
            self.log_test("System Status", False, f"Status: {status}, Error: {data}")
        return success, data

    def test_get_sites(self):
        """Test getting all sites"""
        success, data, status = self.make_request('GET', '/sites')
        if success and status == 200:
            sites_count = len(data) if isinstance(data, list) else 0
            self.log_test("Get Sites", True, f"Retrieved {sites_count} sites")
            return True, data
        else:
            self.log_test("Get Sites", False, f"Status: {status}, Error: {data}")
            return False, []

    def test_create_site(self, name: str = None, url: str = None):
        """Test creating a new site"""
        if not name:
            name = f"Test Site {uuid.uuid4().hex[:8]}"
        if not url:
            url = "https://example.com"
            
        site_data = {
            "name": name,
            "url": url,
            "duration": 5,
            "interval": 10
        }
        
        success, data, status = self.make_request('POST', '/sites', site_data)
        if success and status == 200:
            site_id = data.get('id')
            if site_id:
                self.created_sites.append(site_id)
            self.log_test("Create Site", True, f"Created site: {name} (ID: {site_id})")
            return True, data
        else:
            self.log_test("Create Site", False, f"Status: {status}, Error: {data}")
            return False, {}

    def test_get_site(self, site_id: str):
        """Test getting a specific site"""
        success, data, status = self.make_request('GET', f'/sites/{site_id}')
        if success and status == 200:
            self.log_test("Get Site by ID", True, f"Retrieved site: {data.get('name')}")
            return True, data
        else:
            self.log_test("Get Site by ID", False, f"Status: {status}, Error: {data}")
            return False, {}

    def test_update_site(self, site_id: str):
        """Test updating a site"""
        update_data = {
            "name": f"Updated Site {uuid.uuid4().hex[:8]}",
            "duration": 8
        }
        
        success, data, status = self.make_request('PUT', f'/sites/{site_id}', update_data)
        if success and status == 200:
            self.log_test("Update Site", True, f"Updated site: {data.get('name')}")
            return True, data
        else:
            self.log_test("Update Site", False, f"Status: {status}, Error: {data}")
            return False, {}

    def test_toggle_site(self, site_id: str):
        """Test toggling site active status"""
        success, data, status = self.make_request('POST', f'/sites/{site_id}/toggle')
        if success and status == 200:
            is_active = data.get('is_active', False)
            self.log_test("Toggle Site", True, f"Site toggled, active: {is_active}")
            return True, data
        else:
            self.log_test("Toggle Site", False, f"Status: {status}, Error: {data}")
            return False, {}

    def test_delete_site(self, site_id: str):
        """Test deleting a site"""
        success, data, status = self.make_request('DELETE', f'/sites/{site_id}')
        if success and status == 200:
            self.log_test("Delete Site", True, f"Site deleted successfully")
            if site_id in self.created_sites:
                self.created_sites.remove(site_id)
            return True
        else:
            self.log_test("Delete Site", False, f"Status: {status}, Error: {data}")
            return False

    def test_automation_control(self):
        """Test automation control endpoints"""
        # Test start
        success, data, status = self.make_request('POST', '/control/start')
        start_success = success and status == 200
        self.log_test("Start Automation", start_success, f"Status: {status}, Response: {data.get('message', 'N/A')}")
        
        if start_success:
            time.sleep(2)  # Wait a bit for system to start
            
            # Test pause
            success, data, status = self.make_request('POST', '/control/pause')
            pause_success = success and status == 200
            self.log_test("Pause Automation", pause_success, f"Status: {status}, Response: {data.get('message', 'N/A')}")
            
            time.sleep(1)
            
            # Test resume (pause again)
            success, data, status = self.make_request('POST', '/control/pause')
            resume_success = success and status == 200
            self.log_test("Resume Automation", resume_success, f"Status: {status}, Response: {data.get('message', 'N/A')}")
            
            time.sleep(1)
            
            # Test stop
            success, data, status = self.make_request('POST', '/control/stop')
            stop_success = success and status == 200
            self.log_test("Stop Automation", stop_success, f"Status: {status}, Response: {data.get('message', 'N/A')}")
            
            return start_success and pause_success and resume_success and stop_success
        
        return False

    def test_logs_functionality(self):
        """Test logs endpoints"""
        # Get logs
        success, data, status = self.make_request('GET', '/logs')
        get_logs_success = success and status == 200
        logs_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Logs", get_logs_success, f"Retrieved {logs_count} log entries")
        
        # Test log filtering
        success, data, status = self.make_request('GET', '/logs', params={'level': 'info', 'limit': 10})
        filter_success = success and status == 200
        filtered_count = len(data) if isinstance(data, list) else 0
        self.log_test("Filter Logs", filter_success, f"Retrieved {filtered_count} filtered log entries")
        
        # Test log export (JSON)
        success, data, status = self.make_request('GET', '/logs/export', params={'format': 'json'})
        export_json_success = success and status == 200
        self.log_test("Export Logs JSON", export_json_success, f"Export status: {status}")
        
        # Test log export (CSV)
        success, data, status = self.make_request('GET', '/logs/export', params={'format': 'csv'})
        export_csv_success = success and status == 200
        self.log_test("Export Logs CSV", export_csv_success, f"Export status: {status}")
        
        # Test log export (TXT)
        success, data, status = self.make_request('GET', '/logs/export', params={'format': 'txt'})
        export_txt_success = success and status == 200
        self.log_test("Export Logs TXT", export_txt_success, f"Export status: {status}")
        
        return get_logs_success and filter_success and export_json_success and export_csv_success and export_txt_success

    def test_settings_functionality(self):
        """Test settings endpoints"""
        # Get settings
        success, data, status = self.make_request('GET', '/settings')
        get_success = success and status == 200
        settings_count = len(data) if isinstance(data, dict) else 0
        self.log_test("Get Settings", get_success, f"Retrieved {settings_count} settings")
        
        # Update a setting
        success, data, status = self.make_request('PUT', '/settings/global_interval', {'value': '15'})
        update_success = success and status == 200
        self.log_test("Update Setting", update_success, f"Status: {status}, Response: {data}")
        
        # Restore original setting
        success, data, status = self.make_request('PUT', '/settings/global_interval', {'value': '10'})
        restore_success = success and status == 200
        self.log_test("Restore Setting", restore_success, f"Status: {status}")
        
        return get_success and update_success and restore_success

    def test_bulk_operations(self):
        """Test bulk import/export operations"""
        # Test sites export
        success, data, status = self.make_request('GET', '/sites/export')
        export_success = success and status == 200
        self.log_test("Export Sites", export_success, f"Export status: {status}")
        
        # Test bulk import
        bulk_sites = {
            "sites": [
                {
                    "name": "Bulk Test Site 1",
                    "url": "https://google.com",
                    "duration": 3,
                    "interval": 8
                },
                {
                    "name": "Bulk Test Site 2", 
                    "url": "https://github.com",
                    "duration": 4,
                    "interval": 12
                }
            ],
            "replace_existing": False
        }
        
        success, data, status = self.make_request('POST', '/sites/import', bulk_sites)
        import_success = success and status == 200
        created_count = data.get('created_count', 0) if success else 0
        self.log_test("Bulk Import Sites", import_success, f"Created {created_count} sites, Status: {status}")
        
        return export_success and import_success

    def test_error_handling(self):
        """Test error handling scenarios"""
        # Test getting non-existent site
        fake_id = str(uuid.uuid4())
        success, data, status = self.make_request('GET', f'/sites/{fake_id}')
        not_found_success = not success and status == 404
        self.log_test("Get Non-existent Site", not_found_success, f"Correctly returned 404")
        
        # Test creating site with invalid data
        invalid_site = {
            "name": "",  # Empty name
            "url": "invalid-url",  # Invalid URL
            "duration": -1  # Invalid duration
        }
        success, data, status = self.make_request('POST', '/sites', invalid_site)
        validation_success = not success or status >= 400
        self.log_test("Create Invalid Site", validation_success, f"Correctly handled invalid data, Status: {status}")
        
        # Test updating non-existent site
        success, data, status = self.make_request('PUT', f'/sites/{fake_id}', {"name": "Updated"})
        update_not_found_success = not success and status == 404
        self.log_test("Update Non-existent Site", update_not_found_success, f"Correctly returned 404")
        
        return not_found_success and validation_success and update_not_found_success

    def cleanup_test_data(self):
        """Clean up any test data created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_sites)} test sites...")
        for site_id in self.created_sites.copy():
            success = self.test_delete_site(site_id)
            if success:
                print(f"   Deleted site: {site_id}")
            else:
                print(f"   Failed to delete site: {site_id}")

    def run_comprehensive_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive AutoClick Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 CONNECTIVITY TESTS")
        self.test_health_check()
        self.test_root_endpoint()
        
        # System status tests
        print("\n📊 SYSTEM STATUS TESTS")
        status_success, status_data = self.test_system_status()
        
        # Site management tests
        print("\n🌐 SITE MANAGEMENT TESTS")
        sites_success, existing_sites = self.test_get_sites()
        
        # Create test site for further testing
        create_success, test_site = self.test_create_site("API Test Site", "https://httpbin.org/delay/1")
        test_site_id = test_site.get('id') if create_success else None
        
        if test_site_id:
            self.test_get_site(test_site_id)
            self.test_update_site(test_site_id)
            self.test_toggle_site(test_site_id)
            # Don't delete yet, we'll use it for automation tests
        
        # Automation control tests
        print("\n🤖 AUTOMATION CONTROL TESTS")
        if test_site_id:
            # First activate the test site
            self.test_toggle_site(test_site_id)  # Make sure it's active
            time.sleep(1)
            automation_success = self.test_automation_control()
        else:
            print("⚠️  Skipping automation tests - no test site available")
            automation_success = False
        
        # Logs functionality tests
        print("\n📝 LOGS FUNCTIONALITY TESTS")
        logs_success = self.test_logs_functionality()
        
        # Settings tests
        print("\n⚙️  SETTINGS TESTS")
        settings_success = self.test_settings_functionality()
        
        # Bulk operations tests
        print("\n📦 BULK OPERATIONS TESTS")
        bulk_success = self.test_bulk_operations()
        
        # Error handling tests
        print("\n🚨 ERROR HANDLING TESTS")
        error_success = self.test_error_handling()
        
        # Cleanup
        print("\n🧹 CLEANUP")
        self.cleanup_test_data()
        
        # Final results
        print("\n" + "=" * 60)
        print("📋 FINAL TEST RESULTS")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Detailed results
        print(f"\n📊 CATEGORY RESULTS:")
        categories = {
            "Connectivity": ["Health Check", "Root Endpoint"],
            "System Status": ["System Status"],
            "Site Management": ["Get Sites", "Create Site", "Get Site by ID", "Update Site", "Toggle Site", "Delete Site"],
            "Automation Control": ["Start Automation", "Pause Automation", "Resume Automation", "Stop Automation"],
            "Logs": ["Get Logs", "Filter Logs", "Export Logs JSON", "Export Logs CSV", "Export Logs TXT"],
            "Settings": ["Get Settings", "Update Setting", "Restore Setting"],
            "Bulk Operations": ["Export Sites", "Bulk Import Sites"],
            "Error Handling": ["Get Non-existent Site", "Create Invalid Site", "Update Non-existent Site"]
        }
        
        for category, test_names in categories.items():
            category_results = [r for r in self.test_results if r["test_name"] in test_names]
            if category_results:
                passed = len([r for r in category_results if r["status"] == "PASS"])
                total = len(category_results)
                print(f"   {category}: {passed}/{total} ({passed/total*100:.0f}%)")
        
        # Critical issues
        failed_tests = [r for r in self.test_results if r["status"] == "FAIL"]
        if failed_tests:
            print(f"\n🚨 FAILED TESTS:")
            for test in failed_tests:
                print(f"   ❌ {test['test_name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = AutoClickAPITester()
    
    try:
        success = tester.run_comprehensive_tests()
        
        # Save detailed results
        results_file = "/app/test_reports/backend_test_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "failed_tests": tester.tests_run - tester.tests_passed,
                "success_rate": tester.tests_passed/tester.tests_run*100 if tester.tests_run > 0 else 0,
                "test_results": tester.test_results
            }, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: {results_file}")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"\n💥 Critical error during testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())