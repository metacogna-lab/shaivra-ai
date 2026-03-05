#!/usr/bin/env node
/**
 * E2E: collect public info via Gemini Web Search, then run the agent system (report).
 * Verifies response shape and that the agent received pipeline data.
 * Requires: server running, GEMINI_API_KEY. For full flow set AUTH_TOKEN (e.g. from login).
 */

import chalk from 'chalk';

const BASE_URL = process.env.SHAIVRA_API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || process.env.SHAIVRA_AUTH_TOKEN;
const REPORT_ONLY = process.argv.includes('--report-only');

/** Default web search query for public OSINT-style context. */
const SEARCH_QUERY = process.env.E2E_SEARCH_QUERY || 'recent OSINT and threat intelligence trends 2024';
const TARGET = process.env.E2E_REPORT_TARGET || 'E2E Test Target';

interface SearchResponse {
  text?: string;
  sources?: Array<{ title?: string; uri?: string }>;
  lineage?: unknown;
  raw?: unknown;
}

interface ReportResponse {
  title?: string;
  summary?: string;
  key_findings?: string[];
  agent_certainty?: number;
  agent_logs?: string[];
  citations?: unknown[];
  agent_lineage?: unknown;
  lineage?: unknown;
  competition_context?: unknown;
  conflict_analysis?: unknown;
  risk_assessment?: string;
  strategic_actions?: string[];
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) h['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return h;
}

/** Step 1: Gemini Web Search (requires auth). */
async function runSearch(): Promise<{ ok: true; text: string; sources: SearchResponse['sources'] } | { ok: false; message: string }> {
  if (REPORT_ONLY) {
    return { ok: true, text: 'Minimal fixture for agent run. No external search.', sources: [] };
  }
  if (!AUTH_TOKEN) {
    return {
      ok: false,
      message: 'AUTH_TOKEN (or SHAIVRA_AUTH_TOKEN) required for web search. Use --report-only to test report/agent only.',
    };
  }
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ query: SEARCH_QUERY }),
    });
    if (res.status === 401) return { ok: false, message: 'Search returned 401 (invalid or missing auth)' };
    if (res.status !== 200) {
      const body = await res.text();
      return { ok: false, message: `Search HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as SearchResponse;
    const text = typeof data.text === 'string' ? data.text : '';
    const sources = Array.isArray(data.sources) ? data.sources : [];
    if (!text || text.length < 20) return { ok: false, message: 'Search returned empty or too short text' };
    return { ok: true, text, sources };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Search request failed' };
  }
}

/** Step 2: Strategic report (agent network + LLM); no auth on root /api/report. */
async function runReport(pipelineData: Record<string, unknown>): Promise<{ ok: true; report: ReportResponse } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/report`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ target: TARGET, pipelineData }),
    });
    if (res.status !== 200) {
      const body = await res.text();
      return { ok: false, message: `Report HTTP ${res.status}: ${body.slice(0, 300)}` };
    }
    const report = (await res.json()) as ReportResponse;
    return { ok: true, report };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Report request failed' };
  }
}

/** Assert report has required shape and agent was used (no mutations to input). */
function verifyReport(report: ReportResponse): { ok: true } | { ok: false; message: string } {
  if (typeof report.title !== 'string' || report.title.length < 1)
    return { ok: false, message: 'report.title missing or not a string' };
  if (typeof report.summary !== 'string' || report.summary.length < 10)
    return { ok: false, message: 'report.summary missing or too short' };
  if (!Array.isArray(report.key_findings))
    return { ok: false, message: 'report.key_findings missing or not an array' };
  if (typeof report.agent_certainty !== 'number')
    return { ok: false, message: 'report.agent_certainty missing or not a number' };
  if (!Array.isArray(report.agent_logs))
    return { ok: false, message: 'report.agent_logs missing or not an array' };
  return { ok: true };
}

async function main(): Promise<void> {
  console.log(chalk.bold.cyan('\n  E2E: Web Search → Agent (Report)\n'));
  console.log(chalk.dim(`  Base URL: ${BASE_URL}`));
  if (REPORT_ONLY) console.log(chalk.dim('  Mode: --report-only (skip search, use minimal pipelineData)\n'));
  else console.log(chalk.dim(`  Search query: ${SEARCH_QUERY}\n`));

  const searchResult = await runSearch();
  if (!searchResult.ok) {
    console.log(chalk.red('  ✗ Search: ' + (searchResult as { ok: false; message: string }).message));
    process.exit(1);
  }
  console.log(chalk.green('  ✓ Search: collected content (' + searchResult.text.length + ' chars, ' + (searchResult.sources?.length ?? 0) + ' sources)'));

  const pipelineData: Record<string, unknown> = {
    searchText: searchResult.text,
    sources: searchResult.sources ?? [],
  };

  const reportResult = await runReport(pipelineData);
  if (!reportResult.ok) {
    console.log(chalk.red('  ✗ Report: ' + (reportResult as { ok: false; message: string }).message));
    process.exit(1);
  }

  const verify = verifyReport(reportResult.report);
  if (!verify.ok) {
    console.log(chalk.red('  ✗ Verify: ' + (verify as { ok: false; message: string }).message));
    process.exit(1);
  }

  console.log(chalk.green('  ✓ Report: title, summary, key_findings, agent_certainty, agent_logs present'));
  console.log(chalk.dim(`     title: "${reportResult.report.title?.slice(0, 50)}..."`));
  console.log(chalk.dim(`     agent_certainty: ${reportResult.report.agent_certainty}%`));
  console.log();
  console.log(chalk.bold('  E2E passed: Web Search → Agent (report) verified.'));
  console.log();
  process.exit(0);
}

main().catch((e) => {
  console.error(chalk.red(e?.message || e));
  process.exit(1);
});
