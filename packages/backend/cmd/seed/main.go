package main

import (
	"log"

	"github.com/damirahm/diplom/backend/db"
	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
)

func main() {
	if err := db.InitDB("../../data/database.db"); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	localizedStringRepo := repository.NewSQLiteLocalizedStringRepo(db.DB)
	partnerRepo := repository.NewSQLitePartnerRepo(db.DB)
	jointPublicationRepo := repository.NewSQLiteJointPublicationRepo(db.DB, localizedStringRepo)
	jointProjectRepo := repository.NewSQLiteJointProjectRepo(db.DB, localizedStringRepo)
	publicationRepo := repository.NewSQLitePublicationRepo(db.DB, localizedStringRepo)
	researcherRepo := repository.NewSQLiteResearcherRepo(db.DB, localizedStringRepo, publicationRepo)
	projectRepo := repository.NewSQLiteProjectRepo(db.DB, localizedStringRepo)
	trainingMaterialRepo := repository.NewSQLiteTrainingMaterialRepo(db.DB, localizedStringRepo)

	// Seed initial data
	seedPartners(partnerRepo)
	seedJointProjects(jointProjectRepo)
	seedJointPublications(jointPublicationRepo)
	seedPublications(publicationRepo)
	seedResearchers(researcherRepo)
	seedProjects(projectRepo)
	seedTrainingMaterials(trainingMaterialRepo)
}

func seedPartners(repo repository.PartnerRepo) {
	universities := []models.Partner{
		{
			Name: "Massachusetts Institute of Technology",
			Logo: "",
			URL:  "https://www.mit.edu/",
		},
		{
			Name: "Stanford University",
			Logo: "",
			URL:  "https://www.stanford.edu/",
		},
		{
			Name: "Technical University of Munich",
			Logo: "",
			URL:  "https://www.tum.de/en/",
		},
	}

	enterprises := []models.Partner{
		{
			Name: "Siemens",
			Logo: "",
			URL:  "https://www.siemens.com/",
		},
		{
			Name: "Autodesk",
			Logo: "",
			URL:  "https://www.autodesk.com/",
		},
		{
			Name: "ANSYS",
			Logo: "",
			URL:  "https://www.ansys.com/",
		},
	}

	for _, u := range universities {
		if err := repo.Create(u, "university"); err != nil {
			log.Printf("Error creating university %s: %v", u.Name, err)
		}
	}

	for _, e := range enterprises {
		if err := repo.Create(e, "enterprise"); err != nil {
			log.Printf("Error creating enterprise %s: %v", e.Name, err)
		}
	}
}

func seedJointProjects(repo repository.JointProjectRepo) {
	projects := []models.JointProject{
		{
			Title: models.LocalizedString{
				En: "Advanced CAD Algorithms for Aerospace Design",
				Ru: "Продвинутые алгоритмы САПР для аэрокосмического проектирования",
			},
			Partners: []string{"Massachusetts Institute of Technology", "Siemens"},
			Year:     2023,
		},
		{
			Title: models.LocalizedString{
				En: "AI-Driven Optimization in Mechanical Engineering",
				Ru: "Оптимизация в машиностроении на основе ИИ",
			},
			Partners: []string{"Stanford University", "Autodesk"},
			Year:     2022,
		},
		{
			Title: models.LocalizedString{
				En: "Collaborative CAD for Large-Scale Industrial Projects",
				Ru: "Совместное САПР для крупномасштабных промышленных проектов",
			},
			Partners: []string{"Technical University of Munich", "ANSYS"},
			Year:     2021,
		},
	}

	for _, p := range projects {
		if err := repo.Create(p); err != nil {
			log.Printf("Error creating joint project %v: %v", p.Title, err)
		}
	}
}

func seedJointPublications(repo repository.JointPublicationRepo) {
	publications := []models.JointPublication{
		{
			Title: models.LocalizedString{
				En: "Novel Approaches to CAD Optimization in Aerospace Engineering",
				Ru: "Новые подходы к оптимизации САПР в аэрокосмической инженерии",
			},
			Authors: "John Doe, Jane Smith, et al.",
			Journal: "Journal of Aerospace Engineering",
			Year:    2023,
			Link:    "https://example.com/publication1",
		},
		{
			Title: models.LocalizedString{
				En: "Machine Learning Applications in Modern CAD Systems",
				Ru: "Применение машинного обучения в современных системах САПР",
			},
			Authors: "Alice Johnson, Bob Williams, et al.",
			Journal: "International Journal of Computer-Aided Design",
			Year:    2022,
			Link:    "https://example.com/publication2",
		},
		{
			Title: models.LocalizedString{
				En: "Collaborative Design Practices in Large-Scale Industrial Projects",
				Ru: "Практики совместного проектирования в крупномасштабных промышленных проектах",
			},
			Authors: "Eva Brown, Chris Davis, et al.",
			Journal: "Journal of Industrial Engineering",
			Year:    2021,
			Link:    "https://example.com/publication3",
		},
	}

	for _, p := range publications {
		if err := repo.Create(p); err != nil {
			log.Printf("Error creating joint publication %v: %v", p.Title, err)
		}
	}
}

func seedPublications(repo repository.PublicationRepo) {
	publications := []models.Publication{
		{
			Title: models.LocalizedString{
				En: "Optimizing CAD Algorithms for Modern Hardware",
				Ru: "Оптимизация алгоритмов САПР для современного оборудования",
			},
			Authors: "John Doe, Jane Smith",
			Journal: "Journal of Computer-Aided Design",
			Year:    2023,
			Link:    "https://example.com/publication1",
		},
		{
			Title: models.LocalizedString{
				En: "Machine Learning Approaches in CAD Optimization",
				Ru: "Подходы машинного обучения в оптимизации САПР",
			},
			Authors: "Alice Johnson, Bob Williams",
			Journal: "International Journal of AI in Design",
			Year:    2022,
			Link:    "https://example.com/publication2",
		},
		{
			Title: models.LocalizedString{
				En: "AI-driven Design Pattern Recognition",
				Ru: "Распознавание шаблонов проектирования с помощью ИИ",
			},
			Authors: "Eve Brown, Charlie Davis",
			Journal: "AI Applications in Engineering",
			Year:    2023,
			Link:    "https://example.com/publication3",
		},
		{
			Title: models.LocalizedString{
				En: "Real-time Collaboration in CAD Systems",
				Ru: "Совместная работа в реальном времени в системах САПР",
			},
			Authors: "David Wilson, Grace Lee",
			Journal: "Collaborative Engineering Design",
			Year:    2022,
			Link:    "https://example.com/publication4",
		},
		{
			Title: models.LocalizedString{
				En: "Next-Generation CAD User Interfaces",
				Ru: "Пользовательские интерфейсы САПР следующего поколения",
			},
			Authors: "Frank Miller, Helen Chen",
			Journal: "Human-Computer Interaction in Design",
			Year:    2021,
			Link:    "https://example.com/publication5",
		},
	}

	for _, p := range publications {
		if err := repo.Create(p); err != nil {
			log.Printf("Error creating publication %v: %v", p.Title, err)
		}
	}
}

func seedResearchers(repo repository.ResearcherRepo) {
	researchers := []models.Researcher{
		{
			Name: "Dr. John Doe",
			Title: models.LocalizedString{
				En: "Professor of Computer-Aided Design",
				Ru: "Профессор автоматизированного проектирования",
			},
			Photo: "",
			Bio: models.LocalizedString{
				En: "Dr. John Doe is a leading expert in CAD algorithms and optimization. He has been working in the field for over 20 years and has published numerous papers on advanced CAD techniques.",
				Ru: "Доктор Джон Доу является ведущим экспертом в области алгоритмов САПР и оптимизации. Он работает в этой области более 20 лет и опубликовал множество статей о передовых методах САПР.",
			},
			Profiles: models.ResearcherProfiles{
				ResearchGate:  stringPtr("https://www.researchgate.net/profile/John-Doe"),
				GoogleScholar: stringPtr("https://scholar.google.com/citations?user=johndoe"),
				Scopus:        stringPtr("https://www.scopus.com/authid/detail.uri?authorId=johndoe"),
				Orcid:         stringPtr("https://orcid.org/0000-0000-0000-0000"),
			},
		},
		{
			Name: "Dr. Jane Smith",
			Title: models.LocalizedString{
				En: "Associate Professor of AI in Design",
				Ru: "Доцент ИИ в проектировании",
			},
			Photo: "",
			Bio: models.LocalizedString{
				En: "Dr. Jane Smith specializes in the application of artificial intelligence in design processes. Her research focuses on developing AI-assisted design tools and machine learning approaches for CAD optimization.",
				Ru: "Доктор Джейн Смит специализируется на применении искусственного интеллекта в процессах проектирования. Ее исследования сосредоточены на разработке инструментов проектирования с помощью ИИ и подходов машинного обучения для оптимизации САПР.",
			},
			Profiles: models.ResearcherProfiles{
				ResearchGate:  stringPtr("https://www.researchgate.net/profile/Jane-Smith"),
				GoogleScholar: stringPtr("https://scholar.google.com/citations?user=janesmith"),
				Scopus:        stringPtr("https://www.scopus.com/authid/detail.uri?authorId=janesmith"),
				Orcid:         stringPtr("https://orcid.org/0000-0000-0000-0001"),
			},
		},
		{
			Name: "Dr. David Wilson",
			Title: models.LocalizedString{
				En: "Assistant Professor of Collaborative Design",
				Ru: "Ассистент профессора совместного проектирования",
			},
			Photo: "",
			Bio: models.LocalizedString{
				En: "Dr. David Wilson's research is centered on creating collaborative CAD environments. He works on developing platforms that enable real-time collaboration in CAD projects, allowing multiple users to work simultaneously.",
				Ru: "Исследования доктора Дэвида Уилсона сосредоточены на создании сред совместного проектирования САПР. Он работает над разработкой платформ, которые обеспечивают совместную работу в реальном времени над проектами САПР, позволяя нескольким пользователям работать одновременно.",
			},
			Profiles: models.ResearcherProfiles{
				ResearchGate:  stringPtr("https://www.researchgate.net/profile/David-Wilson"),
				GoogleScholar: stringPtr("https://scholar.google.com/citations?user=davidwilson"),
				Scopus:        stringPtr("https://www.scopus.com/authid/detail.uri?authorId=davidwilson"),
				Orcid:         stringPtr("https://orcid.org/0000-0000-0000-0002"),
			},
		},
	}

	for _, r := range researchers {
		if err := repo.Create(r); err != nil {
			log.Printf("Error creating researcher %s: %v", r.Name, err)
		}
	}
}

func seedProjects(repo repository.ProjectRepo) {
	projects := []models.Project{
		{
			Title: models.LocalizedString{
				En: "Advanced CAD Algorithms",
				Ru: "Продвинутые алгоритмы САПР",
			},
			Description: models.LocalizedString{
				En: "Research on novel algorithms for computer-aided design, focusing on optimization and efficiency.",
				Ru: "Исследование новых алгоритмов для автоматизированного проектирования, с акцентом на оптимизацию и эффективность.",
			},
			GithubLink: "https://github.com/etu-cad-lab/advanced-cad-algorithms",
		},
		{
			Title: models.LocalizedString{
				En: "AI-Assisted Design Tools",
				Ru: "Инструменты проектирования с помощью ИИ",
			},
			Description: models.LocalizedString{
				En: "Developing intelligent design tools that leverage machine learning to enhance the design process.",
				Ru: "Разработка интеллектуальных инструментов проектирования, использующих машинное обучение для улучшения процесса проектирования.",
			},
			GithubLink: "https://github.com/etu-cad-lab/ai-assisted-design",
		},
		{
			Title: models.LocalizedString{
				En: "Collaborative CAD Environments",
				Ru: "Среды совместного проектирования САПР",
			},
			Description: models.LocalizedString{
				En: "Creating platforms for real-time collaboration in CAD projects, enabling multiple users to work simultaneously.",
				Ru: "Создание платформ для совместной работы в реальном времени над проектами САПР, позволяющих нескольким пользователям работать одновременно.",
			},
			GithubLink: "https://github.com/etu-cad-lab/collaborative-cad",
		},
	}

	for _, p := range projects {
		if err := repo.Create(p); err != nil {
			log.Printf("Error creating project %v: %v", p.Title, err)
			continue
		}

		// Add publications for each project
		if p.Title.En == "Advanced CAD Algorithms" {
			repo.AddPublication(p.ID, models.ProjectPublication{
				Title: models.LocalizedString{
					En: "Optimizing CAD Algorithms for Modern Hardware",
					Ru: "Оптимизация алгоритмов САПР для современного оборудования",
				},
				Link: "https://example.com/publication1",
			})
			repo.AddPublication(p.ID, models.ProjectPublication{
				Title: models.LocalizedString{
					En: "Machine Learning Approaches in CAD Optimization",
					Ru: "Подходы машинного обучения в оптимизации САПР",
				},
				Link: "https://example.com/publication2",
			})
		}

		// Add project videos
		videos := map[string][]models.ProjectVideo{
			"Advanced CAD Algorithms": {
				{
					Title: models.LocalizedString{
						En: "Introduction to Advanced CAD Algorithms",
						Ru: "Введение в продвинутые алгоритмы САПР",
					},
					EmbedURL: "https://www.youtube.com/embed/dQw4w9WgXcQ",
				},
			},
			"AI-Assisted Design Tools": {
				{
					Title: models.LocalizedString{
						En: "Demo of AI-Assisted CAD Tool",
						Ru: "Демонстрация инструмента САПР с поддержкой ИИ",
					},
					EmbedURL: "https://www.youtube.com/embed/dQw4w9WgXcQ",
				},
			},
			"Collaborative CAD Environments": {
				{
					Title: models.LocalizedString{
						En: "Collaborative CAD Environment Walkthrough",
						Ru: "Обзор среды совместного проектирования САПР",
					},
					EmbedURL: "https://www.youtube.com/embed/dQw4w9WgXcQ",
				},
			},
		}

		if projectVideos, ok := videos[p.Title.En]; ok {
			for _, video := range projectVideos {
				if err := repo.AddVideo(p.ID, video); err != nil {
					log.Printf("Error adding video to project %v: %v", p.Title, err)
				}
			}
		}
	}
}

func seedTrainingMaterials(repo repository.TrainingMaterialRepo) {
	materials := []models.TrainingMaterial{
		{
			Title: models.LocalizedString{
				En: "Introduction to CAD Systems",
				Ru: "Введение в системы САПР",
			},
			Description: models.LocalizedString{
				En: "Learn the basics of Computer-Aided Design (CAD) systems and their applications in various industries.",
				Ru: "Изучите основы систем автоматизированного проектирования (САПР) и их применение в различных отраслях.",
			},
			URL:   "https://www.autodesk.com/solutions/cad-software",
			Image: "",
		},
		{
			Title: models.LocalizedString{
				En: "Advanced CAD Techniques",
				Ru: "Продвинутые методы САПР",
			},
			Description: models.LocalizedString{
				En: "Explore advanced CAD techniques to improve your design efficiency and create more complex models.",
				Ru: "Изучите продвинутые методы САПР для повышения эффективности проектирования и создания более сложных моделей.",
			},
			URL:   "https://www.engineering.com/story/7-advanced-cad-techniques-you-should-know",
			Image: "",
		},
		{
			Title: models.LocalizedString{
				En: "3D Modeling Basics",
				Ru: "Основы 3D-моделирования",
			},
			Description: models.LocalizedString{
				En: "Get started with 3D modeling fundamentals and learn how to create basic 3D objects and scenes.",
				Ru: "Начните изучение основ 3D-моделирования и научитесь создавать базовые 3D-объекты и сцены.",
			},
			URL:   "https://www.sketchup.com/learn/articles/3d-modeling-basics",
			Image: "",
		},
		{
			Title: models.LocalizedString{
				En: "CAD Software Comparison",
				Ru: "Сравнение программного обеспечения САПР",
			},
			Description: models.LocalizedString{
				En: "Compare different CAD software options to find the best tool for your specific needs and projects.",
				Ru: "Сравните различные варианты программного обеспечения САПР, чтобы найти лучший инструмент для ваших конкретных потребностей и проектов.",
			},
			URL:   "https://www.g2.com/categories/cad",
			Image: "",
		},
		{
			Title: models.LocalizedString{
				En: "Best Practices in CAD Design",
				Ru: "Лучшие практики в проектировании САПР",
			},
			Description: models.LocalizedString{
				En: "Discover industry-standard best practices for CAD design to improve your workflow and output quality.",
				Ru: "Откройте для себя лучшие отраслевые практики проектирования САПР для улучшения рабочего процесса и качества результатов.",
			},
			URL:   "https://www.cadcrowd.com/blog/top-10-best-practices-in-cad-design/",
			Image: "",
		},
	}

	for _, m := range materials {
		if err := repo.Create(m); err != nil {
			log.Printf("Error creating training material %v: %v", m.Title, err)
		}
	}
}

func stringPtr(s string) *string {
	return &s
}
