/**
 * Skill pipeline workflow: run scripts/run_pipeline.sh <target> [sources], then print summary.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { dim, error as outputError, printSkillPipelineSummary } from './output.js';

export interface SkillPipelineOptions {
  target: string;
  sources: string;
  json?: boolean;
}

function findRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const script = join(dir, 'scripts', 'run_pipeline.sh');
    if (existsSync(script)) return dir;
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export async function runSkillPipeline(options: SkillPipelineOptions): Promise<void> {
  const root = findRepoRoot();
  const scriptPath = join(root, 'scripts', 'run_pipeline.sh');
  if (!existsSync(scriptPath)) {
    outputError('scripts/run_pipeline.sh not found. Run from repo root.');
    process.exitCode = 1;
    return;
  }

  console.log(chalk.cyan('  Running skill pipeline for ' + options.target + '…'));
  const start = Date.now();

  return new Promise((resolve) => {
    const child = spawn(scriptPath, [options.target, options.sources], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => (stdout += d.toString()));
    child.stderr?.on('data', (d) => (stderr += d.toString()));

    child.on('close', (code) => {
      dim(`Done in ${Date.now() - start}ms.`);
      if (code !== 0) {
        outputError('Skill pipeline failed (exit ' + code + ')');
        if (stderr) console.log(chalk.dim(stderr.trim()));
        process.exitCode = 1;
        return resolve();
      }
      if (options.json) {
        console.log(stdout);
        return resolve();
      }
      printSkillPipelineSummary(stdout);
      resolve();
    });

    child.on('error', (err) => {
      outputError(err.message);
      process.exitCode = 1;
      resolve();
    });
  });
}
