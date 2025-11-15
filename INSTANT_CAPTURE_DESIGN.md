# Instant Capture + Review Later - Design Doc

## The Parent Problem 🏃‍♀️

### Current Reality
Parents are **time-poor**. They're:
- Getting texts while cooking dinner
- Receiving school emails during work meetings
- Remembering things while driving (voice notes)
- Juggling 5 things at once

### Current Flow Problem ❌
```
1. Tap + button
2. Type message
3. Wait for AI parse (2-3 seconds)
4. Review editable preview
5. Edit if needed
6. Click Confirm
7. TOTAL TIME: 20-30 seconds minimum
```

**This is too slow when you're rushing!**

---

## The Solution: Two-Mode Capture

### Mode 1: Instant Capture (Brain Dump) 🚀
**When:** You're busy, no time to review
**Flow:**
```
1. Tap + button
2. Paste/type ANYTHING (even multiple things)
3. Tap "Save for Later" (or auto-save on close)
4. DONE! Back to life.
TOTAL TIME: 5 seconds
```

**Example:**
```
Paste this blob:
"Oliver soccer Monday 4pm
Ella piano Tuesday 5pm
dentist Thursday 2pm
call Jenny about playdate
buy birthday gift for Emma's party Saturday"

Tap "Save for Later" → Done!
Review when you have time.
```

### Mode 2: Review & Add (Current) ⏰
**When:** You have time to review now
**Flow:** Same as current editable preview

---

## Review Later Screen (New Tab) ✅

### Bottom Navigation
Add 5th tab: **Review**

```
[Today] [Week] [Review] [People] [Lists]
           👆 NEW!
```

Badge shows count: `Review (5)` when items pending

### Review Screen Layout

```
┌─────────────────────────────────────┐
│ 📥 Review (5 items)                 │
│                                     │
│ [Select All] [✓ Approve All]       │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ ☐ "Oliver soccer Monday 4pm"  │  │
│ │                               │  │
│ │ 👤 Oliver  ⚽ soccer          │  │
│ │ 📅 Mon, Nov 18  🕐 4:00 PM   │  │
│ │ 85% confident                 │  │
│ │                               │  │
│ │ [✓ Approve] [✏️ Edit] [🗑️]   │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ ☐ "Ella piano Tuesday 5pm"    │  │
│ │ 👤 Ella  🎹 piano             │  │
│ │ 📅 Tue, Nov 19  🕐 5:00 PM   │  │
│ │ 90% confident                 │  │
│ │                               │  │
│ │ [✓ Approve] [✏️ Edit] [🗑️]   │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ ☐ "call Jenny about playdate" │  │
│ │ ⚠️ Needs review (55%)         │  │
│ │ Couldn't parse as event       │  │
│ │                               │  │
│ │ [✏️ Edit as Text] [🗑️]       │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Tick & Flick Actions

**Per Item:**
- ✅ **Approve** - Save as-is (high confidence)
- ✏️ **Edit** - Open editable preview
- 🗑️ **Delete** - Remove from queue
- ☐ **Checkbox** - Select for batch action

**Batch Actions:**
- **Select All** - Check all items
- **✓ Approve All** - Approve all checked items at once
- **🗑️ Delete Selected** - Bulk delete

**Smart Sorting:**
- High confidence first (easy approvals)
- Low confidence last (need review)
- Group by date
- Group by type (events, contacts, etc.)

---

## Updated Add Modal

### Two Buttons at Bottom

```
┌─────────────────────────────────────┐
│ ✨ Quick Add                        │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Oliver soccer Monday 4pm    │    │
│ │ Ella piano Tuesday 5pm      │    │
│ │ dentist Thursday 2pm        │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌───────────┐  ┌────────────────┐  │
│ │ 📥 Save   │  │ ✨ Review &    │  │
│ │ for Later │  │    Add Now     │  │
│ └───────────┘  └────────────────┘  │
└─────────────────────────────────────┘
```

**Save for Later:**
- Saves raw text to inbox
- No parsing yet
- Instant (no API call)
- Closes modal immediately

**Review & Add Now:**
- Current flow
- Parse with AI
- Show editable preview
- Confirm to save

---

## Data Structure

### Inbox Items

```typescript
interface InboxItem {
  id: string;
  rawText: string;
  createdAt: string;
  source: 'manual' | 'sms' | 'email' | 'voice'; // Future: automated capture

  // Parsed data (null until reviewed)
  parsed?: ParseResponse;
  parsedAt?: string;

  // Status
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
}
```

### Storage
- File: `/data/inbox.md` (markdown with frontmatter)
- Each item as a section
- Status tracked in frontmatter

Example `/data/inbox.md`:
```markdown
---
items:
  - id: inbox_001
    status: pending
    createdAt: 2025-11-15T14:30:00Z
---

## inbox_001
Oliver soccer Monday 4pm

---
  - id: inbox_002
    status: pending
    createdAt: 2025-11-15T14:31:00Z
---

## inbox_002
Ella piano Tuesday 5pm
```

---

## Smart Features

### Auto-Parse on Open
When user opens Review screen:
- Parse all pending items in background
- Show confidence levels
- Sort by confidence (high first)

### Smart Batch Approve
"Approve All High Confidence (>80%)" button:
- One-tap approve everything that's clearly correct
- Leave only uncertain items for review

### Suggested Edits
For low confidence items:
- Show suggested alternatives
- "Did you mean: school pickup (not just 'pickup')?"
- Quick-tap to accept suggestion

### Multi-Item Parsing
When pasting multiple lines:
- Auto-detect separate items
- Parse each individually
- Show count: "Found 3 items"

---

## User Flows

### Flow 1: Busy Parent (Most Common)
```
Scenario: Getting text during dinner prep

1. Phone buzzes: "Oliver soccer moved to 4:30pm Monday"
2. Tap + button while stirring pot
3. Paste text
4. Tap "Save for Later"
5. Back to cooking
TIME: 5 seconds

Later (after dinner):
6. Open Review tab
7. See parsed: "Oliver, soccer, Monday 4:30pm" ✓ 95%
8. Tap "Approve"
9. Done!
TIME: 3 seconds
```

### Flow 2: Brain Dump Mode
```
Scenario: Sunday evening planning

1. Tap + button
2. Type/paste everything for the week:
   "Oliver soccer Mon Wed Fri 4pm
    Ella dance Tue Thu 5pm
    Dentist for both Wed 2pm
    Parent teacher conferences Thu 6pm
    Birthday party Sat 3pm at Bounce House"
3. Tap "Save for Later"
4. All saved to inbox
TIME: 30 seconds

Later:
5. Open Review tab (5 items)
6. Quick scan all items
7. Tap "Approve All" (all high confidence)
8. Done!
TIME: 10 seconds
```

### Flow 3: Immediate Need
```
Scenario: Need to add something right now

1. Tap + button
2. Type "Oliver dentist tomorrow 2pm"
3. Tap "Review & Add Now"
4. See editable preview
5. Add location: "Dr. Chen's office"
6. Tap Confirm
7. Done!
TIME: 15 seconds
```

---

## Visual Design

### Review Tab Badge
```
┌──────────┐
│ Review 5 │  ← Red badge for pending items
└──────────┘
```

### Item Cards
```
┌─────────────────────────────────────┐
│ ☐ "Original text here..."          │
│                                     │
│ 👤 Person  🏷️ Activity             │
│ 📅 Date    🕐 Time                  │
│                                     │
│ ✓ 95% confident ← Green badge      │
│                                     │
│ [✓ Approve] [✏️ Edit] [🗑️]         │
└─────────────────────────────────────┘
```

High confidence: Green border
Low confidence: Yellow border
Very low: Red border

---

## Benefits for Parents

### Time Savings
- **5 seconds** to capture (vs 30 seconds)
- **Batch review** - approve 10 items in 30 seconds
- **No interruption** - capture and continue
- **Review when convenient** - not forced to stop

### Mental Load
- **Brain dump** - paste everything, process later
- **No decisions now** - just capture
- **Batch processing** - more efficient
- **Safe capture** - never forget anything

### Flexibility
- **Choose your mode** - rush or review
- **Review on your time** - morning coffee, evening wind-down
- **Batch vs individual** - your choice
- **Multi-source** - text, email, voice notes (future)

---

## Implementation Priority

### Phase 1: Core Capture & Review ⭐⭐⭐
- [ ] Add "Review" tab to bottom nav
- [ ] Create inbox data structure
- [ ] "Save for Later" button in add modal
- [ ] Review screen with list of pending items
- [ ] Individual approve/edit/delete actions
- [ ] Parse items when Review screen opens

### Phase 2: Batch Actions ⭐⭐
- [ ] Select checkboxes
- [ ] "Approve All" button
- [ ] "Select All" button
- [ ] Batch delete
- [ ] Smart filtering (high confidence only)

### Phase 3: Smart Features ⭐
- [ ] Multi-item detection
- [ ] Suggested edits for low confidence
- [ ] Auto-parse in background
- [ ] Sort by confidence/date
- [ ] Quick edit inline (no modal)

---

## Success Metrics

### Adoption
- **50%+ of captures** use "Save for Later"
- **Average batch size** in Review: 3-5 items
- **Review frequency**: Daily (evening)

### Efficiency
- **Capture time**: <10 seconds average
- **Review time**: <5 seconds per item
- **Batch approve**: 10 items in 30 seconds

### Satisfaction
- "I never forget things anymore" ✅
- "I can capture while busy" ✅
- "Review is quick and easy" ✅
- "No pressure to review immediately" ✅

---

## Technical Considerations

### Performance
- Parse on Review screen open (not on save)
- Cache parsed results
- Lazy load items (virtualization for 100+)
- Background parsing (Web Workers)

### Data Sync
- Inbox items stored locally first
- Sync to backend when available
- Offline-first approach
- Conflict resolution

### Error Handling
- If parsing fails, keep raw text
- Manual edit always available
- Never lose captured data
- Retry parsing option

---

This design transforms the app from **"stop and review now"** to **"capture instantly, review when convenient"** - perfect for time-poor parents! 🚀
