"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { LocalizedFormField } from "./localized-form-field";
import type { Locale } from "@/app/types";

// Text Input Field
interface TextFieldProps {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    type?: "text" | "email" | "password" | "url" | "number" | "date";
    disabled?: boolean;
}

export function TextField({
    name,
    label,
    placeholder,
    required = false,
    type = "text",
    disabled = false,
}: TextFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                        <Input
                            placeholder={placeholder}
                            type={type}
                            disabled={disabled}
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                                if (type === "number") {
                                    field.onChange(e.target.value === "" ? "" : Number(e.target.value));
                                } else {
                                    field.onChange(e.target.value);
                                }
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Textarea Field
interface TextareaFieldProps {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
}

export function TextareaField({
    name,
    label,
    placeholder,
    required = false,
    disabled = false,
    rows = 4,
}: TextareaFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder={placeholder}
                            disabled={disabled}
                            rows={rows}
                            {...field}
                            value={field.value || ""}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Select Field
interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    name: string;
    label: string;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

export function SelectField({
    name,
    label,
    options,
    placeholder = "Select an option",
    required = false,
    disabled = false,
}: SelectFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <Select
                        disabled={disabled}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Checkbox Field
interface CheckboxFieldProps {
    name: string;
    label: string;
    disabled?: boolean;
}

export function CheckboxField({
    name,
    label,
    disabled = false,
}: CheckboxFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={disabled}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>{label}</FormLabel>
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Switch Field
interface SwitchFieldProps {
    name: string;
    label: string;
    disabled?: boolean;
}

export function SwitchField({
    name,
    label,
    disabled = false,
}: SwitchFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel>{label}</FormLabel>
                    </div>
                    <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={disabled}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Multi-select Field (for select with multiple attribute)
interface MultiSelectFieldProps {
    name: string;
    label: string;
    options: SelectOption[];
    required?: boolean;
    disabled?: boolean;
}

export function MultiSelectField({
    name,
    label,
    options,
    required = false,
    disabled = false,
}: MultiSelectFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                        <select
                            multiple
                            className="w-full p-2 border rounded"
                            value={Array.isArray(field.value) ? field.value.map(v => v.toString()) : []}
                            onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                field.onChange(selectedOptions.map(value =>
                                    isNaN(Number(value)) ? value : Number(value)
                                ));
                            }}
                            disabled={disabled}
                        >
                            {options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

// Localized Text Field (for multilingual content)
interface LocalizedTextFieldProps {
    name: string;
    label: string;
    required?: boolean;
    multiline?: boolean;
    lang: Locale;
    disabled?: boolean;
}

export function LocalizedTextField({
    name,
    label,
    required = false,
    multiline = false,
    lang,
    disabled = false,
}: LocalizedTextFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={() => (
                <FormItem>
                    <LocalizedFormField
                        name={name}
                        label={label}
                        required={required}
                        multiline={multiline}
                        lang={lang}
                    />
                </FormItem>
            )}
        />
    );
}

// File Upload Field
interface FileUploadFieldProps {
    name: string;
    label: string;
    accept?: string;
    required?: boolean;
    disabled?: boolean;
    onFileChange?: (file: File) => void;
}

export function FileUploadField({
    name,
    label,
    accept = "*/*",
    required = false,
    disabled = false,
    onFileChange,
}: FileUploadFieldProps) {
    const { control } = useFormContext();
    const [fileName, setFileName] = useState<string | null>(null);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="file"
                                accept={accept}
                                disabled={disabled}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setFileName(file.name);
                                        field.onChange(file);
                                        onFileChange?.(file);
                                    }
                                }}
                            />
                            {fileName && <p className="text-sm text-primary-foreground">Selected: {fileName}</p>}
                            {field.value && typeof field.value === 'string' && (
                                <p className="text-sm text-primary-foreground">Current file: {field.value}</p>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
} 