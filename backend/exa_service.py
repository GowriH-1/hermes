"""Exa API service for product discovery."""

import os
from typing import List, Optional

from exa_py import Exa
from schemas import ExaProduct


class ExaService:
    """Service for searching products using Exa API."""

    def __init__(self):
        """Initialize Exa client with API key from environment."""
        api_key = os.getenv("EXA_API_KEY")
        if not api_key:
            raise ValueError("EXA_API_KEY environment variable not set")
        self.client = Exa(api_key=api_key)

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
        try:
            # Enhance query with shopping context
            enhanced_query = f"shop buy purchase {query}"

            # Add price constraints to query if provided
            if price_min is not None or price_max is not None:
                price_info = []
                if price_min is not None:
                    price_info.append(f"over ${price_min}")
                if price_max is not None:
                    price_info.append(f"under ${price_max}")
                enhanced_query += f" {' '.join(price_info)}"

            # Search with Exa
            search_response = self.client.search_and_contents(
                query=enhanced_query,
                num_results=max_results,
                use_autoprompt=True,  # Let Exa optimize the query
                type="auto",  # Auto-detect best search type
                text={"max_characters": 500},  # Get text snippets
            )

            products = []
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
            return []

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
