package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLitePublicationRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
}

func NewSQLitePublicationRepo(db *sql.DB, lsRepo LocalizedStringRepo) *SQLitePublicationRepo {
	return &SQLitePublicationRepo{db: db, localizedStringRepo: lsRepo}
}

func (r *SQLitePublicationRepo) Create(pub models.Publication) error {
	titleID, err := r.localizedStringRepo.Create(pub.Title)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(
		"INSERT INTO publications (title_id, link, authors, journal, year) VALUES (?, ?, ?, ?, ?)",
		titleID, pub.Link, pub.Authors, pub.Journal, pub.Year,
	)
	return err
}

func (r *SQLitePublicationRepo) GetByID(id int) (*models.Publication, error) {
	var pub models.Publication
	var titleID int64

	err := r.db.QueryRow(
		"SELECT id, title_id, link FROM publications WHERE id = ?",
		id,
	).Scan(&pub.ID, &titleID, &pub.Link)
	if err != nil {
		return nil, err
	}

	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	pub.Title = *title

	return &pub, nil
}

func (r *SQLitePublicationRepo) GetAll() ([]models.Publication, error) {
	rows, err := r.db.Query("SELECT id, title_id, link FROM publications")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	publications := []models.Publication{}
	for rows.Next() {
		var pub models.Publication
		var titleID int64
		if err := rows.Scan(&pub.ID, &titleID, &pub.Link); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		pub.Title = *title

		publications = append(publications, pub)
	}
	return publications, nil
}

func (r *SQLitePublicationRepo) Update(pub models.Publication) error {
	var titleID int64
	err := r.db.QueryRow(
		"SELECT title_id FROM publications WHERE id = ?",
		pub.ID,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(titleID, pub.Title); err != nil {
		return err
	}

	_, err = r.db.Exec(
		"UPDATE publications SET link = ? WHERE id = ?",
		pub.Link, pub.ID,
	)
	return err
}

func (r *SQLitePublicationRepo) Delete(id int) error {
	var titleID int64
	err := r.db.QueryRow(
		"SELECT title_id FROM publications WHERE id = ?",
		id,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(titleID); err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM publications WHERE id = ?", id)
	return err
}
