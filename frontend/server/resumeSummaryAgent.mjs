import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_WORDS = 250;
const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node",
  "Next.js",
  "Salesforce",
  "Apex",
  "Flow",
  "SQL",
  "Python",
  "Java",
  "C#",
  "AWS",
  "Azure",
  "Git",
  "Tableau",
  "Excel",
  "Power BI",
  "CRM",
  "Recruiting",
  "Onboarding",
  "Interviewing",
  "Project Management",
  "Customer Success",
  "Sales",
  "Marketing",
  "Operations",
  "Analytics",
  "Communication",
];

export async function createResumeSummary({ candidateName, roleTitle, jobDescription, resumeFile }) {
  if (!resumeFile?.base64 || !resumeFile?.name) return {};

  try {
    const text = await parseResumeFile(resumeFile);
    const cleanText = normalizeText(text);
    if (!cleanText) {
      return { resumeParsingError: "Resume parsing failed: no readable text was found in the attached file." };
    }

    return {
      resumeText: cleanText,
      resumeSummary: summarizeResume({
        candidateName,
        roleTitle,
        jobDescription,
        resumeText: cleanText,
      }),
    };
  } catch (error) {
    return {
      resumeParsingError: `Resume parsing failed: ${error instanceof Error ? error.message : "Unknown parser error."}`,
    };
  }
}

async function parseResumeFile(file) {
  const buffer = Buffer.from(file.base64, "base64");
  const lowerName = String(file.name).toLowerCase();
  const mimeType = String(file.mimeType || "").toLowerCase();

  if (lowerName.endsWith(".txt") || mimeType.includes("text/plain")) {
    return buffer.toString("utf8");
  }
  if (lowerName.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (lowerName.endsWith(".pdf") || mimeType.includes("pdf")) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  throw new Error("Unsupported resume type. Upload PDF, DOCX, or TXT.");
}

function summarizeResume({ candidateName, roleTitle, jobDescription, resumeText }) {
  const sentences = splitSentences(resumeText);
  const skills = extractSkills(resumeText, jobDescription).slice(0, 5);
  const experience = extractExperience(resumeText);
  const education = extractEducation(resumeText);
  const strongMatches = skills.length ? skills.slice(0, 3).join(", ") : "Not provided.";
  const gaps = jobDescription ? missingJobTerms(jobDescription, resumeText).slice(0, 3).join(", ") || "Not provided." : "Not provided.";
  const overview = buildOverview(sentences, skills, roleTitle);

  return trimToWords(`## Candidate Summary

**Name:** ${candidateName || "Not provided."}
**Applied Role:** ${roleTitle || "Not provided."}

### Quick Overview
${overview}

### Key Skills
${formatList(skills)}

### Relevant Experience
- Company/Project: ${experience.company}
  - Role: ${experience.role}
  - Main contributions: ${experience.contributions}
  - Technologies/tools used: ${skills.length ? skills.join(", ") : "Not provided."}

### Education
- Degree: ${education.degree}
- School: ${education.school}
- Graduation year, if available: ${education.year}

### Match Notes
- Strong match areas: ${strongMatches}
- Possible gaps: ${gaps}
- Questions recruiter may want to ask: Confirm recent hands-on experience with ${roleTitle || "the applied role"} responsibilities.

### Recruiter Recommendation
Needs further review before screening.`);
}

function buildOverview(sentences, skills, roleTitle) {
  const selected = sentences
    .filter((sentence) => !containsProtectedSignal(sentence))
    .slice(0, 2);
  if (selected.length) return selected.join(" ");
  if (skills.length) {
    return `Resume lists experience or skills relevant to ${roleTitle || "the applied role"}, including ${skills.slice(0, 3).join(", ")}. Experience level is not provided.`;
  }
  return "Background and experience level are not provided in readable resume text.";
}

function extractSkills(text, jobDescription = "") {
  const source = `${text} ${jobDescription}`.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => source.includes(skill.toLowerCase()));
}

function extractExperience(text) {
  const lines = cleanLines(text);
  const roleLine = lines.find((line) => /\b(engineer|manager|analyst|specialist|coordinator|representative|associate|developer|consultant|recruiter)\b/i.test(line));
  const companyLine = lines.find((line) => /\b(inc|llc|corp|company|solutions|systems|university|project)\b/i.test(line));
  const contribution = splitSentences(text).find((sentence) => /\b(built|managed|led|created|improved|supported|designed|implemented|analyzed|coordinated)\b/i.test(sentence));
  return {
    company: companyLine || "Not provided.",
    role: roleLine || "Not provided.",
    contributions: contribution || "Not provided.",
  };
}

function extractEducation(text) {
  const lines = cleanLines(text);
  const degreeLine = lines.find((line) => /\b(bachelor|master|associate|degree|b\.s\.|b\.a\.|m\.s\.|mba|phd)\b/i.test(line));
  const schoolLine = lines.find((line) => /\b(university|college|school|institute)\b/i.test(line));
  const year = text.match(/\b(20[0-4]\d|19[8-9]\d)\b/)?.[0];
  return {
    degree: degreeLine || "Not provided.",
    school: schoolLine || "Not provided.",
    year: year || "Not provided.",
  };
}

function missingJobTerms(jobDescription, resumeText) {
  const resume = resumeText.toLowerCase();
  return extractKeywords(jobDescription).filter((term) => !resume.includes(term.toLowerCase()));
}

function extractKeywords(text) {
  const stop = new Set(["with", "that", "this", "from", "have", "will", "role", "team", "work", "and", "the", "for"]);
  return Array.from(
    new Set(
      normalizeText(text)
        .split(/\W+/)
        .filter((word) => word.length > 3 && !stop.has(word.toLowerCase()))
        .slice(0, 12),
    ),
  );
}

function formatList(items) {
  const values = items.length ? items : ["Not provided."];
  return values.map((item) => `- ${item}`).join("\n");
}

function splitSentences(text) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25 && sentence.length < 220);
}

function cleanLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 3 && line.length < 140);
}

function normalizeText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function trimToWords(markdown) {
  const words = markdown.split(/\s+/);
  return words.length <= MAX_WORDS ? markdown : `${words.slice(0, MAX_WORDS).join(" ")}...`;
}

function containsProtectedSignal(text) {
  return /\b(age|race|gender|religion|disabled|disability|nationality|married|pregnant|veteran)\b/i.test(text);
}
