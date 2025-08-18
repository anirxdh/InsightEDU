#!/usr/bin/env node
import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Config
const {
  PINECONE_API_KEY,
  PINECONE_INDEX = 'edu-rag',
  PINECONE_CLOUD = 'aws',
  PINECONE_REGION = 'us-east-1',
  OPENAI_API_KEY,
} = process.env;

if (!PINECONE_API_KEY) {
  console.error('Missing PINECONE_API_KEY');
  process.exit(1);
}

if (!OPENAI_API_KEY) console.warn('Warning: OPENAI_API_KEY is missing. Embeddings will fail.');

// lightweight embedding via OpenAI REST to avoid extra deps
async function embedTexts(texts) {
  const url = 'https://api.openai.com/v1/embeddings';
  const model = 'text-embedding-3-small';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: texts, model })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Embedding error: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

function sha1(x) {
  return crypto.createHash('sha1').update(x).digest('hex');
}

async function ensureIndex(client, name) {
  const list = await client.listIndexes();
  const exists = list.indexes?.some((i) => i.name === name);
  if (!exists) {
    console.log(`Creating Pinecone index '${name}'...`);
    await client.createIndex({
      name,
      dimension: 1536, // for text-embedding-3-small
      metric: 'cosine',
      spec: { serverless: { cloud: PINECONE_CLOUD, region: PINECONE_REGION } }
    });
    // wait for readiness
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const describe = await client.describeIndex(name);
      if (describe.status?.ready) { ready = true; break; }
      await new Promise((r) => setTimeout(r, 5000));
    }
    if (!ready) throw new Error('Index not ready after waiting');
  }
}

// -------- Doc builders (Node version, mirrors ragStore output) --------
function slug(x) {
  return String(x).trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function safePercent(value) {
  const num = Number(value);
  return Number.isFinite(num) ? (num * 100).toFixed(1) + '%' : String(value);
}
function toCountOrNull(v) {
  if (v == null) return null;
  const s = String(v).toLowerCase();
  if (s.includes('small count')) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildGraduationDocs(graduation) {
  const out = [];
  const o = graduation.overall || {};
  out.push({
    id: 'graduation:overall',
    text: `Overall graduation outcomes: ${safePercent(o.graduated)} graduated and ${safePercent(o.not_graduated)} did not graduate.`,
    metadata: { dataset: 'graduation', breakdown: 'overall', graduated: Number(o.graduated), not_graduated: Number(o.not_graduated) }
  });
  for (const key of ['chronically_absent','english_learner_flag','frp_eligible_flag','gender','federal_race_code','special_education_flag']) {
    const rows = graduation[key] || [];
    for (const r of rows) {
      const id = `graduation:${key}:${slug(r.label)}`;
      let stem;
      if (key === 'english_learner_flag') stem = `Graduation by English learner status: ${r.label} had a`;
      else if (key === 'frp_eligible_flag') stem = `Graduation by FRP eligibility: ${r.label} students graduated at`;
      else if (key === 'gender') stem = `Graduation by gender: ${r.label} students graduated at`;
      else if (key === 'federal_race_code') stem = `Graduation by race code ${r.label}:`;
      else if (key === 'special_education_flag') stem = `Graduation by special education status: ${r.label} students graduated at`;
      else stem = `Graduation by chronic absenteeism: among students ${r.label},`;
      const text = key === 'federal_race_code'
        ? `${stem} ${safePercent(r.graduated)} graduated and ${safePercent(r.not_graduated)} did not graduate.`
        : `${stem} ${safePercent(r.graduated)}, with ${safePercent(r.not_graduated)} not graduating.`;
      out.push({ id, text, metadata: { dataset: 'graduation', breakdown: key, label: r.label, graduated: Number(r.graduated), not_graduated: Number(r.not_graduated) } });
    }
  }
  const years = graduation.year || [];
  for (const r of years) out.push({ id: `graduation:year:${slug(r.label)}`, text: `Graduation in ${r.label}: ${safePercent(r.graduated)} graduated and ${safePercent(r.not_graduated)} did not graduate.`, metadata: { dataset: 'graduation', breakdown: 'year', label: r.label, graduated: Number(r.graduated), not_graduated: Number(r.not_graduated) } });
  return out;
}

function buildStaffDocs(staff) {
  const out = [];
  const ov = staff.overall || [];
  const shown = ov.filter(r => r.count != null).map(r => `${safePercent(r.percent)} have ${r.label} (${r.count})`).join(', ');
  const masked = ov.filter(r => r.count == null).map(r => r.label);
  const tail = masked.length ? `, and counts for ${masked.join(' and ')} are masked.` : '.';
  out.push({ id: 'staff:overall:tenure', text: `Staff tenure distribution: ${shown}${tail}`, metadata: { dataset: 'staff', breakdown: 'overall', categories: ov.map(r => r.label), counts: ov.map(r => r.count ?? null) } });
  const race = staff.race || [];
  out.push({ id: 'staff:race', text: `Staff racial composition: ${race.map((r,i)=>`${i===race.length-1&&race.length>1?'and ':''}code ${r.label} is ${safePercent(r.percent)} (${r.count})`).join(', ')}.`, metadata: { dataset: 'staff', breakdown: 'race', labels: race.map(r=>String(r.label)), counts: race.map(r=>r.count??null) } });
  const gender = staff.gender || [];
  out.push({ id: 'staff:gender', text: `Staff gender distribution: ${gender.map(r=>`${safePercent(r.percent)} are ${r.label.toLowerCase()} (${r.count})`).join(' and ')}.`, metadata: { dataset: 'staff', breakdown: 'gender', labels: gender.map(r=>r.label), counts: gender.map(r=>r.count??null) } });
  const cat = staff.category || [];
  out.push({ id: 'staff:category', text: `Staff role categories: ${cat.map((r,i)=>`${i===cat.length-1&&cat.length>1?'and ':''}${r.label} ${safePercent(r.percent)} (${r.count})`).join(', ')}.`, metadata: { dataset: 'staff', breakdown: 'category', labels: cat.map(r=>r.label), counts: cat.map(r=>r.count??null) } });
  const yrs = staff.year || [];
  out.push({ id: 'staff:year', text: `Staff counts by year: ${yrs.map(r=>`${r.count} in ${r.label} (${safePercent(r.percent)})`).join(', ')}.`, metadata: { dataset: 'staff', breakdown: 'year', years: yrs.map(r=>r.label), counts: yrs.map(r=>r.count??null) } });
  // degree grouping
  const deg = staff.highest_degree || [];
  const groups = { Masters:{percent:0,count:0}, Bachelors:{percent:0,count:0}, Specialist:{percent:0,count:0}, Doctorate:{percent:0,count:0} };
  let anyMasked=false;
  for (const r of deg){ const L=(r.label||'').toUpperCase(); if(L.includes('MASTER')){groups.Masters.percent+=r.percent||0; if(r.count!=null)groups.Masters.count+=r.count; if(r.count==null) anyMasked=true;} else if(L.includes('BACHELOR')){groups.Bachelors.percent+=r.percent||0; if(r.count!=null)groups.Bachelors.count+=r.count; if(r.count==null) anyMasked=true;} else if(L.includes('SPECIALIST')){groups.Specialist.percent+=r.percent||0; if(r.count!=null)groups.Specialist.count+=r.count; if(r.count==null) anyMasked=true;} else if(L.includes('DOCTORATE')){groups.Doctorate.percent+=r.percent||0; if(r.count!=null)groups.Doctorate.count+=r.count; if(r.count==null) anyMasked=true;} }
  const labels=['Masters','Bachelors','Specialist','Doctorate'];
  const sentence = `Highest degree attainment: ${labels.map(l=>`${safePercent(groups[l].percent)} of staff hold a ${l==='Bachelors'?'Bachelor’s':l==='Masters'?'Master’s':l} degree (${groups[l].count})`).join(', ')}.${anyMasked?' Some sub-categories are masked due to low counts.':''}`.trim();
  out.push({ id:'staff:degree', text: sentence, metadata:{ dataset:'staff', breakdown:'highest_degree', labels, counts: labels.map(l=>groups[l].count), percents: labels.map(l=>Number(groups[l].percent.toFixed(3))) } });
  return out;
}

function buildGroupDocsGeneric(obj, breakdown, formatParts) {
  const out=[]; const keys=Object.keys(obj||{});
  for(const label of keys){ const rows=obj[label]||[]; const text=`${breakdown.replace(/_/g,' ')} ${label}: ${formatParts(rows).join(', ')}.`; out.push({ id:`${breakdown}:${slug(label)}`, text, metadata:{ breakdown, label } }); }
  return out;
}

function buildGpaDocs(gpa){
  const out=[]; const rows=(gpa.Overall&&gpa.Overall.All)||[];
  const parts = rows.length? rows.map(r=>`${safePercent(r.Percent)} ${r.Category} (${toCountOrNull(r.Count)??'masked'})`) : ['no data available'];
  out.push({ id:'gpa:overall', text:`Overall GPA distribution: ${parts.join(', ')}.`, metadata:{ dataset:'gpa', breakdown:'overall', labels: rows.map(r=>r.Category), counts: rows.map(r=>toCountOrNull(r.Count)), percents: rows.map(r=>Number(r.Percent)) } });
  const build=(groupKey,br)=>{const group=gpa[groupKey]||{}; for(const label of Object.keys(group)){ const rws=group[label]||[]; const txt=`GPA distribution by ${br.replace(/_/g,' ')}: ${label} — ${rws.map(r=>`${safePercent(r.Percent)} ${r.Category} (${toCountOrNull(r.Count)??'masked'})`).join(', ')}.`; out.push({ id:`gpa:${br}:${slug(label)}`, text:txt, metadata:{ dataset:'gpa', breakdown:br, label, labels:rws.map(r=>r.Category), counts:rws.map(r=>toCountOrNull(r.Count)), percents:rws.map(r=>Number(r.Percent)) } }); } };
  build('Year','year'); build('Gender','gender'); build('Grade','grade'); build('Race','race'); build('Chronically Absent','chronically_absent');
  return out;
}

function buildDemoDocs(demo){
  const out=[]; const rows=demo.Overall||[]; out.push({ id:'demographics:overall:race', text:`Overall race composition: ${rows.map(r=>`code ${r.Category}: ${safePercent(r.Percent)}${toCountOrNull(r.Count)!=null?` (${toCountOrNull(r.Count)})`:''}`).join(', ')}.`, metadata:{ dataset:'demographics', breakdown:'overall', labels: rows.map(r=>String(r.Category)), counts: rows.map(r=>toCountOrNull(r.Count)), percents: rows.map(r=>Number(r.Percent)) } });
  const build=(groupKey,br)=>{const group=demo[groupKey]||{}; for(const label of Object.keys(group)){ const rws=group[label]||[]; const txt=`Race composition by ${br.replace(/_/g,' ')}: ${label} — ${rws.map(r=>`code ${r.Category}: ${safePercent(r.Percent)}${toCountOrNull(r.Count)!=null?` (${toCountOrNull(r.Count)})`:''}`).join(', ')}.`; out.push({ id:`demographics:${br}:${slug(label)}`, text:txt, metadata:{ dataset:'demographics', breakdown:br, label, labels:rws.map(r=>String(r.Category)), counts:rws.map(r=>toCountOrNull(r.Count)), percents:rws.map(r=>Number(r.Percent)) } }); } };
  build('Year','year'); build('Gender','gender'); build('Grade Group','grade_group'); build('FRP','frp'); build('Chronic Absenteesim','chronic_absenteeism'); build('School Number','school_id');
  return out;
}

function buildFrpDocs(frp){
  const out=[]; const rows=frp.Overall||[]; out.push({ id:'frp:overall', text:`Overall FRP distribution: ${rows.map(r=>`${r.Category}: ${safePercent(r.Percent)}${toCountOrNull(r.Count)!=null?` (${toCountOrNull(r.Count)})`:''}`).join(', ')}.`, metadata:{ dataset:'frp', breakdown:'overall', labels: rows.map(r=>r.Category), counts: rows.map(r=>toCountOrNull(r.Count)), percents: rows.map(r=>Number(r.Percent)) } });
  const build=(groupKey,br)=>{const group=frp[groupKey]||{}; for(const label of Object.keys(group)){ const rws=group[label]||[]; const txt=`FRP distribution by ${br.replace(/_/g,' ')}: ${label} — ${rws.map(r=>`${r.Category}: ${safePercent(r.Percent)}${toCountOrNull(r.Count)!=null?` (${toCountOrNull(r.Count)})`:''}`).join(', ')}.`; out.push({ id:`frp:${br}:${slug(label)}`, text:txt, metadata:{ dataset:'frp', breakdown:br, label, labels:rws.map(r=>r.Category), counts:rws.map(r=>toCountOrNull(r.Count)), percents:rws.map(r=>Number(r.Percent)) } }); } };
  build('Year','year'); build('Gender','gender'); build('Grade group','grade_group'); build('Race','race'); build('School Number','school_id'); build('Chronic Absenteeism','chronic_absenteeism');
  return out;
}

function buildAttendanceDocs(att){
  const out=[]; const o=att.overall||{}; out.push({ id:'attendance:overall', text:`Chronic absenteeism overall: ${safePercent(o.percent)}${o.count!=null?` (n=${o.count})`:''}.`, metadata:{ dataset:'attendance', breakdown:'overall', percent: Number(o.percent), count: o.count??null } });
  const addArr=(key,br)=>{ const rows=att[key]||[]; for(const r of rows){ out.push({ id:`attendance:${br}:${slug(r.label)}`, text:`Chronic absenteeism by ${br.replace(/_/g,' ')}: ${r.label} — ${safePercent(r.percent)}${r.count!=null?` (n=${r.count})`:''}.`, metadata:{ dataset:'attendance', breakdown:br, label:r.label, percent:Number(r.percent), count:r.count??null } }); } };
  addArr('gender','gender'); addArr('race','race'); addArr('grade_group','grade_group'); addArr('school_id','school_id');
  const trend=att.trend||[]; for(const r of trend){ out.push({ id:`attendance:year:${slug(r.label)}`, text:`Chronic absenteeism in ${r.label}: ${safePercent(r.percent)}${r.count!=null?` (n=${r.count})`:''}.`, metadata:{ dataset:'attendance', breakdown:'year', label:r.label, percent:Number(r.percent), count:r.count??null } }); }
  return out;
}

function buildAllDocs() {
  const graduation = require('../src/data/graduationOutcomes.json');
  const gpa = require('../src/data/final_agg_gpa.json');
  const demo = require('../src/data/final_agg_demo.json');
  const frp = require('../src/data/final_agg_frp.json');
  const staff = require('../src/data/staff.json');
  const attendance = require('../src/data/chronicAbsenteeism.json');
  return [
    ...buildGraduationDocs(graduation),
    ...buildGpaDocs(gpa),
    ...buildDemoDocs(demo),
    ...buildFrpDocs(frp),
    ...buildStaffDocs(staff),
    ...buildAttendanceDocs(attendance),
  ];
}

async function main() {
  const client = new Pinecone({ apiKey: PINECONE_API_KEY });
  await ensureIndex(client, PINECONE_INDEX);
  const index = client.index(PINECONE_INDEX);

  const docs = buildAllDocs();
  console.log(`Built ${docs.length} documents. Embedding...`);
  const chunks = [];
  const BATCH = 96;
  for (let i = 0; i < docs.length; i += BATCH) {
    chunks.push(docs.slice(i, i + BATCH));
  }

  function sanitizeMetadata(meta) {
    const out = {};
    if (!meta || typeof meta !== 'object') return out;
    for (const [k, v] of Object.entries(meta)) {
      if (Array.isArray(v)) {
        out[k] = v.map((x) => (x == null ? 'null' : String(x)));
      } else if (v == null) {
        // drop nulls
      } else if (['string', 'number', 'boolean'].includes(typeof v)) {
        out[k] = v;
      } else {
        // fallback – stringify unsupported types
        out[k] = JSON.stringify(v);
      }
    }
    return out;
  }

  for (const chunk of chunks) {
    const texts = chunk.map((d) => d.text || d.pageContent || '');
    const embeddings = await embedTexts(texts);
    const vectors = chunk.map((d, i) => ({
      id: d.id || sha1(texts[i]),
      values: embeddings[i],
      metadata: sanitizeMetadata(d.metadata || {}),
    }));
    await index.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors.`);
  }

  console.log('Ingestion complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


