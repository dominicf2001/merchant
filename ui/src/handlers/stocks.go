package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dominicf2001/merchant-ui/src/components/pages"
	"github.com/dominicf2001/merchant-ui/src/components/shared"
	"github.com/dominicf2001/merchant-ui/src/services"
	"github.com/dominicf2001/merchant-ui/src/util"
	"github.com/go-chi/chi/v5"
)

func StocksRouter(stocksService *services.StocksService) http.Handler {
	r := chi.NewRouter()

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		lastSimParams, err := stocksService.GetLastSimParams()
		if err != nil {
			log.Fatal(err)
		}

		vm := &pages.StocksViewModel{
			SimParams: lastSimParams,
		}

		pages.Stocks(vm).Render(r.Context(), w)
	})

	r.Get("/stockGrid", func(w http.ResponseWriter, r *http.Request) {
		// TODO: turn into middleware
		if !util.IsHTMX(r) {
			http.NotFound(w, r)
			return
		}

		interval := r.URL.Query().Get("interval")
		startDate := r.URL.Query().Get("startDate")
		endDate := r.URL.Query().Get("endDate")

		if !services.IsStockInterval(interval) {
			interval = "hour"
		}

		if startDate == "" {
			startDate = time.Now().Format("2006-01-02")
		}

		if endDate == "" {
			endDate = time.Now().Format("2006-01-02")
		}

		stocks, err := stocksService.GetStocks(interval, startDate, endDate)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("STOCKS: %v\n", stocks)

		shared.StockGrid(stocks).Render(r.Context(), w)
	})

	r.Get("/guildOptions", func(w http.ResponseWriter, r *http.Request) {
		lastSimParams, err := stocksService.GetLastSimParams()
		if err != nil {
			log.Fatal(err)
		}

		// TODO: turn into middleware
		if !util.IsHTMX(r) {
			http.NotFound(w, r)
			return
		}

		guilds, err := stocksService.GetGuilds()
		if err != nil {
			log.Fatal(err)
		}

		shared.GuildOptions(guilds, lastSimParams.GuildID).Render(r.Context(), w)
	})

	r.Post("/simForm", func(w http.ResponseWriter, r *http.Request) {
		var simData services.SimParams
		json.NewDecoder(r.Body).Decode(&simData)
		err := stocksService.RunSim(simData)
		if err != nil {
			log.Fatal(err)
		}
	})

	return r
}
