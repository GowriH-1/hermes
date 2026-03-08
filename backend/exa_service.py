"""Exa API service for product discovery."""

import os
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
    ) -> List[ExaProduct]:
        """
        Search for products using Exa API.

        Args:
            query: Search query (e.g., "mechanical keyboard")
            max_results: Maximum number of results to return
            price_min: Minimum price filter (optional)
            price_max: Maximum price filter (optional)

        Returns:
            List of ExaProduct objects with product information
        """
        # Use mock data if enabled (saves API credits!)
        if self.use_mock:
            return self._get_mock_products(query, max_results, price_min, price_max)

        try:
            # Enhance query with shopping context
            enhanced_query = f"Finding the best {query} to buy"
            if price_min is not None or price_max is not None:
                price_info = []
                if price_min is not None:
                    price_info.append(f"over ${price_min}")
                if price_max is not None:
                    price_info.append(f"under ${price_max}")
                enhanced_query += f" with budget {' and '.join(price_info)}"

            # Define output schema for structured product data
            output_schema = {
                "type": "object",
                "description": "List of products matching the search query",
                "required": ["products"],
                "properties": {
                    "products": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["name", "url", "price"],
                            "properties": {
                                "name": { "type": "string", "description": "The full name or title of the product" },
                                "url": { "type": "string", "description": "The exact URL to the product page" },
                                "price": { "type": "number", "description": "The current price of the product in USD" },
                                "description": { "type": "string", "description": "A concise description of the product and why it's a good gift" },
                                "image_url": { "type": "string", "description": "URL of the product image if available" }
                            }
                        }
                    }
                }
            }

            # Search with Exa using "deep" search for best results
            print(f"Searching Exa (deep) for: {enhanced_query}")
            search_response = self.client.search(
                query=enhanced_query,
                type="deep",
                num_results=max_results,
                output_schema=output_schema,
                contents={"highlights": {"max_characters": 500}}
            )

            products = []
            
            # Extract structured content from Exa deep search
            if hasattr(search_response, "output") and hasattr(search_response.output, "content"):
                extracted_data = search_response.output.content
                if "products" in extracted_data:
                    for p in extracted_data["products"]:
                        # Filter by price if specified (extra validation)
                        price = p.get("price")
                        if price is not None:
                            if price_min is not None and price < price_min:
                                continue
                            if price_max is not None and price > price_max:
                                continue

                        product = ExaProduct(
                            title=p.get("name", "Untitled"),
                            url=p.get("url"),
                            description=p.get("description"),
                            image_url=p.get("image_url"),
                            price=float(price) if price is not None else None,
                            score=1.0 # Deep search doesn't return score in the same way for structured
                        )
                        products.append(product)

            # If structured output failed or returned nothing, fallback to standard results
            if not products and hasattr(search_response, "results"):
                for result in search_response.results:
                    # Extract price from text if available
                    price = self._extract_price(result.text) if hasattr(result, "text") else None

                    # Filter by price if specified
                    if price is not None:
                        if price_min is not None and price < price_min:
                            continue
                        if price_max is not None and price > price_max:
                            continue

                    product = ExaProduct(
                        title=result.title if hasattr(result, "title") else "Untitled",
                        url=result.url,
                        description=result.text[:200] if hasattr(result, "text") else None,
                        image_url=self._extract_image_url(result),
                        price=price,
                        score=result.score if hasattr(result, "score") else None,
                    )
                    products.append(product)

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

    def _extract_price(self, text: str) -> Optional[float]:
        """
        Extract price from product text.

        Args:
            text: Product description text

        Returns:
            Extracted price or None
        """
        import re

        # Look for common price patterns: $XX.XX, $XX, etc.
        price_patterns = [
            r"\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)",  # $1,234.56 or $123.45
            r"USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)",  # USD 1234.56
            r"(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars|USD)",  # 1234.56 dollars
        ]

        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    # Remove commas and convert to float
                    price_str = match.group(1).replace(",", "")
                    return float(price_str)
                except (ValueError, IndexError):
                    continue

        return None

    def _extract_image_url(self, result) -> Optional[str]:
        """
        Extract image URL from Exa result.

        Args:
            result: Exa search result

        Returns:
            Image URL or None
        """
        # Check if result has image in metadata
        if hasattr(result, "image"):
            return result.image

        # Check for Open Graph image in metadata
        if hasattr(result, "og_image"):
            return result.og_image

        return None

    def _get_mock_products(
        self,
        query: str,
        max_results: int,
        price_min: Optional[float],
        price_max: Optional[float],
    ) -> List[ExaProduct]:
        """
        Get mock products for testing (saves API credits!).

        Args:
            query: Search query
            max_results: Maximum number of results
            price_min: Minimum price filter
            price_max: Maximum price filter

        Returns:
            List of mock ExaProduct objects
        """
        # Determine which mock dataset to use based on query
        query_lower = query.lower()
        if "keyboard" in query_lower:
            products = MOCK_PRODUCTS["keyboard"]
        elif "book" in query_lower:
            products = MOCK_PRODUCTS["book"]
        else:
            products = MOCK_PRODUCTS["default"]

        # Filter by price if specified
        filtered = []
        for product in products:
            if product.price is not None:
                if price_min is not None and product.price < price_min:
                    continue
                if price_max is not None and product.price > price_max:
                    continue
            filtered.append(product)

        return filtered[:max_results]

    def get_product_details(self, url: str) -> Optional[ExaProduct]:
        """
        Get detailed information about a specific product URL.

        Args:
            url: Product page URL

        Returns:
            ExaProduct with detailed information or None
        """
        try:
            # Get contents for specific URL
            contents = self.client.get_contents([url], text={"max_characters": 1000})

            if not contents.results:
                return None

            result = contents.results[0]
            price = self._extract_price(result.text) if hasattr(result, "text") else None

            return ExaProduct(
                title=result.title if hasattr(result, "title") else "Untitled",
                url=result.url,
                description=result.text[:300] if hasattr(result, "text") else None,
                image_url=self._extract_image_url(result),
                price=price,
            )

        except Exception as e:
            print(f"Error getting product details: {e}")
            return None


# Singleton instance
_exa_service = None


def get_exa_service() -> ExaService:
    """Get or create ExaService singleton instance."""
    global _exa_service
    if _exa_service is None:
        _exa_service = ExaService()
    return _exa_service
