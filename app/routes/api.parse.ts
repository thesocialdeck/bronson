import { json, type ActionFunctionArgs } from '@remix-run/node';
import { parseInput } from '~/lib/claude.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      return json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await parseInput(input);
    return json(result);
  } catch (error) {
    console.error('Parse error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to parse input' },
      { status: 500 }
    );
  }
}
