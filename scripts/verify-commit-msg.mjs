#!/usr/bin/env node
import { readFileSync } from 'node:fs';

/** Allowed Conventional Commits types. */
const TYPES = [
  'feat',
  'fix',
  'chore',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'revert',
];

/** Matches `type(scope)?!?: subject`, e.g. `feat(ai): add panel`. */
const PATTERN = new RegExp(`^(${TYPES.join('|')})(\\([^)]+\\))?!?: .+`);

/** Prefixes for auto-generated commits that should bypass validation. */
const ALLOWED_PREFIXES = ['Merge ', 'Revert ', 'fixup!', 'squash!'];

/**
 * Read the first non-comment line of the commit message file.
 *
 * @param {string} path - Path to the commit message file (hook arg `$1`).
 * @returns {string} The trimmed subject line.
 */
function readSubject(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const subject = lines.find((line) => line.trim() && !line.startsWith('#'));
  return (subject ?? '').trim();
}

/**
 * Print a helpful error describing the expected format, then exit non-zero.
 *
 * @param {string} subject - The offending subject line.
 * @returns {never} Never returns; terminates the process.
 */
function fail(subject) {
  console.error(`\n✖ Invalid commit message:\n  ${subject}`);
  console.error('\n  Expected Conventional Commits format: <type>(scope)?: <subject>');
  console.error(`  Allowed types: ${TYPES.join(', ')}`);
  console.error('  Example: feat(explorer): add document filtering\n');
  process.exit(1);
}

/**
 * Validate the commit subject, allowing auto-generated commit prefixes.
 *
 * @returns {void}
 */
function main() {
  const subject = readSubject(process.argv[2]);
  if (ALLOWED_PREFIXES.some((prefix) => subject.startsWith(prefix))) return;
  if (!PATTERN.test(subject)) fail(subject);
}

main();
