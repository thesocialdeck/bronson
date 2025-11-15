/**
 * Quick test to debug parsing issues
 */

import { parseInput } from '~/lib/claude.server';

async function runQuickTest() {
  console.log('Running quick parse test...\n');

  const testInput = 'Oliver has soccer practice tomorrow at 4pm';

  try {
    console.log('Input:', testInput);
    console.log('Calling parseInput...\n');

    const result = await parseInput(testInput);

    console.log('Success! Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

runQuickTest();
