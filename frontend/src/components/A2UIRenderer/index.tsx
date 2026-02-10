/**
 * A2UIRenderer Component
 *
 * Parses JSONL A2UI messages and renders the UI surface.
 * Handles surfaceUpdate, dataModelUpdate, and beginRendering messages.
 */

import { useEffect, useState } from "react";
import { ComponentRegistry } from "./ComponentRegistry";
import type { A2UIMessage, A2UISurface, A2UIRendererProps } from "./types";

export function A2UIRenderer({ data }: A2UIRendererProps) {
  const [surface, setSurface] = useState<A2UISurface | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse JSONL messages (each line is a JSON object)
      const messages: A2UIMessage[] = data
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      // Initialize surface (will get ID from first surfaceUpdate)
      const newSurface: A2UISurface = {
        id: "main",
        components: new Map(),
        dataModel: {},
      };

      // Process messages in sequence
      for (const msg of messages) {
        if (msg.surfaceUpdate) {
          // Set surface ID from message
          newSurface.id = msg.surfaceUpdate.surfaceId || "main";

          // Add/update components
          for (const comp of msg.surfaceUpdate.components) {
            newSurface.components.set(comp.id, comp);
          }
        } else if (msg.dataModelUpdate) {
          // Update data model - ensure "/" root exists
          if (!newSurface.dataModel["/"]) {
            newSurface.dataModel["/"] = {};
          }

          const path = msg.dataModelUpdate.path || "/";

          // Navigate to the target location in the data model
          let targetObj = newSurface.dataModel["/"];

          if (path !== "/") {
            // Parse path like "/kpis" or "/customerGrowth" and create nested structure
            const pathParts = path.split("/").filter((p) => p);

            for (const part of pathParts) {
              if (!targetObj[part]) {
                targetObj[part] = {};
              }
              targetObj = targetObj[part];
            }
          }

          // Add data contents at the target location
          for (const item of msg.dataModelUpdate.contents) {
            if (item.key) {
              const value =
                item.valueString ??
                item.valueNumber ??
                item.valueBoolean ??
                item.valueArray;

              // Store the value
              if (item.valueArray && Array.isArray(item.valueArray)) {
                targetObj[item.key] = item.valueArray;
              } else {
                targetObj[item.key] = value;
              }
            }
          }
        } else if (msg.beginRendering) {
          // Signal ready to render
          setIsReady(true);
        } else if (msg.deleteSurface) {
          // Handle surface deletion
          console.log("Delete surface:", msg.deleteSurface);
        }
      }

      setSurface(newSurface);
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

  if (!isReady || !surface) {
    return (
      <div className="a2ui-loading">
        <div className="spinner"></div>
        <p>Loading UI...</p>
      </div>
    );
  }

  // Find root components (not referenced as children by any other component)
  const allChildIds = new Set<string>();
  surface.components.forEach((comp) => {
    const componentData = Object.values(comp.component)[0] as any;
    if (componentData?.children && Array.isArray(componentData.children)) {
      componentData.children.forEach((id: string) => allChildIds.add(id));
    }
  });

  const rootComponents = Array.from(surface.components.keys()).filter(
    (id) => !allChildIds.has(id)
  );

  return (
    <div className="a2ui-surface">
      {rootComponents.map((rootId) => (
        <ComponentRegistry
          key={rootId}
          componentId={rootId}
          surface={surface}
        />
      ))}
    </div>
  );
}
