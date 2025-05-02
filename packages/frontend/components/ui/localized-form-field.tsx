"use client";

import { useState, useEffect } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { useFormContext, Controller } from "react-hook-form";

interface LocalizedString {
  en: string;
  ru: string;
}

type LocalizedFormFieldProps = {
  label?: string;
  multiline?: boolean;
  required?: boolean;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  lang: Locale;
  name: string;
  value?: never;
  onChange?: never;
};

interface LanguageTabProps {
  value: string;
  isActive: boolean;
  isFilled: boolean;
  children: React.ReactNode;
}

const LanguageTab = ({
  value,
  isActive,
  isFilled,
  children,
}: LanguageTabProps) => (
  <TabsTrigger
    value={value}
    className={cn({
      ["bg-blue-200 text-white dark:bg-gray-600 dark:text-blue-50"]: isActive,
      ["text-green-600 dark:text-green-400"]: isFilled,
    })}
  >
    {children}
    {isFilled && <Check className="ml-2 h-3 w-3" />}
  </TabsTrigger>
);

interface LanguageInputProps {
  value: string;
  isActive: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

const LanguageInput = ({
  value,
  isActive,
  onChange,
  placeholder,
  error,
  required,
  multiline,
  inputRef,
}: LanguageInputProps) => {
  const Field = multiline ? Textarea : Input;

  return (
    <div className="space-y-1">
      <Field
        ref={isActive ? (inputRef as any) : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full",
          error && "border-destructive focus-visible:ring-destructive"
        )}
        required={required && isActive}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export function LocalizedFormField(props: LocalizedFormFieldProps) {
  const dictionary = getDictionary(props.lang);
  const [activeTab, setActiveTab] = useState<"en" | "ru">(props.lang);
  const [errors, setErrors] = useState<{ en?: string; ru?: string }>({});

  useEffect(() => {
    setActiveTab(props.lang);
  }, [props.lang]);

  const formContext = useFormContext();

  const { control, formState } = formContext;
  const fieldError = formState.errors[props.name] as any;

  const validateTranslations = (currentValue: LocalizedString) => {
    const newErrors: { en?: string; ru?: string } = {};

    if (currentValue.en && !currentValue.ru) {
      newErrors.ru = dictionary.common.translationRequired;
    }
    if (currentValue.ru && !currentValue.en) {
      newErrors.en = dictionary.common.translationRequired;
    }

    setErrors(newErrors);
  };

  return (
    <div className={props.className}>
      {props.label && (
        <Label htmlFor={props.name}>
          {props.label}
          {props.required && <span className="text-destructive"> *</span>}
        </Label>
      )}
      <Controller
        name={props.name}
        control={control}
        render={({ field }) => {
          const value = field.value || { en: "", ru: "" };

          useEffect(() => {
            validateTranslations(value);
          }, [value]);

          const handleChange = (lang: "en" | "ru", text: string) => {
            const newValue = {
              ...value,
              [lang]: text,
            };
            field.onChange(newValue);
            validateTranslations(newValue);
          };

          return (
            <Tabs
              defaultValue={props.lang}
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "en" | "ru")}
              className="mt-1.5"
            >
              <TabsList className="mb-2">
                <LanguageTab
                  value="en"
                  isActive={activeTab === "en"}
                  isFilled={Boolean(value.en)}
                >
                  English
                </LanguageTab>
                <LanguageTab
                  value="ru"
                  isActive={activeTab === "ru"}
                  isFilled={Boolean(value.ru)}
                >
                  Русский
                </LanguageTab>
              </TabsList>
              <div className="relative">
                <TabsContent value="en" className="mt-0">
                  <LanguageInput
                    value={value.en}
                    isActive={activeTab === "en"}
                    onChange={(text) => handleChange("en", text)}
                    placeholder={dictionary.common.enterEnglishText}
                    error={errors.en || (fieldError?.en?.message as string)}
                    required={props.required}
                    multiline={props.multiline}
                    inputRef={props.inputRef}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-0">
                  <LanguageInput
                    value={value.ru}
                    isActive={activeTab === "ru"}
                    onChange={(text) => handleChange("ru", text)}
                    placeholder={dictionary.common.enterRussianText}
                    error={errors.ru || (fieldError?.ru?.message as string)}
                    required={props.required}
                    multiline={props.multiline}
                  />
                </TabsContent>
              </div>
            </Tabs>
          );
        }}
      />
    </div>
  );
}
