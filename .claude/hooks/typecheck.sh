#!/bin/bash
# Run Next.js build type-check when Claude finishes responding (Stop hook)
# Gracefully skips if node_modules aren't installed
INPUT=$(cat)

# Skip if node_modules not installed
if [ ! -d "$CLAUDE_PROJECT_DIR/node_modules" ]; then
  exit 0
fi

OUTPUT=$(npm run build 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  ERRORS=$(echo "$OUTPUT" | grep -E "(error TS|Error:|Type error)" | head -20)
  if [ -n "$ERRORS" ]; then
    jq -n --arg errors "$ERRORS" '{
      decision: "block",
      reason: ("Build failed with type errors:\n" + $errors + "\nFix these before continuing.")
    }'
  else
    TAIL=$(echo "$OUTPUT" | tail -10)
    jq -n --arg tail "$TAIL" '{
      decision: "block",
      reason: ("Build failed:\n" + $tail)
    }'
  fi
else
  exit 0
fi
