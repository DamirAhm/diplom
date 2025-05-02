import "./globals.css";
import { Space_Grotesk, Inter, Roboto } from "next/font/google";
import { cookies } from "next/headers";
import type React from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Scientific Laboratory",
  description: "Cutting-edge research from our university science laboratory",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme");

  return (
    <html
      lang="en"
      className={`${theme?.value === "dark" ? "dark" : ""} ${
        spaceGrotesk.variable
      } ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen bg-background antialiased ${inter.className}`}
      >
        <div className="relative flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
