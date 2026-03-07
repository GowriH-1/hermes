"""SQLAlchemy database models for Gift Portal."""

from datetime import datetime
from typing import List

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    """User model with demographic information."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)

    # Demographics
    age_group = Column(String)  # '18-24', '25-34', '35-44', '45-54', '55+'
    interests = Column(JSON, default=list)  # ['tech', 'gaming', 'books', 'sports']

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    created_events = relationship("Event", back_populates="creator", foreign_keys="Event.created_by")
    event_participations = relationship("EventParticipant", back_populates="user")
    wishlists = relationship("Wishlist", back_populates="user")
    sponsored_gifts = relationship("Gift", back_populates="sponsor", foreign_keys="Gift.sponsor_id")
    sponsor_preferences = relationship("SponsorPreference", back_populates="user")


class Event(Base):
    """Event model for hackathons, birthdays, etc."""

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    event_type = Column(String, nullable=False)  # 'hackathon', 'birthday', 'wedding', 'other'
    event_date = Column(DateTime)
    website_url = Column(String)
    brand_info = Column(JSON, default=dict)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    website_url = Column(String)
    brand_info = Column(JSON, default=dict)  # Stores colors, logo, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_events", foreign_keys=[created_by])
    participants = relationship("EventParticipant", back_populates="event")
    gifts = relationship("Gift", back_populates="event")
    prizes = relationship("EventPrize", back_populates="event")
    wishlist_items = relationship("WishlistItemEvent", back_populates="event")
    sponsor_preferences = relationship("SponsorPreference", back_populates="event")


class EventParticipant(Base):
    """Junction table for event participation with roles."""

    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # 'participant' or 'sponsor'
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="participants")
    user = relationship("User", back_populates="event_participations")

    # Ensure a user can only join an event once
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="unique_event_user"),)


class Wishlist(Base):
    """Wishlist model - container for wishlist items."""

    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    is_default = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="wishlists")
    items = relationship("WishlistItem", back_populates="wishlist", cascade="all, delete-orphan")


class WishlistItem(Base):
    """Wishlist item model with Exa metadata and privacy settings."""

    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    wishlist_id = Column(Integer, ForeignKey("wishlists.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    url = Column(String)
    image_url = Column(String)
    price_min = Column(Float)
    price_max = Column(Float)
    category = Column(String, index=True)  # 'tech', 'books', 'gaming', 'fashion', 'sports', 'other'
    priority = Column(Integer, default=3)  # 1-5 (1=low, 5=high)
    privacy_level = Column(String, default="public")  # 'public' or 'event_only'

    # Exa metadata - store product discovery data
    exa_metadata = Column(JSON, default=dict)  # Store Exa product data

    is_fulfilled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    wishlist = relationship("Wishlist", back_populates="items")
    events = relationship("WishlistItemEvent", back_populates="wishlist_item", cascade="all, delete-orphan")
    gifts = relationship("Gift", back_populates="wishlist_item", cascade="all, delete-orphan")


class WishlistItemEvent(Base):
    """Junction table linking wishlist items to events."""

    __tablename__ = "wishlist_item_events"

    wishlist_item_id = Column(Integer, ForeignKey("wishlist_items.id"), primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), primary_key=True)

    # Relationships
    wishlist_item = relationship("WishlistItem", back_populates="events")
    event = relationship("Event", back_populates="wishlist_items")


class Gift(Base):
    """Gift model tracking claimed and fulfilled items."""

    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    wishlist_item_id = Column(Integer, ForeignKey("wishlist_items.id"), nullable=False)
    sponsor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    status = Column(String, default="claimed")  # 'claimed' or 'fulfilled'
    notes = Column(Text)
    claimed_at = Column(DateTime, default=datetime.utcnow)
    fulfilled_at = Column(DateTime)

    # Relationships
    wishlist_item = relationship("WishlistItem", back_populates="gifts")
    sponsor = relationship("User", back_populates="sponsored_gifts", foreign_keys=[sponsor_id])
    event = relationship("Event", back_populates="gifts")


class EventPrize(Base):
    """Organizer-managed prizes for events."""

    __tablename__ = "event_prizes"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    url = Column(String)  # Product link
    image_url = Column(String)
    price = Column(Float)
    category = Column(String)
    exa_metadata = Column(JSON, default=dict)  # Store Exa search score, etc.
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Organizer who added it
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Winner/recipient
    status = Column(String, default="available")  # 'available', 'assigned', 'fulfilled'
    assigned_at = Column(DateTime, nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    notes = Column(Text)  # Organizer notes
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="prizes")
    creator = relationship("User", foreign_keys=[created_by])
    recipient = relationship("User", foreign_keys=[recipient_id])


class SponsorPreference(Base):
    """Sponsor preferences for smart matching."""

    __tablename__ = "sponsor_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    budget_min = Column(Float, default=0)
    budget_max = Column(Float, default=1000)
    preferred_categories = Column(JSON, default=list)  # ['tech', 'books']
    target_age_groups = Column(JSON, default=list)  # ['18-24', '25-34']

    # Relationships
    user = relationship("User", back_populates="sponsor_preferences")
    event = relationship("Event", back_populates="sponsor_preferences")

    # One preference set per user per event
    __table_args__ = (UniqueConstraint("user_id", "event_id", name="unique_user_event_preference"),)
