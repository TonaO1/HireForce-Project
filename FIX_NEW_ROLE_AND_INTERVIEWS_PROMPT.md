# Fix New Role and Interview Tracking

## Goal

Fix two MVP gaps in the HireForce `ambition` branch:

1. The **New Role** button on the HR Job Openings page has no functionality.
2. **Interview Tracking** does not accurately update or stay connected to the correct applicants/candidates.

The app should continue using this architecture:

```text
Vite React frontend
  -> local Node backend API in frontend/server/
  -> Salesforce custom objects and flows
```

Do not call Salesforce directly from browser components. Salesforce credentials must stay in the backend only.

## Current Project

Project folder:

```powershell
C:\Users\mkibe\Documents\HireForce-Project-ambition
```

Frontend folder:

```powershell
C:\Users\mkibe\Documents\HireForce-Project-ambition\frontend
```

Important existing files:

```text
frontend/src/pages/hr/JobsPage.tsx
frontend/src/pages/hr/InterviewsPage.tsx
frontend/src/pages/hr/CandidateDetailPage.tsx
frontend/src/lib/api.ts
frontend/server/server.mjs
frontend/server/salesforce.mjs
frontend/src/types/index.ts
```

## Issue 1: New Role Button Does Nothing

### Current Problem

The button exists visually:

```tsx
<button type="button" className="btn-mono btn-mono-solid">
  <Plus />
  New Role
</button>
```

But clicking it does not open a form, create a job, or call the backend.

### Required Behavior

When HR clicks **New Role**:

1. Open a simple modal, drawer, or inline form.
2. Allow HR to enter:
   - Role title
   - Department
   - Location
   - Description
   - Headcount
   - Priority
   - Target start date
3. On submit, call the backend.
4. Backend creates a real Salesforce `Job_Opening__c` record.
5. The Jobs page refreshes and shows the new role.
6. If Salesforce creation fails, show a visible error message.

### Salesforce Object

Create records in:

```text
Job_Opening__c
```

Suggested Salesforce field mapping:

| Frontend Field | Salesforce Field |
|---|---|
| title | `Name` |
| department | `Department__c` or department lookup handling |
| description | `Description__c` |
| headcount | `Headcount__c` |
| priority | `Priority__c` |
| targetStartDate | `Target_Start_Date__c` |
| status | `Status__c = "Open"` |

Important: In the current Salesforce org, `Department__c` may be a lookup. If it is a lookup, either:

- Query existing departments and let the user select one, or
- Make department optional and create the role without it, or
- Add a backend helper that finds a matching department record by name.

Do not fake the record in local mock data if Salesforce is configured.

### Backend API To Add

Add to `frontend/server/server.mjs`:

```http
POST /api/jobs
```

Request body:

```json
{
  "title": "Recruiting Coordinator",
  "department": "HR",
  "location": "Remote",
  "description": "Coordinate interview scheduling and candidate communications.",
  "headcount": 1,
  "priority": "Medium",
  "targetStartDate": "2026-07-15"
}
```

Response body should return the created job in the same shape used by the frontend `JobOpening` type.

Add to `frontend/server/salesforce.mjs`:

```js
export async function createJob(input) {
  // create Job_Opening__c in Salesforce
}
```

Add to `frontend/src/lib/api.ts`:

```ts
export async function createJob(input: CreateJobInput): Promise<JobOpening>
```

## Issue 2: Interview Tracking Is Not Accurate

### Current Problem

The Interview Tracking page reads interviews, but it does not reliably update interview feedback/outcomes back to Salesforce or keep candidate records in sync. It should reflect interviews related to each `Candidate_Application__c`.

### Required Behavior

Interview Tracking should:

1. Load real interviews from Salesforce `Interview__c`.
2. Show each interview with:
   - Candidate name
   - Candidate/application ID link
   - Interview type
   - Interviewer
   - Date/time
   - Status
   - Outcome
   - Feedback
3. Let HR save missing feedback/outcome.
4. Save updates to Salesforce `Interview__c`.
5. Refresh the list after saving.
6. Candidate detail page should show the same updated interview feedback.

### Salesforce Object

Use:

```text
Interview__c
```

Fields:

| UI Field | Salesforce Field |
|---|---|
| candidate/application | `Candidate_Application__c` |
| interviewer | `Interviewer__c` |
| date/time | `Interview_Date__c` |
| type | `Interview_Type__c` |
| status | `Status__c` |
| outcome | `Outcome__c` |
| score | `Score__c` |
| feedback | `Feedback__c` |
| strengths | `Strengths__c` |
| concerns | `Concerns__c` |
| evidence | `Evidence__c` |

### Backend APIs To Add

Add:

```http
PATCH /api/interviews/:id
```

Request body:

```json
{
  "status": "Completed",
  "outcome": "Hire",
  "score": 85,
  "feedback": "Strong communication and relevant experience.",
  "strengths": "Clear examples and strong coordination experience.",
  "concerns": "Needs onboarding on internal tools.",
  "evidence": "Explained how they managed scheduling for 20+ interviews per week."
}
```

Response should return the updated interview in the frontend shape.

Optionally add:

```http
POST /api/interviews
```

This would allow scheduling a new interview from the candidate detail page.

### Frontend Changes

Update:

```text
frontend/src/pages/hr/InterviewsPage.tsx
```

Needed UI:

- Keep the All / Pending / Pass / Fail filters.
- For pending or incomplete interviews, show editable fields.
- Save button should call `PATCH /api/interviews/:id`.
- After save, update local state or refetch interviews.
- Show a saving state and error state.

Update:

```text
frontend/src/pages/hr/CandidateDetailPage.tsx
```

Needed behavior:

- Candidate detail should fetch the selected candidate from Salesforce.
- Interview history should display the candidate's current Salesforce interviews.
- After interview feedback is saved on Interview Tracking, returning to Candidate Detail should show the updated result.

## Type Updates

Update `frontend/src/types/index.ts` if needed:

```ts
export type InterviewOutcome = 'pass' | 'fail' | 'pending';

export interface Interview {
  id: string;
  candidateId: string;
  candidateName?: string;
  scheduledAt: string;
  interviewer: string;
  feedback?: string;
  outcome?: InterviewOutcome;
  type: string;
  status?: string;
  score?: number;
  strengths?: string;
  concerns?: string;
  evidence?: string;
}
```

Add a create-job input type if useful:

```ts
export interface CreateJobInput {
  title: string;
  department?: string;
  location?: string;
  description?: string;
  headcount?: number;
  priority?: 'High' | 'Medium' | 'Low';
  targetStartDate?: string;
}
```

## Acceptance Tests

Run:

```powershell
cd C:\Users\mkibe\Documents\HireForce-Project-ambition\frontend
npm run build
npm run lint
```

Then run the app:

```powershell
npm run api
npm run dev
```

Manual test:

1. Open the HR Jobs page.
2. Click **New Role**.
3. Create a new job.
4. Confirm the new job appears in the UI.
5. Confirm the new `Job_Opening__c` exists in Salesforce.
6. Open Interview Tracking.
7. Save feedback/outcome on an interview.
8. Confirm the update persists after refresh.
9. Open the related candidate detail page.
10. Confirm the same interview feedback appears there.

## Security Rules

- Do not put Salesforce credentials in React/Vite browser code.
- Do not use `VITE_` or `NEXT_PUBLIC_` variables for Salesforce secrets.
- Do not commit `.env.local`.
- Keep Salesforce calls in `frontend/server/salesforce.mjs`.
- Keep browser calls limited to local `/api/...` routes.

