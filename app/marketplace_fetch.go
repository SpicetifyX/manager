package app

import (
	"encoding/json"
	"fmt"
	"io"
	"manager/internal/helpers"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
)

type GitHubRepo struct {
	Name            string `json:"name"`
	FullName        string `json:"full_name"`
	HTMLURL         string `json:"html_url"`
	Description     string `json:"description"`
	StargazersCount int    `json:"stargazers_count"`
	Archived        bool   `json:"archived"`
	DefaultBranch   string `json:"default_branch"`
	ContentsURL     string `json:"contents_url"`
	PushedAt        string `json:"pushed_at"`
	CreatedAt       string `json:"created_at"`
}

type GitHubSearchResult struct {
	TotalCount        int          `json:"total_count"`
	IncompleteResults bool         `json:"incomplete_results"`
	Items             []GitHubRepo `json:"items"`
}

type Manifest struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Main        string       `json:"main"`
	Authors     []AuthorInfo `json:"authors,omitempty"`
	Preview     string       `json:"preview,omitempty"`
	Readme      string       `json:"readme,omitempty"`
	Tags        []string     `json:"tags,omitempty"`
	Usercss     string       `json:"usercss,omitempty"`
	Schemes     string       `json:"schemes,omitempty"`
	Include     []string     `json:"include,omitempty"`
	Branch      string       `json:"branch,omitempty"`
}

type CardItem struct {
	Manifest        Manifest     `json:"manifest"`
	Title           string       `json:"title"`
	Subtitle        string       `json:"subtitle"`
	Authors         []AuthorInfo `json:"authors"`
	User            string       `json:"user"`
	Repo            string       `json:"repo"`
	Branch          string       `json:"branch"`
	Archived        bool         `json:"archived"`
	ImageURL        string       `json:"imageURL"`
	ExtensionURL    string       `json:"extensionURL,omitempty"`
	ReadmeURL       string       `json:"readmeURL"`
	Stars           int          `json:"stars"`
	Tags            []string     `json:"tags,omitempty"`
	CSSURL          string       `json:"cssURL,omitempty"`
	SchemesURL      string       `json:"schemesURL,omitempty"`
	Include         []string     `json:"include,omitempty"`
	LastUpdated     string       `json:"lastUpdated"`
	Created         string       `json:"created"`
	StargazersCount int          `json:"stargazers_count"`
}

type Snippet struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Code        string `json:"code"`
	Preview     string `json:"preview,omitempty"`
	ImageURL    string `json:"imageURL,omitempty"`
}

const (
	SNIPPETS_URL  = "https://raw.githubusercontent.com/spicetify/marketplace/main/resources/snippets.json"
	BLACKLIST_URL = "https://raw.githubusercontent.com/spicetify/marketplace/main/resources/blacklist.json"
)

func downloadText(url string) (string, error) {
	resp, err := helpers.HttpGet(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status: %s", resp.Status)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func (a *App) GetMarketplaceBlacklist() []string {
	resp, err := helpers.HttpGet(BLACKLIST_URL)
	if err != nil {
		return []string{}
	}
	defer resp.Body.Close()

	var data struct {
		Repos []string `json:"repos"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return []string{}
	}
	return data.Repos
}

func matchesBlacklistPattern(urlStr, pattern string) bool {
	u := strings.ToLower(urlStr)
	p := strings.ToLower(pattern)

	if !strings.Contains(p, "*") {
		return u == p
	}

	regP := regexp.QuoteMeta(p)
	regP = strings.ReplaceAll(regP, "\\*", "[^/]+")
	match, _ := regexp.MatchString("^"+regP+"$", u)
	return match
}

func isBlacklisted(urlStr string, blacklist []string) bool {
	for _, p := range blacklist {
		if matchesBlacklistPattern(urlStr, p) {
			return true
		}
	}
	return false
}

func processAuthors(authors []AuthorInfo, user string) []AuthorInfo {
	if len(authors) > 0 {
		return authors
	}
	return []AuthorInfo{{
		Name: user,
		URL:  "https://github.com/" + user,
	}}
}

func isImageUrl(urlStr string) bool {
	if urlStr == "" {
		return false
	}
	re := regexp.MustCompile(`(?i)\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$`)
	return re.MatchString(urlStr)
}

func (a *App) GetTaggedRepos(tag string, page int, showArchived bool) GitHubSearchResult {
	blacklist := a.GetMarketplaceBlacklist()
	query := fmt.Sprintf("topic:%s", tag)
	u := fmt.Sprintf("https://api.github.com/search/repositories?q=%s&per_page=100&page=%d", url.QueryEscape(query), page)

	resp, err := helpers.HttpGet(u)
	if err != nil {
		return GitHubSearchResult{}
	}
	defer resp.Body.Close()

	var result GitHubSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return GitHubSearchResult{}
	}

	filteredItems := []GitHubRepo{}
	for _, item := range result.Items {
		if isBlacklisted(item.HTMLURL, blacklist) {
			continue
		}
		if !showArchived && item.Archived {
			continue
		}
		filteredItems = append(filteredItems, item)
	}
	result.Items = filteredItems
	return result
}

func getRepoManifests(user, repo, branch string) []Manifest {
	rootUrl := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/refs/heads/%s/manifest.json", user, repo, branch)
	resp, err := helpers.HttpGet(rootUrl)
	if err != nil || resp.StatusCode != 200 {
		// Try without refs/heads/
		rootUrl = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/manifest.json", user, repo, branch)
		resp, err = helpers.HttpGet(rootUrl)
		if err != nil || resp.StatusCode != 200 {
			return nil
		}
	}
	defer resp.Body.Close()

	var manifests []Manifest
	data, _ := io.ReadAll(resp.Body)

	// Can be single object or array
	if err := json.Unmarshal(data, &manifests); err != nil {
		var single Manifest
		if err := json.Unmarshal(data, &single); err != nil {
			return nil
		}
		manifests = append(manifests, single)
	}
	return manifests
}

func urlExists(urlStr string) bool {
	resp, err := helpers.HttpGetWithHeaders(urlStr, map[string]string{"Method": "HEAD"})
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

func (a *App) FetchExtensionManifests(repo GitHubRepo) []CardItem {
	re := regexp.MustCompile(`https://api\.github\.com/repos/(?P<user>.+)/(?P<repo>.+)/contents`)
	match := re.FindStringSubmatch(repo.ContentsURL)
	if len(match) < 3 {
		return nil
	}
	user := match[1]
	repoName := match[2]

	manifests := getRepoManifests(user, repoName, repo.DefaultBranch)
	if manifests == nil {
		return nil
	}

	var results []CardItem
	for _, m := range manifests {
		if m.Name == "" || m.Description == "" || m.Main == "" {
			continue
		}

		selectedBranch := m.Branch
		if selectedBranch == "" {
			selectedBranch = repo.DefaultBranch
		}

		extURL := m.Main
		if !strings.HasPrefix(extURL, "http") {
			extURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Main)
		}

		// Validation like in JS
		if !urlExists(extURL) {
			continue
		}

		var imageURL string
		if m.Preview != "" {
			if strings.HasPrefix(m.Preview, "http") {
				imageURL = m.Preview
			} else {
				imageURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Preview)
			}
			if !isImageUrl(imageURL) {
				imageURL = ""
			}
		}

		readmeURL := m.Readme
		if readmeURL != "" && !strings.HasPrefix(readmeURL, "http") {
			readmeURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Readme)
		}

		results = append(results, CardItem{
			Manifest:        m,
			Title:           m.Name,
			Subtitle:        m.Description,
			Authors:         processAuthors(m.Authors, user),
			User:            user,
			Repo:            repoName,
			Branch:          selectedBranch,
			Archived:        repo.Archived,
			ImageURL:        imageURL,
			ExtensionURL:    extURL,
			ReadmeURL:       readmeURL,
			Stars:           repo.StargazersCount,
			Tags:            m.Tags,
			LastUpdated:     repo.PushedAt,
			Created:         repo.CreatedAt,
			StargazersCount: repo.StargazersCount,
		})
	}
	return results
}

func (a *App) FetchThemeManifests(repo GitHubRepo) []CardItem {
	re := regexp.MustCompile(`https://api\.github\.com/repos/(?P<user>.+)/(?P<repo>.+)/contents`)
	match := re.FindStringSubmatch(repo.ContentsURL)
	if len(match) < 3 {
		return nil
	}
	user := match[1]
	repoName := match[2]

	manifests := getRepoManifests(user, repoName, repo.DefaultBranch)
	if manifests == nil {
		return nil
	}

	var results []CardItem
	for _, m := range manifests {
		if m.Name == "" || m.Usercss == "" || m.Description == "" {
			continue
		}

		selectedBranch := m.Branch
		if selectedBranch == "" {
			selectedBranch = repo.DefaultBranch
		}

		var imageURL string
		if m.Preview != "" {
			if strings.HasPrefix(m.Preview, "http") {
				imageURL = m.Preview
			} else {
				imageURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Preview)
			}
			if !isImageUrl(imageURL) {
				imageURL = ""
			}
		}

		readmeURL := m.Readme
		if readmeURL != "" && !strings.HasPrefix(readmeURL, "http") {
			readmeURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Readme)
		}

		cssURL := m.Usercss
		if !strings.HasPrefix(cssURL, "http") {
			cssURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Usercss)
		}

		schemesURL := m.Schemes
		if schemesURL != "" && !strings.HasPrefix(schemesURL, "http") {
			schemesURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, m.Schemes)
		}

		var includes []string
		for _, inc := range m.Include {
			if strings.HasPrefix(inc, "http") {
				includes = append(includes, inc)
			} else {
				includes = append(includes, fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", user, repoName, selectedBranch, inc))
			}
		}

		results = append(results, CardItem{
			Manifest:        m,
			Title:           m.Name,
			Subtitle:        m.Description,
			Authors:         processAuthors(m.Authors, user),
			User:            user,
			Repo:            repoName,
			Branch:          selectedBranch,
			Archived:        repo.Archived,
			ImageURL:        imageURL,
			ReadmeURL:       readmeURL,
			Stars:           repo.StargazersCount,
			Tags:            m.Tags,
			CSSURL:          cssURL,
			SchemesURL:      schemesURL,
			Include:         includes,
			LastUpdated:     repo.PushedAt,
			Created:         repo.CreatedAt,
			StargazersCount: repo.StargazersCount,
		})
	}
	return results
}

func (a *App) FetchAppManifests(repo GitHubRepo) []CardItem {
	re := regexp.MustCompile(`https://api\.github\.com/repos/(?P<user>.+)/(?P<repo>.+)/contents`)
	match := re.FindStringSubmatch(repo.ContentsURL)
	if len(match) < 3 {
		return nil
	}
	user := match[1]
	repoName := match[2]

	manifests := getRepoManifests(user, repoName, repo.DefaultBranch)
	if manifests == nil {
		return nil
	}

	var results []CardItem
	for _, m := range manifests {
		if m.Name == "" || m.Description == "" || m.Usercss != "" {
			continue
		}

		selectedBranch := m.Branch
		if selectedBranch == "" {
			selectedBranch = repo.DefaultBranch
		}

		var imageURL string
		if m.Preview != "" {
			if strings.HasPrefix(m.Preview, "http") {
				imageURL = m.Preview
			} else {
				imageURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/refs/heads/%s/%s", user, repoName, selectedBranch, m.Preview)
			}
			if !isImageUrl(imageURL) {
				imageURL = ""
			}
		}

		readmeURL := m.Readme
		if readmeURL != "" && !strings.HasPrefix(readmeURL, "http") {
			readmeURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/refs/heads/%s/%s", user, repoName, selectedBranch, m.Readme)
		}

		results = append(results, CardItem{
			Manifest:        m,
			Title:           m.Name,
			Subtitle:        m.Description,
			Authors:         processAuthors(m.Authors, user),
			User:            user,
			Repo:            repoName,
			Branch:          selectedBranch,
			Archived:        repo.Archived,
			ImageURL:        imageURL,
			ReadmeURL:       readmeURL,
			Stars:           repo.StargazersCount,
			Tags:            m.Tags,
			LastUpdated:     repo.PushedAt,
			Created:         repo.CreatedAt,
			StargazersCount: repo.StargazersCount,
		})
	}
	return results
}

func (a *App) FetchCssSnippets() []Snippet {
	resp, err := helpers.HttpGet(SNIPPETS_URL)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var snippets []Snippet
	if err := json.NewDecoder(resp.Body).Decode(&snippets); err != nil {
		return nil
	}

	for i, s := range snippets {
		if s.Preview != "" {
			if !strings.HasPrefix(s.Preview, "http") {
				snippets[i].ImageURL = "https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/" + s.Preview
			} else {
				snippets[i].ImageURL = s.Preview
			}
		}
	}

	return snippets
}

// GetGitHubRepo fetches repository details from GitHub API
func (a *App) GetGitHubRepo(user, repo string) (*GitHubRepo, error) {
	u := fmt.Sprintf("https://api.github.com/repos/%s/%s", user, repo)
	resp, err := helpers.HttpGet(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var ghRepo GitHubRepo
	if err := json.NewDecoder(resp.Body).Decode(&ghRepo); err != nil {
		return nil, err
	}

	return &ghRepo, nil
}

// GetMarketplaceItems fetches all items for a specific category (Extensions, Themes, Apps)
// This is a higher level function that the frontend can call directly.
func (a *App) GetMarketplaceItems(category string, page int, showArchived bool) []CardItem {
	var tag string
	switch category {
	case "Extensions":
		tag = "spicetify-extensions"
	case "Themes":
		tag = "spicetify-themes"
	case "Apps":
		tag = "spicetify-apps"
	default:
		return nil
	}

	searchResult := a.GetTaggedRepos(tag, page, showArchived)
	var allItems []CardItem
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, repo := range searchResult.Items {
		wg.Add(1)
		go func(r GitHubRepo) {
			defer wg.Done()
			var items []CardItem
			switch category {
			case "Extensions":
				items = a.FetchExtensionManifests(r)
			case "Themes":
				items = a.FetchThemeManifests(r)
			case "Apps":
				items = a.FetchAppManifests(r)
			}

			if items != nil {
				mu.Lock()
				allItems = append(allItems, items...)
				mu.Unlock()
			}
		}(repo)
	}
	wg.Wait()

	return allItems
}
