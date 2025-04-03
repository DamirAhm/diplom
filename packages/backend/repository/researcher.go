package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteResearcherRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
}

func NewSQLiteResearcherRepo(db *sql.DB, lsRepo LocalizedStringRepo) *SQLiteResearcherRepo {
	return &SQLiteResearcherRepo{
		db:                  db,
		localizedStringRepo: lsRepo,
	}
}

func (r *SQLiteResearcherRepo) Create(researcher models.Researcher) (int64, error) {
	bioID, err := r.localizedStringRepo.Create(researcher.Bio)
	if err != nil {
		return 0, err
	}

	nameID, err := r.localizedStringRepo.Create(researcher.Name)
	if err != nil {
		return 0, err
	}

	lastNameID, err := r.localizedStringRepo.Create(researcher.LastName)
	if err != nil {
		return 0, err
	}

	positionID, err := r.localizedStringRepo.Create(researcher.Position)
	if err != nil {
		return 0, err
	}

	res, err := r.db.Exec(
		`INSERT INTO researchers (name_id, last_name_id, position_id, photo, bio_id, google_scholar, research_gate, 
			publons, orcid, scopus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		nameID, lastNameID, positionID, researcher.Photo, bioID,
		researcher.Profiles.GoogleScholar, researcher.Profiles.ResearchGate,
		researcher.Profiles.Publons, researcher.Profiles.Orcid, researcher.Profiles.Scopus,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	return id, err
}

func (r *SQLiteResearcherRepo) CalculateTotalCitations(researcherID int) (int, error) {
	var totalCitations int
	err := r.db.QueryRow(`
		SELECT COALESCE(SUM(p.citations_count), 0)
		FROM publications p
		JOIN publication_authors pa ON p.id = pa.publication_id
		WHERE pa.researcher_id = ?
	`, researcherID).Scan(&totalCitations)

	if err != nil {
		return 0, err
	}
	return totalCitations, nil
}

func (r *SQLiteResearcherRepo) GetByID(id int) (*models.Researcher, error) {
	researcher := models.NewResearcher()
	var bioID, positionID, nameID, lastNameID int64

	err := r.db.QueryRow(
		`SELECT id, name_id, last_name_id, photo, bio_id, position_id, google_scholar, research_gate, 
			publons, orcid, scopus FROM researchers WHERE id = ?`,
		id,
	).Scan(
		&researcher.ID, &nameID, &lastNameID, &researcher.Photo, &bioID, &positionID,
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

	name, err := r.localizedStringRepo.Get(nameID)
	if err != nil {
		return nil, err
	}
	researcher.Name = *name

	lastName, err := r.localizedStringRepo.Get(lastNameID)
	if err != nil {
		return nil, err
	}
	researcher.LastName = *lastName

	position, err := r.localizedStringRepo.Get(positionID)
	if err != nil {
		return nil, err
	}
	researcher.Position = *position

	publications, err := r.GetResearcherPublications(id)
	if err != nil {
		return nil, err
	}
	if publications != nil {
		researcher.Publications = publications
	}

	totalCitations, err := r.CalculateTotalCitations(id)
	if err != nil {
		return nil, err
	}
	researcher.TotalCitations = totalCitations

	return &researcher, nil
}

func (r *SQLiteResearcherRepo) GetByIDs(ids []int) ([]models.Researcher, error) {
	query := `SELECT id, name_id, last_name_id, photo, bio_id, position_id, google_scholar, research_gate, 
		publons, orcid, scopus FROM researchers WHERE id IN (`

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}
	query += Join(placeholders, ",") + ")"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	researchers := []models.Researcher{}

	for rows.Next() {
		var researcher models.Researcher
		var bioID, positionID, nameID, lastNameID int64
		err := rows.Scan(
			&researcher.ID, &nameID, &lastNameID, &researcher.Photo, &bioID, &positionID,
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

		name, err := r.localizedStringRepo.Get(nameID)
		if err != nil {
			return nil, err
		}
		researcher.Name = *name

		lastName, err := r.localizedStringRepo.Get(lastNameID)
		if err != nil {
			return nil, err
		}
		researcher.LastName = *lastName

		position, err := r.localizedStringRepo.Get(positionID)
		if err != nil {
			return nil, err
		}
		researcher.Position = *position

		publications, err := r.GetResearcherPublications(researcher.ID)
		if err != nil {
			return nil, err
		}
		researcher.Publications = publications

		totalCitations, err := r.CalculateTotalCitations(researcher.ID)
		if err != nil {
			return nil, err
		}
		researcher.TotalCitations = totalCitations

		researchers = append(researchers, researcher)
	}

	return researchers, nil
}

func (r *SQLiteResearcherRepo) GetAll() ([]models.Researcher, error) {
	rows, err := r.db.Query(
		`SELECT id, name_id, last_name_id, photo, bio_id, position_id, google_scholar, research_gate, 
			publons, orcid, scopus FROM researchers`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	researchers := []models.Researcher{}
	for rows.Next() {
		var researcher models.Researcher
		var bioID, positionID, nameID, lastNameID int64
		err := rows.Scan(
			&researcher.ID, &nameID, &lastNameID, &researcher.Photo, &bioID, &positionID,
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

		name, err := r.localizedStringRepo.Get(nameID)
		if err != nil {
			return nil, err
		}
		researcher.Name = *name

		lastName, err := r.localizedStringRepo.Get(lastNameID)
		if err != nil {
			return nil, err
		}
		researcher.LastName = *lastName

		position, err := r.localizedStringRepo.Get(positionID)
		if err != nil {
			return nil, err
		}
		researcher.Position = *position

		publications, err := r.GetResearcherPublications(researcher.ID)
		if err != nil {
			return nil, err
		}
		researcher.Publications = publications

		totalCitations, err := r.CalculateTotalCitations(researcher.ID)
		if err != nil {
			return nil, err
		}
		researcher.TotalCitations = totalCitations

		researchers = append(researchers, researcher)
	}
	return researchers, nil
}

func (r *SQLiteResearcherRepo) Update(researcher models.Researcher) error {
	var bioID, positionID, nameID, lastNameID int64
	err := r.db.QueryRow(
		"SELECT bio_id, position_id, name_id, last_name_id FROM researchers WHERE id = ?",
		researcher.ID,
	).Scan(&bioID, &positionID, &nameID, &lastNameID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(bioID, researcher.Bio); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(nameID, researcher.Name); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(lastNameID, researcher.LastName); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(positionID, researcher.Position); err != nil {
		return err
	}

	_, err = r.db.Exec(
		`UPDATE researchers SET photo = ?, google_scholar = ?, research_gate = ?, 
			publons = ?, orcid = ?, scopus = ? WHERE id = ?`,
		researcher.Photo,
		researcher.Profiles.GoogleScholar, researcher.Profiles.ResearchGate,
		researcher.Profiles.Publons, researcher.Profiles.Orcid, researcher.Profiles.Scopus,
		researcher.ID,
	)
	return err
}

func (r *SQLiteResearcherRepo) Delete(id int) error {
	var bioID, positionID, nameID, lastNameID int64
	err := r.db.QueryRow(
		"SELECT bio_id, position_id, name_id, last_name_id FROM researchers WHERE id = ?",
		id,
	).Scan(&bioID, &positionID, &nameID, &lastNameID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(bioID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(positionID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(nameID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(lastNameID); err != nil {
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

func (r *SQLiteResearcherRepo) GetResearcherPublications(researcherID int) ([]models.Publication, error) {
	rows, err := r.db.Query(`
		SELECT p.id, p.title_id, p.link, p.journal, p.published_at, p.citations_count
		FROM publications p
		JOIN publication_authors pa ON p.id = pa.publication_id
		WHERE pa.researcher_id = ?
		ORDER BY p.published_at DESC
	`, researcherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var publications []models.Publication
	for rows.Next() {
		var pub models.Publication
		var titleID int64
		err := rows.Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount)
		if err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		pub.Title = *title

		authorRows, err := r.db.Query(`
			SELECT r.id, fn.en, ln.en, fn.ru, ln.ru
			FROM researchers r
			JOIN publication_authors pa ON r.id = pa.researcher_id
			JOIN localized_strings fn ON r.name_id = fn.id
			JOIN localized_strings ln ON r.last_name_id = ln.id
			WHERE pa.publication_id = ?
		`, pub.ID)
		if err != nil {
			return nil, err
		}

		var authors []models.Author
		for authorRows.Next() {
			var id int
			var nameEn, lastNameEn, nameRu, lastNameRu string
			err := authorRows.Scan(&id, &nameEn, &lastNameEn, &nameRu, &lastNameRu)
			if err != nil {
				authorRows.Close()
				return nil, err
			}
			authors = append(authors, models.Author{
				ID: &id,
				Name: models.LocalizedString{
					En: nameEn + " " + lastNameEn,
					Ru: nameRu + " " + lastNameRu,
				},
			})
		}
		authorRows.Close()

		externalRows, err := r.db.Query(`
			SELECT ls.en, ls.ru 
			FROM publication_external_authors pea
			JOIN localized_strings ls ON pea.name_id = ls.id
			WHERE pea.publication_id = ?
		`, pub.ID)
		if err != nil {
			return nil, err
		}

		for externalRows.Next() {
			var nameEn, nameRu string
			if err := externalRows.Scan(&nameEn, &nameRu); err != nil {
				externalRows.Close()
				return nil, err
			}
			authors = append(authors, models.Author{
				Name: models.LocalizedString{
					En: nameEn,
					Ru: nameRu,
				},
			})
		}
		externalRows.Close()

		pub.Authors = authors
		publications = append(publications, pub)
	}

	return publications, nil
}

func (r *SQLiteResearcherRepo) FindByFullName(fullName string) (*models.Researcher, error) {
	nameParts := strings.Split(fullName, " ")
	if len(nameParts) != 2 {
		return nil, fmt.Errorf("invalid full name format: %s", fullName)
	}

	firstName, lastName := nameParts[0], nameParts[1]

	query := `
		SELECT r.id
		FROM researchers r
		JOIN localized_strings fn ON r.name_id = fn.id
		JOIN localized_strings ln ON r.last_name_id = ln.id
		WHERE (fn.en = ? and ln.en = ?) OR (fn.ru = ? and ln.ru = ?)
	`

	var researcherID int
	err := r.db.QueryRow(query, firstName, lastName, firstName, lastName).Scan(&researcherID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("researcher not found: %s", fullName)
		}
		return nil, err
	}

	return r.GetByID(researcherID)
}
