package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Data models matches the front-end components
type TickerItem struct {
	Text string `json:"text"`
}

type RaceInfo struct {
	Round        string `json:"round"`
	RoundLong    string `json:"roundLong"`
	Name         string `json:"name"`
	Location     string `json:"location"`
	Date         string `json:"date"`
	Laps         int    `json:"laps"`
	Distance     string `json:"distance"`
	LapRecord    string `json:"lapRecord"`
	RecordHolder string `json:"recordHolder"`
	RecordYear   string `json:"recordYear"`
}

type Driver struct {
	Position int    `json:"position"`
	Number   int    `json:"number"`
	Name     string `json:"name"`
	Team     string `json:"team"`
	Points   int    `json:"points"`
	Wins     int    `json:"wins"`
	Poles    int    `json:"poles"`
	Pct      int    `json:"pct"`
}

type CalendarEvent struct {
	Round   string `json:"round"`
	Name    string `json:"name"`
	Circuit string `json:"circuit"`
	Date    string `json:"date"`
	Status  string `json:"status"`
	Laps    int    `json:"laps"`
}

type TechItem struct {
	Category    string `json:"category"`
	Title       string `json:"title"`
	Description string `json:"description"`
	MetricLabel string `json:"metricLabel"`
	MetricValue string `json:"metricValue"`
	Icon        string `json:"icon"`
}

type Team struct {
	Name   string `json:"name"`
	Points int    `json:"points"`
	Color  string `json:"color"`
}

type Spec struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type CircuitInfo struct {
	Name  string `json:"name"`
	Desc  string `json:"desc"`
	Specs []Spec `json:"specs"`
}

type NewsItem struct {
	Tag     string `json:"tag"`
	Title   string `json:"title"`
	Excerpt string `json:"excerpt"`
	Date    string `json:"date"`
	Image   string `json:"image"`
}

// In-memory mock database
var tickerItems = []TickerItem{
	{Text: "RACE 1 · BAHRAIN GP · VERSTAPPEN LEADS LAP 42"},
	{Text: "FASTEST LAP · LECLERC · 1:31.447"},
	{Text: "SAFETY CAR DEPLOYED · LAP 38"},
	{Text: "HAMILTON PIT STOP · ULTRA SOFT COMPOUND"},
	{Text: "DRS ZONE 3 ACTIVE"},
	{Text: "NORRIS +4.2s BEHIND LEADER"},
}

var featuredRace = RaceInfo{
	Round:        "Round 8",
	RoundLong:    "Round 08 of 24",
	Name:         "Monaco Grand Prix",
	Location:     "Circuit de Monaco, Monte Carlo",
	Date:         "25 May 2026",
	Laps:         78,
	Distance:     "260.3 km",
	LapRecord:    "1:12.909",
	RecordHolder: "M. SCHUMACHER",
	RecordYear:   "2004",
}

var drivers = []Driver{
	{Position: 1, Number: 1, Name: "Max Verstappen", Team: "Oracle Red Bull Racing", Points: 167, Wins: 5, Poles: 4, Pct: 100},
	{Position: 2, Number: 16, Name: "Charles Leclerc", Team: "Scuderia Ferrari", Points: 139, Wins: 3, Poles: 5, Pct: 83},
	{Position: 3, Number: 4, Name: "Lando Norris", Team: "McLaren F1 Team", Points: 124, Wins: 2, Poles: 2, Pct: 74},
}

var calendar = []CalendarEvent{
	{Round: "01", Name: "Bahrain Grand Prix", Circuit: "Bahrain International Circuit, Sakhir", Date: "02 Mar 2026", Status: "Completed", Laps: 57},
	{Round: "02", Name: "Saudi Arabian Grand Prix", Circuit: "Jeddah Corniche Circuit, Jeddah", Date: "09 Mar 2026", Status: "Completed", Laps: 50},
	{Round: "03", Name: "Australian Grand Prix", Circuit: "Albert Park Circuit, Melbourne", Date: "23 Mar 2026", Status: "Live Now", Laps: 58},
	{Round: "04", Name: "Japanese Grand Prix", Circuit: "Suzuka International Racing Course", Date: "06 Apr 2026", Status: "Upcoming", Laps: 53},
	{Round: "05", Name: "Chinese Grand Prix", Circuit: "Shanghai International Circuit", Date: "20 Apr 2026", Status: "Upcoming", Laps: 56},
	{Round: "06", Name: "Miami Grand Prix", Circuit: "Miami International Autodrome", Date: "04 May 2026", Status: "Upcoming", Laps: 57},
	{Round: "07", Name: "Emilia Romagna Grand Prix", Circuit: "Autodromo Enzo e Dino Ferrari, Imola", Date: "18 May 2026", Status: "Upcoming", Laps: 63},
	{Round: "08", Name: "Monaco Grand Prix", Circuit: "Circuit de Monaco, Monte Carlo", Date: "25 May 2026", Status: "Upcoming", Laps: 78},
}

var techItems = []TechItem{
	{Category: "Power Unit", Title: "Hybrid Power Unit", Description: "The 1.6L V6 turbo-hybrid power unit combines internal combustion with two electric motor generators — the MGU-K and MGU-H — delivering extraordinary performance and efficiency.", MetricLabel: "Combined Output", MetricValue: "1,000+ HP", Icon: "power"},
	{Category: "Aerodynamics", Title: "Active Aero", Description: "Ground-effect floor tunnels and adaptive wing elements generate up to 5x the car's own weight in downforce, cornering at 5-6G lateral acceleration.", MetricLabel: "Downforce", MetricValue: "750 kg", Icon: "aero"},
	{Category: "Tyres", Title: "Pirelli Compounds", Description: "Five dry tyre compounds from C1 (hardest) to C5 (softest) allow teams to craft strategic pit-stop windows that can win or lose a race.", MetricLabel: "Compounds", MetricValue: "5 Types", Icon: "tyres"},
	{Category: "Data & Telemetry", Title: "Live Telemetry", Description: "Over 300 sensors generate 1.5 GB of data per lap, streamed in real-time to factory engineers who make critical strategy calls from thousands of miles away.", MetricLabel: "Data Points / lap", MetricValue: "1,500+", Icon: "telemetry"},
}

var teams = []Team{
	{Name: "Red Bull", Points: 412, Color: "#3671C6"},
	{Name: "Ferrari", Points: 389, Color: "#E8002D"},
	{Name: "McLaren", Points: 344, Color: "#FF8000"},
	{Name: "Mercedes", Points: 298, Color: "#00D2BE"},
	{Name: "Alpine", Points: 184, Color: "#006EFF"},
	{Name: "Aston Martin", Points: 201, Color: "#005AFF"},
	{Name: "Kick Sauber", Points: 77, Color: "#52E252"},
	{Name: "Haas", Points: 58, Color: "#B6BABD"},
	{Name: "Williams", Points: 112, Color: "#2B4562"},
	{Name: "RB", Points: 93, Color: "#6692FF"},
}

var circuitInfo = CircuitInfo{
	Name: "Circuit de Monaco",
	Desc: "The jewel of the Formula 1 calendar. Tight barriers, zero run-off, and streets carved into a Mediterranean hillside make Monaco the ultimate test of precision and nerve.",
	Specs: []Spec{
		{Label: "Circuit Length", Value: "3.337 km"},
		{Label: "Total Laps", Value: "78"},
		{Label: "Race Distance", Value: "260.3 km"},
		{Label: "Corners", Value: "19"},
		{Label: "Lap Record", Value: "1:12.909"},
		{Label: "DRS Zones", Value: "1"},
	},
}

var newsItems = []NewsItem{
	{Tag: "Qualifying", Title: "Verstappen Takes Pole in Dominant Bahrain Qualifying", Excerpt: "The reigning world champion delivered a stunning lap to secure pole position at the season-opening Bahrain Grand Prix, with Leclerc 0.341s behind in P2.", Date: "28 Jun 2026", Image: "https://picsum.photos/seed/f1-verstappen-pole/600/340"},
	{Tag: "Technical", Title: "McLaren Unveil Radical Floor Upgrade for Monaco", Excerpt: "McLaren have introduced a sweeping aerodynamic overhaul ahead of Monaco, with a completely revised underfloor designed to maximise mechanical grip on the tight street circuit.", Date: "26 Jun 2026", Image: "https://picsum.photos/seed/f1-mclaren-upgrade/600/340"},
	{Tag: "Exclusive", Title: "\"Ferrari Feels Like Home\" — Hamilton Reflects on His First Season", Excerpt: "In an exclusive interview, Lewis Hamilton opens up about the emotional transition to Ferrari, the challenge of adapting to a new car, and his championship aspirations.", Date: "24 Jun 2026", Image: "https://picsum.photos/seed/hamilton-ferrari-monaco/600/340"},
}

type GalleryItem struct {
	Link  string `json:"link"`
	Image string `json:"image"`
	Title string `json:"title"`
}

var (
	galleryCache     []GalleryItem
	galleryLastFetch time.Time
	galleryMutex     sync.Mutex
)

// Fallback images in case the external request fails completely
var fallbackGallery = []GalleryItem{
	{Link: "#", Image: "https://picsum.photos/seed/f1-racing-car-fast/800/500", Title: "F1 car at speed on circuit"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-pit-stop-crew/600/400", Title: "Pit crew performing lightning fast tyre change"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-night-race-bahrain/600/400", Title: "Night race illuminated circuit"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-overtake-wheel-to-wheel/700/500", Title: "Wheel-to-wheel racing battle"},
	{Link: "#", Image: "https://picsum.photos/seed/monaco-grandstand-crowd/700/500", Title: "Monaco grandstand packed with fans"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-podium-celebration/600/400", Title: "Podium celebration with champagne"},
}

func fetchGalleryItems() ([]GalleryItem, error) {
	client := &http.Client{
		Timeout: 5 * time.Second,
	}
	resp, err := client.Get("https://www.motorsport.com/f1/galleries/")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	html := string(bodyBytes)
	re := regexp.MustCompile(`(?s)<a[^>]*?class="[^"]*?ms-item--photo-gallery[^"]*?"[^>]*?href="([^"]+?)"[^>]*?>.*?<img[^>]*?src="([^"]+?)"[^>]*?>.*?<p[^>]*?class="ms-item__thumb-title"[^>]*?>\s*(.*?)\s*</p>`)
	matches := re.FindAllStringSubmatch(html, -1)

	var items []GalleryItem
	for i, match := range matches {
		if i >= 6 {
			break
		}
		link := match[1]
		if !strings.HasPrefix(link, "http") {
			link = "https://www.motorsport.com" + link
		}
		img := match[2]
		img = strings.Replace(img, "/s200/", "/s800/", 1)
		img = strings.Replace(img, "/s300/", "/s800/", 1)
		title := strings.TrimSpace(match[3])
		title = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(title, "")

		items = append(items, GalleryItem{
			Link:  link,
			Image: img,
			Title: title,
		})
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("no items parsed")
	}

	return items, nil
}

func getGallery() []GalleryItem {
	galleryMutex.Lock()
	defer galleryMutex.Unlock()

	// ponytail: cache for 5 minutes to avoid hitting rate-limiting/performance ceilings
	if time.Since(galleryLastFetch) < 5*time.Minute && len(galleryCache) > 0 {
		return galleryCache
	}

	items, err := fetchGalleryItems()
	if err != nil {
		log.Printf("Error fetching gallery items: %v", err)
		if len(galleryCache) > 0 {
			return galleryCache
		}
		return fallbackGallery
	}

	galleryCache = items
	galleryLastFetch = time.Now()
	return galleryCache
}

type SubscribeRequest struct {
	Email string `json:"email"`
}

func main() {
	mux := http.NewServeMux()

	// API Handlers with CORS headers helper for development
	api := func(handler func(w http.ResponseWriter, r *http.Request)) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			if r.Method == "OPTIONS" {
				return
			}
			handler(w, r)
		}
	}

	mux.HandleFunc("GET /api/ticker", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(tickerItems)
	}))

	mux.HandleFunc("GET /api/featured-race", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(featuredRace)
	}))

	mux.HandleFunc("GET /api/drivers", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(drivers)
	}))

	mux.HandleFunc("GET /api/calendar", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(calendar)
	}))

	mux.HandleFunc("GET /api/tech", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(techItems)
	}))

	mux.HandleFunc("GET /api/teams", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(teams)
	}))

	mux.HandleFunc("GET /api/circuit", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(circuitInfo)
	}))

	mux.HandleFunc("GET /api/news", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(newsItems)
	}))

	mux.HandleFunc("GET /api/gallery", api(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(getGallery())
	}))

	mux.HandleFunc("POST /api/subscribe", api(func(w http.ResponseWriter, r *http.Request) {
		var req SubscribeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
			http.Error(w, `{"error":"invalid email"}`, http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"message": "success"})
	}))

	// Fallback to serving the built React client if exists
	distPath := "./frontend/dist"
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Clean(r.URL.Path)
		target := filepath.Join(distPath, path)

		// Check if file exists, if not serve index.html for React routing (SPA fallback)
		info, err := os.Stat(target)
		if err != nil || info.IsDir() {
			http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
			return
		}
		http.ServeFile(w, r, target)
	})

	port := ":8080"
	log.Printf("Server listening on http://localhost%s", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed: %s", err)
	}
}
