package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/gorilla/mux"
)

type DisciplineHandler struct {
	disciplineRepo repository.DisciplineRepo
}

func NewDisciplineHandler(dr repository.DisciplineRepo) *DisciplineHandler {
	return &DisciplineHandler{disciplineRepo: dr}
}

// GetDisciplines godoc
// @Summary Get all disciplines
// @Description Get a list of all disciplines taught by researchers
// @Tags disciplines
// @Accept json
// @Produce json
// @Success 200 {array} models.Discipline
// @Failure 500 {object} string "Internal Server Error"
// @Router /disciplines [get]
func (h *DisciplineHandler) GetDisciplines(w http.ResponseWriter, r *http.Request) {
	disciplines, err := h.disciplineRepo.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(disciplines)
}

// GetDiscipline godoc
// @Summary Get a discipline by ID
// @Description Get a single discipline by its ID
// @Tags disciplines
// @Accept json
// @Produce json
// @Param id path int true "Discipline ID"
// @Success 200 {object} models.Discipline
// @Failure 400 {object} string "Invalid discipline ID"
// @Failure 404 {object} string "Discipline not found"
// @Failure 500 {object} string "Internal Server Error"
// @Router /disciplines/{id} [get]
func (h *DisciplineHandler) GetDiscipline(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid discipline ID", http.StatusBadRequest)
		return
	}

	discipline, err := h.disciplineRepo.GetByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if discipline == nil {
		http.Error(w, "Discipline not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(discipline)
}

// CreateDiscipline godoc
// @Summary Create a new discipline
// @Description Create a new discipline
// @Tags disciplines
// @Accept json
// @Produce json
// @Param discipline body models.Discipline true "Discipline object"
// @Success 201 {object} models.Discipline
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /disciplines [post]
func (h *DisciplineHandler) CreateDiscipline(w http.ResponseWriter, r *http.Request) {
	var discipline models.Discipline
	if err := json.NewDecoder(r.Body).Decode(&discipline); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.disciplineRepo.Create(discipline)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	discipline.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(discipline)
}

// UpdateDiscipline godoc
// @Summary Update a discipline
// @Description Update an existing discipline's information
// @Tags disciplines
// @Accept json
// @Produce json
// @Param id path int true "Discipline ID"
// @Param discipline body models.Discipline true "Discipline object"
// @Success 200 {object} models.Discipline
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /disciplines/{id} [put]
func (h *DisciplineHandler) UpdateDiscipline(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid discipline ID", http.StatusBadRequest)
		return
	}

	var discipline models.Discipline
	if err := json.NewDecoder(r.Body).Decode(&discipline); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	discipline.ID = id

	err = h.disciplineRepo.Update(discipline)
	if err != nil {
		if err.Error() == "discipline not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(discipline)
}

// DeleteDiscipline godoc
// @Summary Delete a discipline
// @Description Delete a discipline by ID
// @Tags disciplines
// @Accept json
// @Produce json
// @Param id path int true "Discipline ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /disciplines/{id} [delete]
func (h *DisciplineHandler) DeleteDiscipline(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid discipline ID", http.StatusBadRequest)
		return
	}

	err = h.disciplineRepo.Delete(id)
	if err != nil {
		if err.Error() == "discipline not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
