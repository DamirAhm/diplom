"use client";

import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SandboxLayout({
    children,
    params: { lang },
}: {
    children: React.ReactNode;
    params: { lang: Locale };
}) {
    const dictionary = getDictionary(lang);
    const pathname = usePathname();

    const navigation = [
        {
            href: `/${lang}/sandbox/lorenz`,
            label: dictionary.sandbox.lorenzSystemControls,
        },
        {
            href: `/${lang}/sandbox/neuron`,
            label: dictionary.sandbox.neuronDynamics,
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex space-x-4 mb-8">
                {navigation.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "px-4 py-2 rounded-lg transition-colors",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            {children}
        </div>
    );
} 