# Management API reference (for the web app)

Everything the dashboard needs, as a frontend sees it. Base URL:

```
https://rag.remservers.me/api
```

The web app is served from the same address, so in production it calls relative paths (`/api/...`).

## Authentication

Every request carries the signed-in user's Firebase ID token:

```
Authorization: Bearer <Firebase ID token>
```

Get it from the Firebase SDK right before each request with `await user.getIdToken()`. The SDK refreshes it when it has expired, so never store the token yourself.

- No token, or an invalid or expired one: `401`.
- The first authenticated call from a new account creates its record on the server; there is no separate "register" call to the API.

## Errors

Every error is JSON with one field, and a normal HTTP status:

```json
{ "error": "You already have the maximum of 3 services" }
```

The message is written for end users and can be shown as is.

| Status | Meaning |
|---|---|
| 400 | Something in the request is wrong (the message says what) |
| 401 | Missing, invalid or expired login token |
| 403 | The service belongs to another account |
| 404 | Unknown service, file or route |
| 409 | Not allowed in the current state: service limit reached, service not active yet, file name already exists |
| 413 | File larger than 500 KB |
| 415 | Upload not sent as markdown or plain text |
| 502 | The service's process is not responding |
| 503 | The model is busy or rate limited; retry shortly |

## Types

```ts
type ServiceStatus = "pending" | "active" | "failed" | "deleting";

interface Service {
  id: string;                 // UUID
  name: string;               // label shown in the dashboard
  productName: string | null; // what the assistant calls itself
  status: ServiceStatus;
  errorMessage: string | null; // set when status is "failed"
  url: string;                // public base URL of this service's own API
  keyPrefix: string | null;   // first characters of the current API key, null if none yet
  documents: number;          // files that are ready
  chunks: number;
  queries: { today: number; last7Days: number; total: number };
  createdAt: string;          // ISO date
}

interface StoredFile {
  id: string;
  source: string;             // the file name, e.g. "returns.md"
  status: "processing" | "ready" | "failed";
  error: string | null;       // a user-facing message when status is "failed"
  chunks: number;
  createdAt: string;
}

interface Answer {
  answer: string;
  sources: { source: string; heading: string }[];
  answered: boolean;          // false for refusals, greetings and "here's what I can help with"
}
```

## Endpoints

### Account

**`GET /api/me`** → `200`

```json
{ "uid": "SGO7Ir9nPCXvmIdmw1DGNfc5ITV2", "email": "dev-test@example.com" }
```

### Services

**`GET /api/instances`** → `200` `{ "instances": Service[] }`, oldest first.

**`POST /api/instances`** → `201` `Service` with `status: "pending"`

```json
{ "name": "My helpdesk", "productName": "Acme" }
```

- `name` is required, at most 60 characters. `productName` is optional, at most 60.
- `400` if `name` is missing or too long. `409` when the account already has 3 services.
- The service is not usable yet: see "Waiting for a new service" below.

**`GET /api/instances/:id`** → `200` `Service`

**`PATCH /api/instances/:id`** → `200` the updated `Service`

```json
{ "name": "New label", "productName": "New product name" }
```

- Send either field or both. `"productName": ""` or `null` clears it.
- `400` if neither is sent or a value is too long.
- A changed product name is used from the very next question.

**`DELETE /api/instances/:id`** → `202`

```json
{ "id": "…", "status": "deleting" }
```

The service stays in the list with `status: "deleting"` for a few seconds, then `GET /api/instances/:id` returns `404`. Its files and API key are gone for good.

### API key

**`POST /api/instances/:id/key`** → `201` (no request body)

```json
{
  "apiKey": "rag_…",
  "keyPrefix": "rag_XsSyx2It",
  "note": "Copy this key now. It is not stored and cannot be shown again."
}
```

- This is the only time the full key is ever returned. Afterwards only `keyPrefix` is available, on the `Service`.
- The same call is "regenerate": **any existing key stops working immediately.**
- `409` unless the service is `active`.

### Files

These manage the service's `.md` files on the owner's behalf. They need the service to be `active` (`409` otherwise).

**`GET /api/instances/:id/documents`** → `200` `{ "documents": StoredFile[] }`

**`POST /api/instances/:id/documents/:name`** → `201`

The request body is the raw file content, **not JSON**, with `Content-Type: text/markdown`:

```ts
await fetch(`/api/instances/${id}/documents/${encodeURIComponent(file.name)}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/markdown" },
  body: file, // a File from an <input type="file">
});
```

```json
{ "id": "…", "source": "handbook.md", "chunks": 1, "status": "ready" }
```

- The request only returns once the file is fully processed, which can take from a second to a minute or more. Show a progress state and don't time out early.
- `:name` must end in `.md` and use only letters, numbers, dots, dashes and underscores (max 100 characters): `400` otherwise.
- `409` if a file with that name already exists. There is no overwrite: delete, then upload again.
- `400` empty or non-text file, `413` over 500 KB, `415` wrong content type.
- On `500`/`503` the upload is kept as a `failed` entry in the list; uploading the same name again replaces that failed entry.

**`DELETE /api/instances/:id/documents/:name`** → `204` with an empty body (`404` if there is no such file)

### Chat test

**`POST /api/instances/:id/query`** → `200` `Answer`

```json
{ "question": "What do staff wear?", "markdown": false }
```

- `question` is required, at most 2000 characters. `markdown` is optional (default `false`): send `true` if the page renders markdown, otherwise answers are plain text with line breaks.
- There is no conversation memory; each question stands alone.
- A reply can take a few seconds, longer when the model is rate limited.
- These questions count in the service's `queries` numbers.

```json
{
  "answer": "Staff wear the blue library vest during opening hours.",
  "sources": [{ "source": "handbook.md", "heading": "Handbook > Dress code" }],
  "answered": true
}
```

## Behaviour the UI has to account for

**Waiting for a new service.** After `POST /api/instances`, poll `GET /api/instances/:id` every 1 to 2 seconds until `status` is no longer `pending`. It normally becomes `active` within about 15 seconds. If it becomes `failed`, show `errorMessage`; a failed service is not retried, the user deletes it and creates another.

**Generating the key.** Call `POST /api/instances/:id/key` only from an explicit button press, never automatically when a page loads. Two tabs calling it would each get a key, and the second call cancels the first tab's key. Ask for confirmation before regenerating.

**Status and what is allowed.**

| Status | Key | Files and chat | Rename | Delete |
|---|---|---|---|---|
| `pending` | no (409) | no (409) | yes | yes |
| `active` | yes | yes | yes | yes |
| `failed` | no (409) | no (409) | yes | yes |
| `deleting` | no (409) | no (409) | no point | already happening |

**Limits.** 3 services per account, 500 KB per file, 5 requests per second per IP address.

## The client's own app (for the API guide page)

Each service also has its own API, used by the client's application with the API key instead of a login. Its base is the service's `url`:

| Method | Path | Does |
|---|---|---|
| `GET` | `/health` | Is it up (no key needed) |
| `POST` | `/query` | Ask a question; same body and reply as the chat test above |
| `GET` | `/documents` | List files |
| `POST` | `/documents/<name>.md` | Add a file (raw markdown body) |
| `DELETE` | `/documents/<name>.md` | Delete a file |

```bash
curl -X POST "$URL/query" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question":"How long do refunds take?"}'
```

The key gives full access to that service, so it belongs on the client's server, not in browser or mobile app code.

## Building and deploying the web app

**Firebase.** Sign-in uses the Firebase project `rag-service-remuriin`. Print the web SDK config with:

```bash
npx -y firebase-tools@latest apps:sdkconfig WEB 1:887318447626:web:fc9ba3396cb4e5d14b81f3 --project rag-service-remuriin
```

Email/password sign-in is enabled. `localhost` is an authorized domain by default; `rag.remservers.me` has to be added in the Firebase console (Authentication → Settings → Authorized domains) before sign-in works on the deployed site.

**Local development.** Let Vite forward `/api` to the real backend, so the browser sees one origin and no CORS setup is needed:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": { target: "https://rag.remservers.me", changeOrigin: true },
    },
  },
});
```

**Deployment.** Build the app (`npm run build`), copy the output folder to the VPS (for example `/var/www/rag-app`), and replace the `location / { return 404; }` block in `/etc/nginx/sites-available/rag.conf` with:

```nginx
    location / {
        root /var/www/rag-app;
        try_files $uri /index.html;   # let the app's own router handle page URLs
    }
```

Then `sudo nginx -t && sudo systemctl reload nginx`. The `/api/` and `/i/<id>/` routes are more specific and keep working unchanged.
