import requests
from bs4 import BeautifulSoup
import re
import logging

logger = logging.getLogger(__name__)

class ContentService:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    def fetch_page_content(self, url, timeout=10):
        """Fetch and extract content from a webpage"""
        try:
            response = requests.get(url, headers=self.headers, timeout=timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script, style elements and comments
            for element in soup(["script", "style", "nav", "footer", "header"]):
                element.decompose()
                
            # Get text content and clean it
            text = soup.get_text(separator=' ')
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            # Get meta information
            title = soup.title.string if soup.title else "No title"
            meta_desc = ""
            meta_desc_tag = soup.find("meta", attrs={"name": "description"})
            if meta_desc_tag and "content" in meta_desc_tag.attrs:
                meta_desc = meta_desc_tag["content"]
                
            # Get headings
            headings = []
            for heading in soup.find_all(["h1", "h2", "h3"]):
                headings.append(heading.get_text())
                
            return {
                "url": url,
                "title": title,
                "meta_description": meta_desc,
                "headings": headings,
                "content": text[:10000],  # Limit content length for Claude
                "word_count": len(text.split())
            }
        except Exception as e:
            logger.error(f"Error fetching content from {url}: {str(e)}")
            return {
                "url": url,
                "error": str(e),
                "content": None
            }
    
    def fetch_multiple_pages(self, urls, limit=5):
        """Fetch content from multiple pages"""
        results = []
        for url in urls[:limit]:  # Limit to first 5 URLs
            content = self.fetch_page_content(url)
            results.append(content)
        return results 