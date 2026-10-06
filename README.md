# Cadence technical guide

## Project summary

Cadence is a speech and presentation rehearsal app for students and job seekers. A speaker records or uploads a practice talk, receives a transcript and delivery feedback, then reviews the session and practices targeted drills.

## How a session moves through the system

1. The React and TypeScript browser app records audio or accepts an audio upload.
2. The browser sends the audio and presentation context to the Express API.
3. The server calls Google Gemini for transcription, delivery analysis, coaching, voice playback, or drill feedback.
4. The browser displays transcript segments, delivery metrics, coaching notes, and practice drills.
5. The app saves session analysis to Supabase Postgres. It also keeps a browser cache in `localStorage`.

The app does not save the recorded audio in Supabase. Temporary browser audio URLs are removed before session data is stored.

## Technology

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons
- Backend: Node.js and Express
- AI: Google Gemini API through `@google/genai`
- Session database: Supabase Postgres, accessed by the server through Supabase REST
- Hosting target: Vercel, with Vite output written to `public`

## API routes

| Method and route | Purpose |
|---|---|
| `POST /api/analyze-speech` | Analyze a recorded or uploaded presentation and return a transcript, metrics, and coaching. |
| `POST /api/coach-voice` | Generate spoken coaching audio. |
| `POST /api/analyze-drill` | Review a written response to a practice drill. |
| `GET /api/sessions?ownerId=<uuid>` | Load saved session analyses for the browser profile. |
| `POST /api/sessions` | Save or update one session analysis. The request contains `ownerId` and `session`. |
| `DELETE /api/sessions/<sessionId>?ownerId=<uuid>` | Delete one saved session for the browser profile. |

The Supabase service role key is read only by the server. Do not place it in a `VITE_*` variable or send it to the browser.

## Database setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the project URL and service role key into the local `.env` file as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Keep `.env` out of Git. The committed `.env.example` contains placeholders only.

The `cadence_sessions` table has a composite primary key (`owner_id`, `session_id`), a JSONB session payload, and a creation timestamp. Row-level security is enabled. The server uses the service role key and filters every query by the owner ID supplied by the browser. When cloud sync connects, the app migrates local non-sample sessions that are missing from the database.

### Current account and privacy boundary

Cadence currently creates a random owner ID in each browser and keeps it in that browser's local storage. This is a demo profile, not an authenticated account. Clearing browser storage loses the link to the saved sessions, and another device gets a different profile. Anyone who obtains an owner ID could use the public API to access that profile's saved analysis. Add real sign-in and server-verified authorization before storing sensitive or production data. Transcripts and coaching are stored in Supabase; audio is sent to Gemini for analysis and is not stored in the session table.

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Run `npm run dev` and open the local URL printed by Vite/Express.
4. Allow microphone access to record, or use the audio upload control.

If Supabase is not configured, session database calls return a visible error in the app. Gemini-powered features also need a valid API key.

## Build and deployment

The Vercel configuration runs `npm run build` and serves the generated Vite files from `public`. The root Express application handles the API routes. To prepare a deployment:

1. Push the project to a Git provider and import it into Vercel.
2. Confirm the project uses the repository root, the `npm run build` build command, and `public` as the output directory.
3. Add `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel project environment variables for Preview and Production.
4. Deploy, open the generated URL on a phone, allow microphone access, and check recording, analysis, session save/load/delete, AI coaching, and drill analysis.
5. Replace the live URL placeholder in the abstract and pitch deck with the working deployment URL.

The project has not been deployed yet, so no public URL or phone test result is available.

## Checks completed

The TypeScript check (`tsc --noEmit`) and Vite production build have passed after the code changes. These checks confirm compilation and bundling; they do not verify live Gemini credentials, Supabase credentials, microphone behavior on a phone, or the deployed URL.