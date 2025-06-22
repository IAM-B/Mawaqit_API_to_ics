"""
Unit tests for planner_view module
Focus on improving coverage for normalize functions and error handling
"""

import pytest
from datetime import datetime
from app.views.planner_view import normalize_month_data, normalize_year_data, get_mosque_info_from_json
from pathlib import Path
import json
import tempfile


class TestNormalizeMonthData:
    """Test the normalize_month_data function with various input formats"""
    
    def test_normalize_month_data_valid_list(self):
        """Test with valid list format"""
        prayer_times = {
            "1": ["05:30", "07:00", "12:30", "15:30", "18:30", "20:30"],
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        assert len(result) == 2
        assert result[0]["fajr"] == "05:30"
        assert result[0]["dohr"] == "12:30"
        assert result[0]["asr"] == "15:30"
        assert result[0]["maghreb"] == "18:30"
        assert result[0]["icha"] == "20:30"
        assert result[0]["sunset"] == "07:00"
        
        assert result[1]["fajr"] == "05:31"
        assert result[1]["dohr"] == "12:31"
    
    def test_normalize_month_data_invalid_list_length(self):
        """Test with invalid list length"""
        prayer_times = {
            "1": ["05:30", "07:00", "12:30"],  # Only 3 times instead of 6
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        # Should skip invalid day and only process valid one
        assert len(result) == 1
        assert result[0]["fajr"] == "05:31"
    
    def test_normalize_month_data_invalid_time_format(self):
        """Test with invalid time format"""
        prayer_times = {
            "1": ["25:30", "07:00", "12:30", "15:30", "18:30", "20:30"],  # Invalid hour
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        # Should skip invalid day and only process valid one
        assert len(result) == 1
        assert result[0]["fajr"] == "05:31"
    
    def test_normalize_month_data_string_format(self):
        """Test with string format (should be skipped)"""
        prayer_times = {
            "1": "invalid_string",
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        # Should skip string format and only process valid one
        assert len(result) == 1
        assert result[0]["fajr"] == "05:31"
    
    def test_normalize_month_data_dict_format(self):
        """Test with dict format (should be skipped)"""
        prayer_times = {
            "1": {"fajr": "05:30", "dohr": "12:30"},
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        # Should skip dict format and only process valid one
        assert len(result) == 1
        assert result[0]["fajr"] == "05:31"
    
    def test_normalize_month_data_invalid_day_number(self):
        """Test with invalid day number"""
        prayer_times = {
            "32": ["05:30", "07:00", "12:30", "15:30", "18:30", "20:30"],  # Day 32 doesn't exist
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        # Should skip invalid day and only process valid one
        assert len(result) == 1
        assert result[0]["fajr"] == "05:31"
    
    def test_normalize_month_data_empty_input(self):
        """Test with empty input"""
        prayer_times = {}
        
        result = normalize_month_data(prayer_times)
        
        assert result == []
    
    def test_normalize_month_data_none_values(self):
        """Test with None values in time list"""
        prayer_times = {
            "1": [None, "07:00", "12:30", "15:30", "18:30", "20:30"],
            "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
        }
        
        result = normalize_month_data(prayer_times)
        
        # Should skip invalid day and only process valid one
        assert len(result) == 1
        assert result[0]["fajr"] == "05:31"


class TestNormalizeYearData:
    """Test the normalize_year_data function with various input formats"""
    
    def test_normalize_year_data_valid_format(self):
        """Test with valid year data format"""
        prayer_times = [
            {  # January
                "1": ["05:30", "07:00", "12:30", "15:30", "18:30", "20:30"],
                "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
            },
            {  # February
                "1": ["05:32", "07:02", "12:32", "15:32", "18:32", "20:32"]
            }
        ]
        
        result = normalize_year_data(prayer_times)
        
        assert len(result) == 2  # Two months
        assert len(result[0]) == 2  # January has 2 days
        assert len(result[1]) == 1  # February has 1 day
        
        # Check January data
        assert result[0]["1"]["fajr"] == "05:30"
        assert result[0]["1"]["dohr"] == "12:30"
        assert result[0]["2"]["fajr"] == "05:31"
        
        # Check February data
        assert result[1]["1"]["fajr"] == "05:32"
    
    def test_normalize_year_data_invalid_month_format(self):
        """Test with invalid month format (not dict)"""
        prayer_times = [
            "invalid_month",  # Not a dict
            {  # February
                "1": ["05:32", "07:02", "12:32", "15:32", "18:32", "20:32"]
            }
        ]
        
        result = normalize_year_data(prayer_times)
        
        # Should skip invalid month and only process valid one
        assert len(result) == 1
        assert result[0]["1"]["fajr"] == "05:32"
    
    def test_normalize_year_data_invalid_time_format(self):
        """Test with invalid time format in year data"""
        prayer_times = [
            {  # January
                "1": ["05:30", "07:00", "12:30"],  # Only 3 times instead of 6
                "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
            }
        ]
        
        result = normalize_year_data(prayer_times)
        
        # Should skip invalid day and only process valid one
        assert len(result) == 1
        assert len(result[0]) == 1  # Only one valid day
        assert result[0]["2"]["fajr"] == "05:31"
    
    def test_normalize_year_data_invalid_date(self):
        """Test with invalid date (e.g., February 30th)"""
        prayer_times = [
            {  # January
                "30": ["05:30", "07:00", "12:30", "15:30", "18:30", "20:30"]  # Valid
            },
            {  # February
                "30": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]  # Invalid (Feb 30 doesn't exist)
            }
        ]
        
        result = normalize_year_data(prayer_times)
        
        # Should skip invalid date and only process valid one
        assert len(result) == 2
        assert len(result[0]) == 1  # January has 1 valid day
        assert len(result[1]) == 0  # February has 0 valid days
        assert result[0]["30"]["fajr"] == "05:30"
    
    def test_normalize_year_data_empty_input(self):
        """Test with empty input"""
        prayer_times = []
        
        result = normalize_year_data(prayer_times)
        
        assert result == []
    
    def test_normalize_year_data_non_string_times(self):
        """Test with non-string time values"""
        prayer_times = [
            {
                "1": [123, "07:00", "12:30", "15:30", "18:30", "20:30"],  # Number instead of string
                "2": ["05:31", "07:01", "12:31", "15:31", "18:31", "20:31"]
            }
        ]
        
        result = normalize_year_data(prayer_times)
        
        # Should skip invalid day and only process valid one
        assert len(result) == 1
        assert len(result[0]) == 1
        assert result[0]["2"]["fajr"] == "05:31"


class TestGetMosqueInfoFromJson:
    """Test the get_mosque_info_from_json function"""
    
    def test_get_mosque_info_from_json_found(self, tmp_path):
        """Test finding mosque info in JSON files"""
        # Create temporary data directory structure
        data_dir = tmp_path / "data" / "mosques_by_country"
        data_dir.mkdir(parents=True)
        
        # Create test JSON file
        test_data = [
            {
                "name": "Test Mosque",
                "address": "123 Test Street",
                "city": "Test City",
                "zipcode": "12345",
                "lat": 48.8566,
                "lng": 2.3522,
                "slug": "test-mosque"
            }
        ]
        
        with open(data_dir / "test_country.json", "w", encoding="utf-8") as f:
            json.dump(test_data, f)
        
        # Patch the data directory path
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.views.planner_view.Path", lambda x: data_dir if "data/mosques_by_country" in x else Path(x))
            
            result = get_mosque_info_from_json("test-mosque")
            
            assert result is not None
            assert result["name"] == "Test Mosque"
            assert result["address"] == "123 Test Street"
            assert result["city"] == "Test City"
            assert result["zipcode"] == "12345"
            assert result["lat"] == 48.8566
            assert result["lng"] == 2.3522
            assert result["slug"] == "test-mosque"
    
    def test_get_mosque_info_from_json_not_found(self, tmp_path):
        """Test when mosque is not found in JSON files"""
        # Create temporary data directory structure
        data_dir = tmp_path / "data" / "mosques_by_country"
        data_dir.mkdir(parents=True)
        
        # Create test JSON file with different slug
        test_data = [
            {
                "name": "Test Mosque",
                "slug": "different-mosque"
            }
        ]
        
        with open(data_dir / "test_country.json", "w", encoding="utf-8") as f:
            json.dump(test_data, f)
        
        # Patch the data directory path
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.views.planner_view.Path", lambda x: data_dir if "data/mosques_by_country" in x else Path(x))
            
            result = get_mosque_info_from_json("test-mosque")
            
            assert result is None
    
    def test_get_mosque_info_from_json_invalid_json(self, tmp_path):
        """Test handling of invalid JSON files"""
        # Create temporary data directory structure
        data_dir = tmp_path / "data" / "mosques_by_country"
        data_dir.mkdir(parents=True)
        
        # Create invalid JSON file
        with open(data_dir / "invalid.json", "w", encoding="utf-8") as f:
            f.write("invalid json content")
        
        # Create valid JSON file
        test_data = [
            {
                "name": "Test Mosque",
                "slug": "test-mosque"
            }
        ]
        
        with open(data_dir / "valid.json", "w", encoding="utf-8") as f:
            json.dump(test_data, f)
        
        # Patch the data directory path
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.views.planner_view.Path", lambda x: data_dir if "data/mosques_by_country" in x else Path(x))
            
            result = get_mosque_info_from_json("test-mosque")
            
            # Should still find the mosque in the valid file despite invalid file
            assert result is not None
            assert result["name"] == "Test Mosque"
    
    def test_get_mosque_info_from_json_missing_fields(self, tmp_path):
        """Test handling of missing fields in JSON data"""
        # Create temporary data directory structure
        data_dir = tmp_path / "data" / "mosques_by_country"
        data_dir.mkdir(parents=True)
        
        # Create JSON file with missing fields
        test_data = [
            {
                "slug": "test-mosque"
                # Missing other fields
            }
        ]
        
        with open(data_dir / "test_country.json", "w", encoding="utf-8") as f:
            json.dump(test_data, f)
        
        # Patch the data directory path
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.views.planner_view.Path", lambda x: data_dir if "data/mosques_by_country" in x else Path(x))
            
            result = get_mosque_info_from_json("test-mosque")
            
            assert result is not None
            assert result["name"] == "Unknown Mosque"  # Default value
            assert result["address"] == ""  # Default value
            assert result["city"] == ""  # Default value
            assert result["zipcode"] == ""  # Default value
            assert result["lat"] is None  # Default value
            assert result["lng"] is None  # Default value
            assert result["slug"] == "test-mosque" 