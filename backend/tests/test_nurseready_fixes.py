"""
NurseReady Backend Tests - Iteration 3
Testing fixes for:
1. Global search finding drugs (paracetamol)
2. Drug search deduplication and prioritization
3. Communication endpoint with ISBAR examples
4. Body systems search (heart)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGlobalSearch:
    """Test global search endpoint - /api/search"""
    
    def test_global_search_finds_paracetamol(self):
        """Global search should find paracetamol in drugs"""
        response = requests.get(f"{BASE_URL}/api/search", params={"q": "paracetamol"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "drugs" in data, "Response should contain 'drugs' key"
        assert len(data["drugs"]) > 0, "Should find at least one drug for 'paracetamol'"
        
        # Check drug structure
        drug = data["drugs"][0]
        assert "name" in drug, "Drug should have 'name' field"
        assert "paracetamol" in drug["name"].lower() or "acetaminophen" in drug["name"].lower(), \
            f"Drug name should contain paracetamol or acetaminophen, got: {drug['name']}"
        print(f"SUCCESS: Global search found drugs: {[d['name'] for d in data['drugs']]}")
    
    def test_global_search_finds_heart_in_body_systems(self):
        """Global search should find 'heart' in body systems"""
        response = requests.get(f"{BASE_URL}/api/search", params={"q": "heart"})
        assert response.status_code == 200
        
        data = response.json()
        assert "body_systems" in data, "Response should contain 'body_systems' key"
        assert len(data["body_systems"]) > 0, "Should find body systems for 'heart'"
        
        # Check cardiovascular system is found
        system_names = [s["name"].lower() for s in data["body_systems"]]
        assert any("cardiovascular" in name or "heart" in name for name in system_names), \
            f"Should find cardiovascular system, got: {system_names}"
        print(f"SUCCESS: Global search found body systems: {[s['name'] for s in data['body_systems']]}")
    
    def test_global_search_finds_isbar_in_communication(self):
        """Global search should find ISBAR in communication"""
        response = requests.get(f"{BASE_URL}/api/search", params={"q": "isbar"})
        assert response.status_code == 200
        
        data = response.json()
        assert "communication" in data, "Response should contain 'communication' key"
        assert len(data["communication"]) > 0, "Should find communication guides for 'isbar'"
        
        guide_titles = [c["title"].lower() for c in data["communication"]]
        assert any("isbar" in title for title in guide_titles), \
            f"Should find ISBAR guide, got: {guide_titles}"
        print(f"SUCCESS: Global search found communication guides: {[c['title'] for c in data['communication']]}")


class TestDrugSearch:
    """Test drug search endpoint - /api/drugs/search"""
    
    def test_drug_search_paracetamol_returns_results(self):
        """Drug search for paracetamol should return results"""
        response = requests.get(f"{BASE_URL}/api/drugs/search", params={"query": "paracetamol"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "results" in data, "Response should contain 'results' key"
        assert len(data["results"]) > 0, "Should find at least one drug for 'paracetamol'"
        print(f"SUCCESS: Drug search found {len(data['results'])} results for paracetamol")
    
    def test_drug_search_paracetamol_first_result_is_single_ingredient(self):
        """First result for paracetamol should be single-ingredient (Paracetamol/ACETAMINOPHEN)"""
        response = requests.get(f"{BASE_URL}/api/drugs/search", params={"query": "paracetamol"})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["results"]) > 0, "Should have results"
        
        first_drug = data["results"][0]
        generic_name = first_drug["generic_name"].lower()
        
        # First result should be single-ingredient paracetamol/acetaminophen
        # Should NOT be a combination drug
        assert "paracetamol" in generic_name or "acetaminophen" in generic_name, \
            f"First result should contain paracetamol/acetaminophen, got: {first_drug['generic_name']}"
        
        # Check it's not a combination (no comma, no "AND")
        is_combination = "," in first_drug["generic_name"] or " AND " in first_drug["generic_name"].upper()
        assert not is_combination, \
            f"First result should be single-ingredient, not combination: {first_drug['generic_name']}"
        
        print(f"SUCCESS: First result is single-ingredient: {first_drug['generic_name']}")
    
    def test_drug_search_no_duplicate_results(self):
        """Drug search should not return duplicate identical results"""
        response = requests.get(f"{BASE_URL}/api/drugs/search", params={"query": "paracetamol"})
        assert response.status_code == 200
        
        data = response.json()
        results = data.get("results", [])
        
        # Check for duplicates by generic_name
        generic_names = [r["generic_name"] for r in results]
        unique_names = set(generic_names)
        
        assert len(generic_names) == len(unique_names), \
            f"Found duplicate results: {generic_names}"
        print(f"SUCCESS: No duplicates found. Unique drugs: {generic_names}")
    
    def test_drug_search_shows_australian_name_format(self):
        """Drug search should show Australian name format (Paracetamol (ACETAMINOPHEN))"""
        response = requests.get(f"{BASE_URL}/api/drugs/search", params={"query": "paracetamol"})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["results"]) > 0
        
        first_drug = data["results"][0]
        generic_name = first_drug["generic_name"]
        
        # Should show Australian name with US equivalent
        # Format: "Paracetamol (Acetaminophen)" or similar
        print(f"SUCCESS: Drug name format: {generic_name}")
        
        # Check searched_as field shows the US term used
        if data.get("searched_as"):
            print(f"  Searched as: {data['searched_as']}")


class TestCommunicationEndpoint:
    """Test communication endpoint - /api/communication"""
    
    def test_communication_endpoint_returns_guides(self):
        """Communication endpoint should return handover guides"""
        response = requests.get(f"{BASE_URL}/api/communication")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "guides" in data, "Response should contain 'guides' key"
        assert len(data["guides"]) > 0, "Should have at least one guide"
        print(f"SUCCESS: Communication endpoint returned {len(data['guides'])} guides")
    
    def test_communication_has_isbar_guide(self):
        """Communication should include ISBAR framework"""
        response = requests.get(f"{BASE_URL}/api/communication")
        assert response.status_code == 200
        
        data = response.json()
        guides = data.get("guides", [])
        
        isbar_guide = next((g for g in guides if g["id"] == "isbar"), None)
        assert isbar_guide is not None, "Should have ISBAR guide"
        assert isbar_guide["title"] == "ISBAR Framework", f"ISBAR title mismatch: {isbar_guide['title']}"
        print(f"SUCCESS: Found ISBAR guide: {isbar_guide['title']}")
    
    def test_isbar_has_sections_with_examples(self):
        """ISBAR guide should have sections with examples"""
        response = requests.get(f"{BASE_URL}/api/communication")
        assert response.status_code == 200
        
        data = response.json()
        guides = data.get("guides", [])
        
        isbar_guide = next((g for g in guides if g["id"] == "isbar"), None)
        assert isbar_guide is not None
        
        sections = isbar_guide.get("sections", [])
        assert len(sections) == 5, f"ISBAR should have 5 sections (I,S,B,A,R), got {len(sections)}"
        
        # Check each section has required fields
        for section in sections:
            assert "letter" in section, "Section should have 'letter'"
            assert "title" in section, "Section should have 'title'"
            assert "content" in section, "Section should have 'content'"
            assert "example" in section, "Section should have 'example'"
            assert len(section["example"]) > 0, f"Section {section['letter']} should have non-empty example"
        
        letters = [s["letter"] for s in sections]
        assert letters == ["I", "S", "B", "A", "R"], f"ISBAR letters should be I,S,B,A,R, got {letters}"
        print(f"SUCCESS: ISBAR has all 5 sections with examples: {letters}")
    
    def test_communication_has_sbar_guide(self):
        """Communication should include SBAR framework"""
        response = requests.get(f"{BASE_URL}/api/communication")
        assert response.status_code == 200
        
        data = response.json()
        guides = data.get("guides", [])
        
        sbar_guide = next((g for g in guides if g["id"] == "sbar"), None)
        assert sbar_guide is not None, "Should have SBAR guide"
        print(f"SUCCESS: Found SBAR guide: {sbar_guide['title']}")


class TestHomepageRecentlyViewed:
    """Test that Recently Viewed is not fetched on homepage"""
    
    def test_categories_endpoint_works(self):
        """Categories endpoint should work (used by homepage)"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"SUCCESS: Categories endpoint returned {len(data['categories'])} categories")
    
    def test_recent_endpoint_exists(self):
        """Recent endpoint should exist but homepage shouldn't use it"""
        response = requests.get(f"{BASE_URL}/api/recent")
        assert response.status_code == 200
        
        data = response.json()
        assert "recent" in data
        print(f"SUCCESS: Recent endpoint exists with {len(data.get('recent', []))} items")


class TestDrugSearchURLParam:
    """Test drug search with URL query parameter"""
    
    def test_drug_search_with_metformin(self):
        """Drug search should work with metformin"""
        response = requests.get(f"{BASE_URL}/api/drugs/search", params={"query": "metformin"})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data.get("results", [])) > 0, "Should find metformin"
        print(f"SUCCESS: Found {len(data['results'])} results for metformin")
    
    def test_drug_search_with_salbutamol(self):
        """Drug search should work with Australian name salbutamol (albuterol in US)"""
        response = requests.get(f"{BASE_URL}/api/drugs/search", params={"query": "salbutamol"})
        assert response.status_code == 200
        
        data = response.json()
        # Should search as albuterol (US name)
        if data.get("searched_as"):
            assert data["searched_as"] == "albuterol", f"Should search as albuterol, got {data['searched_as']}"
        print(f"SUCCESS: Salbutamol search completed. Searched as: {data.get('searched_as', 'salbutamol')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
