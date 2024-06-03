#!/bin/bash

# Check if a version type (minor or patch) is provided as a command-line argument
if [ -z "$1" ]; then
  echo "Usage: $0 patch | minor"
  exit 1
fi

# Check if the provided version type is valid
if [ "$1" != "patch" ] && [ "$1" != "minor" ]; then
  echo "Invalid version type: $1"
  echo "version_type should be 'patch' or 'minor'"
  exit 1
fi

# Run git status and capture the output
git_status=$(git status --porcelain)

# Check if the repository is clean
if [ -z "$git_status" ]; then
  # If the repository is clean, run yarn publish with the specified version type
  yarn publish --new-version "$1"

  # Capture the new version number
  new_version=$(node -p "require('./package.json').version")

  # Update the version field in jsr.json
  jq ".version = \"$new_version\"" jsr.json > tmp.json && mv tmp.json jsr.json

  echo "jsr.json updated with the new version: $new_version"

  # Commit the changes to Git
  git add jsr.json
  git commit -m "Bump version to $new_version"

  echo "Changes committed to Git"

  npx jsr publish

# Collect release notes from commits since the last release
  last_release=$(git describe --tags --abbrev=0)
  release_notes=$(git log "${last_release}..HEAD" --pretty="%s" | awk -v prefix="* " '/^(feat|fix|perf|docs|test|chore|refactor|style|build|ci|revert)(\([a-z]+\))?(!\?)?:/{print prefix $0}')

  # Push the new tag and create a release
  git push origin "v$new_version"
  gh release create "v$new_version" --notes "Release version $new_version"

else
  echo "Repository is not clean. Please commit or stash your changes before publishing."
  exit 1
fi