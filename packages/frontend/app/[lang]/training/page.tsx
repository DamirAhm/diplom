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
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
          {dictionary.training.title}
        </h1>
        <p className="text-foreground/70 max-w-3xl mx-auto">
          {lang === "en"
            ? "Explore our training materials and educational resources."
            : "Изучите наши учебные материалы и образовательные ресурсы."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {materials.map((material) => (
          <div key={material.id} className="flex">
            <TrainingMaterialCard lang={lang} material={material} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingMaterialsPage;
