import os
import sys
from dotenv import load_dotenv

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from exa_service import get_exa_service

def test_search():
    load_dotenv()
    print("Initializing ExaService...")
    service = get_exa_service()
    
    query = "mechanical keyboard"
    print(f"Searching for: {query} (INSTANT)")
    
    try:
        results = service.search_products(query, max_results=5, search_type="instant")
        print(f"Found {len(results)} results:")
        for i, p in enumerate(results):
            print(f"{i+1}. {p.title}")
            print(f"   URL: {p.url}")
            print(f"   Price: ${p.price if p.price else '??'}")
            print("-" * 20)
            
        if len(results) == 0:
            print("No results returned. Check if API key is valid and category='product' is supported for your query.")
            
    except Exception as e:
        print(f"ERROR during search: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_search()
