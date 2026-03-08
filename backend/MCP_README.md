# Hermes Gift Portal - FastMCP Server

This is a Model Context Protocol (MCP) server implementation for the Hermes Gift Portal backend. It exposes backend API functionality through MCP, allowing AI assistants like Claude to interact with the gift portal system.

**Built with [FastMCP](https://github.com/jlowin/fastmcp)** - A Python framework for building MCP servers quickly and easily.

## Documentation References

- **FastMCP Documentation**: https://github.com/jlowin/fastmcp
- **Model Context Protocol Specification**: https://modelcontextprotocol.io/
- **FastMCP Python API**: https://jlowin.github.io/fastmcp/

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

### Example 1: Complete Event Setup Workflow

This example shows how to set up a new hackathon event from start to finish:

```
USER: "I want to organize a hackathon. Can you help me set it up in Hermes?"

CLAUDE: "I'll help you create a hackathon event. First, let me create the event:
[Calls create_event with name='My Hackathon 2024', event_type='hackathon', budget=5000]

Great! Your hackathon has been created with:
- Event ID: 5
- Invite Code: ABC123
- Budget: $5,000

Now, what prizes would you like to offer?"

USER: "Add a mechanical keyboard for 1st place ($150), wireless mouse for 2nd place ($80),
and a tech book bundle for 3rd place ($50)"

CLAUDE: "I'll add those prizes to your event:
[Calls create_event_prize 3 times with the respective details]

Perfect! All three prizes have been added to your prize pool.
You now have $180 spent out of your $5,000 budget.

Share the invite code ABC123 with participants so they can join!"
```

### Example 2: Managing Prize Assignments

```
USER: "Show me the participants in my hackathon event 5"

CLAUDE: [Calls list_event_participants(event_id=5, role='participant')]
"Here are the 12 participants in your hackathon:
1. John Doe (ID: 3)
2. Jane Smith (ID: 7)
3. Alex Johnson (ID: 11)
..."

USER: "I want to assign the mechanical keyboard to participant 3"

CLAUDE: [Calls assign_prize(event_id=5, prize_id=1, recipient_id=3)]
"Done! The mechanical keyboard (1st place) has been assigned to John Doe.
This was automatically ranked as #1."

USER: "Get a recommendation for which prize would be best for participant 7"

CLAUDE: [Calls get_prize_recommendation(event_id=5, participant_id=7)]
"Based on Jane's profile (interests in gaming and tech), I recommend:
🎯 Wireless Gaming Mouse ($80)
Reasoning: Jane's wishlist includes gaming peripherals and she participates
in competitive gaming events. This aligns perfectly with her interests."
```

### Example 3: Budget Tracking

```
USER: "What's my budget status for event 5?"

CLAUDE: [Calls get_event_budget_status(event_id=5)]
"Budget Status for Event: My Hackathon 2024
Total Budget: $5,000.00
Spent: $230.00
Remaining: $4,770.00
Budget Usage: 4.6%
Status: ✅ Within Budget

You've assigned 3 prizes so far and have plenty of budget remaining!"
```

### Example 4: Product Discovery

```
USER: "Search for prizes under $100 that would be good for tech enthusiasts"

CLAUDE: [Calls search_products(query='tech gadgets developer tools',
         max_results=10, price_max=100)]
"Here are 10 tech items under $100:

1. Mechanical Keyboard RGB ($89.99)
2. USB-C Hub 7-in-1 ($45.50)
3. Noise Cancelling Earbuds ($79.00)
4. RGB Mouse Pad ($25.99)
...

Would you like me to add any of these to your prize pool?"
```

### Example 5: Using with Claude Desktop

Once configured in Claude Desktop, you can have natural conversations:

**Simple Queries:**
- "List all my events in Hermes"
- "Show me event 5 details"
- "Who are the sponsors in event 5?"

**Event Creation:**
- "Create a birthday party event called 'Sarah's 30th' with a $500 budget"
- "Update the budget for event 3 to $10,000"

**Prize Management:**
- "Add a $200 gift card to event 5's prize pool"
- "Show me all available prizes in event 5"
- "Assign prize 8 to participant 12 in event 5"
- "Delete prize 15 from event 5"

**Smart Recommendations:**
- "Get AI recommendation for participant 6 in event 5"
- "What prize would be best for participant 9 based on their wishlist?"

**Budget Tracking:**
- "Show me the budget status for event 5"
- "How much budget do I have left in event 3?"

### Direct Python Tool Calls

You can also test the tools directly in Python:

```python
from mcp_server import (
    create_event,
    list_event_prizes,
    assign_prize,
    get_event_budget_status
)

# Your JWT token (get this from logging in)
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create a new event
event = create_event(
    name="Tech Conference 2024",
    event_type="hackathon",
    token=TOKEN,
    description="Annual tech conference",
    budget=10000
)
print(f"Created event: {event['name']} (ID: {event['id']})")

# List prizes
prizes = list_event_prizes(event_id=event['id'], token=TOKEN)
print(f"Found {len(prizes)} prizes")

# Assign a prize
result = assign_prize(
    event_id=event['id'],
    prize_id=1,
    recipient_id=3,
    token=TOKEN
)
print(f"Assigned prize to participant (Rank: {result['rank']})")

# Check budget
budget_status = get_event_budget_status(event_id=event['id'], token=TOKEN)
print(budget_status)
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

## Testing & Debugging with FastMCP

FastMCP provides several built-in tools for testing and debugging your MCP server.

### Inspect Available Tools

See all available tools with their signatures and documentation:

```bash
source mcp_venv/bin/activate
fastmcp inspect mcp_server.py
```

This will output:
- All available tools with descriptions
- Tool parameters and their types
- Return types
- Full documentation strings

### Test Individual Tools

FastMCP provides a `dev` mode for interactive testing:

```bash
source mcp_venv/bin/activate
fastmcp dev mcp_server.py
```

This opens an interactive shell where you can:
1. Call tools directly
2. Test with different parameters
3. See real-time responses
4. Debug issues

Example test session:
```python
# In the dev shell
>>> get_server_info()
{
    "name": "Hermes Gift Portal MCP Server",
    "version": "1.0.0",
    "api_base_url": "http://localhost:8000",
    "description": "MCP server for managing events, prizes, and gift matching"
}

>>> # Test with a real token (you'll need to get one first)
>>> TOKEN = "eyJhbG..."
>>> list_events(token=TOKEN)
[
    {"id": 1, "name": "My Hackathon", ...},
    {"id": 2, "name": "Birthday Party", ...}
]
```

### Run the Server in Different Modes

**SSE Mode (default):**
```bash
python mcp_server.py
# Server runs on http://localhost:8000
```

**STDIO Mode (for Claude Desktop):**
```bash
python mcp_server.py --transport stdio
```

**Custom Port:**
```bash
python mcp_server.py --port 8080
```

### Debug Mode

Enable verbose logging to see all MCP protocol messages:

```bash
FASTMCP_DEBUG=1 python mcp_server.py
```

### Testing with cURL

You can also test the SSE endpoint directly with curl:

```bash
# List available tools
curl http://localhost:8000/tools

# Call a tool (requires proper MCP protocol formatting)
curl -X POST http://localhost:8000/call \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_server_info",
      "arguments": {}
    }
  }'
```

### Monitoring Server Activity

Watch server logs in real-time:

```bash
# Start server with verbose logging
FASTMCP_DEBUG=1 python mcp_server.py 2>&1 | tee mcp_server.log

# In another terminal, tail the logs
tail -f mcp_server.log
```

### FastMCP-Specific Features

This server uses several FastMCP features:

1. **Automatic Type Validation**: FastMCP validates all tool parameters automatically
2. **Async Support**: All tools can be called asynchronously
3. **Error Handling**: FastMCP catches and formats errors properly for MCP clients
4. **Schema Generation**: Tool schemas are auto-generated from docstrings
5. **Multiple Transports**: Supports both SSE and STDIO transports

### Learn More

- **FastMCP GitHub**: https://github.com/jlowin/fastmcp
- **FastMCP Examples**: https://github.com/jlowin/fastmcp/tree/main/examples
- **MCP Protocol Docs**: https://modelcontextprotocol.io/docs
- **FastMCP API Reference**: https://jlowin.github.io/fastmcp/

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
