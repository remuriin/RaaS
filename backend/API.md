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
- The account's email has to be verified. A valid token from an account that hasn't opened its verification link gets `403` with `"code": "email_not_verified"`, and nothing is done or stored for it. A token keeps saying "not verified" until it is renewed, so after the person verifies, call `await user.getIdToken(true)` once. A Gmail address signed in through Google is verified from the start; every other sign-in, GitHub included, has to open the verification link first.
- The first authenticated call from a new, verified account creates its record on the server; there is no separate "register" call to the API.

## Errors

Every error is JSON with one field, and a normal HTTP status:

```json
{ "error": "You already have the maximum of 3 services" }
```

The message is written for end users and can be shown as is. One error also carries a `code` for the app to act on: the unverified-email `403` described above.

```json
{ "error": "Verify your email address first. Open the link in the email we sent you, then try again.", "code": "email_not_verified" }
```

| Status | Meaning |
|---|---|
| 400 | Something in the request is wrong (the message says what). For an upload this includes a file that would be split into more than 1,000 pieces |
| 401 | Missing, invalid or expired login token |
| 403 | The service belongs to another account, or the account's email isn't verified yet (`code: "email_not_verified"`) |
| 404 | Unknown service, file or route |
| 409 | Not allowed in the current state: service limit reached, service not active yet, file name already exists |
| 413 | A PDF larger than 10 MB, another file larger than 500 KB, or a question request larger than 100 KB (the message names the limit) |
| 429 | Too many requests: more than 5 per second from one IP address, or more than 5 uploads waiting their turn on one service. Wait a few seconds |
| 415 | The upload's `Content-Type` does not match the ending of its name |
| 502 | The service's process is not responding |
| 503 | The model is busy or rate limited; retry shortly |

The table above is for `/api/...`. A service's own address, `/i/<id>/...` (called with its API key), answers `503` with `{"error":"The service is not responding right now. Try again in a moment."}` when the id has no running service behind it: it was deleted, never existed, or is restarting for a few seconds during a deploy. Until 2026-10-13 a deleted or unknown id answered `404` there. An id that is not a UUID still answers `404`.

## Types

```ts
type ServiceStatus = "pending" | "active" | "failed" | "deleting";

interface Service {
  id: string;                 // UUID
  name: string;               // label shown in the dashboard
  productName: string | null; // what the assistant calls itself
  persona: "support" | "tutor" | "guide" | "reference"; // the voice it answers in
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
{ "name": "New label", "productName": "New product name", "persona": "tutor" }
```

- Send any of the three. `"productName": ""` or `null` clears it.
- `persona` is the voice the assistant answers in: `support` (the default, for a product or a business), `tutor` (notes, courses, manuals), `guide` (stories, lore, history) or `reference` (plain, no personality). It changes who the assistant says it is and how it words a greeting and "that is not in the files". It never changes what the assistant may say: every persona answers only from the files, does not combine separate facts, refuses what is not covered, stays short and cites its sources. There is no custom persona.
- `400` if none of the three is sent, a value is too long, or `persona` is not one of the four.
- A changed product name or persona is used from the very next question. A new service starts as `support`.

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

The request body is the file itself, **not JSON**, sent with the `Content-Type` of its kind:

| Ending | `Content-Type` | Limit | What happens to it |
|---|---|---|---|
| `.md` | `text/markdown` | 500 KB | stored as it is |
| `.txt` | `text/plain` | 500 KB | stored as it is |
| `.html`, `.htm` | `text/html` | 500 KB | written out as markdown by a model |
| `.xml` | `application/xml` | 500 KB | written out as markdown by a model |
| `.pdf` | `application/pdf` | 10 MB | written out as markdown by a model, scanned pages included |

Only the markdown is kept, never the original file. The web app picks the type from the file's ending (`fileKind` in `lib/types.ts`):

```ts
await fetch(`/api/instances/${id}/documents/${encodeURIComponent(file.name)}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": fileKind(file.name).type },
  body: file, // a File from an <input type="file">
});
```

```json
{ "id": "…", "source": "handbook.md", "chunks": 1, "status": "ready" }
```

- The request only returns once the file is fully processed: a second for text, up to a few minutes for a long PDF. Show a progress state and don't time out early.
- A conversion has about 4 minutes. A file that needs longer (a PDF past roughly 60 dense pages) is refused whole with a `400` saying to split it; nothing is stored.
- `:name` must end in one of the endings above and use only letters, numbers, dots, dashes and underscores (max 100 characters): `400` otherwise.
- `409` if a file with that name already exists. There is no overwrite: delete, then upload again.
- `400` empty file, a text file that is not text, a `.pdf` that is not a PDF, or one that would be split into more than 1,000 pieces (very many tiny headings); `413` over the limit of its kind; `415` a content type that does not match the ending; `429` when 5 uploads are already waiting on that service.
- On `500`/`503` the upload is kept as a `failed` entry in the list; uploading the same name again replaces that failed entry.

**`DELETE /api/instances/:id/documents/:name`** → `204` with an empty body (`404` if there is no such file)

### Chat test

**`POST /api/instances/:id/query`** → `200` `Answer`

```json
{
  "question": "and for exchanges?",
  "markdown": false,
  "history": [
    { "role": "user", "content": "How long do refunds take?" },
    { "role": "assistant", "content": "Refunds take 5 to 7 business days." }
  ]
}
```

- `question` is required, at most 2000 characters. `markdown` is optional (default `false`): send `true` if the page renders markdown, otherwise answers are plain text with line breaks. A markdown answer uses only what it needs, from this list and nothing else: numbered lists (steps), bulleted lists (three or more separate items), `##` headings (only when the answer covers two or more subjects), bold (an amount, a deadline, a limit), links (a web address from the files) and inline code (something typed or copied exactly). A one or two sentence answer has no formatting. It never contains tables, images, quote blocks, divider lines or HTML. `topK` is optional (1 to 20, default 5): how many passages from the files the answer may draw on.
- `history` is optional: the earlier messages of the conversation, oldest first, each `{ "role": "user" | "assistant", "content": text }`. The service first rewrites a follow-up ("and for exchanges?") into a full question ("How long do exchanges take?") using them, then searches and answers with that. Nothing is stored: the caller keeps the conversation and sends it each time.
- Of `history`, only the last 6 messages and the first 500 characters of each are used, so the whole conversation may be sent. A wrong shape (not a list, another role, empty content) is a `400`. The whole request can be at most 100 KB (`413`).
- Without `history`, or with an empty list, the question is answered on its own and no extra model call is made.
- If the model is busy while rewriting, the service retries 3 times and then answers `503`. If the rewrite comes back empty, the question is used as it was sent.
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

**Limits.** 3 services per account, 10 MB per PDF and 500 KB per other file, 1,000 pieces per file, 5 requests per second per IP address (over that: `429` with a JSON body), 5 uploads waiting per service.

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

Email/password, Google and GitHub sign-in are enabled. The authorized domains (Firebase console, Authentication → Settings → Authorized domains) are the two Firebase ones, `rag.remservers.me` and `localhost`. `localhost` had to be added by hand: Firebase stopped adding it to new projects, and without it the Google and GitHub pop-ups are refused in local development (email/password works either way).

GitHub sign-in goes through a GitHub OAuth app named "Rem RaaS", whose callback URL is `https://rag-service-remuriin.firebaseapp.com/__/auth/handler`. Its client ID and secret are stored in the Firebase console, nowhere in this repository.

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

**Deployment.** A push to `main` builds the web app into a container image, and Flux deploys it blue-green in the cluster. The caching rules are in the container; the security headers and the Content-Security-Policy that allows Firebase's sign-in pop-up are in its route at the front door (Fleet's `apps/raas/route.yaml`). The full description is in the backend repository: `RAG-API/deploy/README.md`, section "The web app".
