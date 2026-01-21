use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn get_calendar_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let calendar_dir = home.join("Documents").join("FamilyCalendar");
    Ok(calendar_dir)
}

#[tauri::command]
pub fn read_file(path: PathBuf) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_file(path: PathBuf, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn file_exists(path: PathBuf) -> bool {
    path.exists()
}

#[tauri::command]
pub fn ensure_directory(path: PathBuf) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))
}
