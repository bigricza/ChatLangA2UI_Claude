"""
Base Agent Module

Provides shared functionality for all A2UI generation agents.
"""

from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_anthropic import ChatAnthropic
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


def create_a2ui_agent(
    agent_name: str,
    prompt_template_name: str,
    model_name: str = "claude-sonnet-4-5-20250929",
    temperature: float = 0.7
):
    """
    Factory function to create A2UI generation agents.

    Args:
        agent_name: Name of the agent (for logging)
        prompt_template_name: Name of the YAML prompt template to load
        model_name: Claude model to use
        temperature: LLM temperature setting

    Returns:
        Compiled LangGraph workflow
    """

    # Initialize Claude with structured output and increased token limit
    llm = ChatAnthropic(
        model=model_name,
        temperature=temperature,
        max_tokens=4096,  # Increased for A2UI generation
    ).with_structured_output(A2UIGenerationOutput)

    # Load system prompt template
    try:
        system_prompt = load_prompt_template(prompt_template_name)
    except Exception as e:
        print(f"Warning: Could not load prompt template '{prompt_template_name}': {e}")
        system_prompt = "You are an A2UI generation assistant."

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

            # Get structured output from Claude
            result = llm.invoke(prompt)

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
