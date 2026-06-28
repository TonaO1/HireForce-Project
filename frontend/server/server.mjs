import { createServer } from "node:http";
import {
  bookSchedulerSlot,
  createApplication,
  createInterview,
  createJob,
  getCalendarInterviews,
  getCandidate,
  getCandidates,
  getInterviews,
  getInterviewers,
  getJobs,
  getMyApplications,
  getMyOnboardingTasks,
  getOnboardingTasks,
  getSchedulerSlots,
  isSalesforceConfigured,
  updateCandidateStage,
  updateInterview,
  updateOnboardingTaskStatus,
} from "./salesforce.mjs";

const port = Number(process.env.PORT || process.env.API_PORT || 8787);

const server = createServer(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json(response, { ok: true, salesforceConfigured: isSalesforceConfigured(), schedulerConfigured: false });
    }

    if (!isSalesforceConfigured()) {
      return json(response, { error: "Salesforce is not configured on the backend." }, 503);
    }

    if (request.method === "GET" && url.pathname === "/api/jobs") {
      return json(response, await getJobs());
    }

    if (request.method === "POST" && url.pathname === "/api/jobs") {
      const body = await readJson(request);
      if (!body.title) return json(response, { error: "title is required." }, 400);
      return json(response, await createJob(body), 201);
    }

    if (request.method === "GET" && url.pathname === "/api/candidates") {
      return json(response, await getCandidates());
    }

    if (request.method === "GET" && url.pathname === "/api/applications/me") {
      return json(response, await getMyApplications(url.searchParams.get("email")));
    }

    if (request.method === "GET" && url.pathname === "/api/applications/me/onboarding") {
      return json(response, await getMyOnboardingTasks(url.searchParams.get("email")));
    }

    const candidateMatch = url.pathname.match(/^\/api\/candidates\/([a-zA-Z0-9]{15,18})$/);
    if (request.method === "GET" && candidateMatch) {
      const candidate = await getCandidate(candidateMatch[1]);
      return candidate ? json(response, candidate) : json(response, { error: "Candidate not found." }, 404);
    }

    const stageMatch = url.pathname.match(/^\/api\/candidates\/([a-zA-Z0-9]{15,18})\/stage$/);
    if (request.method === "PATCH" && stageMatch) {
      const body = await readJson(request);
      return json(response, await updateCandidateStage(stageMatch[1], body.stage));
    }

    if (request.method === "POST" && url.pathname === "/api/applications") {
      const body = await readJson(request);
      if (!body.jobId || !body.name || !body.email) {
        return json(response, { error: "jobId, name, and email are required." }, 400);
      }
      return json(response, await createApplication(body), 201);
    }

    if (request.method === "GET" && url.pathname === "/api/interviews") {
      return json(response, await getInterviews());
    }

    if (request.method === "POST" && url.pathname === "/api/interviews") {
      const body = await readJson(request);
      if (!body.candidateId || !body.scheduledAt) {
        return json(response, { error: "candidateId and scheduledAt are required." }, 400);
      }
      return json(response, await createInterview(body), 201);
    }

    const interviewMatch = url.pathname.match(/^\/api\/interviews\/([a-zA-Z0-9]{15,18})$/);
    if (request.method === "PATCH" && interviewMatch) {
      const body = await readJson(request);
      return json(response, await updateInterview(interviewMatch[1], body));
    }

    if (request.method === "GET" && url.pathname === "/api/onboarding") {
      return json(response, await getOnboardingTasks());
    }

    const onboardingMatch = url.pathname.match(/^\/api\/onboarding\/([a-zA-Z0-9]{15,18})$/);
    if (request.method === "PATCH" && onboardingMatch) {
      const body = await readJson(request);
      return json(response, await updateOnboardingTaskStatus(onboardingMatch[1], body.status));
    }

    if (request.method === "GET" && url.pathname === "/api/interviewers") {
      return json(response, await getInterviewers());
    }

    if (request.method === "GET" && url.pathname === "/api/calendar/interviews") {
      return json(response, await getCalendarInterviews(url.searchParams.get("from"), url.searchParams.get("to")));
    }

    if (request.method === "GET" && url.pathname === "/api/scheduler/slots") {
      return json(
        response,
        await getSchedulerSlots({
          interviewerId: url.searchParams.get("interviewerId"),
          start: url.searchParams.get("start"),
          end: url.searchParams.get("end"),
        }),
      );
    }

    if (request.method === "POST" && url.pathname === "/api/scheduler/book") {
      const body = await readJson(request);
      return json(response, await bookSchedulerSlot(body), 201);
    }

    return json(response, { error: "Not found." }, 404);
  } catch (error) {
    console.error(error);
    return json(response, { error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});

server.listen(port, () => {
  console.log(`HireForce Salesforce API listening on http://localhost:${port}`);
});

function setCors(response) {
  response.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(response, body, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}
