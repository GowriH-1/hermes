# Hermes Gift Portal - FastMCP Server

This is a Model Context Protocol (MCP) server implementation for the Hermes Gift Portal backend. It exposes backend API functionality through MCP, allowing AI assistants like Claude to interact with the gift portal system.

## Features

The MCP server provides access to:

### Event Management
- `list_events` - List all events for a user
- `get_event` - Get event details
- `create_event` - Create a new event with budget
- `update_event_budget` - Update event budget

### Prize Management
- `list_event_prizes` - List prizes for an event
- `create_event_prize` - Add a new prize to the pool
- `assign_prize` - Assign a prize to a participant (auto-ranks)
- `delete_prize` - Remove a prize from the pool

### Participant Management
- `list_event_participants` - List event participants
- `join_event` - Join an event with invite code

### Wishlist & Gift Matching
- `get_participant_wishlist` - View participant wishlists
- `get_event_wishlist_items` - Get current user's wishlist
- `search_products` - Search for products using Exa AI
- `get_prize_recommendation` - Get AI-powered prize recommendations

### Resources
- `budget://event/{event_id}` - Get real-time budget status for an event

## Installation

### Prerequisites

- Python 3.10 or higher (FastMCP requirement)
- Hermes backend running on `http://localhost:8000`

### Setup

1. **Create a Python 3.12 virtual environment:**
   ```bash
   cd backend
   python3.12 -m venv mcp_venv
   source mcp_venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install fastmcp requests python-dotenv
   ```

3. **Configure environment (optional):**
   ```bash
   cp .env.mcp.example .env.mcp
   # Edit .env.mcp if needed
   ```

## Running the Server

### Standalone Mode (SSE)

Run the MCP server as a standalone SSE server:

```bash
source mcp_venv/bin/activate
python mcp_server.py
```

The server will start on `http://localhost:8000` (MCP default).

### STDIO Mode (for Claude Desktop)

To use with Claude Desktop, add this to your Claude config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hermes": {
      "command": "/Users/YOUR_USERNAME/path/to/hermes/backend/mcp_venv/bin/python",
      "args": ["/Users/YOUR_USERNAME/path/to/hermes/backend/mcp_server.py"],
      "env": {
        "HERMES_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

Replace `YOUR_USERNAME` with your actual username and update the paths.

## Usage Examples

### With Claude Desktop

Once configured, you can ask Claude:

> "List all my events in Hermes"

> "Create a new hackathon event called 'Tech Summit 2024' with a $5000 budget"

> "Show me the participants in event 4"

> "Assign prize 12 to participant 6 in event 4"

> "Search for mechanical keyboards under $200"

> "Get AI recommendation for matching a prize to participant 5 in event 4"

> "Show me the budget status for event 4"

### Direct Tool Calls

You can also test the tools directly:

```python
from mcp_server import get_event

# Get event details (you'll need a valid JWT token)
result = get_event(event_id=4, token="your_jwt_token_here")
print(result)
```

## Authentication

Most tools require a JWT authentication token. To get a token:

1. Login through the frontend or use the `/auth/login` API endpoint
2. Use the `access_token` from the response
3. Pass it to MCP tools via the `token` parameter

Claude will need to manage authentication tokens when making requests.

## Available Tools

Run the server and use the MCP inspector to see all available tools:

```bash
fastmcp inspect mcp_server.py
```

Or check the inline documentation in `mcp_server.py`.

## Architecture

```
┌─────────────────┐
│  Claude / AI    │
│   Assistant     │
└────────┬────────┘
         │ MCP Protocol
         ↓
┌─────────────────┐
│   FastMCP       │
│    Server       │ ← mcp_server.py
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│    FastAPI      │
│    Backend      │ ← main.py
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    SQLite DB    │
└─────────────────┘
```

## Development

### Adding New Tools

To add a new tool to the MCP server:

1. Define the function with `@mcp.tool()` decorator
2. Add proper docstring with Args and Returns
3. Use `make_request()` helper to call backend API
4. Handle errors appropriately

Example:

```python
@mcp.tool()
def my_new_tool(param1: str, token: str) -> Dict[str, Any]:
    """Description of what the tool does.

    Args:
        param1: Description of parameter
        token: JWT authentication token

    Returns:
        Description of return value
    """
    return make_request("GET", "/api/my-endpoint", token=token)
```

### Adding Resources

Resources provide read-only data access:

```python
@mcp.resource("myresource://{id}")
def get_my_resource(id: str, token: str) -> str:
    """Resource description."""
    # Fetch and format data
    return formatted_string
```

## Troubleshooting

### Server won't start
- Ensure Python 3.10+ is being used: `python --version`
- Check that all dependencies are installed: `pip list | grep fastmcp`
- Verify backend is running on the configured URL

### Authentication errors
- Ensure you're passing a valid JWT token
- Check token hasn't expired (tokens expire after 24 hours)
- Login again to get a fresh token

### Connection refused
- Verify backend is running: `curl http://localhost:8000/docs`
- Check `HERMES_API_URL` in your environment configuration

## License

Same as the main Hermes project.
