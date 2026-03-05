/**
 * Colorful ASCII "SHAIVRA" banner for interactive CLI sessions.
 * Printed once at startup; skipped in non-interactive/pipe mode.
 */

import chalk from 'chalk';

const BANNER = `
   ███████╗██╗  ██╗ █████╗ ██╗██╗   ██╗██████╗  █████╗ 
   ██╔════╝██║  ██║██╔══██╗██║██║   ██║██╔══██╗██╔══██╗
   ███████╗███████║███████║██║██║   ██║██████╔╝███████║
   ╚════██║██╔══██║██╔══██║██║██║   ██║██╔══██╗██╔══██║
   ███████║██║  ██║██║  ██║██║╚██████╔╝██║  ██║██║  ██║
   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
`;

const TAGLINE = 'Intelligence gathering CLI';

/** Print colorful SHAIVRA banner and tagline to stdout. */
export function printBanner(): void {
  const lines = BANNER.trim().split('\n');
  const colors = [chalk.cyan, chalk.blue, chalk.magenta, chalk.green, chalk.yellow, chalk.cyan];
  for (let i = 0; i < lines.length; i++) {
    console.log(colors[i % colors.length](lines[i]));
  }
  console.log(chalk.dim(`   ${TAGLINE}`));
  console.log();
}
