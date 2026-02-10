/**
 * A2UI Card Component
 *
 * Container component with optional title for grouping related content.
 */

import { ReactNode } from "react";
import type { CardComponent } from "../types";

interface A2UICardProps {
  data: CardComponent;
  children: ReactNode;
}

export function A2UICard({ data, children }: A2UICardProps) {
  // Handle both formats: {literalString: "..."} or plain string
  const title = typeof data.title === 'string'
    ? data.title
    : data.title?.literalString;

  return (
    <div className="a2ui-card">
      {title && (
        <div className="a2ui-card-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="a2ui-card-content">{children}</div>
    </div>
  );
}
