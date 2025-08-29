use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt,FilePath};

#[derive(Serialize, Deserialize)]
struct EditorSettings {
    fontSize: u32,
    wordWrapColumn: u32,
    backgroundColor: String,
    textColor: String,
    fontFamily: String,
    autoSave: AutoSaveSettings,
}

#[derive(Serialize, Deserialize)]
struct AutoSaveSettings {
    enabled: bool,
    interval: u32,
}

#[tauri::command]
fn save_settings(settings: EditorSettings, app: tauri::AppHandle) -> Result<(), String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "App data dir not found")?;
    let path = dir.join("settings.json");

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(&path, serde_json::to_string_pretty(&settings).unwrap())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<EditorSettings, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "App data dir not found")?;
    let path = dir.join("settings.json");

    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}



#[tauri::command]
fn open_text_file(app: AppHandle) -> Result<(String, String), String> {
    // ファイル選択ダイアログ
    let file_path = app
        .dialog()
        .file()
        .add_filter("テキストファイル", &[
            "txt", "md", "json", "js", "ts", "jsx", "tsx", "html", "css", "xml"
        ])
        .add_filter("すべてのファイル", &["*"])
        .blocking_pick_file(); // 同期版

    match file_path {
        Some(FilePath::Path(path_buf)) => {
            // ファイル内容を読み込み
            let contents = fs::read_to_string(&path_buf)
                .map_err(|e| format!("ファイル読み込みエラー: {}", e))?;

            // ファイル名だけ取り出す
            let file_name = path_buf
                .file_name()
                .and_then(|os_str| os_str.to_str())
                .unwrap_or("不明なファイル")
                .to_string();

            Ok((contents, file_name))
        }
        Some(FilePath::Url(_url)) => {
            Err("URL 経由のファイル選択は未対応です".to_string())
        }
        None => Err("ファイルが選択されませんでした".to_string()),
    }
}

fn main() {
    println!("[Tauri] Starting application...");
    println!("[Tauri] Initializing plugins...");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_settings, load_settings, open_text_file])
        .setup(|app| {
            println!("[Tauri] App setup completed");
            println!("[Tauri] App info: {:?}", app.package_info());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
