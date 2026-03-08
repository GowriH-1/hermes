"""FastMCP server for Hermes Gift Portal backend.

This MCP server exposes the Hermes backend API functionality through
the Model Context Protocol, allowing AI assistants to interact with
the gift portal system.
"""

import os
import requests
from typing import Optional, List, Dict, Any
from fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP("Hermes Gift Portal")

# Backend API configuration
API_BASE_URL = os.getenv("HERMES_API_URL", "http://localhost:8000")
API_TOKEN = os.getenv("HERMES_API_TOKEN", "")  # Optional: for auth if needed


def make_request(method: str, endpoint: str, data: Optional[Dict] = None,
                 params: Optional[Dict] = None, token: Optional[str] = None) -> Dict[str, Any]:
    """Make HTTP request to backend API."""
    url = f"{API_BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return {"error": f"Unsupported method: {method}"}

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


# ============================================================================
# Event Management Tools
# ============================================================================

@mcp.tool()
def list_events(token: str) -> Dict[str, Any]:
    """List all events for the authenticated user.

    Args:
        token: JWT authentication token for the user

    Returns:
        List of events the user is part of
    """
    return make_request("GET", "/api/events", token=token)


@mcp.tool()
def get_event(event_id: int, token: str) -> Dict[str, Any]:
    """Get details of a specific event.

    Args:
        event_id: ID of the event to retrieve
        token: JWT authentication token

    Returns:
        Event details including name, type, date, participants, etc.
    """
    return make_request("GET", f"/api/events/{event_id}", token=token)


@mcp.tool()
def create_event(
    name: str,
    event_type: str,
    token: str,
    description: Optional[str] = None,
    budget: float = 0
) -> Dict[str, Any]:
    """Create a new event.

    Args:
        name: Name of the event
        event_type: Type of event (hackathon, birthday, wedding, other)
        token: JWT authentication token
        description: Optional event description
        budget: Total budget for prizes (default: 0)

    Returns:
        Created event details including invite code
    """
    data = {
        "name": name,
        "event_type": event_type,
        "description": description,
        "budget": budget
    }
    return make_request("POST", "/api/events", data=data, token=token)


@mcp.tool()
def update_event_budget(event_id: int, budget: float, token: str) -> Dict[str, Any]:
    """Update the budget for an event.

    Args:
        event_id: ID of the event to update
        budget: New budget amount
        token: JWT authentication token (must be event organizer)

    Returns:
        Updated event details
    """
    data = {"budget": budget}
    return make_request("PATCH", f"/api/events/{event_id}", data=data, token=token)


# ============================================================================
# Prize Management Tools
# ============================================================================

@mcp.tool()
def list_event_prizes(event_id: int, token: str, status: Optional[str] = None) -> Dict[str, Any]:
    """List all prizes for an event.

    Args:
        event_id: ID of the event
        token: JWT authentication token
        status: Optional filter by status (available, assigned, fulfilled)

    Returns:
        List of prizes for the event
    """
    params = {"status": status} if status else None
    return make_request("GET", f"/api/events/{event_id}/prizes", params=params, token=token)


@mcp.tool()
def create_event_prize(
    event_id: int,
    title: str,
    token: str,
    description: Optional[str] = None,
    url: Optional[str] = None,
    image_url: Optional[str] = None,
    price: Optional[float] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new prize for an event.

    Args:
        event_id: ID of the event
        title: Prize title/name
        token: JWT authentication token (must be event organizer)
        description: Optional prize description
        url: Optional product URL
        image_url: Optional image URL
        price: Optional price
        category: Optional category (tech, books, gaming, etc.)

    Returns:
        Created prize details
    """
    data = {
        "event_id": event_id,
        "title": title,
        "description": description,
        "url": url,
        "image_url": image_url,
        "price": price,
        "category": category,
        "exa_metadata": {}
    }
    return make_request("POST", f"/api/events/{event_id}/prizes", data=data, token=token)


@mcp.tool()
def assign_prize(
    event_id: int,
    prize_id: int,
    recipient_id: int,
    token: str
) -> Dict[str, Any]:
    """Assign a prize to a participant.

    Args:
        event_id: ID of the event
        prize_id: ID of the prize to assign
        recipient_id: ID of the participant receiving the prize
        token: JWT authentication token (must be event organizer)

    Returns:
        Updated prize details with recipient and rank
    """
    return make_request("PATCH", f"/api/events/{event_id}/prizes/{prize_id}/assign",
                       data={"recipient_id": recipient_id}, token=token)


@mcp.tool()
def delete_prize(event_id: int, prize_id: int, token: str) -> Dict[str, Any]:
    """Delete a prize from an event.

    Args:
        event_id: ID of the event
        prize_id: ID of the prize to delete
        token: JWT authentication token (must be event organizer)

    Returns:
        Success message
    """
    return make_request("DELETE", f"/api/events/{event_id}/prizes/{prize_id}", token=token)


# ============================================================================
# Participant Management Tools
# ============================================================================

@mcp.tool()
def list_event_participants(
    event_id: int,
    token: str,
    role: Optional[str] = None
) -> Dict[str, Any]:
    """List all participants in an event.

    Args:
        event_id: ID of the event
        token: JWT authentication token
        role: Optional filter by role (participant, sponsor)

    Returns:
        List of participants with their details
    """
    params = {"role": role} if role else None
    return make_request("GET", f"/api/events/{event_id}/participants", params=params, token=token)


@mcp.tool()
def join_event(invite_code: str, role: str, token: str) -> Dict[str, Any]:
    """Join an event using an invite code.

    Args:
        invite_code: Event invite code
        role: Role to join as (participant or sponsor)
        token: JWT authentication token

    Returns:
        Event details after joining
    """
    data = {
        "invite_code": invite_code,
        "role": role
    }
    return make_request("POST", "/api/events/join", data=data, token=token)


# ============================================================================
# Wishlist Management Tools
# ============================================================================

@mcp.tool()
def get_participant_wishlist(
    event_id: int,
    participant_id: int,
    token: str
) -> Dict[str, Any]:
    """Get a participant's wishlist items for an event.

    Args:
        event_id: ID of the event
        participant_id: ID of the participant
        token: JWT authentication token

    Returns:
        List of wishlist items for the participant in this event
    """
    return make_request("GET", f"/api/events/{event_id}/participants/{participant_id}/wishlist",
                       token=token)


@mcp.tool()
def get_event_wishlist_items(event_id: int, token: str) -> Dict[str, Any]:
    """Get all wishlist items for an event (current user's items).

    Args:
        event_id: ID of the event
        token: JWT authentication token

    Returns:
        List of current user's wishlist items for this event
    """
    return make_request("GET", f"/api/events/{event_id}/wishlist-items", token=token)


# ============================================================================
# Product Search Tool
# ============================================================================

@mcp.tool()
def search_products(
    query: str,
    token: str,
    max_results: int = 10,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None
) -> Dict[str, Any]:
    """Search for products using Exa AI.

    Args:
        query: Search query for products
        token: JWT authentication token
        max_results: Maximum number of results (default: 10, max: 20)
        price_min: Optional minimum price filter
        price_max: Optional maximum price filter

    Returns:
        List of product search results with titles, URLs, prices, etc.
    """
    data = {
        "query": query,
        "max_results": max_results,
        "price_min": price_min,
        "price_max": price_max
    }
    return make_request("POST", "/api/search/products", data=data, token=token)


# ============================================================================
# AI Recommendations Tool
# ============================================================================

@mcp.tool()
def get_prize_recommendation(
    event_id: int,
    participant_id: int,
    token: str
) -> Dict[str, Any]:
    """Get AI recommendation for matching a prize to a participant.

    Args:
        event_id: ID of the event
        participant_id: ID of the participant
        token: JWT authentication token

    Returns:
        AI-generated recommendation with reasoning and suggestions
    """
    return make_request("POST", f"/api/events/{event_id}/recommend-prize/{participant_id}",
                       token=token)


# ============================================================================
# Resource: Event Budget Status
# Note: Resources don't support authentication tokens in FastMCP,
# so this is provided as a tool instead for now
# ============================================================================

@mcp.tool()
def get_event_budget_status(event_id: int, token: str) -> str:
    """Get current budget status for an event.

    This provides a formatted summary of the event's budget including
    total budget, spent amount, and remaining budget.

    Args:
        event_id: ID of the event
        token: JWT authentication token

    Returns:
        Formatted budget status summary
    """
    try:
        event = make_request("GET", f"/api/events/{event_id}", token=token)
        prizes = make_request("GET", f"/api/events/{event_id}/prizes", token=token)

        if "error" in event or "error" in prizes:
            return "Error: Unable to retrieve budget status"

        total_budget = event.get("budget", 0)
        spent = sum(p.get("price", 0) for p in prizes
                   if p.get("status") in ["assigned", "fulfilled"])
        remaining = total_budget - spent

        return f"""Budget Status for Event: {event.get('name')}
Total Budget: ${total_budget:.2f}
Spent: ${spent:.2f}
Remaining: ${remaining:.2f}
Budget Usage: {(spent/total_budget*100) if total_budget > 0 else 0:.1f}%
Status: {'⚠️ Over Budget' if remaining < 0 else '✅ Within Budget'}
"""
    except Exception as e:
        return f"Error retrieving budget status: {str(e)}"


# ============================================================================
# Server Info
# ============================================================================

@mcp.tool()
def get_server_info() -> Dict[str, str]:
    """Get information about the Hermes MCP server.

    Returns:
        Server information including version and API base URL
    """
    return {
        "name": "Hermes Gift Portal MCP Server",
        "version": "1.0.0",
        "api_base_url": API_BASE_URL,
        "description": "MCP server for managing events, prizes, and gift matching"
    }


if __name__ == "__main__":
    # Run the server
    mcp.run()
