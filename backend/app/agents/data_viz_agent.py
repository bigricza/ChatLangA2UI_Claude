"""
Data Visualization Agent

Creates focused data visualizations and charts.
Specialized for transforming data into clear visual representations.
"""

from .base_agent import create_a2ui_agent


def build_data_viz_agent():
    """
    Build the data visualization agent using LangGraph.

    Returns:
        Compiled LangGraph workflow optimized for chart generation
    """
    return create_a2ui_agent(
        agent_name="data_viz_agent",
        prompt_template_name="chart_generation",
        model_name="claude-sonnet-4-5-20250929",
        temperature=0.7
    )
