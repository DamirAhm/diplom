package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteResearcherRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
	publicationRepo     PublicationRepo
}

func NewSQLiteResearcherRepo(db *sql.DB, lsRepo LocalizedStringRepo, pubRepo PublicationRepo) *SQLiteResearcherRepo {
	return &SQLiteResearcherRepo{
		db:                  db,
		localizedStringRepo: lsRepo,
		publicationRepo:     pubRepo,
	}
}

func (r *SQLiteResearcherRepo) Create(researcher models.Researcher) error {
	bioID, err := r.localizedStringRepo.Create(researcher.Bio)
	if err != nil {
		return err
	}

	titleID, err := r.localizedStringRepo.Create(researcher.Title)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(
		`INSERT INTO researchers (name, photo, bio_id, title_id, google_scholar, research_gate, 
			publons, orcid, scopus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		researcher.Name, researcher.Photo, bioID, titleID,
		researcher.Profiles.GoogleScholar, researcher.Profiles.ResearchGate,
		researcher.Profiles.Publons, researcher.Profiles.Orcid, researcher.Profiles.Scopus,
	)
	return err
}

func (r *SQLiteResearcherRepo) GetByID(id int) (*models.Researcher, error) {
	researcher := models.NewResearcher()
	var bioID, titleID int64

	err := r.db.QueryRow(
		`SELECT id, name, photo, bio_id, title_id, google_scholar, research_gate, 
			publons, orcid, scopus FROM researchers WHERE id = ?`,
		id,
	).Scan(
		&researcher.ID, &researcher.Name, &researcher.Photo, &bioID, &titleID,
		&researcher.Profiles.GoogleScholar, &researcher.Profiles.ResearchGate,
		&researcher.Profiles.Publons, &researcher.Profiles.Orcid, &researcher.Profiles.Scopus,
	)
	if err != nil {
		return nil, err
	}

	bio, err := r.localizedStringRepo.Get(bioID)
	if err != nil {
		return nil, err
	}
	researcher.Bio = *bio

	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	researcher.Title = *title

	publications, err := r.getResearcherPublications(id)
	if err != nil {
		return nil, err
	}
	if publications != nil {
		researcher.Publications = publications
	}

	return &researcher, nil
}

func (r *SQLiteResearcherRepo) GetAll() ([]models.Researcher, error) {
	rows, err := r.db.Query(
		`SELECT id, name, photo, bio_id, title_id, google_scholar, research_gate, 
			publons, orcid, scopus FROM researchers`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var researchers []models.Researcher
	for rows.Next() {
		var researcher models.Researcher
		var bioID, titleID int64
		err := rows.Scan(
			&researcher.ID, &researcher.Name, &researcher.Photo, &bioID, &titleID,
			&researcher.Profiles.GoogleScholar, &researcher.Profiles.ResearchGate,
			&researcher.Profiles.Publons, &researcher.Profiles.Orcid, &researcher.Profiles.Scopus,
		)
		if err != nil {
			return nil, err
		}

		bio, err := r.localizedStringRepo.Get(bioID)
		if err != nil {
			return nil, err
		}
		researcher.Bio = *bio

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		researcher.Title = *title

		publications, err := r.getResearcherPublications(researcher.ID)
		if err != nil {
			return nil, err
		}
		researcher.Publications = publications

		researchers = append(researchers, researcher)
	}
	return researchers, nil
}

func (r *SQLiteResearcherRepo) Update(researcher models.Researcher) error {
	var bioID, titleID int64
	err := r.db.QueryRow(
		"SELECT bio_id, title_id FROM researchers WHERE id = ?",
		researcher.ID,
	).Scan(&bioID, &titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(bioID, researcher.Bio); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(titleID, researcher.Title); err != nil {
		return err
	}

	_, err = r.db.Exec(
		`UPDATE researchers SET name = ?, photo = ?, google_scholar = ?, research_gate = ?, 
			publons = ?, orcid = ?, scopus = ? WHERE id = ?`,
		researcher.Name, researcher.Photo,
		researcher.Profiles.GoogleScholar, researcher.Profiles.ResearchGate,
		researcher.Profiles.Publons, researcher.Profiles.Orcid, researcher.Profiles.Scopus,
		researcher.ID,
	)
	return err
}

func (r *SQLiteResearcherRepo) Delete(id int) error {
	var bioID, titleID int64
	err := r.db.QueryRow(
		"SELECT bio_id, title_id FROM researchers WHERE id = ?",
		id,
	).Scan(&bioID, &titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(bioID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(titleID); err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM researchers WHERE id = ?", id)
	return err
}

func (r *SQLiteResearcherRepo) AddPublication(researcherID int, publicationID int) error {
	_, err := r.db.Exec(
		"INSERT INTO researcher_publications (researcher_id, publication_id) VALUES (?, ?)",
		researcherID, publicationID,
	)
	return err
}

func (r *SQLiteResearcherRepo) RemovePublication(researcherID int, publicationID int) error {
	_, err := r.db.Exec(
		"DELETE FROM researcher_publications WHERE researcher_id = ? AND publication_id = ?",
		researcherID, publicationID,
	)
	return err
}

func (r *SQLiteResearcherRepo) getResearcherPublications(researcherID int) ([]models.Publication, error) {
	rows, err := r.db.Query(
		"SELECT publication_id FROM researcher_publications WHERE researcher_id = ?",
		researcherID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var publications []models.Publication
	for rows.Next() {
		var publicationID int
		if err := rows.Scan(&publicationID); err != nil {
			return nil, err
		}

		publication, err := r.publicationRepo.GetByID(publicationID)
		if err != nil {
			return nil, err
		}
		publications = append(publications, *publication)
	}
	return publications, nil
}
