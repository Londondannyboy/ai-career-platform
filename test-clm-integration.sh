#!/bin/bash

echo "🧪 Testing Quest CLM Integration"
echo "================================"

API_URL="https://ai-career-platform.vercel.app"
USER_ID="user_2cNjk7xDvHPeCKhDLxH0GBMqVzI"

echo ""
echo "1️⃣ Checking database status..."
curl -s "$API_URL/api/init-db-simple" | python3 -m json.tool

echo ""
echo "2️⃣ Initializing database (simple)..."
curl -s -X POST "$API_URL/api/init-db-simple" -H "Content-Type: application/json" -d '{}' | python3 -m json.tool

echo ""
echo "3️⃣ Testing CLM with Dan's user ID..."
curl -s -X POST "$API_URL/api/hume-clm" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [
      {\"role\": \"system\", \"content\": \"You are Quest\"},
      {\"role\": \"user\", \"content\": \"Hi, what's my name and what company do I work for?\"}
    ],
    \"user_id\": \"$USER_ID\",
    \"custom_session_id\": \"test_$(date +%s)\"
  }" 2>/dev/null | head -30

echo ""
echo "✅ Test complete!"