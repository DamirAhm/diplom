package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLitePartnerRepo struct {
	db *sql.DB
}

func NewSQLitePartnerRepo(db *sql.DB) *SQLitePartnerRepo {
	return &SQLitePartnerRepo{db: db}
}

func (r *SQLitePartnerRepo) Create(partner models.Partner, partnerType string) error {
	_, err := r.db.Exec(
		"INSERT INTO partners (name, logo, url, type) VALUES (?, ?, ?, ?)",
		partner.Name, partner.Logo, partner.URL, partnerType,
	)
	return err
}

func (r *SQLitePartnerRepo) GetByID(id int) (*models.Partner, error) {
	var partner models.Partner
	err := r.db.QueryRow(
		"SELECT id, name, logo, url FROM partners WHERE id = ?",
		id,
	).Scan(&partner.ID, &partner.Name, &partner.Logo, &partner.URL)
	if err != nil {
		return nil, err
	}
	return &partner, nil
}

func (r *SQLitePartnerRepo) GetAll(partnerType string) ([]models.Partner, error) {
	partners := make([]models.Partner, 0)
	
	rows, err := r.db.Query(
		"SELECT id, name, logo, url FROM partners WHERE type = ?",
		partnerType,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var partner models.Partner
		if err := rows.Scan(&partner.ID, &partner.Name, &partner.Logo, &partner.URL); err != nil {
			return nil, err
		}
		partners = append(partners, partner)
	}
	return partners, nil
}

func (r *SQLitePartnerRepo) Update(partner models.Partner) error {
	_, err := r.db.Exec(
		"UPDATE partners SET name = ?, logo = ?, url = ? WHERE id = ?",
		partner.Name, partner.Logo, partner.URL, partner.ID,
	)
	return err
}

func (r *SQLitePartnerRepo) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM partners WHERE id = ?", id)
	return err
}
