export type Locale = "en" | "ru"

export interface LocalizedString {
  en: string;
  ru: string;
}

export interface Partner {
  id: number;
  name: string;
  logo: string;
  url: string;
}

export interface JointProject {
  id: number;
  title: LocalizedString;
  partners: string[];
  year: number;
}

export interface JointPublication {
  id: number;
  title: LocalizedString;
  authors: string;
  journal: string;
  year: number;
  link: string;
}

export interface PartnersData {
  universities: Partner[];
  enterprises: Partner[];
  jointProjects: JointProject[];
  jointPublications: JointPublication[];
}

export interface Publication {
  id: number;
  title: LocalizedString;
  authors: string;
  journal: string;
  year: number;
  link: string;
}

export interface ResearcherProfiles {
  researchgate?: string;
  googleScholar?: string;
  scopus?: string;
  publons?: string;
  orcid?: string;
}

export interface Researcher {
  id: number;
  name: string;
  title: LocalizedString;
  photo: string;
  bio: LocalizedString;
  profiles: ResearcherProfiles;
  publications: Publication[];
}

export interface ProjectPublication {
  id: number;
  title: LocalizedString;
  link: string;
}

export interface ProjectVideo {
  id: number;
  title: LocalizedString;
  embedUrl: string;
}

export interface Project {
  id: number;
  title: LocalizedString;
  description: LocalizedString;
  githubLink: string;
  publications: ProjectPublication[];
  videos: ProjectVideo[];
}

export interface TrainingMaterial {
  id: number;
  title: LocalizedString;
  description: LocalizedString;
  url: string;
  image: string;
}

export interface Dictionary {
  home: {
    title: string
    description: string
    researchersDescription: string
    sandboxDescription: string
    partnersDescription: string
    trainingDescription: string
  }
  navigation: {
    projects: string
    publications: string
    researchers: string
    sandbox: string
    partners: string
    training: string
  }
  footer: {
    copyright: string
  }
  notFound: {
    title: string
    description: string
    goHome: string
  }
  common: {
    learnMore: string
  }
  projects: {
    title: string
    noProjectsFound: string
    notFound: string
    viewOnGitHub: string
    significantPublications: string
    projectVideos: string
  }
  publications: {
    title: string
    sortBy: string
    year: string
    filterByYear: string
    allYears: string
    viewPublication: string
  }
  researchers: {
    title: string
    viewProfile: string
    significantPublications: string
    notFound: string
  }
  training: {
    title: string
  }
  partners: {
    title: string
    universities: string
    enterprises: string
    jointProjects: string
    jointPublications: string
  }
  sandbox: {
    errorOccurred: string
    lorenzSystemControls: string
    axesSize: string
  }
}

