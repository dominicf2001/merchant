package util

import "net/http"

const Dev = true

const ApiUrl = "http://127.0.0.1:3000"

func IsHTMX(r *http.Request) bool {
	return r.Header.Get("HX-Request") != ""
}
