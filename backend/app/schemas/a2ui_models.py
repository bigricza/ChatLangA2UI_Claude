"""
A2UI Protocol v0.8 Pydantic Models

These models define the A2UI (Agent-to-User Interface) protocol structure
for generating declarative UI components from LLMs.
"""

from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field
from enum import Enum


class ComponentType(str, Enum):
    """Available A2UI component types"""
    TEXT = "Text"
    BUTTON = "Button"
    CARD = "Card"
    ROW = "Row"
    COLUMN = "Column"
    TABLE = "Table"
    CHART = "Chart"
    FORM = "Form"
    TEXT_FIELD = "TextField"
    DATE_TIME_INPUT = "DateTimeInput"


# ============================================================================
# Component Property Models
# ============================================================================

class LiteralString(BaseModel):
    """String wrapper for A2UI text values"""
    literalString: str


class TextComponent(BaseModel):
    """Text display component"""
    text: LiteralString
    usage_hint: Optional[str] = Field(default="body", description="title, subtitle, or body")


class ButtonComponent(BaseModel):
    """Interactive button component"""
    text: LiteralString
    actionId: str = Field(description="Identifier for button action")
    usage_hint: Optional[str] = Field(default="primary", description="primary or secondary")


class RowComponent(BaseModel):
    """Horizontal layout container"""
    children: List[str] = Field(description="List of child component IDs")


class ColumnComponent(BaseModel):
    """Vertical layout container"""
    children: List[str] = Field(description="List of child component IDs")


class CardComponent(BaseModel):
    """Card container with optional title"""
    children: List[str] = Field(description="List of child component IDs")
    title: Optional[LiteralString] = None


class TableColumn(BaseModel):
    """Table column definition"""
    key: str = Field(description="Data key for this column")
    label: str = Field(description="Display label for column header")
    type: str = Field(default="string", description="Data type: string, number, boolean")


class TableComponent(BaseModel):
    """Data table component"""
    columns: List[TableColumn] = Field(description="Column definitions")
    dataPath: str = Field(description="Path in data model to bind table data")


class ChartConfig(BaseModel):
    """Chart configuration"""
    type: str = Field(description="Chart type: line, bar, pie, area")
    xKey: str = Field(description="Data key for X-axis")
    yKey: str = Field(description="Data key for Y-axis")
    dataPath: str = Field(description="Path in data model to bind chart data")


class ChartComponent(BaseModel):
    """Chart/visualization component"""
    config: ChartConfig
    title: Optional[LiteralString] = None


class TextFieldComponent(BaseModel):
    """Text input field"""
    label: LiteralString
    bindingPath: str = Field(description="Path in data model to bind value")
    placeholder: Optional[LiteralString] = None


class DateTimeInputComponent(BaseModel):
    """Date/time input field"""
    label: LiteralString
    bindingPath: str = Field(description="Path in data model to bind value")
    mode: Optional[str] = Field(default="date", description="date, time, or datetime")


class FormComponent(BaseModel):
    """Form container"""
    children: List[str] = Field(description="List of child component IDs")
    submitActionId: str = Field(description="Action ID for form submission")


# ============================================================================
# A2UI Message Models
# ============================================================================

class A2UIComponent(BaseModel):
    """
    A2UI component with ID and type-specific data.
    Uses flat adjacency-list structure (not nested).
    """
    id: str = Field(description="Unique component identifier")
    component: Dict[str, Any] = Field(
        description="Component type and properties. Key is ComponentType, value is component data."
    )


class SurfaceUpdate(BaseModel):
    """
    Surface update message - defines UI components.
    First message in A2UI sequence.
    """
    surfaceId: str = Field(description="Identifier for this UI surface")
    components: List[A2UIComponent] = Field(description="List of components to display")


class DataModelContent(BaseModel):
    """Individual data item in data model"""
    key: str
    valueString: Optional[str] = None
    valueNumber: Optional[float] = None
    valueBoolean: Optional[bool] = None
    valueArray: Optional[List[Any]] = None


class DataModelUpdate(BaseModel):
    """
    Data model update message - provides data for components.
    Second message in A2UI sequence.
    """
    surfaceId: str
    path: Optional[str] = Field(default="/", description="Path in data model")
    contents: List[DataModelContent] = Field(description="Data items")


class BeginRendering(BaseModel):
    """
    Begin rendering signal - tells frontend to render the UI.
    Final message in A2UI sequence.
    """
    surfaceId: str


class A2UIMessage(BaseModel):
    """
    A2UI protocol message.
    Each JSONL line is one message with one of these fields populated.
    """
    surfaceUpdate: Optional[SurfaceUpdate] = None
    dataModelUpdate: Optional[DataModelUpdate] = None
    beginRendering: Optional[BeginRendering] = None
    deleteSurface: Optional[Dict[str, str]] = None


# ============================================================================
# Structured Output Schema for Claude
# ============================================================================

class A2UIGenerationOutput(BaseModel):
    """
    Schema for Claude to generate complete A2UI interfaces.
    This is what Claude returns via structured output.
    """
    messages: List[A2UIMessage] = Field(
        description="Sequence of A2UI messages: surfaceUpdate, dataModelUpdate(s), beginRendering"
    )
    reasoning: Optional[str] = Field(
        default=None,
        description="Optional explanation of UI design decisions"
    )


# ============================================================================
# Helper Schemas
# ============================================================================

class AgentConfig(BaseModel):
    """Configuration for an agent loaded from MD file"""
    name: str
    description: str
    capabilities: List[str] = []
    components: List[str] = []
