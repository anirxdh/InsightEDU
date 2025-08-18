// Minimal RAG ingestion and storage utility (no agent)
// Step 1: Build documents with simple metadata and persist locally

import graduationData from "../data/graduationOutcomes.json";
import gpaData from "../data/final_agg_gpa.json";
import demographicsData from "../data/final_agg_demo.json";
import frpData from "../data/final_agg_frp.json";
import staffData from "../data/staff.json";
import attendanceData from "../data/chronicAbsenteeism.json";

const STORAGE_KEY = "rag_documents";

function safePercent(value) {
  const num = Number(value);
  if (Number.isFinite(num)) return (num * 100).toFixed(1) + "%";
  return String(value);
}

function toNumeric(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toCountOrNull(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const s = String(value).toLowerCase();
  if (s.includes("small count")) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function slug(x) {
  return String(x)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeKeys(obj) {
  return obj && typeof obj === "object" && !Array.isArray(obj) ? Object.keys(obj) : [];
}

// ---------- Graduation documents in requested schema ----------
function makeGraduationOverallDoc() {
  const { graduated, not_graduated } = graduationData.overall || {};
  const text = `Overall graduation outcomes: ${safePercent(graduated)} graduated and ${safePercent(not_graduated)} did not graduate.`;
  return {
    id: "graduation:overall",
    text,
    pageContent: text,
    metadata: { dataset: "graduation", breakdown: "overall", graduated: toNumeric(graduated), not_graduated: toNumeric(not_graduated) },
  };
}

function makeGraduationChronicallyAbsentDocs() {
  const rows = graduationData.chronically_absent || [];
  return rows.map((r) => {
    const text = `Graduation by chronic absenteeism: among students ${r.label}, ${safePercent(r.graduated)} graduated and ${safePercent(r.not_graduated)} did not graduate.`;
    return {
      id: `graduation:chronically_absent:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "chronically_absent", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationEnglishLearnerDocs() {
  const rows = graduationData.english_learner_flag || [];
  return rows.map((r) => {
    const text = `Graduation by English learner status: ${r.label} had a ${safePercent(r.graduated)} graduation rate and ${safePercent(r.not_graduated)} did not graduate.`;
    return {
      id: `graduation:english_learner_flag:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "english_learner_flag", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationFrpDocs() {
  const rows = graduationData.frp_eligible_flag || [];
  return rows.map((r) => {
    const text = `Graduation by FRP eligibility: ${r.label} students graduated at ${safePercent(r.graduated)}, while ${safePercent(r.not_graduated)} did not graduate.`;
    return {
      id: `graduation:frp_eligible_flag:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "frp_eligible_flag", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationGenderDocs() {
  const rows = graduationData.gender || [];
  return rows.map((r) => {
    const text = `Graduation by gender: ${r.label} students graduated at ${safePercent(r.graduated)}, with ${safePercent(r.not_graduated)} not graduating.`;
    return {
      id: `graduation:gender:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "gender", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationRaceDocs() {
  const rows = graduationData.federal_race_code || [];
  return rows.map((r) => {
    const text = `Graduation by race code ${r.label}: ${safePercent(r.graduated)} graduated and ${safePercent(r.not_graduated)} did not graduate.`;
    return {
      id: `graduation:federal_race_code:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "federal_race_code", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationSpedDocs() {
  const rows = graduationData.special_education_flag || [];
  return rows.map((r) => {
    const text = `Graduation by special education status: ${r.label} students graduated at ${safePercent(r.graduated)}, with ${safePercent(r.not_graduated)} not graduating.`;
    return {
      id: `graduation:special_education_flag:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "special_education_flag", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationYearDocs() {
  const rows = graduationData.year || [];
  return rows.map((r) => {
    const text = `Graduation in ${r.label}: ${safePercent(r.graduated)} graduated and ${safePercent(r.not_graduated)} did not graduate.`;
    return {
      id: `graduation:year:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "graduation", breakdown: "year", label: r.label, graduated: toNumeric(r.graduated), not_graduated: toNumeric(r.not_graduated) },
    };
  });
}

function makeGraduationDocs() {
  return [
    makeGraduationOverallDoc(),
    ...makeGraduationChronicallyAbsentDocs(),
    ...makeGraduationEnglishLearnerDocs(),
    ...makeGraduationFrpDocs(),
    ...makeGraduationGenderDocs(),
    ...makeGraduationRaceDocs(),
    ...makeGraduationSpedDocs(),
    ...makeGraduationYearDocs(),
  ];
}

// ---------- GPA documents (Overall, Year, Gender, Grade, Race, Chronically Absent) ----------
function makeGpaOverallDoc() {
  const rows = (gpaData.Overall && gpaData.Overall.All) || [];
  const parts = rows.length
    ? rows.map((r) => `${safePercent(r.Percent)} ${r.Category} (${toCountOrNull(r.Count) ?? "masked"})`)
    : ["no data available"];
  const text = `Overall GPA distribution: ${parts.join(", ")}.`;
  return {
    id: "gpa:overall",
    text,
    pageContent: text,
    metadata: {
      dataset: "gpa",
      breakdown: "overall",
      labels: rows.map((r) => r.Category),
      counts: rows.map((r) => toCountOrNull(r.Count)),
      percents: rows.map((r) => Number(r.Percent)),
    },
  };
}

function makeGpaByGroupDocs(groupKey, breakdown) {
  const group = gpaData[groupKey] || {};
  const labels = safeKeys(group);
  return labels.map((label) => {
    const rows = group[label] || [];
    const parts = rows.map((r) => `${safePercent(r.Percent)} ${r.Category} (${toCountOrNull(r.Count) ?? "masked"})`);
    const nice = breakdown.replace(/_/g, " ");
    const text = `GPA distribution by ${nice}: ${label} — ${parts.join(", ")}.`;
    return {
      id: `gpa:${breakdown}:${slug(label)}`,
      text,
      pageContent: text,
      metadata: {
        dataset: "gpa",
        breakdown,
        label,
        labels: rows.map((r) => r.Category),
        counts: rows.map((r) => toCountOrNull(r.Count)),
        percents: rows.map((r) => toNumeric(r.Percent, null)),
      },
    };
  });
}

function makeGpaDocs() {
  return [
    makeGpaOverallDoc(),
    ...makeGpaByGroupDocs("Year", "year"),
    ...makeGpaByGroupDocs("Gender", "gender"),
    ...makeGpaByGroupDocs("Grade", "grade"),
    ...makeGpaByGroupDocs("Race", "race"),
    ...makeGpaByGroupDocs("Chronically Absent", "chronically_absent"),
  ];
}

// ---------- Demographics documents (race composition across breakdowns) ----------
function formatRaceParts(rows) {
  return rows.map((r) => `code ${r.Category}: ${safePercent(r.Percent)}${toCountOrNull(r.Count) != null ? ` (${toCountOrNull(r.Count)})` : ""}`);
}

function makeDemographicsOverallDoc() {
  const rows = demographicsData.Overall || [];
  const text = `Overall race composition: ${formatRaceParts(rows).join(", ")}.`;
  return {
    id: "demographics:overall:race",
    text,
    pageContent: text,
    metadata: {
      dataset: "demographics",
      breakdown: "overall",
      labels: rows.map((r) => String(r.Category)),
      counts: rows.map((r) => toCountOrNull(r.Count)),
      percents: rows.map((r) => Number(r.Percent)),
    },
  };
}

function makeDemographicsByGroupDocs(groupKey, breakdown) {
  const group = demographicsData[groupKey] || {};
  const labels = safeKeys(group);
  return labels.map((label) => {
    const rows = group[label] || [];
    const parts = formatRaceParts(rows);
    const nice = breakdown.replace(/_/g, " ");
    const text = `Race composition by ${nice}: ${label} — ${parts.join(", ")}.`;
    return {
      id: `demographics:${breakdown}:${slug(label)}`,
      text,
      pageContent: text,
      metadata: {
        dataset: "demographics",
        breakdown,
        label,
        labels: rows.map((r) => String(r.Category)),
        counts: rows.map((r) => toCountOrNull(r.Count)),
        percents: rows.map((r) => toNumeric(r.Percent, null)),
      },
    };
  });
}

function makeDemographicsDocs() {
  return [
    makeDemographicsOverallDoc(),
    ...makeDemographicsByGroupDocs("Year", "year"),
    ...makeDemographicsByGroupDocs("Gender", "gender"),
    ...makeDemographicsByGroupDocs("Grade Group", "grade_group"),
    ...makeDemographicsByGroupDocs("FRP", "frp"),
    ...makeDemographicsByGroupDocs("Chronic Absenteesim", "chronic_absenteeism"),
    ...makeDemographicsByGroupDocs("School Number", "school_id"),
  ];
}

// ---------- FRP documents (F/R/S distribution across breakdowns) ----------
function formatFrpParts(rows) {
  return rows.map((r) => `${r.Category}: ${safePercent(r.Percent)}${toCountOrNull(r.Count) != null ? ` (${toCountOrNull(r.Count)})` : ""}`);
}

function makeFrpOverallDoc() {
  const rows = frpData.Overall || [];
  const text = `Overall FRP distribution: ${formatFrpParts(rows).join(", ")}.`;
  return {
    id: "frp:overall",
    text,
    pageContent: text,
    metadata: {
      dataset: "frp",
      breakdown: "overall",
      labels: rows.map((r) => r.Category),
      counts: rows.map((r) => toCountOrNull(r.Count)),
      percents: rows.map((r) => Number(r.Percent)),
    },
  };
}

function makeFrpByGroupDocs(groupKey, breakdown) {
  const group = frpData[groupKey] || {};
  const labels = safeKeys(group);
  return labels.map((label) => {
    const rows = group[label] || [];
    const parts = formatFrpParts(rows);
    const nice = breakdown.replace(/_/g, " ");
    const text = `FRP distribution by ${nice}: ${label} — ${parts.join(", ")}.`;
    return {
      id: `frp:${breakdown}:${slug(label)}`,
      text,
      pageContent: text,
      metadata: {
        dataset: "frp",
        breakdown,
        label,
        labels: rows.map((r) => r.Category),
        counts: rows.map((r) => toCountOrNull(r.Count)),
        percents: rows.map((r) => toNumeric(r.Percent, null)),
      },
    };
  });
}

function makeFrpDocs() {
  return [
    makeFrpOverallDoc(),
    ...makeFrpByGroupDocs("Year", "year"),
    ...makeFrpByGroupDocs("Gender", "gender"),
    ...makeFrpByGroupDocs("Grade group", "grade_group"),
    ...makeFrpByGroupDocs("Race", "race"),
    ...makeFrpByGroupDocs("School Number", "school_id"),
    ...makeFrpByGroupDocs("Chronic Absenteeism", "chronic_absenteeism"),
  ];
}

// ---------- Staff documents in the requested schema ----------
function makeStaffOverallTenureDoc() {
  const rows = staffData.overall || [];
  const parts = rows.map((r) => {
    const pct = safePercent(r.percent);
    const label = r.label;
    if (r.count == null) return `${pct} have ${label} (masked)`;
    return `${pct} have ${label} (${r.count})`;
  });
  // Build masked tail note if any
  const masked = rows.filter((r) => r.count == null).map((r) => r.label);
  let sentence = `Staff tenure distribution: ${parts.join(", ")}.`;
  if (masked.length > 0) {
    const last = masked.length === 1 ? masked[0] : `${masked.slice(0, -1).join(", ")} and ${masked[masked.length - 1]}`;
    sentence = `Staff tenure distribution: ${rows
      .filter((r) => r.count != null)
      .map((r) => `${safePercent(r.percent)} have ${r.label} (${r.count})`)
      .join(", ")}${rows.some((r) => r.count != null) ? ", " : ""}and counts for ${last} are masked.`;
  }
  return {
    id: "staff:overall:tenure",
    text: sentence,
    pageContent: sentence,
    metadata: {
      dataset: "staff",
      breakdown: "overall",
      categories: rows.map((r) => r.label),
      counts: rows.map((r) => r.count ?? null),
    },
  };
}

function makeStaffRaceDoc() {
  const rows = staffData.race || [];
  const textSeq = rows.map((r, idx) => {
    const pct = safePercent(r.percent);
    const prefix = idx === rows.length - 1 && rows.length > 1 ? "and " : "";
    return `${prefix}code ${r.label} is ${pct} (${r.count})`;
  });
  const sentence = `Staff racial composition: ${textSeq.join(", ")}.`;
  return {
    id: "staff:race",
    text: sentence,
    pageContent: sentence,
    metadata: {
      dataset: "staff",
      breakdown: "race",
      labels: rows.map((r) => String(r.label)),
      counts: rows.map((r) => r.count ?? null),
    },
  };
}

function makeStaffGenderDoc() {
  const rows = staffData.gender || [];
  // Expecting Female, Male
  const parts = rows.map((r) => `${safePercent(r.percent)} are ${r.label.toLowerCase()} (${r.count})`);
  const sentence = `Staff gender distribution: ${parts.join(" and ")}.`;
  return {
    id: "staff:gender",
    text: sentence,
    pageContent: sentence,
    metadata: {
      dataset: "staff",
      breakdown: "gender",
      labels: rows.map((r) => r.label),
      counts: rows.map((r) => r.count ?? null),
    },
  };
}

function makeStaffCategoryDoc() {
  const rows = staffData.category || [];
  const textSeq = rows.map((r, idx) => {
    const pct = safePercent(r.percent);
    const prefix = idx === rows.length - 1 && rows.length > 1 ? "and " : "";
    return `${prefix}${r.label} ${pct} (${r.count})`;
  });
  const sentence = `Staff role categories: ${textSeq.join(", ")}.`;
  return {
    id: "staff:category",
    text: sentence,
    pageContent: sentence,
    metadata: {
      dataset: "staff",
      breakdown: "category",
      labels: rows.map((r) => r.label),
      counts: rows.map((r) => r.count ?? null),
    },
  };
}

function makeStaffYearDoc() {
  const rows = staffData.year || [];
  const parts = rows.map((r) => `${r.count} in ${r.label} (${safePercent(r.percent)})`);
  const sentence = `Staff counts by year: ${parts.join(", ")}.`;
  return {
    id: "staff:year",
    text: sentence,
    pageContent: sentence,
    metadata: {
      dataset: "staff",
      breakdown: "year",
      years: rows.map((r) => r.label),
      counts: rows.map((r) => r.count ?? null),
    },
  };
}

function makeStaffDegreeDoc() {
  const rows = staffData.highest_degree || [];
  const groups = {
    Masters: { percent: 0, count: 0 },
    Bachelors: { percent: 0, count: 0 },
    Specialist: { percent: 0, count: 0 },
    Doctorate: { percent: 0, count: 0 },
  };
  let anyMasked = false;
  rows.forEach((r) => {
    const label = (r.label || "").toUpperCase();
    if (label.includes("MASTER")) {
      groups.Masters.percent += r.percent || 0;
      if (r.count != null) groups.Masters.count += r.count;
      if (r.count == null) anyMasked = true;
    } else if (label.includes("BACHELOR")) {
      groups.Bachelors.percent += r.percent || 0;
      if (r.count != null) groups.Bachelors.count += r.count;
      if (r.count == null) anyMasked = true;
    } else if (label.includes("SPECIALIST")) {
      groups.Specialist.percent += r.percent || 0;
      if (r.count != null) groups.Specialist.count += r.count;
      if (r.count == null) anyMasked = true;
    } else if (label.includes("DOCTORATE")) {
      groups.Doctorate.percent += r.percent || 0;
      if (r.count != null) groups.Doctorate.count += r.count;
      if (r.count == null) anyMasked = true;
    }
  });
  const labels = ["Masters", "Bachelors", "Specialist", "Doctorate"];
  const counts = labels.map((l) => groups[l].count);
  const percents = labels.map((l) => Number(groups[l].percent.toFixed(3)));
  const parts = labels.map((l) => `${safePercent(groups[l].percent)} of staff hold a ${l === "Bachelors" ? "Bachelor’s" : l === "Masters" ? "Master’s" : l} degree (${groups[l].count})`);
  const sentence = `Highest degree attainment: ${parts.join(", ")}. ${anyMasked ? "Some sub-categories are masked due to low counts." : ""}`.trim();
  return {
    id: "staff:degree",
    text: sentence,
    pageContent: sentence,
    metadata: {
      dataset: "staff",
      breakdown: "highest_degree",
      labels,
      counts,
      percents,
    },
  };
}

// ---------- Attendance documents (overall + per breakdown item + yearly trend) ----------
function makeAttendanceOverallDoc() {
  const o = attendanceData.overall || {};
  const text = `Chronic absenteeism overall: ${safePercent(o.percent)}${o.count != null ? ` (n=${o.count})` : ""}.`;
  return {
    id: "attendance:overall",
    text,
    pageContent: text,
    metadata: { dataset: "attendance", breakdown: "overall", percent: o.percent, count: o.count ?? null },
  };
}

function makeAttendanceByArrayDocs(arrKey, breakdown) {
  const rows = attendanceData[arrKey] || [];
  return rows.map((r) => {
    const text = `Chronic absenteeism by ${breakdown.replace(/_/g, " ")}: ${r.label} — ${safePercent(r.percent)}${r.count != null ? ` (n=${r.count})` : ""}.`;
    return {
      id: `attendance:${breakdown}:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "attendance", breakdown, label: r.label, percent: toNumeric(r.percent, null), count: r.count ?? null },
    };
  });
}

function makeAttendanceYearDocs() {
  const rows = attendanceData.trend || [];
  return rows.map((r) => {
    const text = `Chronic absenteeism in ${r.label}: ${safePercent(r.percent)}${r.count != null ? ` (n=${r.count})` : ""}.`;
    return {
      id: `attendance:year:${slug(r.label)}`,
      text,
      pageContent: text,
      metadata: { dataset: "attendance", breakdown: "year", label: r.label, percent: toNumeric(r.percent, null), count: r.count ?? null },
    };
  });
}

function makeAttendanceDocs() {
  return [
    makeAttendanceOverallDoc(),
    ...makeAttendanceByArrayDocs("gender", "gender"),
    ...makeAttendanceByArrayDocs("race", "race"),
    ...makeAttendanceByArrayDocs("grade_group", "grade_group"),
    ...makeAttendanceByArrayDocs("school_id", "school_id"),
    ...makeAttendanceYearDocs(),
  ];
}

export function buildRagDocuments() {
  try {
    const docs = [
      // Graduation (requested schema)
      ...makeGraduationDocs(),
      // Others (now extended similarly)
      ...makeGpaDocs(),
      ...makeDemographicsDocs(),
      ...makeFrpDocs(),
      // Staff (requested schema)
      makeStaffOverallTenureDoc(),
      makeStaffRaceDoc(),
      makeStaffGenderDoc(),
      makeStaffCategoryDoc(),
      makeStaffYearDoc(),
      makeStaffDegreeDoc(),
      ...makeAttendanceDocs()
    ];
    return docs;
  } catch (e) {
    console.error("RAG build failed:", e);
    return [];
  }
}

export function saveRagDocuments(documents) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    }
  } catch (e) {
    console.error("Failed to persist RAG docs:", e);
  }
}

export function loadRagDocuments() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load RAG docs:", e);
  }
  return [];
}

// Convenience: one-call ingestion
export function ingestRagData() {
  const docs = buildRagDocuments();
  saveRagDocuments(docs);
  return docs;
}

// Simple keyword retriever placeholder (no vector store yet)
export function keywordSearch(query, k = 5) {
  const docs = loadRagDocuments();
  const q = (query || "").toLowerCase().trim();
  if (!q) return docs.slice(0, k);
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = docs.map((d) => {
    const body = (d.text || d.pageContent || "");
    const hay = `${body}\n${JSON.stringify(d.metadata || {})}`.toLowerCase();
    let score = 0;
    for (const t of terms) if (hay.includes(t)) score += 1;
    if (d.metadata?.dataset && q.includes(d.metadata.dataset)) score += 2;
    if ((d.metadata?.dimension || d.metadata?.breakdown) && q.includes((d.metadata.dimension || d.metadata.breakdown))) score += 1;
    return { doc: d, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, k).map((s) => s.doc);
}


