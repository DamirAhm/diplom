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

	// Add authors that have IDs to publication_authors
	for _, author := range pub.Authors {
		if author.ID != nil {
			_, err = tx.Exec(
				"INSERT INTO publication_authors (publication_id, researcher_id) VALUES (?, ?)",
				id, *author.ID,
			)
			if err != nil {
				return 0, err
			}
		} else {
			// Add external authors to publication_external_authors
			result, err := tx.Exec(
				"INSERT INTO localized_strings (en, ru) VALUES (?, ?)",
				author.Name.En, author.Name.Ru,
			)
			if err != nil {
				return 0, err
			}

			nameID, err := result.LastInsertId()
			if err != nil {
				return 0, err
			}

			_, err = tx.Exec(
				"INSERT INTO publication_external_authors (publication_id, name_id) VALUES (?, ?)",
				id, nameID,
			)
			if err != nil {
				return 0, err
			}
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
		"SELECT id, title_id, link, journal, published_at, citations_count, visible FROM publications WHERE id = ?",
		id,
	).Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount, &pub.Visible)
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
		`SELECT r.id, r.name_id, r.last_name_id FROM publication_authors as pa 
		JOIN researchers as r ON pa.researcher_id = r.id
		WHERE pa.publication_id = ?`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := []models.Author{}

	for rows.Next() {
		var authorID int
		var nameID int64
		var lastNameID int64
		if err := rows.Scan(&authorID, &nameID, &lastNameID); err != nil {
			return nil, err
		}
		name, err := r.localizedStringRepo.Get(nameID)
		if err != nil {
			return nil, err
		}
		lastName, err := r.localizedStringRepo.Get(lastNameID)
		if err != nil {
			return nil, err
		}
		authors = append(authors, models.Author{
			Name: models.LocalizedString{
				En: name.En + " " + lastName.En,
				Ru: name.Ru + " " + lastName.Ru,
			},
			ID: &authorID,
		})
	}

	externalRows, err := r.db.Query(
		`SELECT ls.en, ls.ru 
		FROM publication_external_authors pea
		JOIN localized_strings ls ON pea.name_id = ls.id
		WHERE pea.publication_id = ?`,
		pub.ID,
	)
	if err != nil {
		return nil, err
	}
	defer externalRows.Close()

	for externalRows.Next() {
		var nameEn, nameRu string
		if err := externalRows.Scan(&nameEn, &nameRu); err != nil {
			return nil, err
		}
		authors = append(authors, models.Author{
			Name: models.LocalizedString{
				En: nameEn,
				Ru: nameRu,
			},
		})
	}

	pub.Authors = authors

	return &pub, nil
}

func (r *SQLitePublicationRepo) GetAll() ([]models.Publication, error) {
	rows, err := r.db.Query("SELECT id, title_id, link, journal, published_at, citations_count, visible FROM publications")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	publications := []models.Publication{}
	for rows.Next() {
		var pub models.Publication
		var titleID int64
		if err := rows.Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount, &pub.Visible); err != nil {
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

		var authorIDs []int
		for authorRows.Next() {
			var authorID int
			if err := authorRows.Scan(&authorID); err != nil {
				authorRows.Close()
				return nil, err
			}
			authorIDs = append(authorIDs, authorID)
		}
		authorRows.Close()

		// Convert author IDs to Author objects without fetching their publications
		authors := []models.Author{}
		if len(authorIDs) > 0 {
			// Query only the necessary fields from researchers table
			researcherQuery := `
				SELECT r.id, fn.en, ln.en, fn.ru, ln.ru
				FROM researchers r
				JOIN localized_strings fn ON r.name_id = fn.id
				JOIN localized_strings ln ON r.last_name_id = ln.id
				WHERE r.id IN (`

			placeholders := make([]string, len(authorIDs))
			args := make([]interface{}, len(authorIDs))
			for i, id := range authorIDs {
				placeholders[i] = "?"
				args[i] = id
			}
			researcherQuery += Join(placeholders, ",") + ")"

			researcherRows, err := r.db.Query(researcherQuery, args...)
			if err != nil {
				return nil, err
			}

			for researcherRows.Next() {
				var id int
				var nameEn, lastNameEn, nameRu, lastNameRu string
				if err := researcherRows.Scan(&id, &nameEn, &lastNameEn, &nameRu, &lastNameRu); err != nil {
					researcherRows.Close()
					return nil, err
				}
				authors = append(authors, models.Author{
					Name: models.LocalizedString{
						En: nameEn + " " + lastNameEn,
						Ru: nameRu + " " + lastNameRu,
					},
					ID: &id,
				})
			}
			researcherRows.Close()
		}

		// Get external authors
		externalRows, err := r.db.Query(
			`SELECT ls.en, ls.ru 
			FROM publication_external_authors pea
			JOIN localized_strings ls ON pea.name_id = ls.id
			WHERE pea.publication_id = ?`,
			pub.ID,
		)
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
		"UPDATE publications SET title_id = ?, link = ?, journal = ?, published_at = ?, citations_count = ?, visible = ? WHERE id = ?",
		titleID, pub.Link, pub.Journal, pub.PublishedAt, pub.CitationsCount, pub.Visible, pub.ID,
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

	// Get existing external author name IDs
	rows, err := tx.Query(
		"SELECT name_id FROM publication_external_authors WHERE publication_id = ?",
		pub.ID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	var nameIDs []int64
	for rows.Next() {
		var nameID int64
		if err := rows.Scan(&nameID); err != nil {
			return err
		}
		nameIDs = append(nameIDs, nameID)
	}

	// Delete external authors
	_, err = tx.Exec(
		"DELETE FROM publication_external_authors WHERE publication_id = ?",
		pub.ID,
	)
	if err != nil {
		return err
	}

	// Delete the localized strings for external authors
	for _, nameID := range nameIDs {
		_, err = tx.Exec("DELETE FROM localized_strings WHERE id = ?", nameID)
		if err != nil {
			return err
		}
	}

	// Add authors that have IDs to publication_authors
	for _, author := range pub.Authors {
		if author.ID != nil {
			_, err = tx.Exec(
				"INSERT INTO publication_authors (publication_id, researcher_id) VALUES (?, ?)",
				pub.ID, *author.ID,
			)
			if err != nil {
				return err
			}
		} else {
			// Add external authors to publication_external_authors
			result, err := tx.Exec(
				"INSERT INTO localized_strings (en, ru) VALUES (?, ?)",
				author.Name.En, author.Name.Ru,
			)
			if err != nil {
				return err
			}

			nameID, err := result.LastInsertId()
			if err != nil {
				return err
			}

			_, err = tx.Exec(
				"INSERT INTO publication_external_authors (publication_id, name_id) VALUES (?, ?)",
				pub.ID, nameID,
			)
			if err != nil {
				return err
			}
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

	// Get external author name IDs
	rows, err := tx.Query(
		"SELECT name_id FROM publication_external_authors WHERE publication_id = ?",
		id,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	var nameIDs []int64
	for rows.Next() {
		var nameID int64
		if err := rows.Scan(&nameID); err != nil {
			return err
		}
		nameIDs = append(nameIDs, nameID)
	}

	// Delete the localized string directly in this transaction
	_, err = tx.Exec("DELETE FROM localized_strings WHERE id = ?", titleID)
	if err != nil {
		return err
	}

	// Delete external author localized strings
	for _, nameID := range nameIDs {
		_, err = tx.Exec("DELETE FROM localized_strings WHERE id = ?", nameID)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(
		"DELETE FROM publication_authors WHERE publication_id = ?",
		id,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		"DELETE FROM publication_external_authors WHERE publication_id = ?",
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

	if len(authorIDs) == 0 {
		return []models.Researcher{}, nil
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

	query := `SELECT id, title_id, link, journal, published_at, citations_count, visible 
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
		if err := rows.Scan(&pub.ID, &titleID, &pub.Link, &pub.Journal, &pub.PublishedAt, &pub.CitationsCount, &pub.Visible); err != nil {
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

	// Fetch researcher data for all author IDs
	allAuthorIDs := []int{}
	for _, authorIDs := range pubToAuthors {
		allAuthorIDs = append(allAuthorIDs, authorIDs...)
	}

	// Create a map of researcher ID to Researcher for quick lookup
	researcherMap := make(map[int]*models.Researcher)
	if len(allAuthorIDs) > 0 {
		researchers, err := r.researcherRepo.GetByIDs(allAuthorIDs)
		if err != nil {
			return nil, err
		}

		for i, researcher := range researchers {
			researcherMap[researcher.ID] = &researchers[i]
		}
	}

	// Update each publication with its authors
	for pubID, authorIDs := range pubToAuthors {
		pub := publicationsMap[pubID]
		authors := []models.Author{}

		for _, authorID := range authorIDs {
			if researcher, ok := researcherMap[authorID]; ok {
				id := researcher.ID
				authors = append(authors, models.Author{
					Name: models.LocalizedString{
						En: researcher.Name.En + " " + researcher.LastName.En,
						Ru: researcher.Name.Ru + " " + researcher.LastName.Ru,
					},
					ID: &id,
				})
			}
		}

		pub.Authors = authors
		publicationsMap[pubID] = pub
	}

	// Fetch external authors for all publications
	externalAuthorQuery := `SELECT publication_id, name_id 
	                       FROM publication_external_authors 
	                       WHERE publication_id IN (`

	externalAuthorQuery += Join(authorPlaceholders, ",") + ")"

	externalAuthorRows, err := r.db.Query(externalAuthorQuery, authorArgs...)
	if err != nil {
		return nil, err
	}
	defer externalAuthorRows.Close()

	// Add external authors to publications
	for externalAuthorRows.Next() {
		var pubID int
		var nameID int64
		if err := externalAuthorRows.Scan(&pubID, &nameID); err != nil {
			return nil, err
		}

		if pub, ok := publicationsMap[pubID]; ok {
			pub.Authors = append(pub.Authors, models.Author{
				Name: models.LocalizedString{
					En: "",
					Ru: "",
				},
			})
			publicationsMap[pubID] = pub
		}
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

func (r *SQLitePublicationRepo) GetByTitle(title string) (int, error) {
	// Query to find publications with matching title
	query := `
		SELECT p.id
		FROM publications p
		JOIN localized_strings ls ON p.title_id = ls.id
		WHERE ls.en = ? OR ls.ru = ?
	`

	var pubID int
	err := r.db.QueryRow(query, title, title).Scan(&pubID)
	if err != nil {
		if err == sql.ErrNoRows {
			return -1, nil // No publication found with this title
		}
		return -1, err
	}

	return pubID, nil
}
