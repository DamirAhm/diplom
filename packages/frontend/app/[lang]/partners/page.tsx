import PartnerLogo from "../../components/PartnerLogo/PartnerLogo";
import { Locale, PartnersData, Partner } from "../../types";
import { getDictionary } from "../../dictionaries";
import { api } from "../../../lib/api";

const fetchPartners = async (): Promise<PartnersData> => {
  return api.partners.getAll();
};

const PartnersPage = async ({ params }: { params: { lang: Locale } }) => {
  const lang = (await params).lang;
  const dictionary = getDictionary(lang);
  const partners = await fetchPartners();

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 dark:text-white">
              {dictionary.partners.title}
            </h1>
            <p className="text-foreground/70 max-w-3xl mx-auto">
              {lang === "en"
                ? "Our strong network of academic and industry partners enables groundbreaking research and innovation."
                : "Наша сильная сеть академических и отраслевых партнеров обеспечивает революционные исследования и инновации."}
            </p>
          </div>

          <section className="mb-16 bg-card rounded-xl p-8 shadow-sm border border-border/50 dark:border-indigo-400/20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 mr-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-semibold text-primary dark:text-indigo-400">
                {dictionary.partners.universities}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {partners.universities.map((university: Partner) => (
                <div
                  key={university.id}
                  className="group hover:-translate-y-1 transition-transform duration-300"
                >
                  <PartnerLogo {...university} />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-card rounded-xl p-8 shadow-sm border border-border/50 dark:border-indigo-400/20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-blue-500 mr-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-semibold text-blue-500">
                {dictionary.partners.enterprises}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {partners.enterprises.map((enterprise: Partner) => (
                <div
                  key={enterprise.id}
                  className="group hover:-translate-y-1 transition-transform duration-300"
                >
                  <PartnerLogo {...enterprise} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default PartnersPage;
