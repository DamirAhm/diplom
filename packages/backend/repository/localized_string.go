package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteLocalizedStringRepo struct {
	db *sql.DB
}

func NewSQLiteLocalizedStringRepo(db *sql.DB) *SQLiteLocalizedStringRepo {
	return &SQLiteLocalizedStringRepo{db: db}
}

func (r *SQLiteLocalizedStringRepo) Create(ls models.LocalizedString) (int64, error) {
	result, err := r.db.Exec(
		"INSERT INTO localized_strings (en, ru) VALUES (?, ?)",
		ls.En, ls.Ru,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *SQLiteLocalizedStringRepo) CreateTx(tx *sql.Tx, ls models.LocalizedString) (int64, error) {
	result, err := tx.Exec(
		"INSERT INTO localized_strings (en, ru) VALUES (?, ?)",
		ls.En, ls.Ru,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *SQLiteLocalizedStringRepo) Get(id int64) (*models.LocalizedString, error) {
	var ls models.LocalizedString
	err := r.db.QueryRow(
		"SELECT en, ru FROM localized_strings WHERE id = ?",
		id,
	).Scan(&ls.En, &ls.Ru)
	if err != nil {
		return nil, err
	}
	return &ls, nil
}

func (r *SQLiteLocalizedStringRepo) Update(id int64, ls models.LocalizedString) error {
	_, err := r.db.Exec(
		"UPDATE localized_strings SET en = ?, ru = ? WHERE id = ?",
		ls.En, ls.Ru, id,
	)
	return err
}

func (r *SQLiteLocalizedStringRepo) UpdateTx(tx *sql.Tx, id int64, ls models.LocalizedString) error {
	_, err := tx.Exec(
		"UPDATE localized_strings SET en = ?, ru = ? WHERE id = ?",
		ls.En, ls.Ru, id,
	)
	return err
}

func (r *SQLiteLocalizedStringRepo) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM localized_strings WHERE id = ?", id)
	return err
}

func (r *SQLiteLocalizedStringRepo) DeleteTx(tx *sql.Tx, id int64) error {
	_, err := tx.Exec("DELETE FROM localized_strings WHERE id = ?", id)
	return err
}
