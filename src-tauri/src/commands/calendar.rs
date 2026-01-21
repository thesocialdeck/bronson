use std::fs;
use std::path::PathBuf;

use crate::parser::{
    activities::parse_activities, calendar::parse_calendar, people::parse_people, ActivitiesData,
    Calendar, ParseResult, PeopleData,
};

#[tauri::command]
pub fn parse_calendar_file(path: PathBuf) -> Result<ParseResult<Calendar>, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(parse_calendar(&content))
}

#[tauri::command]
pub fn parse_people_file(path: PathBuf) -> Result<ParseResult<PeopleData>, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(parse_people(&content))
}

#[tauri::command]
pub fn parse_activities_file(path: PathBuf) -> Result<ParseResult<ActivitiesData>, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(parse_activities(&content))
}

#[tauri::command]
pub fn insert_event(path: PathBuf, line: String, month: String) -> Result<usize, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    let mut lines: Vec<&str> = content.lines().collect();
    let month_header = format!("## {}", month);

    // Find the month section
    let mut insert_pos = None;
    let mut in_month_section = false;

    for (i, l) in lines.iter().enumerate() {
        let trimmed = l.trim();

        if trimmed.eq_ignore_ascii_case(&month_header) {
            in_month_section = true;
            insert_pos = Some(i + 1);
            continue;
        }

        if in_month_section {
            // Stop at next section header
            if trimmed.starts_with("## ") {
                break;
            }

            // Skip empty lines at start of section
            if trimmed.is_empty() && insert_pos == Some(i) {
                insert_pos = Some(i + 1);
                continue;
            }

            // Found content, insert after it
            if !trimmed.is_empty() {
                insert_pos = Some(i + 1);
            }
        }
    }

    let insert_pos = insert_pos.ok_or("Could not find month section")?;

    // Insert the new line
    lines.insert(insert_pos, &line);

    // Write back
    let new_content = lines.join("\n");
    fs::write(&path, new_content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(insert_pos + 1) // Return 1-indexed line number
}
