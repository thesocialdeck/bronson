import { json, type ActionFunctionArgs } from '@remix-run/node';
import {
  saveActivityType,
  saveEvent,
  updateEvent,
  deleteEvent,
  saveRecurringEvent,
  updateRecurringEvent,
  deleteRecurringEvent,
  saveContact,
  updateContact,
  deleteContact,
  saveChecklist,
  updateChecklist,
  deleteChecklist,
} from '~/lib/markdown.server';
import { generateId } from '~/lib/utils';
import type { SaveRequest } from '~/types';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body: SaveRequest = await request.json();
    const { action, type, id, data, newActivityType, relatedActions } = body;

    // Handle new activity type
    if (newActivityType) {
      await saveActivityType(newActivityType.id, {
        icon: newActivityType.icon,
        color: newActivityType.color,
        underlineStyle: newActivityType.underlineStyle,
      });
    }

    // Ensure data has an ID
    if (action === 'create' && !data.id) {
      data.id = generateId(type);
    }

    // Execute the action based on type
    switch (type) {
      case 'event':
        if (data.recurring || data.day) {
          // Recurring event
          if (action === 'create') await saveRecurringEvent(data);
          else if (action === 'update') await updateRecurringEvent(id!, data);
          else if (action === 'delete') await deleteRecurringEvent(id!);
        } else {
          // One-off event
          if (action === 'create') await saveEvent(data);
          else if (action === 'update') await updateEvent(id!, data);
          else if (action === 'delete') await deleteEvent(id!);
        }
        break;

      case 'contact':
        if (action === 'create') await saveContact(data);
        else if (action === 'update') await updateContact(id!, data);
        else if (action === 'delete') await deleteContact(id!);
        break;

      case 'checklist':
        if (action === 'create') await saveChecklist(data);
        else if (action === 'update') await updateChecklist(id!, data);
        else if (action === 'delete') await deleteChecklist(id!);
        break;

      default:
        return json({ error: 'Unknown type' }, { status: 400 });
    }

    // Handle related actions (e.g., creating a contact when adding a birthday event)
    if (relatedActions && relatedActions.length > 0) {
      for (const relatedAction of relatedActions) {
        const relatedData = { ...relatedAction.data };

        // Ensure related data has an ID
        if (relatedAction.action === 'create' && !relatedData.id) {
          relatedData.id = generateId(relatedAction.type);
        }

        // Execute the related action
        switch (relatedAction.type) {
          case 'contact':
            if (relatedAction.action === 'create') await saveContact(relatedData);
            else if (relatedAction.action === 'update') await updateContact(relatedData.id, relatedData);
            break;
          case 'event':
            if (relatedData.recurring || relatedData.day) {
              if (relatedAction.action === 'create') await saveRecurringEvent(relatedData);
              else if (relatedAction.action === 'update') await updateRecurringEvent(relatedData.id, relatedData);
            } else {
              if (relatedAction.action === 'create') await saveEvent(relatedData);
              else if (relatedAction.action === 'update') await updateEvent(relatedData.id, relatedData);
            }
            break;
          case 'checklist':
            if (relatedAction.action === 'create') await saveChecklist(relatedData);
            else if (relatedAction.action === 'update') await updateChecklist(relatedData.id, relatedData);
            break;
        }
      }
    }

    return json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} ${action}d successfully`,
      redirect: '/',
    });
  } catch (error) {
    console.error('Save error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to save' },
      { status: 500 }
    );
  }
}
