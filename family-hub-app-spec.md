# Family Hub - App Specification

## Vision

A family information management system built on file-over-app principles. Natural language input (type or paste text) gets parsed by Claude AI into structured markdown files, displayed through a colorful mobile-first web interface and a TRMNL e-ink display.

**Core philosophy:** Capture information however it arrives (copy/paste texts, type quick notes), let AI do the parsing, store in human-readable markdown, display where it matters.

## Tech Stack

- **Framework:** Remix (React)
- **Styling:** Tailwind CSS
- **AI:** Claude Haiku API (claude-3-5-haiku-20241022)
- **Storage:** Local markdown files (later: Cloudflare R2)
- **Icons:** Lucide React
- **Hosting:** Cloudflare Pages (later)
- **Display:** TRMNL e-ink (separate plugin)

## MVP Scope (v1)

### Include
- Text input (type or copy/paste)
- Claude AI parsing of natural language
- Preview/confirmation before saving
- Markdown file storage
- Today view (colorful, scannable)
- Week view (timeline)
- People/contacts view
- Checklists view
- Mobile-first responsive design
- Activity icons and color coding
- TRMNL JSON endpoint

### Exclude (Future)
- Email forwarding
- SMS gateway
- Voice input
- Photo/OCR
- Real-time sync
- Native mobile app
- Multi-user auth

## Data Model

### Family Members
```typescript
interface FamilyMember {
  name: string;
  color: string; // tailwind color name
  avatar: string; // single letter or emoji
}

// Configured in app
const familyMembers = [
  { name: 'Oliver', color: 'blue', avatar: 'O' },
  { name: 'Ella', color: 'pink', avatar: 'E' },
  { name: 'Kate', color: 'emerald', avatar: 'K' },
  { name: 'Steven', color: 'amber', avatar: 'S' },
];
```

### Activity Types
```typescript
interface ActivityType {
  id: string;
  icon: string; // Lucide icon name
  color: string; // tailwind color
  underlineStyle: 'wavy' | 'dotted' | 'solid';
}

const activityTypes = {
  swimming: { icon: 'Waves', color: 'cyan', underlineStyle: 'wavy' },
  soccer: { icon: 'Dribbble', color: 'green', underlineStyle: 'wavy' },
  piano: { icon: 'Music', color: 'purple', underlineStyle: 'wavy' },
  ballet: { icon: 'Sparkles', color: 'pink', underlineStyle: 'wavy' },
  school: { icon: 'Star', color: 'yellow', underlineStyle: 'dotted' },
  dinner: { icon: 'Utensils', color: 'red', underlineStyle: 'wavy' },
  pickup: { icon: 'Car', color: 'slate', underlineStyle: 'solid' },
  birthday: { icon: 'Gift', color: 'fuchsia', underlineStyle: 'wavy' },
  // ... extensible
};
```

### Event Schema
```typescript
interface ScheduleEvent {
  id: string;
  person: string;
  activity: string;
  activityType: string;
  date: string; // ISO date
  time: string; // HH:MM
  duration?: number; // minutes
  location?: string;
  notes?: string;
  checklist?: string; // reference to checklist file
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: string; // for weekly
    until?: string;
  };
}
```

### Contact Schema
```typescript
interface Contact {
  id: string;
  name: string;
  relation: string; // "Oliver's friend", "Ella's friend", "Family friend"
  parents?: string[];
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}
```

### Checklist Schema
```typescript
interface Checklist {
  id: string;
  title: string;
  person: string;
  activityType: string;
  items: Array<{
    text: string;
    checked: boolean;
  }>;
}
```

### Gift List Schema
```typescript
interface GiftItem {
  id: string;
  person: string;
  item: string;
  list: string; // "Christmas 2024", "Birthday 2025"
  priority?: 'low' | 'medium' | 'high';
  budget?: number;
  purchased?: boolean;
  notes?: string;
}
```

## File Structure

```
/family-hub/
├── app/
│   ├── routes/
│   │   ├── _index.tsx              # Today view (default)
│   │   ├── week.tsx                # Week view
│   │   ├── people.tsx              # Contacts directory
│   │   ├── lists.tsx               # Checklists
│   │   ├── lists.$id.tsx           # Single checklist view
│   │   ├── gifts.tsx               # Gift lists
│   │   ├── add.tsx                 # Quick add page (or modal)
│   │   ├── api.parse.tsx           # Claude API endpoint
│   │   ├── api.save.tsx            # Save to markdown endpoint
│   │   └── api.trmnl.tsx           # TRMNL JSON endpoint
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   └── QuickAddButton.tsx
│   │   │
│   │   ├── today/
│   │   │   ├── PersonDayCard.tsx
│   │   │   ├── EventItem.tsx
│   │   │   └── FamilyEventCard.tsx
│   │   │
│   │   ├── week/
│   │   │   ├── DayCard.tsx
│   │   │   └── WeekTimeline.tsx
│   │   │
│   │   ├── people/
│   │   │   ├── PersonCard.tsx
│   │   │   └── ContactSearch.tsx
│   │   │
│   │   ├── lists/
│   │   │   ├── ChecklistCard.tsx
│   │   │   └── ChecklistItem.tsx
│   │   │
│   │   ├── add/
│   │   │   ├── QuickAddModal.tsx
│   │   │   ├── ParsePreview.tsx
│   │   │   ├── EventPreview.tsx
│   │   │   ├── ContactPreview.tsx
│   │   │   └── GiftPreview.tsx
│   │   │
│   │   └── shared/
│   │       ├── ActivityIcon.tsx
│   │       ├── PersonAvatar.tsx
│   │       └── ColoredUnderline.tsx
│   │
│   ├── lib/
│   │   ├── claude.server.ts        # Claude API integration
│   │   ├── markdown.server.ts      # Read/write markdown files
│   │   ├── parser.server.ts        # Parse markdown to data structures
│   │   ├── config.ts               # Family members, activity types
│   │   └── utils.ts                # Date helpers, etc.
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   │
│   └── root.tsx
│
├── data/                           # Markdown storage (gitignored or separate)
│   ├── schedule/
│   │   ├── recurring.md            # Recurring events
│   │   └── events.md               # One-off events
│   │
│   ├── people/
│   │   └── contacts.md             # All contacts
│   │
│   ├── lists/
│   │   ├── swimming-kit.md
│   │   ├── soccer-gear.md
│   │   └── school-morning.md
│   │
│   ├── gifts/
│   │   └── christmas-2024.md
│   │
│   └── notes/
│       └── inbox.md                # Unprocessed items
│
├── public/
│   └── manifest.json               # PWA manifest
│
├── tailwind.config.ts
├── package.json
└── README.md
```

## Markdown File Formats

### schedule/recurring.md
```markdown
# Recurring Schedule

## Oliver - Swimming
- Person: Oliver
- Activity: Swimming
- Type: swimming
- Day: Monday
- Time: 16:00
- Duration: 45
- Location: Aquatic Centre
- Checklist: swimming-kit
- RRULE: FREQ=WEEKLY;BYDAY=MO

---

## Ella - Ballet
- Person: Ella
- Activity: Ballet
- Type: ballet
- Day: Wednesday
- Time: 15:30
- Duration: 60
- Location: Dance Studio

---
```

### schedule/events.md
```markdown
# One-off Events

## Swimming Carnival
- ID: evt_001
- Date: 2024-11-22
- Time: 08:00
- EndTime: 14:00
- Person: Oliver, Ella
- Activity: Swimming Carnival
- Type: swimming
- Location: School Pool
- Notes: Permission forms due Nov 18

---

## Birthday Party
- ID: evt_002
- Date: 2024-11-15
- Time: 14:00
- Person: Oliver
- Activity: Jack's Birthday Party
- Type: birthday
- Location: Jack's house
- Notes: Buy present

---
```

### people/contacts.md
```markdown
# Contacts

## Jack
- ID: contact_001
- Name: Jack
- Relation: Oliver's friend
- Parents: Ash, Amy
- Phone: 0412 345 678
- Address: 123 Wellington St
- Notes: Soccer team together

---

## Emma
- ID: contact_002
- Name: Emma
- Relation: Oliver's friend
- Parents: Sarah, Mike
- Phone: 0423 456 789
- Notes: Same class, piano lessons

---
```

### lists/swimming-kit.md
```markdown
# Swimming Kit - Oliver

- Type: swimming
- Person: Oliver

## Items
- [x] Swimmers
- [x] Towel
- [x] Goggles
- [ ] Drink bottle
- [ ] Snack

---
Last updated: 2024-11-14
```

### gifts/christmas-2024.md
```markdown
# Christmas 2024

## Kate
- [ ] Handbag | Priority: medium | Budget: $150
- [ ] Running shoes | Priority: low
- [x] Kindle | Purchased: 2024-11-01

## Oliver
- [ ] LEGO Star Wars set | Priority: high
- [ ] Books | Priority: medium

---
```

## Claude API Integration

### Parsing Endpoint (app/routes/api.parse.tsx)

```typescript
import { ActionFunctionArgs, json } from '@remix-run/node';
import Anthropic from '@anthropic-ai/sdk';
import { familyMembers, activityTypes } from '~/lib/config';

export async function action({ request }: ActionFunctionArgs) {
  const { input } = await request.json();
  
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are a family schedule assistant. Parse natural language inputs into structured data.

Family members: ${familyMembers.map(m => m.name).join(', ')}
Known activity types: ${Object.keys(activityTypes).join(', ')}

Current date: ${new Date().toISOString().split('T')[0]}

Return ONLY valid JSON in this exact format:
{
  "type": "event" | "contact" | "gift" | "checklist" | "note",
  "confidence": 0-100,
  "data": {
    // type-specific fields
  },
  "questions": [
    // disambiguation questions if needed
  ],
  "suggestions": [
    // helpful context
  ]
}

For events, include: person, activity, activityType (from known types), date, time, duration, location, recurring info if applicable.
For contacts, include: name, relation, parents array, phone, notes.
For gifts, include: person, item, list (e.g., "Christmas 2024"), priority.
For checklists, include: title, person, activityType, items array.

Be smart about inferring activity types from keywords (swimming, soccer, piano, ballet, dinner, school, etc).
If unsure which family member, ask in questions array.
DO NOT output anything except valid JSON.`;

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Parse this input: "${input}"`,
      },
    ],
    system: systemPrompt,
  });

  const responseText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : '';
  
  const parsed = JSON.parse(responseText);
  
  return json(parsed);
}
```

### Example Claude Responses

**Input:** "Oliver swimming every Monday 4pm"
```json
{
  "type": "event",
  "confidence": 95,
  "data": {
    "person": "Oliver",
    "activity": "Swimming",
    "activityType": "swimming",
    "time": "16:00",
    "duration": 45,
    "recurring": {
      "frequency": "weekly",
      "day": "Monday"
    },
    "suggestedChecklist": "swimming-kit"
  },
  "questions": [],
  "suggestions": ["This will create a recurring event every Monday"]
}
```

**Input:** "Remember Jack's parents are Ash and Amy"
```json
{
  "type": "contact",
  "confidence": 90,
  "data": {
    "name": "Jack",
    "parents": ["Ash", "Amy"]
  },
  "questions": [
    {
      "id": "relation",
      "question": "Who's Jack connected to?",
      "options": ["Oliver's friend", "Ella's friend", "Both kids", "Family friend"]
    }
  ],
  "suggestions": []
}
```

**Input:** "Kate wants a new handbag for Christmas"
```json
{
  "type": "gift",
  "confidence": 92,
  "data": {
    "person": "Kate",
    "item": "New handbag",
    "list": "Christmas 2024",
    "priority": "medium"
  },
  "questions": [],
  "suggestions": ["Added to Kate's Christmas 2024 list"]
}
```

## Key User Flows

### 1. Add New Information
```
User opens app → Taps "+" button → Types or pastes text
→ Taps "Add" → Claude parses → Preview screen shown
→ User confirms (or answers disambiguation questions)
→ Saved to appropriate markdown file → Success feedback
→ Returns to previous screen
```

### 2. View Today's Schedule
```
App loads → Reads recurring.md and events.md
→ Filters for today's date and day of week
→ Groups by person → Renders colorful cards
→ Shows activity icons and colored underlines
→ Links to relevant checklists
```

### 3. Check/Uncheck Checklist Item
```
User taps checklist → Opens list view → Taps item
→ Toggles checkbox → Updates markdown file
→ UI updates immediately → TRMNL refreshes on next poll
```

### 4. Search Contacts
```
User navigates to People → Types in search box
→ Filters contacts by name, parent names, notes
→ Shows matching results with colored relation badges
```

## TRMNL Integration

### Endpoint (app/routes/api.trmnl.tsx)
```typescript
import { LoaderFunctionArgs, json } from '@remix-run/node';
import { getTodaySchedule, getWeekSchedule } from '~/lib/markdown.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'today';
  
  if (view === 'today') {
    const schedule = await getTodaySchedule();
    return json({
      title: `${schedule.dayName}, ${schedule.date}`,
      content: formatTodayForTRMNL(schedule),
    });
  }
  
  if (view === 'week') {
    const week = await getWeekSchedule();
    return json({
      title: 'This Week',
      content: formatWeekForTRMNL(week),
    });
  }
  
  // ... other views
}

function formatTodayForTRMNL(schedule) {
  // Generate text/simple markup for e-ink display
  // Icons represented as text symbols
  // Clear hierarchy and spacing
}
```

## UI/UX Requirements

### Visual Design
- **Gradient backgrounds:** blue-50 → purple-50 → pink-50
- **White cards** with colored borders per person
- **Rounded corners:** rounded-2xl for cards
- **Shadows:** subtle shadow-sm
- **Person avatars:** colored circles with initials
- **Activity icons:** Lucide icons in activity colors
- **Underlines:** decoration-4 with wavy/dotted styles
- **Progress indicators:** on checklists with percentages

### Color Mapping
```typescript
// Person colors
Oliver: blue-500 (avatar), blue-100 (light bg), blue-700 (text)
Ella: pink-500, pink-100, pink-700
Kate: emerald-500, emerald-100, emerald-700
Steven: amber-500, amber-100, amber-700

// Activity colors
swimming: cyan-500, cyan-50, decoration-cyan-400
soccer: green-500, green-50, decoration-green-400
piano: purple-500, purple-50, decoration-purple-400
ballet: pink-500, pink-50, decoration-pink-400
school: yellow-500, yellow-50, decoration-yellow-400
dinner: red-500, red-50, decoration-red-400
pickup: slate-600, slate-50, decoration-slate-400
birthday: fuchsia-500, fuchsia-50, decoration-fuchsia-400
```

### Mobile-First
- Touch-friendly tap targets (min 44px)
- Bottom navigation bar
- Floating action button for quick add
- Full-width cards
- Swipe gestures (future)
- PWA capable

### Accessibility
- High contrast text
- Color not sole indicator (icons + text)
- Clear visual hierarchy
- Readable font sizes (min 14px)

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
DATA_PATH=./data  # or R2 bucket path
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Dependencies

```json
{
  "dependencies": {
    "@remix-run/node": "^2.x",
    "@remix-run/react": "^2.x",
    "@anthropic-ai/sdk": "^0.x",
    "lucide-react": "^0.x",
    "gray-matter": "^4.x",      // Parse markdown frontmatter
    "date-fns": "^3.x"          // Date utilities
  },
  "devDependencies": {
    "tailwindcss": "^3.x",
    "typescript": "^5.x"
  }
}
```

## Prototype Reference

Two interactive React prototypes have been created:

1. **family-hub-mobile-prototype.jsx** - Input flow focused (voice, photo, text parsing)
2. **family-hub-fun-prototype.jsx** - Display focused (colorful UI with icons and underlines)

These show the exact UI patterns, color schemes, and interactions to implement.

## Success Metrics

- Family uses it daily
- Input friction < 30 seconds to capture information
- Information findable when needed
- TRMNL display checked multiple times daily
- Kids can check their own checklists
- Parents sync on schedule without asking each other

## Future Enhancements (Post-MVP)

1. Email forwarding (forward texts/emails to inbox)
2. SMS gateway (text directly to app)
3. Voice input (browser Web Speech API)
4. Photo OCR (Claude vision for school newsletters)
5. Multiple devices sync (Cloudflare Durable Objects or R2)
6. Push notifications (PWA)
7. Undo/history
8. Family member permissions
9. Export to calendar (ICS)
10. Weekly summary generation

---

**Build this iteratively. Start with text input → parse → display. Add features as friction points emerge from real family usage.**
