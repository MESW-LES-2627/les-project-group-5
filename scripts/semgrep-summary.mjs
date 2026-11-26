// Turns Semgrep's JSON output into a short Markdown summary for the CI job.
// Used by the `semgrep` job in .github/workflows/ci.yml: the summary goes to the PR comment
// and to the job's summary page.
//
// Usage: node scripts/semgrep-summary.mjs <semgrep.json> <output.md>
// Reads GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_SHA and GITHUB_RUN_ID to build links (set by GitHub Actions).
import { readFileSync, writeFileSync } from 'node:fs';

// The PR comment is found and updated through this hidden marker, so each PR keeps one comment.
const MARKER = '<!-- semgrep-summary -->';
// GitHub comments have a size limit; past this many rows the full list is in the job log.
const MAX_ROWS = 50;
const SEVERITY_ICONS = { ERROR: '🔴', WARNING: '🟠', INFO: '🔵' };

const [inputPath, outputPath] = process.argv.slice(2);
const report = JSON.parse(readFileSync(inputPath, 'utf8'));
const findings = report.results ?? [];
const scanErrors = report.errors ?? [];

const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repo, GITHUB_SHA: sha, GITHUB_RUN_ID: runId } = process.env;
const runUrl = `${server}/${repo}/actions/runs/${runId}`;

/** Link to the exact line, at the commit that was scanned. */
function fileLink(finding) {
  const location = `${finding.path}:${finding.start.line}`;
  return `[\`${location}\`](${server}/${repo}/blob/${sha}/${finding.path}#L${finding.start.line})`;
}

/** Rule ids from packs are long (a.b.c.rule-name); the last part is enough to read. */
function shortRuleId(checkId) {
  return checkId.split('.').pop();
}

/** First sentence only, on one line, with pipes escaped so the Markdown table doesn't break. */
function shortMessage(message) {
  const firstSentence = message.replace(/\s+/g, ' ').split(/(?<=\.)\s/)[0];
  return firstSentence.replaceAll('|', '\\|');
}

function countBySeverity() {
  const counts = {};
  for (const finding of findings) {
    const severity = finding.extra.severity;
    counts[severity] = (counts[severity] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([severity, count]) => `${SEVERITY_ICONS[severity] ?? '⚪'} ${count} ${severity.toLowerCase()}`)
    .join(' · ');
}

const lines = [MARKER, '## 🔍 Semgrep security scan', ''];

if (findings.length === 0) {
  lines.push('✅ **No findings.**');
} else {
  lines.push(`❌ **${findings.length} finding(s)** — ${countBySeverity()}. The job fails until they are fixed.`, '');
  lines.push('| | Rule | Where | Problem |', '|---|---|---|---|');
  for (const finding of findings.slice(0, MAX_ROWS)) {
    const icon = SEVERITY_ICONS[finding.extra.severity] ?? '⚪';
    const rule = `\`${shortRuleId(finding.check_id)}\``;
    lines.push(`| ${icon} | ${rule} | ${fileLink(finding)} | ${shortMessage(finding.extra.message)} |`);
  }
  if (findings.length > MAX_ROWS) {
    lines.push('', `…and ${findings.length - MAX_ROWS} more. See the full list in the [job log](${runUrl}).`);
  }
  lines.push(
    '',
    'False positive? Add `// nosemgrep: <rule-id>` above the line, with a comment saying why it is safe.',
  );
}

if (scanErrors.length > 0) {
  // Files Semgrep couldn't parse aren't checked, so say so instead of hiding it.
  lines.push('', `⚠️ ${scanErrors.length} file(s) or rule(s) could not be scanned. See the [job log](${runUrl}).`);
}

lines.push('', `<sub>Commit ${sha.slice(0, 7)} · [workflow run](${runUrl}) · rules in \`.semgrep/rules.yml\`</sub>`);

writeFileSync(outputPath, `${lines.join('\n')}\n`);
// The workflow reads this to decide whether the job fails.
console.log(`findings=${findings.length}`);
