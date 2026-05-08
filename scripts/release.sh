#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh patch|minor|major
# 1. Bumps version in package.json
# 2. Generates changelog from conventional commits
# 3. Commits, tags, and pushes
# 4. Publishes to GitHub npm registry

BUMP="${1:?Usage: release.sh <patch|minor|major>}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Error: argument must be 'patch', 'minor', or 'major'"
  exit 1
fi

# Ensure working tree is clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is dirty. Commit or stash changes first."
  exit 1
fi

# Ensure we're on main/master
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
  echo "Warning: you're on branch '$BRANCH', not main/master. Continue? (y/N)"
  read -r CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Get current version
OLD_VERSION=$(node -p "require('./package.json').version")

# Bump version in package.json (no git tag, no commit — we do that ourselves)
npm version "$BUMP" --no-git-tag-version --no-commit-hooks
NEW_VERSION=$(node -p "require('./package.json').version")

# Generate changelog entry from commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
echo ""
echo "Generating changelog for $OLD_VERSION → $NEW_VERSION"

CHANGELOG_ENTRY="## $NEW_VERSION ($(date +%Y-%m-%d))"$'\n\n'

if [[ -n "$LAST_TAG" ]]; then
  COMMITS=$(git log "$LAST_TAG"..HEAD --pretty=format:"%s" --no-merges)
else
  COMMITS=$(git log --pretty=format:"%s" --no-merges)
fi

FEATS=""
FIXES=""
OTHER=""

while IFS= read -r msg; do
  [[ -z "$msg" ]] && continue
  if [[ "$msg" =~ ^feat ]]; then
    FEATS+="- $msg"$'\n'
  elif [[ "$msg" =~ ^fix ]]; then
    FIXES+="- $msg"$'\n'
  else
    OTHER+="- $msg"$'\n'
  fi
done <<< "$COMMITS"

[[ -n "$FEATS" ]] && CHANGELOG_ENTRY+="### Features"$'\n'"$FEATS"$'\n'
[[ -n "$FIXES" ]] && CHANGELOG_ENTRY+="### Bug Fixes"$'\n'"$FIXES"$'\n'
[[ -n "$OTHER" ]] && CHANGELOG_ENTRY+="### Other Changes"$'\n'"$OTHER"$'\n'

# Prepend to CHANGELOG.md
if [[ -f CHANGELOG.md ]]; then
  echo "${CHANGELOG_ENTRY}$(cat CHANGELOG.md)" > CHANGELOG.md
else
  echo "# Changelog"$'\n\n'"$CHANGELOG_ENTRY" > CHANGELOG.md
fi

echo ""
echo "--- Changelog entry ---"
echo "$CHANGELOG_ENTRY"
echo "-----------------------"

# Commit and tag
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: update version to v$NEW_VERSION"
git tag "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push
echo ""
echo "Pushing commit and tag v$NEW_VERSION..."
git push
git push origin "v$NEW_VERSION"

# Build and publish to GitHub npm registry
echo ""
echo "Publishing @datachefhq/mus@$NEW_VERSION to GitHub npm registry..."
npm publish

echo ""
echo "Released and published v$NEW_VERSION"
