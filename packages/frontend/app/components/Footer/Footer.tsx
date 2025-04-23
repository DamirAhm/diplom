import Link from "next/link"
import type { Locale } from "../../types"
import { getDictionary } from "@/app/dictionaries"

interface FooterProps {
  lang: Locale
}

export default function Footer({ lang }: FooterProps) {
  const dictionary = getDictionary(lang)
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { key: "home", href: `/${lang}`, label: dictionary.navigation.home },
    { key: "projects", href: `/${lang}/projects`, label: dictionary.navigation.projects },
    { key: "publications", href: `/${lang}/publications`, label: dictionary.navigation.publications },
    { key: "researchers", href: `/${lang}/researchers`, label: dictionary.navigation.researchers },
    { key: "sandbox", href: `/${lang}/sandbox`, label: dictionary.navigation.sandbox },
    { key: "partners", href: `/${lang}/partners`, label: dictionary.navigation.partners },
    { key: "training", href: `/${lang}/training`, label: dictionary.navigation.training },
  ]

  return (
    <footer className="bg-muted/50 dark:bg-gray-900 border-t border-border/50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-4">
              {dictionary.common.laboratoryName}
            </h3>
            <p className="text-foreground/80 text-sm max-w-md">
              {dictionary.footer.copyright}
            </p>
          </div>

          <div>
            <h4 className="font-heading text-base font-medium text-foreground mb-4">
              {lang === "en" ? "Navigation" : "Навигация"}
            </h4>
            <nav className="grid grid-cols-2 gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="text-foreground/70 hover:text-primary text-sm py-1 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-heading text-base font-medium text-foreground mb-4">
              {lang === "en" ? "Contact" : "Контакты"}
            </h4>
            <address className="text-foreground/80 text-sm not-italic">
              <p className="mb-1">Email: lab@university.edu</p>
              <p className="mb-1">Tel: +7 (123) 456-7890</p>
              <p>{lang === "en" ? "University Campus, Building 3" : "Университетский кампус, корпус 3"}</p>
            </address>
          </div>
        </div>
      </div>
    </footer>
  )
}

