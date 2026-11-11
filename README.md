# Student Course Registration System — Dojo Frontend

This is the Dojo Toolkit (1.17.3) replacement for the supplied React/Vite frontend.

## Architecture

- `index.html` contains exactly one `<div>`: `<div id="app"></div>`.
- `main.js` is the only application entry point.
- `app/App.js` coordinates routing, authentication, API calls, and events.
- `app/widgets/` contains separate UI modules: Login, Signup, Navbar, StudentDashboard, AdminDashboard, and CourseCard.
- `app/services/Api.js` sends requests to Spring Boot and attaches the JWT token.
- `app/config.js` contains the backend API base URL.

## Run locally

From this directory:

```bash
python -m http.server 5500
```

Open <http://localhost:5500>.

Do not run `npm install`; this frontend has no React/Vite dependencies and loads Dojo from its CDN.

## Before deployment

1. Update `API_BASE_URL` in `app/config.js` to your deployed Spring Boot API URL.
2. Configure Spring Boot CORS for the deployed frontend origin.
3. Deploy the static frontend files to your hosting provider.

The migration covers the features available in the supplied React source. Document management, document versioning, check-in/check-out, and annotation UI were not included in that source ZIP, so they need separate Dojo widgets and backend integration later.
