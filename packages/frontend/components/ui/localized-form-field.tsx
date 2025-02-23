"use client";

import { useState } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./tabs";

interface LocalizedString {
  en: string;
  ru: string;
}

interface LocalizedFormFieldProps {
  label: string;
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  multiline?: boolean;
  required?: boolean;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function LocalizedFormField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  className,
  inputRef,
}: LocalizedFormFieldProps) {
  const [activeTab, setActiveTab] = useState<"en" | "ru">("en");

  const handleChange = (lang: "en" | "ru", text: string) => {
    onChange({
      ...value,
      [lang]: text,
    });
  };

  const Field = multiline ? Textarea : Input;

  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "en" | "ru")}
        className="mt-1.5"
      >
        <TabsList className="mb-2">
          <TabsTrigger value="en">
            English
          </TabsTrigger>
          <TabsTrigger value="ru">
            Русский
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="mt-0">
          <Field
            ref={activeTab === "en" ? (inputRef as any) : undefined}
            value={value.en}
            onChange={(e) => handleChange("en", e.target.value)}
            placeholder="Enter English text..."
            className="w-full"
            required={required && activeTab === "en"}
          />
        </TabsContent>
        <TabsContent value="ru" className="mt-0">
          <Field
            ref={activeTab === "ru" ? (inputRef as any) : undefined}
            value={value.ru}
            onChange={(e) => handleChange("ru", e.target.value)}
            placeholder="Введите текст на русском..."
            className="w-full"
            required={required && activeTab === "ru"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}