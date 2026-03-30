import requests
import sys
from datetime import datetime
import json

class NurseReadyAPITester:
    def __init__(self, base_url="https://clinical-study-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_categories(self):
        """Test categories endpoint"""
        success, response = self.run_test("Categories", "GET", "categories", 200)
        if success and response:
            categories = response.get('categories', [])
            if len(categories) >= 16:
                print(f"   Found {len(categories)} categories")
                return True
            else:
                print(f"   Expected 16+ categories, got {len(categories)}")
                return False
        return success

    def test_lab_values(self):
        """Test lab values endpoint"""
        success, response = self.run_test("Lab Values", "GET", "lab-values", 200)
        if success and response:
            lab_values = response.get('lab_values', [])
            if len(lab_values) >= 14:
                print(f"   Found {len(lab_values)} lab values")
                return True
            else:
                print(f"   Expected 14+ lab values, got {len(lab_values)}")
                return False
        return success

    def test_emergencies(self):
        """Test emergencies endpoint"""
        success, response = self.run_test("Emergencies", "GET", "emergencies", 200)
        if success and response:
            emergencies = response.get('emergencies', [])
            if len(emergencies) >= 5:
                print(f"   Found {len(emergencies)} emergency cards")
                return True
            else:
                print(f"   Expected 5+ emergency cards, got {len(emergencies)}")
                return False
        return success

    def test_calculators(self):
        """Test calculators endpoint"""
        success, response = self.run_test("Calculators", "GET", "calculators", 200)
        if success and response:
            calculators = response.get('calculators', [])
            if len(calculators) >= 8:
                print(f"   Found {len(calculators)} calculators")
                return True
            else:
                print(f"   Expected 8+ calculators, got {len(calculators)}")
                return False
        return success

    def test_abbreviations(self):
        """Test abbreviations endpoint"""
        success, response = self.run_test("Abbreviations", "GET", "abbreviations", 200)
        if success and response:
            abbreviations = response.get('abbreviations', [])
            print(f"   Found {len(abbreviations)} abbreviations")
            return True
        return success

    def test_terminology(self):
        """Test terminology endpoint"""
        success, response = self.run_test("Terminology", "GET", "terminology", 200)
        if success and response:
            terms = response.get('terms', [])
            print(f"   Found {len(terms)} medical terms")
            return True
        return success

    def test_bmi_calculator(self):
        """Test BMI calculator"""
        test_data = {
            "calculator_type": "bmi",
            "inputs": {
                "weight": 70,
                "height": 170
            }
        }
        success, response = self.run_test("BMI Calculator", "POST", "calculators/calculate", 200, test_data)
        if success and response:
            result = response.get('result')
            if result and isinstance(result, (int, float)):
                print(f"   BMI calculated: {result}")
                return True
        return success

    def test_drug_search(self):
        """Test drug search with OpenFDA"""
        success, response = self.run_test("Drug Search", "GET", "drugs/search", 200, params={"query": "aspirin"})
        if success and response:
            results = response.get('results', [])
            print(f"   Found {len(results)} drug results")
            return True
        return success

    def test_global_search(self):
        """Test global search"""
        success, response = self.run_test("Global Search", "GET", "search", 200, params={"q": "sodium"})
        if success and response:
            print("   Global search working")
            return True
        return success

    def test_nursing_tip(self):
        """Test nursing tip endpoint"""
        return self.run_test("Nursing Tip", "GET", "nursing-tip", 200)

    def test_ai_chat(self):
        """Test AI chat endpoint"""
        test_data = {
            "message": "What is normal blood pressure?",
            "session_id": "test-session-123"
        }
        success, response = self.run_test("AI Chat", "POST", "chat", 200, test_data)
        if success and response:
            ai_response = response.get('response')
            if ai_response and len(ai_response) > 10:
                print(f"   AI responded with {len(ai_response)} characters")
                return True
        return success

def main():
    print("🏥 NurseReady API Testing Suite")
    print("=" * 50)
    
    tester = NurseReadyAPITester()
    
    # Core API tests
    tests = [
        tester.test_root_endpoint,
        tester.test_categories,
        tester.test_lab_values,
        tester.test_emergencies,
        tester.test_calculators,
        tester.test_abbreviations,
        tester.test_terminology,
        tester.test_bmi_calculator,
        tester.test_drug_search,
        tester.test_global_search,
        tester.test_nursing_tip,
        tester.test_ai_chat,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            tester.failed_tests.append({
                "test": test.__name__,
                "error": f"Test crashed: {e}"
            })
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Status {failure.get('actual')} != {failure.get('expected')}")
            print(f"   - {failure['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())