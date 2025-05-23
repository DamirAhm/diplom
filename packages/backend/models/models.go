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
	Type string `json:"type"`
}

type PartnersData struct {
	Universities []Partner `json:"universities"`
	Enterprises  []Partner `json:"enterprises"`
}

type Author struct {
	Name LocalizedString `json:"name"`
	ID   *int            `json:"id,omitempty"`
}

type Publication struct {
	ID             int             `json:"id"`
	Title          LocalizedString `json:"title"`
	Authors        []Author        `json:"authors"`
	Journal        string          `json:"journal"`
	PublishedAt    string          `json:"publishedAt"`
	CitationsCount int             `json:"citationsCount"`
	Link           string          `json:"link"`
	Visible        bool            `json:"visible"`
}

type Researcher struct {
	ID              int                `json:"id"`
	Name            LocalizedString    `json:"name"`
	LastName        LocalizedString    `json:"lastName"`
	Position        LocalizedString    `json:"position"`
	Photo           string             `json:"photo"`
	Bio             LocalizedString    `json:"bio"`
	Profiles        ResearcherProfiles `json:"profiles"`
	Publications    []Publication      `json:"publications"`
	TotalCitations  int                `json:"totalCitations"`
	HIndex          int                `json:"hIndex"`
	RecentCitations int                `json:"recentCitations"`
	RecentHIndex    int                `json:"recentHIndex"`
}

type ResearcherWithPublicationsCount struct {
	Researcher
	PublicationsCount int `json:"publicationsCount"`
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

type ProjectImage struct {
	ID    int    `json:"id"`
	URL   string `json:"url"`
	Order int    `json:"order"`
}

type Project struct {
	ID           int                  `json:"id"`
	Title        LocalizedString      `json:"title"`
	Description  LocalizedString      `json:"description"`
	GithubLink   string               `json:"githubLink"`
	Publications []ProjectPublication `json:"publications"`
	Videos       []ProjectVideo       `json:"videos"`
	Images       []ProjectImage       `json:"images"`
}

type TrainingMaterial struct {
	ID          int              `json:"id"`
	Title       LocalizedString  `json:"title"`
	Description LocalizedString  `json:"description"`
	URL         string           `json:"url"`
	Image       string           `json:"image"`
	Type        *LocalizedString `json:"type,omitempty"`
}

type DisciplineResearcher struct {
	ID       int             `json:"id"`
	Name     LocalizedString `json:"name"`
	LastName LocalizedString `json:"lastName"`
}

type Discipline struct {
	ID          int                    `json:"id"`
	Title       LocalizedString        `json:"title"`
	Description LocalizedString        `json:"description"`
	Researchers []DisciplineResearcher `json:"researchers"`
	Image       string                 `json:"image"`
}

func NewLocalizedString() LocalizedString {
	return LocalizedString{}
}

func NewPartner() Partner {
	return Partner{}
}

func NewPartnersData() PartnersData {
	return PartnersData{
		Universities: []Partner{},
		Enterprises:  []Partner{},
	}
}

func NewPublication() Publication {
	return Publication{
		Authors:        []Author{},
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

func NewProjectImage() ProjectImage {
	return ProjectImage{}
}

func NewProject() Project {
	return Project{
		Publications: []ProjectPublication{},
		Videos:       []ProjectVideo{},
		Images:       []ProjectImage{},
	}
}

func NewTrainingMaterial() TrainingMaterial {
	return TrainingMaterial{}
}

func NewDisciplineResearcher() DisciplineResearcher {
	return DisciplineResearcher{}
}

func NewDiscipline() Discipline {
	return Discipline{
		Researchers: []DisciplineResearcher{},
	}
}
