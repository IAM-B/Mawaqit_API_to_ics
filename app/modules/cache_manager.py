"""
Cache manager module for ICS file generation.
This module handles caching of generated ICS files to avoid regeneration.
"""

import hashlib
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from flask import current_app


class ICSCacheManager:
    """
    Manages caching for ICS file generation to avoid redundant API calls and processing.
    """
    
    def __init__(self, cache_dir: str = None):
        """
        Initialize the cache manager.
        
        Args:
            cache_dir (str): Directory to store cache files. If None, uses app/cache
        """
        if cache_dir is None:
            # Use app/cache directory by default
            from pathlib import Path
            app_dir = Path(__file__).parent.parent
            cache_dir = app_dir / "cache"
        
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.metadata_file = self.cache_dir / "cache_metadata.json"
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load cache metadata from file."""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ Error loading cache metadata: {e}")
        return {}
    
    def _save_metadata(self):
        """Save cache metadata to file."""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ Error saving cache metadata: {e}")
    
    def _generate_cache_key(self, 
                          masjid_id: str, 
                          scope: str, 
                          padding_before: int, 
                          padding_after: int, 
                          include_sunset: bool,
                          file_type: str,
                          prayer_paddings: dict = None) -> str:
        """
        Generate a unique cache key based on generation parameters.
        
        Args:
            masjid_id (str): Mosque identifier
            scope (str): Time scope (today/month/year)
            padding_before (int): Minutes before prayer
            padding_after (int): Minutes after prayer
            include_sunset (bool): Whether to include sunset
            file_type (str): Type of ICS file (prayer_times/slots/empty_slots)
            prayer_paddings (dict): Individual padding settings for each prayer
            
        Returns:
            str: Unique cache key
        """
        # Create a string with all parameters
        params_str = f"{masjid_id}_{scope}_{padding_before}_{padding_after}_{include_sunset}_{file_type}"
        
        # Add prayer paddings to the cache key if provided
        if prayer_paddings:
            # Sort prayer paddings for consistent ordering
            sorted_paddings = sorted(prayer_paddings.items())
            padding_str = "_".join([f"{prayer}_{paddings['before']}_{paddings['after']}" 
                                  for prayer, paddings in sorted_paddings])
            params_str += f"_paddings_{padding_str}"
        
        # Add current date for today scope, month for month scope, year for year scope
        now = datetime.now()
        if scope == "today":
            params_str += f"_{now.date()}"
        elif scope == "month":
            params_str += f"_{now.year}_{now.month:02d}"
        elif scope == "year":
            params_str += f"_{now.year}"
        
        # Generate hash for consistent key length
        return hashlib.md5(params_str.encode()).hexdigest()
    
    def _get_cache_file_path(self, cache_key: str, file_type: str) -> Path:
        """
        Get the cache file path for a given key and file type.
        
        Args:
            cache_key (str): Cache key
            file_type (str): Type of ICS file
            
        Returns:
            Path: Path to the cache file
        """
        return self.cache_dir / f"{cache_key}_{file_type}.ics"
    
    def _get_cache_metadata_path(self, cache_key: str) -> Path:
        """
        Get the metadata file path for a given cache key.
        
        Args:
            cache_key (str): Cache key
            
        Returns:
            Path: Path to the metadata file
        """
        return self.cache_dir / f"{cache_key}_metadata.json"
    
    def is_cache_valid(self, 
                      masjid_id: str, 
                      scope: str, 
                      padding_before: int, 
                      padding_after: int, 
                      include_sunset: bool,
                      file_type: str,
                      prayer_paddings: dict = None,
                      max_age_hours: int = 24) -> bool:
        """
        Check if cache is valid for the given parameters.
        
        Args:
            masjid_id (str): Mosque identifier
            scope (str): Time scope
            padding_before (int): Minutes before prayer
            padding_after (int): Minutes after prayer
            include_sunset (bool): Whether to include sunset
            file_type (str): Type of ICS file
            prayer_paddings (dict): Individual padding settings for each prayer
            max_age_hours (int): Maximum age of cache in hours
            
        Returns:
            bool: True if cache is valid, False otherwise
        """
        cache_key = self._generate_cache_key(masjid_id, scope, padding_before, padding_after, include_sunset, file_type, prayer_paddings)
        
        # Check if cache file exists
        cache_file = self._get_cache_file_path(cache_key, file_type)
        if not cache_file.exists():
            return False
        
        # Check if metadata exists
        metadata_file = self._get_cache_metadata_path(cache_key)
        if not metadata_file.exists():
            return False
        
        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Check cache age
            cache_time = datetime.fromisoformat(metadata.get('created_at', ''))
            age = datetime.now() - cache_time
            
            if age > timedelta(hours=max_age_hours):
                print(f"🕐 Cache expired for {file_type} ({age.total_seconds() / 3600:.1f}h old)")
                return False
            
            # Check if file size matches
            expected_size = metadata.get('file_size', 0)
            actual_size = cache_file.stat().st_size
            if actual_size != expected_size:
                print(f"⚠️ Cache file size mismatch for {file_type}")
                return False
            
            print(f"✅ Cache valid for {file_type} (age: {age.total_seconds() / 3600:.1f}h)")
            return True
            
        except Exception as e:
            print(f"⚠️ Error checking cache validity: {e}")
            return False
    
    def get_cached_file_path(self, 
                           masjid_id: str, 
                           scope: str, 
                           padding_before: int, 
                           padding_after: int, 
                           include_sunset: bool,
                           file_type: str,
                           prayer_paddings: dict = None) -> Optional[str]:
        """
        Get the path to a cached file if it exists and is valid.
        
        Args:
            masjid_id (str): Mosque identifier
            scope (str): Time scope
            padding_before (int): Minutes before prayer
            padding_after (int): Minutes after prayer
            include_sunset (bool): Whether to include sunset
            file_type (str): Type of ICS file
            prayer_paddings (dict): Individual padding settings for each prayer
            
        Returns:
            Optional[str]: Path to cached file if valid, None otherwise
        """
        if not self.is_cache_valid(masjid_id, scope, padding_before, padding_after, include_sunset, file_type, prayer_paddings):
            return None
        
        cache_key = self._generate_cache_key(masjid_id, scope, padding_before, padding_after, include_sunset, file_type, prayer_paddings)
        cache_file = self._get_cache_file_path(cache_key, file_type)
        
        if cache_file.exists():
            return str(cache_file)
        
        return None
    
    def save_to_cache(self, 
                     masjid_id: str, 
                     scope: str, 
                     padding_before: int, 
                     padding_after: int, 
                     include_sunset: bool,
                     file_type: str,
                     file_content: bytes,
                     original_path: str,
                     prayer_paddings: dict = None) -> str:
        """
        Save a generated file to cache.
        
        Args:
            masjid_id (str): Mosque identifier
            scope (str): Time scope
            padding_before (int): Minutes before prayer
            padding_after (int): Minutes after prayer
            include_sunset (bool): Whether to include sunset
            file_type (str): Type of ICS file
            file_content (bytes): File content to cache
            original_path (str): Original file path
            prayer_paddings (dict): Individual padding settings for each prayer
            
        Returns:
            str: Path to the cached file
        """
        cache_key = self._generate_cache_key(masjid_id, scope, padding_before, padding_after, include_sunset, file_type, prayer_paddings)
        
        # Save the file
        cache_file = self._get_cache_file_path(cache_key, file_type)
        with open(cache_file, 'wb') as f:
            f.write(file_content)
        
        # Save metadata
        metadata = {
            'created_at': datetime.now().isoformat(),
            'original_path': original_path,
            'file_size': len(file_content),
            'parameters': {
                'masjid_id': masjid_id,
                'scope': scope,
                'padding_before': padding_before,
                'padding_after': padding_after,
                'include_sunset': include_sunset,
                'file_type': file_type,
                'prayer_paddings': prayer_paddings
            }
        }
        
        metadata_file = self._get_cache_metadata_path(cache_key)
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Cached {file_type} file: {cache_file}")
        return str(cache_file)
    
    def copy_cached_to_destination(self, 
                                 masjid_id: str, 
                                 scope: str, 
                                 padding_before: int, 
                                 padding_after: int, 
                                 include_sunset: bool,
                                 file_type: str,
                                 destination_path: str,
                                 prayer_paddings: dict = None) -> bool:
        """
        Copy a cached file to the destination path.
        
        Args:
            masjid_id (str): Mosque identifier
            scope (str): Time scope
            padding_before (int): Minutes before prayer
            padding_after (int): Minutes after prayer
            include_sunset (bool): Whether to include sunset
            file_type (str): Type of ICS file
            destination_path (str): Destination path
            prayer_paddings (dict): Individual padding settings for each prayer
            
        Returns:
            bool: True if successful, False otherwise
        """
        cached_path = self.get_cached_file_path(masjid_id, scope, padding_before, padding_after, include_sunset, file_type, prayer_paddings)
        
        if not cached_path:
            return False
        
        try:
            # Ensure destination directory exists
            dest_path = Path(destination_path)
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy file
            import shutil
            shutil.copy2(cached_path, destination_path)
            
            print(f"📋 Copied cached {file_type} to: {destination_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error copying cached file: {e}")
            return False
    
    def clear_cache(self, max_age_hours: int = None):
        """
        Clear old cache files.
        
        Args:
            max_age_hours (int, optional): Maximum age in hours. If None, clears all cache.
        """
        try:
            for cache_file in self.cache_dir.glob("*_metadata.json"):
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                    
                    cache_time = datetime.fromisoformat(metadata.get('created_at', ''))
                    age = datetime.now() - cache_time
                    
                    if max_age_hours is None or age > timedelta(hours=max_age_hours):
                        # Remove metadata file
                        cache_file.unlink()
                        
                        # Remove corresponding ICS file
                        cache_key = cache_file.stem.replace('_metadata', '')
                        for ics_file in self.cache_dir.glob(f"{cache_key}_*.ics"):
                            ics_file.unlink()
                        
                        print(f"🗑️ Cleared cache: {cache_key}")
                        
                except Exception as e:
                    print(f"⚠️ Error processing cache file {cache_file}: {e}")
                    
        except Exception as e:
            print(f"❌ Error clearing cache: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dict[str, Any]: Cache statistics
        """
        try:
            ics_files = list(self.cache_dir.glob("*.ics"))
            metadata_files = list(self.cache_dir.glob("*_metadata.json"))
            
            total_size = sum(f.stat().st_size for f in ics_files)
            
            return {
                'total_files': len(ics_files),
                'total_metadata': len(metadata_files),
                'total_size_bytes': total_size,
                'total_size_mb': total_size / (1024 * 1024),
                'cache_dir': str(self.cache_dir)
            }
            
        except Exception as e:
            print(f"❌ Error getting cache stats: {e}")
            return {}


# Global cache manager instance
cache_manager = ICSCacheManager() 