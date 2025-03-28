import requests
import logging
from config import Config
import time

logger = logging.getLogger(__name__)

class SerpDataService:
    def __init__(self, api_key=None):
        self.api_key = api_key or Config.SERPAPI_KEY
        self.base_url = "https://serpapi.com/search"
        
    def fetch_rankings(self, query, location="United States", language="en"):
        """Fetch SERP data for a given query using SERPapi.com"""
        try:
            params = {
                "api_key": self.api_key,
                "q": query,
                "location": location,
                "hl": language,
                "gl": "us",
                "google_domain": "google.com",
                "num": 30  # Get top 30 results
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            response_data = response.json()
            
            # Extract organic results from the SERPapi response
            organic_results = []
            
            if "organic_results" in response_data:
                for i, result in enumerate(response_data["organic_results"], 1):
                    organic_results.append({
                        'position': i,
                        'url': result.get('link'),
                        'title': result.get('title'),
                        'description': result.get('snippet'),
                    })
            
            return {
                'organic_results': organic_results,
                'query': query,
                'timestamp': time.time()
            }
            
        except requests.RequestException as e:
            logger.error(f"Error fetching SERP data from SERPapi: {e}")
            return None
        except (KeyError, IndexError, ValueError) as e:
            logger.error(f"Error parsing SERPapi response: {e}")
            return None 