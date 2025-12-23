# Job Application Manager

A secure, full-featured React + TypeScript web app for tracking job applications, managing resumes, and preparing for interviews — with **zero-knowledge client-side encryption** and an optional authentication wall.

---

## ✨ Features

### 🔒 Security & Privacy
- **Full Client-Side Encryption**: All data (applications, resumes, journals, prep questions) encrypted in IndexedDB using **AES-GCM** with **PBKDF2**-derived keys from a user-set password.
- **Zero-Knowledge Design**: Encryption keys never leave your browser or touch the server.
- **Environment Driven**: Sensitive configuration (Firebase) is managed via environment variables for easy deployment.
- **Password Management**: Change password (re-encrypts all data) or securely wipe everything via Settings.
- **Firebase Authentication**: Email/password login integration.

### 📈 Analytics Dashboard
- **Consistency Heatmap**: Visualize your application intensity over the year (GitHub-style activity grid).
- **Status Distribution**: Track your funnel with breakdown charts (Submitted, Interviewing, Offer, Rejected).
- **Engagement Metrics**: Monitor response rates and active daily application streaks.
- **Ghosting Detection**: Automatic flagging of "stale" applications (no response for 3+ months).

### 📊 Application Dashboard
- Track applications with dynamic status badges.
- Store job descriptions, cover letters (Markdown-supported), and posting URLs.
- **AI Resume Review**: Built-in feedback via Google Gemini API (using an ephemeral, non-persisted key).
- Filter and sort applications by status or date.

### 📝 Resume Editor
- **Live Preview & split-view Rendering**: Secure, hybrid preview rendering (HTML headers + Markdown body) for pixel-perfect results in real-time.
- **Robust Legacy Migration**: Auto-migrates older HTML-based resumes to secure JSON headers on load.
- **.docx Import**: Upload Word resumes and automatically convert them to structured Markdown.
- **PDF/HTML Export**: Generate professionally formatted PDFs (via Pandoc) or standalone HTML resumes.
- **Smart Header**: Synchronized fields for Contact Info with auto-formatting and validation.
- **Version Control**: Manage multiple resumes for different job types.

### 🎯 Interview Preparation
- **Question Bank**: Manage behavioral (STAR), technical, and custom questions.
- **Categorization**: Tag questions by category or source.
- **Journal Timeline**: Record interview experiences, outcomes, and specific questions asked.

### ⚙️ Settings & UX
- **Hideable Sidebar**: Collapsible navigation to maximize screen real estate for deep work.
- **Data Portability**: Export/Import raw JSON backups (encrypted with your local key). Also, supports importing Excel files for bulk application entry.
- **Premium UI**: Refined Tailwind CSS interface with smooth transitions and dark-mode compatible aesthetics.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Purpose |
| :--- | :--- |
| **Node.js** | Core runtime (≥18.x recommended) |
| **Python 3** | Document conversion (`markitdown`) |
| **Pandoc** | PDF generation engine |
| **XeLaTeX** | High-quality typography for PDF export |

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   npm install -g serve
   ```

2. **Setup Python dependencies**:
   ```bash
   pip install markitdown[docx]
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_SENDER_ID=your_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### Running the Application

**Quick Start (Windows)**:
Run the PowerShell script to start both the Frontend and the Backend:
```powershell
.\run.ps1
```
*Optional: Create a Desktop shortcut with `.\create_shortcut.ps1`*

**Quick Start (Linux/macOS)**:
```bash
chmod +x run.sh
./run.sh
```

**Manual Start**:
- **Backend**: `node server.js`
- **Frontend**: `npm run build && serve -s build`

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.