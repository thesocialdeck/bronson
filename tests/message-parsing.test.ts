/**
 * Message & Email Parsing Test Runner
 *
 * Tests Claude's ability to parse text messages and emails into structured data.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { parseInput } from '~/lib/claude.server';
import { testMessages, type TestMessage } from './message-parsing-test-suite';
import type { ParseResponse } from '~/types';

// Test results tracking
interface TestResult {
  testId: string;
  category: string;
  description: string;
  passed: boolean;
  actualResponse: ParseResponse;
  expectedData: any;
  errors: string[];
}

const results: TestResult[] = [];

// Helper function to validate event data
function validateEventData(actual: any, expected: any): string[] {
  const errors: string[] = [];

  if (expected.person && actual.person !== expected.person) {
    // Allow flexible matching for family
    if (!(expected.person === 'Family' && (actual.person?.includes(',') || actual.person === 'family'))) {
      errors.push(`Person mismatch: expected "${expected.person}", got "${actual.person}"`);
    }
  }

  if (expected.activity) {
    // Allow partial matching for activity names
    const actualActivity = actual.activity?.toLowerCase() || '';
    const expectedActivity = expected.activity.toLowerCase();
    if (!actualActivity.includes(expectedActivity) && !expectedActivity.includes(actualActivity)) {
      errors.push(`Activity mismatch: expected "${expected.activity}", got "${actual.activity}"`);
    }
  }

  if (expected.time && actual.time !== expected.time) {
    errors.push(`Time mismatch: expected "${expected.time}", got "${actual.time}"`);
  }

  if (expected.date && actual.date !== expected.date) {
    errors.push(`Date mismatch: expected "${expected.date}", got "${actual.date}"`);
  }

  if (expected.recurring !== undefined && actual.recurring !== expected.recurring) {
    errors.push(`Recurring mismatch: expected ${expected.recurring}, got ${actual.recurring}`);
  }

  if (expected.location && !actual.location?.includes(expected.location)) {
    errors.push(`Location mismatch: expected "${expected.location}", got "${actual.location}"`);
  }

  return errors;
}

// Helper function to validate contact data
function validateContactData(actual: any, expected: any): string[] {
  const errors: string[] = [];

  if (expected.name) {
    const actualName = actual.name?.toLowerCase() || '';
    const expectedName = expected.name.toLowerCase();
    if (!actualName.includes(expectedName) && !expectedName.includes(actualName)) {
      errors.push(`Name mismatch: expected "${expected.name}", got "${actual.name}"`);
    }
  }

  if (expected.phone && actual.phone !== expected.phone) {
    // Normalize phone numbers for comparison
    const normalizePhone = (p: string) => p.replace(/[\s\-\(\)]/g, '');
    if (normalizePhone(actual.phone || '') !== normalizePhone(expected.phone)) {
      errors.push(`Phone mismatch: expected "${expected.phone}", got "${actual.phone}"`);
    }
  }

  if (expected.email && actual.email !== expected.email) {
    errors.push(`Email mismatch: expected "${expected.email}", got "${actual.email}"`);
  }

  return errors;
}

// Helper function to validate checklist data
function validateChecklistData(actual: any, expected: any): string[] {
  const errors: string[] = [];

  if (expected.person && actual.person !== expected.person) {
    errors.push(`Person mismatch: expected "${expected.person}", got "${actual.person}"`);
  }

  if (expected.title && !actual.title?.toLowerCase().includes(expected.title.toLowerCase())) {
    errors.push(`Title mismatch: expected "${expected.title}", got "${actual.title}"`);
  }

  if (expected.items !== undefined) {
    const actualItemCount = actual.items?.length || 0;
    if (actualItemCount !== expected.items) {
      errors.push(`Item count mismatch: expected ${expected.items}, got ${actualItemCount}`);
    }
  }

  return errors;
}

// Main validation function
function validateTestResult(test: TestMessage, response: ParseResponse): TestResult {
  const result: TestResult = {
    testId: test.id,
    category: test.category,
    description: test.description,
    passed: false,
    actualResponse: response,
    expectedData: test.expectedData,
    errors: [],
  };

  // Check response type
  if (test.expectedType === 'multiple') {
    if (!response.relatedActions && !Array.isArray(response.data?.events)) {
      result.errors.push('Expected multiple events but got single response');
    } else {
      // For multiple events, just check that we got some events
      const eventCount = response.relatedActions?.length || response.data?.events?.length || 1;
      const expectedCount = test.expectedData.events?.length || test.expectedData.events || 2;
      if (eventCount < expectedCount - 1) { // Allow some flexibility
        result.errors.push(`Expected ~${expectedCount} events, got ${eventCount}`);
      }
    }
  } else {
    if (response.type !== test.expectedType) {
      result.errors.push(`Type mismatch: expected "${test.expectedType}", got "${response.type}"`);
    }
  }

  // Validate data based on type
  if (response.type === 'event' && test.expectedType === 'event') {
    result.errors.push(...validateEventData(response.data, test.expectedData));
  } else if (response.type === 'contact' && test.expectedType === 'contact') {
    result.errors.push(...validateContactData(response.data, test.expectedData));
  } else if (response.type === 'checklist' && test.expectedType === 'checklist') {
    result.errors.push(...validateChecklistData(response.data, test.expectedData));
  } else if (response.type === 'gift' && test.expectedType === 'gift') {
    // Basic gift validation
    if (test.expectedData.person && response.data.person !== test.expectedData.person) {
      result.errors.push(`Person mismatch: expected "${test.expectedData.person}", got "${response.data.person}"`);
    }
  }

  // Check confidence level
  if (response.confidence < 50) {
    result.errors.push(`Low confidence: ${response.confidence}%`);
  }

  result.passed = result.errors.length === 0;
  return result;
}

// Generate test suites by category
describe('Message & Email Parsing Test Suite', () => {
  // Group tests by category
  const testsByCategory = testMessages.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, TestMessage[]>);

  // Run tests for each category
  Object.entries(testsByCategory).forEach(([category, tests]) => {
    describe(category, () => {
      tests.forEach((test) => {
        it(`${test.id}: ${test.description}`, async () => {
          try {
            const response = await parseInput(test.input);
            const result = validateTestResult(test, response);
            results.push(result);

            // Log details for debugging
            if (!result.passed) {
              console.log(`\n❌ FAILED: ${test.id}`);
              console.log(`Input: ${test.input.substring(0, 100)}...`);
              console.log(`Errors: ${result.errors.join(', ')}`);
              console.log(`Expected:`, JSON.stringify(test.expectedData, null, 2));
              console.log(`Got:`, JSON.stringify(response.data, null, 2));
            }

            // Assert
            expect(result.errors).toHaveLength(0);
          } catch (error) {
            const result: TestResult = {
              testId: test.id,
              category: test.category,
              description: test.description,
              passed: false,
              actualResponse: {} as ParseResponse,
              expectedData: test.expectedData,
              errors: [`Exception: ${error}`],
            };
            results.push(result);
            throw error;
          }
        });
      });
    });
  });

  // Summary test that runs after all others
  describe('Test Summary', () => {
    it('should have high overall pass rate', () => {
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      const passRate = (passedCount / totalCount) * 100;

      console.log('\n' + '='.repeat(80));
      console.log('MESSAGE PARSING TEST RESULTS');
      console.log('='.repeat(80));
      console.log(`Total Tests: ${totalCount}`);
      console.log(`Passed: ${passedCount} (${passRate.toFixed(1)}%)`);
      console.log(`Failed: ${totalCount - passedCount}`);
      console.log('='.repeat(80));

      // Breakdown by category
      const categoryStats = results.reduce((acc, r) => {
        if (!acc[r.category]) {
          acc[r.category] = { passed: 0, total: 0 };
        }
        acc[r.category].total++;
        if (r.passed) acc[r.category].passed++;
        return acc;
      }, {} as Record<string, { passed: number; total: number }>);

      console.log('\nResults by Category:');
      Object.entries(categoryStats).forEach(([category, stats]) => {
        const rate = (stats.passed / stats.total) * 100;
        console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate.toFixed(1)}%)`);
      });

      console.log('\n' + '='.repeat(80));

      // We want at least 80% pass rate
      expect(passRate).toBeGreaterThan(80);
    });
  });
});
