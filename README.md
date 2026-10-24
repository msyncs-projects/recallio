# 🧠 MnemoFlow (`mnemoflow`)

An open-source, full-stack clone of **RemNote** combining a keyboard-driven hierarchical outliner with automatic spaced-repetition (SRS) flashcard generation, interactive 2D knowledge graphs, bidirectional backlinks, and **hybrid local-first + PostgreSQL cloud synchronization with multi-user authentication**.

Pre-loaded with deep knowledge models including the **REA Enterprise Ontology & Accounting Framework (Resources, Events, Agents)**, active recall tutorials, and cognitive science notes.

---

## ✨ Core Features

### 1. User Management & Authentication
* **Full Multi-User Isolation**: Each user has their own private knowledge base, flashcards, tags, and study queues.
* **Email & Password Authentication**: Secure password hashing with `bcryptjs` and stateless HTTP-Only session cookies signed via `jose` (JWT).
* **Instant Onboarding**: New users automatically receive the complete REA framework and tutorial notes seeded directly into their PostgreSQL account.
* **Hybrid Local-First Sync**:
  * Works offline or as a guest in **IndexedDB**.
  * When logged in, automatically syncs with **PostgreSQL** in real-time.

### 2. The "Rem" Knowledge Model
* **Hierarchical Outliner**: Infinite nesting with full keyboard workflow:
  * `Enter`: Create a new sibling bullet below.
  * `Tab`: Indent (make child of previous sibling).
  * `Shift + Tab`: Outdent (move up a level).
  * `Backspace`: Delete empty Rem and focus preceding node.
  * `Arrow Up / Down`: Seamless cursor navigation across tree lines.
  * `Click Bullet`: Zoom into any Rem as its own focused document with active breadcrumb path.
  * `Fold / Unfold`: Smooth collapse and expand of subtrees.

### 3. Automated Flashcard Generation
Flashcards are generated in real-time as you type notes using outliner syntax:
* **Concept - Descriptor**: `Concept :: Definition` (Forward card)
* **Bidirectional Cards**: `Front ::: Back` or `Front <-> Back` (Creates both Front→Back and Back→Front cards)
* **Cloze Deletion Cards**: `The capital of {{France}} is {{Paris}}` (Creates interactive fill-in-the-blank cards)
* **Live Card Indicator Badge**: Displays generated cards on the bullet line with a live preview popover.

### 4. Spaced Repetition (SRS) Review Queue
* SuperMemo SM-2 & Anki-grade scheduling algorithm.
* Queue broken down into **New**, **Learning**, and **Review** cards.
* 4-grade rating interface with projected next review dates:
  * `[1] Again` (< 10m / 1d)
  * `[2] Hard` (interval × 1.2, ease - 0.15)
  * `[3] Good` (interval × ease)
  * `[4] Easy` (interval × ease × 1.3, ease + 0.15)
* Keyboard shortcuts: `Space` to reveal answer, `1`-`4` to grade.
* Session celebration (confetti) and streak/retention metrics.

### 5. Interactive 2D Knowledge Graph
* Dynamic Canvas force-directed graph simulation.
* Nodes color-coded by document, flashcard presence, and active note.
* Real-time zoom, pan, and node dragging.
* Filter by tag (`#accounting`, `#ontology`, `#srs`) or search query.
* Click any node to open and edit that document instantly.

### 6. Backlinks & Bidirectional References
* Link any note using `[[Document Name]]`.
* Automated Backlinks section showing:
  * **Linked References**: Documents pointing to this Rem.
  * **Unlinked Mentions**: Mentions of the document title with a 1-click "Link" button.

### 7. PostgreSQL Database & Vercel Ready
* **Prisma ORM** schema supporting PostgreSQL (Vercel Postgres, Neon, Supabase, or local Docker).
* **Local Docker Container**: Pre-configured and running locally on port 5432.
* **Full Data Ownership**:
  * Export complete workspace to JSON.
  * Import and restore JSON backups.
  * Export all notes as hierarchical Markdown (`.md`).
  * Reset to default knowledge base anytime.

---

## 🚀 Getting Started

### 1. Local Development (with PostgreSQL)

The local PostgreSQL database is already running in Docker on port `5432`.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Sync database schema:**
   ```bash
   npx prisma db push
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploy to Vercel (with Database)

### Step 1: Create a PostgreSQL Database on Vercel
1. In your [Vercel Dashboard](https://vercel.com), go to the **Storage** tab and click **Create Database** &rarr; select **Vercel Postgres** (or connect a free **Neon** / **Supabase** database).
2. Note your `DATABASE_URL` connection string (or link the database directly to your Vercel project).

### Step 2: Configure Environment Variables in Vercel
In your Vercel Project Settings &rarr; **Environment Variables**, add:
* `DATABASE_URL`: `postgres://...` (your PostgreSQL connection string)
* `JWT_SECRET`: Any random 32+ character string (e.g. `your-production-jwt-secret-key-32chars`)
* `NEXT_PUBLIC_APP_NAME`: `MnemoFlow`

### Step 3: Deploy
Push this repository to GitHub/GitLab:
```bash
git remote add origin https://github.com/your-username/mnemoflow.git
git push -u origin main
```
Import the repository into Vercel and click **Deploy**. Vercel will build the app and execute database migrations automatically.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Universal Search & Command Palette |
| `Enter` | Create new line / Rem below |
| `Tab` | Indent current Rem |
| `Shift + Tab` | Outdent current Rem |
| `/` | Trigger Slash Formatting Menu |
| `::` | Create Concept Flashcard |
| `:::` or `<->` | Create Bidirectional Flashcard |
| `{{word}}` | Create Cloze Deletion Flashcard |
| `[[Note]]` | Create Link to Note |
| `#tag` | Add Tag |
| `Space` *(in Study mode)* | Reveal Answer / Flip Card |
| `1` - `4` *(in Study mode)* | Grade Flashcard (Again / Hard / Good / Easy) |
