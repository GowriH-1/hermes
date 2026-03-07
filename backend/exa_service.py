import os
import re
from typing import List, Optional
from dotenv import load_dotenv

from exa_py import Exa
from schemas import ExaProduct

# Load environment variables
load_dotenv()

# Mock data for testing (saves API credits!)
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
    },
    "microsoft.com": {
        "primary_color": "#00a4ef",
        "secondary_color": "#7fbb00",
        "logo_url": "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
        "tagline": "Empowering every person on the planet"
    },
    "apple.com": {
        "primary_color": "#000000",
        "secondary_color": "#555555",
        "logo_url": "https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png",
        "tagline": "Think Different"
    }
}


MOCK_PRODUCTS = {
    "keyboard": [
        ExaProduct(
            title="Keychron K2 Wireless Mechanical Keyboard",
            url="https://www.keychron.com/products/keychron-k2",
            description="Hot-swappable wireless mechanical keyboard with RGB backlight",
            image_url="https://example.com/k2.jpg",
            price=89.0
        ),
        ExaProduct(
            title="Royal Kludge RK61",
            url="https://www.amazon.com/RK61",
            description="Compact 60% mechanical keyboard with hot-swap sockets",
            price=59.99
        ),
        ExaProduct(
            title="Logitech G Pro X",
            url="https://www.logitechg.com/en-us/products/gaming-keyboards/pro-x-gaming-keyboard.html",
            description="Tenkeyless mechanical gaming keyboard",
            price=149.99
        ),
    ],
    "book": [
        ExaProduct(
            title="Clean Code by Robert C. Martin",
            url="https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882",
            description="A Handbook of Agile Software Craftsmanship",
            price=35.0
        ),
        ExaProduct(
            title="The Pragmatic Programmer",
            url="https://pragprog.com/titles/tpp20/",
            description="Your Journey To Mastery, 20th Anniversary Edition",
            price=45.0
        ),
    ],
    "default": [
        ExaProduct(
            title="Sample Product 1",
            url="https://example.com/product1",
            description="A sample product for testing",
            price=50.0
        ),
        ExaProduct(
            title="Sample Product 2",
            url="https://example.com/product2",
            description="Another sample product",
            price=75.0
        ),
    ]
}
class ExaService:
    """Service for searching products using Exa API."""

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
            
            print(f"Searching Exa ({search_type}/{exa_type}) for: {query}")
            
            # We always fetch text contents now because output_schema was unreliable
            search_response = self.client.search(
                query=query,
                type=exa_type,
                num_results=max_results,
                contents={"text": {"max_characters": 1500}}
            )

            products = []
            if hasattr(search_response, "results"):
                for result in search_response.results:
                    price = None
                    # 1. Try Title
                    if hasattr(result, "title") and result.title:
                        price = self._extract_price(result.title)
                    
                    # 2. Try Text (more characters = better chance)
                    if price is None and hasattr(result, "text") and result.text:
                        price = self._extract_price(result.text)

                    # 3. Filter by price if specified
                    if price is not None:
                        if price_min is not None and price < price_min: continue
                        if price_max is not None and price > price_max: continue

                    # Create product
                    products.append(ExaProduct(
                        title=result.title if hasattr(result, "title") else "Untitled",
                        url=result.url,
                        description=result.text[:200] if hasattr(result, "text") else None,
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
        Extract brand identity (colors, logo, tagline) from a website URL.
        
        Args:
            url: Website URL to extract brand info from
            
        Returns:
            Dictionary with brand information
        """
        if not url:
            return {}
            
        # Clean URL
        clean_url = url.lower().replace("https://", "").replace("http://", "").split('/')[0]
        if clean_url.startswith("www."):
            clean_url = clean_url[4:]
            
        # Return mock brand if available
        if clean_url in MOCK_BRANDS:
            print(f"Using mock brand info for: {clean_url}")
            return MOCK_BRANDS[clean_url]
            
        # If not mock, use Exa search to find brand info
        if self.use_mock or not self.client:
            # Return a default brand for unknowns in mock mode
            return {
                "primary_color": "#3b82f6", # Blue 500
                "secondary_color": "#1e40af", # Blue 800
                "tagline": f"Welcome to {clean_url.capitalize()}"
            }
            
        try:
            print(f"Searching Exa for brand info: {url}")
            # Use Exa to find brand information
            search_response = self.client.search(
                f"What are the brand colors, logo URL, and tagline for {url}?",
                num_results=3,
                use_autoprompt=True
            )
            
            # For now, return a sophisticated default based on the domain
            # In a real app, we'd use LLM to extract this from the search results
            return {
                "primary_color": "#6366f1", # Indigo 500
                "secondary_color": "#4338ca", # Indigo 700
                "tagline": f"Partnering with {clean_url.split('.')[0].capitalize()}"
            }
        except Exception as e:
            print(f"Error extracting brand info: {e}")
            return {}

    def _extract_price(self, text: Optional[str]) -> Optional[float]:
        """Robust price extraction using multiple patterns."""
        if not text:
            return None

        # 1. Standard $XX.XX pattern - check for both $ and USD
        # Try to find the first occurrence of a currency-like structure
        patterns = [
            r"\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)",  # $1,234.56
            r"(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:usd|dollars|bucks)", # 99 USD
            r"(?:price|cost|was|now|at|for)\s*:?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)", # Price: 45
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    val = float(match.group(1).replace(",", ""))
                    if 0 < val < 50000: # Sanity check for realistic prices
                        return val
                except: continue

        return None

    def _extract_image_url(self, result) -> Optional[str]:
        if hasattr(result, "image"): return result.image
        if hasattr(result, "og_image"): return result.og_image
        return None

    def _get_mock_products(self, query: str, max_results: int, price_min: Optional[float], price_max: Optional[float]) -> List[ExaProduct]:
        return []

    def get_product_details(self, url: str) -> Optional[ExaProduct]:
        try:
            contents = self.client.get_contents([url], text={"max_characters": 1500})
            if not contents.results: return None
            result = contents.results[0]
            price = self._extract_price(result.text) if hasattr(result, "text") else None
            return ExaProduct(
                title=result.title, url=result.url, description=result.text[:300], price=price,
            )
        except: return None

_exa_service = None
def get_exa_service() -> ExaService:
    global _exa_service
    if _exa_service is None: _exa_service = ExaService()
    return _exa_service
