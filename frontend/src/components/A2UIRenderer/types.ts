/**
 * A2UI Protocol v0.8 TypeScript Types
 *
 * Mirrors the backend Pydantic models for frontend rendering.
 */

// ============================================================================
// Component Property Types
// ============================================================================

export interface LiteralString {
  literalString: string;
}

export interface TextComponent {
  text: LiteralString;
  usage_hint?: "title" | "subtitle" | "body";
}

export interface ButtonComponent {
  text: LiteralString;
  actionId: string;
  usage_hint?: "primary" | "secondary";
}

export interface RowComponent {
  children: string[];
}

export interface ColumnComponent {
  children: string[];
}

export interface CardComponent {
  children: string[];
  title?: LiteralString;
}

export interface TableColumn {
  key: string;
  label: string;
  type: "string" | "number" | "boolean";
}

export interface TableComponent {
  columns: TableColumn[];
  dataPath: string;
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "area";
  xKey: string;
  yKey: string;
  dataPath: string;
}

export interface ChartComponent {
  config: ChartConfig;
  title?: LiteralString;
}

export interface TextFieldComponent {
  label: LiteralString;
  bindingPath: string;
  placeholder?: LiteralString;
}

export interface DateTimeInputComponent {
  label: LiteralString;
  bindingPath: string;
  mode?: "date" | "time" | "datetime";
}

export interface FormComponent {
  children: string[];
  submitActionId: string;
}

// Union type for all possible component data
export type ComponentData =
  | { Text: TextComponent }
  | { Button: ButtonComponent }
  | { Card: CardComponent }
  | { Row: RowComponent }
  | { Column: ColumnComponent }
  | { Table: TableComponent }
  | { Chart: ChartComponent }
  | { Form: FormComponent }
  | { TextField: TextFieldComponent }
  | { DateTimeInput: DateTimeInputComponent };

// ============================================================================
// A2UI Message Types
// ============================================================================

export interface A2UIComponent {
  id: string;
  component: ComponentData;
}

export interface SurfaceUpdate {
  surfaceId: string;
  components: A2UIComponent[];
}

export interface DataModelContent {
  key: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueArray?: any[];
}

export interface DataModelUpdate {
  surfaceId: string;
  path?: string;
  contents: DataModelContent[];
}

export interface BeginRendering {
  surfaceId: string;
}

export interface DeleteSurface {
  surfaceId: string;
}

export interface A2UIMessage {
  surfaceUpdate?: SurfaceUpdate;
  dataModelUpdate?: DataModelUpdate;
  beginRendering?: BeginRendering;
  deleteSurface?: DeleteSurface;
}

// ============================================================================
// Frontend-Specific Types
// ============================================================================

export interface A2UISurface {
  id: string;
  components: Map<string, A2UIComponent>;
  dataModel: Record<string, any>;
}

export interface A2UIRendererProps {
  data: string; // JSONL string
}

export interface ComponentRegistryProps {
  componentId: string;
  surface: A2UISurface;
}

// Helper type to extract component type name
export type ComponentTypeName = keyof ComponentData;

// Helper to get component data by type
export type ComponentDataByType<T extends ComponentTypeName> = Extract<
  ComponentData,
  Record<T, any>
>[T];
