package models

type LocalizedString struct {
	En string `json:"en"`
	Ru string `json:"ru"`
}

type Partner struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Logo string `json:"logo"`
	URL  string `json:"url"`
}

type JointProject struct {
	ID       int             `json:"id"`
	Title    LocalizedString `json:"title"`
	Partners []string        `json:"partners"`
	Year     int             `json:"year"`
}

type JointPublication struct {
	ID      int             `json:"id"`
	Title   LocalizedString `json:"title"`
	Authors string          `json:"authors"`
	Journal string          `json:"journal"`
	Year    int             `json:"year"`
	Link    string          `json:"link"`
}

type PartnersData struct {
	Universities      []Partner          `json:"universities"`
	Enterprises       []Partner          `json:"enterprises"`
	JointProjects     []JointProject     `json:"jointProjects"`
	JointPublications []JointPublication `json:"jointPublications"`
}

type Publication struct {
	ID             int             `json:"id"`
	Title          LocalizedString `json:"title"`
	Authors        []int           `json:"authors"`
	Journal        string          `json:"journal"`
	PublishedAt    string          `json:"publishedAt"`
	CitationsCount int             `json:"citationsCount"`
	Link           string          `json:"link"`
}

type Researcher struct {
	ID             int                `json:"id"`
	Name           LocalizedString    `json:"name"`
	LastName       LocalizedString    `json:"lastName"`
	Position       LocalizedString    `json:"position"`
	Photo          string             `json:"photo"`
	Bio            LocalizedString    `json:"bio"`
	Profiles       ResearcherProfiles `json:"profiles"`
	Publications   []Publication      `json:"publications"`
	TotalCitations int                `json:"totalCitations"`
}

type ResearcherProfiles struct {
	ResearchGate  *string `json:"researchgate,omitempty"`
	GoogleScholar *string `json:"googleScholar,omitempty"`
	Scopus        *string `json:"scopus,omitempty"`
	Publons       *string `json:"publons,omitempty"`
	Orcid         *string `json:"orcid,omitempty"`
}

type ProjectPublication struct {
	ID    int             `json:"id"`
	Title LocalizedString `json:"title"`
	Link  string          `json:"link"`
}

type ProjectVideo struct {
	ID       int             `json:"id"`
	Title    LocalizedString `json:"title"`
	EmbedURL string          `json:"embedUrl"`
}

type Project struct {
	ID           int                  `json:"id"`
	Title        LocalizedString      `json:"title"`
	Description  LocalizedString      `json:"description"`
	GithubLink   string               `json:"githubLink"`
	Publications []ProjectPublication `json:"publications"`
	Videos       []ProjectVideo       `json:"videos"`
}

type TrainingMaterial struct {
	ID          int             `json:"id"`
	Title       LocalizedString `json:"title"`
	Description LocalizedString `json:"description"`
	URL         string          `json:"url"`
	Image       string          `json:"image"`
}

func NewLocalizedString() LocalizedString {
	return LocalizedString{}
}

func NewPartner() Partner {
	return Partner{}
}

func NewJointProject() JointProject {
	return JointProject{
		Partners: []string{},
	}
}

func NewJointPublication() JointPublication {
	return JointPublication{}
}

func NewPartnersData() PartnersData {
	return PartnersData{
		Universities:      []Partner{},
		Enterprises:       []Partner{},
		JointProjects:     []JointProject{},
		JointPublications: []JointPublication{},
	}
}

func NewPublication() Publication {
	return Publication{
		Authors:        []int{},
		CitationsCount: 0,
	}
}

func NewResearcherProfiles() ResearcherProfiles {
	return ResearcherProfiles{}
}

func NewResearcher() Researcher {
	return Researcher{
		Publications: []Publication{},
	}
}

func NewProjectPublication() ProjectPublication {
	return ProjectPublication{}
}

func NewProjectVideo() ProjectVideo {
	return ProjectVideo{}
}

func NewProject() Project {
	return Project{
		Publications: []ProjectPublication{},
		Videos:       []ProjectVideo{},
	}
}

func NewTrainingMaterial() TrainingMaterial {
	return TrainingMaterial{}
}
