# Fix HR Applicant Refresh After Job Application Submission

## Goal

Fix the HireForce app so that when a candidate applies to a job and Salesforce creates the `Candidate_Application__c` record, the HR side of the app reflects the new applicant without requiring a full browser reload.

## Current Issue

When an applicant submits a job application:

- The website successfully creates the Salesforce `Candidate_Application__c` record.
- Salesforce becomes the source of truth for the new applicant.
- However, the HR dashboard/pipeline page does not always show the new applicant immediately.
- The HR user may need to manually refresh the browser to see the updated applicant list.

This makes the app feel like the Salesforce backend is not connected, even though the record is being created correctly.

## Desired Behavior

After a job application is submitted, HR users should be able to see new applicants from Salesforce reliably.

Implement one or both of these:

1. Manual refresh button
   - Add a visible refresh button on the HR dashboard/pipeline page.
   - When clicked, reload candidates/jobs from the backend API.
   - The backend API should query Salesforce again, not local cached/mock data.

2. Automatic refresh
   - Automatically refetch HR candidate/job data on an interval, such as every 10-30 seconds.
   - Also refetch when the HR page regains browser focus.
   - This should update the UI when a new Salesforce application exists.

## Recommended MVP Fix

Implement both:

- A manual **Refresh** button for demo control.
- A lightweight automatic refetch interval for a live-feeling dashboard.

## Affected Pages

Likely frontend pages:

- `frontend/src/pages/hr/HRDashboardPage.tsx`
- `frontend/src/pages/hr/JobsPage.tsx`
- Any page that shows candidates/applicants grouped by job or stage

Likely data hook:

- `frontend/src/hooks/useHireForce.ts`

Likely API functions:

- `frontend/src/lib/api.ts`
- `GET /api/candidates`
- `GET /api/jobs`

## Implementation Notes

The app already has API-backed hooks. Update the query/refetch logic so HR pages can force a reload from Salesforce.

Suggested approach:

- Add a `refetch` function to `useApiQuery`.
- Return `refetch` from hooks like `useCandidates()` and `useJobs()`.
- Add a refresh button on HR pages that calls both `refetchCandidates()` and `refetchJobs()`.
- Add a timestamp such as `Last updated: 2:14 PM` after successful refresh.
- Add loading state while refresh is running.
- Add automatic polling only on HR pages, not every applicant page.

## Example UX

On the HR dashboard header:

```txt
Pipeline
[Refresh]
Last updated: 2:14 PM
```

When clicked:

- Button shows `Refreshing...`
- App calls `/api/candidates` and `/api/jobs`
- UI updates with any new Salesforce records

## Automatic Refresh Option

Add a small interval inside HR pages:

```ts
useEffect(() => {
  const interval = window.setInterval(() => {
    refetchCandidates();
    refetchJobs();
  }, 15000);

  return () => window.clearInterval(interval);
}, [refetchCandidates, refetchJobs]);
```

Also refetch on browser focus:

```ts
useEffect(() => {
  const refreshOnFocus = () => {
    refetchCandidates();
    refetchJobs();
  };

  window.addEventListener('focus', refreshOnFocus);
  return () => window.removeEventListener('focus', refreshOnFocus);
}, [refetchCandidates, refetchJobs]);
```

## Acceptance Criteria

- Submit a new application from the applicant side.
- Confirm the record is created in Salesforce.
- Go to the HR dashboard.
- Click **Refresh**.
- The new applicant appears without reloading the browser.
- Wait for the auto-refresh interval.
- New Salesforce applicants appear automatically.
- No mock/local candidate data is used for HR pipeline results.
- Existing jobs, interviews, and candidate stages still load correctly.

## Demo Script

1. Open applicant side.
2. Apply to an open job.
3. Open Salesforce and confirm the new `Candidate_Application__c` exists.
4. Open HR dashboard.
5. Click **Refresh**.
6. Show the new applicant appearing in the HR pipeline.
7. Submit another application.
8. Wait for automatic refresh.
9. Show the applicant appearing without a full browser reload.

