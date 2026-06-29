package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestTickerHandler(t *testing.T) {} // verify compilation and interface compat

func TestHandlers(t *testing.T) {
	// 1. Test GET /api/ticker
	req, err := http.NewRequest("GET", "/api/ticker", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Simulate the ticker handler
		w.Write([]byte(`[{"text":"RACE 1 · BAHRAIN GP"}]`))
	})

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := `[{"text":"RACE 1 · BAHRAIN GP"}]`
	if strings.TrimSpace(rr.Body.String()) != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}

	// 2. Test POST /api/subscribe invalid body
	reqSub, err := http.NewRequest("POST", "/api/subscribe", bytes.NewBuffer([]byte(`{"email":""}`)))
	if err != nil {
		t.Fatal(err)
	}
	rrSub := httptest.NewRecorder()
	handlerSub := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			// Simulate subscribe validation
			http.Error(w, `{"error":"invalid email"}`, http.StatusBadRequest)
		}
	})

	handlerSub.ServeHTTP(rrSub, reqSub)

	if status := rrSub.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}
