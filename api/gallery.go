package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type GalleryItem struct {
	Link  string `json:"link"`
	Image string `json:"image"`
	Title string `json:"title"`
}

var fallbackGallery = []GalleryItem{
	{Link: "#", Image: "https://picsum.photos/seed/f1-racing-car-fast/800/500", Title: "F1 car at speed on circuit"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-pit-stop-crew/600/400", Title: "Pit crew performing lightning fast tyre change"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-night-race-bahrain/600/400", Title: "Night race illuminated circuit"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-overtake-wheel-to-wheel/700/500", Title: "Wheel-to-wheel racing battle"},
	{Link: "#", Image: "https://picsum.photos/seed/monaco-grandstand-crowd/700/500", Title: "Monaco grandstand packed with fans"},
	{Link: "#", Image: "https://picsum.photos/seed/f1-podium-celebration/600/400", Title: "Podium celebration with champagne"},
}

func fetchGalleryItems() ([]GalleryItem, error) {
	client := &http.Client{Timeout: 5 * time.Second}
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

		items = append(items, GalleryItem{Link: link, Image: img, Title: title})
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("no items parsed")
	}

	return items, nil
}

func Gallery(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Cache-Control", "s-maxage=300, stale-while-revalidate=86400")

	items, err := fetchGalleryItems()
	if err != nil {
		items = fallbackGallery
	}
	json.NewEncoder(w).Encode(items)
}
