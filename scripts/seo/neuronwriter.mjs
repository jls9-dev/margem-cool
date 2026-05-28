// NeuronWriter API client for Margem Cool.
//
// All endpoints are POST under https://app.neuronwriter.com/neuron-api/0.5/writer
// Auth via X-API-KEY header (read from ~/.claude/projects/.../secrets/neuronwriter.key).
//
// Endpoints used here:
//   /list-projects     — enumerate projects in the account
//   /new-query         — create a new keyword query (consumes monthly limit)
//   /list-queries      — list existing queries in a project
//   /get-query         — fetch a query's brief (4-block structure + competitors)
//   /import-content    — push finished content for scoring (saves to NW)
//   /evaluate-content  — score content without saving
//   /get-content       — pull current content + score
//
// Never log the API key.

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE_URL = 'https://app.neuronwriter.com/neuron-api/0.5/writer';
const KEY_PATH = join(homedir(), '.claude/projects/-Users-jameslumley-savile/secrets/neuronwriter.key');

let cachedKey = null;
async function getApiKey() {
  if (cachedKey) return cachedKey;
  try {
    cachedKey = (await readFile(KEY_PATH, 'utf8')).trim();
    if (!cachedKey) throw new Error('NeuronWriter key file is empty');
    return cachedKey;
  } catch (err) {
    throw new Error(
      `Couldn't read NeuronWriter key at ${KEY_PATH}\n` +
      `Reason: ${err.message}\n` +
      `Make sure the file exists, has mode 600, and contains the API key.`
    );
  }
}

async function post(endpoint, body = {}) {
  const key = await getApiKey();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Non-JSON response from ${endpoint} (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(`NeuronWriter ${endpoint} failed: ${msg}`);
  }
  return data;
}

export async function listProjects() {
  return post('/list-projects');
}

export async function newQuery({ project, keyword, engine = 'google.pt', language = 'Portuguese', competitors_mode = 'top10' }) {
  return post('/new-query', { project, keyword, engine, language, competitors_mode });
}

export async function listQueries({ project, status, source, keyword, language, engine, tags }) {
  const body = { project };
  if (status) body.status = status;
  if (source) body.source = source;
  if (keyword) body.keyword = keyword;
  if (language) body.language = language;
  if (engine) body.engine = engine;
  if (tags) body.tags = tags;
  return post('/list-queries', body);
}

export async function getQuery(queryId) {
  return post('/get-query', { query: queryId });
}

export async function importContent({ query, html, title, description, url }) {
  const body = { query };
  if (html != null) body.html = html;
  if (title != null) body.title = title;
  if (description != null) body.description = description;
  if (url != null) body.url = url;
  return post('/import-content', body);
}

export async function evaluateContent({ query, html, title, description, url }) {
  const body = { query };
  if (html != null) body.html = html;
  if (title != null) body.title = title;
  if (description != null) body.description = description;
  if (url != null) body.url = url;
  return post('/evaluate-content', body);
}

export async function getContent({ query, revision_type }) {
  const body = { query };
  if (revision_type) body.revision_type = revision_type;
  return post('/get-content', body);
}

// Convenience: find a project by name. Names are case-insensitive substring matches.
export async function findProjectByName(name) {
  const all = await listProjects();
  const lower = name.toLowerCase();
  return all.find(p => p.name?.toLowerCase().includes(lower)) ?? null;
}

// Convenience: get or create a query for a keyword in a project. If an existing
// "ready" query for the same keyword+language exists, returns it; otherwise
// creates a new one (which consumes a monthly query limit) and polls until ready.
export async function getOrCreateQuery({ project, keyword, engine = 'google.pt', language = 'Portuguese', maxWaitMs = 120000 }) {
  // Look for an existing query first
  const existing = await listQueries({ project, keyword, language, engine, status: 'ready' });
  if (Array.isArray(existing) && existing.length > 0) {
    return { query: existing[0].query, created: false };
  }

  const created = await newQuery({ project, keyword, engine, language });
  const queryId = created.query;

  // Poll until ready, with backoff
  const start = Date.now();
  let waitMs = 3000;
  while (Date.now() - start < maxWaitMs) {
    const q = await getQuery(queryId);
    if (q.status === 'ready') return { query: queryId, created: true, data: q };
    await new Promise(r => setTimeout(r, waitMs));
    waitMs = Math.min(waitMs * 1.5, 15000);
  }
  throw new Error(`Query ${queryId} did not become ready within ${maxWaitMs / 1000}s`);
}
