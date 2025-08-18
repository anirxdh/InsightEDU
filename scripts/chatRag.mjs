#!/usr/bin/env node
import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import readline from 'readline';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

const {
  PINECONE_API_KEY,
  PINECONE_INDEX = 'edu-rag',
  PINECONE_CLOUD = 'aws',
  PINECONE_REGION = 'us-east-1',
  OPENAI_API_KEY,
} = process.env;

if (!PINECONE_API_KEY || !OPENAI_API_KEY) {
  console.error('Missing PINECONE_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}

const client = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = client.index(PINECONE_INDEX);
const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
const llm = new ChatOpenAI({ model: 'gpt-4o-mini' });

async function retrieve(query, k = 6) {
  const vector = await embeddings.embedQuery(query);
  const res = await index.query({
    vector,
    topK: k,
    includeMetadata: true,
  });
  return res.matches?.map((m) => ({
    id: m.id,
    score: m.score,
    metadata: m.metadata,
  })) || [];
}

function formatContext(matches) {
  return matches.map((m, i) => `# Doc ${i + 1} (${m.score.toFixed(3)})\n${JSON.stringify(m.metadata)}`).join('\n\n');
}

const memory = [];
function pushMemory(role, content) {
  memory.push({ role, content });
  if (memory.length > 20) memory.shift();
}

async function chatOnce(question) {
  const retrieved = await retrieve(question, 6);
  const context = formatContext(retrieved);
  const history = memory.map((m) => `${m.role}: ${m.content}`).join('\n');
  const system = `You are a helpful school data assistant. Answer ONLY using the provided RAG metadata. Be concise.`;
  const prompt = [
    { role: 'system', content: system },
    { role: 'user', content: `Conversation so far:\n${history}` },
    { role: 'user', content: `Context:\n${context}` },
    { role: 'user', content: `Question: ${question}` },
  ];
  const resp = await llm.invoke(prompt);
  return { text: resp?.content || '' };
}

async function main() {
  console.log('RAG chat ready. Type your question. Ctrl+C to exit.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  while (true) {
    const q = await ask('> ');
    if (!q.trim()) continue;
    pushMemory('user', q.trim());
    const ans = await chatOnce(q.trim());
    console.log(ans.text);
    pushMemory('assistant', ans.text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


