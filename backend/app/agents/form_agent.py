"""
Form Agent

Generates interactive input forms for collecting user data.
Specialized for creating intuitive, accessible form interfaces.
"""

from .base_agent import create_a2ui_agent


def build_form_agent():
    """
    Build the form generation agent using LangGraph.

    Returns:
        Compiled LangGraph workflow optimized for form generation
    """
    return create_a2ui_agent(
        agent_name="form_agent",
        prompt_template_name="form_generation",
        model_name="claude-sonnet-4-5-20250929",
        temperature=0.7
    )
