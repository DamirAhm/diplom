"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "@/components/ui/input";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { LocalizedFormField } from "./localized-form-field";
import type { Locale, LocalizedString } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

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

// External Authors Field
interface ExternalAuthorsFieldProps {
    name: string;
    label: string;
    required?: boolean;
    disabled?: boolean;
}

export function ExternalAuthorsField({
    name,
    label,
    required,
    disabled,
}: ExternalAuthorsFieldProps) {
    const { control, watch } = useFormContext();
    const dictionary = getDictionary("en");
    const lang = "en";

    const externalAuthors = watch(name) || [];

    const addAuthor = () => {
        const newAuthors = [...externalAuthors, { en: "", ru: "" }];
        control._formValues[name] = newAuthors;
    };

    const removeAuthor = (index: number) => {
        const newAuthors = externalAuthors.filter((_: LocalizedString, i: number) => i !== index);
        control._formValues[name] = newAuthors;
    };

    const updateAuthor = (index: number, field: "en" | "ru", value: string) => {
        const newAuthors = [...externalAuthors];
        newAuthors[index] = { ...newAuthors[index], [field]: value };
        control._formValues[name] = newAuthors;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-1 after:text-red-500" : ""}>
                    {label}
                </Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAuthor}
                    disabled={disabled}
                >
                    {dictionary.common.add}
                </Button>
            </div>

            <div className="space-y-4">
                {externalAuthors.map((author: LocalizedString, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor={`${name}.${index}.en`}>
                                {dictionary.common.enterEnglishText}
                            </Label>
                            <Input
                                id={`${name}.${index}.en`}
                                value={author.en}
                                onChange={(e) => updateAuthor(index, "en", e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor={`${name}.${index}.ru`}>
                                {dictionary.common.enterRussianText}
                            </Label>
                            <Input
                                id={`${name}.${index}.ru`}
                                value={author.ru}
                                onChange={(e) => updateAuthor(index, "ru", e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAuthor(index)}
                            disabled={disabled}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
} 