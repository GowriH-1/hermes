"""Pydantic schemas for request/response validation."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ============================================================================
# User Schemas
# ============================================================================


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    username: str = Field(..., min_length=3)
    age_group: Optional[str] = None
    interests: List[str] = []


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user data in responses."""

    id: int
    email: str
    full_name: str
    username: str
    age_group: Optional[str]
    interests: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================================
# Event Schemas
# ============================================================================


class EventCreate(BaseModel):
    """Schema for creating an event."""

    name: str
    description: Optional[str] = None
    event_type: str  # 'hackathon', 'birthday', 'wedding', 'other'
    event_date: Optional[datetime] = None
    budget: Optional[float] = 0


class EventJoin(BaseModel):
    """Schema for joining an event."""

    invite_code: str
    role: str = Field(..., pattern="^(participant|sponsor)$")


class EventUpdate(BaseModel):
    """Schema for updating event details."""

    budget: Optional[float] = None


class EventResponse(BaseModel):
    """Schema for event data in responses."""

    id: int
    name: str
    description: Optional[str]
    event_type: str
    event_date: Optional[datetime]
    created_by: int
    invite_code: str
    budget: Optional[float] = 0
    created_at: datetime
    participant_count: Optional[int] = None
    role: Optional[str] = None  # User's role in this event (participant/sponsor)

    class Config:
        from_attributes = True


# ============================================================================
# Wishlist Schemas
# ============================================================================


class WishlistCreate(BaseModel):
    """Schema for creating a wishlist."""

    name: str
    description: Optional[str] = None
    is_default: bool = True


class WishlistResponse(BaseModel):
    """Schema for wishlist data in responses."""

    id: int
    user_id: int
    name: str
    description: Optional[str]
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Wishlist Item Schemas
# ============================================================================


class WishlistItemCreate(BaseModel):
    """Schema for creating a wishlist item."""

    wishlist_id: int
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    category: Optional[str] = None
    priority: int = Field(default=3, ge=1, le=5)
    privacy_level: str = Field(default="public", pattern="^(public|event_only)$")
    exa_metadata: dict = {}
    event_ids: List[int] = []  # Events to link this item to


class WishlistItemUpdate(BaseModel):
    """Schema for updating a wishlist item."""

    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    category: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    privacy_level: Optional[str] = Field(None, pattern="^(public|event_only)$")
    exa_metadata: Optional[dict] = None
    event_ids: Optional[List[int]] = None


class WishlistItemResponse(BaseModel):
    """Schema for wishlist item data in responses."""

    id: int
    wishlist_id: int
    title: str
    description: Optional[str]
    url: Optional[str]
    image_url: Optional[str]
    price_min: Optional[float]
    price_max: Optional[float]
    category: Optional[str]
    priority: int
    privacy_level: str
    exa_metadata: dict
    is_fulfilled: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Gift Schemas
# ============================================================================


class GiftClaim(BaseModel):
    """Schema for claiming a gift."""

    wishlist_item_id: int
    event_id: int
    notes: Optional[str] = None


class GiftResponse(BaseModel):
    """Schema for gift data in responses."""

    id: int
    wishlist_item_id: int
    sponsor_id: int
    event_id: int
    status: str
    notes: Optional[str]
    claimed_at: datetime
    fulfilled_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# Event Prize Schemas (Organizer)
# ============================================================================


class EventPrizeCreate(BaseModel):
    """Schema for creating an event prize."""

    event_id: int
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    exa_metadata: dict = {}
    notes: Optional[str] = None


class EventPrizeUpdate(BaseModel):
    """Schema for updating an event prize."""

    title: Optional[str] = None
    description: Optional[str] = None
    recipient_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EventPrizeResponse(BaseModel):
    """Schema for event prize in responses."""

    id: int
    event_id: int
    title: str
    description: Optional[str]
    url: Optional[str]
    image_url: Optional[str]
    price: Optional[float]
    category: Optional[str]
    exa_metadata: dict
    created_by: int
    recipient_id: Optional[int]
    status: str
    rank: Optional[int]
    assigned_at: Optional[datetime]
    fulfilled_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Sponsor Preference Schemas
# ============================================================================


class SponsorPreferenceCreate(BaseModel):
    """Schema for creating/updating sponsor preferences."""

    event_id: int
    budget_min: float = 0
    budget_max: float = 1000
    preferred_categories: List[str] = []
    target_age_groups: List[str] = []


class SponsorPreferenceResponse(BaseModel):
    """Schema for sponsor preference data in responses."""

    id: int
    user_id: int
    event_id: int
    budget_min: float
    budget_max: float
    preferred_categories: List[str]
    target_age_groups: List[str]

    class Config:
        from_attributes = True


# ============================================================================
# Matching Schemas
# ============================================================================


class MatchFilters(BaseModel):
    """Schema for sponsor match filtering."""

    event_id: int
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    categories: List[str] = []
    age_groups: List[str] = []
    min_score: float = Field(default=50, ge=0, le=100)


class ScoreBreakdown(BaseModel):
    """Schema for match score breakdown."""

    budget_score: float
    category_score: float
    demographics_score: float
    priority_score: float
    total_score: float


class MatchSuggestion(BaseModel):
    """Schema for a single match suggestion."""

    wishlist_item: WishlistItemResponse
    user: UserResponse
    score_breakdown: ScoreBreakdown
    explanation: str


class MatchResponse(BaseModel):
    """Schema for match suggestions response."""

    matches: List[MatchSuggestion]
    total_count: int


# ============================================================================
# Exa Product Search Schemas
# ============================================================================


class ExaProduct(BaseModel):
    """Schema for Exa product search result."""

    title: str
    url: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    score: Optional[float] = None


class ExaSearchRequest(BaseModel):
    """Schema for Exa product search request."""

    query: str
    max_results: int = Field(default=10, le=20)
    price_min: Optional[float] = None
    price_max: Optional[float] = None


class ExaSearchResponse(BaseModel):
    """Schema for Exa product search response."""

    products: List[ExaProduct]
    query: str
    total_results: int
