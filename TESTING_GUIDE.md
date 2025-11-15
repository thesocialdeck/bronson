# Message & Email Parsing Test Suite - Complete Guide

## 🎯 Overview

This comprehensive test suite validates Claude's ability to parse text messages and emails into structured data for the Bronson family scheduling app. It includes **105 carefully crafted test cases** covering real-world scenarios, edge cases, and challenging inputs.

## 📦 What's Included

### 1. Test Dataset (`tests/message-parsing-test-suite.ts`)
**105 test messages across 9 categories:**

| Category | Tests | Description |
|----------|-------|-------------|
| Simple Events | 20 | Basic appointments, practices, recurring events |
| Email Invitations | 15 | Formal email invites with various formats |
| School Communications | 15 | Newsletters, permission slips, schedules |
| Contact Information | 10 | Phone numbers, emails, addresses |
| Checklists | 10 | Task lists and todo items |
| Gift Lists | 5 | Birthday and holiday wishlists |
| Edge Cases | 15 | Ambiguous dates, cancellations, typos |
| Multi-Event | 10 | Complex messages with multiple items |
| Typos/Informal | 5 | Text speak and casual language |

### 2. Test Infrastructure
- ✅ **Vitest** - Unit testing framework
- ✅ **Live API Test Runner** - Real Claude API testing with detailed reporting
- ✅ **Mock Responses** - Offline testing capability
- ✅ **Validation Logic** - Smart comparison with fuzzy matching
- ✅ **Performance Tracking** - Execution time and confidence metrics
- ✅ **Detailed Reporting** - Markdown and JSON output formats

### 3. Test Runners

#### `npm run test:live` - Full Live Testing (Recommended)
- Tests all 105 messages against real Claude API
- Generates detailed reports
- Tracks performance metrics
- Saves results to `tests/test-report.md` and `tests/test-results.json`

#### `npm run test:live:sample` - Quick Sample (20 tests)
- Faster feedback loop for development
- Tests representative sample across all categories

#### `npm test` - Unit Tests (Vitest)
- Run with or without API access
- Great for CI/CD integration

## 🚀 Getting Started

### Step 1: Get Your API Key

You need an Anthropic API key to run live tests:

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new key
5. Copy the key (starts with `sk-ant-...`)

### Step 2: Add API Key to Environment

Edit the `.env` file in the project root:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

**Important:** Never commit `.env` to version control!

### Step 3: Run the Tests

```bash
# Run a quick sample first (20 tests, ~30 seconds)
npm run test:live:sample

# Run the full suite (105 tests, ~2-3 minutes)
npm run test:live
```

## 📊 Understanding Results

### Console Output

```
🧪 Starting Live API Tests...

Running 20 tests...

  Testing: txt-event-001 - Simple future event with specific time
    ✅ PASSED (1250ms, confidence: 95%)

  Testing: txt-event-002 - Event with day of week
    ❌ FAILED (1180ms, confidence: 88%)
       Errors: Time: expected "14:30", got "14:00"

...

================================================================================
📊 TEST RESULTS SUMMARY
================================================================================
Total Tests:     20
✅ Passed:       17 (85.0%)
❌ Failed:       3
📈 Avg Confidence: 89.2%
⏱️  Avg Time:     1150ms
================================================================================
```

### Generated Reports

1. **`tests/test-report.md`** - Human-readable markdown report with:
   - Summary statistics
   - Category breakdown
   - Detailed failure analysis
   - Expected vs actual data for each failure

2. **`tests/test-results.json`** - Machine-readable results for analysis

## 🔄 Iteration Process

### 1. Run Initial Tests
```bash
npm run test:live
```

### 2. Review Results
Check `tests/test-report.md` for:
- Overall pass rate
- Which categories are failing
- Common error patterns

### 3. Identify Issues

Common failure patterns:
- **Time parsing** - 12hr vs 24hr format confusion
- **Date interpretation** - Relative dates ("tomorrow", "next week")
- **Person matching** - Family vs individual assignments
- **Activity recognition** - New vs known activities
- **Multi-entity extraction** - Missing related actions

### 4. Update Prompts

Edit `app/lib/claude.server.ts`:
- Refine system prompt instructions
- Add examples for problematic cases
- Clarify edge case handling
- Improve structured output format

### 5. Re-run and Validate
```bash
npm run test:live:sample  # Quick validation
npm run test:live          # Full validation
```

### 6. Iterate Until 95%+ Pass Rate

Target milestones:
- 🎯 **80%** - Basic functionality working
- 🎯 **90%** - Good real-world performance
- 🎯 **95%** - Excellent reliability
- 🎯 **98%+** - Production-ready

## 🧪 Test Categories Explained

### Simple Events (20 tests)
Tests basic event parsing:
- Future dates ("tomorrow", "Thursday", "Dec 15")
- Time formats ("4pm", "14:30", "noon")
- Recurring patterns ("every Monday", "Tue/Thu")
- Duration ("4-6pm", "all day")

**Example:**
```
Input: "Oliver has soccer practice tomorrow at 4pm"
Expected: {
  person: 'Oliver',
  activity: 'soccer',
  time: '16:00',
  recurring: false
}
```

### Email Invitations (15 tests)
Tests formal email parsing:
- Subject line interpretation
- Multi-line event details
- RSVP information
- Location extraction

**Example:**
```
Input: "Subject: Birthday Party!
When: Saturday, Nov 23rd at 2:00 PM
Where: Bounce House Fun Center..."

Expected: {
  activity: 'birthday party',
  date: '2025-11-23',
  time: '14:00',
  location: 'Bounce House Fun Center'
}
```

### Edge Cases (15 tests)
Tests challenging scenarios:
- Vague times ("around 2ish")
- Cancellations ("practice canceled")
- Updates ("moved from 4pm to 5pm")
- Tentative events ("might be Friday")
- Typos and abbreviations

**Example:**
```
Input: "Oliver soccer practice moved from 4pm to 5pm starting next week"
Expected: {
  action: 'update',
  person: 'Oliver',
  activity: 'soccer',
  time: '17:00'
}
```

### Multi-Event (10 tests)
Tests complex messages with multiple items:
- Multiple events in one message
- Multiple contacts
- Events + checklists
- Weekly schedules

**Example:**
```
Input: "Busy day tomorrow! Oliver soccer 4pm, Ella piano 5pm, dinner with Johnsons 7pm"
Expected: {
  relatedActions: [
    { type: 'event', person: 'Oliver', activity: 'soccer', time: '16:00' },
    { type: 'event', person: 'Ella', activity: 'piano', time: '17:00' },
    { type: 'event', person: 'Family', activity: 'dinner', time: '19:00' }
  ]
}
```

## 📈 Performance Benchmarks

Expected performance metrics:

| Metric | Target | Excellent |
|--------|--------|-----------|
| Pass Rate | 80% | 95%+ |
| Avg Confidence | 75% | 85%+ |
| Avg Response Time | <2000ms | <1500ms |
| Low Confidence (<60%) | <10% | <5% |

## 🐛 Debugging

### Test Individual Messages

Edit `tests/quick-parse-test.ts`:

```typescript
const testInput = 'Your message here';
const result = await parseInput(testInput);
console.log(JSON.stringify(result, null, 2));
```

Run:
```bash
npx tsx tests/quick-parse-test.ts
```

### Add Debug Logging

In `app/lib/claude.server.ts`:

```typescript
export async function parseInput(input: string): Promise<ParseResponse> {
  // ... existing code ...

  console.log('System Prompt:', systemPrompt);
  console.log('User Input:', input);

  const message = await client.messages.create(/* ... */);

  console.log('Claude Response:', responseText);

  // ... rest of code ...
}
```

## 🎯 Success Criteria

A test passes when:

1. ✅ **Type Match** - Correctly identifies entity type (event/contact/checklist/gift)
2. ✅ **Key Fields** - Core data fields match expectations:
   - Events: person, activity, time/date
   - Contacts: name, phone/email
   - Checklists: title, items
3. ✅ **Confidence** - Score ≥ 60%
4. ✅ **Edge Cases** - Properly handles ambiguity, updates, cancellations

## 💡 Tips for Improvement

### Improving Time Parsing
- Add explicit examples for time formats
- Clarify AM/PM assumptions
- Handle "noon", "midnight", "evening" consistently

### Improving Date Parsing
- Provide current date context
- Show examples of relative dates
- Handle month/day vs day/month formats

### Improving Multi-Event Handling
- Emphasize `relatedActions` pattern in prompt
- Provide examples of complex messages
- Clarify when to split vs combine

### Improving Person Assignment
- Clarify "Family" event criteria
- Handle implied subjects ("pick up Ella" → Kate or Steven)
- Support flexible name matching

## 📝 Adding Custom Tests

Add to `tests/message-parsing-test-suite.ts`:

```typescript
{
  id: 'custom-001',
  category: 'Custom Tests',
  input: 'Your test message text here',
  expectedType: 'event', // or 'contact', 'checklist', 'gift', 'multiple'
  expectedData: {
    person: 'Oliver',
    activity: 'custom activity',
    time: '15:00',
    // ... other expected fields
  },
  description: 'Brief description of what this tests'
}
```

Re-run tests to include your new cases.

## 🚨 Troubleshooting

### "API key not set" error
- Check `.env` file exists in project root
- Verify `ANTHROPIC_API_KEY=sk-ant-...` format
- Ensure no quotes around the key value
- Restart terminal after setting env vars

### All tests failing immediately
- API key might be invalid
- Check internet connection
- Verify Anthropic API status

### Low pass rates (<50%)
- Review system prompt in `claude.server.ts`
- Check date handling (might need current date context)
- Verify expected data formats match actual responses

### Tests timeout
- Increase timeout in `vitest.config.ts`
- Check API rate limits
- Reduce test concurrency

## 📚 Files Reference

```
bronson/
├── tests/
│   ├── README.md                    # Quick reference
│   ├── message-parsing-test-suite.ts  # 105 test messages
│   ├── message-parsing.test.ts      # Vitest runner
│   ├── run-live-tests.ts            # Live API runner
│   ├── mock-parse-responses.ts      # Mock data
│   ├── quick-parse-test.ts          # Debug tool
│   ├── test-report.md               # Generated report
│   └── test-results.json            # Generated JSON results
├── app/
│   └── lib/
│       └── claude.server.ts         # Parsing logic to improve
├── .env                              # API key (create this!)
├── .env.example                      # API key template
├── TESTING_GUIDE.md                  # This file
└── package.json                      # npm scripts
```

## 🎓 Next Steps

1. **Set up API key** (required for testing)
2. **Run sample tests** (`npm run test:live:sample`)
3. **Review initial results** (check `tests/test-report.md`)
4. **Identify improvement areas** (focus on lowest-scoring categories)
5. **Update prompts** (edit `app/lib/claude.server.ts`)
6. **Iterate** (re-run tests, aim for 95%+)
7. **Celebrate** 🎉 when you hit your target!

## 📞 Support

- Check `tests/README.md` for quick reference
- Review test-report.md for failure details
- Add `console.log` for debugging
- Test individual messages with `quick-parse-test.ts`

---

**Ready to test?** Add your API key to `.env` and run:
```bash
npm run test:live:sample
```

Good luck! 🚀
