# Offline Dojo, Dijit Grid and Bootstrap setup

## 1. Download the frontend libraries once

The Dojo Toolkit distribution is intentionally not loaded from a CDN anymore. From this
folder, while internet is available, run:

```bash
npm install
```

The `postinstall` script copies Dojo 1.17.3, Dijit, DojoX, Bootstrap 5 and PDF.js into
`vendor/`. Commit the generated `vendor/` directory with the project. After that, the
frontend libraries are served from the project itself and do not need internet access.

If you already have `node_modules` and need to rebuild the local copies, run:

```bash
npm run vendor
```

## 2. Run the frontend

Run from this folder (do not open index.html using file://):

```bash
npm run serve
```

Open `http://localhost:5500`. The service worker caches same-origin application assets
as they are requested. The cache deliberately excludes `/api/` responses, JWTs and
document files so private student records are not silently stored in a shared browser
cache.

## 3. Frontend properties

Edit `app/config.properties` to change the API URL, offline shell-cache setting, log level
or request timeout. Do not put credentials, passwords or JWT secrets in frontend files.
The browser cannot protect secrets shipped to users.

## 4. Dijit and grid usage

The Admin > Documents view uses Dijit TextBox and DojoX DataGrid for student, document
and annotation records. Row selection drives the next view. Controllers and API services
remain focused on application logic and HTTP operations; grids belong in widgets.

## 5. Annotation visibility

Student annotations are saved by Spring Boot in the `document_annotations` database table.
The admin document view fetches version history and annotations for every document version.
Selecting a student and then a document shows annotation type, page, comment, creator,
timestamp and version below the original-document section. The original PDF remains
unchanged; annotation geometry and metadata are stored separately.

## 6. Offline limits

The UI shell and downloaded frontend libraries can load without internet after they have
been cached. A reachable Spring Boot service and MySQL database are still required for
login, live student/course data, uploads, annotations and document downloads. No private
API response is cached by the service worker.

## 7. Backend log files and profiles

Spring Boot writes rolling logs to `logs/student-registration.log`. The log directory is
created automatically. Use `--spring.profiles.active=dev` or `prod` to select the added
profile properties. Supply DB_PASSWORD, JWT_SECRET, MAIL_USERNAME, MAIL_PASSWORD and
ADMIN_PASSWORD through environment variables as appropriate.
