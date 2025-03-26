package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/gorilla/mux"
)

type PublicationHandler struct {
	publicationRepo repository.PublicationRepo
}

func NewPublicationHandler(pr repository.PublicationRepo) *PublicationHandler {
	return &PublicationHandler{publicationRepo: pr}
}

// PublicationWithAuthors represents a publication with its authors
type PublicationWithAuthors struct {
	models.Publication
	Authors []models.Researcher `json:"authors"`
}

// GetPublications godoc
// @Summary Get all publications
// @Description Get a list of all publications
// @Tags publications
// @Accept json
// @Produce json
// @Success 200 {array} models.Publication
// @Failure 500 {object} string "Internal Server Error"
// @Router /publications [get]
func (h *PublicationHandler) GetPublications(w http.ResponseWriter, r *http.Request) {
	publications, err := h.publicationRepo.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(publications)
}

// GetPublication godoc
// @Summary Get a publication by ID
// @Description Get a single publication by its ID
// @Tags publications
// @Accept json
// @Produce json
// @Param id path int true "Publication ID"
// @Success 200 {object} models.Publication
// @Failure 400 {object} string "Invalid publication ID"
// @Failure 404 {object} string "Publication not found"
// @Failure 500 {object} string "Internal Server Error"
// @Router /publications/{id} [get]
func (h *PublicationHandler) GetPublication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid publication ID", http.StatusBadRequest)
		return
	}

	publication, err := h.publicationRepo.GetByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if publication == nil {
		http.Error(w, "Publication not found", http.StatusNotFound)
		return
	}

	authors, err := h.publicationRepo.GetAuthors(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := PublicationWithAuthors{
		Publication: *publication,
		Authors:     authors,
	}

	json.NewEncoder(w).Encode(response)
}

// CreatePublication godoc
// @Summary Create a new publication
// @Description Create a new publication
// @Tags publications
// @Accept json
// @Produce json
// @Param publication body models.Publication true "Publication object"
// @Success 201 {object} models.Publication
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /publications [post]
func (h *PublicationHandler) CreatePublication(w http.ResponseWriter, r *http.Request) {
	var publication models.Publication
	if err := json.NewDecoder(r.Body).Decode(&publication); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.publicationRepo.Create(publication)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	publication.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(publication)
}

// UpdatePublication godoc
// @Summary Update a publication
// @Description Update an existing publication's information
// @Tags publications
// @Accept json
// @Produce json
// @Param id path int true "Publication ID"
// @Param publication body models.Publication true "Publication object"
// @Success 200 {object} models.Publication
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /publications/{id} [put]
func (h *PublicationHandler) UpdatePublication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid publication ID", http.StatusBadRequest)
		return
	}

	var publication models.Publication
	if err := json.NewDecoder(r.Body).Decode(&publication); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	publication.ID = id

	err = h.publicationRepo.Update(publication)
	if err != nil {
		if err.Error() == "publication not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(publication)
}

// DeletePublication godoc
// @Summary Delete a publication
// @Description Delete a publication by ID
// @Tags publications
// @Accept json
// @Produce json
// @Param id path int true "Publication ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /publications/{id} [delete]
func (h *PublicationHandler) DeletePublication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid publication ID", http.StatusBadRequest)
		return
	}

	err = h.publicationRepo.Delete(id)
	if err != nil {
		if err.Error() == "publication not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetPublicationAuthors godoc
// @Summary Get authors of a publication
// @Description Get all researchers who are authors of a specific publication
// @Tags publications
// @Accept json
// @Produce json
// @Param id path int true "Publication ID"
// @Success 200 {array} models.Researcher
// @Failure 400 {object} string "Invalid publication ID"
// @Failure 404 {object} string "Publication not found"
// @Failure 500 {object} string "Internal Server Error"
// @Router /publications/{id}/authors [get]
func (h *PublicationHandler) GetPublicationAuthors(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid publication ID", http.StatusBadRequest)
		return
	}

	authors, err := h.publicationRepo.GetAuthors(id)
	if err != nil {
		if err.Error() == fmt.Sprintf("publication with ID %d not found", id) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(authors)
}
