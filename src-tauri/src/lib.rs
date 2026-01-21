pub mod commands;
pub mod parser;

use commands::{
    ensure_directory, file_exists, get_calendar_dir, insert_event, parse_activities_file,
    parse_calendar_file, parse_people_file, read_file, write_file,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_calendar_dir,
            read_file,
            write_file,
            file_exists,
            ensure_directory,
            parse_calendar_file,
            parse_people_file,
            parse_activities_file,
            insert_event,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
