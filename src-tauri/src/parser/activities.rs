use std::collections::HashMap;

use super::{
    ActivitiesData, Activity, ActivityCategory, ChecklistItem, ParseError, ParseResult,
    ParseWarning,
};

pub fn parse_activities(content: &str) -> ParseResult<ActivitiesData> {
    let mut data = ActivitiesData {
        categories: Vec::new(),
    };
    let mut warnings = Vec::new();
    let mut errors = Vec::new();

    let mut current_category: Option<ActivityCategory> = None;
    let mut current_activity: Option<Activity> = None;
    let mut current_checklist_key: Option<String> = None;
    let mut in_checklist = false;

    for (line_number, line) in content.lines().enumerate() {
        let trimmed = line.trim();

        // Skip empty lines
        if trimmed.is_empty() {
            continue;
        }

        // Main header
        if trimmed == "# Activities" {
            continue;
        }

        // Category header (## Name)
        if trimmed.starts_with("## ") {
            // Save current activity to category
            if let Some(activity) = current_activity.take() {
                if let Some(ref mut cat) = current_category {
                    cat.activities.push(activity);
                }
            }

            // Save current category
            if let Some(cat) = current_category.take() {
                data.categories.push(cat);
            }

            let name = trimmed[3..].trim().to_string();
            current_category = Some(ActivityCategory {
                name,
                activities: Vec::new(),
            });
            in_checklist = false;
            current_checklist_key = None;
            continue;
        }

        // Activity header (### +id)
        if trimmed.starts_with("### +") {
            // Save current activity
            if let Some(activity) = current_activity.take() {
                if let Some(ref mut cat) = current_category {
                    cat.activities.push(activity);
                }
            }

            let id = trimmed[5..].trim().to_string();
            current_activity = Some(Activity {
                id,
                icon: String::new(),
                color: String::new(),
                keywords: Vec::new(),
                extends: None,
                checklist: Vec::new(),
                person_checklists: HashMap::new(),
                condition_checklists: HashMap::new(),
            });
            in_checklist = false;
            current_checklist_key = None;
            continue;
        }

        // Inside an activity block
        if let Some(ref mut activity) = current_activity {
            // Check for checklist header variations
            if trimmed.starts_with("checklist") {
                in_checklist = true;

                // Check for person-specific checklist (checklist #person:)
                if let Some(hash_pos) = trimmed.find('#') {
                    let colon_pos = trimmed.find(':').unwrap_or(trimmed.len());
                    let person = trimmed[hash_pos + 1..colon_pos].trim().to_string();
                    current_checklist_key = Some(format!("person:{}", person));
                }
                // Check for condition checklist (checklist [condition]:)
                else if let Some(bracket_start) = trimmed.find('[') {
                    if let Some(bracket_end) = trimmed.find(']') {
                        let condition = trimmed[bracket_start + 1..bracket_end].to_string();
                        current_checklist_key = Some(format!("condition:{}", condition));
                    }
                } else {
                    current_checklist_key = None;
                }
                continue;
            }

            // Checklist item
            if in_checklist && trimmed.starts_with('-') {
                let item_text = trimmed[1..].trim();
                // Remove checkbox if present
                let item_text = if item_text.starts_with("[ ]") || item_text.starts_with("[x]") {
                    item_text[3..].trim()
                } else {
                    item_text
                };

                // Check if this is a section header ([ ] SECTION)
                let is_section = item_text
                    .chars()
                    .all(|c| c.is_uppercase() || c.is_whitespace());

                let item = ChecklistItem {
                    text: item_text.to_string(),
                    section: if is_section {
                        Some(item_text.to_string())
                    } else {
                        None
                    },
                    sub_items: Vec::new(),
                };

                match &current_checklist_key {
                    Some(key) if key.starts_with("person:") => {
                        let person = key.strip_prefix("person:").unwrap().to_string();
                        activity
                            .person_checklists
                            .entry(person)
                            .or_insert_with(Vec::new)
                            .push(item);
                    }
                    Some(key) if key.starts_with("condition:") => {
                        let condition = key.strip_prefix("condition:").unwrap().to_string();
                        activity
                            .condition_checklists
                            .entry(condition)
                            .or_insert_with(Vec::new)
                            .push(item);
                    }
                    _ => {
                        activity.checklist.push(item);
                    }
                }
                continue;
            }

            // Metadata fields
            if let Some(colon_pos) = trimmed.find(':') {
                let key = trimmed[..colon_pos].trim().to_lowercase();
                let value = trimmed[colon_pos + 1..].trim().to_string();

                match key.as_str() {
                    "icon" => activity.icon = value,
                    "color" => activity.color = value,
                    "keywords" => {
                        activity.keywords = value.split(',').map(|s| s.trim().to_string()).collect()
                    }
                    "extends" => activity.extends = Some(value.trim_start_matches('+').to_string()),
                    _ => {}
                }
                in_checklist = false;
            }
        }
    }

    // Save final activity and category
    if let Some(activity) = current_activity {
        if let Some(ref mut cat) = current_category {
            cat.activities.push(activity);
        }
    }
    if let Some(cat) = current_category {
        data.categories.push(cat);
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
    fn test_parse_simple_activity() {
        let content = r#"# Activities

## Sport

### +soccer
icon: ⚽
color: #10B981
keywords: football, training

checklist:
- Boots
- Shin pads
- Water bottle
"#;
        let result = parse_activities(content);
        assert_eq!(result.data.categories.len(), 1);
        assert_eq!(result.data.categories[0].name, "Sport");
        assert_eq!(result.data.categories[0].activities.len(), 1);

        let activity = &result.data.categories[0].activities[0];
        assert_eq!(activity.id, "soccer");
        assert_eq!(activity.icon, "⚽");
        assert_eq!(activity.color, "#10B981");
        assert_eq!(activity.checklist.len(), 3);
    }

    #[test]
    fn test_parse_person_checklist() {
        let content = r#"# Activities

## Sport

### +swimming
icon: 🏊
color: #0EA5E9

checklist:
- Swimmers
- Goggles

checklist #marcus:
- Flippers
"#;
        let result = parse_activities(content);
        let activity = &result.data.categories[0].activities[0];
        assert_eq!(activity.checklist.len(), 2);
        assert!(activity.person_checklists.contains_key("marcus"));
        assert_eq!(activity.person_checklists["marcus"].len(), 1);
    }

    #[test]
    fn test_parse_multiple_activities() {
        let content = r#"# Activities

## Sport

### +soccer
icon: ⚽

### +basketball
icon: 🏀

## Medical

### +appointment
icon: 🗓️
"#;
        let result = parse_activities(content);
        assert_eq!(result.data.categories.len(), 2);
        assert_eq!(result.data.categories[0].activities.len(), 2);
        assert_eq!(result.data.categories[1].activities.len(), 1);
    }
}
