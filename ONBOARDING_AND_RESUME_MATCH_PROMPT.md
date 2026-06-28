# Fix Onboarding Visibility and Add Resume Match Score

## Current State

The HireForce app is working well overall:

- Candidates can apply to jobs.
- Salesforce creates the correct `Candidate_Application__c` records.
- HR can move candidates through the pipeline.
- When a candidate is marked `Hired`, Salesforce creates onboarding tasks.
- HR can see onboarding tasks.
- Resume parsing/summarization exists.

However, a few MVP gaps remain.

## Goal

Improve the Salesforce-backed HireForce app so onboarding is visible and trackable for both HR and hired candidates, onboarding records stay separated by job/application, and HR gets a simple resume match score on the dashboard.

## Problems To Fix

### 1. Hired Candidate Cannot See Their Onboarding Steps

When a candidate is hired, onboarding tasks are created in Salesforce, but the applicant/user side of the app does not show those onboarding steps.

The hired candidate should be able to log in and see their own onboarding checklist.

### 2. HR Cannot Mark Onboarding Tasks Complete

HR can see onboarding tasks, but they cannot check off completed tasks from the app.

HR should be able to mark an onboarding task as complete, and that completion should update Salesforce.

When HR marks a task complete, the candidate/user side should reflect that updated status.

### 3. Onboarding Tasks Merge When Same Candidate Name Applies To Multiple Jobs

If a candidate applies to multiple jobs using the same name and is selected/hired for more than one role, onboarding tasks can appear merged under one candidate name.

This is incorrect.

Onboarding should be grouped by unique `Candidate_Application__c`, not by candidate name alone.

Example:

- Jordan Lee hired for Software Engineer
- Jordan Lee hired for Customer Success Manager

These should show as two separate onboarding groups because they are two different applications/jobs.

### 4. Add Resume Match Score For HR

The app already parses applicant resumes.

Add a simple match score out of 100 for HR users.

This score does not need to be perfect or production-grade. It is for hackathon demo value.

It should be based on the resume text/summary and the job description or job title.

Do not make hiring decisions. Do not rank candidates against each other. Only provide a helpful screening signal.

## Desired User Experience

### Candidate/User Side

Add an onboarding view for hired candidates.

The candidate should see:

- Applied role/job title
- Onboarding task list
- Task status: Not Started, In Progress, Done
- Due date if available
- Completed tasks visually checked off

If the candidate has multiple hired applications, show separate onboarding sections per job/application.

Example:

```txt
Software Engineer Onboarding
- Send welcome email - Done
- Prepare equipment - In Progress
- Complete HR paperwork - Not Started

Customer Success Manager Onboarding
- Send welcome email - Not Started
- Schedule orientation - Not Started
```

### HR Side

Update the HR onboarding page so HR can:

- See onboarding grouped by candidate application/job
- Mark a task as `Done`
- Optionally move a task back to `Not Started` or `In Progress`
- See completed tasks crossed off or checked

When HR updates a task, the app should:

- PATCH the backend API
- Update the Salesforce `Onboarding_Task__c.Status__c`
- Refetch onboarding data
- Show the updated status on both HR and candidate pages

### HR Dashboard

Show a resume match score out of 100 on candidate cards or candidate detail.

Suggested display:

```txt
Resume Match: 82/100
```

Use this as a screening signal only.

## Salesforce Source Of Truth

Use Salesforce as the source of truth.

Do not store onboarding task status only in React state.

Use:

- `Candidate_Application__c`
- `Job_Opening__c`
- `Onboarding_Task__c`
- Resume summary/parsed resume Note or stored summary

## Backend API Changes

Add or update backend routes:

### Get onboarding for all HR users

```http
GET /api/onboarding
```

Should return onboarding tasks grouped or groupable by:

- `candidateApplicationId`
- `candidateName`
- `jobId`
- `jobTitle`
- `taskId`
- `taskTitle`
- `status`
- `dueDate`

### Get onboarding for one applicant

```http
GET /api/applications/me/onboarding?email=user@example.com
```

Should:

- Find `Candidate_Application__c` records for that email.
- Only include applications where the candidate is hired or has onboarding tasks.
- Return onboarding tasks grouped by unique application/job.

### Update onboarding task status

```http
PATCH /api/onboarding/:taskId
```

Body:

```json
{
  "status": "Done"
}
```

Allowed statuses:

- `Not Started`
- `In Progress`
- `Done`

The backend should update:

```js
Onboarding_Task__c.Status__c
```

## Frontend Changes

Likely files:

- `frontend/src/pages/hr/OnboardingPage.tsx`
- `frontend/src/pages/applicant/MyApplicationPage.tsx`
- `frontend/src/hooks/useHireForce.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/types/index.ts`
- `frontend/server/server.mjs`
- `frontend/server/salesforce.mjs`

## Data Shape Recommendation

Use application id as the primary grouping key.

```ts
interface OnboardingTask {
  id: string;
  candidateApplicationId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  dueDate?: string;
  triggeredAt: string;
}
```

Avoid grouping by `candidateName` alone.

## Resume Match Score

Add a lightweight scoring method.

Example methodology:

- Extract keywords from job title and job description.
- Extract keywords/skills from resume text or resume summary.
- Count overlaps.
- Add small bonus for role-specific skills.
- Clamp score between 0 and 100.

Example:

```ts
score = Math.min(100, 50 + keywordOverlap * 8 + skillOverlap * 5)
```

If resume text is missing:

- Show `Resume Match: Not available`
- Do not invent a score.

If a score is calculated:

- Store or return it with the candidate/application.
- Show it on HR dashboard candidate cards.
- Show it on candidate detail.

Important:

- Do not use protected traits.
- Do not infer age, gender, race, nationality, disability, religion, or other protected characteristics.
- Do not make final hiring recommendations.
- Label the score as an approximate screening signal.

## Acceptance Criteria

### Onboarding Candidate View

- Mark a candidate as `Hired`.
- Confirm Salesforce creates onboarding tasks.
- Log in as that candidate/applicant.
- Candidate sees onboarding tasks for their hired application.
- Completed tasks appear checked/crossed off.

### HR Task Completion

- HR opens onboarding page.
- HR marks one onboarding task as `Done`.
- Salesforce `Onboarding_Task__c.Status__c` updates to `Done`.
- Candidate/user side shows the task as completed.

### Multiple Jobs With Same Candidate Name

- Create two hired applications with the same candidate name but different jobs.
- Confirm onboarding tasks do not merge.
- HR sees two separate onboarding groups.
- Candidate sees two separate onboarding groups.

### Resume Match Score

- Apply to a job with a resume.
- Resume is parsed.
- HR dashboard shows a match score out of 100.
- Candidate detail shows the same score.
- If no resume is available, score shows as `Not available`.

## Demo Script

1. Candidate applies to a job with a resume.
2. HR sees the candidate and an approximate resume match score.
3. HR moves candidate to `Hired`.
4. Salesforce Flow creates onboarding tasks.
5. HR opens onboarding page and marks one task `Done`.
6. Candidate opens their application/onboarding view.
7. Candidate sees the same task completed.
8. Show another hired application with the same candidate name but a different job.
9. Confirm onboarding stays separated by job/application.

## Definition Of Done

The onboarding flow should feel connected end to end:

```txt
Candidate hired in Salesforce-backed pipeline
-> Salesforce creates onboarding tasks
-> HR checks tasks off
-> Candidate sees progress
-> Multiple applications stay separate
-> HR sees a resume match score for faster screening
```

