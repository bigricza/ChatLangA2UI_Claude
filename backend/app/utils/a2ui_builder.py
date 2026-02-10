"""
A2UI Builder Utility

Provides helper methods for constructing A2UI messages and converting
structured output to JSONL format for streaming to the frontend.
"""

import json
from typing import List, Dict, Any, Optional
from app.schemas.a2ui_models import (
    A2UIMessage,
    SurfaceUpdate,
    DataModelUpdate,
    BeginRendering,
    A2UIComponent,
    DataModelContent,
    A2UIGenerationOutput,
)


class A2UIBuilder:
    """
    Utility class for building A2UI JSONL messages.

    Usage:
        builder = A2UIBuilder()
        builder.add_text("title1", "Dashboard Title", usage_hint="title")
        builder.add_card("card1", "Revenue", children=["chart1"])
        builder.add_chart("chart1", "line", "month", "revenue", "/salesData")
        builder.add_data("/salesData", {"data": [...]})
        jsonl = builder.build_jsonl()
    """

    def __init__(self, surface_id: str = "main"):
        self.surface_id = surface_id
        self.components: List[A2UIComponent] = []
        self.data_updates: List[DataModelUpdate] = []

    def add_component(self, component_id: str, component_type: str, **props) -> "A2UIBuilder":
        """
        Add a component to the surface.

        Args:
            component_id: Unique ID for the component
            component_type: Type of component (Text, Card, Table, etc.)
            **props: Component-specific properties
        """
        component = A2UIComponent(
            id=component_id,
            component={component_type: props}
        )
        self.components.append(component)
        return self

    def add_text(
        self,
        component_id: str,
        text: str,
        usage_hint: str = "body"
    ) -> "A2UIBuilder":
        """Add a Text component"""
        return self.add_component(
            component_id,
            "Text",
            text={"literalString": text},
            usage_hint=usage_hint
        )

    def add_button(
        self,
        component_id: str,
        text: str,
        action_id: str,
        usage_hint: str = "primary"
    ) -> "A2UIBuilder":
        """Add a Button component"""
        return self.add_component(
            component_id,
            "Button",
            text={"literalString": text},
            actionId=action_id,
            usage_hint=usage_hint
        )

    def add_card(
        self,
        component_id: str,
        title: Optional[str],
        children: List[str]
    ) -> "A2UIBuilder":
        """Add a Card component"""
        props = {"children": children}
        if title:
            props["title"] = {"literalString": title}
        return self.add_component(component_id, "Card", **props)

    def add_row(self, component_id: str, children: List[str]) -> "A2UIBuilder":
        """Add a Row layout component"""
        return self.add_component(component_id, "Row", children=children)

    def add_column(self, component_id: str, children: List[str]) -> "A2UIBuilder":
        """Add a Column layout component"""
        return self.add_component(component_id, "Column", children=children)

    def add_table(
        self,
        component_id: str,
        columns: List[Dict[str, str]],
        data_path: str
    ) -> "A2UIBuilder":
        """
        Add a Table component.

        Args:
            component_id: Unique ID
            columns: List of {key, label, type} dicts
            data_path: Path in data model (e.g., "/products")
        """
        return self.add_component(
            component_id,
            "Table",
            columns=columns,
            dataPath=data_path
        )

    def add_chart(
        self,
        component_id: str,
        chart_type: str,
        x_key: str,
        y_key: str,
        data_path: str,
        title: Optional[str] = None
    ) -> "A2UIBuilder":
        """
        Add a Chart component.

        Args:
            component_id: Unique ID
            chart_type: line, bar, pie, area
            x_key: Key for X-axis data
            y_key: Key for Y-axis data
            data_path: Path in data model (e.g., "/salesData")
            title: Optional chart title
        """
        props = {
            "config": {
                "type": chart_type,
                "xKey": x_key,
                "yKey": y_key,
                "dataPath": data_path
            }
        }
        if title:
            props["title"] = {"literalString": title}
        return self.add_component(component_id, "Chart", **props)

    def add_form(
        self,
        component_id: str,
        children: List[str],
        submit_action_id: str
    ) -> "A2UIBuilder":
        """Add a Form component"""
        return self.add_component(
            component_id,
            "Form",
            children=children,
            submitActionId=submit_action_id
        )

    def add_text_field(
        self,
        component_id: str,
        label: str,
        binding_path: str,
        placeholder: Optional[str] = None
    ) -> "A2UIBuilder":
        """Add a TextField component"""
        props = {
            "label": {"literalString": label},
            "bindingPath": binding_path
        }
        if placeholder:
            props["placeholder"] = {"literalString": placeholder}
        return self.add_component(component_id, "TextField", **props)

    def add_data(self, path: str, data: Dict[str, Any]) -> "A2UIBuilder":
        """
        Add data to the data model.

        Args:
            path: Path in data model (e.g., "/salesData", "/products")
            data: Dictionary of data items
        """
        contents = []
        for key, value in data.items():
            content = DataModelContent(key=key)
            if isinstance(value, str):
                content.valueString = value
            elif isinstance(value, bool):
                content.valueBoolean = value
            elif isinstance(value, (int, float)):
                content.valueNumber = float(value)
            elif isinstance(value, list):
                content.valueArray = value
            contents.append(content)

        update = DataModelUpdate(
            surfaceId=self.surface_id,
            path=path,
            contents=contents
        )
        self.data_updates.append(update)
        return self

    def build_jsonl(self) -> str:
        """
        Build JSONL output for streaming to frontend.

        Returns:
            JSONL string with messages in sequence:
            1. surfaceUpdate (components)
            2. dataModelUpdate(s) (data)
            3. beginRendering (signal to render)
        """
        messages = []

        # 1. surfaceUpdate with all components
        if self.components:
            surface_update = A2UIMessage(
                surfaceUpdate=SurfaceUpdate(
                    surfaceId=self.surface_id,
                    components=self.components
                )
            )
            messages.append(json.dumps(surface_update.model_dump(exclude_none=True)))

        # 2. dataModelUpdate(s) with data
        for data_update in self.data_updates:
            data_msg = A2UIMessage(dataModelUpdate=data_update)
            messages.append(json.dumps(data_msg.model_dump(exclude_none=True)))

        # 3. beginRendering signal
        begin_msg = A2UIMessage(
            beginRendering=BeginRendering(surfaceId=self.surface_id)
        )
        messages.append(json.dumps(begin_msg.model_dump(exclude_none=True)))

        return "\n".join(messages)

    @staticmethod
    def from_structured_output(output: A2UIGenerationOutput) -> str:
        """
        Convert Claude's structured output to JSONL format.

        Args:
            output: A2UIGenerationOutput from Claude

        Returns:
            JSONL string ready for streaming
        """
        jsonl_lines = []
        for msg in output.messages:
            jsonl_lines.append(json.dumps(msg.model_dump(exclude_none=True)))
        return "\n".join(jsonl_lines)

    def clear(self) -> "A2UIBuilder":
        """Clear all components and data"""
        self.components = []
        self.data_updates = []
        return self


def create_sample_dashboard() -> str:
    """
    Create a sample dashboard for testing.

    Returns:
        JSONL string for a sample sales dashboard
    """
    builder = A2UIBuilder()

    # Title
    builder.add_text("title", "Sales Dashboard", usage_hint="title")

    # Revenue card with chart
    builder.add_card("revenue_card", "Revenue Trend", children=["revenue_chart"])
    builder.add_chart(
        "revenue_chart",
        chart_type="line",
        x_key="month",
        y_key="revenue",
        data_path="/salesData"
    )

    # Products card with table
    builder.add_card("products_card", "Top Products", children=["products_table"])
    builder.add_table(
        "products_table",
        columns=[
            {"key": "product", "label": "Product", "type": "string"},
            {"key": "sales", "label": "Sales", "type": "number"},
            {"key": "growth", "label": "Growth", "type": "number"}
        ],
        data_path="/products"
    )

    # Sample data
    builder.add_data("/salesData", {
        "data": [
            {"month": "Jan", "revenue": 45000},
            {"month": "Feb", "revenue": 52000},
            {"month": "Mar", "revenue": 48000},
            {"month": "Apr", "revenue": 61000},
            {"month": "May", "revenue": 58000},
            {"month": "Jun", "revenue": 67000}
        ]
    })

    builder.add_data("/products", {
        "data": [
            {"product": "Widget A", "sales": 1200, "growth": 15.5},
            {"product": "Widget B", "sales": 980, "growth": 8.2},
            {"product": "Widget C", "sales": 750, "growth": -3.1},
            {"product": "Widget D", "sales": 620, "growth": 22.7}
        ]
    })

    return builder.build_jsonl()
