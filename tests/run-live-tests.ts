/**
 * Live API Test Runner
 *
 * Runs tests against the real Claude API, analyzes results,
 * and provides recommendations for improvements.
 */

import 'dotenv/config';
import { parseInput } from '~/lib/claude.server';
import { testMessages, type TestMessage } from './message-parsing-test-suite';
import type { ParseResponse } from '~/types';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  testId: string;
  category: string;
  description: string;
  input: string;
  passed: boolean;
  actualResponse: ParseResponse | null;
  expectedData: any;
  errors: string[];
  executionTime: number;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
  results: TestResult[];
  categoryBreakdown: Record<string, { passed: number; total: number; passRate: number }>;
  commonErrors: Record<string, number>;
}

// Validation helpers
function validateEventData(actual: any, expected: any): string[] {
  const errors: string[] = [];

  if (expected.person) {
    const actualPerson = (actual.person || '').toLowerCase();
    const expectedPerson = expected.person.toLowerCase();

    // Allow flexible matching
    if (expectedPerson === 'family') {
      // Check if it includes multiple people or is "family"
      if (!actualPerson.includes(',') && !actualPerson.includes('family') &&
          !actualPerson.includes('everyone') && !actualPerson.includes('all')) {
        errors.push(`Expected family event, got "${actual.person}"`);
      }
    } else if (actualPerson !== expectedPerson && !actualPerson.includes(expectedPerson)) {
      errors.push(`Person: expected "${expected.person}", got "${actual.person}"`);
    }
  }

  if (expected.activity) {
    const actualActivity = (actual.activity || actual.type || '').toLowerCase();
    const expectedActivity = expected.activity.toLowerCase();

    // Check if activities match or are closely related
    if (!actualActivity.includes(expectedActivity) && !expectedActivity.includes(actualActivity)) {
      // Allow some common variations
      const variations: Record<string, string[]> = {
        'soccer': ['football', 'soccer'],
        'doctor': ['doctor', 'medical', 'appointment'],
        'dentist': ['dentist', 'dental'],
      };

      let isMatch = false;
      for (const [key, vals] of Object.entries(variations)) {
        if (vals.includes(expectedActivity) && vals.includes(actualActivity)) {
          isMatch = true;
          break;
        }
      }

      if (!isMatch) {
        errors.push(`Activity: expected "${expected.activity}", got "${actual.activity || actual.type}"`);
      }
    }
  }

  if (expected.time && actual.time !== expected.time) {
    errors.push(`Time: expected "${expected.time}", got "${actual.time}"`);
  }

  if (expected.date && actual.date !== expected.date) {
    errors.push(`Date: expected "${expected.date}", got "${actual.date}"`);
  }

  if (expected.recurring !== undefined) {
    const isRecurring = actual.recurring === true || actual.day !== undefined;
    if (isRecurring !== expected.recurring) {
      errors.push(`Recurring: expected ${expected.recurring}, got ${isRecurring}`);
    }
  }

  if (expected.startTime && actual.time !== expected.startTime) {
    errors.push(`Start time: expected "${expected.startTime}", got "${actual.time}"`);
  }

  if (expected.endTime && actual.endTime !== expected.endTime) {
    errors.push(`End time: expected "${expected.endTime}", got "${actual.endTime}"`);
  }

  return errors;
}

function validateContactData(actual: any, expected: any): string[] {
  const errors: string[] = [];

  if (expected.name) {
    const actualName = (actual.name || '').toLowerCase();
    const expectedName = expected.name.toLowerCase();
    if (!actualName.includes(expectedName) && !expectedName.includes(actualName)) {
      errors.push(`Name: expected "${expected.name}", got "${actual.name}"`);
    }
  }

  if (expected.phone) {
    const normalize = (p: string) => p.replace(/[\s\-\(\)]/g, '');
    if (normalize(actual.phone || '') !== normalize(expected.phone)) {
      errors.push(`Phone: expected "${expected.phone}", got "${actual.phone}"`);
    }
  }

  if (expected.email && actual.email !== expected.email) {
    errors.push(`Email: expected "${expected.email}", got "${actual.email}"`);
  }

  return errors;
}

function validateChecklistData(actual: any, expected: any): string[] {
  const errors: string[] = [];

  if (expected.person && actual.person !== expected.person) {
    errors.push(`Person: expected "${expected.person}", got "${actual.person}"`);
  }

  if (expected.title) {
    const actualTitle = (actual.title || '').toLowerCase();
    const expectedTitle = expected.title.toLowerCase();
    if (!actualTitle.includes(expectedTitle) && !expectedTitle.includes(actualTitle)) {
      errors.push(`Title: expected "${expected.title}", got "${actual.title}"`);
    }
  }

  if (expected.items !== undefined) {
    const actualCount = actual.items?.length || 0;
    if (Math.abs(actualCount - expected.items) > 1) { // Allow off-by-one
      errors.push(`Items: expected ${expected.items}, got ${actualCount}`);
    }
  }

  return errors;
}

function validateTestResult(test: TestMessage, response: ParseResponse): TestResult {
  const result: TestResult = {
    testId: test.id,
    category: test.category,
    description: test.description,
    input: test.input,
    passed: false,
    actualResponse: response,
    expectedData: test.expectedData,
    errors: [],
    executionTime: 0,
  };

  // Check type
  if (test.expectedType === 'multiple') {
    const hasMultiple = response.relatedActions && response.relatedActions.length > 0;
    if (!hasMultiple) {
      result.errors.push('Expected multiple actions via relatedActions array');
    }
  } else {
    if (response.type !== test.expectedType) {
      result.errors.push(`Type: expected "${test.expectedType}", got "${response.type}"`);
    }
  }

  // Validate data based on type
  if (response.type === 'event' && test.expectedType === 'event') {
    result.errors.push(...validateEventData(response.data, test.expectedData));
  } else if (response.type === 'contact' && test.expectedType === 'contact') {
    result.errors.push(...validateContactData(response.data, test.expectedData));
  } else if (response.type === 'checklist' && test.expectedType === 'checklist') {
    result.errors.push(...validateChecklistData(response.data, test.expectedData));
  }

  // Check confidence
  if (response.confidence < 60) {
    result.errors.push(`Low confidence: ${response.confidence}%`);
  }

  result.passed = result.errors.length === 0;
  return result;
}

async function runLiveTests(testLimit?: number): Promise<TestSummary> {
  console.log('🧪 Starting Live API Tests...\n');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY not set in environment');
    console.error('Please add your API key to .env file\n');
    process.exit(1);
  }

  const testsToRun = testLimit ? testMessages.slice(0, testLimit) : testMessages;
  const results: TestResult[] = [];

  let totalConfidence = 0;
  let totalTime = 0;
  let confidenceCount = 0;

  console.log(`Running ${testsToRun.length} tests...\n`);

  for (const test of testsToRun) {
    const startTime = Date.now();

    try {
      console.log(`  Testing: ${test.id} - ${test.description}`);

      const response = await parseInput(test.input);
      const executionTime = Date.now() - startTime;

      const result = validateTestResult(test, response);
      result.executionTime = executionTime;

      results.push(result);

      if (response.confidence) {
        totalConfidence += response.confidence;
        confidenceCount++;
      }
      totalTime += executionTime;

      if (result.passed) {
        console.log(`    ✅ PASSED (${executionTime}ms, confidence: ${response.confidence}%)`);
      } else {
        console.log(`    ❌ FAILED (${executionTime}ms, confidence: ${response.confidence}%)`);
        console.log(`       Errors: ${result.errors.join('; ')}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.log(`    💥 ERROR: ${error}`);

      results.push({
        testId: test.id,
        category: test.category,
        description: test.description,
        input: test.input,
        passed: false,
        actualResponse: null,
        expectedData: test.expectedData,
        errors: [`Exception: ${error}`],
        executionTime,
      });
      totalTime += executionTime;
    }
  }

  // Calculate summary
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;
  const passRate = (passedTests / results.length) * 100;
  const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
  const avgTime = totalTime / results.length;

  // Category breakdown
  const categoryBreakdown: Record<string, { passed: number; total: number; passRate: number }> = {};
  for (const result of results) {
    if (!categoryBreakdown[result.category]) {
      categoryBreakdown[result.category] = { passed: 0, total: 0, passRate: 0 };
    }
    categoryBreakdown[result.category].total++;
    if (result.passed) categoryBreakdown[result.category].passed++;
  }

  for (const category of Object.keys(categoryBreakdown)) {
    const stats = categoryBreakdown[category];
    stats.passRate = (stats.passed / stats.total) * 100;
  }

  // Common errors
  const commonErrors: Record<string, number> = {};
  for (const result of results) {
    for (const error of result.errors) {
      const errorType = error.split(':')[0]; // Get error category
      commonErrors[errorType] = (commonErrors[errorType] || 0) + 1;
    }
  }

  const summary: TestSummary = {
    totalTests: results.length,
    passedTests,
    failedTests,
    passRate,
    averageConfidence: avgConfidence,
    averageExecutionTime: avgTime,
    results,
    categoryBreakdown,
    commonErrors,
  };

  return summary;
}

function printSummary(summary: TestSummary) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests:     ${summary.totalTests}`);
  console.log(`✅ Passed:       ${summary.passedTests} (${summary.passRate.toFixed(1)}%)`);
  console.log(`❌ Failed:       ${summary.failedTests}`);
  console.log(`📈 Avg Confidence: ${summary.averageConfidence.toFixed(1)}%`);
  console.log(`⏱️  Avg Time:     ${summary.averageExecutionTime.toFixed(0)}ms`);
  console.log('='.repeat(80));

  console.log('\n📁 Results by Category:');
  Object.entries(summary.categoryBreakdown)
    .sort(([, a], [, b]) => b.passRate - a.passRate)
    .forEach(([category, stats]) => {
      const icon = stats.passRate >= 80 ? '✅' : stats.passRate >= 60 ? '⚠️' : '❌';
      console.log(`  ${icon} ${category.padEnd(25)} ${stats.passed}/${stats.total} (${stats.passRate.toFixed(1)}%)`);
    });

  if (Object.keys(summary.commonErrors).length > 0) {
    console.log('\n🔍 Most Common Errors:');
    Object.entries(summary.commonErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([error, count]) => {
        console.log(`  • ${error}: ${count} occurrences`);
      });
  }

  console.log('\n' + '='.repeat(80));
}

function generateReport(summary: TestSummary): string {
  const timestamp = new Date().toISOString();

  let report = `# Message Parsing Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${summary.totalTests}\n`;
  report += `- **Passed:** ${summary.passedTests} (${summary.passRate.toFixed(1)}%)\n`;
  report += `- **Failed:** ${summary.failedTests}\n`;
  report += `- **Average Confidence:** ${summary.averageConfidence.toFixed(1)}%\n`;
  report += `- **Average Execution Time:** ${summary.averageExecutionTime.toFixed(0)}ms\n\n`;

  report += `## Results by Category\n\n`;
  report += `| Category | Passed | Total | Pass Rate |\n`;
  report += `|----------|--------|-------|-----------||\n`;
  Object.entries(summary.categoryBreakdown)
    .sort(([, a], [, b]) => b.passRate - a.passRate)
    .forEach(([category, stats]) => {
      report += `| ${category} | ${stats.passed} | ${stats.total} | ${stats.passRate.toFixed(1)}% |\n`;
    });

  if (summary.failedTests > 0) {
    report += `\n## Failed Tests\n\n`;
    const failedResults = summary.results.filter(r => !r.passed);

    failedResults.forEach(result => {
      report += `### ${result.testId}: ${result.description}\n\n`;
      report += `**Category:** ${result.category}\n\n`;
      report += `**Input:**\n\`\`\`\n${result.input}\n\`\`\`\n\n`;
      report += `**Errors:**\n`;
      result.errors.forEach(err => {
        report += `- ${err}\n`;
      });
      report += `\n**Expected:**\n\`\`\`json\n${JSON.stringify(result.expectedData, null, 2)}\n\`\`\`\n\n`;
      if (result.actualResponse) {
        report += `**Actual:**\n\`\`\`json\n${JSON.stringify(result.actualResponse.data, null, 2)}\n\`\`\`\n\n`;
      }
      report += `---\n\n`;
    });
  }

  report += `## Common Errors\n\n`;
  Object.entries(summary.commonErrors)
    .sort(([, a], [, b]) => b - a)
    .forEach(([error, count]) => {
      report += `- **${error}:** ${count} occurrences\n`;
    });

  return report;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const limitFlag = args.find(arg => arg.startsWith('--limit='));
  const limit = limitFlag ? parseInt(limitFlag.split('=')[1]) : undefined;

  const summary = await runLiveTests(limit);
  printSummary(summary);

  // Save detailed report
  const report = generateReport(summary);
  const reportPath = path.join(process.cwd(), 'tests', 'test-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📝 Detailed report saved to: ${reportPath}\n`);

  // Save JSON results
  const jsonPath = path.join(process.cwd(), 'tests', 'test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(`💾 JSON results saved to: ${jsonPath}\n`);

  // Exit with appropriate code
  process.exit(summary.passRate >= 80 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runLiveTests, printSummary, generateReport };
