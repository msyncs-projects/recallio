# 🧠 RemNote Clone (Local-First & Vercel Ready)

An open-source, high-performance clone of **RemNote** combining a keyboard-driven hierarchical outliner with automatic spaced-repetition (SRS) flashcard generation, interactive 2D knowledge graphs, bidirectional backlinks, and client-side offline persistence.

Pre-loaded with deep knowledge models including the **REA Enterprise Ontology & Accounting Framework (Resources, Events, Agents)**, active recall tutorials, and cognitive science notes.

---

## ✨ Core Features

### 1. The "Rem" Knowledge Model
* **Hierarchical Outliner**: Infinite nesting with full keyboard workflow:
  * `Enter`: Create a new sibling bullet below.
  * `Tab`: Indent (make child of previous sibling).
  * `Shift + Tab`: Outdent (move up a level).
  * `Backspace`: Delete empty Rem and focus preceding node.
  * `Arrow Up / Down`: Seamless cursor navigation across tree lines.
  * `Click Bullet`: Zoom into any Rem as its own focused document with active breadcrumb path.
  * `Fold / Unfold`: Smooth collapse and expand of subtrees.

### 2. Automated Flashcard Generation
Flashcards are generated in real-time as you type notes using RemNote syntax:
* **Concept - Descriptor**: `Concept :: Definition` (Forward card)
* **Bidirectional Cards**: `Front ::: Back` or `Front <-> Back` (Creates both Front→Back and Back→Front cards)
* **Cloze Deletion Cards**: `The capital of {{France}} is {{Paris}}` (Creates interactive fill-in-the-blank cards)
* **Live Card Indicator Badge**: Displays generated cards on the bullet line with a live preview popover.

### 3. Spaced Repetition (SRS) Review Queue
* SuperMemo SM-2 & Anki-grade scheduling algorithm.
* Queue broken down into **New**, **Learning**, and **Review** cards.
* 4-grade rating interface with projected next review dates:
  * `[1] Again` (< 10m / 1d)
  * `[2] Hard` (interval × 1.2, ease - 0.15)
  * `[3] Good` (interval × ease)
  * `[4] Easy` (interval × ease × 1.3, ease + 0.15)
* Keyboard shortcuts: `Space` to reveal answer, `1`-`4` to grade.
* Session celebration (confetti) and streak/retention metrics.

### 4. Interactive 2D Knowledge Graph
* Dynamic Canvas force-directed graph simulation.
* Nodes color-coded by document, flashcard presence, and active note.
* Real-time zoom, pan, and node dragging.
* Filter by tag (`#accounting`, `#ontology`, `#srs`) or search query.
* Click any node to open and edit that document instantly.

### 5. Backlinks & Bidirectional References
* Link any note using `[[Document Name]]`.
* Automated Backlinks section showing:
  * **Linked References**: Documents pointing to this Rem.
  * **Unlinked Mentions**: Mentions of the document title with a 1-click "Link" button.

### 6. Local-First & Vercel Deployable
* **Local-First**: Powered by **IndexedDB (Dexie)** for zero latency, offline-first reliability, and client-side data isolation.
* **Vercel Ready**: Static & Serverless compatible. Zero configuration required when deploying to Vercel.
* **Full Data Ownership**:
  * Export complete workspace to JSON.
  * Import and restore JSON backups.
  * Export all notes as hierarchical Markdown (`.md`).
  * Reset to default knowledge base anytime.

---

## 🚀 Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Local Run

```bash
npm run build
npm run start
```

---

## ☁️ Deploy to Vercel

### Option 1: Vercel CLI
```bash
npx vercel
```

### Option 2: GitHub / Vercel Dashboard
1. Push this repository to GitHub or GitLab.
2. In [vercel.com](https://vercel.com), click **Add New Project** and import the repository.
3. Deploy! Next.js will automatically detect the settings and deploy without any database or backend config required.

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
