use chrono::{Datelike, NaiveDate, Weekday};
use nom::{
    branch::alt,
    bytes::complete::{tag, tag_no_case, take_until, take_while, take_while1},
    character::complete::{char, digit1, line_ending, space0, space1},
    combinator::{map, map_res, opt, recognize, value},
    multi::{many0, separated_list1},
    sequence::{delimited, preceded, terminated, tuple},
    IResult,
};
use uuid::Uuid;

use super::{
    date::{parse_date_range, parse_month_header},
    time::parse_time,
    Calendar, CalendarConfig, DateSpec, Event, EventStatus, FamilyMember, Frequency, Month,
    ParseError, ParseResult, ParseWarning, Priority, Recurrence, Reminder, ReminderTrigger,
    TimeSpec,
};

fn parse_u32(input: &str) -> IResult<&str, u32> {
    map_res(digit1, |s: &str| s.parse::<u32>())(input)
}

fn weekday_name(input: &str) -> IResult<&str, Weekday> {
    alt((
        value(
            Weekday::Mon,
            alt((tag_no_case("monday"), tag_no_case("mon"))),
        ),
        value(
            Weekday::Tue,
            alt((tag_no_case("tuesday"), tag_no_case("tue"))),
        ),
        value(
            Weekday::Wed,
            alt((tag_no_case("wednesday"), tag_no_case("wed"))),
        ),
        value(
            Weekday::Thu,
            alt((tag_no_case("thursday"), tag_no_case("thu"))),
        ),
        value(
            Weekday::Fri,
            alt((tag_no_case("friday"), tag_no_case("fri"))),
        ),
        value(
            Weekday::Sat,
            alt((tag_no_case("saturday"), tag_no_case("sat"))),
        ),
        value(
            Weekday::Sun,
            alt((tag_no_case("sunday"), tag_no_case("sun"))),
        ),
    ))(input)
}

fn weekday_to_string(day: Weekday) -> String {
    match day {
        Weekday::Mon => "monday".to_string(),
        Weekday::Tue => "tuesday".to_string(),
        Weekday::Wed => "wednesday".to_string(),
        Weekday::Thu => "thursday".to_string(),
        Weekday::Fri => "friday".to_string(),
        Weekday::Sat => "saturday".to_string(),
        Weekday::Sun => "sunday".to_string(),
    }
}

fn ordinal(input: &str) -> IResult<&str, i8> {
    alt((
        value(1, tag_no_case("1st")),
        value(2, tag_no_case("2nd")),
        value(3, tag_no_case("3rd")),
        value(4, tag_no_case("4th")),
        value(-1, tag_no_case("last")),
        map(
            terminated(parse_u32, alt((tag("st"), tag("nd"), tag("rd"), tag("th")))),
            |n| n as i8,
        ),
    ))(input)
}

fn recurrence_prefix(input: &str) -> IResult<&str, Recurrence> {
    let (input, _) = tag_no_case("every")(input)?;
    let (input, _) = space1(input)?;

    alt((
        // every 2nd thursday
        map(tuple((ordinal, space1, weekday_name)), |(pos, _, day)| {
            Recurrence {
                frequency: Frequency::Monthly,
                interval: 1,
                by_day: Some(vec![weekday_to_string(day)]),
                by_month_day: None,
                by_set_pos: Some(pos),
                until: None,
            }
        }),
        // every monday and wednesday
        map(
            separated_list1(tuple((space0, tag_no_case("and"), space0)), weekday_name),
            |days| Recurrence {
                frequency: Frequency::Weekly,
                interval: 1,
                by_day: Some(days.into_iter().map(weekday_to_string).collect()),
                by_month_day: None,
                by_set_pos: None,
                until: None,
            },
        ),
        // every 2 weeks monday
        map(
            tuple((
                parse_u32,
                space1,
                tag_no_case("weeks"),
                space1,
                weekday_name,
            )),
            |(interval, _, _, _, day)| Recurrence {
                frequency: Frequency::Weekly,
                interval,
                by_day: Some(vec![weekday_to_string(day)]),
                by_month_day: None,
                by_set_pos: None,
                until: None,
            },
        ),
        // every monday
        map(weekday_name, |day| Recurrence {
            frequency: Frequency::Weekly,
            interval: 1,
            by_day: Some(vec![weekday_to_string(day)]),
            by_month_day: None,
            by_set_pos: None,
            until: None,
        }),
        // every day / every 2 days
        map(
            tuple((
                opt(tuple((parse_u32, space1))),
                alt((tag_no_case("days"), tag_no_case("day"))),
            )),
            |(interval, _)| Recurrence {
                frequency: Frequency::Daily,
                interval: interval.map(|(n, _)| n).unwrap_or(1),
                by_day: None,
                by_month_day: None,
                by_set_pos: None,
                until: None,
            },
        ),
    ))(input)
}

fn yearly_prefix(input: &str) -> IResult<&str, Recurrence> {
    let (input, _) = tag_no_case("yearly")(input)?;
    Ok((
        input,
        Recurrence {
            frequency: Frequency::Yearly,
            interval: 1,
            by_day: None,
            by_month_day: None,
            by_set_pos: None,
            until: None,
        },
    ))
}

fn person_tag(input: &str) -> IResult<&str, &str> {
    preceded(
        char('#'),
        take_while1(|c: char| c.is_alphanumeric() || c == '_' || c == '-'),
    )(input)
}

fn location_tag(input: &str) -> IResult<&str, &str> {
    preceded(
        char('@'),
        alt((
            delimited(char('"'), take_until("\""), char('"')),
            take_while1(|c: char| c.is_alphanumeric() || c == '_' || c == '-' || c == ' '),
        )),
    )(input)
}

fn activity_tag(input: &str) -> IResult<&str, &str> {
    preceded(
        char('+'),
        take_while1(|c: char| c.is_alphanumeric() || c == '_' || c == '-'),
    )(input)
}

fn person_link(input: &str) -> IResult<&str, &str> {
    preceded(
        char('~'),
        take_while1(|c: char| c.is_alphanumeric() || c == '_' || c == '-'),
    )(input)
}

fn modifier(
    input: &str,
) -> IResult<&str, (Option<EventStatus>, Option<Priority>, Option<Reminder>)> {
    let (input, _) = char('[')(input)?;
    let (input, content) = take_while(|c: char| c != ']')(input)?;
    let (input, _) = char(']')(input)?;

    let content = content.trim();
    let status = match content.to_lowercase().as_str() {
        "tentative" => Some(EventStatus::Tentative),
        "cancelled" => Some(EventStatus::Cancelled),
        "done" => Some(EventStatus::Done),
        "confirmed" => Some(EventStatus::Confirmed),
        _ => None,
    };

    let priority = match content {
        "!!!" => Some(Priority::High),
        "!!" => Some(Priority::Medium),
        "!" => Some(Priority::Low),
        _ => None,
    };

    let reminder = if content.starts_with("remind") {
        let duration_part = content.strip_prefix("remind").unwrap().trim();
        Some(Reminder {
            trigger: ReminderTrigger::Before(duration_part.to_string()),
        })
    } else {
        None
    };

    Ok((input, (status, priority, reminder)))
}

fn parse_event_line(
    line: &str,
    line_number: usize,
    year: i32,
    current_month: Option<u32>,
) -> Option<Event> {
    let line = line.trim();
    if line.is_empty() || line.starts_with('#') || line.starts_with("<!--") {
        return None;
    }

    let mut event = Event::new();
    event.raw_line = line.to_string();
    event.line_number = line_number;

    let mut remaining = line;
    let mut has_recurrence = false;

    // Check for recurrence prefix
    if let Ok((rest, recurrence)) = alt((recurrence_prefix, yearly_prefix))(remaining) {
        event.recurrence = Some(recurrence);
        remaining = rest.trim_start();
        has_recurrence = true;
    }

    // Parse time first for recurring events (they don't have dates)
    // Try time before date to avoid parsing "3:30pm" as date "3"
    if has_recurrence {
        if let Ok((rest, time)) = parse_time(remaining) {
            event.time = Some(time);
            remaining = rest.trim_start();
        }
    } else {
        // Parse date (or date range) for non-recurring events
        if let Ok((rest, date)) = parse_date_range(remaining, year) {
            event.date = date;
            remaining = rest.trim_start();
        } else {
            return None;
        }

        // Adjust date for current month context
        if let (DateSpec::Single(ref mut date), Some(month)) = (&mut event.date, current_month) {
            if date.month() == 1 && date.day() <= 31 {
                if let Some(new_date) = NaiveDate::from_ymd_opt(year, month, date.day()) {
                    *date = new_date;
                }
            }
        }

        // Parse time for non-recurring events
        if let Ok((rest, time)) = parse_time(remaining) {
            event.time = Some(time);
            remaining = rest.trim_start();
        }
    }

    // Expect colon separator
    if remaining.starts_with(':') {
        remaining = remaining[1..].trim_start();
    } else {
        return None;
    }

    // Parse the rest (title with tags and modifiers)
    // Handle quoted locations specially first
    let mut content = remaining.to_string();

    // Extract quoted location first: @"Location Name"
    if let Some(start) = content.find("@\"") {
        if let Some(end) = content[start + 2..].find('"') {
            let location = content[start + 2..start + 2 + end].to_string();
            event.location = Some(location);
            content = format!("{}{}", &content[..start], &content[start + 3 + end..]);
        }
    }

    // Now parse word by word, but handle unquoted multi-word locations
    // by collecting words that follow @ until we hit another tag or end
    let mut title_parts = Vec::new();
    let mut collecting_location = false;
    let mut location_parts: Vec<String> = Vec::new();

    for word in content.split_whitespace() {
        // If we're collecting a location, check if this word ends it
        if collecting_location {
            // Tags and modifiers end the location
            if word.starts_with('#')
                || word.starts_with('+')
                || word.starts_with('~')
                || (word.starts_with('[') && word.ends_with(']'))
            {
                // Save collected location
                if !location_parts.is_empty() {
                    event.location = Some(location_parts.join(" "));
                    location_parts.clear();
                }
                collecting_location = false;
                // Fall through to process this word
            } else {
                // Continue collecting location (words starting with capital or continuing)
                location_parts.push(word.to_string());
                continue;
            }
        }

        if word.starts_with('#') {
            if let Ok((_, tag)) = person_tag(word) {
                event.people.push(tag.to_string());
            }
        } else if word.starts_with('@') && event.location.is_none() {
            // Start collecting location
            let loc_start = &word[1..];
            if !loc_start.is_empty() {
                location_parts.push(loc_start.to_string());
            }
            collecting_location = true;
        } else if word.starts_with('+') {
            if let Ok((_, act)) = activity_tag(word) {
                event.activity = Some(act.to_string());
            }
        } else if word.starts_with('~') {
            if let Ok((_, link)) = person_link(word) {
                event.person_links.push(link.to_string());
            }
        } else if word.starts_with('[') && word.ends_with(']') {
            if let Ok((_, (status, priority, reminder))) = modifier(word) {
                if let Some(s) = status {
                    event.status = s;
                }
                if let Some(p) = priority {
                    event.priority = p;
                }
                if let Some(r) = reminder {
                    event.reminders.push(r);
                }
            }
        } else {
            title_parts.push(word);
        }
    }

    // Save any remaining location parts
    if !location_parts.is_empty() {
        event.location = Some(location_parts.join(" "));
    }

    event.title = title_parts.join(" ");

    if event.title.is_empty() {
        return None;
    }

    Some(event)
}

pub fn parse_calendar(content: &str) -> ParseResult<Calendar> {
    let mut calendar = Calendar {
        year: 2026,
        config: CalendarConfig::default(),
        recurring: Vec::new(),
        months: Vec::new(),
    };
    let mut warnings = Vec::new();
    let mut errors = Vec::new();

    let mut current_section: Option<String> = None;
    let mut current_month: Option<u32> = None;
    let mut current_events: Vec<Event> = Vec::new();

    for (line_number, line) in content.lines().enumerate() {
        let trimmed = line.trim();

        // Year header
        if trimmed.starts_with("# ") {
            if let Ok(year) = trimmed[2..].trim().parse::<u16>() {
                calendar.year = year;
            }
            continue;
        }

        // Section header
        if trimmed.starts_with("## ") {
            // Save previous section
            if let Some(ref section) = current_section {
                if section.to_lowercase() == "recurring" {
                    calendar.recurring = std::mem::take(&mut current_events);
                } else {
                    calendar.months.push(Month {
                        name: section.clone(),
                        events: std::mem::take(&mut current_events),
                    });
                }
            }

            let section_name = trimmed[3..].trim().to_string();
            current_section = Some(section_name.clone());

            // Determine month number
            current_month =
                parse_month_header(&section_name).and_then(|m| match m.to_lowercase().as_str() {
                    "january" => Some(1),
                    "february" => Some(2),
                    "march" => Some(3),
                    "april" => Some(4),
                    "may" => Some(5),
                    "june" => Some(6),
                    "july" => Some(7),
                    "august" => Some(8),
                    "september" => Some(9),
                    "october" => Some(10),
                    "november" => Some(11),
                    "december" => Some(12),
                    _ => None,
                });
            continue;
        }

        // Config comments
        if trimmed.starts_with("<!--") && trimmed.contains("family:") {
            if let Some(start) = trimmed.find("family:") {
                let end = trimmed.find("-->").unwrap_or(trimmed.len());
                let family_str = &trimmed[start + 7..end];
                for name in family_str.split(',') {
                    let name = name.trim();
                    if !name.is_empty() {
                        calendar.config.family.push(FamilyMember {
                            id: name.to_lowercase().replace(' ', "-"),
                            display_name: name.to_string(),
                            color: "#4A90D9".to_string(),
                        });
                    }
                }
            }
            continue;
        }

        // Note lines (indented)
        if line.starts_with("    ") || line.starts_with('\t') {
            if let Some(last) = current_events.last_mut() {
                last.notes.push(trimmed.to_string());
            }
            continue;
        }

        // Skip empty lines and comments
        if trimmed.is_empty() || trimmed.starts_with("<!--") {
            continue;
        }

        // Try to parse as event
        if let Some(event) = parse_event_line(
            trimmed,
            line_number + 1,
            calendar.year as i32,
            current_month,
        ) {
            current_events.push(event);
        } else if !trimmed.is_empty() {
            warnings.push(ParseWarning {
                line: line_number + 1,
                message: format!("Could not parse line: {}", trimmed),
                suggestion: Some("Check date format and colon separator".to_string()),
            });
        }
    }

    // Save last section
    if let Some(ref section) = current_section {
        if section.to_lowercase() == "recurring" {
            calendar.recurring = current_events;
        } else {
            calendar.months.push(Month {
                name: section.clone(),
                events: current_events,
            });
        }
    }

    ParseResult {
        data: calendar,
        warnings,
        errors,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_event() {
        let event = parse_event_line("15 9am: Dentist #marcus", 1, 2026, Some(1)).unwrap();
        assert_eq!(event.title, "Dentist");
        assert!(event.people.contains(&"marcus".to_string()));
    }

    #[test]
    fn test_parse_event_with_location() {
        let event = parse_event_line("16 7pm: Date night @Aria", 1, 2026, Some(1)).unwrap();
        assert_eq!(event.title, "Date night");
        assert_eq!(event.location, Some("Aria".to_string()));
    }

    #[test]
    fn test_parse_event_with_multiword_location() {
        let event = parse_event_line(
            "15 3:30pm: Soccer practice #marcus +sport @Timbrell Park",
            1,
            2026,
            Some(1),
        )
        .unwrap();
        assert_eq!(event.title, "Soccer practice");
        assert_eq!(event.location, Some("Timbrell Park".to_string()));
        assert!(event.people.contains(&"marcus".to_string()));
        assert_eq!(event.activity, Some("sport".to_string()));
    }

    #[test]
    fn test_parse_event_with_quoted_location() {
        let event = parse_event_line(
            "19 2pm: Birthday party #ella @\"Flip Out Prestons\"",
            1,
            2026,
            Some(1),
        )
        .unwrap();
        assert_eq!(event.title, "Birthday party");
        assert_eq!(event.location, Some("Flip Out Prestons".to_string()));
    }

    #[test]
    fn test_parse_event_location_before_tags() {
        let event = parse_event_line(
            "16 7pm: Dinner @Quay #sarah #steven +social",
            1,
            2026,
            Some(1),
        )
        .unwrap();
        assert_eq!(event.title, "Dinner");
        assert_eq!(event.location, Some("Quay".to_string()));
        assert!(event.people.contains(&"sarah".to_string()));
        assert!(event.people.contains(&"steven".to_string()));
    }

    #[test]
    fn test_parse_event_with_activity() {
        let event = parse_event_line("3: School resumes +school", 1, 2026, Some(1)).unwrap();
        assert_eq!(event.title, "School resumes");
        assert_eq!(event.activity, Some("school".to_string()));
    }

    #[test]
    fn test_parse_recurring_event() {
        let event =
            parse_event_line("every monday 3:30pm: Soccer practice", 1, 2026, None).unwrap();
        assert_eq!(event.title, "Soccer practice");
        assert!(event.recurrence.is_some());
        let rec = event.recurrence.unwrap();
        assert!(matches!(rec.frequency, Frequency::Weekly));
    }

    #[test]
    fn test_parse_monthly_recurring() {
        let event = parse_event_line("every 2nd thursday 7pm: Book club", 1, 2026, None).unwrap();
        assert!(event.recurrence.is_some());
        let rec = event.recurrence.unwrap();
        assert!(matches!(rec.frequency, Frequency::Monthly));
        assert_eq!(rec.by_set_pos, Some(2));
    }

    #[test]
    fn test_parse_full_calendar() {
        let content = r#"# 2026

## Recurring

every monday 3:30pm: Soccer practice #marcus +sport

## January

3: School resumes #family +school
15 9am: Dentist #marcus +appointment @Dr Smith
"#;
        let result = parse_calendar(content);
        assert_eq!(result.data.year, 2026);
        assert_eq!(result.data.recurring.len(), 1);
        assert_eq!(result.data.months.len(), 1);
        assert_eq!(result.data.months[0].events.len(), 2);
    }
}
