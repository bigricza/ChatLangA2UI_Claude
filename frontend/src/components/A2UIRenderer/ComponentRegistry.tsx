/**
 * Component Registry
 *
 * Maps A2UI component types to React component implementations.
 * Handles recursive rendering of nested components.
 */

import { A2UIText } from "./components/A2UIText";
import { A2UIButton } from "./components/A2UIButton";
import { A2UICard } from "./components/A2UICard";
import { A2UITable } from "./components/A2UITable";
import { A2UIChart } from "./components/A2UIChart";
import { A2UIForm } from "./components/A2UIForm";
import { A2UITextField } from "./components/A2UITextField";
import type { ComponentRegistryProps } from "./types";

export function ComponentRegistry({
  componentId,
  surface,
}: ComponentRegistryProps) {
  const component = surface.components.get(componentId);

  if (!component) {
    console.warn(`Component not found: ${componentId}`);
    return null;
  }

  // Extract component type and data
  const [componentType, componentData] = Object.entries(component.component)[0];

  // Helper function to resolve data path
  const resolveDataPath = (path: string): any => {
    if (!path) return null;
    const parts = path.split("/").filter((p) => p);
    let value: any = surface.dataModel["/"];
    for (const part of parts) {
      if (value && typeof value === "object") {
        // If value is an array with one element, access it directly
        if (Array.isArray(value) && value.length === 1 && typeof value[0] === "object") {
          value = value[0][part];
        } else {
          value = value[part];
        }
      } else {
        return null;
      }
    }
    return value;
  };

  // Map A2UI component types to React components
  switch (componentType) {
    case "Text":
      // Check for dataPath at top level (incorrect format from backend)
      const topLevelPath = componentData.dataPath || componentData.dataBinding;
      // Check for dataPath inside text property (correct format)
      const textPath = componentData.text?.dataPath || componentData.text?.dataBinding;

      const pathToResolve = topLevelPath || textPath;

      if (pathToResolve) {
        let resolvedText = resolveDataPath(pathToResolve);
        // Unwrap {"data": "value"} pattern from dataModelUpdate contents
        if (resolvedText && typeof resolvedText === 'object' && 'data' in resolvedText) {
          resolvedText = resolvedText.data;
        }
        const modifiedData = {
          ...componentData,
          text: { literalString: String(resolvedText ?? "") },
        };
        return <A2UIText data={modifiedData} />;
      }
      return <A2UIText data={componentData} />;

    case "Button":
      return <A2UIButton data={componentData} />;

    case "Card":
      // Debug log to see Card data
      console.log('[ComponentRegistry] Card data:', {
        componentId,
        title: componentData.title,
        children: componentData.children
      });

      // Resolve dataPath in title if present
      let cardData = componentData;
      if (componentData.title?.dataPath) {
        const resolvedTitle = resolveDataPath(componentData.title.dataPath);
        cardData = {
          ...componentData,
          title: { literalString: String(resolvedTitle || "") },
        };
      }

      return (
        <A2UICard data={cardData}>
          {componentData.children?.map((childId: string) => (
            <ComponentRegistry
              key={childId}
              componentId={childId}
              surface={surface}
            />
          ))}
        </A2UICard>
      );

    case "Row":
      return (
        <div className="a2ui-row">
          {componentData.children?.map((childId: string) => (
            <ComponentRegistry
              key={childId}
              componentId={childId}
              surface={surface}
            />
          ))}
        </div>
      );

    case "Column":
      return (
        <div className="a2ui-column">
          {componentData.children?.map((childId: string) => (
            <ComponentRegistry
              key={childId}
              componentId={childId}
              surface={surface}
            />
          ))}
        </div>
      );

    case "Table":
      // Get data from data model using dataPath
      const tablePath = componentData.dataPath;
      let resolvedTableData = tablePath ? resolveDataPath(tablePath) : [];

      // Unwrap if data is in a "data" property (common backend pattern)
      if (resolvedTableData && typeof resolvedTableData === 'object' && 'data' in resolvedTableData) {
        resolvedTableData = resolvedTableData.data;
      }

      const tableData = Array.isArray(resolvedTableData) ? resolvedTableData : [];
      console.log('[ComponentRegistry] Table data resolution:', {
        path: tablePath,
        resolvedData: resolvedTableData,
        finalArray: tableData
      });
      return <A2UITable data={componentData} tableData={tableData} />;

    case "Chart":
      // Get data from data model using dataPath
      const chartPath = componentData.config.dataPath;
      let resolvedChartData = chartPath ? resolveDataPath(chartPath) : [];

      // Unwrap if data is in a "data" property (common backend pattern)
      if (resolvedChartData && typeof resolvedChartData === 'object' && 'data' in resolvedChartData) {
        resolvedChartData = resolvedChartData.data;
      }

      const chartData = Array.isArray(resolvedChartData) ? resolvedChartData : [];
      console.log('[ComponentRegistry] Chart data resolution:', {
        path: chartPath,
        resolvedData: resolvedChartData,
        finalArray: chartData
      });
      return <A2UIChart data={componentData} chartData={chartData} />;

    case "Form":
      return (
        <A2UIForm data={componentData} surface={surface}>
          {componentData.children?.map((childId: string) => (
            <ComponentRegistry
              key={childId}
              componentId={childId}
              surface={surface}
            />
          ))}
        </A2UIForm>
      );

    case "TextField":
      return <A2UITextField data={componentData} />;

    case "DateTimeInput":
      // Handle both formats: plain string or {literalString: "..."}
      const dateLabel = typeof componentData.label === 'string'
        ? componentData.label
        : componentData.label?.literalString;
      return (
        <div className="a2ui-datetime-input">
          {dateLabel && <label>{dateLabel}</label>}
          <input
            type={componentData.mode === "time" ? "time" : "date"}
          />
        </div>
      );

    default:
      console.warn(`Unknown component type: ${componentType}`);
      return (
        <div className="a2ui-unknown">
          <p>Unsupported component: {componentType}</p>
        </div>
      );
  }
}
