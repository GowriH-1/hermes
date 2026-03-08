#!/bin/bash

# Run Hermes MCP Server

cd "$(dirname "$0")"

# Check if mcp_venv exists
if [ ! -d "mcp_venv" ]; then
    echo "Error: mcp_venv not found. Please run setup first:"
    echo "  python3.12 -m venv mcp_venv"
    echo "  source mcp_venv/bin/activate"
    echo "  pip install fastmcp requests python-dotenv"
    exit 1
fi

# Activate virtual environment
source mcp_venv/bin/activate

# Load environment variables if .env.mcp exists
if [ -f ".env.mcp" ]; then
    export $(cat .env.mcp | grep -v '^#' | xargs)
fi

# Run the MCP server
echo "Starting Hermes MCP Server..."
echo "Backend API URL: ${HERMES_API_URL:-http://localhost:8000}"
python mcp_server.py
