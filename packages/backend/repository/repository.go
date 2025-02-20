package repository

import "github.com/damirahm/diplom/backend/models"

type LocalizedStringRepo interface {
	Create(ls models.LocalizedString) (int64, error)
	Get(id int64) (*models.LocalizedString, error)
	Update(id int64, ls models.LocalizedString) error
	Delete(id int64) error
}

type PartnerRepo interface {
	Create(partner models.Partner, partnerType string) error
	GetByID(id int) (*models.Partner, error)
	GetAll(partnerType string) ([]models.Partner, error)
	Update(partner models.Partner) error
	Delete(id int) error
}

type JointProjectRepo interface {
	Create(pub models.JointProject) error
	GetByID(id int) (*models.JointProject, error)
	GetAll() ([]models.JointProject, error)
	Update(pub models.JointProject) error
	Delete(id int) error
}

type JointPublicationRepo interface {
	Create(pub models.JointPublication) error
	GetByID(id int) (*models.JointPublication, error)
	GetAll() ([]models.JointPublication, error)
	Update(pub models.JointPublication) error
	Delete(id int) error
}

type PublicationRepo interface {
	Create(pub models.Publication) error
	GetByID(id int) (*models.Publication, error)
	GetAll() ([]models.Publication, error)
	Update(pub models.Publication) error
	Delete(id int) error
}

type ResearcherRepo interface {
	Create(researcher models.Researcher) error
	GetByID(id int) (*models.Researcher, error)
	GetAll() ([]models.Researcher, error)
	Update(researcher models.Researcher) error
	Delete(id int) error
	AddPublication(researcherID int, publicationID int) error
	RemovePublication(researcherID int, publicationID int) error
}

type ProjectRepo interface {
	Create(project models.Project) error
	GetByID(id int) (*models.Project, error)
	GetAll() ([]models.Project, error)
	Update(project models.Project) error
	Delete(id int) error
	AddPublication(projectID int, pub models.ProjectPublication) error
	AddVideo(projectID int, video models.ProjectVideo) error
}

type TrainingMaterialRepo interface {
	Create(material models.TrainingMaterial) error
	GetByID(id int) (*models.TrainingMaterial, error)
	GetAll() ([]models.TrainingMaterial, error)
	Update(material models.TrainingMaterial) error
	Delete(id int) error
}
