use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::api::dialog;

#[derive(Serialize, Deserialize)]
struct EditorSettings {
    font_size: u32,
    word_wrap_column: u32,
}

#[tauri::command]
fn save_settings(settings: EditorSettings) -> Result<(), EditorSettings> {
    let dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or("App data dir not found")?;
    let path = dir.join("settings.json");

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(&path, serde_json::to_string_pretty(&settings).unwrap())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_settings() -> Result<EditorSettings, String> {
    let dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or("App data dir not found")?;
    let path = dir.join("settings.json");

    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_text_file() -> Result<(String, String), String> {
    // ファイル選択ダイアログを開く
    let file_path = dialog::blocking::FileDialogBuilder::new()
        .add_filter("テキストファイル", &["txt", "md", "json", "js", "ts", "jsx", "tsx", "html", "css", "xml"])
        .add_filter("すべてのファイル", &["*"])
        .pick_file()
        .ok_or("ファイルが選択されませんでした")?;

    // ファイル名を取得
    let file_name = file_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown")
        .to_string();

    // ファイル内容を読み込み
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("ファイルの読み込みに失敗しました: {}", e))?;

    Ok((content, file_name))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_settings, load_settings, open_text_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
