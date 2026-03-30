#!/bin/bash
# Hook: Code audit review after code changes
# Triggered by: PostToolUse on Write|Edit
# Checks: ESLint, console statements, HIPAA-sensitive patterns, TODO/FIXME markers
# Exit 0 = pass (with warnings), Exit 2 = block on critical issues

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

PROJECT_DIR="${CWD:-$CLAUDE_PROJECT_DIR}"
cd "$PROJECT_DIR" || exit 0

# Only audit TypeScript/TSX files
case "$FILE" in
  *.ts|*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Skip if file doesn't exist (was deleted)
[ -f "$FILE" ] || exit 0

WARNINGS=""
ERRORS=""

# 1. ESLint check
LINT_OUTPUT=$(npx eslint "$FILE" --no-error-on-unmatched-pattern 2>&1)
LINT_EXIT=$?
if [ $LINT_EXIT -ne 0 ]; then
  LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error" 2>/dev/null || echo "0")
  if [ "$LINT_ERRORS" -gt 0 ]; then
    ERRORS="${ERRORS}ESLint found $LINT_ERRORS error(s):\n$(echo "$LINT_OUTPUT" | grep "error" | head -10)\n\n"
  else
    WARNINGS="${WARNINGS}ESLint warnings:\n$(echo "$LINT_OUTPUT" | grep "warning" | head -5)\n\n"
  fi
fi

# 2. Check for console.log/debug statements (should be removed for production)
CONSOLE_HITS=$(grep -n "console\.\(log\|debug\|info\)" "$FILE" 2>/dev/null | grep -v "// eslint-disable" | head -5)
if [ -n "$CONSOLE_HITS" ]; then
  WARNINGS="${WARNINGS}Console statements found (remove before production):\n${CONSOLE_HITS}\n\n"
fi

# 3. HIPAA audit: check for potential PHI logging patterns
PHI_PATTERNS=$(grep -n -i "console\.\(log\|warn\|error\).*\(patient\|ssn\|dob\|date.of.birth\|social.security\|medical\|diagnosis\|prescription\|[^a-z]email\|customerEmail\|custEmail\|toEmail\|\.phone\|phoneNumber\|firstName\|lastName\|dateOfBirth\|shippingAddress\|patientName\)" "$FILE" 2>/dev/null | grep -v "emailError\|emailErr\|email_error\|send.*email\|email.*fail\|email.*sent\|REDACTED" | head -5)
if [ -n "$PHI_PATTERNS" ]; then
  ERRORS="${ERRORS}HIPAA RISK — Possible PHI logging detected:\n${PHI_PATTERNS}\n\n"
fi

# 4. Check for hardcoded secrets/keys
SECRET_PATTERNS=$(grep -n -i "\(api.key\|secret\|password\|token\)\s*[:=]\s*['\"][a-zA-Z0-9]" "$FILE" 2>/dev/null | grep -v "process\.env\|\.env\|config\." | head -5)
if [ -n "$SECRET_PATTERNS" ]; then
  ERRORS="${ERRORS}SECURITY — Possible hardcoded secrets:\n${SECRET_PATTERNS}\n\n"
fi

# 5. Check for TODO/FIXME markers (informational)
TODOS=$(grep -n -i "TODO\|FIXME\|HACK\|XXX" "$FILE" 2>/dev/null | head -5)
if [ -n "$TODOS" ]; then
  WARNINGS="${WARNINGS}TODO/FIXME markers:\n${TODOS}\n\n"
fi

# Report results
if [ -n "$ERRORS" ]; then
  echo -e "=== CODE AUDIT FAILED ===\n" >&2
  echo -e "$ERRORS" >&2
  if [ -n "$WARNINGS" ]; then
    echo -e "Warnings:\n$WARNINGS" >&2
  fi
  exit 2
fi

if [ -n "$WARNINGS" ]; then
  echo -e "=== Code Audit Warnings ===\n$WARNINGS"
fi

exit 0
