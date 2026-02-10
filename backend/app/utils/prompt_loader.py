"""
Prompt and Configuration Loader

Utilities for loading prompt templates from YAML files and agent
configurations from Markdown files.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any


def load_prompt_template(prompt_name: str) -> str:
    """
    Load a prompt template from YAML file.

    Args:
        prompt_name: Name of the prompt file (without .yaml extension)

    Returns:
        Template string

    Raises:
        FileNotFoundError: If prompt file doesn't exist
        ValueError: If prompt format is invalid
    """
    base_path = Path(__file__).parent.parent / "prompts"
    yaml_path = base_path / f"{prompt_name}.yaml"

    if not yaml_path.exists():
        raise FileNotFoundError(f"Prompt template not found: {yaml_path}")

    with open(yaml_path, 'r', encoding='utf-8') as f:
        prompt_config = yaml.safe_load(f)

    if not prompt_config:
        raise ValueError(f"Empty prompt file: {yaml_path}")

    if prompt_config.get("_type") != "prompt":
        raise ValueError(f"Invalid prompt type in {yaml_path}. Expected '_type: prompt'")

    # Check if template is in separate file or inline
    if "template_path" in prompt_config:
        template_path = base_path / prompt_config["template_path"]
        if not template_path.exists():
            raise FileNotFoundError(f"Template file not found: {template_path}")
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif "template" in prompt_config:
        return prompt_config["template"]
    else:
        raise ValueError(f"No template or template_path found in {yaml_path}")


def load_agent_config(agent_name: str) -> Dict[str, Any]:
    """
    Load agent configuration from Markdown file.

    Args:
        agent_name: Name of the agent (without .md extension)

    Returns:
        Dictionary with agent configuration:
        {
            "name": str,
            "description": str,
            "capabilities": List[str],
            "components": List[str],
            "full_content": str
        }

    Raises:
        FileNotFoundError: If agent config file doesn't exist
    """
    base_path = Path(__file__).parent.parent.parent / "configs" / "agents"
    md_path = base_path / f"{agent_name}.md"

    if not md_path.exists():
        raise FileNotFoundError(f"Agent config not found: {md_path}")

    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Initialize config
    config = {
        "name": agent_name,
        "description": "",
        "capabilities": [],
        "components": [],
        "full_content": content
    }

    # Simple markdown parsing
    sections = content.split("\n## ")

    for section in sections:
        lines = section.split("\n")
        if not lines:
            continue

        section_title = lines[0].strip("# ").strip()

        if section_title == "Purpose":
            # Get description from lines after title
            desc_lines = [line.strip() for line in lines[1:] if line.strip() and not line.startswith("#")]
            config["description"] = " ".join(desc_lines)

        elif section_title == "Capabilities":
            # Extract bullet points
            for line in lines[1:]:
                line = line.strip()
                if line.startswith("- ") or line.startswith("* "):
                    config["capabilities"].append(line[2:].strip())

        elif section_title == "A2UI Components Used":
            # Extract bullet points
            for line in lines[1:]:
                line = line.strip()
                if line.startswith("- ") or line.startswith("* "):
                    config["components"].append(line[2:].strip())

    return config


def load_component_catalog() -> Dict[str, Any]:
    """
    Load the A2UI component catalog from YAML.

    Returns:
        Dictionary with component catalog definitions

    Raises:
        FileNotFoundError: If catalog file doesn't exist
    """
    base_path = Path(__file__).parent.parent.parent / "configs" / "catalog"
    catalog_path = base_path / "component_catalog.yaml"

    if not catalog_path.exists():
        raise FileNotFoundError(f"Component catalog not found: {catalog_path}")

    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = yaml.safe_load(f)

    return catalog


def format_prompt_with_context(template: str, **kwargs) -> str:
    """
    Format a prompt template with context variables.

    Args:
        template: Template string (may contain {variable} placeholders)
        **kwargs: Context variables to substitute

    Returns:
        Formatted prompt string
    """
    try:
        return template.format(**kwargs)
    except KeyError as e:
        raise ValueError(f"Missing required context variable: {e}")
