"""
ChatLangA2UI FastAPI Application

Main entry point for the backend server with CopilotKit integration.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Load environment variables
load_dotenv(override=True)

# Import agents
from app.agents import (
    build_dashboard_agent,
    build_data_viz_agent,
    build_form_agent,
)

# Create FastAPI app
app = FastAPI(
    title="ChatLangA2UI API",
    description="AI agents that generate A2UI interfaces using LangChain and Claude",
    version="1.0.0",
)

# CORS configuration for local development
cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")]
print(f"[CORS] Allowed origins: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent graphs cache keyed by provider (lazy initialization)
_agents_cache: dict[str, dict] = {}

def get_agents(provider: str | None = None):
    """Get or build agent graphs for a specific provider (lazy initialization)"""
    if provider is None:
        provider = os.getenv("LLM_PROVIDER", "anthropic").lower()

    if provider not in _agents_cache:
        print(f"Building LangGraph agents for provider: {provider}...")
        _agents_cache[provider] = {
            "dashboard": build_dashboard_agent(provider=provider),
            "data_viz": build_data_viz_agent(provider=provider),
            "form": build_form_agent(provider=provider),
        }
        print(f"[OK] Agents built successfully for {provider}")

    cache = _agents_cache[provider]
    return cache["dashboard"], cache["data_viz"], cache["form"]

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    model = (
        os.getenv("GOOGLE_MODEL", "gemini-2.5-flash") if provider == "google"
        else os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929")
    )
    return {
        "status": "ok",
        "service": "ChatLangA2UI",
        "version": "1.0.0",
        "llm_provider": provider,
        "llm_model": model,
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "ChatLangA2UI",
        "description": "AI-powered A2UI generation backend",
        "endpoints": {
            "health": "/health",
            "agui-stream": "/agui/stream",
            "copilotkit": "/copilotkit",
            "test-dashboard": "/test/dashboard",
            "docs": "/docs"
        }
    }

@app.get("/test/dashboard")
async def test_dashboard():
    """Test endpoint that returns A2UI JSONL for a sample dashboard"""
    # Sample A2UI JSONL for testing the renderer
    a2ui_jsonl = """{"surfaceUpdate": {"surfaceId": "main", "components": [{"id": "title", "component": {"Text": {"text": {"literalString": "Sales Dashboard"}, "usage_hint": "title"}}}, {"id": "subtitle", "component": {"Text": {"text": {"literalString": "Q4 2024 Performance Overview"}, "usage_hint": "subtitle"}}}, {"id": "row1", "component": {"Row": {"children": ["card1", "card2", "card3"]}}}, {"id": "card1", "component": {"Card": {"title": {"literalString": "Total Revenue"}, "children": ["revenue_text"]}}}, {"id": "revenue_text", "component": {"Text": {"text": {"literalString": "$1,245,680"}, "usage_hint": "body"}}}, {"id": "card2", "component": {"Card": {"title": {"literalString": "New Customers"}, "children": ["customers_text"]}}}, {"id": "customers_text", "component": {"Text": {"text": {"literalString": "3,456"}, "usage_hint": "body"}}}, {"id": "card3", "component": {"Card": {"title": {"literalString": "Conversion Rate"}, "children": ["conversion_text"]}}}, {"id": "conversion_text", "component": {"Text": {"text": {"literalString": "24.5%"}, "usage_hint": "body"}}}, {"id": "chart_card", "component": {"Card": {"title": {"literalString": "Monthly Revenue Trend"}, "children": ["revenue_chart"]}}}, {"id": "revenue_chart", "component": {"Chart": {"config": {"type": "line", "xKey": "month", "yKey": "revenue", "dataPath": "/revenueData"}}}}, {"id": "table_card", "component": {"Card": {"title": {"literalString": "Top Products"}, "children": ["products_table"]}}}, {"id": "products_table", "component": {"Table": {"columns": [{"key": "product", "label": "Product", "type": "string"}, {"key": "sales", "label": "Sales", "type": "number"}, {"key": "revenue", "label": "Revenue", "type": "number"}], "dataPath": "/productsData"}}}]}}
{"dataModelUpdate": {"surfaceId": "main", "path": "/revenueData", "contents": [{"key": "data", "valueArray": [{"month": "January", "revenue": 98000}, {"month": "February", "revenue": 105000}, {"month": "March", "revenue": 112000}, {"month": "April", "revenue": 108000}, {"month": "May", "revenue": 118000}, {"month": "June", "revenue": 125000}]}]}}
{"dataModelUpdate": {"surfaceId": "main", "path": "/productsData", "contents": [{"key": "data", "valueArray": [{"product": "Widget Pro", "sales": 1250, "revenue": 125000}, {"product": "Gadget Plus", "sales": 980, "revenue": 98000}, {"product": "Tool Master", "sales": 875, "revenue": 87500}, {"product": "Device Elite", "sales": 650, "revenue": 65000}]}]}}
{"beginRendering": {"surfaceId": "main"}}"""

    return {"a2ui": a2ui_jsonl, "success": True}

@app.post("/api/generate")
async def generate_ui(request: dict):
    """Generate A2UI from user message using LangChain agents"""
    from langchain_core.messages import HumanMessage

    message = request.get("message", "")

    if not message:
        return {"error": "Message is required"}, 400

    try:
        print(f"\n[API] Generating UI for message: {message}")

        # Get agents (lazy initialization)
        dashboard_graph, _, _ = get_agents()

        # For POC, use the dashboard agent for all requests
        # In production, you'd route to appropriate agent based on message intent
        result = await dashboard_graph.ainvoke({
            "messages": [HumanMessage(content=message)],
            "user_request": message,
            "a2ui_output": {},
            "error": None
        })

        print(f"[API] Agent result keys: {result.keys()}")

        # Extract A2UI JSONL from agent result
        a2ui_data = result.get("a2ui_output", {})
        a2ui_jsonl = a2ui_data.get("jsonl", "")
        reasoning = a2ui_data.get("reasoning", None)

        if a2ui_jsonl:
            print(f"[API] Successfully generated A2UI ({len(a2ui_jsonl)} chars)")
            if reasoning:
                print(f"[API] Reasoning: {reasoning}")

            return {
                "response": f"Generated UI for: {message}",
                "a2ui": a2ui_jsonl,
                "success": True,
                "reasoning": reasoning
            }
        else:
            raise ValueError("Agent did not return A2UI output")

    except Exception as e:
        print(f"[API] Error generating UI: {e}")
        import traceback
        traceback.print_exc()

        # Return test dashboard as fallback
        a2ui_jsonl = """{"surfaceUpdate": {"surfaceId": "main", "components": [{"id": "title", "component": {"Text": {"text": {"literalString": "Sales Dashboard"}, "usage_hint": "title"}}}, {"id": "subtitle", "component": {"Text": {"text": {"literalString": "Q4 2024 Performance Overview"}, "usage_hint": "subtitle"}}}, {"id": "row1", "component": {"Row": {"children": ["card1", "card2", "card3"]}}}, {"id": "card1", "component": {"Card": {"title": {"literalString": "Total Revenue"}, "children": ["revenue_text"]}}}, {"id": "revenue_text", "component": {"Text": {"text": {"literalString": "$1,245,680"}, "usage_hint": "body"}}}, {"id": "card2", "component": {"Card": {"title": {"literalString": "New Customers"}, "children": ["customers_text"]}}}, {"id": "customers_text", "component": {"Text": {"text": {"literalString": "3,456"}, "usage_hint": "body"}}}, {"id": "card3", "component": {"Card": {"title": {"literalString": "Conversion Rate"}, "children": ["conversion_text"]}}}, {"id": "conversion_text", "component": {"Text": {"text": {"literalString": "24.5%"}, "usage_hint": "body"}}}, {"id": "chart_card", "component": {"Card": {"title": {"literalString": "Monthly Revenue Trend"}, "children": ["revenue_chart"]}}}, {"id": "revenue_chart", "component": {"Chart": {"config": {"type": "line", "xKey": "month", "yKey": "revenue", "dataPath": "/revenueData"}}}}, {"id": "table_card", "component": {"Card": {"title": {"literalString": "Top Products"}, "children": ["products_table"]}}}, {"id": "products_table", "component": {"Table": {"columns": [{"key": "product", "label": "Product", "type": "string"}, {"key": "sales", "label": "Sales", "type": "number"}, {"key": "revenue", "label": "Revenue", "type": "number"}], "dataPath": "/productsData"}}}]}}
{"dataModelUpdate": {"surfaceId": "main", "path": "/revenueData", "contents": [{"key": "data", "valueArray": [{"month": "January", "revenue": 98000}, {"month": "February", "revenue": 105000}, {"month": "March", "revenue": 112000}, {"month": "April", "revenue": 108000}, {"month": "May", "revenue": 118000}, {"month": "June", "revenue": 125000}]}]}}
{"dataModelUpdate": {"surfaceId": "main", "path": "/productsData", "contents": [{"key": "data", "valueArray": [{"product": "Widget Pro", "sales": 1250, "revenue": 125000}, {"product": "Gadget Plus", "sales": 980, "revenue": 98000}, {"product": "Tool Master", "sales": 875, "revenue": 87500}, {"product": "Device Elite", "sales": 650, "revenue": 65000}]}]}}
{"beginRendering": {"surfaceId": "main"}}"""

        return {
            "response": f"Generated UI (using fallback): {message}",
            "a2ui": a2ui_jsonl,
            "success": True,
            "fallback": True,
            "error": str(e)
        }

# AG-UI streaming endpoint with SSE
@app.post("/agui/stream")
async def agui_stream(request: Request):
    """AG-UI protocol endpoint with SSE streaming"""
    from app.agui_endpoint import agui_stream_endpoint
    # Peek at the body to get provider (endpoint will also parse it)
    body = await request.json()
    provider = body.get("llm_provider", None)
    dashboard_graph, data_viz_graph, form_graph = get_agents(provider)
    return await agui_stream_endpoint(request, dashboard_graph, data_viz_graph, form_graph, body=body)

print("[OK] AG-UI streaming endpoint configured at /agui/stream")

# CopilotKit integration will be added here
# Note: The CopilotKit Python SDK API may vary. This is a placeholder for the integration.
# The actual implementation depends on the installed copilotkit version.

try:
    # Attempt to import and configure CopilotKit
    from copilotkit.integrations.fastapi import add_fastapi_endpoint
    from copilotkit import CopilotKitRemoteEndpoint, LangGraphAgent

    # Get agents (lazy initialization)
    dashboard_graph, data_viz_graph, form_graph = get_agents()

    # Wrap agents
    agents = [
        LangGraphAgent(
            name="dashboard_agent",
            description="Generates interactive dashboards with charts and tables",
            agent=dashboard_graph,
        ),
        LangGraphAgent(
            name="data_viz_agent",
            description="Creates data visualizations and charts using A2UI",
            agent=data_viz_graph,
        ),
        LangGraphAgent(
            name="form_agent",
            description="Generates interactive input forms",
            agent=form_graph,
        ),
    ]

    # Create CopilotKit Remote Endpoint with agents
    remote = CopilotKitRemoteEndpoint(agents=agents)

    # Add CopilotKit endpoint
    add_fastapi_endpoint(app, remote, "/copilotkit")
    print("[OK] CopilotKit endpoint configured at /copilotkit")

except ImportError as e:
    print(f"Warning: CopilotKit integration not available: {e}")
    print("Install with: pip install copilotkit")

    # Fallback: Create a simple endpoint for testing
    @app.post("/copilotkit")
    async def copilotkit_fallback():
        return {
            "error": "CopilotKit not installed",
            "message": "Install copilotkit package to enable AG-UI protocol support"
        }

except Exception as e:
    print(f"Error configuring CopilotKit: {e}")
    print("Using fallback endpoint")

    @app.post("/copilotkit")
    async def copilotkit_error():
        return {
            "error": "CopilotKit configuration failed",
            "message": str(e)
        }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8123"))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"\n{'='*60}")
    print(f"Starting ChatLangA2UI Backend Server")
    print(f"{'='*60}")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"API Docs: http://localhost:{port}/docs")
    print(f"CopilotKit Endpoint: http://localhost:{port}/copilotkit")
    print(f"{'='*60}\n")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
