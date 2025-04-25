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
            href: `/${lang}/sandbox/neuron`,
            label: dictionary.sandbox.tunnelDiodeNeuron,
        },
        {
            href: `/${lang}/sandbox/superpixel`,
            label: dictionary.sandbox.superpixelImageProcessing,
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <nav className="mb-8">
                <ul className="flex flex-wrap gap-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "text-primary dark:text-indigo-400 font-semibold"
                                            : "text-foreground/70 hover:text-primary dark:hover:text-indigo-400"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {children}
        </div>
    );
} 