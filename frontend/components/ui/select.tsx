import type { SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
};

export function Select({
  label,
  id,
  options,
  error,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {props.required && (
          <span className="field-required" aria-hidden="true">
            {" "}*
          </span>
        )}
      </label>
      <select
        {...props}
        id={id}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={`field-input field-select${error ? " field-input--error" : ""} ${className}`.trim()}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
