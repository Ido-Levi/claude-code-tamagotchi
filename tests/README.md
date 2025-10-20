# Test Suite for Claude Code Tamagotchi

This directory contains comprehensive unit tests for the trajectory analysis system and core components.

## Test Coverage

### 1. **GroqClient Tests** (`llm/GroqClient.test.ts`)
Tests for the LLM client that analyzes Claude's behavior:
- ✅ Constructor initialization (with and without API key)
- ✅ User message analysis and summarization
- ✅ Full message preservation (no slicing)
- ✅ Default analysis fallback
- ✅ Response parsing and validation
- ✅ Score clamping (0-10 range)
- ✅ Enum validation (feedback_type, severity)
- ✅ Violation detection parsing
- ✅ All 4 violation types (unauthorized_action, refused_request, excessive_exploration, wrong_direction)
- ✅ Connection testing

**Total: 15 test cases**

### 2. **FeedbackDatabase Tests** (`engine/feedback/FeedbackDatabase.test.ts`)
Tests for the SQLite database operations:
- ✅ Workspace ID extraction from paths
- ✅ Feedback saving and retrieval
- ✅ Session-based filtering
- ✅ Marking feedback as shown
- ✅ Expiration time handling
- ✅ Violation saving and retrieval
- ✅ Session isolation for violations
- ✅ Marking violations as notified
- ✅ All 4 violation types tracking
- ✅ Message metadata operations
- ✅ Chronological ordering
- ✅ Session isolation for feedback
- ✅ Funny observation retrieval

**Total: 18 test cases**

### 3. **TranscriptAnalyzer Tests** (`engine/feedback/TranscriptAnalyzer.test.ts`)
Tests for conversation analysis and session management:
- ✅ Feature enable/disable checks
- ✅ Mode validation (off/passive/full)
- ✅ Cached feedback retrieval
- ✅ Session isolation for cached feedback
- ✅ Feedback prioritization (problematic > annoying > good)
- ✅ Recency sorting for same severity
- ✅ Behavior score calculation (0-100 range)
- ✅ Score adjustments for different severities
- ✅ Score clamping at boundaries
- ✅ Violation counting
- ✅ Severity-based violation filtering
- ✅ Session isolation for scores and violations
- ✅ Marking feedback as shown

**Total: 20 test cases**

### 4. **Violation-Check Tests** (`commands/violation-check.test.ts`)
Tests for the pre-hook blocking logic:
- ✅ Severity threshold filtering
- ✅ All severity levels (minor, moderate, severe, critical)
- ✅ Age-based filtering (30-minute window)
- ✅ Severity-based sorting (most severe first)
- ✅ Notification tracking
- ✅ Batch violation handling
- ✅ Session isolation for violations
- ✅ All 4 violation types

**Total: 14 test cases**

## Running the Tests

### Prerequisites
- **Bun runtime** (v1.0+)

### Install Dependencies
```bash
bun install
```

### Run All Tests
```bash
bun test
```

### Run Tests in Watch Mode
```bash
bun test:watch
```

### Run Specific Test File
```bash
bun test tests/llm/GroqClient.test.ts
bun test tests/engine/feedback/FeedbackDatabase.test.ts
bun test tests/engine/feedback/TranscriptAnalyzer.test.ts
bun test tests/commands/violation-check.test.ts
```

### Run with Debug Output
```bash
PET_FEEDBACK_DEBUG=true bun test
```

## Test Statistics

- **Total Test Files:** 4
- **Total Test Cases:** 67
- **Code Coverage Areas:**
  - Violation detection (4 types)
  - Session isolation
  - Database operations
  - Behavior scoring
  - LLM response parsing
  - Pre-hook blocking logic

## Test Design Principles

1. **Isolation**: Each test uses temporary databases that are cleaned up after
2. **Session Separation**: All tests verify session isolation works correctly
3. **Edge Cases**: Tests cover boundary conditions, invalid inputs, and error cases
4. **No API Calls**: Tests don't require actual Groq API keys (mocked/fallback behavior)
5. **Fast Execution**: All tests use in-memory or temp file databases

## What's Tested

### Trajectory Analysis Core
- ✅ Multi-step workflow understanding
- ✅ Constraint tracking across messages
- ✅ Intent accumulation from conversation history
- ✅ Phase recognition (exploration, planning, implementation, etc.)

### Violation Detection
- ✅ All 4 violation types properly identified
- ✅ Severity classification (minor → critical)
- ✅ Evidence collection and storage
- ✅ Correction prompt generation

### Session Isolation
- ✅ Feedback never leaks between sessions
- ✅ Violations are session-specific
- ✅ Behavior scores are independent
- ✅ Database queries filter by session_id

### Pre-Hook Blocking
- ✅ Severity threshold enforcement
- ✅ Age-based filtering (recent violations only)
- ✅ Batch violation notifications
- ✅ Notification tracking (don't spam Claude)

## CI/CD Integration

Add to your CI pipeline:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
```

## Contributing

When adding new features to the trajectory analysis system:

1. Write tests first (TDD approach)
2. Ensure session isolation is maintained
3. Test all violation types if detection logic changes
4. Verify backward compatibility
5. Run full test suite before committing

## Test Maintenance

- Update tests when prompt engineering changes
- Add new test cases for discovered edge cases
- Keep test databases cleaned up (handled automatically)
- Monitor test execution time (should be < 5 seconds total)
