import PartnerLogo from "../../components/PartnerLogo/PartnerLogo";
import JointProject from "../../components/JointProject/JointProject";
import JointPublication from "../../components/JointPublication/JointPublication";
import styles from "./Partners.module.css";
import { Locale, PartnersData } from "../../types";
import { getDictionary } from "../../dictionaries";

const fetchPartners = async (): Promise<PartnersData> => {
  const response = await fetch('http://localhost:8080/api/partners');
  if (!response.ok) {
    throw new Error('Failed to fetch partners data');
  }
  return response.json();
};

const PartnersPage = async ({
  params,
}: {
  params: { lang: Locale };
}) => {
  const lang = (await params).lang;
  const dictionary = getDictionary(lang);
  const partners = await fetchPartners();

  return (
    <div className="container mx-auto py-16">
      <h1 className="text-4xl font-bold text-center mb-8">{dictionary.partners.title}</h1>

      <section className="mb-12">
        <h2 className="text-2xl text-bold mb-4">
          {dictionary.partners.universities}
        </h2>
        <div className={styles.logoGrid}>
          {partners.universities.map((university) => (
            <PartnerLogo key={university.id} {...university} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl text-bold mb-4">
          {dictionary.partners.enterprises}
        </h2>
        <div className={styles.logoGrid}>
          {partners.enterprises.map((enterprise) => (
            <PartnerLogo key={enterprise.id} {...enterprise} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl text-bold mb-4">
          {dictionary.partners.jointProjects}
        </h2>
        <div className={styles.projectList}>
          {partners.jointProjects.map((project) => (
            <JointProject lang={lang} key={project.id} {...project} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl text-bold mb-4">
          {dictionary.partners.jointPublications}
        </h2>
        <div className={styles.publicationList}>
          {partners.jointPublications.map((publication) => (
            <JointPublication
              lang={lang}
              key={publication.id}
              {...publication}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default PartnersPage;
