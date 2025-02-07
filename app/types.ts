export type Locale = "en" | "ru"

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

