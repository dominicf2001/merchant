package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dominicf2001/merchant-ui/src/util"
)

type StocksService struct{}

// stock interval
func IsStockInterval(s string) bool {
	intervals := []string{"minute", "hour", "day", "month"}
	for _, interval := range intervals {
		if interval == s {
			return true
		}
	}
	return false
}

// types
type StockEntry struct {
	Value int   `json:"value"`
	Time  int64 `json:"time"`
}

type Stock struct {
	Name    string       `json:"name"`
	History []StockEntry `json:"history"`
}

type Guild struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

type SimParams struct {
	GuildID    string `json:"guildID"`
	Start      string `json:"start"`
	End        string `json:"end"`
	ClearCache bool   `json:"clearCache"`
}

// methods
func NewStocksService() *StocksService {
	return &StocksService{}
}

func (s *StocksService) GetStocks(interval string, startDate string, endDate string) ([]Stock, error) {
	if !IsStockInterval(interval) {
		return nil, fmt.Errorf("Invalid range parameter: %s", interval)
	}

	res, err := http.Get(fmt.Sprintf("%s/stock/%s/%s/%s", util.ApiUrl, interval, endDate, startDate))
	if err != nil {
		return nil, fmt.Errorf("Error getting stocks: %w", err)
	}
	defer res.Body.Close()

	var stocks []Stock
	err = json.NewDecoder(res.Body).Decode(&stocks)
	if err != nil {
		return nil, fmt.Errorf("Error decoding stock response: %w", err)
	}

	return stocks, nil
}

func (s *StocksService) GetGuilds() ([]Guild, error) {
	res, err := http.Get(fmt.Sprintf("%s/guilds", util.ApiUrl))
	if err != nil {
		return nil, fmt.Errorf("Error getting guilds: %w", err)
	}
	defer res.Body.Close()

	var guilds []Guild
	err = json.NewDecoder(res.Body).Decode(&guilds)
	if err != nil {
		return nil, fmt.Errorf("Error decoding guild response: %w", err)
	}

	return guilds, nil
}

func (s *StocksService) RunSim(simData SimParams) error {
	jsonData, err := json.Marshal(&simData)
	if err != nil {
		return fmt.Errorf("Error marshaling simulation data: %w", err)
	}

	url := fmt.Sprintf("%s/sim", util.ApiUrl)
	res, err := http.Post(url, "application/json", bytes.NewReader(jsonData))
	if err != nil {
		return fmt.Errorf("Error running simulation: %w", err)
	}
	defer res.Body.Close()

	return nil
}

func (s *StocksService) GetLastSimParams() (*SimParams, error) {
	res, err := http.Get(fmt.Sprintf("%s/sim", util.ApiUrl))

	if res.StatusCode == http.StatusNoContent {
		var emptySimParams *SimParams = &SimParams{}
		return emptySimParams, nil
	}

	if err != nil {
		return nil, fmt.Errorf("Error getting last sim params: %w", err)
	}

	var simParams SimParams
	err = json.NewDecoder(res.Body).Decode(&simParams)
	if err != nil {
		return nil, fmt.Errorf("Error decoding sim params response: %w", err)
	}

	return &simParams, nil
}
