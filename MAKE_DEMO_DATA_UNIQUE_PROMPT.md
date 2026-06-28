# Make Jobs Unique and Showcase Full App Capability

## Goal

Improve the HireForce demo data so every job feels unique, realistic, and useful for showing the full Salesforce-backed recruiting workflow.

The app should demonstrate:

- Unique job openings
- Candidates across all pipeline stages
- Interviews linked to real applicants
- Interview feedback updates
- Offers and offer acceptance
- Auto-onboarding tasks after a candidate is hired
- HR dashboard visibility

## Project

Use the Salesforce-connected app in:

```powershell
C:\Users\mkibe\Documents\HireForce-Project-ambition
```

Frontend:

```powershell
C:\Users\mkibe\Documents\HireForce-Project-ambition\frontend
```

Backend API:

```text
frontend/server/server.mjs
frontend/server/salesforce.mjs
```

## Important Rule

Use Salesforce as the source of truth.

Do not hardcode the improved demo records in React mock data unless they are only fallback data. Real demo data should be created in Salesforce through the backend API, Salesforce CLI, Apex anonymous, or Salesforce UI.

Do not put Salesforce credentials in browser code.

## Current Problem

Some jobs are duplicates, joke records, incomplete records, or do not clearly demonstrate the product.

Interviews may exist without being linked to `Candidate_Application__c`, which makes Interview Tracking look disconnected from applicants.

The demo should feel like a polished HR recruiting product, not random test data.

## Target Demo Dataset

Create 6 unique job openings:

| Job Title | Department | Priority | Headcount | Demo Purpose |
|---|---|---:|---:|---|
| Software Engineer | Engineering | High | 2 | Shows high-volume technical hiring |
| Account Executive | Sales | High | 1 | Shows offer-stage candidate |
| Marketing Coordinator | Marketing | Medium | 1 | Shows screened/interview pipeline |
| HR Generalist | HR | Medium | 1 | Shows HR-owned role |
| Operations Analyst | Operations | Low | 1 | Shows lower-priority role |
| Customer Success Manager | Customer Success | Medium | 1 | Shows cross-functional hiring |

Each job should have:

- `Name`
- `Job_Title__c` if required by the org
- `Status__c = Open`
- `Department__c` lookup if a matching department exists
- `Priority__c`
- `Headcount__c`
- `Target_Start_Date__c`
- `Description__c`

Descriptions should be specific enough to look real.

## Candidate Pipeline Demo

Create candidates across all stages:

| Candidate | Job | Stage |
|---|---|---|
| Jordan Lee | Software Engineer | Applied |
| Avery Morgan | Software Engineer | Screened |
| Riley Patel | Marketing Coordinator | Interview |
| Casey Nguyen | Account Executive | Offer |
| Morgan Ellis | HR Generalist | Hired |
| Jamie Ortiz | Operations Analyst | Rejected |
| Taylor Brooks | Customer Success Manager | Interview |

Each `Candidate_Application__c` should include:

- `Name`
- `Email__c`
- `Phone__c`
- `Job_Opening__c`
- `Stage__c`
- `Applied_Date__c`
- `Recruiter__c` if available
- `Rejection_Reason__c` when stage is Rejected

Use job-related rejection reasons only.

## Interview Demo

Create interviews linked to actual candidates through:

```text
Interview__c.Candidate_Application__c
```

Do not create unlinked interviews for the main demo.

Recommended interviews:

| Candidate | Type | Status | Outcome |
|---|---|---|---|
| Avery Morgan | Phone Screen | Completed | Hire |
| Riley Patel | Hiring Manager | Scheduled | Needs Follow-up |
| Casey Nguyen | Final | Completed | Strong Hire |
| Taylor Brooks | Panel | Scheduled | Needs Follow-up |
| Jamie Ortiz | Phone Screen | Completed | No Hire |

Completed interviews must include:

- `Outcome__c`
- `Score__c`
- `Technical_Score__c`
- `Communication_Score__c`
- `Problem_Solving_Score__c`
- `Feedback__c`
- `Strengths__c`
- `Concerns__c`
- `Evidence__c`

This matters because Salesforce validation rules may block completed interviews without structured feedback.

## Offer Demo

Create at least one offer:

| Candidate | Status | Demo Purpose |
|---|---|---|
| Casey Nguyen | Sent | Candidate can accept offer |
| Morgan Ellis | Accepted | Shows hired/onboarding flow |

Use:

```text
Offer__c
```

Fields:

- `Candidate_Application__c`
- `Status__c`
- `Salary__c` or salary field available in org
- `Start_Date__c`
- `Expiration_Date__c`

If `Offer_Accepted_Marks_Candidate_Hired` Flow is active, accepting an offer should update the candidate to `Hired`.

## Onboarding Demo

Morgan Ellis should be `Hired`.

Confirm Salesforce Flow creates onboarding records:

```text
Onboarding_Task__c
```

Expected task examples:

- Send welcome email
- Prepare equipment
- Schedule orientation
- Complete HR paperwork
- Manager intro
- 30-day check-in

Do not create onboarding tasks in React. Let Salesforce Flow create them when possible.

## Backend Helper Option

Add a backend-only seed script if useful:

```text
frontend/server/seed-demo-data.mjs
```

Run with:

```powershell
cd C:\Users\mkibe\Documents\HireForce-Project-ambition\frontend
node server/seed-demo-data.mjs
```

The script should:

1. Connect to Salesforce using the existing server auth logic.
2. Upsert or create unique jobs.
3. Create candidates linked to those jobs.
4. Create interviews linked to candidates.
5. Create offers.
6. Mark one candidate hired to trigger onboarding.

Avoid creating duplicate demo data every time it runs. Use predictable names/emails and query first.

## Frontend Improvements

Update UI copy where needed so the demo data looks polished:

- Jobs should show unique departments and descriptions.
- Applicant counts should reflect real related candidates.
- Interview Tracking should clearly show whether an interview is linked or unlinked.
- Candidate Detail should show interview feedback, score, strengths, concerns, and evidence.
- HR Dashboard should show candidates spread across stages.

## Acceptance Tests

Run:

```powershell
cd C:\Users\mkibe\Documents\HireForce-Project-ambition\frontend
npm run build
npm run lint
```

Then run:

```powershell
npm run api
npm run dev
```

Manual test:

1. Open HR Jobs.
2. Confirm all jobs are unique and realistic.
3. Confirm each job has meaningful description/department.
4. Open HR Dashboard.
5. Confirm candidates appear across Applied, Screened, Interview, Offer, Hired, and Rejected.
6. Open Interview Tracking.
7. Confirm interviews are linked to real candidates.
8. Save feedback for one interview.
9. Open that candidate detail page.
10. Confirm the updated feedback appears.
11. Mark one candidate Hired.
12. Confirm onboarding tasks appear.

## Definition of Done

The app should look demo-ready without needing verbal excuses.

HR should be able to say:

> Here are our open roles, here is the live candidate pipeline, here is interview feedback, here is an offer, and here is onboarding automatically triggered from Salesforce.

