package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLitePublicationRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
	researcherRepo      ResearcherRepo
}

func NewSQLitePublicationRepo(db *sql.DB, lsRepo LocalizedStringRepo, researcherRepo ResearcherRepo) *SQLitePublicationRepo {
	return &SQLitePublicationRepo{db: db, localizedStringRepo: lsRepo, researcherRepo: researcherRepo}
}

func (r *SQLitePublicationRepo) Create(pub models.Publication) (int64, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Create the localized string directly in this transaction
	result, err := tx.Exec(
		"INSERT INTO localized_strings (en, ru) VALUES (?, ?)",
		pub.Title.En, pub.Title.Ru,
	)
	if err != nil {
		return 0, err
	}

	titleID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	res, err := tx.Exec(
		"INSERT INTO publications (title_id, link, journal, published_at, citations_count) VALUES (?, ?, ?, ?, ?)",
		titleID, pub.Link, pub.Journal, pub.PublishedAt, pub.CitationsCount,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	for _, authorID := range pub.Authors {
		_, err = tx.Exec(
			"INSERT INTO publication_authors (publication_id, researcher_id) VALUES (?, ?)",
			id, authorID,
		)
		if err != nil {
			return 0, err
		}
	}

	err = tx.Commit()
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (r *SQLitePublicationRepo) GetByID(id int) (*models.Publication, error) {
	var pub models.Publication
	var titleID int64

	err := r.db.QueryRow(
		"SELECT id, title_id, link, journal, published_at, citations_count FROM publications WHERE id = ?",
		id,
	).Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount)
	if err != nil {
		return nil, err
	}

	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	pub.Title = *title

	// Get the authors
	rows, err := r.db.Query(
		"SELECT researcher_id FROM publication_authors WHERE publication_id = ?",
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := []int{}
	for rows.Next() {
		var authorID int
		if err := rows.Scan(&authorID); err != nil {
			return nil, err
		}
		authors = append(authors, authorID)
	}
	pub.Authors = authors

	return &pub, nil
}

func (r *SQLitePublicationRepo) GetAll() ([]models.Publication, error) {
	rows, err := r.db.Query("SELECT id, title_id, link, journal, published_at, citations_count FROM publications")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	publications := []models.Publication{}
	for rows.Next() {
		var pub models.Publication
		var titleID int64
		if err := rows.Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		pub.Title = *title

		authorRows, err := r.db.Query(
			"SELECT researcher_id FROM publication_authors WHERE publication_id = ?",
			pub.ID,
		)
		if err != nil {
			return nil, err
		}

		var authors []int
		for authorRows.Next() {
			var authorID int
			if err := authorRows.Scan(&authorID); err != nil {
				authorRows.Close()
				return nil, err
			}
			authors = append(authors, authorID)
		}
		authorRows.Close()
		pub.Authors = authors

		publications = append(publications, pub)
	}

	return publications, nil
}

func (r *SQLitePublicationRepo) Update(pub models.Publication) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	var titleID int64
	err = tx.QueryRow(
		"SELECT title_id FROM publications WHERE id = ?",
		pub.ID,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	// Update the localized string directly in this transaction
	_, err = tx.Exec(
		"UPDATE localized_strings SET en = ?, ru = ? WHERE id = ?",
		pub.Title.En, pub.Title.Ru, titleID,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		"UPDATE publications SET link = ?, journal = ?, published_at = ?, citations_count = ? WHERE id = ?",
		pub.Link, pub.Journal, pub.PublishedAt, pub.CitationsCount, pub.ID,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		"DELETE FROM publication_authors WHERE publication_id = ?",
		pub.ID,
	)
	if err != nil {
		return err
	}

	for _, authorID := range pub.Authors {
		_, err = tx.Exec(
			"INSERT INTO publication_authors (publication_id, researcher_id) VALUES (?, ?)",
			pub.ID, authorID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *SQLitePublicationRepo) Delete(id int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	var titleID int64
	err = tx.QueryRow(
		"SELECT title_id FROM publications WHERE id = ?",
		id,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	// Delete the localized string directly in this transaction
	_, err = tx.Exec("DELETE FROM localized_strings WHERE id = ?", titleID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		"DELETE FROM publication_authors WHERE publication_id = ?",
		id,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM publications WHERE id = ?", id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *SQLitePublicationRepo) GetAuthors(id int) ([]models.Researcher, error) {
	rows, err := r.db.Query(
		"SELECT researcher_id FROM publication_authors WHERE publication_id = ?",
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authorIDs := []int{}

	for rows.Next() {
		var authorID int
		if err := rows.Scan(&authorID); err != nil {
			return nil, err
		}
		authorIDs = append(authorIDs, authorID)
	}

	authors, err := r.researcherRepo.GetByIDs(authorIDs)
	if err != nil {
		return nil, err
	}

	return authors, nil
}

func (r *SQLitePublicationRepo) GetByIDs(ids []int) ([]models.Publication, error) {
	if len(ids) == 0 {
		return []models.Publication{}, nil
	}

	query := `SELECT id, title_id, link, journal, published_at, citations_count 
	          FROM publications WHERE id IN (`

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

	publicationsMap := make(map[int]models.Publication)
	var publicationIDs []int

	for rows.Next() {
		var pub models.Publication
		var titleID int64
		if err := rows.Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		pub.Title = *title

		publicationsMap[pub.ID] = pub
		publicationIDs = append(publicationIDs, pub.ID)
	}

	// Fetch all authors in a single query
	authorQuery := `SELECT publication_id, researcher_id 
	                FROM publication_authors 
	                WHERE publication_id IN (`

	authorPlaceholders := make([]string, len(publicationIDs))
	authorArgs := make([]interface{}, len(publicationIDs))
	for i, id := range publicationIDs {
		authorPlaceholders[i] = "?"
		authorArgs[i] = id
	}
	authorQuery += Join(authorPlaceholders, ",") + ")"

	authorRows, err := r.db.Query(authorQuery, authorArgs...)
	if err != nil {
		return nil, err
	}
	defer authorRows.Close()

	// Create temporary map of publication ID to author IDs
	pubToAuthors := make(map[int][]int)
	for authorRows.Next() {
		var pubID, authorID int
		if err := authorRows.Scan(&pubID, &authorID); err != nil {
			return nil, err
		}

		pubToAuthors[pubID] = append(pubToAuthors[pubID], authorID)
	}

	// Update each publication with its authors
	for pubID, authorIDs := range pubToAuthors {
		pub := publicationsMap[pubID]
		pub.Authors = authorIDs
		publicationsMap[pubID] = pub
	}

	// Convert map to slice in the original order
	publications := make([]models.Publication, 0, len(ids))
	for _, id := range ids {
		if pub, ok := publicationsMap[id]; ok {
			publications = append(publications, pub)
		}
	}

	return publications, nil
}
