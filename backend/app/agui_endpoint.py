"""
AG-UI Protocol Endpoint

Simple implementation of AG-UI protocol for streaming A2UI responses.
Uses Server-Sent Events (SSE) for real-time streaming.
"""

from fastapi import Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
import json
import asyncio


async def agui_stream_endpoint(request: Request, dashboard_graph, data_viz_graph, form_graph, body: dict | None = None):
    """
    AG-UI protocol endpoint with SSE streaming.

    Streams A2UI JSONL responses line by line for real-time UI updates.
    """

    # Use pre-parsed body if provided, otherwise parse from request
    if body is None:
        body = await request.json()
    message = body.get("message", "")
    agent_name = body.get("agent", "dashboard_agent")

    print(f"\n[AG-UI] Received request for agent: {agent_name}")
    print(f"[AG-UI] Message: {message}")

    async def event_stream():
        try:

            # Select agent based on request
            agent_graph = {
                "dashboard_agent": dashboard_graph,
                "data_viz_agent": data_viz_graph,
                "form_agent": form_graph,
            }.get(agent_name, dashboard_graph)

            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': 'Message received...'})}\n\n"
            await asyncio.sleep(0.05)

            # Status: Calling LLM
            yield f"data: {json.dumps({'type': 'status', 'message': 'Calling LLM AI to generate UI...'})}\n\n"
            await asyncio.sleep(0.05)

            # Periodic status messages during agent processing
            status_messages = [
                "Analyzing your request...",
                "Planning dashboard layout...",
                "Selecting visualization components...",
                "Generating data structures...",
                "Creating interactive elements...",
                "Finalizing UI design...",
            ]

            # Run agent invocation with periodic status updates
            agent_task = asyncio.create_task(agent_graph.ainvoke({
                "messages": [HumanMessage(content=message)],
                "user_request": message,
                "a2ui_output": {},
                "error": None
            }))

            # Send periodic updates while waiting
            status_index = 0
            while not agent_task.done():
                await asyncio.sleep(3)  # Wait 3 seconds between updates
                if not agent_task.done():
                    status_msg = status_messages[status_index % len(status_messages)]
                    yield f"data: {json.dumps({'type': 'status', 'message': status_msg})}\n\n"
                    status_index += 1

            # Get the result
            result = await agent_task

            # Status: Processing complete
            yield f"data: {json.dumps({'type': 'status', 'message': 'UI generation complete! Streaming components...'})}\n\n"
            await asyncio.sleep(0.05)

            # Extract A2UI JSONL
            a2ui_data = result.get("a2ui_output", {})
            a2ui_jsonl = a2ui_data.get("jsonl", "")
            reasoning = a2ui_data.get("reasoning", None)

            if a2ui_jsonl:
                print(f"[AG-UI] Streaming A2UI response ({len(a2ui_jsonl)} chars)")

                # Stream each JSONL line
                lines = a2ui_jsonl.strip().split("\n")
                for line in lines:
                    if line.strip():
                        # Send as AG-UI message
                        yield f"data: {json.dumps({'type': 'a2ui', 'data': line})}\n\n"
                        await asyncio.sleep(0.05)  # Small delay for smooth streaming

                # Send completion message
                yield f"data: {json.dumps({'type': 'complete', 'reasoning': reasoning})}\n\n"
                print("[AG-UI] Stream completed successfully")
            else:
                error_msg = result.get("error", "Unknown error")
                yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"
                print(f"[AG-UI] Error: {error_msg}")

        except Exception as e:
            print(f"[AG-UI] Stream error: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering in nginx
        }
    )
