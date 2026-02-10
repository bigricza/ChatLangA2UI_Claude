"""
Dashboard Agent

Generates comprehensive dashboards with charts, tables, KPIs, and metrics.
Specialized for business intelligence and analytics views.
"""

from .base_agent import create_a2ui_agent


def build_dashboard_agent():
    """
    Build the dashboard generation agent using LangGraph.

    Returns:
        Compiled LangGraph workflow optimized for dashboard generation
    """
    return create_a2ui_agent(
        agent_name="dashboard_agent",
        prompt_template_name="dashboard_generation",
        model_name="claude-sonnet-4-5-20250929",
        temperature=0.7
    )
