# Job Application Manager

A secure, full-featured React + TypeScript web app for tracking job applications, managing resumes, and preparing for interviews — with **zero-knowledge client-side encryption** and an optional authentication wall.

---

## ✨ Features

### 🔒 Security & Privacy
- **Full Client-Side Encryption**: All data (applications, resumes, journals, prep questions) encrypted in IndexedDB using **AES-GCM** with **PBKDF2**-derived keys from a user-set password.
- **Zero-Knowledge Design**: Encryption keys never leave your browser or touch the server.
- **Password Management**: Change password (re-encrypts all data) or securely wipe everything via Settings.
- **Firebase Authentication**: Email/password login.

### 📊 Application Dashboard
- Track applications with statuses (Submitted, Interviewing, Rejected, Offer)
- Store job description, cover letter (Markdown-supported), and posting URL
- AI resume review via Google Gemini (ephemeral API key)
- Stats, edit/delete, days-since-applied badges

### 📝 Resume Editor
- Markdown editor with live preview and full-screen mode
- **.docx Import**: Upload Word resumes → auto-converted to Markdown via backend
- **PDF Export**: Generate formatted PDFs server-side (Pandoc)
- Smart header fields (Name, Phone, Email, LinkedIn)
- Resume versioning, reusable item toolbox, HTML export with styling

### 🎯 Interview Preparation
- Dedicated prep tab with searchable, filterable question bank
- Full-screen practice mode
- Journal timeline for notes, questions asked, and outcomes (edit/delete)

### ⚙️ Settings & UX
- Responsive tabbed interface with sidebar navigation
- Data export/import (encrypted JSON backup)
- Status indicators and polished Tailwind UI

---

## 🚀 Getting Started

### Prerequisites
- Node.js (≥18 recommended).
- Install packages:
  ```bash
  npm i
  sudo npm install -g serve
  ```
- Python 3.x
- `markitdown` for document conversion:
  ```bash
  pip install markitdown[docx]
  ```
- Install pandoc and xelatex for document conversion: https://pandoc.org/installing.html
- Add your Firebase profile in `src/firebase.ts`.

### Build
```
npm run build
```

### Serve (Windows)
```
.\run.ps1
```

OR you can use a Desktop shortcut

```
.\create_shortcut.ps1
```

### Serve (Linux)
```bash
chmod +x run.sh
./run.sh
```