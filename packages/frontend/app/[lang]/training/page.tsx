import { api } from "../../../lib/api";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import Link from "next/link";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { Locale, TrainingMaterial, Discipline } from "@/app/types";

type Locale = 'en' | 'ru';

const fetchTrainingMaterials = async (): Promise<TrainingMaterial[]> => {
  try {
    return await api.training.getAll();
  } catch (error) {
    console.error("Error fetching training materials:", error);
    return [];
  }
};

const fetchDisciplines = async (): Promise<Discipline[]> => {
  try {
    return await api.disciplines.getAll();
  } catch (error) {
    console.error("Error fetching disciplines:", error);
    return [];
  }
};

const TrainingMaterialsPage = async ({
  params: { lang },
}: {
  params: { lang: Locale };
}) => {
  // Fetch training materials from the API
  const materials = await fetchTrainingMaterials();

  // Fetch disciplines from the API
  const disciplines = await fetchDisciplines();

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 dark:text-white">
              {lang === "en" ? "Education & Training" : "Образование и обучение"}
            </h1>
            <p className="text-foreground/70 max-w-3xl mx-auto">
              {lang === "en"
                ? "Discover disciplines taught by our researchers and explore educational resources designed to help you understand complex scientific concepts in our field."
                : "Познакомьтесь с дисциплинами, преподаваемыми нашими исследователями, и изучите образовательные ресурсы, разработанные, чтобы помочь вам понять сложные научные концепции в нашей области."}
            </p>
          </div>

          <Tabs defaultValue="disciplines" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="disciplines">
                {lang === "en" ? "Disciplines" : "Дисциплины"}
              </TabsTrigger>
              <TabsTrigger value="materials">
                {lang === "en" ? "Educational Materials" : "Учебные материалы"}
              </TabsTrigger>
            </TabsList>

            {/* Disciplines Tab */}
            <TabsContent value="disciplines">
              <h2 className="text-2xl font-semibold text-center mb-8 dark:text-white">
                {lang === "en" ? "Disciplines Taught by Our Researchers" : "Дисциплины, преподаваемые нашими исследователями"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {disciplines.length > 0 ? (
                  disciplines.map((discipline) => (
                    <Card key={discipline.id} className="overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border/50 dark:border-indigo-400/20">
                      <div className="h-2 bg-gradient-to-r from-accent to-primary dark:from-indigo-400 dark:to-indigo-600"></div>
                      <div className="w-full h-48 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        <ImageWithFallback
                          src={discipline.image}
                          alt={discipline.title[lang]}
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          fill
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <h3 className="text-xl font-semibold">{discipline.title[lang]}</h3>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/70 mb-4">{discipline.description[lang]}</p>
                        <div>
                          <p className="text-xs font-medium mb-2">{lang === "en" ? "Taught by:" : "Преподаватели:"}</p>
                          <div className="flex flex-wrap gap-2">
                            {discipline.researchers.map(researcher => (
                              <Link href={`/${lang}/researchers/${researcher.id}`} key={researcher.id}>
                                <Badge key={researcher.id} variant="outline" className="text-xs text-primary">
                                  {researcher.name[lang]} {researcher.lastName[lang]}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10 text-foreground/70">
                    {lang === "en" ? "No disciplines found." : "Дисциплины не найдены."}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Educational Materials Tab */}
            <TabsContent value="materials">
              <h2 className="text-2xl font-semibold text-center mb-8 dark:text-white">
                {lang === "en" ? "Educational Materials & Resources" : "Учебные материалы и ресурсы"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {materials.map((material) => (
                  <Card key={material.id} className="overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border/50 dark:border-indigo-400/20">
                    <div className="h-2 bg-gradient-to-r from-accent to-primary dark:from-indigo-400 dark:to-indigo-600"></div>
                    <div className="w-full h-48 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                      <ImageWithFallback
                        src={material.image}
                        alt={material.title[lang]}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        fill
                      />
                      {material.type && (
                        <Badge className="absolute bottom-3 left-3 z-20">
                          {material.type[lang]}
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <h3 className="text-xl font-semibold">{material.title[lang]}</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70 mb-4">{material.description[lang]}</p>
                      <Link
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {lang === "en" ? "Access Resource" : "Открыть ресурс"}
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default TrainingMaterialsPage;
