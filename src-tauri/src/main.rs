use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Emitter;
use tauri_plugin_dialog::{DialogExt,FilePath};

#[derive(Serialize, Deserialize, Clone, Debug)]
struct EditorSettings {
    fontSize: u32,
    wordWrapColumn: u32,
    backgroundColor: String,
    textColor: String,
    fontFamily: String,
    autoSave: AutoSaveSettings,
    resizerRatio: Option<u32>, // エディタとプレビューの比率（%）
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct AutoSaveSettings {
    enabled: bool,
    interval: u32,
}

impl Default for EditorSettings {
    fn default() -> Self {
        Self {
            fontSize: 16,
            wordWrapColumn: 60,
            backgroundColor: "#ffffff".to_string(),
            textColor: "#000000".to_string(),
            fontFamily: "\"UD デジタル 教科書体 N-R\", \"Hiragino Sans\", \"Yu Gothic UI\", \"Meiryo UI\", sans-serif".to_string(),
            autoSave: AutoSaveSettings {
                enabled: true,
                interval: 10,
            },
            resizerRatio: Some(50), // デフォルトは50%
        }
    }
}

impl Default for AutoSaveSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            interval: 10,
        }
    }
}

#[tauri::command]
fn saveSettings(settings: EditorSettings, app: tauri::AppHandle) -> Result<(), String> {
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
fn loadSettings(app: tauri::AppHandle) -> Result<EditorSettings, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "App data dir not found")?;
    let path = dir.join("settings.json");

    // 設定ファイルが存在しない場合、デフォルト設定を作成
    if !path.exists() {
        println!("[Tauri] Settings file not found, creating default settings");
        let default_settings = EditorSettings::default();
        saveSettings(default_settings.clone(), app.clone())?;
        return Ok(default_settings);
    }

    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}



#[tauri::command]
fn openTextFile(app: AppHandle) -> Result<(String, String), String> {
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
        .invoke_handler(tauri::generate_handler![saveSettings, loadSettings, openTextFile])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("[Tauri] Close requested event received");
                // フロントエンドにイベントを送信して未保存チェックを依頼
                window.emit("close-requested", ()).unwrap();
                // 常にデフォルトの動作を防ぐ（フロントエンドで判断）
            }
        })
        .setup(|app| {
            println!("[Tauri] App setup completed");
            println!("[Tauri] App info: {:?}", app.package_info());
            
            // アプリ起動時に設定ファイルの初期化を確認
            let app_handle = app.handle();
            match loadSettings(app_handle.clone()) {
                Ok(settings) => {
                    println!("[Tauri] Settings loaded successfully: {:?}", settings);
                }
                Err(e) => {
                    println!("[Tauri] Failed to load settings: {}", e);
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
