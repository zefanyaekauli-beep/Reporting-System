// frontend/web/src/modules/shared/components/FormInput.tsx

import React, { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { theme } from "./theme";

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  children?: React.ReactNode;
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  required,
  type = "text",
  children,
  ...props
}: FormInputProps) {
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: `1.5px solid ${error ? theme.colors.danger : theme.colors.border}`,
    fontSize: 14,
    transition: "all 0.2s",
    outline: "none",
    ...(props.style || {}),
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 6,
          color: theme.colors.textMain,
        }}
      >
        {label} {required && <span style={{ color: theme.colors.danger }}>*</span>}
      </label>
      {type === "select" ? (
        <select
          {...(props as any)}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
            if (props.onFocus) props.onFocus(e as any);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? theme.colors.danger
              : theme.colors.border;
            if (props.onBlur) props.onBlur(e as any);
          }}
        >
          {children}
        </select>
      ) : type === "textarea" ? (
        <textarea
          {...(props as any)}
          style={{ ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
            if (props.onFocus) props.onFocus(e as any);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? theme.colors.danger
              : theme.colors.border;
            if (props.onBlur) props.onBlur(e as any);
          }}
        />
      ) : (
        <input
          {...props}
          type={type}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? theme.colors.danger
              : theme.colors.border;
            if (props.onBlur) props.onBlur(e);
          }}
        />
      )}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: theme.colors.danger,
            marginTop: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function FormTextarea({
  label,
  error,
  required,
  ...props
}: FormTextareaProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 6,
          color: theme.colors.textMain,
        }}
      >
        {label} {required && <span style={{ color: theme.colors.danger }}>*</span>}
      </label>
      <textarea
        {...props}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 8,
          border: `1.5px solid ${error ? theme.colors.danger : theme.colors.border}`,
          fontSize: 14,
          transition: "all 0.2s",
          resize: "vertical" as const,
          outline: "none",
          fontFamily: "inherit",
          ...(props.style || {}),
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary;
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? theme.colors.danger
            : theme.colors.border;
          if (props.onBlur) props.onBlur(e);
        }}
      />
      {error && (
        <div
          style={{
            fontSize: 12,
            color: theme.colors.danger,
            marginTop: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

