import { useState } from "react";
import "./PasswordInput.css";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
  required = false,
  disabled = false,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="password-input">
      <input
        id={id}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        disabled={disabled}
      >
        {isVisible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a9.9 9.9 0 0 0 3-.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </span>
  );
}
