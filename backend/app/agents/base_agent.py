"""
Base Agent Module

Provides shared functionality for all A2UI generation agents.
"""

import os
import json
import re
from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage

from app.schemas.a2ui_models import A2UIGenerationOutput
from app.utils.a2ui_builder import A2UIBuilder
from app.utils.prompt_loader import load_prompt_template


class AgentState(TypedDict):
    """Shared state structure for all agents"""
    messages: Annotated[List[BaseMessage], add_messages]
    user_request: str
    a2ui_output: dict
    error: str | None


def _create_llm(model_name: str, temperature: float, provider: str | None = None):
    """Create the appropriate LLM based on provider parameter or LLM_PROVIDER env var.

    Returns (llm, uses_structured_output) tuple.
    Gemini can't handle Any types in tool schemas, so we use plain JSON output.
    """
    if provider is None:
        provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    else:
        provider = provider.lower()

    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        model = os.getenv("GOOGLE_MODEL", "gemini-2.5-flash")
        print(f"[LLM] Using Google: {model}")
        llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_output_tokens=8192,
        )
        return llm, False
    else:
        from langchain_anthropic import ChatAnthropic
        model = os.getenv("ANTHROPIC_MODEL", model_name)
        print(f"[LLM] Using Anthropic: {model}")
        llm = ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=4096,
        ).with_structured_output(A2UIGenerationOutput)
        return llm, True


def _normalize_data_model_contents(contents):
    """Normalize dataModelUpdate contents into the expected list format.

    Gemini may return contents as a dict instead of a list of DataModelContent objects.
    This converts various shapes into the canonical: [{"key": "...", "valueArray|valueString|...": ...}]
    """
    if isinstance(contents, list):
        # Already a list - check if items need wrapping
        normalized = []
        for item in contents:
            if isinstance(item, dict) and "key" in item:
                normalized.append(item)
            else:
                # Raw data item in a list, wrap it
                normalized.append({"key": "data", "valueArray": contents})
                return normalized
        return normalized

    if isinstance(contents, dict):
        # Dict with key/value pairs - convert each to a DataModelContent
        if "key" in contents:
            # Single DataModelContent as a dict
            return [contents]
        if "valueArray" in contents:
            # Missing "key" wrapper
            return [{"key": "data", "valueArray": contents["valueArray"]}]
        # Dict of key-value pairs like {"totalSales": "$1.2M", ...}
        result = []
        for key, value in contents.items():
            if isinstance(value, str):
                result.append({"key": key, "valueString": value})
            elif isinstance(value, bool):
                result.append({"key": key, "valueBoolean": value})
            elif isinstance(value, (int, float)):
                result.append({"key": key, "valueNumber": float(value)})
            elif isinstance(value, list):
                result.append({"key": key, "valueArray": value})
        return result

    return [{"key": "data", "valueString": str(contents)}]


def _parse_json_response(text: str) -> A2UIGenerationOutput:
    """Parse a raw LLM text response into A2UIGenerationOutput.

    Normalizes Gemini's loosely-shaped JSON to match the Pydantic schema.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    data = json.loads(cleaned)

    # Normalize each message's dataModelUpdate contents
    for msg in data.get("messages", []):
        dmu = msg.get("dataModelUpdate")
        if dmu and "contents" in dmu:
            dmu["contents"] = _normalize_data_model_contents(dmu["contents"])

    return A2UIGenerationOutput(**data)


JSON_OUTPUT_INSTRUCTION = """

IMPORTANT: Return your response as a single JSON object (no markdown code fences) with this exact structure:
{
  "messages": [
    {
      "surfaceUpdate": {
        "surfaceId": "main",
        "components": [
          {"id": "title1", "component": {"Text": {"text": {"literalString": "Dashboard Title"}, "usage_hint": "title"}}},
          {"id": "card1", "component": {"Card": {"title": {"literalString": "Card Title"}, "children": ["child_id"]}}},
          {"id": "chart1", "component": {"Chart": {"config": {"type": "line", "xKey": "month", "yKey": "value", "dataPath": "/chartData"}}}},
          {"id": "table1", "component": {"Table": {"columns": [{"key": "name", "label": "Name", "type": "string"}], "dataPath": "/tableData"}}},
          {"id": "row1", "component": {"Row": {"children": ["card1", "card2"]}}}
        ]
      }
    },
    {
      "dataModelUpdate": {
        "surfaceId": "main",
        "path": "/chartData",
        "contents": [{"key": "data", "valueArray": [{"month": "Jan", "value": 100}]}]
      }
    },
    {"beginRendering": {"surfaceId": "main"}}
  ],
  "reasoning": "Brief explanation"
}

CRITICAL RULES for dataModelUpdate.contents:
- contents MUST be an array of objects
- Each object MUST have a "key" field and one value field: "valueArray", "valueString", "valueNumber", or "valueBoolean"
- For arrays of data, use: [{"key": "data", "valueArray": [...]}]

Supported component types: Text, Button, Card, Row, Column, Table, Chart, Form, TextField, DateTimeInput.
"""


def create_a2ui_agent(
    agent_name: str,
    prompt_template_name: str,
    model_name: str = "claude-sonnet-4-5-20250929",
    temperature: float = 0.7,
    provider: str | None = None
):
    """
    Factory function to create A2UI generation agents.

    Args:
        agent_name: Name of the agent (for logging)
        prompt_template_name: Name of the YAML prompt template to load
        model_name: Default model name (overridden by env vars)
        temperature: LLM temperature setting
        provider: LLM provider override ("google" or "anthropic")

    Returns:
        Compiled LangGraph workflow
    """

    llm, uses_structured_output = _create_llm(model_name, temperature, provider)

    # Load system prompt template
    try:
        system_prompt = load_prompt_template(prompt_template_name)
    except Exception as e:
        print(f"Warning: Could not load prompt template '{prompt_template_name}': {e}")
        system_prompt = "You are an A2UI generation assistant."

    # For providers that don't use structured output, append JSON instructions
    if not uses_structured_output:
        system_prompt += JSON_OUTPUT_INSTRUCTION

    def analyze_request(state: AgentState) -> AgentState:
        """
        Analyze user request and generate A2UI response.
        """
        try:
            # Get the last user message
            if state["messages"]:
                last_message = state["messages"][-1]
                user_msg = last_message.content if hasattr(last_message, 'content') else str(last_message)
            else:
                user_msg = state.get("user_request", "Generate a default interface")

            # Construct prompt
            prompt = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"""
User Request: {user_msg}

Please generate appropriate A2UI components for this request.

Remember to:
1. Use the surfaceUpdate message to define all components
2. Use dataModelUpdate messages to provide realistic sample data
3. End with a beginRendering message

Return a complete A2UI response following the protocol.
""")
            ]

            # Invoke LLM
            raw_result = llm.invoke(prompt)

            # Parse response based on provider
            if uses_structured_output:
                result = raw_result
            else:
                text = raw_result.content if hasattr(raw_result, 'content') else str(raw_result)
                result = _parse_json_response(text)

            # Convert to JSONL format
            a2ui_jsonl = A2UIBuilder.from_structured_output(result)

            state["a2ui_output"] = {
                "jsonl": a2ui_jsonl,
                "reasoning": result.reasoning if hasattr(result, 'reasoning') else None
            }
            state["error"] = None

        except Exception as e:
            print(f"Error in {agent_name} analyze_request: {e}")
            state["error"] = str(e)
            # Provide fallback minimal response
            state["a2ui_output"] = {
                "jsonl": _create_error_ui(str(e)),
                "reasoning": None
            }

        return state

    def stream_response(state: AgentState) -> AgentState:
        """
        Prepare response for streaming.
        CopilotKit handles actual streaming.
        """
        # This node exists for potential future processing
        # CopilotKit's AG-UI protocol handles the actual streaming
        return state

    # Build LangGraph workflow
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("analyze", analyze_request)
    workflow.add_node("stream", stream_response)

    # Define edges
    workflow.add_edge(START, "analyze")
    workflow.add_edge("analyze", "stream")
    workflow.add_edge("stream", END)

    return workflow.compile()


def _create_error_ui(error_message: str) -> str:
    """
    Create a simple error UI when agent fails.

    Args:
        error_message: Error description

    Returns:
        JSONL string with error message
    """
    builder = A2UIBuilder()
    builder.add_text("error_title", "Error", usage_hint="title")
    builder.add_card("error_card", "Generation Failed", children=["error_msg"])
    builder.add_text("error_msg", f"Failed to generate UI: {error_message}", usage_hint="body")
    return builder.build_jsonl()
