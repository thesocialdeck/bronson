# Message & Email Parsing Test Suite

Comprehensive test suite for validating Claude's ability to parse text messages and emails into structured data for the Bronson family scheduling app.

## 📊 Test Coverage

**Total Tests: 105**

### Test Categories

1. **Simple Events** (20 tests) - Basic event parsing with times, dates, recurring patterns
2. **Email Invitations** (15 tests) - Formal email invitations with various formats
3. **School Communications** (15 tests) - School newsletters, permission slips, schedules
4. **Contact Information** (10 tests) - Parsing contact details from messages
5. **Checklists** (10 tests) - Task lists and todo items
6. **Gift Lists** (5 tests) - Birthday and holiday wishlists
7. **Edge Cases** (15 tests) - Ambiguous dates, cancellations, updates, typos
8. **Multi-Event** (10 tests) - Complex messages with multiple events
9. **Typos/Informal** (5 tests) - Text speak and informal language

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API key:**
   Add your Anthropic API key to `.env`:
   ```bash
   ANTHROPIC_API_KEY=your-api-key-here
   ```

## 🧪 Running Tests

### Live API Tests (Recommended)

Test against the real Claude API with detailed reporting:

```bash
# Run all 105 tests
npm run test:live

# Run a sample of 20 tests (faster, for development)
npm run test:live:sample

# Run a custom number of tests
npx tsx tests/run-live-tests.ts --limit=50
```

**Output:**
- Console summary with pass/fail rates
- Detailed markdown report: `tests/test-report.md`
- JSON results: `tests/test-results.json`

### Unit Tests (Vitest)

```bash
# Run all tests once
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Interactive UI
npm run test:ui
```

## 📈 Test Results

The live test runner provides:

- ✅ **Overall pass rate** - Target: 95%+
- 📊 **Category breakdown** - Performance by test category
- 💡 **Common errors** - Most frequent failure patterns
- ⏱️ **Performance metrics** - Average execution time and confidence scores
- 📝 **Detailed reports** - Full failure analysis with expected vs actual data

## 🔧 Test Structure

Each test includes:

```typescript
{
  id: 'txt-event-001',
  category: 'Simple Events',
  input: 'Oliver has soccer practice tomorrow at 4pm',
  expectedType: 'event',
  expectedData: {
    person: 'Oliver',
    activity: 'soccer',
    time: '16:00',
    recurring: false
  },
  description: 'Simple future event with specific time'
}
```

## 🎯 Success Criteria

Tests pass when:
- ✅ Correct type identified (event, contact, checklist, gift)
- ✅ Key data fields match expected values
- ✅ Confidence score ≥ 60%
- ✅ Proper handling of edge cases

## 📊 Example Output

```
================================================================================
📊 TEST RESULTS SUMMARY
================================================================================
Total Tests:     105
✅ Passed:       92 (87.6%)
❌ Failed:       13
📈 Avg Confidence: 88.3%
⏱️  Avg Time:     1250ms
================================================================================

📁 Results by Category:
  ✅ Simple Events           18/20 (90.0%)
  ✅ Contact Information     9/10 (90.0%)
  ⚠️  Edge Cases            11/15 (73.3%)
  ❌ Multi-Event            6/10 (60.0%)

🔍 Most Common Errors:
  • Time: 8 occurrences
  • Person: 5 occurrences
  • Activity: 4 occurrences
```

## 🔄 Iterating and Improving

1. Run the test suite
2. Review the generated report in `tests/test-report.md`
3. Identify patterns in failures
4. Update prompts in `app/lib/claude.server.ts`
5. Re-run tests to validate improvements
6. Repeat until achieving 95%+ pass rate

## 📝 Adding New Tests

Add tests to `tests/message-parsing-test-suite.ts`:

```typescript
{
  id: 'custom-001',
  category: 'Custom Category',
  input: 'Your test message here',
  expectedType: 'event',
  expectedData: {
    // Expected parsed data
  },
  description: 'What this test validates'
}
```

## 🐛 Debugging

For individual test debugging:

```bash
# Run quick test with one message
npx tsx tests/quick-parse-test.ts
```

Edit `tests/quick-parse-test.ts` to test specific inputs.

## 📚 Files

- `message-parsing-test-suite.ts` - Test data (105 messages)
- `message-parsing.test.ts` - Vitest test runner
- `run-live-tests.ts` - Live API test runner with reporting
- `mock-parse-responses.ts` - Mock responses for offline testing
- `quick-parse-test.ts` - Quick debugging tool

## 🎯 Goals

- **Minimum:** 80% pass rate
- **Target:** 95% pass rate
- **Stretch:** 98%+ pass rate with high confidence scores

Happy testing! 🚀
