import { buildRagDocuments, loadRagDocuments, saveRagDocuments, keywordSearch } from './ragStore.js';

let singleton = null;

// Site meta (edit as needed)
const SITE_META = {
  goal:
    'Interactive 3D data website that showcases educational equity insights in our district through charts, dashboards, and an AI assistant.',
  me: {
    name: 'Anirudh Vasudevan',
    summary:
      'Full‑stack developer focused on frontend and AI integration. MSCS @ UMN; builds responsive, data‑rich applications with modern UX.',
    portfolio: 'https://anirudhvasudevan.netlify.app/',
    github: 'https://github.com/anirxdh',
  },
  mentor: {
    name: 'Erich Kummerfeld',
    summary:
      'Researcher in statistical and machine‑learning methods for causal discovery. Develops algorithms, theory, and simulation benchmarks, applying them to health data.',
    homepage: 'https://erichkummerfeld.com/',
  },
};

function summarizeFromDoc(doc) {
  if (doc?.text) return doc.text;
  if (doc?.pageContent) return doc.pageContent.slice(0, 500);
  return 'Relevant data found.';
}

class RagChat {
  constructor() {
    this.memory = [];
    this.session = { dataset: null, breakdown: null, label: null };
    // Ensure docs exist locally for client-side retrieval
    const docs = loadRagDocuments();
    if (!docs || docs.length === 0) {
      const built = buildRagDocuments();
      saveRagDocuments(built);
    }
  }

  addToMemory(role, content) {
    this.memory.push({ role, content, at: Date.now() });
    if (this.memory.length > 20) this.memory = this.memory.slice(-20);
  }

  clearMemory() {
    this.memory = [];
  }

  getRecentContext() {
    return this.memory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
  }

  parseQuery(q) {
    const s = String(q || '').toLowerCase();
    // dataset
    let dataset = null;
    if (/\bgraduation\b|\bgraduate(s)?\b/.test(s)) dataset = 'graduation';
    else if (/\bgpa\b|grade point average/.test(s)) dataset = 'gpa';
    else if (/demographic|demo\b/.test(s)) dataset = 'demographics';
    else if (/\bfrp\b|free|reduced/.test(s)) dataset = 'frp';
    else if (/staff\b/.test(s)) dataset = 'staff';
    else if (/attendance|absent|chronic/.test(s)) dataset = 'attendance';

    // breakdown
    let breakdown = null;
    if (/race code|\brace\b/.test(s)) breakdown = dataset === 'graduation' ? 'federal_race_code' : 'race';
    else if (/gender|male|female/.test(s)) breakdown = 'gender';
    else if (/year|\b20\d{2}/.test(s)) breakdown = 'year';
    else if (/chronically absent|not chronically absent|chronically_absent/.test(s)) breakdown = 'chronically_absent';
    else if (/english\s*learner/.test(s)) breakdown = 'english_learner_flag';
    else if (/special\s*education/.test(s)) breakdown = 'special_education_flag';
    else if (/school\s*(id|number)/.test(s)) breakdown = 'school_id';
    else if (/frp/.test(s)) {
      if (dataset === 'graduation') breakdown = 'frp_eligible_flag';
      else if (dataset === 'demographics') breakdown = 'frp';
      // if dataset is 'frp' (the dataset itself), do not infer a breakdown here
    }
    else if (/grade group|grade\b/.test(s)) breakdown = 'grade_group';

    // label (try number code or quoted phrase)
    let label = null;
    const raceCodeMatch = s.match(/\brace\s*(code)?\s*(\d+)\b/);
    if (raceCodeMatch) label = raceCodeMatch[2];
    if (!label) {
      const quoted = s.match(/["']([^"']+)["']/);
      if (quoted) label = quoted[1];
    }
    if (!label) {
      // try direct numeric mention
      const num = s.match(/\b(\d{1,2})\b/);
      if (num && /(race|code)/.test(s)) label = num[1];
    }
    const wantsTrend = /(trend|over the years|from beginning to the end|across years|year by year|year wise|year-wise|yearwise)/.test(s);
    const refersPrevious = /(above|previous)/.test(s);
    return { dataset, breakdown, label, wantsTrend, refersPrevious };
  }

  findBestDoc(query) {
    let { dataset, breakdown, label } = this.parseQuery(query);
    if (!dataset && this.session.dataset) dataset = this.session.dataset;
    if (!breakdown && this.session.breakdown) breakdown = this.session.breakdown;
    const docs = loadRagDocuments();
    if (!docs || docs.length === 0) return null;

    let candidates = docs;
    if (dataset) candidates = candidates.filter(d => d.metadata?.dataset === dataset);
    if (breakdown) candidates = candidates.filter(d => (d.metadata?.breakdown === breakdown));

    if (label) {
      const direct = candidates.find(d => String(d.metadata?.label || '').toLowerCase() === String(label).toLowerCase());
      if (direct) return direct;
      const byId = candidates.find(d => (d.id || '').toLowerCase().endsWith(`:${String(label).toLowerCase()}`));
      if (byId) return byId;
    }

    // If we narrowed to one, return it. Otherwise, do not guess.
    if (candidates.length === 1) return candidates[0];
    return null;
  }

  hasExactDoc(dataset, breakdown, label) {
    const docs = loadRagDocuments() || [];
    return docs.some(d => d.metadata?.dataset === dataset && d.metadata?.breakdown === breakdown && String(d.metadata?.label || '').toLowerCase() === String(label).toLowerCase());
  }

  notFoundMessage(dataset, breakdown, label) {
    const names = {
      federal_race_code: 'race code',
      chronically_absent: 'chronic absenteeism',
      english_learner_flag: 'English learner status',
      frp_eligible_flag: 'FRP eligibility',
      gender: 'gender',
      year: 'year',
      race: 'race',
      grade_group: 'grade group',
      school_id: 'school',
      frp: 'FRP',
    };
    const bd = names[breakdown] || breakdown || 'item';
    const ds = dataset || 'dataset';
    return `No ${ds} record found for ${bd} "${label}".`;
  }

  getDatasetDocs(dataset) {
    const docs = loadRagDocuments() || [];
    return docs.filter(d => d.metadata?.dataset === dataset);
  }

  friendlyBreakdownName(b) {
    const names = {
      overall: 'overall',
      year: 'year (timeline)',
      gender: 'gender',
      federal_race_code: 'race (code)',
      race: 'race',
      frp_eligible_flag: 'FRP eligibility',
      frp: 'FRP',
      chronically_absent: 'chronic absenteeism',
      english_learner_flag: 'English learner',
      special_education_flag: 'special education',
      grade_group: 'grade group',
      school_id: 'school',
      category: 'staff category',
      highest_degree: 'highest degree',
    };
    return names[b] || b;
  }

  listAvailableBreakdowns(dataset) {
    const docs = this.getDatasetDocs(dataset);
    const set = new Set(docs.map(d => d.metadata?.breakdown).filter(Boolean));
    const items = Array.from(set).map(b => this.friendlyBreakdownName(b));
    if (items.length === 0) return `No breakdown information available for ${dataset}.`;
    return `Available in ${dataset}: ${items.sort().join(', ')}.`;
  }

  pickOverallSummary(dataset) {
    const docs = this.getDatasetDocs(dataset);
    const overall = docs.find(d => d.metadata?.breakdown === 'overall');
    if (overall) return overall.text || overall.pageContent;
    const any = docs[0];
    return any ? (any.text || any.pageContent) : null;
  }

  yearsAvailableLine(dataset) {
    const docs = this.getDatasetDocs(dataset).filter(d => d.metadata?.breakdown === 'year');
    if (docs.length === 0) return '';
    // Prefer explicit label on each year doc
    let labels = docs.map(d => d.metadata?.label).filter(Boolean).map(String);
    // If labels are missing, look for an array of years in metadata
    if (labels.length === 0) {
      const allYears = [];
      for (const d of docs) {
        const arr = d.metadata?.years;
        if (Array.isArray(arr)) allYears.push(...arr.map(String));
      }
      labels = Array.from(new Set(allYears));
    }
    if (labels.length === 0) return '';
    const allFour = labels.every(l => /^\d{4}$/.test(l));
    if (allFour) {
      const nums = labels.map(l => Number(l)).sort((a, b) => a - b);
      const line = nums.length > 1 ? `${nums[0]}–${nums[nums.length - 1]}` : `${nums[0]}`;
      return `Years available: ${line}.`;
    }
    const ordered = [...labels].sort((a, b) => a.localeCompare(b));
    return `Years available: ${ordered.join(', ')}.`;
  }

  datasetOverview(dataset) {
    switch (dataset) {
      case 'graduation':
        return 'Graduation outcomes show the share of students who graduated vs not. The data can be sliced by demographics and program participation to understand patterns.';
      case 'gpa':
        return 'GPA data captures the distribution of student grade point averages across key bands. Use it to compare achievement across years and student groups.';
      case 'demographics':
        return 'Demographics summarize student population composition (not performance) across groups like race, gender, grade and school. Useful for context and equity analysis.';
      case 'frp':
        return 'FRP shows Free/Reduced Price meal eligibility distribution, a proxy for socioeconomic status. Compare patterns across schools and student groups.';
      case 'staff':
        return 'Staff data describes the workforce (gender, race, roles, and degrees). Use it for staffing profiles and diversity insights (not student outcomes).';
      case 'attendance':
        return 'Chronic absenteeism tracks students missing substantial instructional time. Trends help target engagement and intervention strategies.';
      default:
        return 'This dataset contains aggregated education metrics with multiple breakdowns for trend and equity analysis.';
    }
  }

  listAllDatasetsSummary() {
    const datasets = ['graduation', 'gpa', 'demographics', 'frp', 'staff', 'attendance'];
    const lines = [];
    lines.push('Datasets available: graduation, gpa, demographics, frp, staff, attendance.');
    for (const ds of datasets) {
      const overview = this.datasetOverview(ds);
      const years = this.yearsAvailableLine(ds);
      const parts = [overview, years].filter(Boolean).join(' ');
      lines.push(`- ${ds}: ${parts}`);
    }
    return lines.join('\n');
  }

  listAllDatasetsNames() {
    return 'Datasets available: graduation, gpa, demographics, frp, staff, attendance.';
  }

  isAllDataQuery(query) {
    const s = String(query || '').toLowerCase();
    if (/(what|wat)\s+(data|datasets)\s+(are|is)\s+(available|there)/.test(s)) return true;
    if (/(what|wat)\s+(data|datasets)\s+(do you|u)\s+have/.test(s)) return true;
    if (/\b(list|show|all)\s+(data|datasets)\b/.test(s)) return true;
    if (/(data|datasets).*available/.test(s)) return true; // e.g., "tell me about data available"
    if (/\bavailable\s+(data|datasets)\b/.test(s)) return true; // e.g., "available data?"
    return false;
  }

  isGoalQuery(query) {
    const s = String(query || '').toLowerCase();
    if (/(what is|what's|whats|wats|describe).*(goal|purpose|vision)/.test(s)) return true;
    if (/(goal|purpose|vision)\b/.test(s)) return true;
    if (/(about).*(site|project|app|website).*\b(goal|purpose|vision)/.test(s)) return true;
    if (/project goal/.test(s)) return true;
    return false;
  }

  isMeQuery(query) {
    const s = String(query || '').toLowerCase();
    return /(about|who is)\s*(anirudh|me)/.test(s) || /about the developer|about author/.test(s);
  }

  isMentorQuery(query) {
    const s = String(query || '').toLowerCase();
    return /(about|who is)\s*(erich|mentor|kummerfeld)/.test(s);
  }

  async generateResponse(userMessage) {
    const query = String(userMessage || '').trim();
    this.addToMemory('user', query);
    const parsed = this.parseQuery(query);

    // If user asked generally "about ... data" but no dataset recognized, list datasets concisely
    if (!parsed.dataset && /\b(tell me|about)\b.*\bdata\b/.test(query.toLowerCase())) {
      const msg = this.listAllDatasetsNames();
      this.addToMemory('assistant', msg);
      return msg;
    }

    // Project goal/meta
    if (this.isGoalQuery(query)) {
      const msg = SITE_META.goal;
      this.addToMemory('assistant', msg);
      return msg;
    }

    // About mentor / me (short bios + links). Check mentor first to avoid accidental 'about me' substring issues
    if (this.isMentorQuery(query)) {
      const t = SITE_META.mentor;
      const link = t.homepage ? `\nMore: ${t.homepage}` : '';
      const msg = `${t.name}: ${t.summary}${link}`;
      this.addToMemory('assistant', msg);
      return msg;
    }
    if (this.isMeQuery(query)) {
      const m = SITE_META.me;
      const links = [m.portfolio && `Portfolio: ${m.portfolio}`, m.github && `GitHub: ${m.github}`]
        .filter(Boolean)
        .join(' | ');
      const msg = `${m.name}: ${m.summary}${links ? `\n${links}` : ''}`;
      this.addToMemory('assistant', msg);
      return msg;
    }
    // If the user is generally asking about a dataset, show 2-line overview + years + filters
    if (parsed.dataset && !parsed.breakdown && !parsed.wantsTrend) {
      // If they ask what filters/breakdowns are available (more tolerant matcher)
      if (/(^|\b)(what|wat)?\s*(filters?|breakdowns?|dimensions?|categories?)\b|\bfilters?\b.*\b(available|options|have|in|for)\b/i.test(query)) {
        const msg = this.listAvailableBreakdowns(parsed.dataset);
        this.session.dataset = parsed.dataset;
        this.addToMemory('assistant', msg);
        return msg;
      }
      const overview = this.datasetOverview(parsed.dataset);
      let summary = this.pickOverallSummary(parsed.dataset);
      if (parsed.dataset === 'staff') summary = null; // Avoid tenure-heavy text for staff general summary
      if (overview || summary) {
        this.session.dataset = parsed.dataset;
        this.session.breakdown = 'overall';
        this.session.label = null;
        // Compose: 2-line overview (no tenure details), then years, then filters
        const filtersLine = this.listAvailableBreakdowns(parsed.dataset);
        const yearsLine = this.yearsAvailableLine(parsed.dataset);
        const parts = [overview, summary, yearsLine, filtersLine].filter(Boolean);
        const full = parts.join('\n');
        this.addToMemory('assistant', full);
        return full;
      }
    }
    // If the user asked for a trend, default dataset to previous or attendance, and join all year docs
    if (parsed.wantsTrend) {
      const dataset = parsed.dataset || this.session.dataset || 'attendance';
      const docs = loadRagDocuments();
      const yearDocs = (docs || []).filter(d => d.metadata?.dataset === dataset && d.metadata?.breakdown === 'year');
      if (yearDocs.length > 0) {
        // If the user refers to a previous specific category (e.g., school 41), note limitation if we don't have per-label yearly docs
        let prefix = '';
        if (parsed.refersPrevious && this.session.breakdown && this.session.label) {
          // We only have overall-by-year; no per-label-by-year docs
          prefix = `Note: Year-wise data is available only at overall level for ${dataset}, not for ${this.session.breakdown} "${this.session.label}".\n`;
        }
        // If a specific label (e.g., school id 41) is active but we lack per-label-year docs, show overall-by-year
        const ordered = [...yearDocs].sort((a,b) => String(a.metadata?.label).localeCompare(String(b.metadata?.label)));
        const answer = prefix + ordered.map(d => d.text || d.pageContent).join('\n');
        this.session = { dataset, breakdown: 'year', label: null };
        this.addToMemory('assistant', answer);
        return answer;
      }
      // No yearly docs for this dataset
      const msg = `No year-wise records available for ${dataset}.`;
      this.addToMemory('assistant', msg);
      return msg;
    }

    // If user asks for all data
    if (this.isAllDataQuery(query)) {
      const msg = this.listAllDatasetsNames();
      this.addToMemory('assistant', msg);
      return msg;
    }

    // Try targeted lookup first to avoid mixing unrelated facts; use session defaults when query is ambiguous
    const targeted = this.findBestDoc(query);
    if (targeted) {
      const answer = targeted.text || targeted.pageContent || 'No text available.';
      this.session = {
        dataset: targeted.metadata?.dataset || this.session.dataset,
        breakdown: targeted.metadata?.breakdown || this.session.breakdown,
        label: targeted.metadata?.label || null,
      };
      this.addToMemory('assistant', answer);
      return answer;
    }

    // If user specified an exact label and we didn’t find it, say not found instead of guessing
    if (parsed.dataset && parsed.breakdown && parsed.label) {
      if (!this.hasExactDoc(parsed.dataset, parsed.breakdown, parsed.label)) {
        const msg = this.notFoundMessage(parsed.dataset, parsed.breakdown, parsed.label);
        this.addToMemory('assistant', msg);
        return msg;
      }
    }

    const results = keywordSearch(query, 5);
    // Constrain fallback results to the current or previous dataset if possible
    let filtered = results;
    const ds = parsed.dataset || this.session.dataset;
    if (ds) filtered = (results || []).filter(d => d.metadata?.dataset === ds);
    // If we tried to constrain to a dataset and found nothing, do not fall back to global unrelated results
    if (ds && (!filtered || filtered.length === 0)) {
      const msg = `No matching records found in ${ds} for this request.`;
      this.addToMemory('assistant', msg);
      return msg;
    }

    if (!filtered || filtered.length === 0) {
      const fallback = 'I could not find relevant data in the knowledge base. Try asking about graduation, GPA, demographics, FRP, staff, or attendance.';
      this.addToMemory('assistant', fallback);
      return fallback;
    }

    // Return the single best snippet to avoid noisy outputs
    const best = filtered[0];
    const answer = summarizeFromDoc(best);
    // Update session based on the doc we actually surfaced
    if (best && best.metadata) {
      this.session = {
        dataset: best.metadata.dataset || this.session.dataset,
        breakdown: best.metadata.breakdown || this.session.breakdown,
        label: best.metadata.label || null,
      };
    }
    this.addToMemory('assistant', answer);
    return answer;
  }
}

export function getRagChat() {
  if (!singleton) singleton = new RagChat();
  return singleton;
}


