# Bronson - Family Scheduling App

A family information management system built on file-over-app principles. Natural language input gets parsed by Claude AI into structured markdown files, displayed through a colorful mobile-first web interface.

## Features

- 🤖 **AI-Powered Input** - Type or paste natural language, Claude parses it into structured data
- 📅 **Smart Scheduling** - Recurring events and one-off events with intelligent matching
- 👥 **Contact Management** - Store family friends with parent info, phone numbers, notes
- ✅ **Checklists** - Activity-specific packing lists and to-dos
- 🎨 **Beautiful UI** - Colorful, mobile-first design with person-specific colors
- 📝 **Markdown Storage** - All data stored in human-readable markdown files
- 🔄 **Update & Delete** - Claude can modify or remove existing entries

## Tech Stack

- **Framework:** Remix (React)
- **Styling:** Tailwind CSS
- **AI:** Claude Haiku API
- **Storage:** Local markdown files with gray-matter
- **Icons:** Lucide React
- **Dates:** date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:5173](http://localhost:5173)

## Usage

### Adding Information

Click the **+** button and type natural language:

**Examples:**
- `"Oliver has triathlon every Monday at 6am at the beach"`
- `"Move Oliver's triathlon to Tuesday 7am"`
- `"Emma's parents are Sarah and Mike, phone 0423 456 789"`
- `"Oliver needs a surf bag: board, wetsuit, wax, towel"`
- `"Cancel triathlon next Monday"`

Claude will:
1. Parse your input
2. Show a preview with what it understood
3. Create/update/delete the appropriate entry
4. Save to markdown files

### Views

- **Today** - See what's happening today for each family member
- **Week** - Timeline view of the week ahead
- **People** - Contact directory with search
- **Lists** - Checklists with progress tracking

### Dynamic Activity Types

Claude automatically creates new activity types when needed. For example:

- `"Oliver has karate on Tuesdays"` → Creates a "karate" activity with appropriate icon and color
- `"Ella has art class Fridays"` → Creates an "art" activity

Custom activities are saved to `data/config/activities.json`.

## Project Structure

```
bronson/
├── app/
│   ├── components/        # React components
│   ├── lib/              # Server utilities
│   ├── routes/           # Remix routes
│   └── types/            # TypeScript types
├── data/                 # Markdown data storage
│   ├── schedule/
│   │   ├── recurring.md  # Weekly recurring events
│   │   └── events.md     # One-off events
│   ├── people/
│   │   └── contacts.md   # Contacts
│   ├── lists/            # Checklists (one file per list)
│   └── config/
│       └── activities.json  # Custom activity types
└── public/
```

## Customization

### Family Members

Edit `app/lib/config.ts` to change family members:

```typescript
export const FAMILY_MEMBERS: FamilyMember[] = [
  { name: 'Oliver', color: 'blue', avatar: 'O' },
  { name: 'Ella', color: 'pink', avatar: 'E' },
  { name: 'Kate', color: 'emerald', avatar: 'K' },
  { name: 'Steven', color: 'amber', avatar: 'S' },
];
```

### Default Activities

Edit `DEFAULT_ACTIVITIES` in the same file to add more sports/activities.

## Data Format

All data is stored in markdown files with YAML frontmatter:

```markdown
---
id: rec_001
person: Oliver
activity: Triathlon Training
type: triathlon
day: Monday
time: "06:00"
duration: 90
location: Beach
---
```

You can edit these files directly with any text editor!

## Building for Production

```bash
npm run build
npm start
```

## Future Enhancements

- Email forwarding
- SMS gateway integration
- Voice input
- Photo OCR for school newsletters
- Cloud sync (Cloudflare R2)
- TRMNL e-ink display integration
- PWA with offline support

## License

MIT

## Credits

Built with Claude Code and Claude Sonnet 4.5
