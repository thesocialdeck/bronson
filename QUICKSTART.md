# Bronson - Quick Start Guide

## Next Steps

Your Bronson family scheduling app is ready! The dev server is running at **http://localhost:5174**

### 1. Add Your API Key

Edit `.env` and add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

Get your API key from: https://console.anthropic.com/

### 2. Test the App

Open http://localhost:5174 in your browser and you should see:

- **Today view** with Oliver's Triathlon and Ella's Gymnastics (from sample data)
- **Week view** showing the week ahead
- **People** with sample contacts Emma and Chloe
- **Lists** with Oliver's Triathlon Gear checklist

### 3. Try Adding Something

Click the **+** button and type:

```
"Oliver has surfing every Saturday at 8am at the beach"
```

Claude will:
1. Parse it and show a preview
2. Create a new "surfing" activity type automatically
3. Save it as a recurring event
4. You'll see it in the Week view on Saturday!

### 4. Try Updating

```
"Move Oliver's triathlon to Tuesday 7am"
```

Claude will find the existing Monday triathlon event and update it.

### 5. Customize for Your Family

Edit [app/lib/config.ts](app/lib/config.ts):

```typescript
export const FAMILY_MEMBERS: FamilyMember[] = [
  { name: 'YourKid1', color: 'blue', avatar: 'Y' },
  { name: 'YourKid2', color: 'pink', avatar: 'K' },
  // ... add your family members
];
```

Then delete the sample data:

```bash
rm data/schedule/*.md
rm data/people/*.md
rm data/lists/*.md
```

And start fresh!

## Key Files

- `app/routes/_index.tsx` - Today view
- `app/routes/week.tsx` - Week view
- `app/routes/people.tsx` - Contacts
- `app/routes/lists.tsx` - Checklists
- `app/routes/add.tsx` - Quick add modal
- `app/lib/claude.server.ts` - AI parsing logic
- `app/lib/config.ts` - Family members & activity types
- `data/` - All your markdown data files

## Tips

- **Be specific**: "Oliver has tennis Tuesdays 4pm" works better than "tennis on tuesday"
- **Natural language**: "Move swimming to Wednesday" or "Cancel ballet next week"
- **New activities**: Claude creates them automatically - "Oliver has karate Thursdays"
- **Checklists**: "Oliver needs surf gear: board, wetsuit, wax, towel"
- **Contacts**: "Emma's parents are Sarah and Mike, phone 0423 456 789"

## Troubleshooting

**Port already in use?**
The app will automatically find an available port (5174, 5175, etc.)

**API errors?**
Make sure your `.env` file has a valid `ANTHROPIC_API_KEY`

**No data showing?**
Check that `data/schedule/recurring.md` has content and is formatted correctly

## Next Features to Add

- Voice input using Web Speech API
- Photo OCR for school newsletters
- Email forwarding
- SMS integration
- Cloud sync for multiple devices
- TRMNL e-ink display

Have fun building! 🎉
