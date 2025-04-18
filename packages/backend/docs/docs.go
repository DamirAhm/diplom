package docs

import "github.com/swaggo/swag"

const docTemplate = `{
    "schemes": {{ marshal .Schemes }},
    "swagger": "2.0",
    "info": {
        "description": "{{escape .Description}}",
        "title": "{{.Title}}",
        "termsOfService": "http://swagger.io/terms/",
        "contact": {
            "name": "API Support",
            "url": "http://www.swagger.io/support",
            "email": "support@swagger.io"
        },
        "license": {
            "name": "Apache 2.0",
            "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
        },
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {
        "/partners": {
            "get": {
                "description": "Get a comprehensive list of universities, enterprises, joint projects, and joint publications",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "partners"
                ],
                "summary": "Get all partners data",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/handlers.AllPartnersResponse"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "post": {
                "description": "Create a new university or enterprise partner",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "partners"
                ],
                "summary": "Create a new partner",
                "parameters": [
                    {
                        "description": "Partner object",
                        "name": "partner",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Partner"
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Created",
                        "schema": {
                            "$ref": "#/definitions/models.Partner"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/partners/{id}": {
            "put": {
                "description": "Update an existing partner's information",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "partners"
                ],
                "summary": "Update a partner",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Partner ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "Partner object",
                        "name": "partner",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Partner"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Partner"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "Delete a partner by ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "partners"
                ],
                "summary": "Delete a partner",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Partner ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "204": {
                        "description": "No Content"
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/projects": {
            "get": {
                "description": "Get a list of all projects",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "projects"
                ],
                "summary": "Get all projects",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/models.Project"
                            }
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "post": {
                "description": "Create a new project",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "projects"
                ],
                "summary": "Create a new project",
                "parameters": [
                    {
                        "description": "Project object",
                        "name": "project",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Project"
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Created",
                        "schema": {
                            "$ref": "#/definitions/models.Project"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/projects/{id}": {
            "get": {
                "description": "Get a single project by its ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "projects"
                ],
                "summary": "Get a project by ID",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Project ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Project"
                        }
                    },
                    "400": {
                        "description": "Invalid project ID",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Project not found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "put": {
                "description": "Update an existing project's information",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "projects"
                ],
                "summary": "Update a project",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Project ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "Project object",
                        "name": "project",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Project"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Project"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "Delete a project by ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "projects"
                ],
                "summary": "Delete a project",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Project ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "204": {
                        "description": "No Content"
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/publications": {
            "get": {
                "description": "Get a list of all publications",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "publications"
                ],
                "summary": "Get all publications",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/models.Publication"
                            }
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "post": {
                "description": "Create a new publication",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "publications"
                ],
                "summary": "Create a new publication",
                "parameters": [
                    {
                        "description": "Publication object",
                        "name": "publication",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Publication"
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Created",
                        "schema": {
                            "$ref": "#/definitions/models.Publication"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/publications/{id}": {
            "get": {
                "description": "Get a single publication by its ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "publications"
                ],
                "summary": "Get a publication by ID",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Publication ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Publication"
                        }
                    },
                    "400": {
                        "description": "Invalid publication ID",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Publication not found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "put": {
                "description": "Update an existing publication's information",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "publications"
                ],
                "summary": "Update a publication",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Publication ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "Publication object",
                        "name": "publication",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Publication"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Publication"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "Delete a publication by ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "publications"
                ],
                "summary": "Delete a publication",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Publication ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "204": {
                        "description": "No Content"
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/publications/{id}/authors": {
            "get": {
                "description": "Get all researchers who are authors of a specific publication",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "publications"
                ],
                "summary": "Get authors of a publication",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Publication ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/models.Researcher"
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid publication ID",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Publication not found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/researchers": {
            "get": {
                "description": "Get a list of all researchers",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "researchers"
                ],
                "summary": "Get all researchers",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/models.Researcher"
                            }
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "post": {
                "description": "Create a new researcher",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "researchers"
                ],
                "summary": "Create a new researcher",
                "parameters": [
                    {
                        "description": "Researcher object",
                        "name": "researcher",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Researcher"
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Created",
                        "schema": {
                            "$ref": "#/definitions/models.Researcher"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/researchers/{id}": {
            "get": {
                "description": "Get a single researcher by their ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "researchers"
                ],
                "summary": "Get a researcher by ID",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Researcher ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Researcher"
                        }
                    },
                    "400": {
                        "description": "Invalid researcher ID",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Researcher not found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "put": {
                "description": "Update an existing researcher's information",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "researchers"
                ],
                "summary": "Update a researcher",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Researcher ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "Researcher object",
                        "name": "researcher",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.Researcher"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.Researcher"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "Delete a researcher by ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "researchers"
                ],
                "summary": "Delete a researcher",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Researcher ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "204": {
                        "description": "No Content"
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/scholar/scrape": {
            "post": {
                "description": "Fetches all publications from a Google Scholar researcher profile URL",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "scholar"
                ],
                "summary": "Scrape publications from Google Scholar",
                "parameters": [
                    {
                        "description": "Google Scholar URL with optional sort_by parameter ('pubdate', 'citations', or empty for default)",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.ScholarScraperRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/handlers.ScholarScraperResponse"
                        }
                    },
                    "400": {
                        "description": "Bad request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal server error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/training": {
            "get": {
                "description": "Get a list of all training materials",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "training"
                ],
                "summary": "Get all training materials",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/models.TrainingMaterial"
                            }
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "post": {
                "description": "Create a new training material",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "training"
                ],
                "summary": "Create a new training material",
                "parameters": [
                    {
                        "description": "Training Material object",
                        "name": "material",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.TrainingMaterial"
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Created",
                        "schema": {
                            "$ref": "#/definitions/models.TrainingMaterial"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/training/{id}": {
            "get": {
                "description": "Get a single training material by its ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "training"
                ],
                "summary": "Get a training material by ID",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Training Material ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.TrainingMaterial"
                        }
                    },
                    "400": {
                        "description": "Invalid training material ID",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Training material not found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "put": {
                "description": "Update an existing training material's information",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "training"
                ],
                "summary": "Update a training material",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Training Material ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "Training Material object",
                        "name": "material",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/models.TrainingMaterial"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "$ref": "#/definitions/models.TrainingMaterial"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "Delete a training material by ID",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "training"
                ],
                "summary": "Delete a training material",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "Training Material ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "204": {
                        "description": "No Content"
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "handlers.AllPartnersResponse": {
            "type": "object",
            "properties": {
                "enterprises": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.Partner"
                    }
                },
                "jointProjects": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.JointProject"
                    }
                },
                "jointPublications": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.JointPublication"
                    }
                },
                "universities": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.Partner"
                    }
                }
            }
        },
        "handlers.Publication": {
            "type": "object",
            "properties": {
                "abstract": {
                    "type": "string"
                },
                "authors": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "citations": {
                    "type": "integer"
                },
                "issue": {
                    "type": "string"
                },
                "journal": {
                    "type": "string"
                },
                "pages": {
                    "type": "string"
                },
                "publisher": {
                    "type": "string"
                },
                "title": {
                    "type": "string"
                },
                "url": {
                    "type": "string"
                },
                "volume": {
                    "type": "string"
                },
                "year": {
                    "type": "integer"
                }
            }
        },
        "handlers.ScholarScraperRequest": {
            "type": "object",
            "properties": {
                "sort_by": {
                    "description": "Optional: \"pubdate\", \"citations\", \"title\" or empty for default",
                    "type": "string"
                },
                "url": {
                    "type": "string"
                }
            }
        },
        "handlers.ScholarScraperResponse": {
            "type": "object",
            "properties": {
                "publications": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/handlers.Publication"
                    }
                },
                "sort_by": {
                    "type": "string"
                },
                "total_count": {
                    "type": "integer"
                }
            }
        },
        "models.JointProject": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer"
                },
                "partners": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "year": {
                    "type": "integer"
                }
            }
        },
        "models.JointPublication": {
            "type": "object",
            "properties": {
                "authors": {
                    "type": "string"
                },
                "id": {
                    "type": "integer"
                },
                "journal": {
                    "type": "string"
                },
                "link": {
                    "type": "string"
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "year": {
                    "type": "integer"
                }
            }
        },
        "models.LocalizedString": {
            "type": "object",
            "properties": {
                "en": {
                    "type": "string"
                },
                "ru": {
                    "type": "string"
                }
            }
        },
        "models.Partner": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer"
                },
                "logo": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "url": {
                    "type": "string"
                }
            }
        },
        "models.Project": {
            "type": "object",
            "properties": {
                "description": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "githubLink": {
                    "type": "string"
                },
                "id": {
                    "type": "integer"
                },
                "publications": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.ProjectPublication"
                    }
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "videos": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.ProjectVideo"
                    }
                }
            }
        },
        "models.ProjectPublication": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "integer"
                },
                "link": {
                    "type": "string"
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                }
            }
        },
        "models.ProjectVideo": {
            "type": "object",
            "properties": {
                "embedUrl": {
                    "type": "string"
                },
                "id": {
                    "type": "integer"
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                }
            }
        },
        "models.Publication": {
            "type": "object",
            "properties": {
                "authors": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    }
                },
                "id": {
                    "type": "integer"
                },
                "journal": {
                    "type": "string"
                },
                "link": {
                    "type": "string"
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "year": {
                    "type": "integer"
                }
            }
        },
        "models.Researcher": {
            "type": "object",
            "properties": {
                "bio": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "id": {
                    "type": "integer"
                },
                "lastName": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "name": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "photo": {
                    "type": "string"
                },
                "profiles": {
                    "$ref": "#/definitions/models.ResearcherProfiles"
                },
                "publications": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/models.Publication"
                    }
                }
            }
        },
        "models.ResearcherProfiles": {
            "type": "object",
            "properties": {
                "googleScholar": {
                    "type": "string"
                },
                "orcid": {
                    "type": "string"
                },
                "publons": {
                    "type": "string"
                },
                "researchgate": {
                    "type": "string"
                },
                "scopus": {
                    "type": "string"
                }
            }
        },
        "models.TrainingMaterial": {
            "type": "object",
            "properties": {
                "description": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "id": {
                    "type": "integer"
                },
                "image": {
                    "type": "string"
                },
                "title": {
                    "$ref": "#/definitions/models.LocalizedString"
                },
                "url": {
                    "type": "string"
                }
            }
        }
    }
}`

var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "localhost:8082",
	BasePath:         "/api",
	Schemes:          []string{},
	Title:            "Diplom Backend API",
	Description:      "This is the API server for the Diplom project",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
