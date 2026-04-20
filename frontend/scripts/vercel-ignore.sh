#!/bin/bash

# Vercel Ignored Build Step Script
# Returns 1 (True) to proceed with build, 0 (False) to skip.

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# 1. Skip if the commit is on a branch we don't want to deploy (optional)
# if [[ "$VERCEL_GIT_COMMIT_REF" == "staging" ]]; then
#   echo "🛑 Skipping deployment for staging branch."
#   exit 0
# fi

# 2. Check for changes in the frontend directory OR root package.json
# Using git diff to compare the current commit with the previous deployment's commit.
# We check:
# - Current directory (.) which is 'frontend' if Root Directory is set correctly
# - Root package.json (../package.json)
# - Root lockfiles

git diff --quiet $VERCEL_GIT_PREVIOUS_SHA HEAD . ../package.json ../package-lock.json

result=$?

if [ $result -eq 1 ]; then
  echo "✅ Changes detected in frontend or root configuration. Proceeding with build."
  exit 1
else
  echo "🛑 No changes detected in frontend. Skipping build."
  exit 0
fi
