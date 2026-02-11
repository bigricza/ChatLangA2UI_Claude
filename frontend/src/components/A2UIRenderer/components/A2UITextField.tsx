/**
 * A2UI TextField Component
 *
 * Input field for forms (text, email, password, etc.).
 */

import type { TextFieldComponent } from "../types";

interface A2UITextFieldProps {
  data: TextFieldComponent;
}

export function A2UITextField({ data }: A2UITextFieldProps) {
  // Handle both formats: plain string or {literalString: "..."}
  const label = typeof data.label === 'string'
    ? data.label
    : data.label?.literalString;
  const placeholder = typeof data.placeholder === 'string'
    ? data.placeholder
    : data.placeholder?.literalString;
  const inputType = data.type || "text";
  const isMultiline = data.multiline || false;

  const commonProps = {
    id: data.bindingPath,
    name: data.bindingPath,
    placeholder: placeholder || "",
    required: data.required || false,
    className: "a2ui-input",
  };

  return (
    <div className="a2ui-textfield">
      {label && <label htmlFor={data.bindingPath}>{label}</label>}
      {isMultiline ? (
        <textarea {...commonProps} rows={4} />
      ) : (
        <input {...commonProps} type={inputType} />
      )}
    </div>
  );
}
