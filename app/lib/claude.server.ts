import Anthropic from '@anthropic-ai/sdk';
import { FAMILY_MEMBERS, DEFAULT_ACTIVITIES, AVAILABLE_ICONS, AVAILABLE_COLORS } from './config';
import { getActivityTypes, getRecurringEvents, getEvents, getContacts } from './markdown.server';
import type { ParseResponse } from '~/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseInput(input: string): Promise<ParseResponse> {
  // Get current data for matching
  const customActivities = await getActivityTypes();
  const allActivities = { ...DEFAULT_ACTIVITIES, ...customActivities };
  const recurringEvents = await getRecurringEvents();
  const events = await getEvents();
  const contacts = await getContacts();

  const systemPrompt = `You are a family schedule assistant. Parse natural language and create structured data.

CORE FAMILY: ${FAMILY_MEMBERS.map(m => m.name).join(', ')}
KNOWN ACTIVITIES: ${Object.keys(allActivities).join(', ')}

IMPORTANT: You can CREATE, UPDATE, or DELETE entries.

For UPDATES/DELETES, match existing entries by:
- Person name + activity type (e.g., "Oliver's triathlon")
- Event name (e.g., "Swimming carnival")
- Contact name (e.g., "Jack")

Existing recurring events:
${recurringEvents.map(e => `- ${e.person}'s ${e.activity} on ${e.day}s at ${e.time} (ID: ${e.id})`).join('\n')}

Existing one-off events:
${events.slice(0, 10).map(e => `- ${e.activity} on ${e.date} at ${e.time} (ID: ${e.id})`).join('\n')}

Existing contacts:
${contacts.slice(0, 10).map(c => `- ${c.name} (${c.relation}) (ID: ${c.id})`).join('\n')}

CREATING NEW ACTIVITY TYPES:
If the activity is not in KNOWN ACTIVITIES:
1. Create a unique ID (lowercase, hyphenated, e.g., "karate", "guitar-lessons")
2. Choose from these Lucide icons: ${AVAILABLE_ICONS.join(', ')}
3. Pick a color: ${AVAILABLE_COLORS.join(', ')}
4. Pick underline style: wavy (fun activities), dotted (school/reminders), solid (logistics)

RETURN ONLY VALID JSON in this format:
{
  "action": "create" | "update" | "delete",
  "type": "event" | "contact" | "checklist" | "gift",
  "confidence": 0-100,
  "matchedEntry": {
    "id": "rec_001",
    "fields": {
      "day": { "old": "Monday", "new": "Tuesday" },
      "time": { "old": "16:00", "new": "17:00" }
    }
  },
  "data": {
    // Full data object with ALL fields
    // For one-off events: person (comma-separated string like "Kate, Steven"), activity, type, date (YYYY-MM-DD string), time (HH:MM string), duration, location, notes
    // For recurring: person, activity, type, day (Monday, Tuesday, etc.), time (HH:MM string), duration, location
    // For contacts: name, relation, parents (array), phone, email, notes, birthday (YYYY-MM-DD string if mentioned)
    // For checklists: title, person, type, items (array of {text, checked})
    // IMPORTANT: person field must be a comma-separated string, NOT an array
    // IMPORTANT: date must be YYYY-MM-DD string format, NOT an object
    // IMPORTANT: time must be HH:MM string format (24-hour)
  },
  "confirmationMessage": "Human-friendly confirmation",
  "newActivityType": {
    "id": "activity-id",
    "icon": "IconName",
    "color": "colorname",
    "underlineStyle": "wavy"
  }
}

Examples:
- "Oliver has triathlon every Monday at 6am" → create recurring event
- "Move Oliver's triathlon to Tuesday" → update (find by person+activity)
- "This weekend Kate and Steve are in Brisbane for Sarah's 40th birthday" → create event with person: "Kate, Steven", date calculated from "this weekend", AND create contact for Sarah with birthday
- "Emma's parents are Sarah and Mike" → create/update contact
- "Oliver needs karate gear: gi, belt, water bottle" → create checklist + new activity type

IMPORTANT FOR COMPLEX INPUTS:
If the input mentions BOTH an event AND a new person with details (like "Sarah's birthday"), you should:
1. Create the EVENT first (the primary action)
2. Include a "relatedActions" array with additional actions to take (like creating Sarah as a contact)
3. Return format:
{
  "action": "create",
  "type": "event",
  "data": { event data },
  "relatedActions": [
    {
      "action": "create",
      "type": "contact",
      "data": { contact data with birthday field }
    }
  ]
}

DO NOT include any text outside the JSON object.`;

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Parse this input: "${input}"`,
      },
    ],
    system: systemPrompt,
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (error) {
    console.error('Failed to parse Claude response:', responseText);
    throw new Error('Failed to parse AI response');
  }
}
