import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

export const PACKAGE_VERSION = packageJson.version;

export const PRODUCT = Object.freeze({
  displayName: "teamFlow",
  packageName: packageJson.name,
  repositoryUrl: "https://github.com/Borges360/TeamFlow.git",
  version: PACKAGE_VERSION,
  tag: `v${PACKAGE_VERSION}`,
});

export function isCanonicalRepositoryUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const candidate = value.trim().replace(/[\\/]+$/, "").replace(/\.git$/i, "");
  const patterns = [
    /^https:\/\/github\.com\/Borges360\/TeamFlow$/i,
    /^ssh:\/\/git@github\.com\/Borges360\/TeamFlow$/i,
    /^git@github\.com:Borges360\/TeamFlow$/i,
  ];

  return patterns.some((pattern) => pattern.test(candidate));
}
