# MyNotes — Personal Notion-Like Workspace with Google Drive Storage

MyNotes is a fast, personal Notion-like document workspace built with React, Express, TypeScript, and Tailwind CSS. All your documents and notes are stored directly in your personal Google Drive account in a structured JSON block format.

---

## 🌟 Key Features

* **Personal Notion-like Editor**: Supports Paragraphs, Headings (H1, H2, H3), Bullet Lists, Numbered Lists, To-do lists with checkable boxes, Block Quotes, Code Blocks, and Dividers.
* **Slash Commands (`/`)**: Type `/` in any empty block to bring up a command palette for rapid block creation.
* **Google Drive Persistence**: Documents are automatically saved to your personal Google Drive in the `MyNotes/Documents/` directory.
* **Single-User PIN Protection**: Secure unlock PIN hashed using PBKDF2 with SHA-256 and a random 16-byte salt on the backend server.
* **Debounced Auto-Save**: Auto-saves changes 1.5 seconds after you finish typing, with real-time status indicators ("Saved", "Saving...", "Offline").
* **Folders & Favorites**: Organize notes into hierarchical folders and pin important notes to Favorites.
* **Global Command Search (`⌘K`)**: Instant search across document titles and body content.
* **Cloud Run Ready**: Production-optimized Express + Vite bundle and Dockerfile ready for stateless Google Cloud Run deployment.

---

## 🏗️ Document Data Model Format

Documents are stored as structured JSON files inside `MyNotes/Documents/{document-id}.json`:

```json
{
  "id": "doc-1723500000000",
  "title": "Project Architecture",
  "icon": "🚀",
  "folderId": "folder-123",
  "createdAt": "2026-08-13T10:00:00Z",
  "updatedAt": "2026-08-13T10:30:00Z",
  "isFavorite": true,
  "blocks": [
    {
      "id": "block-1",
      "type": "heading1",
      "content": "Project Overview"
    },
    {
      "id": "block-2",
      "type": "paragraph",
      "content": "This application stores notes in structured JSON format."
    },
    {
      "id": "block-3",
      "type": "todo",
      "content": "Deploy to Google Cloud Run",
      "checked": false
    }
  ]
}
```

---

## 🔒 Security & PIN Hashing Model

1. **No Plaintext Passwords**: PINs and passphrases are never stored as plaintext or sent to external services.
2. **PBKDF2 SHA-256**: The server generates a unique random 16-byte salt and derives a 64-byte key using 100,000 iterations of PBKDF2 with SHA-256.
3. **Brute-Force Rate Limiting**: After 5 failed PIN attempts, authentication requests from that client IP are locked out for 30 seconds.
4. **HttpOnly Cookie Sessions**: Successfully unlocking the workspace sets a secure `HttpOnly`, `SameSite=None` session cookie.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## ☁️ Google Cloud & Google Drive Setup

### 1. Create Google Cloud Project & Enable Drive API
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `mynotes-workspace`).
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

### 2. Configure OAuth Consent Screen & Credentials
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** (or Internal for Workspace organizations).
3. Fill in App Name ("MyNotes") and Developer Email.
4. Add the OAuth Scope:
   - `https://www.googleapis.com/auth/drive.file`
5. Navigate to **APIs & Services > Credentials**.
6. Click **Create Credentials > OAuth client ID**.
7. Select Application Type: **Web application**.
8. Set Authorized Redirect URIs:
   - Development: `http://localhost:3000/auth/callback`
   - Production (Cloud Run): `https://<YOUR-CLOUD-RUN-SERVICE-URL>/auth/callback`

---

## 🐳 Docker & Google Cloud Run Deployment

### 1. Build and Test Docker Container Locally
```bash
docker build -t mynotes-app .
docker run -p 3000:3000 -e PORT=3000 mynotes-app
```

### 2. Deploy to Google Cloud Run
```bash
# Build & Submit container image to Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mynotes-app

# Deploy to Cloud Run
gcloud run deploy mynotes-app \
  --image gcr.io/YOUR_PROJECT_ID/mynotes-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars APP_URL="https://mynotes-app-xyz.run.app"
```

---

## 🛠️ Troubleshooting

* **OAuth Redirect Mismatch (`Error 400: redirect_uri_mismatch`)**: Ensure the redirect URI configured in Google Cloud Console Credentials exactly matches `https://<YOUR-APP-URL>/auth/callback`.
* **Expired Access Token**: The client automatically requests token refresh using standard OAuth refresh tokens without asking for daily Google logins.
* **Stateless Cloud Run**: MyNotes writes document data to Google Drive, ensuring that even if Cloud Run containers restart, all document data remains safely persisted in your Google Drive `MyNotes` folder.
