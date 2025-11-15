/**
 * Comprehensive Message & Email Parsing Test Suite
 *
 * Tests Claude's ability to parse text messages and emails into structured data
 * for the Bronson family scheduling app.
 *
 * Categories:
 * - Text messages about events
 * - Emails with invitations
 * - School communications
 * - Multi-event messages
 * - Edge cases (ambiguous dates, typos, missing info)
 * - Contact information
 * - Task lists and checklists
 * - Gift lists
 */

export interface TestMessage {
  id: string;
  category: string;
  input: string;
  expectedType: 'event' | 'contact' | 'checklist' | 'gift' | 'multiple';
  expectedData: any;
  description: string;
}

export const testMessages: TestMessage[] = [
  // CATEGORY 1: Simple Event Text Messages (20 tests)
  {
    id: 'txt-event-001',
    category: 'Simple Events',
    input: 'Oliver has soccer practice tomorrow at 4pm',
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'soccer',
      time: '16:00',
      recurring: false
    },
    description: 'Simple future event with specific time'
  },
  {
    id: 'txt-event-002',
    category: 'Simple Events',
    input: 'Ella dentist appointment Thursday 2:30pm',
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'dentist',
      time: '14:30',
      recurring: false
    },
    description: 'Event with day of week'
  },
  {
    id: 'txt-event-003',
    category: 'Simple Events',
    input: 'Kate yoga every Monday at 6am',
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'yoga',
      time: '06:00',
      recurring: true,
      frequency: 'weekly'
    },
    description: 'Recurring weekly event'
  },
  {
    id: 'txt-event-004',
    category: 'Simple Events',
    input: 'Steven has a meeting Friday at 10',
    expectedType: 'event',
    expectedData: {
      person: 'Steven',
      activity: 'meeting',
      time: '10:00',
      recurring: false
    },
    description: 'Event with time without am/pm (morning assumed)'
  },
  {
    id: 'txt-event-005',
    category: 'Simple Events',
    input: 'Piano lesson for Ella next Wednesday 3:45pm',
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'piano',
      time: '15:45',
      recurring: false
    },
    description: 'Event with "next" modifier'
  },
  {
    id: 'txt-event-006',
    category: 'Simple Events',
    input: 'Oliver doctor checkup Dec 15 at 11am',
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'doctor',
      date: '2025-12-15',
      time: '11:00'
    },
    description: 'Event with specific date (month day)'
  },
  {
    id: 'txt-event-007',
    category: 'Simple Events',
    input: 'Family dinner tonight at 7',
    expectedType: 'event',
    expectedData: {
      person: 'Family',
      activity: 'dinner',
      time: '19:00',
      recurring: false
    },
    description: 'Family event (all members)'
  },
  {
    id: 'txt-event-008',
    category: 'Simple Events',
    input: 'Kate hair appointment Saturday morning 9:30',
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'hair',
      time: '09:30',
      recurring: false
    },
    description: 'Event with time of day descriptor'
  },
  {
    id: 'txt-event-009',
    category: 'Simple Events',
    input: 'Swimming lessons every Tuesday and Thursday at 5pm',
    expectedType: 'multiple',
    expectedData: {
      events: [
        { activity: 'swimming', recurring: true, time: '17:00' },
        { activity: 'swimming', recurring: true, time: '17:00' }
      ]
    },
    description: 'Multiple recurring days for same activity'
  },
  {
    id: 'txt-event-010',
    category: 'Simple Events',
    input: 'Oliver basketball game this Saturday 1pm',
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'basketball',
      time: '13:00',
      recurring: false
    },
    description: 'Event with "this" modifier'
  },
  {
    id: 'txt-event-011',
    category: 'Simple Events',
    input: 'Ella has dance rehearsal from 4-6pm tomorrow',
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'dance',
      startTime: '16:00',
      endTime: '18:00'
    },
    description: 'Event with duration (start-end time)'
  },
  {
    id: 'txt-event-012',
    category: 'Simple Events',
    input: 'Steven gym Mon Wed Fri 6am',
    expectedType: 'multiple',
    expectedData: {
      events: [
        { person: 'Steven', activity: 'gym', recurring: true },
        { person: 'Steven', activity: 'gym', recurring: true },
        { person: 'Steven', activity: 'gym', recurring: true }
      ]
    },
    description: 'Multiple recurring days abbreviated'
  },
  {
    id: 'txt-event-013',
    category: 'Simple Events',
    input: 'Parent teacher conference 11/20 at 3:00pm',
    expectedType: 'event',
    expectedData: {
      activity: 'parent teacher conference',
      date: '2025-11-20',
      time: '15:00'
    },
    description: 'Event with numeric date format'
  },
  {
    id: 'txt-event-014',
    category: 'Simple Events',
    input: 'Kate book club first Thursday of the month 7:30pm',
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'book club',
      recurring: true,
      time: '19:30'
    },
    description: 'Monthly recurring event with ordinal'
  },
  {
    id: 'txt-event-015',
    category: 'Simple Events',
    input: 'Oliver sleepover at Jake\'s house Friday night',
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'sleepover',
      recurring: false
    },
    description: 'Event with location context'
  },
  {
    id: 'txt-event-016',
    category: 'Simple Events',
    input: 'Ella Girl Scouts every other Tuesday 4pm',
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'Girl Scouts',
      time: '16:00',
      recurring: true,
      frequency: 'biweekly'
    },
    description: 'Biweekly recurring event'
  },
  {
    id: 'txt-event-017',
    category: 'Simple Events',
    input: 'Family movie night Friday 8pm',
    expectedType: 'event',
    expectedData: {
      person: 'Family',
      activity: 'movie',
      time: '20:00'
    },
    description: 'Family activity with specific time'
  },
  {
    id: 'txt-event-018',
    category: 'Simple Events',
    input: 'Steven conference call 2pm today',
    expectedType: 'event',
    expectedData: {
      person: 'Steven',
      activity: 'conference call',
      time: '14:00'
    },
    description: 'Event with "today" reference'
  },
  {
    id: 'txt-event-019',
    category: 'Simple Events',
    input: 'Oliver lunch with grandma Sunday noon',
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'lunch',
      time: '12:00'
    },
    description: 'Event with noon time reference'
  },
  {
    id: 'txt-event-020',
    category: 'Simple Events',
    input: 'Kate yoga workshop all day Saturday',
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'yoga',
      allDay: true
    },
    description: 'All-day event'
  },

  // CATEGORY 2: Email Invitations (15 tests)
  {
    id: 'email-invite-001',
    category: 'Email Invitations',
    input: `Subject: Birthday Party Invitation!

Hi Kate,

You're invited to Emma's 8th birthday party!

When: Saturday, November 23rd at 2:00 PM
Where: Bounce House Fun Center
RSVP: Please let us know by November 20th

Hope Ella can make it!

Best,
Jennifer`,
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'birthday party',
      date: '2025-11-23',
      time: '14:00',
      location: 'Bounce House Fun Center'
    },
    description: 'Email birthday party invitation'
  },
  {
    id: 'email-invite-002',
    category: 'Email Invitations',
    input: `Subject: Team Soccer Practice Schedule

Dear Parents,

Winter soccer practice will begin next week:

Practice Days: Mondays and Wednesdays
Time: 4:00 PM - 5:30 PM
Location: Memorial Park Field 3
Start Date: November 18th

Please ensure your child has water and shin guards.

Coach Mike`,
    expectedType: 'event',
    expectedData: {
      activity: 'soccer',
      recurring: true,
      time: '16:00',
      endTime: '17:30',
      location: 'Memorial Park Field 3'
    },
    description: 'Email with recurring practice schedule'
  },
  {
    id: 'email-invite-003',
    category: 'Email Invitations',
    input: `Subject: Dental Appointment Reminder

Dear Patient,

This is a reminder for your upcoming appointment:

Patient: Ella Bronson
Date: Thursday, December 5, 2025
Time: 2:30 PM
Provider: Dr. Sarah Chen
Location: Bright Smiles Dental, Suite 201

Please arrive 10 minutes early to complete paperwork.

To cancel or reschedule, call (555) 123-4567.

Bright Smiles Dental`,
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'dentist',
      date: '2025-12-05',
      time: '14:30',
      location: 'Bright Smiles Dental, Suite 201'
    },
    description: 'Medical appointment reminder email'
  },
  {
    id: 'email-invite-004',
    category: 'Email Invitations',
    input: `Subject: Virtual Meeting - Project Kickoff

Hi Steven,

You're invited to:

Project Alpha Kickoff Meeting

Tuesday, November 19, 2025
10:00 AM - 11:30 AM EST
Zoom Link: https://zoom.us/j/123456789

Agenda:
- Project overview
- Team introductions
- Timeline discussion

See you there!
Michael`,
    expectedType: 'event',
    expectedData: {
      person: 'Steven',
      activity: 'meeting',
      date: '2025-11-19',
      time: '10:00',
      endTime: '11:30'
    },
    description: 'Virtual meeting invitation'
  },
  {
    id: 'email-invite-005',
    category: 'Email Invitations',
    input: `Subject: Parent-Teacher Conferences Sign Up

Dear Parents,

Fall parent-teacher conferences are scheduled for November 21-22.

Please sign up for a 20-minute slot at:
www.signupgenius.com/conferences

Available times:
- Thursday 11/21: 3:00 PM - 7:00 PM
- Friday 11/22: 1:00 PM - 5:00 PM

Looking forward to meeting with you!

Ms. Rodriguez
3rd Grade`,
    expectedType: 'event',
    expectedData: {
      activity: 'parent teacher conference',
      timeframe: 'November 21-22'
    },
    description: 'Email with date range for scheduling'
  },
  {
    id: 'email-invite-006',
    category: 'Email Invitations',
    input: `From: piano@musicacademy.com
Subject: Piano Recital - Save the Date

Dear Families,

Our Winter Piano Recital is scheduled for:

Sunday, December 15th at 3:00 PM
City Concert Hall, Main Auditorium

All students should arrive by 2:30 PM for warm-up.

Formal attire requested.

More details to follow!

Margaret Thompson
Director, Music Academy`,
    expectedType: 'event',
    expectedData: {
      activity: 'piano recital',
      date: '2025-12-15',
      time: '15:00',
      location: 'City Concert Hall'
    },
    description: 'Recital invitation with early arrival time'
  },
  {
    id: 'email-invite-007',
    category: 'Email Invitations',
    input: `Subject: Thanksgiving Dinner at Our Place!

Hi everyone!

We'd love to have you join us for Thanksgiving!

When: Thursday, November 28th at 4:00 PM
Where: Our house (123 Maple Street)
What to bring: Your appetite! We'll provide everything, but feel free to bring a dessert if you'd like.

Let us know if you can make it!

Love,
Mom & Dad`,
    expectedType: 'event',
    expectedData: {
      person: 'Family',
      activity: 'Thanksgiving dinner',
      date: '2025-11-28',
      time: '16:00'
    },
    description: 'Family holiday gathering invitation'
  },
  {
    id: 'email-invite-008',
    category: 'Email Invitations',
    input: `Subject: Swim Team Tryouts

Swimming Families,

Competitive swim team tryouts:

Date: Saturday, December 7th
Time: 9:00 AM - 11:00 AM
Location: Aquatic Center, Lap Pool

Age groups:
- 8-10 years: 9:00 AM
- 11-13 years: 10:00 AM

Please bring swim cap and goggles.

Coach Lisa`,
    expectedType: 'event',
    expectedData: {
      activity: 'swim tryouts',
      date: '2025-12-07',
      time: '09:00',
      endTime: '11:00',
      location: 'Aquatic Center'
    },
    description: 'Tryout event with age-specific times'
  },
  {
    id: 'email-invite-009',
    category: 'Email Invitations',
    input: `Subject: Webinar: College Planning for Parents

You're invited to a free webinar:

"Navigating College Applications: A Guide for Parents"

Presenter: Dr. Emily Watson, College Counselor
Date: Wednesday, December 11, 2025
Time: 7:00 PM - 8:30 PM (Pacific Time)
Format: Online via Google Meet

Register at: www.collegeplanning.edu/webinar

Q&A session included!`,
    expectedType: 'event',
    expectedData: {
      activity: 'webinar',
      date: '2025-12-11',
      time: '19:00',
      endTime: '20:30'
    },
    description: 'Online webinar invitation'
  },
  {
    id: 'email-invite-010',
    category: 'Email Invitations',
    input: `Subject: Weekly Yoga Class Starting Soon!

Namaste Kate,

Your Tuesday morning yoga class begins:

Start Date: November 19th
Time: 6:00 AM - 7:00 AM
Every Tuesday (ongoing)
Studio: Peaceful Path Yoga, Room B

First class is free!

See you on the mat,
Instructor Sarah`,
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'yoga',
      recurring: true,
      time: '06:00',
      endTime: '07:00',
      location: 'Peaceful Path Yoga'
    },
    description: 'Recurring class start notification'
  },
  {
    id: 'email-invite-011',
    category: 'Email Invitations',
    input: `Subject: School Picture Day

Dear Parents,

School Picture Day Information:

Date: Monday, November 25th
Grades K-2: 9:00 AM - 10:30 AM
Grades 3-5: 10:30 AM - 12:00 PM

Students should wear their best smile and school-appropriate clothing.

Order forms sent home last week.

Principal Johnson`,
    expectedType: 'event',
    expectedData: {
      activity: 'school pictures',
      date: '2025-11-25'
    },
    description: 'School event with grade-level time slots'
  },
  {
    id: 'email-invite-012',
    category: 'Email Invitations',
    input: `Subject: Holiday Office Party

Team,

Join us for our annual holiday celebration!

Friday, December 20th
6:00 PM - 10:00 PM
The Grand Hotel, Ballroom C

Dinner, dancing, and awards ceremony.
Plus-ones welcome!

RSVP by December 10th to hr@company.com

Cheers,
HR Team`,
    expectedType: 'event',
    expectedData: {
      activity: 'holiday party',
      date: '2025-12-20',
      time: '18:00',
      endTime: '22:00',
      location: 'The Grand Hotel'
    },
    description: 'Work holiday party invitation'
  },
  {
    id: 'email-invite-013',
    category: 'Email Invitations',
    input: `Subject: Playdate Request

Hi Kate!

Would Oliver like to come over for a playdate with Jackson?

We were thinking this Saturday afternoon, maybe 2-4pm? The boys can play in the backyard and we have a new trampoline they'd love.

Let me know if that works!

Sarah`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'playdate',
      time: '14:00',
      endTime: '16:00'
    },
    description: 'Informal playdate invitation email'
  },
  {
    id: 'email-invite-014',
    category: 'Email Invitations',
    input: `Subject: Volunteer Opportunity - Food Drive

Dear Community Members,

Help us organize the Annual Holiday Food Drive!

Volunteer Shifts Available:

Saturday, December 14th
- Morning Shift: 8:00 AM - 12:00 PM
- Afternoon Shift: 12:00 PM - 4:00 PM

Sunday, December 15th
- Morning Shift: 9:00 AM - 1:00 PM

Location: Community Center

Sign up: volunteer@foodbank.org

Thank you!`,
    expectedType: 'event',
    expectedData: {
      activity: 'volunteer',
      date: '2025-12-14'
    },
    description: 'Multi-shift volunteer opportunity'
  },
  {
    id: 'email-invite-015',
    category: 'Email Invitations',
    input: `Subject: Dog Training Classes

Welcome to Puppy Training!

Your 6-week course begins:

Every Saturday starting November 23rd
Time: 10:00 AM - 11:00 AM
Location: Bark Park Training Center

Weeks 1-6: November 23, 30, December 7, 14, 21, 28

Bring your puppy, treats, and enthusiasm!

Trainer Mike`,
    expectedType: 'event',
    expectedData: {
      activity: 'dog training',
      recurring: true,
      time: '10:00',
      endTime: '11:00'
    },
    description: 'Multi-week course schedule'
  },

  // CATEGORY 3: School Communications (15 tests)
  {
    id: 'school-001',
    category: 'School Communications',
    input: `📚 WEEKLY NEWSLETTER - November 15, 2025

Important Dates:
• Monday 11/18 - No School (Teacher Planning Day)
• Wednesday 11/20 - Early Release (12:30 PM)
• Thursday 11/21 - Fall Concert 6:30 PM
• Friday 11/22 - Pajama Day!

Have a great week!
Mrs. Anderson`,
    expectedType: 'multiple',
    expectedData: {
      events: [
        { activity: 'no school', date: '2025-11-18' },
        { activity: 'early release', date: '2025-11-20', time: '12:30' },
        { activity: 'fall concert', date: '2025-11-21', time: '18:30' }
      ]
    },
    description: 'School newsletter with multiple events'
  },
  {
    id: 'school-002',
    category: 'School Communications',
    input: `FIELD TRIP PERMISSION SLIP

Grade 3 Field Trip to Science Museum

Date: Friday, December 6, 2025
Departure: 8:30 AM from school
Return: 2:00 PM to school
Cost: $15 per student
Lunch: Pack a nut-free lunch

Please return signed form by November 29th.`,
    expectedType: 'event',
    expectedData: {
      activity: 'field trip',
      date: '2025-12-06',
      time: '08:30',
      endTime: '14:00'
    },
    description: 'Field trip permission slip'
  },
  {
    id: 'school-003',
    category: 'School Communications',
    input: `🎨 ART SHOW INVITATION

You're invited to our Annual Student Art Show!

Tuesday, December 10th
5:00 PM - 7:00 PM
School Gymnasium

View your child's artwork and vote for your favorites!

Refreshments provided.`,
    expectedType: 'event',
    expectedData: {
      activity: 'art show',
      date: '2025-12-10',
      time: '17:00',
      endTime: '19:00'
    },
    description: 'School art show invitation'
  },
  {
    id: 'school-004',
    category: 'School Communications',
    input: `REMINDER: Book Fair This Week!

Monday - Friday
Before school: 8:00 AM - 8:30 AM
After school: 3:00 PM - 4:00 PM

Special Family Night: Thursday 5-7 PM

Cash and card accepted!`,
    expectedType: 'event',
    expectedData: {
      activity: 'book fair',
      recurring: false
    },
    description: 'School book fair with multiple time slots'
  },
  {
    id: 'school-005',
    category: 'School Communications',
    input: `WINTER BREAK SCHEDULE

Last Day Before Break: Friday, December 20th (Full Day)
School Resumes: Monday, January 6th

Winter Offices Closed: December 23rd - January 3rd

Happy Holidays! 🎄`,
    expectedType: 'event',
    expectedData: {
      activity: 'winter break',
      startDate: '2025-12-20',
      endDate: '2026-01-06'
    },
    description: 'School break schedule'
  },
  {
    id: 'school-006',
    category: 'School Communications',
    input: `SPORTS PHYSICAL REQUIRED

All students participating in spring sports must have a current physical on file.

Physical Clinic at School:
Date: Saturday, January 11th
Time: 9 AM - 12 PM
Cost: $25

Or see your own doctor and submit form by January 15th.`,
    expectedType: 'event',
    expectedData: {
      activity: 'physical',
      date: '2026-01-11',
      time: '09:00',
      endTime: '12:00'
    },
    description: 'School health clinic event'
  },
  {
    id: 'school-007',
    category: 'School Communications',
    input: `Subject: Class Parent Meeting

Hi Room 205 Families,

Class parent meeting to plan our holiday party:

When: Next Tuesday, November 19th at 6:30 PM
Where: School Library
What: Plan December party, discuss volunteers needed

Hope to see you there!
Room Mom Jessica`,
    expectedType: 'event',
    expectedData: {
      activity: 'parent meeting',
      date: '2025-11-19',
      time: '18:30',
      location: 'School Library'
    },
    description: 'Class parent meeting'
  },
  {
    id: 'school-008',
    category: 'School Communications',
    input: `🚌 BUS ROUTE CHANGE NOTICE

Effective Monday, November 18th:

Bus #42 afternoon pickup time changes from 3:15 PM to 3:25 PM

Morning route unchanged.

Questions? Call transportation: (555) 987-6543`,
    expectedType: 'event',
    expectedData: {
      activity: 'bus schedule change',
      date: '2025-11-18'
    },
    description: 'Transportation schedule change'
  },
  {
    id: 'school-009',
    category: 'School Communications',
    input: `SCIENCE FAIR INFORMATION

Project Display Day: Thursday, March 20th
Judging: 9:00 AM - 11:00 AM
Public Viewing: 6:00 PM - 8:00 PM

Projects due in classroom by Monday, March 17th.

Science Fair Kickoff Assembly: Friday, February 14th

Good luck, scientists! 🔬`,
    expectedType: 'multiple',
    expectedData: {
      events: [
        { activity: 'science fair', date: '2026-03-20' },
        { activity: 'science fair assembly', date: '2026-02-14' }
      ]
    },
    description: 'Science fair multi-event schedule'
  },
  {
    id: 'school-010',
    category: 'School Communications',
    input: `SPELLING BEE COMPETITION

Grade 3-5 Spelling Bee
Friday, January 24th, 2:00 PM
School Auditorium

Classroom competitions: January 17th
Top 2 from each class advance

Study word list posted on school website.`,
    expectedType: 'event',
    expectedData: {
      activity: 'spelling bee',
      date: '2026-01-24',
      time: '14:00'
    },
    description: 'Spelling bee competition'
  },
  {
    id: 'school-011',
    category: 'School Communications',
    input: `LUNCH MENU CHANGE

Due to kitchen maintenance:

Monday, November 25th - Sack Lunch Day
(Students may bring lunch or order pizza for $3)

Regular hot lunch resumes Tuesday.

Apologies for any inconvenience!`,
    expectedType: 'event',
    expectedData: {
      activity: 'sack lunch day',
      date: '2025-11-25'
    },
    description: 'School lunch schedule change'
  },
  {
    id: 'school-012',
    category: 'School Communications',
    input: `KINDERGARTEN REGISTRATION

2026-2027 School Year

Information Sessions:
• Tuesday, February 4th at 10:00 AM
• Wednesday, February 12th at 6:00 PM
• Saturday, February 22nd at 9:00 AM

Registration opens March 1st

Child must be 5 by September 1st, 2026`,
    expectedType: 'event',
    expectedData: {
      activity: 'kindergarten registration',
      multipleSlots: true
    },
    description: 'Registration with multiple info sessions'
  },
  {
    id: 'school-013',
    category: 'School Communications',
    input: `REPORT CARDS

Report cards will be sent home:
Friday, December 13th

Parent-teacher conferences available upon request.

Contact your child's teacher to schedule.`,
    expectedType: 'event',
    expectedData: {
      activity: 'report cards',
      date: '2025-12-13'
    },
    description: 'Report card distribution day'
  },
  {
    id: 'school-014',
    category: 'School Communications',
    input: `🎭 DRAMA CLUB PRESENTS: "THE WIZARD OF OZ"

Show Dates:
Friday, May 9th at 7:00 PM
Saturday, May 10th at 2:00 PM & 7:00 PM

Location: School Theater
Tickets: $5 (available at door)

Break a leg to our amazing cast and crew! 🌟`,
    expectedType: 'multiple',
    expectedData: {
      events: [
        { activity: 'school play', date: '2026-05-09', time: '19:00' },
        { activity: 'school play', date: '2026-05-10', time: '14:00' },
        { activity: 'school play', date: '2026-05-10', time: '19:00' }
      ]
    },
    description: 'School play with multiple showtimes'
  },
  {
    id: 'school-015',
    category: 'School Communications',
    input: `WEATHER ALERT ⚠️

Due to anticipated winter storm:

Tomorrow (Wednesday, Jan 15th) - 2-Hour Delay
School starts at 10:00 AM
Buses run 2 hours late

Check website for updates by 6:00 AM

Stay safe!`,
    expectedType: 'event',
    expectedData: {
      activity: 'school delay',
      date: '2026-01-15',
      time: '10:00'
    },
    description: 'Weather-related schedule change'
  },

  // CATEGORY 4: Contact Information (10 tests)
  {
    id: 'contact-001',
    category: 'Contact Information',
    input: `Hey! Here's Sarah's contact info:

Sarah Mitchell
(555) 234-5678
sarah.mitchell@email.com

She said to text her about the carpoolstuff!`,
    expectedType: 'contact',
    expectedData: {
      name: 'Sarah Mitchell',
      phone: '(555) 234-5678',
      email: 'sarah.mitchell@email.com'
    },
    description: 'Text message with contact info'
  },
  {
    id: 'contact-002',
    category: 'Contact Information',
    input: `Dr. Emily Chen - Pediatrician
Central Medical Center
Phone: 555-789-0123
Fax: 555-789-0124
Email: echen@centralmed.com
Office Hours: Mon-Fri 9am-5pm`,
    expectedType: 'contact',
    expectedData: {
      name: 'Dr. Emily Chen',
      phone: '555-789-0123',
      email: 'echen@centralmed.com',
      organization: 'Central Medical Center'
    },
    description: 'Medical provider contact info'
  },
  {
    id: 'contact-003',
    category: 'Contact Information',
    input: `Coach Mike's cell is 555-321-9876 in case you need to reach him about practice`,
    expectedType: 'contact',
    expectedData: {
      name: 'Coach Mike',
      phone: '555-321-9876'
    },
    description: 'Casual contact share via text'
  },
  {
    id: 'contact-004',
    category: 'Contact Information',
    input: `NEW BABYSITTER INFO:

Emma Rodriguez
Age: 17
Phone: (555) 444-3333
Email: emma.r@email.com
Rate: $15/hour
CPR Certified
Available weekends`,
    expectedType: 'contact',
    expectedData: {
      name: 'Emma Rodriguez',
      phone: '(555) 444-3333',
      email: 'emma.r@email.com',
      category: 'babysitter'
    },
    description: 'Babysitter contact with details'
  },
  {
    id: 'contact-005',
    category: 'Contact Information',
    input: `Add this to contacts:

Teacher: Ms. Rodriguez
Room 205
School Phone: 555-111-2222 ext. 305
Email: j.rodriguez@school.edu`,
    expectedType: 'contact',
    expectedData: {
      name: 'Ms. Rodriguez',
      phone: '555-111-2222',
      email: 'j.rodriguez@school.edu'
    },
    description: 'Teacher contact information'
  },
  {
    id: 'contact-006',
    category: 'Contact Information',
    input: `Got the piano teacher's info:
Margaret Thompson
margaret.piano@musicacademy.com
Studio: 555-888-7777
Cell: 555-888-7778`,
    expectedType: 'contact',
    expectedData: {
      name: 'Margaret Thompson',
      phone: '555-888-7777',
      email: 'margaret.piano@musicacademy.com'
    },
    description: 'Music teacher with multiple phones'
  },
  {
    id: 'contact-007',
    category: 'Contact Information',
    input: `EMERGENCY CONTACT UPDATE

Please add:

Grandma Betty Johnson
Home: (555) 666-5555
Cell: (555) 666-5556
Address: 789 Oak Lane

Authorized for school pickup`,
    expectedType: 'contact',
    expectedData: {
      name: 'Betty Johnson',
      phone: '(555) 666-5555',
      relationship: 'grandmother'
    },
    description: 'Emergency contact information'
  },
  {
    id: 'contact-008',
    category: 'Contact Information',
    input: `Jackson's mom gave me her number for playdates: Jessica Parker 555-222-3333`,
    expectedType: 'contact',
    expectedData: {
      name: 'Jessica Parker',
      phone: '555-222-3333'
    },
    description: 'Parent contact for playdates'
  },
  {
    id: 'contact-009',
    category: 'Contact Information',
    input: `Dr. Ryan Lee, DDS
Bright Smiles Dental
1234 Main Street, Suite 201
Phone: (555) 123-4567
www.brightsmilesdental.com
Office hours: Tue-Fri 8am-5pm, Sat 9am-2pm`,
    expectedType: 'contact',
    expectedData: {
      name: 'Dr. Ryan Lee',
      phone: '(555) 123-4567',
      organization: 'Bright Smiles Dental',
      category: 'dentist'
    },
    description: 'Dentist contact with full details'
  },
  {
    id: 'contact-010',
    category: 'Contact Information',
    input: `Swim coach Lisa's email is coach.lisa@swimteam.org and her cell is 555-999-8888 for emergencies only`,
    expectedType: 'contact',
    expectedData: {
      name: 'Coach Lisa',
      phone: '555-999-8888',
      email: 'coach.lisa@swimteam.org'
    },
    description: 'Coach contact with usage note'
  },

  // CATEGORY 5: Checklists and Tasks (10 tests)
  {
    id: 'checklist-001',
    category: 'Checklists',
    input: `Oliver's homework for the week:
- Math worksheet pages 45-47
- Read chapters 5-6
- Spelling practice
- Science project draft due Friday`,
    expectedType: 'checklist',
    expectedData: {
      person: 'Oliver',
      title: 'Homework',
      items: 4
    },
    description: 'Homework checklist'
  },
  {
    id: 'checklist-002',
    category: 'Checklists',
    input: `Packing list for Ella's sleepover:
✓ Sleeping bag
✓ Pillow
- Pajamas
- Change of clothes
- Toothbrush & toothpaste
- Favorite stuffed animal`,
    expectedType: 'checklist',
    expectedData: {
      person: 'Ella',
      title: 'Sleepover packing',
      items: 6,
      completed: 2
    },
    description: 'Packing checklist with some completed'
  },
  {
    id: 'checklist-003',
    category: 'Checklists',
    input: `Weekly meal prep:
- Buy groceries
- Prep vegetables Sunday
- Cook chicken breasts
- Make overnight oats
- Pack lunches`,
    expectedType: 'checklist',
    expectedData: {
      title: 'Meal prep',
      items: 5
    },
    description: 'Meal prep task list'
  },
  {
    id: 'checklist-004',
    category: 'Checklists',
    input: `Before school tomorrow:
[ ] Pack backpack
[ ] Make lunch
[ ] Sign permission slip
[ ] Put library books in bag
[ ] Check weather for outfit`,
    expectedType: 'checklist',
    expectedData: {
      title: 'Before school',
      items: 5
    },
    description: 'Morning routine checklist'
  },
  {
    id: 'checklist-005',
    category: 'Checklists',
    input: `House cleaning Saturday:
1. Vacuum upstairs
2. Clean bathrooms
3. Do laundry
4. Mop kitchen floor
5. Dust living room`,
    expectedType: 'checklist',
    expectedData: {
      title: 'House cleaning',
      items: 5
    },
    description: 'Numbered task list'
  },
  {
    id: 'checklist-006',
    category: 'Checklists',
    input: `Steven's work tasks this week:
- Finish Q4 report
- Schedule team meeting
- Review budget proposal
- Update project timeline
- Client presentation prep`,
    expectedType: 'checklist',
    expectedData: {
      person: 'Steven',
      title: 'Work tasks',
      items: 5
    },
    description: 'Work task list'
  },
  {
    id: 'checklist-007',
    category: 'Checklists',
    input: `Kate's errands today:
✅ Pick up dry cleaning
✅ Pharmacy - get prescriptions
⬜ Return library books
⬜ Buy birthday card
⬜ Get gas`,
    expectedType: 'checklist',
    expectedData: {
      person: 'Kate',
      title: 'Errands',
      items: 5,
      completed: 2
    },
    description: 'Errand list with emoji checkboxes'
  },
  {
    id: 'checklist-008',
    category: 'Checklists',
    input: `Soccer game day checklist:
* Uniform washed and packed
* Water bottle filled
* Snacks packed
* Shin guards in bag
* Cleats
* Arrive 30 min early`,
    expectedType: 'checklist',
    expectedData: {
      title: 'Soccer game day',
      items: 6
    },
    description: 'Event preparation checklist'
  },
  {
    id: 'checklist-009',
    category: 'Checklists',
    input: `Family vacation packing:
Kids:
- Clothes for 5 days
- Swimsuits
- Sandals and sneakers
- Sunscreen
- Toys/books

Adults:
- Clothes
- Toiletries
- Medications
- Chargers
- Travel documents`,
    expectedType: 'checklist',
    expectedData: {
      title: 'Vacation packing',
      person: 'Family',
      items: 10
    },
    description: 'Multi-section checklist'
  },
  {
    id: 'checklist-010',
    category: 'Checklists',
    input: `Oliver needs to practice:
- Piano 30 minutes daily
- Math facts flashcards
- Reading 20 minutes
- Spelling words`,
    expectedType: 'checklist',
    expectedData: {
      person: 'Oliver',
      title: 'Practice',
      items: 4
    },
    description: 'Practice routine checklist'
  },

  // CATEGORY 6: Gift Lists (5 tests)
  {
    id: 'gift-001',
    category: 'Gift Lists',
    input: `Ella's birthday wishlist:
- Art supplies set
- New bike helmet
- Books (any fantasy series)
- Roller skates
- Science kit`,
    expectedType: 'gift',
    expectedData: {
      person: 'Ella',
      occasion: 'birthday',
      items: 5
    },
    description: 'Birthday wishlist'
  },
  {
    id: 'gift-002',
    category: 'Gift Lists',
    input: `Oliver's Christmas list:
1. LEGO Star Wars set
2. Nintendo game
3. Basketball
4. New headphones
5. Skateboard`,
    expectedType: 'gift',
    expectedData: {
      person: 'Oliver',
      occasion: 'Christmas',
      items: 5
    },
    description: 'Holiday gift list'
  },
  {
    id: 'gift-003',
    category: 'Gift Lists',
    input: `Gift ideas for Steven (Father's Day):
- Golf club covers
- BBQ tool set
- Book by his favorite author
- Nice coffee
- Tech gadget`,
    expectedType: 'gift',
    expectedData: {
      person: 'Steven',
      occasion: "Father's Day",
      items: 5
    },
    description: "Father's Day gift ideas"
  },
  {
    id: 'gift-004',
    category: 'Gift Lists',
    input: `Teacher appreciation gifts:
Ms. Rodriguez - gift card to bookstore
Coach Mike - coffee mug
Mrs. Thompson (piano) - flowers`,
    expectedType: 'gift',
    expectedData: {
      occasion: 'teacher appreciation',
      items: 3
    },
    description: 'Teacher gift list'
  },
  {
    id: 'gift-005',
    category: 'Gift Lists',
    input: `Kate's birthday ideas (Steven's notes):
✓ Yoga mat (ordered)
- Spa gift certificate
- New running shoes
- Cookbook
- Weekend getaway?`,
    expectedType: 'gift',
    expectedData: {
      person: 'Kate',
      occasion: 'birthday',
      items: 5,
      completed: 1
    },
    description: 'Gift planning with purchased items'
  },

  // CATEGORY 7: Edge Cases - Ambiguous/Complex (15 tests)
  {
    id: 'edge-001',
    category: 'Edge Cases',
    input: `Hey can Oliver come to Jake's on Saturday? Around 2ish?`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'playdate',
      time: '14:00'
    },
    description: 'Vague time with "ish"'
  },
  {
    id: 'edge-002',
    category: 'Edge Cases',
    input: `dentist appt moved to next week sometime - will confirm`,
    expectedType: 'event',
    expectedData: {
      activity: 'dentist',
      dateVague: true
    },
    description: 'Unconfirmed future date'
  },
  {
    id: 'edge-003',
    category: 'Edge Cases',
    input: `Ella dance recital got cancelled 😢`,
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'dance recital',
      action: 'delete'
    },
    description: 'Event cancellation'
  },
  {
    id: 'edge-004',
    category: 'Edge Cases',
    input: `Oliver soccer practice moved from 4pm to 5pm starting next week`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'soccer',
      action: 'update',
      time: '17:00'
    },
    description: 'Event time change'
  },
  {
    id: 'edge-005',
    category: 'Edge Cases',
    input: `Reminder: no school tmrw!`,
    expectedType: 'event',
    expectedData: {
      activity: 'no school'
    },
    description: 'Abbreviations (tmrw = tomorrow)'
  },
  {
    id: 'edge-006',
    category: 'Edge Cases',
    input: `Can you pick up Ella from school around 3? I'm running late`,
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'school pickup',
      time: '15:00'
    },
    description: 'Implied request as event'
  },
  {
    id: 'edge-007',
    category: 'Edge Cases',
    input: `Steven's meeting might be pushed to Friday but not sure yet, will let you know`,
    expectedType: 'event',
    expectedData: {
      person: 'Steven',
      activity: 'meeting',
      tentative: true
    },
    description: 'Tentative/uncertain event'
  },
  {
    id: 'edge-008',
    category: 'Edge Cases',
    input: `Piano canceled today - teacher sick`,
    expectedType: 'event',
    expectedData: {
      activity: 'piano',
      action: 'delete'
    },
    description: 'Last-minute cancellation'
  },
  {
    id: 'edge-009',
    category: 'Edge Cases',
    input: `FYI Oliver has a half day next Wednesday (out at noon)`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'early dismissal',
      time: '12:00'
    },
    description: 'FYI prefix and parenthetical info'
  },
  {
    id: 'edge-010',
    category: 'Edge Cases',
    input: `Change Ella's dentist from Dec 5 to Dec 12 same time`,
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'dentist',
      action: 'update',
      date: '2025-12-12'
    },
    description: 'Explicit update request'
  },
  {
    id: 'edge-011',
    category: 'Edge Cases',
    input: `Basketball practice every Tues & Thurs til season ends`,
    expectedType: 'event',
    expectedData: {
      activity: 'basketball',
      recurring: true,
      endDate: 'unknown'
    },
    description: 'Recurring with indefinite end'
  },
  {
    id: 'edge-012',
    category: 'Edge Cases',
    input: `The kids have early release every Wednesday in January`,
    expectedType: 'event',
    expectedData: {
      activity: 'early release',
      recurring: true,
      month: 'January'
    },
    description: 'Monthly recurring events'
  },
  {
    id: 'edge-013',
    category: 'Edge Cases',
    input: `School concert is either the 15th or 16th, they haven't decided 🤷`,
    expectedType: 'event',
    expectedData: {
      activity: 'school concert',
      dateUncertain: true
    },
    description: 'Multiple possible dates'
  },
  {
    id: 'edge-014',
    category: 'Edge Cases',
    input: `Kate yoga class is full - she's on waitlist`,
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'yoga',
      status: 'waitlist'
    },
    description: 'Event with status/condition'
  },
  {
    id: 'edge-015',
    category: 'Edge Cases',
    input: `We're thinking about signing Oliver up for swimming but haven't decided yet`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'swimming',
      tentative: true
    },
    description: 'Considering but not committed'
  },

  // CATEGORY 8: Multi-Event Complex Messages (10 tests)
  {
    id: 'multi-001',
    category: 'Multi-Event',
    input: `Busy day tomorrow! Oliver has soccer at 4, Ella has piano at 5, and we have dinner with the Johnsons at 7.`,
    expectedType: 'multiple',
    expectedData: {
      events: [
        { person: 'Oliver', activity: 'soccer', time: '16:00' },
        { person: 'Ella', activity: 'piano', time: '17:00' },
        { person: 'Family', activity: 'dinner', time: '19:00' }
      ]
    },
    description: 'Multiple events in one message'
  },
  {
    id: 'multi-002',
    category: 'Multi-Event',
    input: `This week: Dentist Monday 2pm, parent-teacher conferences Wed 6pm, Oliver's game Friday 5pm, birthday party Saturday 3pm`,
    expectedType: 'multiple',
    expectedData: {
      events: 4
    },
    description: 'Week overview with multiple events'
  },
  {
    id: 'multi-003',
    category: 'Multi-Event',
    input: `Got the kids' schedules:
Oliver - basketball Mon/Wed 4-5:30pm
Ella - dance Tue/Thu 5-6pm
Both - swimming lessons Sat 10am`,
    expectedType: 'multiple',
    expectedData: {
      events: 5
    },
    description: 'Multiple recurring schedules'
  },
  {
    id: 'multi-004',
    category: 'Multi-Event',
    input: `Next week changes: No school Monday (holiday), early release Tuesday 12:30, assembly Wednesday 2pm, field trip Friday all day`,
    expectedType: 'multiple',
    expectedData: {
      events: 4
    },
    description: 'Multiple school schedule changes'
  },
  {
    id: 'multi-005',
    category: 'Multi-Event',
    input: `Updated contacts:
Dr. Chen (pediatrician) 555-1111
Coach Mike 555-2222
Piano teacher 555-3333`,
    expectedType: 'multiple',
    expectedData: {
      contacts: 3
    },
    description: 'Multiple contacts in one message'
  },
  {
    id: 'multi-006',
    category: 'Multi-Event',
    input: `Adding to Oliver's todo:
- Finish math homework
- Study for spelling test
- Practice piano 30 min
- Pack gym clothes
Also he has a dentist appointment Thursday at 3`,
    expectedType: 'multiple',
    expectedData: {
      checklist: { items: 4 },
      event: { activity: 'dentist' }
    },
    description: 'Checklist plus event'
  },
  {
    id: 'multi-007',
    category: 'Multi-Event',
    input: `Holiday schedule:
Dec 20 - Last day of school (early release 12pm)
Dec 21-Jan 5 - Winter break
Jan 6 - School resumes
Jan 20 - MLK Day (no school)`,
    expectedType: 'multiple',
    expectedData: {
      events: 4
    },
    description: 'Multi-week schedule overview'
  },
  {
    id: 'multi-008',
    category: 'Multi-Event',
    input: `Saturday plan:
8am - Kate yoga
9am - Oliver basketball game
11am - grocery shopping
2pm - Ella birthday party
6pm - family dinner out`,
    expectedType: 'multiple',
    expectedData: {
      events: 5
    },
    description: 'Full day schedule for family'
  },
  {
    id: 'multi-009',
    category: 'Multi-Event',
    input: `Quick updates:
- Soccer practice canceled tomorrow
- Piano moved to Thursday same time
- Added dentist appt for Ella next Monday 2pm
- Oliver needs permission slip signed for field trip`,
    expectedType: 'multiple',
    expectedData: {
      events: 3,
      task: 1
    },
    description: 'Mix of cancellations, updates, and new events'
  },
  {
    id: 'multi-010',
    category: 'Multi-Event',
    input: `School events this month:
Nov 18 - Picture Day
Nov 20 - Parent Teacher Conferences
Nov 21 - Thanksgiving Program 6:30pm
Nov 22 - Half Day (out at noon)
Nov 25-29 - Thanksgiving Break`,
    expectedType: 'multiple',
    expectedData: {
      events: 5
    },
    description: 'Monthly school calendar'
  },

  // CATEGORY 9: Typos and Informal Language (5 tests)
  {
    id: 'typo-001',
    category: 'Typos/Informal',
    input: `oliver sccer practise is tomrrow at 4`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'soccer',
      time: '16:00'
    },
    description: 'Multiple typos (sccer, practise, tomrrow)'
  },
  {
    id: 'typo-002',
    category: 'Typos/Informal',
    input: `ella dr appt thurs 230p`,
    expectedType: 'event',
    expectedData: {
      person: 'Ella',
      activity: 'doctor',
      time: '14:30'
    },
    description: 'Heavy abbreviations'
  },
  {
    id: 'typo-003',
    category: 'Typos/Informal',
    input: `dont forget olivers bday party sat @ 3!!`,
    expectedType: 'event',
    expectedData: {
      person: 'Oliver',
      activity: 'birthday party',
      time: '15:00'
    },
    description: 'Text speak (dont, @) and excitement'
  },
  {
    id: 'typo-004',
    category: 'Typos/Informal',
    input: `k has yoga class evry mon @ 6am`,
    expectedType: 'event',
    expectedData: {
      person: 'Kate',
      activity: 'yoga',
      recurring: true,
      time: '06:00'
    },
    description: 'Name abbreviation and typo (evry)'
  },
  {
    id: 'typo-005',
    category: 'Typos/Informal',
    input: `Reminder steven conf call 2day 2pm!!!`,
    expectedType: 'event',
    expectedData: {
      person: 'Steven',
      activity: 'conference call',
      time: '14:00'
    },
    description: 'Urgent tone with multiple exclamation marks'
  },
];

console.log(`Total test messages: ${testMessages.length}`);
console.log('Categories:', [...new Set(testMessages.map(t => t.category))]);
