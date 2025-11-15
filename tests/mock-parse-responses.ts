/**
 * Mock responses for testing without API calls
 *
 * This allows us to test the test framework itself and validate
 * our test data structure without making actual API calls.
 */

import type { ParseResponse } from '~/types';

export const mockResponses: Record<string, ParseResponse> = {
  'txt-event-001': {
    action: 'create',
    type: 'event',
    confidence: 95,
    data: {
      person: 'Oliver',
      activity: 'soccer',
      type: 'soccer',
      time: '16:00',
      recurring: false,
    },
    confirmationMessage: 'Added soccer practice for Oliver tomorrow at 4:00 PM',
  },

  'txt-event-002': {
    action: 'create',
    type: 'event',
    confidence: 90,
    data: {
      person: 'Ella',
      activity: 'dentist',
      type: 'dentist',
      time: '14:30',
      recurring: false,
    },
    confirmationMessage: 'Added dentist appointment for Ella on Thursday at 2:30 PM',
  },

  'txt-event-003': {
    action: 'create',
    type: 'event',
    confidence: 95,
    data: {
      person: 'Kate',
      activity: 'yoga',
      type: 'yoga',
      day: 'Monday',
      time: '06:00',
      recurring: true,
    },
    confirmationMessage: 'Added recurring yoga for Kate every Monday at 6:00 AM',
  },

  'contact-001': {
    action: 'create',
    type: 'contact',
    confidence: 92,
    data: {
      name: 'Sarah Mitchell',
      phone: '(555) 234-5678',
      email: 'sarah.mitchell@email.com',
      relation: 'friend',
    },
    confirmationMessage: 'Added contact Sarah Mitchell',
  },

  'checklist-001': {
    action: 'create',
    type: 'checklist',
    confidence: 88,
    data: {
      person: 'Oliver',
      title: 'Homework',
      type: 'homework',
      items: [
        { text: 'Math worksheet pages 45-47', checked: false },
        { text: 'Read chapters 5-6', checked: false },
        { text: 'Spelling practice', checked: false },
        { text: 'Science project draft due Friday', checked: false },
      ],
    },
    confirmationMessage: "Added homework checklist for Oliver with 4 items",
  },
};

/**
 * Get a mock response for testing
 * If no mock exists, returns a generic successful response
 */
export function getMockResponse(testId: string, input: string): ParseResponse {
  if (mockResponses[testId]) {
    return mockResponses[testId];
  }

  // Return a generic response if no specific mock exists
  return {
    action: 'create',
    type: 'event',
    confidence: 85,
    data: {
      activity: 'generic event',
      time: '12:00',
    },
    confirmationMessage: 'Created event',
  };
}
