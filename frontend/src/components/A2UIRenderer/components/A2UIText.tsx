/**
 * A2UI Text Component
 *
 * Renders text with usage_hint for styling (title, subtitle, body).
 */

import type { TextComponent } from "../types";

interface A2UITextProps {
  data: TextComponent;
}

export function A2UIText({ data }: A2UITextProps) {
  const text = data.text.literalString;
  const hint = data.usage_hint || "body";

  const className = `a2ui-text a2ui-text-${hint}`;

  switch (hint) {
    case "title":
      return <h1 className={className}>{text}</h1>;
    case "subtitle":
      return <h2 className={className}>{text}</h2>;
    case "body":
    default:
      return <p className={className}>{text}</p>;
  }
}
