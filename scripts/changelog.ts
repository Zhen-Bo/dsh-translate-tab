import {readFile, writeFile} from 'node:fs/promises';

const CHANGELOG_PATH = 'CHANGELOG.md';
const UNRELEASED_HEADING = '## [Unreleased]';

async function readPackageVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  return packageJson.version;
}

function findSectionBody(changelog: string, heading: string): string | null {
  const start = changelog
    .split('\n')
    .findIndex(line => line === heading || line.startsWith(`${heading} `));
  if (start === -1) return null;
  const lines = changelog.split('\n').slice(start + 1);
  const end = lines.findIndex(line => line.startsWith('## '));
  return lines
    .slice(0, end === -1 ? undefined : end)
    .join('\n')
    .trim();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function releaseUnreleasedSection(version: string): Promise<void> {
  const changelog = await readFile(CHANGELOG_PATH, 'utf8');
  if (findSectionBody(changelog, `## [${version}]`) !== null) {
    throw new Error(`${CHANGELOG_PATH} already has a section for ${version}.`);
  }
  if (!findSectionBody(changelog, UNRELEASED_HEADING)) {
    throw new Error(
      `${CHANGELOG_PATH} has no entries under ${UNRELEASED_HEADING}. Describe the release there first.`,
    );
  }
  const released = changelog.replace(
    UNRELEASED_HEADING,
    `${UNRELEASED_HEADING}\n\n## [${version}] - ${today()}`,
  );
  await writeFile(CHANGELOG_PATH, released);
}

async function printReleaseNotes(version: string): Promise<void> {
  const changelog = await readFile(CHANGELOG_PATH, 'utf8');
  const notes = findSectionBody(changelog, `## [${version}]`);
  if (!notes) {
    throw new Error(`${CHANGELOG_PATH} has no entries for ${version}.`);
  }
  process.stdout.write(`${notes}\n`);
}

const commands: Record<string, (version: string) => Promise<void>> = {
  release: releaseUnreleasedSection,
  notes: printReleaseNotes,
};

const [commandName] = process.argv.slice(2);
const command = commands[commandName];
if (!command) {
  console.error('Usage: node scripts/changelog.ts <release|notes>');
  process.exit(1);
}
try {
  await command(await readPackageVersion());
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
