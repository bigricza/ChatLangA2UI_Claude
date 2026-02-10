/**
 * Official A2UI Renderer using CopilotKit's A2UIViewer
 *
 * Parses JSONL A2UI messages and renders using the official renderer.
 */

import { useState, useEffect } from "react";
import { A2UIViewer } from "@copilotkit/a2ui-renderer";
import type { v0_8 } from "@a2ui/lit";

interface OfficialA2UIRendererProps {
  data: string; // JSONL string from backend
}

interface A2UIMessage {
  surfaceUpdate?: {
    surfaceId: string;
    components: v0_8.Types.ComponentInstance[];
  };
  dataModelUpdate?: {
    surfaceId: string;
    path: string;
    contents: Array<{
      key: string;
      valueString?: string;
      valueNumber?: number;
      valueBoolean?: boolean;
      valueArray?: any[];
    }>;
  };
  beginRendering?: {
    surfaceId: string;
  };
  deleteSurface?: {
    surfaceId: string;
  };
}

export function OfficialA2UIRenderer({ data }: OfficialA2UIRendererProps) {
  const [components, setComponents] = useState<v0_8.Types.ComponentInstance[]>([]);
  const [dataModel, setDataModel] = useState<Record<string, unknown>>({});
  const [rootId, setRootId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse JSONL messages
      const messages: A2UIMessage[] = data
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      let newComponents: v0_8.Types.ComponentInstance[] = [];
      let newDataModel: Record<string, unknown> = {};

      // Process messages in sequence
      for (const msg of messages) {
        if (msg.surfaceUpdate) {
          // Store components
          newComponents = msg.surfaceUpdate.components;
        } else if (msg.dataModelUpdate) {
          // Build data model - flatten paths into nested structure
          const path = msg.dataModelUpdate.path || "/";
          const pathParts = path.split("/").filter((p) => p);

          // Navigate to target location
          let target: any = newDataModel;
          for (const part of pathParts) {
            if (!target[part]) {
              target[part] = {};
            }
            target = target[part];
          }

          // Add contents
          for (const item of msg.dataModelUpdate.contents) {
            if (item.key) {
              const value =
                item.valueString ??
                item.valueNumber ??
                item.valueBoolean ??
                item.valueArray;

              target[item.key] = value;
            }
          }
        } else if (msg.beginRendering) {
          // Signal ready
          setIsReady(true);
        }
      }

      // Resolve dataPaths in components before passing to A2UIViewer
      const resolveDataPath = (path: string, data: Record<string, unknown>): any => {
        const parts = path.split("/").filter((p) => p);
        let value: any = data;
        for (const part of parts) {
          if (value && typeof value === "object") {
            value = value[part];
          } else {
            return null;
          }
        }
        return value;
      };

      const resolvedComponents = newComponents.map((comp) => {
        const componentType = Object.keys(comp.component)[0];
        const componentData = JSON.parse(JSON.stringify(comp.component[componentType])); // Deep clone

        // Recursively resolve dataPaths in component properties
        const resolveInObject = (obj: any): any => {
          if (!obj || typeof obj !== "object") return obj;

          if (obj.dataPath && typeof obj.dataPath === "string") {
            // Resolve the dataPath
            const value = resolveDataPath(obj.dataPath, newDataModel);
            if (value !== null && value !== undefined) {
              // Replace dataPath with literalString
              return { literalString: String(value) };
            }
          }

          // Recursively process nested objects
          const result: any = Array.isArray(obj) ? [] : {};
          for (const key in obj) {
            result[key] = resolveInObject(obj[key]);
          }
          return result;
        };

        const resolvedData = resolveInObject(componentData);

        return {
          id: comp.id,
          component: {
            [componentType]: resolvedData,
          },
        };
      });

      // Find root component (not referenced by any other component)
      const allChildIds = new Set<string>();
      resolvedComponents.forEach((comp) => {
        const componentData = Object.values(comp.component)[0] as any;
        if (componentData?.children && Array.isArray(componentData.children)) {
          componentData.children.forEach((id: string) => allChildIds.add(id));
        }
      });

      const roots = resolvedComponents.filter((comp) => !allChildIds.has(comp.id));
      const root = roots.length > 0 ? roots[0].id : (resolvedComponents[0]?.id || null);

      setComponents(resolvedComponents);
      setDataModel(newDataModel);
      setRootId(root);
      setError(null);
    } catch (err) {
      console.error("Error parsing A2UI data:", err);
      setError(err instanceof Error ? err.message : "Failed to parse A2UI data");
      setIsReady(false);
    }
  }, [data]);

  if (error) {
    return (
      <div className="a2ui-error">
        <h3>Error Rendering UI</h3>
        <p>{error}</p>
        <details>
          <summary>Raw Data</summary>
          <pre>{data}</pre>
        </details>
      </div>
    );
  }

  if (!isReady || !rootId || components.length === 0) {
    return (
      <div className="a2ui-loading">
        <div className="spinner"></div>
        <p>Loading UI...</p>
      </div>
    );
  }

  return (
    <div className="official-a2ui-renderer">
      <A2UIViewer
        root={rootId}
        components={components}
        data={dataModel}
        onAction={(action) => {
          console.log("[A2UI Action]", action);
          // Handle user actions (button clicks, etc.)
        }}
        className="a2ui-surface"
      />
    </div>
  );
}
