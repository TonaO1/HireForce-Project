import { salesforceCreate, salesforceQuery, salesforceUpdate } from "./salesforce.mjs";

const targetStart = "2026-07-15";
const today = new Date().toISOString().slice(0, 10);

const jobs = [
  {
    title: "Software Engineer",
    department: "Engineering",
    priority: "High",
    headcount: 2,
    description:
      "Build secure React and Node workflows for the HireForce recruiting platform, Salesforce integrations, and candidate-facing experiences.",
  },
  {
    title: "Account Executive",
    department: "Sales",
    priority: "High",
    headcount: 1,
    description:
      "Own mid-market pipeline, run consultative demos, and help HR teams understand how HireForce improves recruiting visibility.",
  },
  {
    title: "Marketing Coordinator",
    department: "Marketing",
    priority: "Medium",
    headcount: 1,
    description:
      "Coordinate campaigns, events, and launch content for recruiting operations buyers and HR leadership audiences.",
  },
  {
    title: "HR Generalist",
    department: "HR",
    priority: "Medium",
    headcount: 1,
    description:
      "Support employee relations, onboarding operations, compliance tasks, and the transition from offer acceptance to day-one readiness.",
  },
  {
    title: "Operations Analyst",
    department: "Operations",
    priority: "Low",
    headcount: 1,
    description:
      "Analyze handoffs, cycle times, and operational bottlenecks across recruiting, interviews, offers, and onboarding.",
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    priority: "Medium",
    headcount: 1,
    description:
      "Guide new customers through adoption, measure product value, and partner with HR leaders on recruiting workflow improvements.",
  },
];

const candidates = [
  {
    name: "Jordan Lee",
    email: "jordan.lee.demo@hireforce.local",
    phone: "555-0101",
    job: "Software Engineer",
    stage: "Applied",
  },
  {
    name: "Avery Morgan",
    email: "avery.morgan.demo@hireforce.local",
    phone: "555-0102",
    job: "Software Engineer",
    stage: "Screened",
  },
  {
    name: "Riley Patel",
    email: "riley.patel.demo@hireforce.local",
    phone: "555-0103",
    job: "Marketing Coordinator",
    stage: "Interview",
  },
  {
    name: "Casey Nguyen",
    email: "casey.nguyen.demo@hireforce.local",
    phone: "555-0104",
    job: "Account Executive",
    stage: "Offer",
  },
  {
    name: "Morgan Ellis",
    email: "morgan.ellis.demo@hireforce.local",
    phone: "555-0105",
    job: "HR Generalist",
    stage: "Offer",
    finalStage: "Hired",
  },
  {
    name: "Jamie Ortiz",
    email: "jamie.ortiz.demo@hireforce.local",
    phone: "555-0106",
    job: "Operations Analyst",
    stage: "Rejected",
    rejectionReason: "Experience mismatch",
  },
  {
    name: "Taylor Brooks",
    email: "taylor.brooks.demo@hireforce.local",
    phone: "555-0107",
    job: "Customer Success Manager",
    stage: "Interview",
  },
];

const interviews = [
  {
    candidate: "Avery Morgan",
    type: "Phone Screen",
    status: "Completed",
    outcome: "Hire",
    score: 84,
    feedback: "Strong fundamentals and clear communication throughout the screen.",
    strengths: "Explained React state tradeoffs clearly and asked thoughtful product questions.",
    concerns: "Needs more exposure to Salesforce object modeling.",
    evidence: "Walked through a production bug fix involving API latency and UI loading states.",
  },
  {
    candidate: "Riley Patel",
    type: "Hiring Manager",
    status: "Scheduled",
    outcome: "Needs Follow-up",
  },
  {
    candidate: "Casey Nguyen",
    type: "Final",
    status: "Completed",
    outcome: "Strong Hire",
    score: 93,
    feedback: "Excellent sales judgment, discovery skills, and role readiness.",
    strengths: "Built rapport quickly and mapped customer pain to concrete product value.",
    concerns: "Needs onboarding on internal sales tooling.",
    evidence: "Presented a persuasive mock discovery recap with next steps and clear mutual action plan.",
  },
  {
    candidate: "Taylor Brooks",
    type: "Panel",
    status: "Scheduled",
    outcome: "Needs Follow-up",
  },
  {
    candidate: "Jamie Ortiz",
    type: "Phone Screen",
    status: "Completed",
    outcome: "No Hire",
    score: 58,
    feedback: "Positive attitude, but current experience does not match the operations analyst scope.",
    strengths: "Communicated availability and interest clearly.",
    concerns: "Limited analytics ownership and limited dashboard/reporting examples.",
    evidence: "Could not describe prior ownership of recurring operational metrics or hiring funnel analysis.",
  },
];

const offers = [
  {
    candidate: "Casey Nguyen",
    status: "Sent",
    salary: 98000,
    startDate: "2026-07-20",
    expirationDate: "2026-07-05",
  },
  {
    candidate: "Morgan Ellis",
    status: "Accepted",
    salary: 82000,
    startDate: "2026-07-13",
    expirationDate: "2026-07-01",
  },
];

const badOpenJobTitles = new Set([
  "Gooner",
  "Growth @ Cluely",
  "Elon Musk",
  "Forward Deploy Engineer",
  "Risktaker/Roadrunner",
  "OnlyFans Model",
]);

async function main() {
  console.log("Seeding HireForce demo data in Salesforce...");

  const departmentIds = {};
  for (const job of jobs) {
    departmentIds[job.department] = await ensureDepartment(job.department);
  }

  const jobIds = {};
  for (const job of jobs) {
    jobIds[job.title] = await ensureJob(job, departmentIds[job.department]);
  }
  await cancelNonDemoOpenJobs(new Set(Object.values(jobIds)));

  const recordTypeId = await recruitingRecordTypeId();
  const candidateIds = {};
  const applicationIds = {};
  for (const candidate of candidates) {
    candidateIds[candidate.name] = await ensureCandidate(candidate, jobIds[candidate.job], recordTypeId);
    const talentCandidateId = await ensureTalentCandidate(candidate);
    applicationIds[candidate.name] = await ensureApplication(candidate, talentCandidateId, jobIds[candidate.job]);
  }

  for (const interview of interviews) {
    await ensureInterview(interview, candidateIds[interview.candidate], applicationIds[interview.candidate]);
  }

  for (const offer of offers) {
    await ensureOffer(offer, candidateIds[offer.candidate]);
  }

  for (const candidate of candidates.filter((item) => item.finalStage)) {
    await ensureCandidateStage(candidateIds[candidate.name], candidate.finalStage);
  }

  const onboarding = await salesforceQuery(`
    SELECT Id, Name, Task_Name__c, Status__c, Candidate_Application__r.Name
    FROM Onboarding_Task__c
    WHERE Candidate_Application__c = '${candidateIds["Morgan Ellis"]}'
  `);

  console.log(`Seed complete: ${jobs.length} jobs, ${candidates.length} candidates, ${interviews.length} interviews, ${offers.length} offers.`);
  console.log(`Morgan Ellis onboarding tasks: ${new Set(onboarding.map((task) => task.Task_Name__c || task.Name)).size}`);
}

async function ensureDepartment(name) {
  try {
    const existing = await salesforceQuery(`
      SELECT Id
      FROM Department__c
      WHERE Name = '${escapeSoql(name)}'
      LIMIT 1
    `);
    if (existing[0]) return existing[0].Id;
    const created = await salesforceCreate("Department__c", { Name: name });
    return created.id;
  } catch (error) {
    console.log(`Department lookup skipped for ${name}: ${error.message}`);
    return undefined;
  }
}

async function ensureJob(job, departmentId) {
  const existing = await salesforceQuery(`
    SELECT Id
    FROM Job_Opening__c
    WHERE Job_Title__c = '${escapeSoql(job.title)}'
    LIMIT 1
  `);
  const payload = clean({
    Name: job.title,
    Job_Title__c: job.title,
    Status__c: "Open",
    Department__c: departmentId,
    Priority__c: job.priority,
    Headcount__c: job.headcount,
    Target_Start_Date__c: targetStart,
    Description__c: job.description,
  });
  if (existing[0]) {
    await salesforceUpdate("Job_Opening__c", { Id: existing[0].Id, ...payload });
    return existing[0].Id;
  }
  const created = await salesforceCreate("Job_Opening__c", payload);
  return created.id;
}

async function cancelNonDemoOpenJobs(targetJobIds) {
  const openJobs = await salesforceQuery(`
    SELECT Id, Name, Job_Title__c
    FROM Job_Opening__c
    WHERE Status__c = 'Open'
  `);
  for (const job of openJobs) {
    const title = job.Job_Title__c || job.Name || "";
    if (targetJobIds.has(job.Id) || jobs.some((item) => item.title === title)) continue;
    if (badOpenJobTitles.has(title) || title.startsWith("Website Smoke Test Role")) {
      await salesforceUpdate("Job_Opening__c", { Id: job.Id, Status__c: "Cancelled" });
    }
  }
}

async function ensureCandidate(candidate, jobId, recordTypeId) {
  const existing = await salesforceQuery(`
    SELECT Id, Stage__c
    FROM Candidate_Application__c
    WHERE Email__c = '${escapeSoql(candidate.email)}'
    LIMIT 1
  `);
  const desiredStage = candidate.finalStage || candidate.stage;
  const payload = clean({
    Name: candidate.name,
    Email__c: candidate.email,
    Phone__c: candidate.phone,
    Job_Opening__c: jobId,
    Stage__c: desiredStage,
    Applied_Date__c: daysAgo(12),
    Last_Contact_Date__c: daysAgo(2),
    Touchpoint_Count__c: candidate.stage === "Applied" ? 1 : 4,
    Rejection_Reason__c: candidate.rejectionReason,
    Hire_Date__c: desiredStage === "Hired" ? today : undefined,
    RecordTypeId: recordTypeId,
  });
  if (existing[0]) {
    await salesforceUpdate("Candidate_Application__c", { Id: existing[0].Id, ...payload });
    return existing[0].Id;
  }
  const created = await salesforceCreate("Candidate_Application__c", payload);
  return created.id;
}

async function ensureTalentCandidate(candidate) {
  const existing = await salesforceQuery(`
    SELECT Id
    FROM Candidate__c
    WHERE Email__c = '${escapeSoql(candidate.email)}'
    LIMIT 1
  `);
  const payload = clean({
    Name: candidate.name,
    Email__c: candidate.email,
    Phone__c: candidate.phone,
  });
  if (existing[0]) {
    await salesforceUpdate("Candidate__c", { Id: existing[0].Id, ...payload });
    return existing[0].Id;
  }
  const created = await salesforceCreate("Candidate__c", payload);
  return created.id;
}

async function ensureApplication(candidate, talentCandidateId, jobId) {
  const existing = await salesforceQuery(`
    SELECT Id
    FROM Application__c
    WHERE Candidate__c = '${talentCandidateId}'
    AND Job_Opening__c = '${jobId}'
    LIMIT 1
  `);
  const payload = clean({
    Candidate__c: talentCandidateId,
    Job_Opening__c: jobId,
    Stage__c: toApplicationStage(candidate.finalStage || candidate.stage),
    Stage_Start_Date__c: today,
    Offer_Status__c: candidate.finalStage === "Hired" ? "Accepted" : candidate.stage === "Offer" ? "Sent" : "Not Started",
  });
  if (existing[0]) {
    await salesforceUpdate("Application__c", { Id: existing[0].Id, ...payload });
    return existing[0].Id;
  }
  const created = await salesforceCreate("Application__c", payload);
  return created.id;
}

async function ensureCandidateStage(candidateId, stage) {
  const [candidate] = await salesforceQuery(`
    SELECT Id, Stage__c
    FROM Candidate_Application__c
    WHERE Id = '${candidateId}'
    LIMIT 1
  `);
  if (!candidate || candidate.Stage__c === stage) return;
  await salesforceUpdate("Candidate_Application__c", {
    Id: candidateId,
    Stage__c: stage,
    Hire_Date__c: stage === "Hired" ? today : undefined,
  });
}

async function ensureInterview(interview, candidateId, applicationId) {
  const existing = await salesforceQuery(`
    SELECT Id
    FROM Interview__c
    WHERE Candidate_Application__c = '${candidateId}'
    AND Interview_Type__c = '${escapeSoql(interview.type)}'
    LIMIT 1
  `);
  const score = interview.score;
  const payload = clean({
    Application__c: applicationId,
    Candidate_Application__c: candidateId,
    Interview_Type__c: interview.type,
    Interview_Date__c: interview.status === "Scheduled" ? "2026-07-02T15:00:00.000+0000" : "2026-06-24T15:00:00.000+0000",
    Status__c: interview.status,
    Outcome__c: interview.outcome,
    Score__c: score,
    Technical_Score__c: score,
    Communication_Score__c: score,
    Problem_Solving_Score__c: score,
    Feedback__c: interview.feedback,
    Strengths__c: interview.strengths,
    Concerns__c: interview.concerns,
    Evidence__c: interview.evidence,
  });
  if (existing[0]) {
    await salesforceUpdate("Interview__c", { Id: existing[0].Id, ...payload });
    return existing[0].Id;
  }
  const created = await salesforceCreate("Interview__c", payload);
  return created.id;
}

async function ensureOffer(offer, candidateId) {
  const existing = await salesforceQuery(`
    SELECT Id, Status__c
    FROM Offer__c
    WHERE Candidate_Application__c = '${candidateId}'
    LIMIT 1
  `);
  const payload = clean({
    Candidate_Application__c: candidateId,
    Status__c: offer.status === "Accepted" ? "Sent" : offer.status,
    Salary__c: offer.salary,
    Start_Date__c: offer.startDate,
    Expiration_Date__c: offer.expirationDate,
  });
  let id;
  if (existing[0]) {
    id = existing[0].Id;
    await salesforceUpdate("Offer__c", { Id: id, ...payload });
  } else {
    const created = await salesforceCreate("Offer__c", payload);
    id = created.id;
  }
  if (offer.status === "Accepted") {
    await salesforceUpdate("Offer__c", { Id: id, Status__c: "Accepted" });
  }
  return id;
}

async function recruitingRecordTypeId() {
  const records = await salesforceQuery(`
    SELECT Id
    FROM RecordType
    WHERE SObjectType = 'Candidate_Application__c'
    AND DeveloperName = 'Recruiting'
    LIMIT 1
  `);
  return records[0]?.Id;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function toApplicationStage(stage) {
  return {
    Applied: "Applied",
    Screened: "Recruiter Screen",
    Interview: "Interview",
    Offer: "Final Interview",
    Hired: "Final Interview",
    Rejected: "Rejected",
  }[stage] || "Applied";
}

function clean(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== ""));
}

function escapeSoql(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
