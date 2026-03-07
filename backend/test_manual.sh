#!/bin/bash
# Manual integration test script for Gift Portal API

set -e  # Exit on error

API_URL="http://localhost:8000"
echo "🧪 Testing Gift Portal API at $API_URL"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local headers="$6"

    echo -n "Testing: $name... "

    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" \
            $headers)
    fi

    status=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        ((PASSED++))
        echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
        echo "$body"
        ((FAILED++))
    fi
    echo ""
}

echo ""
echo "1. Authentication Tests"
echo "-----------------------"

# Test 1: Register User
test_endpoint "Register User" "POST" "/auth/register" \
    '{"email":"test@example.com","password":"password123","full_name":"Test User","username":"testuser","age_group":"25-34","interests":["tech","gaming"]}' \
    "200"

# Test 2: Login User
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful, got token${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Login failed, no token${NC}"
    ((FAILED++))
fi
echo ""

# Test 3: Get Current User
test_endpoint "Get Current User" "GET" "/auth/me" "" "200" "-H 'Authorization: Bearer $TOKEN'"

echo ""
echo "2. Event Tests"
echo "--------------"

# Test 4: Create Event
EVENT_RESPONSE=$(curl -s -X POST "$API_URL/api/events" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Hackathon","event_type":"hackathon","description":"A test event","event_date":"2026-03-15T00:00:00"}')

EVENT_ID=$(echo $EVENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
INVITE_CODE=$(echo $EVENT_RESPONSE | grep -o '"invite_code":"[^"]*' | cut -d'"' -f4)

if [ -n "$EVENT_ID" ] && [ -n "$INVITE_CODE" ]; then
    echo -e "${GREEN}✓ Event created${NC} (ID: $EVENT_ID, Code: $INVITE_CODE)"
    ((PASSED++))
else
    echo -e "${RED}✗ Event creation failed${NC}"
    echo "$EVENT_RESPONSE"
    ((FAILED++))
fi
echo ""

# Test 5: List My Events
test_endpoint "List My Events" "GET" "/api/events" "" "200" "-H 'Authorization: Bearer $TOKEN'"

echo ""
echo "3. Wishlist Tests"
echo "-----------------"

# Test 6: Create Wishlist Item
ITEM_RESPONSE=$(curl -s -X POST "$API_URL/api/wishlist-items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Mechanical Keyboard\",\"description\":\"A nice keyboard\",\"price_min\":89.99,\"category\":\"tech\",\"priority\":5,\"privacy_level\":\"event_only\",\"event_ids\":[$EVENT_ID]}")

ITEM_ID=$(echo $ITEM_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$ITEM_ID" ]; then
    echo -e "${GREEN}✓ Wishlist item created${NC} (ID: $ITEM_ID)"
    ((PASSED++))
else
    echo -e "${RED}✗ Wishlist item creation failed${NC}"
    echo "$ITEM_RESPONSE"
    ((FAILED++))
fi
echo ""

# Test 7: List Wishlist Items
test_endpoint "List Wishlist Items" "GET" "/api/wishlist-items" "" "200" "-H 'Authorization: Bearer $TOKEN'"

echo ""
echo "4. Product Search Tests"
echo "-----------------------"

# Test 8: Search Products (Exa Mock)
test_endpoint "Search Products" "POST" "/api/search/products" \
    '{"query":"keyboard","max_results":5}' \
    "200" "-H 'Authorization: Bearer $TOKEN'"

echo ""
echo "5. Matching Tests"
echo "-----------------"

# Register sponsor user
SPONSOR_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"sponsor@example.com","password":"password123","full_name":"Sponsor User","username":"sponsor","age_group":"25-34"}')

SPONSOR_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"sponsor@example.com","password":"password123"}')

SPONSOR_TOKEN=$(echo $SPONSOR_LOGIN | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Sponsor joins event
curl -s -X POST "$API_URL/api/events/join" \
    -H "Authorization: Bearer $SPONSOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"invite_code\":\"$INVITE_CODE\",\"role\":\"sponsor\"}" > /dev/null

# Test 9: Get Match Suggestions
MATCH_RESPONSE=$(curl -s -X POST "$API_URL/api/matching/suggestions" \
    -H "Authorization: Bearer $SPONSOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"event_id\":$EVENT_ID,\"budget_min\":50,\"budget_max\":150,\"categories\":[\"tech\"],\"age_groups\":[\"25-34\"]}")

MATCH_COUNT=$(echo $MATCH_RESPONSE | grep -o '"matches":\[' | wc -l)

if [ "$MATCH_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Matching suggestions returned${NC}"
    echo "$MATCH_RESPONSE" | head -c 500
    ((PASSED++))
else
    echo -e "${RED}✗ Matching failed${NC}"
    echo "$MATCH_RESPONSE"
    ((FAILED++))
fi
echo ""

echo ""
echo "========================================="
echo "📊 Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
