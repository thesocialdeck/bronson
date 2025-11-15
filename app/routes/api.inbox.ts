import { json, type ActionFunctionArgs } from '@remix-run/node';
import {
  saveInboxItem,
  updateInboxItem,
  deleteInboxItem,
  getPendingInboxItems,
} from '~/lib/markdown.server';
import { generateId } from '~/lib/utils';
import type { InboxItem } from '~/types';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { action, id, data } = body;

    switch (action) {
      case 'create': {
        const inboxItem: InboxItem = {
          id: generateId('inbox'),
          rawText: data.rawText,
          createdAt: new Date().toISOString(),
          source: data.source || 'manual',
          status: 'pending',
        };
        await saveInboxItem(inboxItem);
        return json({
          success: true,
          message: 'Saved for later! ✨',
          item: inboxItem,
        });
      }

      case 'update': {
        if (!id) {
          return json({ error: 'ID required for update' }, { status: 400 });
        }
        await updateInboxItem(id, data);
        return json({
          success: true,
          message: 'Inbox item updated',
        });
      }

      case 'delete': {
        if (!id) {
          return json({ error: 'ID required for delete' }, { status: 400 });
        }
        await deleteInboxItem(id);
        return json({
          success: true,
          message: 'Inbox item deleted',
        });
      }

      case 'get-pending': {
        const items = await getPendingInboxItems();
        return json({
          success: true,
          items,
        });
      }

      default:
        return json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Inbox API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to process inbox action' },
      { status: 500 }
    );
  }
}
