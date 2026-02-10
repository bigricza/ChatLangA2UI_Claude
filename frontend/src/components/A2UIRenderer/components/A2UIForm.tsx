/**
 * A2UI Form Component
 *
 * Form container for input elements with submit handling.
 */

import { ReactNode, FormEvent } from "react";
import type { FormComponent, A2UISurface } from "../types";

interface A2UIFormProps {
  data: FormComponent;
  surface: A2UISurface;
  children: ReactNode;
}

export function A2UIForm({ data, children }: A2UIFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log(`Form submitted: ${data.submitActionId}`);
    // In a full implementation, this would:
    // 1. Collect form data from bindingPaths
    // 2. Trigger the submit action
    // For POC, we just log the action
  };

  return (
    <form className="a2ui-form" onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
