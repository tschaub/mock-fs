const semver = require('semver');
const pkg = require('../package.json');

function nextVersion() {
  const version = pkg.version;
  const s = semver.parse(version);
  if (!s) {
    throw new Error(`Invalid version ${version}`);
  }
  return `${s.major}.${s.minor}.${s.patch}-dev.${Date.now()}`;
}

if (require.main === module) {
  process.stdout.write(`${nextVersion()}\n`);
}
