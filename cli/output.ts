/**
 * Colored CLI output: section headers, success/error/warn, result summaries.
 */

import chalk from 'chalk';

export function section(title: string): void {
  console.log(chalk.bold.cyan('\n  ' + title));
  console.log(chalk.dim('  ' + '─'.repeat(Math.min(40, title.length + 2))));
}

export function success(msg: string): void {
  console.log(chalk.green('  ✓ ' + msg));
}

export function error(msg: string): void {
  console.log(chalk.red('  ✗ ' + msg));
}

export function warn(msg: string): void {
  console.log(chalk.yellow('  ⚠ ' + msg));
}

export function dim(msg: string): void {
  console.log(chalk.dim('  ' + msg));
}

/** Print gather result summary (entities, observations, relationships). */
export function printGatherSummary(result: {
  metadata: { totalEntities: number; totalObservations: number; totalRelationships: number; executionTime: number };
  events?: Array<{ entities: Array<{ name: string; type: string }> }>;
}): void {
  const { totalEntities, totalObservations, totalRelationships, executionTime } = result.metadata;
  section('Gather result');
  success(`Entities: ${totalEntities} | Observations: ${totalObservations} | Relationships: ${totalRelationships}`);
  dim(`Completed in ${executionTime}ms`);
  if (result.events?.length && result.events[0].entities?.length) {
    console.log(chalk.dim('  Top entities:'));
    result.events[0].entities.slice(0, 5).forEach((e) => dim(`    - ${e.name} (${e.type})`));
  }
  console.log();
}

/** Print skill pipeline summary (entity_graph, narrative, threat_surface keys). */
export function printSkillPipelineSummary(stdout: string): void {
  section('Skill pipeline result');
  try {
    const data = JSON.parse(stdout);
    if (data.entity_graph) dim(`entity_graph: ${Array.isArray(data.entity_graph) ? data.entity_graph.length : Object.keys(data.entity_graph).length} items`);
    if (data.narrative_simulation) dim('narrative_simulation: present');
    if (data.threat_surface) dim('threat_surface: present');
  } catch {
    dim(stdout.slice(0, 200) + (stdout.length > 200 ? '...' : ''));
  }
  console.log();
}
