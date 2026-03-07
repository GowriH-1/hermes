"""Main FastAPI application with all routes."""

# IMPORTANT: Load environment variables FIRST before importing auth
from dotenv import load_dotenv
load_dotenv()

import os
import secrets
import string
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import auth
import database
import matching_service
import models
import schemas
from exa_service import get_exa_service

# Load environment variables from .env file
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

# Initialize FastAPI app
app = FastAPI(
    title="Gift Portal API",
    description="Smart gift matching platform for events",
    version="1.0.0",
)

# CORS middleware - allow all origins for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# ============================================================================
# Dependencies
# ============================================================================


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db),
) -> models.User:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = auth.decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def generate_invite_code(length: int = 8) -> str:
    """Generate a random invite code."""
    characters = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(characters) for _ in range(length))


# ============================================================================
# Health Check
# ============================================================================


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Gift Portal API is running"}


# ============================================================================
# Authentication Routes
# ============================================================================


@app.post("/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Register a new user."""
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    existing_username = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create new user
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        username=user_data.username,
        age_group=user_data.age_group,
        interests=user_data.interests,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default wishlist
    default_wishlist = models.Wishlist(
        user_id=new_user.id,
        name=f"{new_user.username}'s Wishlist",
        is_default=True,
    )
    db.add(default_wishlist)
    db.commit()

    # Generate JWT token
    access_token = auth.create_access_token(data={"sub": str(new_user.id)})

    user_response = schemas.UserResponse.model_validate(new_user)
    return schemas.Token(access_token=access_token, user=user_response)


@app.post("/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """Login with email and password."""
    # Find user by email
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate JWT token
    access_token = auth.create_access_token(data={"sub": str(user.id)})

    user_response = schemas.UserResponse.model_validate(user)
    return schemas.Token(access_token=access_token, user=user_response)


@app.get("/auth/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user information."""
    return schemas.UserResponse.model_validate(current_user)


# ============================================================================
# Event Routes
# ============================================================================


@app.post("/api/events", response_model=schemas.EventResponse)
def create_event(
    event_data: schemas.EventCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create a new event."""
    # Generate unique invite code
    invite_code = generate_invite_code()
    while db.query(models.Event).filter(models.Event.invite_code == invite_code).first():
        invite_code = generate_invite_code()

    new_event = models.Event(
        name=event_data.name,
        description=event_data.description,
        event_type=event_data.event_type,
        event_date=event_data.event_date,
        created_by=current_user.id,
        invite_code=invite_code,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Auto-join creator as sponsor (they're giving gifts)
    participation = models.EventParticipant(
        event_id=new_event.id,
        user_id=current_user.id,
        role="sponsor",
    )
    db.add(participation)
    db.commit()

    return schemas.EventResponse.model_validate(new_event)


@app.get("/api/events", response_model=List[schemas.EventResponse])
def list_my_events(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List all events the user is part of."""
    # Get events where user is a participant with role
    participations = (
        db.query(models.Event, models.EventParticipant.role)
        .join(models.EventParticipant, models.Event.id == models.EventParticipant.event_id)
        .filter(models.EventParticipant.user_id == current_user.id)
        .all()
    )

    # Convert to response objects with role and stats
    events_with_roles = []
    for event, role in participations:
        event_dict = schemas.EventResponse.model_validate(event).model_dump()
        event_dict['role'] = role

        # Add participant count
        participant_count = (
            db.query(models.EventParticipant)
            .filter(models.EventParticipant.event_id == event.id)
            .count()
        )
        event_dict['participant_count'] = participant_count

        events_with_roles.append(schemas.EventResponse(**event_dict))

    return events_with_roles


@app.get("/api/events/{event_id}", response_model=schemas.EventResponse)
def get_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get event details."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user is part of event
    participation = (
        db.query(models.EventParticipant)
        .filter(
            models.EventParticipant.event_id == event_id,
            models.EventParticipant.user_id == current_user.id,
        )
        .first()
    )

    if not participation:
        raise HTTPException(status_code=403, detail="Not authorized to view this event")

    return schemas.EventResponse.model_validate(event)


@app.post("/api/events/join", response_model=schemas.EventResponse)
def join_event(
    join_data: schemas.EventJoin,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Join an event with invite code."""
    # Find event by invite code
    event = (
        db.query(models.Event).filter(models.Event.invite_code == join_data.invite_code).first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if already joined
    existing = (
        db.query(models.EventParticipant)
        .filter(
            models.EventParticipant.event_id == event.id,
            models.EventParticipant.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        # Return error if already a member
        raise HTTPException(
            status_code=400,
            detail=f"You are already part of this event as a {existing.role}"
        )

    # Create new participation
    participation = models.EventParticipant(
        event_id=event.id,
        user_id=current_user.id,
        role=join_data.role,
    )
    db.add(participation)
    db.commit()

    return schemas.EventResponse.model_validate(event)


@app.delete("/api/events/{event_id}/leave")
def leave_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Leave an event."""
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Find participation
    participation = (
        db.query(models.EventParticipant)
        .filter(
            models.EventParticipant.event_id == event_id,
            models.EventParticipant.user_id == current_user.id,
        )
        .first()
    )

    if not participation:
        raise HTTPException(status_code=404, detail="You are not part of this event")

    # Check if user created the event and is leaving as sponsor
    if event.created_by == current_user.id and participation.role == "sponsor":
        raise HTTPException(
            status_code=400,
            detail="Cannot leave as sponsor for an event you created. You can leave as a participant if you joined in that role."
        )

    # Delete participation
    db.delete(participation)
    db.commit()

    return {"message": "Successfully left the event"}


@app.get("/api/events/{event_id}/wishlist-items", response_model=List[schemas.WishlistItemResponse])
def get_event_wishlist_items(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get all wishlist items linked to a specific event for the current user."""
    # Verify user is part of the event
    participation = (
        db.query(models.EventParticipant)
        .filter(
            models.EventParticipant.event_id == event_id,
            models.EventParticipant.user_id == current_user.id,
        )
        .first()
    )

    if not participation:
        raise HTTPException(status_code=403, detail="You are not part of this event")

    # Get user's wishlist
    wishlist = (
        db.query(models.Wishlist)
        .filter(
            models.Wishlist.user_id == current_user.id,
            models.Wishlist.is_default == True
        )
        .first()
    )

    if not wishlist:
        return []

    # Get items linked to this event
    items = (
        db.query(models.WishlistItem)
        .join(models.WishlistItemEvent)
        .filter(
            models.WishlistItem.wishlist_id == wishlist.id,
            models.WishlistItemEvent.event_id == event_id
        )
        .all()
    )

    return [schemas.WishlistItemResponse.from_orm(item) for item in items]


# ============================================================================
# Wishlist Routes
# ============================================================================


@app.get("/api/wishlists", response_model=List[schemas.WishlistResponse])
def list_my_wishlists(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List current user's wishlists."""
    wishlists = (
        db.query(models.Wishlist).filter(models.Wishlist.user_id == current_user.id).all()
    )
    return [schemas.WishlistResponse.model_validate(w) for w in wishlists]


@app.get("/api/wishlists/{wishlist_id}/items", response_model=List[schemas.WishlistItemResponse])
def list_wishlist_items(
    wishlist_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List items in a wishlist."""
    wishlist = db.query(models.Wishlist).filter(models.Wishlist.id == wishlist_id).first()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    # Check ownership
    if wishlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    items = (
        db.query(models.WishlistItem)
        .filter(models.WishlistItem.wishlist_id == wishlist_id)
        .all()
    )

    return [schemas.WishlistItemResponse.model_validate(item) for item in items]


@app.post("/api/wishlist-items", response_model=schemas.WishlistItemResponse)
def create_wishlist_item(
    item_data: schemas.WishlistItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create a new wishlist item."""
    # Verify wishlist ownership
    wishlist = db.query(models.Wishlist).filter(models.Wishlist.id == item_data.wishlist_id).first()
    if not wishlist or wishlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create item
    new_item = models.WishlistItem(
        wishlist_id=item_data.wishlist_id,
        title=item_data.title,
        description=item_data.description,
        url=item_data.url,
        image_url=item_data.image_url,
        price_min=item_data.price_min,
        price_max=item_data.price_max,
        category=item_data.category,
        priority=item_data.priority,
        privacy_level=item_data.privacy_level,
        exa_metadata=item_data.exa_metadata,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Link to events
    for event_id in item_data.event_ids:
        link = models.WishlistItemEvent(wishlist_item_id=new_item.id, event_id=event_id)
        db.add(link)

    db.commit()

    return schemas.WishlistItemResponse.model_validate(new_item)


@app.patch("/api/wishlist-items/{item_id}", response_model=schemas.WishlistItemResponse)
def update_wishlist_item(
    item_id: int,
    item_data: schemas.WishlistItemUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Update a wishlist item."""
    item = db.query(models.WishlistItem).filter(models.WishlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Verify ownership
    wishlist = db.query(models.Wishlist).filter(models.Wishlist.id == item.wishlist_id).first()
    if wishlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    if item_data.title is not None:
        item.title = item_data.title
    if item_data.description is not None:
        item.description = item_data.description
    if item_data.url is not None:
        item.url = item_data.url
    if item_data.image_url is not None:
        item.image_url = item_data.image_url
    if item_data.price_min is not None:
        item.price_min = item_data.price_min
    if item_data.price_max is not None:
        item.price_max = item_data.price_max
    if item_data.category is not None:
        item.category = item_data.category
    if item_data.priority is not None:
        item.priority = item_data.priority
    if item_data.privacy_level is not None:
        item.privacy_level = item_data.privacy_level
    if item_data.exa_metadata is not None:
        item.exa_metadata = item_data.exa_metadata

    # Update event links
    if item_data.event_ids is not None:
        # Remove old links
        db.query(models.WishlistItemEvent).filter(
            models.WishlistItemEvent.wishlist_item_id == item_id
        ).delete()
        # Add new links
        for event_id in item_data.event_ids:
            link = models.WishlistItemEvent(wishlist_item_id=item_id, event_id=event_id)
            db.add(link)

    db.commit()
    db.refresh(item)

    return schemas.WishlistItemResponse.model_validate(item)


@app.delete("/api/wishlist-items/{item_id}")
def delete_wishlist_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Delete a wishlist item."""
    item = db.query(models.WishlistItem).filter(models.WishlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Verify ownership
    wishlist = db.query(models.Wishlist).filter(models.Wishlist.id == item.wishlist_id).first()
    if wishlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(item)
    db.commit()

    return {"status": "success"}


# ============================================================================
# Matching Routes (Most Important!)
# ============================================================================


@app.post("/api/matching/suggestions", response_model=schemas.MatchResponse)
def get_match_suggestions(
    filters: schemas.MatchFilters,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get smart match suggestions for sponsor."""
    matcher = matching_service.get_matching_service(db)
    suggestions = matcher.get_sponsor_suggestions(
        sponsor_id=current_user.id,
        event_id=filters.event_id,
        filters=filters,
    )

    return schemas.MatchResponse(matches=suggestions, total_count=len(suggestions))


@app.post("/api/sponsor-preferences", response_model=schemas.SponsorPreferenceResponse)
def save_sponsor_preferences(
    prefs: schemas.SponsorPreferenceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Save or update sponsor preferences for an event."""
    # Check if preferences already exist
    existing = (
        db.query(models.SponsorPreference)
        .filter(
            models.SponsorPreference.user_id == current_user.id,
            models.SponsorPreference.event_id == prefs.event_id,
        )
        .first()
    )

    if existing:
        # Update existing
        existing.budget_min = prefs.budget_min
        existing.budget_max = prefs.budget_max
        existing.preferred_categories = prefs.preferred_categories
        existing.target_age_groups = prefs.target_age_groups
        db.commit()
        db.refresh(existing)
        return schemas.SponsorPreferenceResponse.model_validate(existing)
    else:
        # Create new
        new_prefs = models.SponsorPreference(
            user_id=current_user.id,
            event_id=prefs.event_id,
            budget_min=prefs.budget_min,
            budget_max=prefs.budget_max,
            preferred_categories=prefs.preferred_categories,
            target_age_groups=prefs.target_age_groups,
        )
        db.add(new_prefs)
        db.commit()
        db.refresh(new_prefs)
        return schemas.SponsorPreferenceResponse.model_validate(new_prefs)


@app.get("/api/sponsor-preferences/{event_id}", response_model=schemas.SponsorPreferenceResponse)
def get_sponsor_preferences(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get sponsor preferences for an event."""
    prefs = (
        db.query(models.SponsorPreference)
        .filter(
            models.SponsorPreference.user_id == current_user.id,
            models.SponsorPreference.event_id == event_id,
        )
        .first()
    )

    if not prefs:
        raise HTTPException(status_code=404, detail="No preferences found")

    return schemas.SponsorPreferenceResponse.model_validate(prefs)


# ============================================================================
# Gift Routes
# ============================================================================


@app.post("/api/gifts/claim", response_model=schemas.GiftResponse)
def claim_gift(
    gift_data: schemas.GiftClaim,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Claim a wishlist item as a gift."""
    # Check if item exists
    item = (
        db.query(models.WishlistItem)
        .filter(models.WishlistItem.id == gift_data.wishlist_item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")

    # Check if already claimed
    if item.is_fulfilled:
        raise HTTPException(status_code=400, detail="Item already claimed")

    # Create gift record
    gift = models.Gift(
        wishlist_item_id=gift_data.wishlist_item_id,
        sponsor_id=current_user.id,
        event_id=gift_data.event_id,
        status="claimed",
        notes=gift_data.notes,
    )

    # Mark item as fulfilled
    item.is_fulfilled = True

    db.add(gift)
    db.commit()
    db.refresh(gift)

    return schemas.GiftResponse.model_validate(gift)


@app.get("/api/gifts/my-gifts", response_model=List[schemas.GiftResponse])
def list_my_gifts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List gifts claimed by current user."""
    gifts = db.query(models.Gift).filter(models.Gift.sponsor_id == current_user.id).all()
    return [schemas.GiftResponse.model_validate(gift) for gift in gifts]


# ============================================================================
# Exa Product Search Routes
# ============================================================================


@app.post("/api/search/products", response_model=schemas.ExaSearchResponse)
def search_products(search_request: schemas.ExaSearchRequest):
    """Search for products using Exa API."""
    try:
        exa_service = get_exa_service()
        products = exa_service.search_products(
            query=search_request.query,
            max_results=search_request.max_results,
            price_min=search_request.price_min,
            price_max=search_request.price_max,
        )

        return schemas.ExaSearchResponse(
            products=products,
            query=search_request.query,
            total_results=len(products),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching products: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
