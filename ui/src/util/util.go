package util

import "net/http"

const Dev = true

const ApiUrl = "http://192.168.4.43:3000"

func IsHTMX(r *http.Request) bool {
	return r.Header.Get("HX-Request") != ""
}
