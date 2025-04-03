import { useState } from 'react';

export type ValidationErrors = Record<string, string>;

export interface ValidationRules {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    url?: boolean;
    email?: boolean;
    custom?: (value: any) => boolean;
}

export interface FieldValidation {
    value: any;
    rules: ValidationRules;
    errorMessage?: string;
}

export type ValidationSchema = Record<string, FieldValidation>;

export function validateForm(schema: ValidationSchema): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.entries(schema).forEach(([fieldName, field]) => {
        const { value, rules, errorMessage } = field;

        if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errors[fieldName] = errorMessage || 'This field is required';
            return;
        }

        if (!value && !rules.required) {
            return;
        }

        if (typeof value === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
                errors[fieldName] = errorMessage || `Minimum length is ${rules.minLength} characters`;
                return;
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                errors[fieldName] = errorMessage || `Maximum length is ${rules.maxLength} characters`;
                return;
            }

            if (rules.pattern && !rules.pattern.test(value)) {
                errors[fieldName] = errorMessage || 'Invalid format';
                return;
            }

            if (rules.url) {
                try {
                    new URL(value);
                } catch (e) {
                    errors[fieldName] = errorMessage || 'Invalid URL';
                    return;
                }
            }

            if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[fieldName] = errorMessage || 'Invalid email format';
                return;
            }
        }

        if (rules.custom && !rules.custom(value)) {
            errors[fieldName] = errorMessage || 'Invalid value';
        }
    });

    return errors;
}

/**
 * A custom hook for form validation in components using simple state management
 * @param validationSchema Initial validation schema (can be updated later)
 * @returns Object containing errors state and helper functions
 */
export function useFormValidation(initialSchema: ValidationSchema = {}) {
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [schema, setSchema] = useState<ValidationSchema>(initialSchema);

    /**
     * Validate the form with the current schema or a new schema
     * @param newSchema Optional new schema to use for validation
     * @returns Boolean indicating if the form is valid
     */
    const validate = (newSchema?: ValidationSchema): boolean => {
        const schemaToUse = newSchema || schema;
        const newErrors = validateForm(schemaToUse);
        setErrors(newErrors);

        if (newSchema) {
            setSchema(newSchema);
        }

        return Object.keys(newErrors).length === 0;
    };

    /**
     * Clear all validation errors
     */
    const clearErrors = () => {
        setErrors({});
    };

    /**
     * Set a specific error message for a field
     * @param field The field name
     * @param message The error message
     */
    const setError = (field: string, message: string) => {
        setErrors(prev => ({
            ...prev,
            [field]: message
        }));
    };

    /**
     * Clear the error for a specific field
     * @param field The field name
     */
    const clearError = (field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    return {
        errors,
        validate,
        clearErrors,
        setError,
        clearError,
        setSchema
    };
} 