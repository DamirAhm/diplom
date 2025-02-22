module github.com/damirahm/diplom/backend/cmd/seed

go 1.22.0

require github.com/damirahm/diplom/backend v0.0.0

require (
	github.com/joho/godotenv v1.5.1 // indirect
	github.com/mattn/go-sqlite3 v1.14.24 // indirect
)

replace github.com/damirahm/diplom/backend => ../..
