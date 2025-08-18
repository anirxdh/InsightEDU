import { buildRagDocuments, loadRagDocuments, saveRagDocuments, keywordSearch } from './ragStore.js';

let singleton = null;

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
    if (/(^|\b)(grad|graduation)/.test(s)) dataset = 'graduation';
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
    else if (/frp/.test(s)) breakdown = dataset === 'demographics' ? 'frp' : 'frp_eligible_flag';
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

  async generateResponse(userMessage) {
    const query = String(userMessage || '').trim();
    this.addToMemory('user', query);
    const parsed = this.parseQuery(query);
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

    const results = keywordSearch(query, 3);
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
    const answer = summarizeFromDoc(filtered[0]);
    this.addToMemory('assistant', answer);
    return answer;
  }
}

export function getRagChat() {
  if (!singleton) singleton = new RagChat();
  return singleton;
}


