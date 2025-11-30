# Job Application Manager

A React + TypeScript application for tracking job applications, editing resumes, and journaling interview experiences.  
This project evolved through multiple redesigns and enhancements, integrating persistent storage, modern UI/UX, and advanced resume editing tools.

---

## ✨ Features

### 📊 Application Tracker Dashboard
- Track job applications with statuses: **Submitted**, **Interviewing**, **Rejected**, **Offer Received**
- **New:** Store **Job Description** and **Cover Letter** for each application
- **New:** Save direct **Job Posting URLs**
- **New:** **Markdown support** for rich text formatting in descriptions and cover letters
- Stats overview (total applications, active interviews, offers)
- Add new applications with validation and resume association
- Update status directly from application cards
- Responsive grid layout with styled status badges

### 📝 Resume Editor
- Create and edit resumes with **Markdown input and live preview**
- Split-panel editing and full-screen preview modal
- Resume versioning system with tagging by skill focus
- Toolbox sidebar for managing items (projects, skills, education, etc.)
  - Add, edit, and delete items inline
- Save resumes as **HTML files** with Tailwind CSS styling
- Conditional formatting for sections (headers, separators, blockquotes)

### 📔 Interview Journal
- Record interview notes linked to applications
- Add questions asked and outcomes
- Timeline view of all journal entries with styled cards
- Validation for required fields (application, notes, etc.)

### 💾 Persistent Storage
- Integrated database layer (`utils/db`) for applications, resumes, and items
- Auto-save hooks with `useEffect` to persist state changes
- Status indicator in sidebar showing sync state

### 🎨 UI/UX Enhancements
- Sidebar navigation with icons and active state styling
- Responsive layouts for Dashboard, Resume Editor, and Interview Journal
- Tailwind CSS styling with typography plugin for Markdown rendering
- Improved visual feedback and usability across components

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 16.x)
- npm or yarn

### Installation
```
git clone <repository-url>
cd job-application-manager
npm install
```

### Development
```
npm start
```
Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build
```
npm run build
```
Builds the app for production.


## 🛠️ Technologies Used
- **React** (with Hooks)
- **TypeScript**
- **Tailwind CSS** (with typography plugin)
- **ReactMarkdown** + plugins (`rehype-raw`, `markdown-it`)
- **Indexed DB integration** for persistent storage

---

## 📈 Roadmap
- 🔒 Authentication and cloud storage integration
- 📤 Export resumes to PDF
- 📅 Calendar integration for interview scheduling
- 🔔 Notifications and reminders

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

