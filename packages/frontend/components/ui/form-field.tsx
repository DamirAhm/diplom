"use client";

import React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  sublabel?: string;
  error?: string;
  type?: string;
  multiline?: boolean;
}

export function FormField({
  label,
  sublabel,
  error,
  id,
  multiline = false,
  className,
  ...props
}: FormFieldProps) {
  const Component = multiline ? Textarea : Input;
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className={cn(error && "text-destructive")}
      >
        {label}
        {sublabel && (
          <span className="ml-1 text-xs text-muted-foreground">
            {sublabel}
          </span>
        )}
      </Label>
      <Component
        id={fieldId}
        className={cn(error && "border-destructive", className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}