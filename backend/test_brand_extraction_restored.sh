#!/bin/bash
# Brand extraction verification script

API="http://localhost:8000"
echo "Testing Brand Extraction Feature..."
echo ""

# 1. Login/Register
echo "1. Getting Token..."
# Try login, if fails, register
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_restored@example.com","password":"password123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  curl -s -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test_restored@example.com","password":"password123","full_name":"Test User","username":"testuser_restored"}'
  
  TOKEN=$(curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test_restored@example.com","password":"password123"}' \
    | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ]; then
  echo "✓ Token obtained"
else
  echo "✗ Authentication failed"
  exit 1
fi

# 2. Create Event with Website URL
echo "2. Creating Event with Website URL (google.com)..."
EVENT=$(curl -s -X POST "$API/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Google Hackathon Restored","event_type":"hackathon","website_url":"https://google.com"}')

echo "$EVENT" | grep -q '"website_url":"https://google.com"' && echo "✓ Website URL saved" || { echo "✗ Website URL not saved"; echo "$EVENT"; exit 1; }
echo "$EVENT" | grep -q '"brand_info":{' && echo "✓ Brand info extracted" || { echo "✗ Brand info missing"; echo "$EVENT"; exit 1; }
echo "$EVENT" | grep -q '"primary_color":"#4285F4"' && echo "✓ Correct brand color found" || { echo "✗ Brand color incorrect"; echo "$EVENT"; exit 1; }

echo ""
echo "========================================="
echo "✓ Brand extraction feature is restored and working!"
echo "========================================="
