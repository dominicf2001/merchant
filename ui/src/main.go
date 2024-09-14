package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/dominicf2001/merchant-ui/src/handlers"
	"github.com/dominicf2001/merchant-ui/src/services"
	"github.com/dominicf2001/merchant-ui/src/util"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func disableCacheInDevMode(next http.Handler) http.Handler {
	if !util.Dev {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

func main() {
	// services
	stocksService := services.NewStocksService()

	r := chi.NewRouter()

	// middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(middleware.Timeout(60 * time.Second))

	// routes
	r.Mount("/stocks", handlers.StocksRouter(stocksService))

	// file server
	fs := http.FileServer(http.Dir("src/assets"))
	r.Handle("/assets/*",
		disableCacheInDevMode(http.StripPrefix("/assets/", fs)))

	fmt.Println("Listening on 8080...")
	http.ListenAndServe(":8080", r)
}
