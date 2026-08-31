const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseSemver(value) {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  return match.slice(1).map(Number);
}

export function compareSemver(left, right) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);
  if (!leftParts || !rightParts) {
    throw new TypeError(`Versão SemVer inválida: ${left} ou ${right}`);
  }

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] < rightParts[index] ? -1 : 1;
    }
  }
  return 0;
}

export function releaseVersionFromTag(tag) {
  if (!tag.startsWith("v")) {
    return null;
  }
  const version = tag.slice(1);
  return parseSemver(version) ? version : null;
}

export function newestReleaseTag(tags) {
  return tags
    .map((tag) => ({ tag, version: releaseVersionFromTag(tag) }))
    .filter(({ version }) => version !== null)
    .sort((left, right) => compareSemver(right.version, left.version))[0] ?? null;
}
