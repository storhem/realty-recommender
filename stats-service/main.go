package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

type Stats struct {
	Properties int `json:"properties"`
	Users      int `json:"users"`
	Views      int `json:"views"`
	Ratings    int `json:"ratings"`
	Favorites  int `json:"favorites"`
}

var db *sql.DB

func statsHandler(w http.ResponseWriter, r *http.Request) {
	var s Stats
	queries := []struct {
		dest  *int
		query string
	}{
		{&s.Properties, "SELECT COUNT(*) FROM properties"},
		{&s.Users, "SELECT COUNT(*) FROM users"},
		{&s.Views, "SELECT COUNT(*) FROM views"},
		{&s.Ratings, "SELECT COUNT(*) FROM ratings"},
		{&s.Favorites, "SELECT COUNT(*) FROM favorites"},
	}
	for _, q := range queries {
		if err := db.QueryRow(q.query).Scan(q.dest); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(s)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@db:5432/realty?sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("DB open error:", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("DB ping error:", err)
	}

	log.Println("Stats service listening on :8080")
	http.HandleFunc("/stats", statsHandler)
	http.HandleFunc("/health", healthHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
