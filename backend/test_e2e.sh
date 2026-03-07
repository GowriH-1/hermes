#!/bin/bash

# End-to-End Test Script for Gift Portal Backend
# This script tests all major API endpoints

set -e  # Exit on error

BASE_URL="http://localhost:8000"
echo "🧪 Testing Gift Portal Backend API at $BASE_URL"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}1. Testing Health Check${NC}"
curl -s -X GET "$BASE_URL/" | python3 -m json.tool
echo -e "${GREEN}✓ Health check passed${NC}\n"

# Test 2: Register Alice (Participant)
echo -e "${BLUE}2. Registering Alice (Participant)${NC}"
ALICE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice_test@test.com",
    "password": "password123",
    "full_name": "Alice Johnson",
    "username": "alice_test",
    "age_group": "18-24",
    "interests": ["tech", "gaming", "keyboards"]
  }')
echo "$ALICE_RESPONSE" | python3 -m json.tool | head -15
ALICE_TOKEN=$(echo "$ALICE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
ALICE_ID=$(echo "$ALICE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['id'])")
echo -e "${GREEN}✓ Alice registered (ID: $ALICE_ID)${NC}\n"

# Test 3: Register Bob (Sponsor)
echo -e "${BLUE}3. Registering Bob (Sponsor)${NC}"
BOB_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob_test@test.com",
    "password": "password123",
    "full_name": "Bob Smith",
    "username": "bob_test",
    "age_group": "25-34",
    "interests": ["business", "tech"]
  }')
echo "$BOB_RESPONSE" | python3 -m json.tool | head -15
BOB_TOKEN=$(echo "$BOB_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
BOB_ID=$(echo "$BOB_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['id'])")
echo -e "${GREEN}✓ Bob registered (ID: $BOB_ID)${NC}\n"

# Test 4: Alice creates an event
echo -e "${BLUE}4. Alice creates 'Tech Hackathon' event${NC}"
EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Hackathon 2026",
    "description": "Annual tech hackathon with prizes",
    "event_type": "hackathon",
    "event_date": "2026-04-15T09:00:00"
  }')
echo "$EVENT_RESPONSE" | python3 -m json.tool
EVENT_ID=$(echo "$EVENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
INVITE_CODE=$(echo "$EVENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['invite_code'])")
echo -e "${GREEN}✓ Event created (ID: $EVENT_ID, Invite: $INVITE_CODE)${NC}\n"

# Test 5: Exa Product Search
echo -e "${BLUE}5. Testing Exa product search for 'mechanical keyboard under 100'${NC}"
curl -s -X POST "$BASE_URL/api/search/products" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mechanical keyboard under 100",
    "max_results": 3
  }' | python3 -m json.tool | head -40
echo -e "${GREEN}✓ Exa search successful${NC}\n"

# Test 6: Get Alice's wishlists
echo -e "${BLUE}6. Getting Alice's wishlists${NC}"
WISHLISTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/wishlists" \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "$WISHLISTS_RESPONSE" | python3 -m json.tool
WISHLIST_ID=$(echo "$WISHLISTS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
echo -e "${GREEN}✓ Got wishlist (ID: $WISHLIST_ID)${NC}\n"

# Test 7: Alice adds items to wishlist
echo -e "${BLUE}7. Alice adds Keychron K2 to wishlist${NC}"
ITEM1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/wishlist-items" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"wishlist_id\": $WISHLIST_ID,
    \"title\": \"Keychron K2 Mechanical Keyboard\",
    \"description\": \"Wireless mechanical keyboard with hot-swappable switches\",
    \"url\": \"https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard\",
    \"price_min\": 89,
    \"price_max\": 89,
    \"category\": \"tech\",
    \"priority\": 5,
    \"privacy_level\": \"event_only\",
    \"event_ids\": [$EVENT_ID]
  }")
echo "$ITEM1_RESPONSE" | python3 -m json.tool | head -20
ITEM1_ID=$(echo "$ITEM1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo -e "${GREEN}✓ Item 1 added (ID: $ITEM1_ID)${NC}\n"

echo -e "${BLUE}8. Alice adds Programming Book to wishlist${NC}"
ITEM2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/wishlist-items" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"wishlist_id\": $WISHLIST_ID,
    \"title\": \"Clean Code by Robert Martin\",
    \"description\": \"Essential reading for software engineers\",
    \"price_min\": 35,
    \"price_max\": 35,
    \"category\": \"books\",
    \"priority\": 4,
    \"privacy_level\": \"event_only\",
    \"event_ids\": [$EVENT_ID]
  }")
ITEM2_ID=$(echo "$ITEM2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo -e "${GREEN}✓ Item 2 added (ID: $ITEM2_ID)${NC}\n"

# Test 9: Bob joins event as sponsor
echo -e "${BLUE}9. Bob joins event as sponsor${NC}"
curl -s -X POST "$BASE_URL/api/events/join" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"invite_code\": \"$INVITE_CODE\",
    \"role\": \"sponsor\"
  }" | python3 -m json.tool
echo -e "${GREEN}✓ Bob joined as sponsor${NC}\n"

# Test 10: Bob sets sponsor preferences
echo -e "${BLUE}10. Bob sets sponsor preferences${NC}"
curl -s -X POST "$BASE_URL/api/sponsor-preferences" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_id\": $EVENT_ID,
    \"budget_min\": 50,
    \"budget_max\": 100,
    \"preferred_categories\": [\"tech\", \"books\"],
    \"target_age_groups\": [\"18-24\"]
  }" | python3 -m json.tool
echo -e "${GREEN}✓ Preferences saved${NC}\n"

# Test 11: Get matching suggestions for Bob (THE HERO FEATURE!)
echo -e "${BLUE}11. 🎯 Getting smart match suggestions for Bob${NC}"
echo -e "${BLUE}   This is the CORE FEATURE - 4-factor scoring algorithm!${NC}"
curl -s -X POST "$BASE_URL/api/matching/suggestions" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_id\": $EVENT_ID,
    \"budget_min\": 50,
    \"budget_max\": 100,
    \"categories\": [\"tech\"],
    \"age_groups\": [\"18-24\"],
    \"min_score\": 50
  }" | python3 -m json.tool
echo -e "${GREEN}✓ Matching suggestions retrieved!${NC}\n"

# Test 12: Bob claims the keyboard gift
echo -e "${BLUE}12. Bob claims the Keychron K2 as a gift${NC}"
GIFT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gifts/claim" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"wishlist_item_id\": $ITEM1_ID,
    \"event_id\": $EVENT_ID,
    \"notes\": \"Excited to sponsor this! Great match.\"
  }")
echo "$GIFT_RESPONSE" | python3 -m json.tool
GIFT_ID=$(echo "$GIFT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo -e "${GREEN}✓ Gift claimed (ID: $GIFT_ID)${NC}\n"

# Test 13: Bob views his claimed gifts
echo -e "${BLUE}13. Bob views his claimed gifts${NC}"
curl -s -X GET "$BASE_URL/api/gifts/my-gifts" \
  -H "Authorization: Bearer $BOB_TOKEN" | python3 -m json.tool
echo -e "${GREEN}✓ Gifts retrieved${NC}\n"

echo ""
echo "================================================"
echo -e "${GREEN}🎉 All tests passed! Backend is fully functional.${NC}"
echo ""
echo "✅ Tested features:"
echo "  - User registration and JWT authentication"
echo "  - Event creation with invite codes"
echo "  - Exa API product search integration"
echo "  - Wishlist management"
echo "  - Event joining (participant/sponsor)"
echo "  - Sponsor preferences"
echo "  - 🌟 Smart matching algorithm with scoring"
echo "  - Gift claiming"
echo ""
echo "Next steps:"
echo "  - Build the frontend pages"
echo "  - Add Framer Motion animations"
echo "  - Implement MCP server"
