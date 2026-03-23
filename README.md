# Studyond — AI Thesis Journey

[![Deployed on Railway](https://img.shields.io/badge/Deployed%20on-Railway-0b0d0e?style=for-the-badge&logo=railway)](https://railway.app)
[![Start Hack 2026](https://img.shields.io/badge/Start%20Hack-2026-ffdd00?style=for-the-badge)](https://starthack.eu)

> **"From 'I'm starting' to 'I'm submitting'"** — Your AI-powered companion for the academic milestone.

---

## 🌟 The Vision

**Studyond** is a comprehensive platform designed to streamline the complex process of writing an academic thesis. Built during **Start Hack 2026** for the **Studyond Challenge**, our solution bridges the gap between students, supervisors, and industry partners, transforming a stressful academic milestone into a structured and rewarding journey.

---

## 🏆 The Challenge: Studyond @ Start Hack 2026

The "Studyond Challenge" at Start Hack 2026 tasked participants with reimagining the academic thesis experience. Our research identified key pain points:
- **Fragmentation**: Students struggle to find topics across disparate portals.
- **Opacity**: The registration process is manual and progress is often invisible to supervisors.
- **Isolation**: A long writing phase with infrequent feedback loops.
- **Communication Friction**: Students are frequently frustrated with the **style, frequency, and consistency** of supervisor communication.

### Our Solution
We built an end-to-end journey tracker that addresses these through:
- **Smart Discovery**: Filter topics by **Field** and **Source** (Industry/Company vs. University).
- **10-Stage Lifecycle**: A visual timeline spanning `exploring` → `application_pending` → `registered` → `planning` → `executing` → `writing` → `submitted` → `defense_prep` → `graded`.
- **Proactive AI (Ona)**: An integrated copilot providing **contextual prompts**, **health checks**, and **proactive nudges** if progress plateaus.
- **Unified Supervisor Dashboard**: A portal for supervisors to manage approvals, track health scores, and maintain a **Dual-Scope Knowledge Base** (Global vs. Topic-specific).

---

## 🛠 Technical Documentation & Design Decisions

### 🏗 Hybrid Full-Stack Architecture
The platform has evolved into a robust full-stack application:
- **Core**: [React 19](https://react.dev/) with [Vite 6](https://vitejs.dev/) for the interactive frontend.
- **Backend Proxy**: A [Node.js/Express](https://expressjs.com/) server (`server.js`) that handles intelligent API proxying, security headers, and static asset serving.
- **AI Intelligence**: Powered by **Google Gemini 2.5 Flash** (`@google/genai`) for real-time academic support.

---

### 🧠 Ona AI: The Smart Copilot
Ona is now backed by a live Large Language Model (LLM), enabling:
1. **Automated Supervisor Interceptor**: A sophisticated logic layer where Ona evaluates student questions in real-time. If an answer exists in the Knowledge Base (formatting, rules, deadlines), Ona provides it immediately, potentially intercepting the message to save supervisor time.
2. **Contextual Grounding**: Responses are strictly grounded in the supervisor's Knowledge Base to ensure academic rigor.
3. **Proactive Health Checks**: Automated monitoring of thesis progress to identify and nudge students when they hit plateaus.

---

### 🛡 Security & Reliability
Designed for high-quality academic data management:
- **Helmet.js**: Implements essential security headers (CSP, XSS protection).
- **Express-Rate-Limit**: Protects LLM/API endpoints from abuse and brute-force attempts.
- **Dynamic Threading**: Maintains state-aware chat histories for seamless student-AI interactions.

---

### 🎨 Design Guideline (Studyond System)
The application follows a strict, premium design system to ensure a cohesive and high-end academic experience:
- **Typography**: Uses **Avenir Next** as the primary typeface for its modern, clean legibility.
- **Type Scale**: A standardized scale ranging from `ds-caption` (12px) for metadata to `ds-title-xl` (36px) for headers.
- **Layout Patterns**: 
    - **Adaptive Grids**: Responsive 3-column and 4-column layouts for topic discovery and dashboards.
    - **Narrow Focus**: Content areas restricted to `ds-layout-narrow` (3xl) to maximize readability during writing and reading phases.
- **Color Strategy**: Fully implemented using **OKLCH color tokens**, enabling future-proof dynamic themes and seamless dark mode transitions.
- **Glassmorphism Accents**: Subtle use of `backdrop-blur` for high-priority overlays and modals.

---

## ⚙️ Setting Up

### Environment Variables
1. Create a `.env` file in the root directory (refer to `.env.example`).
2. Obtain a **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
3. Add your key:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```

### Local Development
```bash
# Install dependencies
npm install

# Run Vite dev server (frontend only with proxy)
npm run dev

# Run Production-ready full-stack server
npm start
```

---

## 🚀 Deployment Guide (Railway)

We've chosen **Railway** for its superior DX and reliability.

### Step-by-Step Deployment
1. **Create Project**: `+ New Project` > `Deploy from GitHub repo`.
2. **Configure Environment**: Add `GEMINI_API_KEY` to the project variables in Railway.
3. **Configure Build Settings**:
   - **Start Command**: `npm start` (Railway will automatically detect `server.js`)
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
4. **Network**: Ensure the port is set to `8080` (or let Railway use the default `PORT` variable).

---

## 👥 The Team
Created at **Start Hack 2026** for the **Studyond Challenge**.

![IMG_20260323_112027](https://github.com/user-attachments/assets/828ac2ea-76aa-4e3e-a06d-c280f9ba427c)

Special thanks to the **Studyond** mentors for the challenge insights.

---

> [!NOTE]
> This project is a prototype built for the Start Hack 2026 hackathon.
