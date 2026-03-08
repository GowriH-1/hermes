import os
import re
import hashlib
from typing import List, Optional
from dotenv import load_dotenv

from exa_py import Exa
from schemas import ExaProduct

# Load environment variables
load_dotenv()

# Mock data for testing
MOCK_BRANDS = {
    "google.com": {
        "primary_color": "#4285F4",
        "secondary_color": "#EA4335",
        "logo_url": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        "tagline": "Organizing the world's information"
    },
    "github.com": {
        "primary_color": "#24292e",
        "secondary_color": "#2ea44f",
        "logo_url": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        "tagline": "Where the world builds software"
    }
}

class ExaService:
    """Service for searching products and extracting brand info using Exa API."""

    def __init__(self):
        """Initialize Exa client with API key from environment."""
        self.use_mock = os.getenv("MOCK_EXA", "false").lower() == "true"

        if not self.use_mock:
            api_key = os.getenv("EXA_API_KEY")
            if not api_key:
                raise ValueError("EXA_API_KEY environment variable not set")
            self.client = Exa(api_key=api_key)
        else:
            print("⚠️  Using MOCK Exa responses (MOCK_EXA=true)")
            self.client = None

    def search_products(
        self,
        query: str,
        max_results: int = 10,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        search_type: str = "deep",
    ) -> List[ExaProduct]:
        """
        Search for products using Exa API.
        """
        if self.use_mock:
            return self._get_mock_products(query, max_results, price_min, price_max)

        try:
            # Map search_type
            # instant -> 'instant' type (fastest)
            # deep -> 'neural' type (semantic, reliable)
            exa_type = "instant" if search_type == "instant" else "neural"
            
            # Domains to exclude for product search to avoid Wikipedia/Articles
            exclude_domains = [
                "wikipedia.org", "britannica.com", "encyclopedia.com", 
                "wiktionary.org", "youtube.com", "facebook.com", 
                "instagram.com", "pinterest.com", "reddit.com",
                "medium.com", "quora.com", "investopedia.com", "dictionary.com"
            ]
            
            # Optimize query for product intent
            product_query = query
            if not any(kw in query.lower() for kw in ["buy", "price", "shop", "store", "online"]):
                product_query = f"buy {query} online price"

            print(f"Searching Exa ({search_type}/{exa_type}) for: {product_query}")
            
            # Use search call with domain exclusions
            search_response = self.client.search(
                query=product_query,
                type=exa_type,
                num_results=max_results,
                exclude_domains=exclude_domains,
                contents={"text": {"max_characters": 1500}}
            )

            products = []
            if hasattr(search_response, "results"):
                for result in search_response.results:
                    price = None
                    text_content = result.text if hasattr(result, "text") else ""
                    
                    # Try extracting price from Title and Text
                    price = self._extract_price(result.title) if hasattr(result, "title") else None
                    if price is None:
                        price = self._extract_price(text_content)

                    # Filter by price if specified
                    if price is not None:
                        if price_min is not None and price < price_min: continue
                        if price_max is not None and price > price_max: continue

                    products.append(ExaProduct(
                        title=result.title if hasattr(result, "title") else "Untitled",
                        url=result.url,
                        description=text_content[:200] if text_content else None,
                        image_url=self._extract_image_url(result),
                        price=price,
                        score=result.score if hasattr(result, "score") else None,
                    ))

            return products[:max_results]

        except Exception as e:
            print(f"Error searching Exa: {e}")
            import traceback
            traceback.print_exc()
            return []

    def extract_brand_info(self, url: str) -> dict:
        """
        Extract brand identity using Exa's structured deep search.
        """
        if not url:
            return {}
            
        clean_url = url.lower().replace("https://", "").replace("http://", "").split('/')[0]
        if clean_url.startswith("www."):
            clean_url = clean_url[4:]
            
        if clean_url in MOCK_BRANDS:
            return MOCK_BRANDS[clean_url]
            
        if self.use_mock or not self.client:
            return self._get_fallback_brand(clean_url)
            
        try:
            print(f"🕵️ Branding Agent: Analyzing {url}...")
            
            # Use Exa's deep search with output schema for structured branding
            output_schema = {
                "type": "object",
                "required": ["primary_color", "secondary_color", "tagline"],
                "properties": {
                    "primary_color": { "type": "string", "description": "The dominant brand color in hex format (e.g. #FF0000)" },
                    "secondary_color": { "type": "string", "description": "The secondary brand color in hex format" },
                    "logo_url": { "type": "string", "description": "Direct URL to the company logo image" },
                    "tagline": { "type": "string", "description": "A short, catchy brand tagline or mission statement" }
                }
            }
            
            search_response = self.client.search(
                f"What is the brand identity, primary colors, and mission of {url}?",
                type="deep",
                num_results=1,
                output_schema=output_schema
            )
            
            if hasattr(search_response, "output") and hasattr(search_response.output, "content"):
                brand = search_response.output.content
                print(f"🎨 Branding Agent: Found identity for {clean_url}: {brand.get('primary_color')}")
                return brand
                
            return self._get_fallback_brand(clean_url)
        except Exception as e:
            print(f"Error extracting brand info: {e}")
            return self._get_fallback_brand(clean_url)

    def _get_fallback_brand(self, domain: str) -> dict:
        """Generate a deterministic fallback brand based on domain name."""
        h = hashlib.md5(domain.encode()).hexdigest()
        color1 = f"#{h[:6]}"
        color2 = f"#{h[6:12]}"
        return {
            "primary_color": color1,
            "secondary_color": color2,
            "tagline": f"The future of {domain.split('.')[0].capitalize()}"
        }

    def _extract_price(self, text: Optional[str]) -> Optional[float]:
        if not text: return None
        
        # More comprehensive list of price patterns
        patterns = [
            r"price:?\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)", # Price: $99.99
            r"sale:?\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",  # Sale: $99.99
            r"\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",          # $99.99
            r"(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD",         # 99.99 USD
            r"(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*dollars",     # 99.99 dollars
            r"at\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",     # at $99.99
            r"for\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",    # for $99.99
        ]
        
        # Search the entire text, but prioritize the beginning where product info usually is
        search_text = text
        
        for pattern in patterns:
            match = re.search(pattern, search_text, re.IGNORECASE)
            if match:
                try:
                    val_str = match.group(1).replace(",", "")
                    val = float(val_str)
                    # Sanity check: products in this portal are likely between $1 and $10,000
                    if 1.0 <= val <= 10000.0:
                        return val
                except:
                    continue
        
        # Fallback: look for any number that looks like a price ($XX.XX) even without prefix
        fallback_match = re.search(r"\$(\d+\.\d{2})", search_text)
        if fallback_match:
            try:
                return float(fallback_match.group(1))
            except:
                pass
                
        return None

    def _extract_image_url(self, result) -> Optional[str]:
        if hasattr(result, "image"): return result.image
        if hasattr(result, "og_image"): return result.og_image
        return None

    def _get_mock_products(self, query: str, max_results: int, price_min: Optional[float], price_max: Optional[float]) -> List[ExaProduct]:
        return []

_exa_service = None
def get_exa_service() -> ExaService:
    global _exa_service
    if _exa_service is None: _exa_service = ExaService()
    return _exa_service
