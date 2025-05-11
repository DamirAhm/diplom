"use client";

import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { ScrollArea } from "./scroll-area";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { Researcher } from "@/app/types";
import type { Locale } from "@/app/types";
import { useDictionary } from "@/hooks/use-dictionary";

interface ResearcherSelectorProps {
    researchers: Researcher[];
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    lang: Locale;
}

export function ResearcherSelector({
    researchers,
    selectedIds,
    onChange,
    lang,
}: ResearcherSelectorProps) {
    const dictionary = useDictionary();
    const [selectedResearchers, setSelectedResearchers] = useState<Set<number>>(new Set(selectedIds));

    useEffect(() => {
        setSelectedResearchers(new Set(selectedIds));
    }, [selectedIds]);

    const toggleResearcher = (researcher: Researcher) => {
        const newSelectedResearchers = new Set(selectedResearchers);
        const researcherExists = selectedResearchers.has(researcher.id);

        if (researcherExists) {
            newSelectedResearchers.delete(researcher.id);
        } else {
            newSelectedResearchers.add(researcher.id);
        }

        setSelectedResearchers(newSelectedResearchers);
        onChange(Array.from(newSelectedResearchers));
    };

    const selectedResearchersList = researchers.filter(r => selectedResearchers.has(r.id));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4 min-h-[40px] items-center">
                {selectedResearchersList.length > 0 ? (
                    selectedResearchersList.map((researcher) => (
                        <div
                            key={researcher.id}
                            className="h-[50px] flex items-center gap-2 p-2 rounded-md border border-border bg-card"
                        >
                            {researcher.photo && (
                                <ImageWithFallback
                                    src={researcher.photo}
                                    alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                />
                            )}
                            <span className="text-sm">
                                {`${researcher.name[lang]} ${researcher.lastName[lang]}`}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 ml-1"
                                onClick={() => toggleResearcher(researcher)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <span className="text-sm h-[50px] flex items-center text-muted-foreground">
                        {dictionary.admin.selectAuthors}
                    </span>
                )}
            </div>

            <Card>
                <CardContent className="p-4 pr-1">
                    <ScrollArea className="h-60">
                        <div className="space-y-2 pr-3">
                            {researchers.map((researcher) => (
                                <div
                                    key={researcher.id}
                                    className={`flex items-center border justify-between p-2 rounded-md cursor-pointer ${selectedResearchers.has(researcher.id)
                                        ? 'bg-primary/10 border-primary/30'
                                        : 'hover:bg-primary/5'
                                        }`}
                                    onClick={() => toggleResearcher(researcher)}
                                >
                                    <div className="flex items-center gap-2">
                                        {researcher.photo && (
                                            <ImageWithFallback
                                                src={researcher.photo}
                                                alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
                                                width={30}
                                                height={30}
                                                className="rounded-full object-cover"
                                            />
                                        )}
                                        <span>{researcher.name[lang]} {researcher.lastName[lang]}</span>
                                    </div>
                                    {selectedResearchers.has(researcher.id) && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
} 