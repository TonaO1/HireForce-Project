# Worknite

HR hiring platform with candidate pipeline tracking, interview management, and auto-onboarding.

## Frontend

React + Vite + TypeScript app in `frontend/`.

### Features

- **Login** — Role picker (HR vs Applicant) with demo auth
- **HR Dashboard** — 3D stacked card stack; swipe or click for candidate details
- **Candidate Detail** — Stage stepper, interview history, auto-onboarding on hire
- **Job Openings** — View and manage open roles
- **Interviews** — Log feedback and outcomes
- **Onboarding** — Tasks triggered when candidate is marked Hired
- **Applicant Portal** — Browse jobs, track application, book interviews

### Getting started

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — sign in with any email/password after selecting HR or Applicant.

### Tech stack

- React 19 + TypeScript
- React Router v7
- Tailwind CSS v4
- Framer Motion (3D card stack animations)
- Lucide React (icons)

### Project structure

```
frontend/src/
├── pages/
│   ├── LoginPage.tsx
│   ├── hr/           # HR dashboard, jobs, interviews, onboarding
│   └── applicant/    # Apply, status tracker, interview booking
├── components/
│   ├── dashboard/    # CandidateCardStack, PipelineStats, StageFilter
│   ├── candidate/    # StageBadge, StageStepper
│   └── layout/       # HRLayout, ApplicantLayout
├── contexts/         # AuthContext
├── data/             # Mock candidates, jobs, onboarding tasks
└── types/            # Shared TypeScript types
```
