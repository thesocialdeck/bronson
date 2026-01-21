use chrono::NaiveDate;
use std::collections::HashMap;

use super::{Context, LogEntry, ParseResult, PeopleData, Person, PersonMember};

fn to_id(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

// Extract surname from a family name like "The Chen Family" or "Chen Family" or "The Chens"
fn extract_surname(family_name: &str) -> Option<String> {
    let name = family_name.trim();

    // Remove common prefixes/suffixes
    let name = name.strip_prefix("The ").unwrap_or(name);
    let name = name.strip_suffix(" Family").unwrap_or(name);
    let name = name.strip_suffix("s").unwrap_or(name); // "The Chens" -> "Chen"

    // Get the last word as surname (handles "Dave & Michelle Chen")
    let words: Vec<&str> = name.split_whitespace().collect();
    if let Some(last) = words.last() {
        // Skip if it's a connector word
        if *last != "&" && *last != "and" {
            return Some(last.to_string());
        }
    }

    // Fallback: use the whole cleaned name
    if !name.is_empty() {
        Some(name.to_string())
    } else {
        None
    }
}

// Parse a member line like "Dave | phone: 0412 345 678 | born: 1982"
fn parse_member_line(line: &str, family_surname: &Option<String>) -> Option<PersonMember> {
    if !line.contains('|') {
        return None;
    }

    let parts: Vec<&str> = line.split('|').map(|s| s.trim()).collect();
    if parts.is_empty() {
        return None;
    }

    let name = parts[0].to_string();
    if name.is_empty() {
        return None;
    }

    // Generate ID: firstname-surname (e.g., "dave-chen")
    let id = if let Some(ref surname) = family_surname {
        format!("{}-{}", to_id(&name), to_id(surname))
    } else {
        to_id(&name)
    };

    // Parse fields from remaining parts
    let mut fields = HashMap::new();
    for part in parts.iter().skip(1) {
        if let Some(colon_pos) = part.find(':') {
            let key = part[..colon_pos].trim().to_lowercase();
            let value = part[colon_pos + 1..].trim().to_string();
            if !key.is_empty() && !value.is_empty() {
                fields.insert(key, value);
            }
        }
    }

    Some(PersonMember { id, name, fields })
}

fn parse_log_date(s: &str) -> Option<NaiveDate> {
    // Try YYYY-MM-DD format
    if let Ok(date) = NaiveDate::parse_from_str(s, "%Y-%m-%d") {
        return Some(date);
    }
    // Try other formats
    if let Ok(date) = NaiveDate::parse_from_str(s, "%d/%m/%Y") {
        return Some(date);
    }
    None
}

pub fn parse_people(content: &str) -> ParseResult<PeopleData> {
    let mut data = PeopleData {
        contexts: Vec::new(),
    };
    let mut warnings = Vec::new();
    let mut errors = Vec::new();

    let mut current_context: Option<Context> = None;
    let mut current_person: Option<Person> = None;
    let mut in_log = false;
    let mut collecting_notes = false;

    for (line_number, line) in content.lines().enumerate() {
        let trimmed = line.trim();

        // Skip empty lines
        if trimmed.is_empty() {
            if let Some(ref mut person) = current_person {
                collecting_notes = false;
            }
            continue;
        }

        // Main header
        if trimmed == "# People" {
            continue;
        }

        // Context header (## Name)
        if trimmed.starts_with("## ") {
            // Save current person to context
            if let Some(person) = current_person.take() {
                if let Some(ref mut ctx) = current_context {
                    ctx.people.push(person);
                }
            }

            // Save current context
            if let Some(ctx) = current_context.take() {
                data.contexts.push(ctx);
            }

            let name = trimmed[3..].trim().to_string();
            current_context = Some(Context {
                name: name.clone(),
                id: to_id(&name),
                people: Vec::new(),
            });
            in_log = false;
            continue;
        }

        // Person header (### Name)
        if trimmed.starts_with("### ") {
            // Save current person
            if let Some(person) = current_person.take() {
                if let Some(ref mut ctx) = current_context {
                    ctx.people.push(person);
                }
            }

            let name = trimmed[4..].trim().to_string();
            current_person = Some(Person {
                id: to_id(&name),
                name,
                subtitle: None,
                fields: HashMap::new(),
                notes: Vec::new(),
                log: Vec::new(),
                members: Vec::new(),
                line_number: line_number + 1,
            });
            in_log = false;
            collecting_notes = false;
            continue;
        }

        // Log header
        if trimmed == "#### Log" {
            in_log = true;
            collecting_notes = false;
            continue;
        }

        // Inside a person block
        if let Some(ref mut person) = current_person {
            // Log entry
            if in_log {
                if let Some(colon_pos) = trimmed.find(':') {
                    let date_str = &trimmed[..colon_pos];
                    let text = trimmed[colon_pos + 1..].trim().to_string();
                    if let Some(date) = parse_log_date(date_str.trim()) {
                        person.log.push(LogEntry { date, text });
                    }
                }
                continue;
            }

            // Continuation of notes (indented)
            if (line.starts_with("    ") || line.starts_with('\t')) && collecting_notes {
                person.notes.push(trimmed.to_string());
                continue;
            }

            // Member line: "Name | field: value | field: value"
            if trimmed.contains('|') {
                let surname = extract_surname(&person.name);
                if let Some(member) = parse_member_line(trimmed, &surname) {
                    person.members.push(member);
                }
                continue;
            }

            // Field: value
            if let Some(colon_pos) = trimmed.find(':') {
                let key = trimmed[..colon_pos].trim().to_lowercase();
                let value = trimmed[colon_pos + 1..].trim().to_string();

                if key == "notes" {
                    if !value.is_empty() {
                        person.notes.push(value);
                    }
                    collecting_notes = true;
                } else if !key.is_empty() {
                    person.fields.insert(key, value);
                }
                continue;
            }

            // First non-field line after name is subtitle
            if person.subtitle.is_none() && !trimmed.starts_with('#') {
                person.subtitle = Some(trimmed.to_string());
            }
        }
    }

    // Save final person and context
    if let Some(person) = current_person {
        if let Some(ref mut ctx) = current_context {
            ctx.people.push(person);
        }
    }
    if let Some(ctx) = current_context {
        data.contexts.push(ctx);
    }

    ParseResult {
        data,
        warnings,
        errors,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_people() {
        let content = r#"# People

## Family

### Marcus
son, 12
birthday: sep 14
school: St Mary's Primary

### Ella
daughter, 9
birthday: jan 8
"#;
        let result = parse_people(content);
        assert_eq!(result.data.contexts.len(), 1);
        assert_eq!(result.data.contexts[0].name, "Family");
        assert_eq!(result.data.contexts[0].people.len(), 2);
        assert_eq!(result.data.contexts[0].people[0].name, "Marcus");
        assert_eq!(
            result.data.contexts[0].people[0].fields.get("birthday"),
            Some(&"sep 14".to_string())
        );
    }

    #[test]
    fn test_parse_with_log() {
        let content = r#"# People

## Friends

### Jane
notes: Great person

#### Log
2024-12-15: Coffee catch-up
2024-11-20: Playdate
"#;
        let result = parse_people(content);
        assert_eq!(result.data.contexts[0].people[0].log.len(), 2);
        assert_eq!(
            result.data.contexts[0].people[0].log[0].text,
            "Coffee catch-up"
        );
    }

    #[test]
    fn test_to_id() {
        assert_eq!(to_id("Jane Morrison"), "jane-morrison");
        assert_eq!(to_id("Dr. Smith"), "dr-smith");
        assert_eq!(to_id("Dave & Michelle"), "dave-michelle");
    }

    #[test]
    fn test_extract_surname() {
        assert_eq!(extract_surname("The Chen Family"), Some("Chen".to_string()));
        assert_eq!(extract_surname("Chen Family"), Some("Chen".to_string()));
        assert_eq!(extract_surname("The Chens"), Some("Chen".to_string()));
        assert_eq!(
            extract_surname("Dave & Michelle Chen"),
            Some("Chen".to_string())
        );
    }

    #[test]
    fn test_parse_family_with_members() {
        let content = r#"# People

## Neighbours

### The Chen Family
address: 45 Smith St

Dave | phone: 0412 345 678 | born: 1982
Michelle | phone: 0423 456 789 | email: michelle@email.com
Lily | born: 2018
"#;
        let result = parse_people(content);
        assert_eq!(result.data.contexts.len(), 1);
        assert_eq!(result.data.contexts[0].people.len(), 1);

        let family = &result.data.contexts[0].people[0];
        assert_eq!(family.name, "The Chen Family");
        assert_eq!(family.id, "the-chen-family");
        assert_eq!(
            family.fields.get("address"),
            Some(&"45 Smith St".to_string())
        );

        // Check members
        assert_eq!(family.members.len(), 3);

        assert_eq!(family.members[0].name, "Dave");
        assert_eq!(family.members[0].id, "dave-chen");
        assert_eq!(
            family.members[0].fields.get("phone"),
            Some(&"0412 345 678".to_string())
        );
        assert_eq!(
            family.members[0].fields.get("born"),
            Some(&"1982".to_string())
        );

        assert_eq!(family.members[1].name, "Michelle");
        assert_eq!(family.members[1].id, "michelle-chen");
        assert_eq!(
            family.members[1].fields.get("email"),
            Some(&"michelle@email.com".to_string())
        );

        assert_eq!(family.members[2].name, "Lily");
        assert_eq!(family.members[2].id, "lily-chen");
        assert_eq!(
            family.members[2].fields.get("born"),
            Some(&"2018".to_string())
        );
    }
}
