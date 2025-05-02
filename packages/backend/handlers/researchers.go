package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/damirahm/diplom/backend/cron"
	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/gorilla/mux"
)

type ResearcherHandler struct {
	researcherRepo     repository.ResearcherRepo
	publicationCrawler *cron.PublicationCrawler
}

func NewResearcherHandler(rr repository.ResearcherRepo, pc *cron.PublicationCrawler) *ResearcherHandler {
	return &ResearcherHandler{
		researcherRepo:     rr,
		publicationCrawler: pc,
	}
}

// GetResearchers godoc
// @Summary Get all researchers
// @Description Get a list of all researchers
// @Tags researchers
// @Accept json
// @Produce json
// @Success 200 {array} models.Researcher
// @Failure 500 {object} string "Internal Server Error"
// @Router /researchers [get]
func (h *ResearcherHandler) GetResearchers(w http.ResponseWriter, r *http.Request) {
	researchers, err := h.researcherRepo.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(researchers)
}

// GetResearcher godoc
// @Summary Get a researcher by ID
// @Description Get a single researcher by their ID
// @Tags researchers
// @Accept json
// @Produce json
// @Param id path int true "Researcher ID"
// @Success 200 {object} models.Researcher
// @Failure 400 {object} string "Invalid researcher ID"
// @Failure 404 {object} string "Researcher not found"
// @Failure 500 {object} string "Internal Server Error"
// @Router /researchers/{id} [get]
func (h *ResearcherHandler) GetResearcher(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid researcher ID", http.StatusBadRequest)
		return
	}

	researcher, err := h.researcherRepo.GetByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if researcher == nil {
		http.Error(w, "Researcher not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(researcher)
}

// CreateResearcher godoc
// @Summary Create a new researcher
// @Description Create a new researcher
// @Tags researchers
// @Accept json
// @Produce json
// @Param researcher body models.Researcher true "Researcher object"
// @Success 201 {object} models.Researcher
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /researchers [post]
func (h *ResearcherHandler) CreateResearcher(w http.ResponseWriter, r *http.Request) {
	var researcher models.Researcher
	if err := json.NewDecoder(r.Body).Decode(&researcher); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.researcherRepo.Create(researcher)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	researcher.ID = int(id)

	if researcher.Profiles.GoogleScholar != nil && *researcher.Profiles.GoogleScholar != "" {
		go h.publicationCrawler.CrawlResearcher(researcher)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(researcher)
}

// UpdateResearcher godoc
// @Summary Update a researcher
// @Description Update an existing researcher's information
// @Tags researchers
// @Accept json
// @Produce json
// @Param id path int true "Researcher ID"
// @Param researcher body models.Researcher true "Researcher object"
// @Success 200 {object} models.Researcher
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /researchers/{id} [put]
func (h *ResearcherHandler) UpdateResearcher(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid researcher ID", http.StatusBadRequest)
		return
	}

	var researcher models.Researcher
	if err := json.NewDecoder(r.Body).Decode(&researcher); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	researcher.ID = id

	err = h.researcherRepo.Update(researcher)
	if err != nil {
		if err.Error() == "researcher not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if researcher.Profiles.GoogleScholar != nil && *researcher.Profiles.GoogleScholar != "" {
		go h.publicationCrawler.CrawlResearcher(researcher)
	}

	json.NewEncoder(w).Encode(researcher)
}

// DeleteResearcher godoc
// @Summary Delete a researcher
// @Description Delete a researcher by ID
// @Tags researchers
// @Accept json
// @Produce json
// @Param id path int true "Researcher ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /researchers/{id} [delete]
func (h *ResearcherHandler) DeleteResearcher(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid researcher ID", http.StatusBadRequest)
		return
	}

	err = h.researcherRepo.Delete(id)
	if err != nil {
		if err.Error() == "researcher not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
