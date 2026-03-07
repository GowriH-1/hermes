"""Integration tests for Gift Portal API."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Set test environment variables before importing
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["MOCK_EXA"] = "true"

from main import app
from database import Base, get_db
import models

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ============================================================================
# Authentication Tests
# ============================================================================


def test_register_user():
    """Test user registration."""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "username": "testuser",
            "age_group": "25-34",
            "interests": ["tech", "gaming"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data


def test_register_duplicate_email():
    """Test registering with duplicate email fails."""
    user_data = {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "username": "testuser",
    }
    # First registration succeeds
    response1 = client.post("/auth/register", json=user_data)
    assert response1.status_code == 200

    # Second registration with same email fails
    response2 = client.post("/auth/register", json=user_data)
    assert response2.status_code == 400


def test_login_user():
    """Test user login."""
    # Register user first
    client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "username": "testuser",
        },
    )

    # Login
    response = client.post(
        "/auth/login", json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password():
    """Test login with wrong password fails."""
    # Register user
    client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "username": "testuser",
        },
    )

    # Login with wrong password
    response = client.post(
        "/auth/login", json={"email": "test@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


# ============================================================================
# Event Tests
# ============================================================================


def get_auth_headers():
    """Helper to get authentication headers."""
    # Register and login
    client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "username": "testuser",
        },
    )
    response = client.post(
        "/auth/login", json={"email": "test@example.com", "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_event():
    """Test creating an event."""
    headers = get_auth_headers()

    response = client.post(
        "/api/events",
        headers=headers,
        json={
            "name": "Test Hackathon",
            "event_type": "hackathon",
            "description": "A test hackathon event",
            "event_date": "2026-03-15T00:00:00",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Hackathon"
    assert data["event_type"] == "hackathon"
    assert "invite_code" in data
    assert len(data["invite_code"]) > 0


def test_list_my_events():
    """Test listing user's events."""
    headers = get_auth_headers()

    # Create an event
    create_response = client.post(
        "/api/events",
        headers=headers,
        json={
            "name": "Test Hackathon",
            "event_type": "hackathon",
        },
    )
    assert create_response.status_code == 200

    # List events
    list_response = client.get("/api/events", headers=headers)
    assert list_response.status_code == 200
    events = list_response.json()
    assert len(events) == 1
    assert events[0]["name"] == "Test Hackathon"
    assert events[0]["role"] == "participant"  # Creator auto-joins as participant


def test_join_event():
    """Test joining an event with invite code."""
    # User 1 creates event
    headers1 = get_auth_headers()
    create_response = client.post(
        "/api/events",
        headers=headers1,
        json={"name": "Test Event", "event_type": "hackathon"},
    )
    invite_code = create_response.json()["invite_code"]

    # User 2 joins event
    client.post(
        "/auth/register",
        json={
            "email": "user2@example.com",
            "password": "password123",
            "full_name": "User Two",
            "username": "usertwo",
        },
    )
    login_response = client.post(
        "/auth/login", json={"email": "user2@example.com", "password": "password123"}
    )
    headers2 = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    join_response = client.post(
        "/api/events/join",
        headers=headers2,
        json={"invite_code": invite_code, "role": "sponsor"},
    )
    assert join_response.status_code == 200
    assert join_response.json()["name"] == "Test Event"

    # Verify user2 sees the event with sponsor role
    list_response = client.get("/api/events", headers=headers2)
    events = list_response.json()
    assert len(events) == 1
    assert events[0]["role"] == "sponsor"


def test_join_event_invalid_code():
    """Test joining with invalid invite code fails."""
    headers = get_auth_headers()

    response = client.post(
        "/api/events/join",
        headers=headers,
        json={"invite_code": "INVALID123", "role": "participant"},
    )
    assert response.status_code == 404


# ============================================================================
# Wishlist Tests
# ============================================================================


def test_create_wishlist_item():
    """Test creating a wishlist item."""
    headers = get_auth_headers()

    # Create event first
    event_response = client.post(
        "/api/events",
        headers=headers,
        json={"name": "Test Event", "event_type": "hackathon"},
    )
    event_id = event_response.json()["id"]

    # Create wishlist item
    response = client.post(
        "/api/wishlist-items",
        headers=headers,
        json={
            "title": "Mechanical Keyboard",
            "description": "A nice keyboard for coding",
            "url": "https://example.com/keyboard",
            "price_min": 89.99,
            "category": "tech",
            "priority": 5,
            "privacy_level": "event_only",
            "event_ids": [event_id],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Mechanical Keyboard"
    assert data["price_min"] == 89.99


def test_list_wishlist_items():
    """Test listing wishlist items."""
    headers = get_auth_headers()

    # Create item
    client.post(
        "/api/wishlist-items",
        headers=headers,
        json={
            "title": "Test Item",
            "price_min": 50.0,
            "category": "tech",
        },
    )

    # List items
    response = client.get("/api/wishlist-items", headers=headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 1
    assert items[0]["title"] == "Test Item"


# ============================================================================
# Matching Tests
# ============================================================================


def test_get_match_suggestions():
    """Test smart matching algorithm."""
    # Create participant with wishlist item
    participant_headers = get_auth_headers()
    event_response = client.post(
        "/api/events",
        headers=participant_headers,
        json={"name": "Test Event", "event_type": "hackathon"},
    )
    event_id = event_response.json()["id"]
    invite_code = event_response.json()["invite_code"]

    # Add wishlist item
    client.post(
        "/api/wishlist-items",
        headers=participant_headers,
        json={
            "title": "Mechanical Keyboard",
            "price_min": 89.0,
            "category": "tech",
            "priority": 5,
            "privacy_level": "event_only",
            "event_ids": [event_id],
        },
    )

    # Create sponsor and join event
    client.post(
        "/auth/register",
        json={
            "email": "sponsor@example.com",
            "password": "password123",
            "full_name": "Sponsor User",
            "username": "sponsor",
            "age_group": "25-34",
        },
    )
    sponsor_login = client.post(
        "/auth/login", json={"email": "sponsor@example.com", "password": "password123"}
    )
    sponsor_headers = {
        "Authorization": f"Bearer {sponsor_login.json()['access_token']}"
    }

    # Join as sponsor
    client.post(
        "/api/events/join",
        headers=sponsor_headers,
        json={"invite_code": invite_code, "role": "sponsor"},
    )

    # Get match suggestions
    response = client.post(
        "/api/matching/suggestions",
        headers=sponsor_headers,
        json={
            "event_id": event_id,
            "budget_min": 50,
            "budget_max": 150,
            "categories": ["tech"],
            "age_groups": ["25-34"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) == 1
    assert data["matches"][0]["wishlist_item"]["title"] == "Mechanical Keyboard"
    assert data["matches"][0]["score_breakdown"]["total_score"] > 0


# ============================================================================
# Product Search Tests (Exa Mock)
# ============================================================================


def test_search_products():
    """Test product search with Exa (mock mode)."""
    headers = get_auth_headers()

    response = client.post(
        "/api/search/products",
        headers=headers,
        json={"query": "keyboard", "max_results": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert len(data["products"]) > 0
    # Should return mock keyboard products
    assert "keyboard" in data["products"][0]["title"].lower()


# ============================================================================
# Gift Claiming Tests
# ============================================================================


def test_claim_gift():
    """Test claiming a gift."""
    # Setup: participant with item, sponsor joining event
    participant_headers = get_auth_headers()
    event_response = client.post(
        "/api/events",
        headers=participant_headers,
        json={"name": "Test Event", "event_type": "hackathon"},
    )
    event_id = event_response.json()["id"]
    invite_code = event_response.json()["invite_code"]

    item_response = client.post(
        "/api/wishlist-items",
        headers=participant_headers,
        json={
            "title": "Test Gift",
            "price_min": 50.0,
            "category": "tech",
            "event_ids": [event_id],
        },
    )
    item_id = item_response.json()["id"]

    # Create sponsor
    client.post(
        "/auth/register",
        json={
            "email": "sponsor@example.com",
            "password": "password123",
            "full_name": "Sponsor",
            "username": "sponsor",
        },
    )
    sponsor_login = client.post(
        "/auth/login", json={"email": "sponsor@example.com", "password": "password123"}
    )
    sponsor_headers = {
        "Authorization": f"Bearer {sponsor_login.json()['access_token']}"
    }
    client.post(
        "/api/events/join",
        headers=sponsor_headers,
        json={"invite_code": invite_code, "role": "sponsor"},
    )

    # Claim gift
    claim_response = client.post(
        "/api/gifts/claim",
        headers=sponsor_headers,
        json={"wishlist_item_id": item_id, "event_id": event_id},
    )
    assert claim_response.status_code == 200
    gift_data = claim_response.json()
    assert gift_data["status"] == "claimed"
    assert gift_data["wishlist_item_id"] == item_id


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
