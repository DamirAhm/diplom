export type Locale = "en" | "ru";

export interface LocalizedString {
  en: string;
  ru: string;
}

export interface Partner {
  id: number;
  name: string;
  logo: string;
  url: string;
  type?: "university" | "enterprise";
}

export interface PartnersData {
  universities: Partner[];
  enterprises: Partner[];
}

export interface Author {
  name: LocalizedString;
  id?: number;
}

export interface Publication {
  id: number;
  title: LocalizedString;
  link: string;
  journal: string;
  publishedAt: string;
  citationsCount: number;
  authors: Author[];
  visible: boolean;
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
  name: LocalizedString;
  lastName: LocalizedString;
  position: LocalizedString;
  bio: LocalizedString;
  photo: string;
  profiles: ResearcherProfiles;
  publications: Publication[];
  totalCitations: number;
  hIndex: number;
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

export interface ProjectImage {
  id: number;
  url: string;
  order: number;
}

export interface Project {
  id: number;
  title: LocalizedString;
  description: LocalizedString;
  githubLink: string;
  publications: ProjectPublication[];
  videos: ProjectVideo[];
  images: ProjectImage[];
}

export interface Video {
  id: number;
  title: LocalizedString;
  url: string;
}

export interface TrainingMaterial {
  id: number;
  title: LocalizedString;
  description: LocalizedString;
  url: string;
  image: string;
}

export interface APIError {
  message: string;
  status: number;
}

export interface Dictionary {
  home: {
    title: string;
    description: string;
    researchersDescription: string;
    sandboxDescription: string;
    partnersDescription: string;
    trainingDescription: string;
  };
  navigation: {
    projects: string;
    publications: string;
    researchers: string;
    sandbox: string;
    partners: string;
    training: string;
    home: string;
  };
  footer: {
    copyright: string;
  };
  notFound: {
    title: string;
    description: string;
    goHome: string;
  };
  common: {
    learnMore: string;
    loading: string;
    saving: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    error: string;
    success: string;
    unexpectedError: string;
    tryAgain: string;
    notFound: string;
    resourceNotFound: string;
    backToDashboard: string;
    search: string;
    searchPlaceholder: string;
    filter: string;
    selected: string;
    deleteSelected: string;
    clearSelection: string;
    confirmDeleteMultiple: string;
    noResults: string;
    filterBy: string;
    sortBy: string;
    ascending: string;
    descending: string;
    apply: string;
    reset: string;
    itemsPerPage: string;
    page: string;
    of: string;
    next: string;
    previous: string;
    add: string;
    invalidInput: string;
    logout: string;
    errorBoundary: {
      title: string;
      description: string;
      retry: string;
      contact: string;
      details: string;
      unexpectedError: string;
      connectionError: string;
      timeoutError: string;
      notFoundError: string;
      accessDeniedError: string;
    };
    translationRequired: string;
    enterEnglishText: string;
    enterRussianText: string;
  };
  projects: {
    title: string;
    noProjectsFound: string;
    notFound: string;
    viewOnGitHub: string;
    significantPublications: string;
    projectVideos: string;
  };
  publications: {
    title: string;
    sortBy: string;
    year: string;
    filterByYear: string;
    allYears: string;
    viewPublication: string;
    citations: string;
  };
  researchers: {
    title: string;
    viewProfile: string;
    significantPublications: string;
    notFound: string;
  };
  training: {
    title: string;
  };
  partners: {
    title: string;
    universities: string;
    enterprises: string;
    jointProjects: string;
    jointPublications: string;
  };
  sandbox: {
    errorOccurred: string;
    lorenzSystemControls: string;
    axesSize: string;
    systemSelection: string;
    systemParameters: string;
    initialPosition: string;
    visualization: string;
    simulationParameters: string;
    simulationTime: string;
    simulationStep: string;
    neuronDynamics: string;
    modelConfiguration: string;
    modelType: string;
    testType: string;
    parameters: string;
    excitabilityClass: string;
    rheobase: string;
    threshold: string;
    results: string;
    graph: string;
    analysis: string;
    visualizationPlaceholder: string;
    graphPlaceholder: string;
    analysisPlaceholder: string;
    runSimulation: string;
    membraneVoltage: string;
    noData: string;
    analysisNotAvailable: string;
    chart: {
      time: string;
      voltage: string;
      models: {
        hh: string;
        fhn: string;
        hr: string;
      };
    };
  };
  admin: {
    signIn: string;
    username: string;
    password: string;
    loginError: string;
    invalidCredentials: string;
    serverError: string;
    dashboard: string;
    welcome: string;
    selectSection: string;
    logout: string;
    success: string;
    error: string;
    deleteSuccess: string;
    deleteError: string;
    saveSuccess: string;
    saveError: string;
    uploadError: string;
    fetchError: string;
    confirmDelete: string;
    name: string;
    title: string;
    position: string;
    bio: string;
    photo: string;
    profiles: string;
    addProfile: string;
    enterProfileType: string;
    enterProfileUrl: string;
    selectProfileType: string;
    profileType: string;
    researchers: string;
    addResearcher: string;
    editResearcher: string;
    projects: string;
    addProject: string;
    editProject: string;
    description: string;
    githubLink: string;
    publications: string;
    addPublication: string;
    editPublication: string;
    partners: string;
    addPartner: string;
    editPartner: string;
    training: string;
    addTraining: string;
    editTraining: string;
    actions: string;
    type: string;
    url: string;
    videos: string;
    addVideo: string;
    removeVideo: string;
    videoUrl: string;
    videoTitle: string;
    statsError: string;
    recentActivity: string;
    activityTypes: {
      researcher: string;
      project: string;
      publication: string;
      partner: string;
      training: string;
    };
    activityActions: {
      created: string;
      updated: string;
      deleted: string;
    };
    statistics: {
      total: string;
      today: string;
      thisWeek: string;
      thisMonth: string;
    };
    searchResearchers: string;
    searchProjects: string;
    searchPublications: string;
    searchPartners: string;
    searchTraining: string;
    noMoreProfiles: string;
    content: string;
    category: string;
    image: string;
    urlPlaceholder: string;
    visibility: string;
    visibilityToggleSuccess: string;
    visibilityToggleError: string;
  };
  validation: {
    required: string;
    invalidUrl: string;
    invalidEmail: string;
    minLength: string;
    maxLength: string;
    formErrors: string;
  };
}
