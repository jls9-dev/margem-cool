#!/usr/bin/env node
// NeuronWriter CLI for Margem Cool.
//
// Commands:
//   projects                             — list NW projects on the account
//   brief <keyword> [--lang pt|en]       — pull (or create) a brief and write it to seo/briefs/
//   queries                              — list existing queries in the margemsul project
//   score <queryId> --html <file>        — score local HTML against a query (no save)
//
// All briefs are saved to seo/briefs/<slug>-<lang>.md plus a raw JSON dump at
// seo/briefs/<slug>-<lang>.raw.json so we can debug NW response shape changes.

import { writeFile, mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  listProjects,
  listQueries,
  getOrCreateQuery,
  getQuery,
  evaluateContent,
  findProjectByName,
} from './neuronwriter.mjs';
import { formatBrief } from './format-brief.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const BRIEFS_DIR = join(ROOT, 'seo', 'briefs');

const PROJECT_NAME = 'margemcool.pt';

const LANG_MAP = {
  pt: { language: 'Portuguese', engine: 'google.pt' },
  en: { language: 'English', engine: 'google.pt' },
};

function slug(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFlags(argv) {
  const out = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out.positional.push(a);
    }
  }
  return out;
}

async function cmdProjects() {
  const projects = await listProjects();
  console.log(`Projects on the account (${projects.length}):`);
  console.log('');
  for (const p of projects) {
    console.log(`  ${p.name}`);
    console.log(`    project ID: ${p.project}`);
    console.log(`    language:   ${p.language}`);
    console.log(`    engine:     ${p.engine}`);
    console.log('');
  }
}

async function cmdBrief({ keyword, lang }) {
  if (!keyword) {
    console.error('Usage: brief <keyword> [--lang pt|en]');
    process.exit(1);
  }
  const langConfig = LANG_MAP[lang];
  if (!langConfig) {
    console.error(`Unknown language "${lang}". Use --lang pt or --lang en.`);
    process.exit(1);
  }

  const project = await findProjectByName(PROJECT_NAME);
  if (!project) {
    console.error(`No project matching "${PROJECT_NAME}" found in your NW account.`);
    console.error('Run: node scripts/seo/cli.mjs projects');
    process.exit(1);
  }

  console.log(`Pulling brief for "${keyword}" (${lang}) in project ${project.name}...`);

  const result = await getOrCreateQuery({
    project: project.project,
    keyword,
    engine: langConfig.engine,
    language: langConfig.language,
  });

  if (result.created) {
    console.log(`  created new query ${result.query}`);
  } else {
    console.log(`  using existing query ${result.query}`);
  }

  // Always pull fresh data even if we just got it from getOrCreateQuery — keeps the
  // saved snapshot consistent
  const data = await getQuery(result.query);

  await mkdir(BRIEFS_DIR, { recursive: true });
  const base = `${slug(keyword)}-${lang}`;
  const mdPath = join(BRIEFS_DIR, `${base}.md`);
  const rawPath = join(BRIEFS_DIR, `${base}.raw.json`);

  const md = formatBrief({
    keyword,
    language: langConfig.language,
    engine: langConfig.engine,
    queryId: result.query,
    queryUrl: data.query_url,
    data,
  });

  await writeFile(mdPath, md);
  await writeFile(rawPath, JSON.stringify(data, null, 2));

  console.log(`  → ${mdPath}`);
  console.log(`  → ${rawPath} (raw)`);
}

async function cmdQueries() {
  const project = await findProjectByName(PROJECT_NAME);
  if (!project) {
    console.error(`No project matching "${PROJECT_NAME}".`);
    process.exit(1);
  }
  const queries = await listQueries({ project: project.project });
  console.log(`Queries in ${project.name} (${queries.length}):`);
  console.log('');
  for (const q of queries) {
    console.log(`  ${q.keyword} (${q.language || '?'}, ${q.engine || '?'}) — ${q.status || '?'}`);
    console.log(`    query ID: ${q.query}`);
  }
}

async function cmdScore({ queryId, htmlPath, title, description }) {
  if (!queryId || !htmlPath) {
    console.error('Usage: score <queryId> --html <file> [--title "..."] [--description "..."]');
    process.exit(1);
  }
  const html = await readFile(htmlPath, 'utf8');
  const result = await evaluateContent({ query: queryId, html, title, description });
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`NeuronWriter CLI for Margem Cool

Commands:
  projects                                List NW projects on the account
  brief <keyword> [--lang pt|en]          Pull (or create) a brief, save to seo/briefs/
  queries                                 List existing queries in the margemsul project
  score <queryId> --html <file>           Score local HTML against a query

Examples:
  node scripts/seo/cli.mjs projects
  node scripts/seo/cli.mjs brief "cacilhas" --lang pt
  node scripts/seo/cli.mjs brief "cacilhas" --lang en
  node scripts/seo/cli.mjs score abc123 --html dist/lugares/almada/cacilhas/index.html
`);
    return;
  }

  if (cmd === 'projects') return cmdProjects();
  if (cmd === 'queries') return cmdQueries();
  if (cmd === 'brief') {
    return cmdBrief({
      keyword: flags.positional[0],
      lang: flags.lang || 'pt',
    });
  }
  if (cmd === 'score') {
    return cmdScore({
      queryId: flags.positional[0],
      htmlPath: flags.html,
      title: flags.title,
      description: flags.description,
    });
  }
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
