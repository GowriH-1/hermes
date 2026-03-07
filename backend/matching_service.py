"""Smart matching service with scoring algorithm."""

from typing import List, Optional

from sqlalchemy.orm import Session

import models
import schemas


class MatchingService:
    """Service for scoring and matching sponsors with wishlist items."""

    def __init__(self, db: Session):
        """Initialize matching service with database session."""
        self.db = db

    def get_sponsor_suggestions(
        self,
        sponsor_id: int,
        event_id: int,
        filters: Optional[schemas.MatchFilters] = None,
    ) -> List[schemas.MatchSuggestion]:
        """
        Get smart match suggestions for a sponsor.

        Args:
            sponsor_id: ID of the sponsor user
            event_id: ID of the event
            filters: Optional additional filters

        Returns:
            List of match suggestions sorted by score (highest first)
        """
        # Get sponsor info
        sponsor = self.db.query(models.User).filter(models.User.id == sponsor_id).first()
        if not sponsor:
            return []

        # Get sponsor preferences for this event
        prefs = (
            self.db.query(models.SponsorPreference)
            .filter(
                models.SponsorPreference.user_id == sponsor_id,
                models.SponsorPreference.event_id == event_id,
            )
            .first()
        )

        # Use filters if provided, otherwise use saved preferences
        budget_min = filters.budget_min if filters and filters.budget_min is not None else (prefs.budget_min if prefs else 0)
        budget_max = filters.budget_max if filters and filters.budget_max is not None else (prefs.budget_max if prefs else 1000)
        categories = filters.categories if filters and filters.categories else (prefs.preferred_categories if prefs else [])
        age_groups = filters.age_groups if filters and filters.age_groups else (prefs.target_age_groups if prefs else [])
        min_score = filters.min_score if filters else 50

        # Get all wishlist items for this event
        # Query through event participants to find their wishlist items
        query = (
            self.db.query(models.WishlistItem, models.User)
            .join(models.Wishlist, models.WishlistItem.wishlist_id == models.Wishlist.id)
            .join(models.User, models.Wishlist.user_id == models.User.id)
            .join(
                models.WishlistItemEvent,
                models.WishlistItem.id == models.WishlistItemEvent.wishlist_item_id,
            )
            .filter(
                models.WishlistItemEvent.event_id == event_id,
                models.WishlistItem.is_fulfilled == False,  # Only unfulfilled items
            )
        )

        # Apply privacy filtering
        # Event-only items are visible, public items are visible
        # (In a more complex system, we'd check friend relationships here)

        results = query.all()

        # Score each item
        suggestions = []
        for item, user in results:
            # Skip items from the sponsor themselves
            if user.id == sponsor_id:
                continue

            # Calculate score
            score_breakdown = self._calculate_score(
                item=item,
                user=user,
                budget_min=budget_min,
                budget_max=budget_max,
                categories=categories,
                age_groups=age_groups,
            )

            # Filter by minimum score
            if score_breakdown.total_score < min_score:
                continue

            # Generate explanation
            explanation = self._generate_explanation(
                item=item,
                user=user,
                score_breakdown=score_breakdown,
                budget_min=budget_min,
                budget_max=budget_max,
            )

            # Convert to response schemas
            item_response = schemas.WishlistItemResponse.from_orm(item)
            user_response = schemas.UserResponse.from_orm(user)

            suggestion = schemas.MatchSuggestion(
                wishlist_item=item_response,
                user=user_response,
                score_breakdown=score_breakdown,
                explanation=explanation,
            )
            suggestions.append(suggestion)

        # Sort by total score (highest first)
        suggestions.sort(key=lambda x: x.score_breakdown.total_score, reverse=True)

        return suggestions

    def _calculate_score(
        self,
        item: models.WishlistItem,
        user: models.User,
        budget_min: float,
        budget_max: float,
        categories: List[str],
        age_groups: List[str],
    ) -> schemas.ScoreBreakdown:
        """
        Calculate match score with breakdown.

        Scoring factors:
        - Budget fit: 40 points
        - Category match: 30 points
        - Demographics: 20 points
        - Priority: 10 points
        Total: 100 points
        """
        budget_score = self._score_budget(item, budget_min, budget_max)
        category_score = self._score_category(item, categories)
        demographics_score = self._score_demographics(user, age_groups)
        priority_score = self._score_priority(item)

        total_score = budget_score + category_score + demographics_score + priority_score

        return schemas.ScoreBreakdown(
            budget_score=round(budget_score, 2),
            category_score=round(category_score, 2),
            demographics_score=round(demographics_score, 2),
            priority_score=round(priority_score, 2),
            total_score=round(total_score, 2),
        )

    def _score_budget(self, item: models.WishlistItem, budget_min: float, budget_max: float) -> float:
        """
        Score budget fit (max 40 points).

        Perfect fit: Item price is within budget
        Partial fit: Item price is close to budget
        No fit: Item price is way outside budget
        """
        # Use average of price range, or price_min if only one is set
        if item.price_max is not None and item.price_min is not None:
            item_price = (item.price_min + item.price_max) / 2
        elif item.price_min is not None:
            item_price = item.price_min
        elif item.price_max is not None:
            item_price = item.price_max
        else:
            # No price info - give neutral score
            return 20.0

        # Perfect fit: within budget
        if budget_min <= item_price <= budget_max:
            # Closer to middle of budget = better score
            budget_mid = (budget_min + budget_max) / 2
            budget_range = budget_max - budget_min
            if budget_range == 0:
                return 40.0
            distance_from_mid = abs(item_price - budget_mid)
            score = 40.0 - (distance_from_mid / budget_range) * 10
            return max(30.0, score)  # Minimum 30 for within budget

        # Too expensive or too cheap
        if item_price > budget_max:
            # Slightly over budget is okay, way over is bad
            overage = item_price - budget_max
            overage_percent = overage / budget_max
            if overage_percent < 0.2:  # Within 20% over
                return 25.0
            elif overage_percent < 0.5:  # Within 50% over
                return 15.0
            else:
                return 5.0
        else:  # item_price < budget_min
            # Too cheap - sponsor might want to spend more
            underage = budget_min - item_price
            underage_percent = underage / budget_min if budget_min > 0 else 1
            if underage_percent < 0.3:  # Within 30% under
                return 20.0
            elif underage_percent < 0.6:  # Within 60% under
                return 10.0
            else:
                return 5.0

    def _score_category(self, item: models.WishlistItem, categories: List[str]) -> float:
        """
        Score category match (max 30 points).

        Perfect match: Item category is in preferred categories
        No match: Item category is not in preferred categories
        """
        if not categories:
            # No category preference - give neutral score
            return 15.0

        if item.category and item.category.lower() in [c.lower() for c in categories]:
            return 30.0

        # Check if item category is related (partial match)
        # For hackathon simplicity, just check if any word matches
        if item.category:
            for cat in categories:
                if cat.lower() in item.category.lower() or item.category.lower() in cat.lower():
                    return 20.0

        return 5.0

    def _score_demographics(self, user: models.User, age_groups: List[str]) -> float:
        """
        Score demographic match (max 20 points).

        Considers age group and interests.
        """
        score = 0.0

        # Age group match (15 points)
        if age_groups:
            if user.age_group and user.age_group in age_groups:
                score += 15.0
            else:
                score += 3.0  # Small score even if no match
        else:
            score += 10.0  # Neutral score if no age preference

        # Interests match (5 points) - could expand this later
        score += 5.0

        return min(20.0, score)

    def _score_priority(self, item: models.WishlistItem) -> float:
        """
        Score based on item priority (max 10 points).

        Priority 5 (high) = 10 points
        Priority 1 (low) = 2 points
        """
        if item.priority is None:
            return 5.0

        # Linear scale: priority 1-5 maps to 2-10 points
        return 2.0 + (item.priority - 1) * 2.0

    def _generate_explanation(
        self,
        item: models.WishlistItem,
        user: models.User,
        score_breakdown: schemas.ScoreBreakdown,
        budget_min: float,
        budget_max: float,
    ) -> str:
        """
        Generate human-readable explanation for the match.

        Args:
            item: Wishlist item
            user: User who owns the item
            score_breakdown: Score breakdown
            budget_min: Sponsor's minimum budget
            budget_max: Sponsor's maximum budget

        Returns:
            Explanation string
        """
        explanations = []

        # Overall quality
        if score_breakdown.total_score >= 85:
            explanations.append("🎯 **Perfect match!**")
        elif score_breakdown.total_score >= 70:
            explanations.append("✨ **Great match!**")
        elif score_breakdown.total_score >= 60:
            explanations.append("👍 **Good match.**")
        else:
            explanations.append("💡 **Potential match.**")

        # User info
        age_info = f"{user.age_group} year old" if user.age_group else "user"
        explanations.append(f"{user.full_name} is a {age_info}")

        # Interests
        if user.interests:
            interests_str = ", ".join(user.interests[:3])
            explanations.append(f"interested in {interests_str}.")

        # Item details
        item_price = None
        if item.price_max is not None and item.price_min is not None:
            item_price = (item.price_min + item.price_max) / 2
            explanations.append(f'They want "{item.title}" (${item_price:.0f}).')
        elif item.price_min is not None:
            item_price = item.price_min
            explanations.append(f'They want "{item.title}" (${item_price:.0f}).')
        else:
            explanations.append(f'They want "{item.title}".')

        # Budget fit
        if score_breakdown.budget_score >= 30:
            explanations.append(
                f"This fits perfectly in your ${budget_min:.0f}-${budget_max:.0f} budget."
            )
        elif score_breakdown.budget_score >= 20:
            explanations.append(f"This is close to your ${budget_min:.0f}-${budget_max:.0f} budget.")

        # Priority
        if item.priority and item.priority >= 4:
            explanations.append("⭐ High priority item for them!")

        return " ".join(explanations)


def get_matching_service(db: Session) -> MatchingService:
    """Create a new MatchingService instance."""
    return MatchingService(db)
