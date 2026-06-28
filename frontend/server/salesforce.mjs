import { execFile } from "node:child_process";
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let cachedAuth = null;
let cachedAt = 0;
let recruitingRecordTypeId = null;
const CACHE_MS = 10 * 60 * 1000;

loadEnv(".env");
loadEnv(".env.local");

export function isSalesforceConfigured() {
  return Boolean(
    process.env.SALESFORCE_AUTH_MODE === "cli" ||
      (process.env.SALESFORCE_CLIENT_ID &&
        process.env.SALESFORCE_USERNAME &&
        process.env.SALESFORCE_PRIVATE_KEY),
  );
}

export async function getJobs() {
  const records = await salesforceQuery(`
    SELECT Id, Name, Job_Title__c, Status__c, Priority__c, Headcount__c, Target_Start_Date__c,
           Description__c, CreatedDate, Department__r.Name
    FROM Job_Opening__c
    ORDER BY CreatedDate DESC
  `);

  const applications = await getCandidates();
  return records.map((record) => {
    const job = mapJob(record);
    return {
      ...job,
      applicantCount: applications.filter((candidate) => candidate.jobId === job.id).length,
    };
  });
}

export async function createJob(input) {
  const departmentId = await findDepartmentId(input.department);
  const result = await salesforceCreate(
    "Job_Opening__c",
    compact({
      Name: requiredInput(input.title, "title"),
      Job_Title__c: requiredInput(input.title, "title"),
      Status__c: "Open",
      Department__c: departmentId,
      Description__c: input.description,
      Headcount__c: input.headcount ? Number(input.headcount) : undefined,
      Priority__c: input.priority,
      Target_Start_Date__c: input.targetStartDate,
    }),
  );
  const job = await getJob(result.id);
  return job || {
    id: result.id,
    title: input.title,
    department: input.department || "Unassigned",
    location: input.location || "Remote / Hybrid",
    status: "open",
    applicantCount: 0,
    description: input.description || "No role description has been entered yet.",
  };
}

async function getJob(id) {
  assertSalesforceId(id);
  const records = await salesforceQuery(`
    SELECT Id, Name, Job_Title__c, Status__c, Priority__c, Headcount__c, Target_Start_Date__c,
           Description__c, CreatedDate, Department__r.Name
    FROM Job_Opening__c
    WHERE Id = '${id}'
    LIMIT 1
  `);
  return records[0] ? { ...mapJob(records[0]), applicantCount: 0 } : null;
}

export async function getCandidates() {
  const records = await salesforceQuery(`
    SELECT Id, Name, Stage__c, Email__c, Phone__c, Applied_Date__c, Hire_Date__c,
           Last_Contact_Date__c, Touchpoint_Count__c, Rejection_Reason__c, CreatedDate,
           LastModifiedDate, Job_Opening__c, Job_Opening__r.Name, Job_Opening__r.Job_Title__c, Job_Opening__r.Status__c,
           Job_Opening__r.Priority__c, Job_Opening__r.Description__c,
           Job_Opening__r.CreatedDate, Job_Opening__r.Department__r.Name
    FROM Candidate_Application__c
    ORDER BY LastModifiedDate DESC
    LIMIT 100
  `);
  const ids = records.map((record) => record.Id);
  const interviews = await getInterviewsByApplicationIds(ids);
  return records.map((record) => mapCandidate(record, interviews.filter((item) => item.candidateId === record.Id)));
}

export async function getCandidate(id) {
  assertSalesforceId(id);
  const records = await salesforceQuery(`
    SELECT Id, Name, Stage__c, Email__c, Phone__c, Applied_Date__c, Hire_Date__c,
           Last_Contact_Date__c, Touchpoint_Count__c, Rejection_Reason__c, CreatedDate,
           LastModifiedDate, Job_Opening__c, Job_Opening__r.Name, Job_Opening__r.Job_Title__c, Job_Opening__r.Status__c,
           Job_Opening__r.Priority__c, Job_Opening__r.Description__c,
           Job_Opening__r.CreatedDate, Job_Opening__r.Department__r.Name
    FROM Candidate_Application__c
    WHERE Id = '${id}'
    LIMIT 1
  `);
  if (!records[0]) return null;
  const interviews = await getInterviewsByApplicationIds([id]);
  return mapCandidate(records[0], interviews);
}

export async function createApplication(input) {
  const recordTypeId = await getRecruitingRecordTypeId();
  const payload = compact({
    Name: input.name,
    Email__c: input.email,
    Phone__c: input.phone,
    Job_Opening__c: assertSalesforceId(input.jobId),
    Stage__c: "Applied",
    Applied_Date__c: today(),
    Last_Contact_Date__c: today(),
    Touchpoint_Count__c: 1,
    RecordTypeId: recordTypeId,
  });

  const result = await salesforceCreate("Candidate_Application__c", payload);
  try {
    await salesforceCreate("Task", {
      WhatId: result.id,
      Subject: "Review new website application",
      Status: "Not Started",
      Priority: "High",
      ActivityDate: addDays(1),
    });
  } catch {
    // Task creation is helpful for recruiters, but application creation is the critical path.
  }
  return getCandidate(result.id);
}

export async function updateCandidateStage(id, stage) {
  const salesforceStage = toSalesforceStage(stage);
  const payload = {
    Id: assertSalesforceId(id),
    Stage__c: salesforceStage,
    Last_Contact_Date__c: today(),
  };
  if (salesforceStage === "Hired") payload.Hire_Date__c = today();
  if (salesforceStage === "Rejected") payload.Rejection_Reason__c = "Other job-related reason";
  await salesforceUpdate("Candidate_Application__c", payload);
  return getCandidate(id);
}

export async function getInterviews() {
  const records = await salesforceQuery(`
    SELECT Id, Candidate_Application__c, Candidate_Application__r.Name, Interview_Date__c,
           Interview_Type__c, Status__c, Interviewer__r.Name, Outcome__c, Score__c,
           Feedback__c, Strengths__c, Concerns__c, Evidence__c, CreatedDate
    FROM Interview__c
    ORDER BY Interview_Date__c DESC
    LIMIT 100
  `);
  return records.map(mapInterview);
}

export async function updateInterview(id, input) {
  const interviewId = assertSalesforceId(id);
  const score = input.score === undefined || input.score === "" ? undefined : Number(input.score);
  const salesforceOutcome = toSalesforceInterviewOutcome(input.outcome);
  const payload = compact({
    Id: interviewId,
    Status__c: input.status || (input.outcome === "pending" ? "Scheduled" : salesforceOutcome ? "Completed" : undefined),
    Outcome__c: salesforceOutcome,
    Score__c: score,
    Technical_Score__c: score,
    Communication_Score__c: score,
    Problem_Solving_Score__c: score,
    Feedback__c: input.feedback,
    Strengths__c: input.strengths,
    Concerns__c: input.concerns,
    Evidence__c: input.evidence,
  });
  await salesforceUpdate("Interview__c", payload);
  return getInterview(interviewId);
}

async function getInterview(id) {
  assertSalesforceId(id);
  const records = await salesforceQuery(`
    SELECT Id, Candidate_Application__c, Candidate_Application__r.Name, Interview_Date__c,
           Interview_Type__c, Status__c, Interviewer__r.Name, Outcome__c, Score__c,
           Feedback__c, Strengths__c, Concerns__c, Evidence__c, CreatedDate
    FROM Interview__c
    WHERE Id = '${id}'
    LIMIT 1
  `);
  return records[0] ? mapInterview(records[0]) : null;
}

export async function getOnboardingTasks() {
  const records = await salesforceQuery(`
    SELECT Id, Name, Task_Name__c, Candidate_Application__c, Candidate_Application__r.Name,
           Status__c, Due_Date__c, CreatedDate
    FROM Onboarding_Task__c
    ORDER BY Due_Date__c ASC
    LIMIT 100
  `);
  return records.map(mapOnboardingTask);
}

async function getInterviewsByApplicationIds(ids) {
  if (!ids.length) return [];
  const records = await salesforceQuery(`
    SELECT Id, Candidate_Application__c, Candidate_Application__r.Name, Interview_Date__c,
           Interview_Type__c, Status__c, Interviewer__r.Name, Outcome__c, Score__c,
           Feedback__c, Strengths__c, Concerns__c, Evidence__c, CreatedDate
    FROM Interview__c
    WHERE Candidate_Application__c IN (${ids.map((id) => `'${assertSalesforceId(id)}'`).join(",")})
    ORDER BY Interview_Date__c DESC
  `);
  return records.map(mapInterview);
}

async function getRecruitingRecordTypeId() {
  if (recruitingRecordTypeId !== null) return recruitingRecordTypeId;
  const records = await salesforceQuery(`
    SELECT Id
    FROM RecordType
    WHERE SObjectType = 'Candidate_Application__c'
    AND DeveloperName = 'Recruiting'
    LIMIT 1
  `);
  recruitingRecordTypeId = records[0]?.Id || undefined;
  return recruitingRecordTypeId;
}

async function findDepartmentId(name) {
  if (!name) return undefined;
  if (/^[a-zA-Z0-9]{15,18}$/.test(name)) return name;
  try {
    const records = await salesforceQuery(`
      SELECT Id
      FROM Department__c
      WHERE Name = '${escapeSoqlString(name)}'
      LIMIT 1
    `);
    return records[0]?.Id;
  } catch {
    return undefined;
  }
}

async function salesforceQuery(soql) {
  const auth = await salesforceAuth();
  const response = await fetch(
    `${auth.instanceUrl}/services/data/v${apiVersion()}/query?q=${encodeURIComponent(soql)}`,
    { headers: { Authorization: `Bearer ${auth.accessToken}` } },
  );
  const body = await response.json();
  if (!response.ok) throw new Error(`Salesforce query failed: ${JSON.stringify(body)}`);
  return body.records || [];
}

async function salesforceCreate(objectName, data) {
  const auth = await salesforceAuth();
  const response = await fetch(`${auth.instanceUrl}/services/data/v${apiVersion()}/sobjects/${objectName}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Salesforce create failed: ${JSON.stringify(body)}`);
  return body;
}

async function salesforceUpdate(objectName, data) {
  const auth = await salesforceAuth();
  const { Id, ...fields } = data;
  const response = await fetch(`${auth.instanceUrl}/services/data/v${apiVersion()}/sobjects/${objectName}/${Id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Salesforce update failed: ${body}`);
  }
}

async function salesforceAuth() {
  if (cachedAuth && Date.now() - cachedAt < CACHE_MS) return cachedAuth;
  cachedAuth = process.env.SALESFORCE_AUTH_MODE === "cli" ? await cliAuth() : await jwtAuth();
  cachedAt = Date.now();
  return cachedAuth;
}

async function cliAuth() {
  const alias = process.env.SALESFORCE_ORG_ALIAS || "patriot-dev";
  const [tokenOutput, orgOutput] = await Promise.all([
    runSalesforceCli(["org", "auth", "show-access-token", "--target-org", alias, "--json"]),
    runSalesforceCli(["org", "display", "--target-org", alias, "--json"]),
  ]);
  const token = JSON.parse(tokenOutput.stdout);
  const org = JSON.parse(orgOutput.stdout);
  const accessToken = token.result?.accessToken || token.result;
  const instanceUrl = org.result?.instanceUrl || process.env.SALESFORCE_INSTANCE_URL;
  if (!accessToken || !instanceUrl) throw new Error("Salesforce CLI auth did not return an access token and instance URL.");
  return { accessToken, instanceUrl };
}

async function runSalesforceCli(args) {
  const cliPath = process.env.SALESFORCE_CLI_PATH || "sf";
  if (process.platform === "win32" && cliPath.toLowerCase().endsWith(".cmd")) {
    return execFileAsync("cmd.exe", ["/d", "/c", cliPath, ...args], { windowsHide: true });
  }
  return execFileAsync(cliPath, args, { windowsHide: true });
}

async function jwtAuth() {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";
  const assertion = signJwt(
    {
      iss: requiredEnv("SALESFORCE_CLIENT_ID"),
      sub: requiredEnv("SALESFORCE_USERNAME"),
      aud: loginUrl,
      exp: Math.floor(Date.now() / 1000) + 180,
    },
    requiredEnv("SALESFORCE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  );
  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Salesforce JWT auth failed: ${JSON.stringify(body)}`);
  return { accessToken: body.access_token, instanceUrl: body.instance_url || process.env.SALESFORCE_INSTANCE_URL };
}

function mapJob(record) {
  return {
    id: record.Id,
    title: record.Job_Title__c || record.Name,
    department: record.Department__r?.Name || "Unassigned",
    location: "Remote / Hybrid",
    status: toJobStatus(record.Status__c),
    applicantCount: 0,
    description: record.Description__c || "No role description has been entered yet.",
    createdAt: record.CreatedDate,
  };
}

function mapCandidate(record, interviews) {
  return {
    id: record.Id,
    name: record.Name,
    email: record.Email__c || "",
    roleApplied: record.Job_Opening__r?.Job_Title__c || record.Job_Opening__r?.Name || "Unknown role",
    jobId: record.Job_Opening__c,
    stage: toFrontendStage(record.Stage__c),
    appliedAt: record.Applied_Date__c || record.CreatedDate || today(),
    resumeUrl: "",
    avatarInitials: initials(record.Name),
    score: Number(record.Touchpoint_Count__c || 0) ? Math.min(100, 60 + Number(record.Touchpoint_Count__c || 0) * 5) : undefined,
    interviews,
    notes: record.Rejection_Reason__c ? `Rejection reason: ${record.Rejection_Reason__c}` : undefined,
  };
}

function mapInterview(record) {
  return {
    id: record.Id,
    candidateId: record.Candidate_Application__c || "",
    candidateName: record.Candidate_Application__r?.Name || "Unlinked interview",
    scheduledAt: record.Interview_Date__c || record.CreatedDate || new Date().toISOString(),
    interviewer: record.Interviewer__r?.Name || "Assigned interviewer",
    feedback: record.Feedback__c || record.Strengths__c || record.Evidence__c || undefined,
    outcome: toInterviewOutcome(record.Outcome__c, record.Status__c),
    type: record.Interview_Type__c || "Interview",
    status: record.Status__c || "Scheduled",
    score: record.Score__c,
    strengths: record.Strengths__c || undefined,
    concerns: record.Concerns__c || undefined,
    evidence: record.Evidence__c || undefined,
  };
}

function mapOnboardingTask(record) {
  return {
    id: record.Id,
    candidateId: record.Candidate_Application__c,
    candidateName: record.Candidate_Application__r?.Name || "New hire",
    title: record.Task_Name__c || record.Name,
    status: toOnboardingStatus(record.Status__c),
    triggeredAt: record.CreatedDate || record.Due_Date__c || today(),
  };
}

function toFrontendStage(stage) {
  return {
    Applied: "applied",
    Screened: "screened",
    Interview: "interview",
    Offer: "offer",
    Hired: "hired",
    Rejected: "rejected",
  }[stage] || "applied";
}

function toSalesforceStage(stage) {
  return {
    applied: "Applied",
    screened: "Screened",
    interview: "Interview",
    offer: "Offer",
    hired: "Hired",
    rejected: "Rejected",
  }[stage] || "Applied";
}

function toJobStatus(status) {
  return status === "Open" ? "open" : status === "Filled" || status === "Cancelled" ? "closed" : "draft";
}

function toInterviewOutcome(outcome, status) {
  if (outcome === "Strong Hire" || outcome === "Hire") return "pass";
  if (outcome === "No Hire") return "fail";
  if (status === "Completed") return "pass";
  return "pending";
}

function toSalesforceInterviewOutcome(outcome) {
  return {
    pass: "Hire",
    fail: "No Hire",
    pending: "Needs Follow-up",
    "Strong Hire": "Strong Hire",
    Hire: "Hire",
    "Needs Follow-up": "Needs Follow-up",
    "No Hire": "No Hire",
  }[outcome];
}

function toOnboardingStatus(status) {
  return status === "Done" ? "done" : status === "In Progress" ? "in_progress" : "pending";
}

function signJwt(payload, privateKey) {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify(payload));
  const unsigned = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${base64Url(signature)}`;
}

function base64Url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function assertSalesforceId(id) {
  if (!/^[a-zA-Z0-9]{15,18}$/.test(id)) throw new Error("Invalid Salesforce record id.");
  return id;
}

function compact(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== ""));
}

function requiredInput(value, key) {
  if (!value || !String(value).trim()) throw new Error(`${key} is required.`);
  return String(value).trim();
}

function escapeSoqlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "HF";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function apiVersion() {
  return process.env.SALESFORCE_API_VERSION || "67.0";
}

function requiredEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required Salesforce environment variable: ${key}`);
  return value;
}

function loadEnv(fileName) {
  if (!existsSync(fileName)) return;
  const text = readFileSync(fileName, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
