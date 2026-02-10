/**
 * A2UI Button Component
 *
 * Renders an interactive button with action handling.
 */

import type { ButtonComponent } from "../types";

interface A2UIButtonProps {
  data: ButtonComponent;
}

export function A2UIButton({ data }: A2UIButtonProps) {
  const text = data.text.literalString;
  const hint = data.usage_hint || "primary";

  const handleClick = () => {
    console.log(`Button clicked: ${data.actionId}`);
    // In a full implementation, this would trigger the action handler
    // For POC, we just log the action
  };

  const className = `a2ui-button a2ui-button-${hint}`;

  return (
    <button className={className} onClick={handleClick}>
      {text}
    </button>
  );
}
