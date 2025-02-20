package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteJointPublicationRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
}

func NewSQLiteJointPublicationRepo(db *sql.DB, lsRepo LocalizedStringRepo) *SQLiteJointPublicationRepo {
	return &SQLiteJointPublicationRepo{db: db, localizedStringRepo: lsRepo}
}

func (r *SQLiteJointPublicationRepo) Create(pub models.JointPublication) error {
	titleID, err := r.localizedStringRepo.Create(pub.Title)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(
		"INSERT INTO joint_publications (title_id, authors, journal, link, year) VALUES (?, ?, ?, ?, ?)",
		titleID, pub.Authors, pub.Journal, pub.Link, pub.Year,
	)
	return err
}

func (r *SQLiteJointPublicationRepo) GetByID(id int) (*models.JointPublication, error) {
	var pub models.JointPublication
	var titleID int64

	err := r.db.QueryRow(
		"SELECT id, title_id, authors, journal, link, year FROM joint_publications WHERE id = ?",
		id,
	).Scan(&pub.ID, &titleID, &pub.Authors, &pub.Journal, &pub.Link, &pub.Year)
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

func (r *SQLiteJointPublicationRepo) GetAll() ([]models.JointPublication, error) {
	publications := make([]models.JointPublication, 0)

	rows, err := r.db.Query("SELECT id, title_id, authors, journal, link, year FROM joint_publications")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var pub models.JointPublication
		var titleID int64
		if err := rows.Scan(&pub.ID, &titleID, &pub.Authors, &pub.Journal, &pub.Link, &pub.Year); err != nil {
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

func (r *SQLiteJointPublicationRepo) Update(pub models.JointPublication) error {
	var titleID int64
	err := r.db.QueryRow(
		"SELECT title_id FROM joint_publications WHERE id = ?",
		pub.ID,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(titleID, pub.Title); err != nil {
		return err
	}

	_, err = r.db.Exec(
		"UPDATE joint_publications SET authors = ?, journal = ?, link = ?, year = ? WHERE id = ?",
		pub.Authors, pub.Journal, pub.Link, pub.Year, pub.ID,
	)
	return err
}

func (r *SQLiteJointPublicationRepo) Delete(id int) error {
	var titleID int64
	err := r.db.QueryRow(
		"SELECT title_id FROM joint_publications WHERE id = ?",
		id,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(titleID); err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM joint_publications WHERE id = ?", id)
	return err
}
