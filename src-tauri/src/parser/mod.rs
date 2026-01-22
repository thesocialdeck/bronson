pub mod activities;
pub mod calendar;
pub mod date;
pub mod people;
pub mod time;

use chrono::{NaiveDate, NaiveTime, Weekday};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

// Calendar types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Calendar {
    pub year: u16,
    pub config: CalendarConfig,
    pub recurring: Vec<Event>,
    pub months: Vec<Month>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CalendarConfig {
    pub family: Vec<FamilyMember>,
    pub custom_types: Vec<CustomType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FamilyMember {
    pub id: String,
    pub display_name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomType {
    pub id: String,
    pub color: String,
    pub icon: String,
    pub keywords: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Month {
    pub name: String,
    pub events: Vec<Event>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub raw_line: String,
    pub line_number: usize,
    pub date: DateSpec,
    pub time: Option<TimeSpec>,
    pub recurrence: Option<Recurrence>,
    pub title: String,
    pub people: Vec<String>,
    pub location: Option<String>,
    pub activity: Option<String>,
    pub person_links: Vec<String>,
    pub status: EventStatus,
    pub reminders: Vec<Reminder>,
    pub priority: Priority,
    pub notes: Vec<String>,
}

impl Event {
    pub fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            raw_line: String::new(),
            line_number: 0,
            date: DateSpec::Single(NaiveDate::from_ymd_opt(2026, 1, 1).unwrap()),
            time: None,
            recurrence: None,
            title: String::new(),
            people: Vec::new(),
            location: None,
            activity: None,
            person_links: Vec::new(),
            status: EventStatus::None,
            reminders: Vec::new(),
            priority: Priority::None,
            notes: Vec::new(),
        }
    }
}

impl Default for Event {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum DateSpec {
    Single(NaiveDate),
    Range { start: NaiveDate, end: NaiveDate },
    Relative(RelativeDate),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RelativeDate {
    Today,
    Tomorrow,
    Weekday { day: String, next: bool },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum TimeSpec {
    Point(String),
    Range { start: String, end: String },
    Fuzzy(FuzzyTime),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FuzzyTime {
    Morning,
    Afternoon,
    Evening,
    Night,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recurrence {
    pub frequency: Frequency,
    pub interval: u32,
    pub by_day: Option<Vec<String>>,
    pub by_month_day: Option<i8>,
    pub by_set_pos: Option<i8>,
    pub until: Option<RecurrenceEnd>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Frequency {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum RecurrenceEnd {
    Date(NaiveDate),
    Count(u32),
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum EventStatus {
    #[default]
    None,
    Tentative,
    Confirmed,
    Cancelled,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reminder {
    pub trigger: ReminderTrigger,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum ReminderTrigger {
    Before(String),
    At(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum Priority {
    #[default]
    None,
    Low,
    Medium,
    High,
}

// People types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeopleData {
    pub contexts: Vec<Context>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Context {
    pub name: String,
    pub id: String,
    pub people: Vec<Person>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub name: String,
    pub subtitle: Option<String>,
    pub color: Option<String>,
    pub fields: HashMap<String, String>,
    pub notes: Vec<String>,
    pub log: Vec<LogEntry>,
    pub members: Vec<PersonMember>,
    pub line_number: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonMember {
    pub id: String,
    pub name: String,
    pub fields: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub date: NaiveDate,
    pub text: String,
}

// Activities types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivitiesData {
    pub categories: Vec<ActivityCategory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityCategory {
    pub name: String,
    pub activities: Vec<Activity>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub icon: String,
    pub color: String,
    pub keywords: Vec<String>,
    pub extends: Option<String>,
    pub checklist: Vec<ChecklistItem>,
    pub person_checklists: HashMap<String, Vec<ChecklistItem>>,
    pub condition_checklists: HashMap<String, Vec<ChecklistItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChecklistItem {
    pub text: String,
    pub section: Option<String>,
    pub sub_items: Vec<String>,
}

// Parse result types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseResult<T> {
    pub data: T,
    pub warnings: Vec<ParseWarning>,
    pub errors: Vec<ParseError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseWarning {
    pub line: usize,
    pub message: String,
    pub suggestion: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseError {
    pub line: usize,
    pub column: usize,
    pub message: String,
    pub raw_line: String,
}
