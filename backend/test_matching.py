"""Unit tests for the matching algorithm."""

import pytest
from matching_service import MatchingService
import schemas


class MockItem:
    """Mock wishlist item for testing."""

    def __init__(self, price_min=100, price_max=None, category="tech", priority=3):
        self.price_min = price_min
        self.price_max = price_max or price_min
        self.category = category
        self.priority = priority


class MockUser:
    """Mock user for testing."""

    def __init__(self, age_group="25-34", interests=None):
        self.age_group = age_group
        self.interests = interests or ["tech", "gaming"]


# ============================================================================
# Budget Scoring Tests
# ============================================================================


def test_budget_perfect_match():
    """Test budget scoring when item is within budget range."""
    service = MatchingService(None)
    item = MockItem(price_min=100)

    score = service._score_budget(item, budget_min=50, budget_max=150)

    assert score == 40.0  # Perfect match = 40 points


def test_budget_below_minimum():
    """Test budget scoring when item is below minimum."""
    service = MatchingService(None)
    item = MockItem(price_min=30)

    score = service._score_budget(item, budget_min=50, budget_max=150)

    # Item at $30, min $50 = $20 under = 40% penalty = 24 points
    assert 20 <= score <= 30


def test_budget_above_maximum():
    """Test budget scoring when item is above maximum."""
    service = MatchingService(None)
    item = MockItem(price_min=200)

    score = service._score_budget(item, budget_min=50, budget_max=150)

    # Item at $200, max $150 = $50 over = 33% penalty = ~27 points
    assert 20 <= score <= 30


def test_budget_way_over():
    """Test budget scoring when item is way over budget."""
    service = MatchingService(None)
    item = MockItem(price_min=500)

    score = service._score_budget(item, budget_min=50, budget_max=150)

    # Item at $500, max $150 = way over = low score
    assert score < 10


# ============================================================================
# Category Scoring Tests
# ============================================================================


def test_category_exact_match():
    """Test category scoring with exact match."""
    service = MatchingService(None)
    item = MockItem(category="tech")

    score = service._score_category(item, categories=["tech", "books"])

    assert score == 30.0  # Perfect match


def test_category_no_match():
    """Test category scoring with no match."""
    service = MatchingService(None)
    item = MockItem(category="fashion")

    score = service._score_category(item, categories=["tech", "books"])

    assert score == 0.0


def test_category_no_filter():
    """Test category scoring when no categories specified."""
    service = MatchingService(None)
    item = MockItem(category="tech")

    score = service._score_category(item, categories=[])

    assert score == 30.0  # Default to full points when no filter


# ============================================================================
# Demographics Scoring Tests
# ============================================================================


def test_demographics_age_match():
    """Test demographics scoring with matching age group."""
    service = MatchingService(None)
    user = MockUser(age_group="25-34")

    score = service._score_demographics(user, age_groups=["25-34", "35-44"])

    assert score == 20.0  # Perfect match


def test_demographics_no_age_match():
    """Test demographics scoring with no age match."""
    service = MatchingService(None)
    user = MockUser(age_group="18-24")

    score = service._score_demographics(user, age_groups=["35-44", "45-54"])

    assert score == 0.0


def test_demographics_no_filter():
    """Test demographics scoring when no filter specified."""
    service = MatchingService(None)
    user = MockUser(age_group="25-34")

    score = service._score_demographics(user, age_groups=[])

    assert score == 20.0  # Default to full points


# ============================================================================
# Priority Scoring Tests
# ============================================================================


def test_priority_max():
    """Test priority scoring with max priority."""
    service = MatchingService(None)
    item = MockItem(priority=5)

    score = service._score_priority(item)

    assert score == 10.0  # 5/5 = 10 points


def test_priority_mid():
    """Test priority scoring with mid priority."""
    service = MatchingService(None)
    item = MockItem(priority=3)

    score = service._score_priority(item)

    assert score == 6.0  # 3/5 = 6 points


def test_priority_min():
    """Test priority scoring with min priority."""
    service = MatchingService(None)
    item = MockItem(priority=1)

    score = service._score_priority(item)

    assert score == 2.0  # 1/5 = 2 points


def test_priority_none():
    """Test priority scoring when priority is not set."""
    service = MatchingService(None)
    item = MockItem(priority=None)

    score = service._score_priority(item)

    assert score == 6.0  # Default to 3/5 = 6 points


# ============================================================================
# Total Score Tests
# ============================================================================


def test_calculate_perfect_score():
    """Test total score calculation with perfect match."""
    service = MatchingService(None)
    item = MockItem(price_min=100, category="tech", priority=5)
    user = MockUser(age_group="25-34")

    breakdown = service._calculate_score(
        item=item,
        user=user,
        budget_min=50,
        budget_max=150,
        categories=["tech"],
        age_groups=["25-34"],
    )

    assert breakdown.budget_score == 40.0
    assert breakdown.category_score == 30.0
    assert breakdown.demographics_score == 20.0
    assert breakdown.priority_score == 10.0
    assert breakdown.total_score == 100.0


def test_calculate_mixed_score():
    """Test total score calculation with mixed match."""
    service = MatchingService(None)
    item = MockItem(price_min=100, category="tech", priority=3)
    user = MockUser(age_group="18-24")

    breakdown = service._calculate_score(
        item=item,
        user=user,
        budget_min=50,
        budget_max=150,
        categories=["tech", "books"],
        age_groups=["25-34"],  # User is 18-24, doesn't match
    )

    assert breakdown.budget_score == 40.0  # Perfect budget
    assert breakdown.category_score == 30.0  # Perfect category
    assert breakdown.demographics_score == 0.0  # No age match
    assert breakdown.priority_score == 6.0  # Priority 3/5
    assert breakdown.total_score == 76.0


def test_calculate_poor_score():
    """Test total score calculation with poor match."""
    service = MatchingService(None)
    item = MockItem(price_min=500, category="fashion", priority=1)
    user = MockUser(age_group="18-24")

    breakdown = service._calculate_score(
        item=item,
        user=user,
        budget_min=50,
        budget_max=150,
        categories=["tech"],
        age_groups=["25-34"],
    )

    # Way over budget, wrong category, wrong age, low priority
    assert breakdown.budget_score < 10
    assert breakdown.category_score == 0.0
    assert breakdown.demographics_score == 0.0
    assert breakdown.priority_score == 2.0
    assert breakdown.total_score < 20


# ============================================================================
# Score Breakdown Tests
# ============================================================================


def test_score_breakdown_initialization():
    """Test ScoreBreakdown object initialization."""
    breakdown = schemas.ScoreBreakdown(
        budget_score=35.5,
        category_score=30.0,
        demographics_score=15.0,
        priority_score=8.0,
        total_score=88.5,
    )

    assert breakdown.budget_score == 35.5
    assert breakdown.category_score == 30.0
    assert breakdown.demographics_score == 15.0
    assert breakdown.priority_score == 8.0
    assert breakdown.total_score == 88.5


# ============================================================================
# Edge Cases
# ============================================================================


def test_zero_budget():
    """Test scoring with zero budget (edge case)."""
    service = MatchingService(None)
    item = MockItem(price_min=0)

    score = service._score_budget(item, budget_min=0, budget_max=100)

    assert score >= 0  # Should not crash


def test_negative_priority():
    """Test scoring with invalid priority (edge case)."""
    service = MatchingService(None)
    item = MockItem(priority=-1)

    score = service._score_priority(item)

    # Should handle gracefully, treat as low priority
    assert 0 <= score <= 10


def test_empty_categories():
    """Test scoring with empty category list."""
    service = MatchingService(None)
    item = MockItem(category="tech")

    score = service._score_category(item, categories=[])

    assert score == 30.0  # Should default to full points


def test_none_age_group():
    """Test scoring when user has no age group."""
    service = MatchingService(None)
    user = MockUser(age_group=None)

    score = service._score_demographics(user, age_groups=["25-34"])

    assert score >= 0  # Should handle gracefully


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
