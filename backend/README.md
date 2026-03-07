# Gift Portal Backend

FastAPI backend for smart gift matching platform.

## Features

- ✅ JWT Authentication
- ✅ 8-table database schema (SQLite)
- ✅ Smart matching algorithm (4-factor scoring)
- ✅ Exa API integration for product discovery
- ✅ Event-based wishlists with privacy controls
- ✅ Sponsor preferences and matching

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your EXA_API_KEY
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

   Or with uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Access the API:**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - OpenAPI: http://localhost:8000/openapi.json

## Database Schema

The database uses SQLite with 8 tables:

1. **users** - User accounts with demographics
2. **events** - Events (hackathons, birthdays, etc.)
3. **event_participants** - Junction table for event participation with roles
4. **wishlists** - User wishlists
5. **wishlist_items** - Individual wishlist items with Exa metadata
6. **wishlist_item_events** - Links items to events
7. **gifts** - Claimed gifts tracking
8. **sponsor_preferences** - Sponsor filtering preferences

Database is auto-created on first run at `./gift.db`.

## API Routes

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user info

### Events
- `POST /api/events` - Create event
- `GET /api/events` - List my events
- `GET /api/events/{id}` - Get event details
- `POST /api/events/join` - Join event with invite code

### Wishlists
- `GET /api/wishlists` - List my wishlists
- `GET /api/wishlists/{id}/items` - List wishlist items
- `POST /api/wishlist-items` - Create wishlist item
- `PATCH /api/wishlist-items/{id}` - Update item
- `DELETE /api/wishlist-items/{id}` - Delete item

### Matching (Core Feature!)
- `POST /api/matching/suggestions` - Get match suggestions ⭐
- `POST /api/sponsor-preferences` - Save preferences
- `GET /api/sponsor-preferences/{event_id}` - Get preferences

### Gifts
- `POST /api/gifts/claim` - Claim a gift
- `GET /api/gifts/my-gifts` - List my claimed gifts

### Product Search (Exa Integration)
- `POST /api/search/products` - Search products via Exa ⭐

## Matching Algorithm

The smart matching algorithm scores each wishlist item on 4 factors:

1. **Budget Fit (40 points)**: How well the item price fits sponsor budget
2. **Category Match (30 points)**: Category alignment with preferences
3. **Demographics (20 points)**: Age group and interests match
4. **Priority (10 points)**: User's priority rating (1-5 stars)

**Total Score: 0-100 points**

Matches are returned sorted by score with detailed breakdowns and AI-generated explanations.

## Architecture

```
backend/
├── main.py              # FastAPI app + routes
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic validation schemas
├── database.py          # Database connection
├── auth.py              # JWT + password hashing
├── exa_service.py       # Exa API integration
├── matching_service.py  # Scoring algorithm ⭐
├── requirements.txt
└── gift.db              # SQLite database (auto-created)
```

## Development Notes

- Database tables are auto-created on first run
- JWT tokens expire after 7 days (for hackathon convenience)
- CORS is open to all origins (change in production)
- Echo mode is enabled for SQL queries (set `echo=False` in production)

## Testing

Use the interactive API docs at http://localhost:8000/docs to test all endpoints.

Example flow:
1. Register a user
2. Create an event
3. Add wishlist items
4. Join event as sponsor
5. Get match suggestions
6. Claim a gift
