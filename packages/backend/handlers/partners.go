package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/gorilla/mux"
)

type PartnerHandler struct {
	partnerRepo          repository.PartnerRepo
	jointPublicationRepo repository.JointPublicationRepo
	jointProjectRepo     repository.JointProjectRepo
}

func NewPartnerHandler(pr repository.PartnerRepo, jpr repository.JointPublicationRepo, jpjr repository.JointProjectRepo) *PartnerHandler {
	return &PartnerHandler{
		partnerRepo:          pr,
		jointPublicationRepo: jpr,
		jointProjectRepo:     jpjr,
	}
}

// AllPartnersResponse represents the response structure for the GetAllPartners endpoint
type AllPartnersResponse struct {
	Universities      []models.Partner          `json:"universities"`
	Enterprises       []models.Partner          `json:"enterprises"`
	JointProjects     []models.JointProject     `json:"jointProjects"`
	JointPublications []models.JointPublication `json:"jointPublications"`
}

func NewAllPartnersResponse() AllPartnersResponse {
	return AllPartnersResponse{
		Universities:      make([]models.Partner, 0),
		Enterprises:       make([]models.Partner, 0),
		JointProjects:     make([]models.JointProject, 0),
		JointPublications: make([]models.JointPublication, 0),
	}
}

// GetAllPartners godoc
// @Summary Get all partners data
// @Description Get a comprehensive list of universities, enterprises, joint projects, and joint publications
// @Tags partners
// @Accept json
// @Produce json
// @Success 200 {object} AllPartnersResponse
// @Failure 500 {object} string "Internal Server Error"
// @Router /partners [get]
func (h *PartnerHandler) GetAllPartners(w http.ResponseWriter, r *http.Request) {
	response := NewAllPartnersResponse()

	universities, err := h.partnerRepo.GetAll("university")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	response.Universities = universities

	enterprises, err := h.partnerRepo.GetAll("enterprise")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	response.Enterprises = enterprises

	jointProjects, err := h.jointProjectRepo.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	response.JointProjects = jointProjects

	jointPublications, err := h.jointPublicationRepo.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	response.JointPublications = jointPublications

	json.NewEncoder(w).Encode(response)
}

// CreatePartner godoc
// @Summary Create a new partner
// @Description Create a new university or enterprise partner
// @Tags partners
// @Accept json
// @Produce json
// @Param partner body models.Partner true "Partner object"
// @Success 201 {object} models.Partner
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /partners [post]
func (h *PartnerHandler) CreatePartner(w http.ResponseWriter, r *http.Request) {
	var partner models.Partner
	if err := json.NewDecoder(r.Body).Decode(&partner); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Pass partner type based on request URL or body
	err := h.partnerRepo.Create(partner, "university") // TODO: Get type from request
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(partner)
}

// UpdatePartner godoc
// @Summary Update a partner
// @Description Update an existing partner's information
// @Tags partners
// @Accept json
// @Produce json
// @Param id path int true "Partner ID"
// @Param partner body models.Partner true "Partner object"
// @Success 200 {object} models.Partner
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /partners/{id} [put]
func (h *PartnerHandler) UpdatePartner(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var partner models.Partner
	if err := json.NewDecoder(r.Body).Decode(&partner); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Convert id string to int for ID field
	idInt := 0
	_, err := fmt.Sscanf(id, "%d", &idInt)
	if err != nil {
		http.Error(w, "invalid id format", http.StatusBadRequest)
		return
	}
	partner.ID = idInt

	err = h.partnerRepo.Update(partner)
	if err != nil {
		if err.Error() == "partner not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(partner)
}

// DeletePartner godoc
// @Summary Delete a partner
// @Description Delete a partner by ID
// @Tags partners
// @Accept json
// @Produce json
// @Param id path int true "Partner ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /partners/{id} [delete]
func (h *PartnerHandler) DeletePartner(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	// Convert id string to int
	idInt := 0
	_, err := fmt.Sscanf(id, "%d", &idInt)
	if err != nil {
		http.Error(w, "invalid id format", http.StatusBadRequest)
		return
	}

	err = h.partnerRepo.Delete(idInt)
	if err != nil {
		if err.Error() == "partner not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
