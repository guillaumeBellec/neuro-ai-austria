# neuro-ai-austria

Source for **[neuro-ai.at](https://neuro-ai.at)** — landing page for the Neuro-AI research community in Austria.

The site is a plain static page (HTML + CSS + vanilla JS) served via GitHub Pages. There is no build step.

## Local preview

```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Adding a talk or event

Edit [`data/events.json`](data/events.json) and open a pull request. Each entry:

```json
{
  "date": "2026-06-15",
  "title": "Talk title",
  "speaker": "Speaker name (optional)",
  "location": "Venue (optional)",
  "link": "https://… (optional)",
  "description": "Short note (optional)"
}
```

Entries with a date in the past automatically move into the "Past events" section.

## Files

- `index.html` — landing page
- `css/style.css` — styles
- `js/cortex.js` — animated cortex background (waves propagate toward the cursor)
- `js/events.js` — renders the events list from `data/events.json`
- `data/events.json` — talks and events
- `CNAME` — custom domain for GitHub Pages
