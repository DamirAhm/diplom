import TrainingMaterialCard from "../../components/TrainingMaterialCard/TrainingMaterialCard";
import { Locale, TrainingMaterial } from "../../types";
import { getDictionary } from "../../dictionaries";

const fetchTrainingMaterials = async (): Promise<TrainingMaterial[]> => {
  const response = await fetch('http://localhost:8080/api/training');
  if (!response.ok) {
    throw new Error('Failed to fetch training materials');
  }
  return response.json();
};

const TrainingMaterialsPage = async ({
  params: { lang },
}: {
  params: { lang: Locale };
}) => {
  const dictionary = getDictionary(lang);
  const materials = await fetchTrainingMaterials();

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 dark:text-white">
              {dictionary.training.title}
            </h1>
            <p className="text-foreground/70 max-w-3xl mx-auto">
              {lang === "en"
                ? "Explore our training materials and educational resources designed to help you understand complex scientific concepts."
                : "Изучите наши учебные материалы и образовательные ресурсы, разработанные, чтобы помочь вам понять сложные научные концепции."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {materials.map((material) => (
              <div
                key={material.id}
                className="group bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 dark:border-indigo-400/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-2 bg-gradient-to-r from-accent to-primary dark:from-indigo-400 dark:to-indigo-600"></div>
                <div className="p-1">
                  <TrainingMaterialCard lang={lang} material={material} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TrainingMaterialsPage;
