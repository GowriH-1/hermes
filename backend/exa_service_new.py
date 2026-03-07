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

        Args:
            query: Search query (e.g., "mechanical keyboard")
            max_results: Maximum number of results to return
            price_min: Minimum price filter (optional)
            price_max: Maximum price filter (optional)
            search_type: "instant" (lowest latency) or "deep" (neural)

        Returns:
            List of ExaProduct objects with product information
        """
        # Use mock data if enabled (saves API credits!)
        if self.use_mock:
            return self._get_mock_products(query, max_results, price_min, price_max)

        try:
            # Map search_type to native Exa API types for optimal performance
            # "instant" -> lowest latency (standard keyword/fast fallback)
            # "deep" -> standard neural (semantic search)
            exa_type = "instant" if search_type == "instant" else "neural"
            
            # Use raw query for 'instant' to avoid autoprompt overhead
            # Use enhanced query only for 'deep'
            query_to_use = query if exa_type == "instant" else f"Finding the best {query} to buy"
            
            if exa_type != "instant" and (price_min is not None or price_max is not None):
                price_info = []
                if price_min is not None:
                    price_info.append(f"over ${price_min}")
                if price_max is not None:
                    price_info.append(f"under ${price_max}")
                query_to_use += f" with budget {' and '.join(price_info)}"

            # Search with Exa
            print(f"Searching Exa ({search_type}/{exa_type}) for: {query_to_use}")
            
            # For 'instant' mode, we strip EVERYTHING to get sub-second response
            # We don't use output_schema or heavy content fetching
            if exa_type == "instant":
                search_response = self.client.search(
                    query=query_to_use,
                    type="instant",
                    num_results=max_results,
                    use_autoprompt=False
                )
            else:
                # 'deep' mode uses neural and basic highlights for better context
                search_response = self.client.search(
                    query=query_to_use,
                    type="neural",
                    num_results=max_results,
                    contents={"highlights": {"max_characters": 200}}
                )

            products = []
            
            # Parse standard results
            if hasattr(search_response, "results"):
                for result in search_response.results:
                    # Extract price from highlights if available
                    price = None
                    if hasattr(result, "highlights") and result.highlights:
                        price = self._extract_price(result.highlights[0])
                    
                    if price is None and hasattr(result, "text"):
                        price = self._extract_price(result.text)

                    # Filter by price if specified (extra safety)
                    if price is not None:
                        if price_min is not None and price < price_min:
                            continue
                        if price_max is not None and price > price_max:
                            continue

                    product = ExaProduct(
                        title=result.title if hasattr(result, "title") else "Untitled",
                        url=result.url,
                        description=result.highlights[0] if hasattr(result, "highlights") and result.highlights else None,
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