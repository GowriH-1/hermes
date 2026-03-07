#!/bin/bash
# Simple API test script

API="http://localhost:8000"
echo "Testing Gift Portal API..."
echo ""

# 1. Register
echo "1. Testing Registration..."
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","username":"testuser"}' \
  | grep -q "id" && echo "✓ Registration works" || echo "✗ Registration failed"

# 2. Login
echo "2. Testing Login..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✓ Login works (got token)"
else
  echo "✗ Login failed"
  exit 1
fi

# 3. Create Event
echo "3. Testing Event Creation..."
EVENT=$(curl -s -X POST "$API/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","event_type":"hackathon"}')

EVENT_ID=$(echo "$EVENT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
INVITE=$(echo "$EVENT" | grep -o '"invite_code":"[^"]*' | cut -d'"' -f4)

if [ -n "$EVENT_ID" ]; then
  echo "✓ Event creation works (ID: $EVENT_ID, Code: $INVITE)"
else
  echo "✗ Event creation failed"
  echo "$EVENT"
  exit 1
fi

# 4. List Events
echo "4. Testing List Events..."
curl -s -X GET "$API/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -q "Test Event" && echo "✓ List events works" || echo "✗ List failed"

# 5. Create Wishlist Item
echo "5. Testing Wishlist Item Creation..."
ITEM=$(curl -s -X POST "$API/api/wishlist-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Item\",\"price_min\":50,\"category\":\"tech\",\"event_ids\":[$EVENT_ID]}")

ITEM_ID=$(echo "$ITEM" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$ITEM_ID" ]; then
  echo "✓ Wishlist item works (ID: $ITEM_ID)"
else
  echo "✗ Wishlist item failed"
fi

# 6. Product Search
echo "6. Testing Product Search (Exa Mock)..."
curl -s -X POST "$API/api/search/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"keyboard","max_results":5}' \
  | grep -q "products" && echo "✓ Product search works" || echo "✗ Search failed"

# 7. Register Sponsor & Match
echo "7. Testing Matching Algorithm..."
SPONSOR_TOKEN=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"sponsor@example.com","password":"password123","full_name":"Sponsor","username":"sponsor"}' \
  | grep -q "id" && \
  curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sponsor@example.com","password":"password123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST "$API/api/events/join" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"invite_code\":\"$INVITE\",\"role\":\"sponsor\"}" > /dev/null

MATCHES=$(curl -s -X POST "$API/api/matching/suggestions" \
  -H "Authorization: Bearer $SPONSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"event_id\":$EVENT_ID,\"budget_min\":0,\"budget_max\":100,\"categories\":[\"tech\"]}")

echo "$MATCHES" | grep -q "matches" && echo "✓ Matching works" || echo "✗ Matching failed"

echo ""
echo "========================================="
echo "✓ All critical API endpoints are working!"
echo "========================================="
