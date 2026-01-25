use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Emitter;
use tauri_plugin_dialog::{DialogExt,FilePath};
use tokio::task;

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
async fn openTextFile(app: AppHandle) -> Result<(String, String), String> {
    // ファイル選択ダイアログを別スレッドで実行してUIをブロックしないようにする
    let app_clone = app.clone();
    let file_path_result = task::spawn_blocking(move || {
        app_clone
            .dialog()
            .file()
            .add_filter("テキストファイル", &[
                "txt", "md", "json", "js", "ts", "jsx", "tsx", "html", "css", "xml"
            ])
            .add_filter("すべてのファイル", &["*"])
            .blocking_pick_file()
    })
    .await
    .map_err(|e| format!("ファイル選択ダイアログの実行エラー: {}", e))?;

    match file_path_result {
        Some(FilePath::Path(path_buf)) => {
            // ファイル内容を読み込み（これも別スレッドで実行）
            let path_clone = path_buf.clone();
            let file_name = path_buf
                .file_name()
                .and_then(|os_str| os_str.to_str())
                .unwrap_or("不明なファイル")
                .to_string();

            let contents = task::spawn_blocking(move || {
                fs::read_to_string(&path_clone)
                    .map_err(|e| format!("ファイル読み込みエラー: {}", e))
            })
            .await
            .map_err(|e| format!("ファイル読み込みの実行エラー: {}", e))?
            .map_err(|e| e.to_string())?;

            Ok((contents, file_name))
        }
        Some(FilePath::Url(_url)) => {
            Err("URL 経由のファイル選択は未対応です".to_string())
        }
        None => Err("ファイルが選択されませんでした".to_string()),
    }
}

#[tauri::command]
async fn saveTextFile(app: AppHandle, content: String) -> Result<String, String> {
    // ファイル保存ダイアログを別スレッドで実行してUIをブロックしないようにする
    let app_clone = app.clone();
    let file_path_result = task::spawn_blocking(move || {
        app_clone
            .dialog()
            .file()
            .set_file_name("untitled.txt")
            .add_filter("テキストファイル", &[
                "txt", "md", "json", "js", "ts", "jsx", "tsx", "html", "css", "xml"
            ])
            .add_filter("すべてのファイル", &["*"])
            .blocking_save_file()
    })
    .await
    .map_err(|e| format!("ファイル保存ダイアログの実行エラー: {}", e))?;

    match file_path_result {
        Some(FilePath::Path(path_buf)) => {
            // ファイルに書き込み（これも別スレッドで実行）
            let path_clone = path_buf.clone();
            let content_clone = content.clone();
            task::spawn_blocking(move || {
                fs::write(&path_clone, content_clone)
                    .map_err(|e| format!("ファイル保存エラー: {}", e))
            })
            .await
            .map_err(|e| format!("ファイル書き込みの実行エラー: {}", e))?
            .map_err(|e| e.to_string())?;

            // ファイルパスを文字列として返す
            Ok(path_buf.to_string_lossy().to_string())
        }
        Some(FilePath::Url(_url)) => {
            Err("URL 経由のファイル保存は未対応です".to_string())
        }
        None => Err("ファイル保存がキャンセルされました".to_string()),
    }
}

#[tauri::command]
async fn saveToExistingFile(file_path: String, content: String) -> Result<(), String> {
    // 既存のファイルパスに保存する
    let path_buf = std::path::PathBuf::from(&file_path);
    
    task::spawn_blocking(move || {
        fs::write(&path_buf, content)
            .map_err(|e| format!("ファイル保存エラー: {}", e))
    })
    .await
    .map_err(|e| format!("ファイル書き込みの実行エラー: {}", e))?
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    println!("[Tauri] Starting application...");
    println!("[Tauri] Initializing plugins...");
    
    // macOSのIMKエラーを抑制（警告レベルのエラーなので無視）
    #[cfg(target_os = "macos")]
    {
        use std::env;
        // IMK関連のエラーログを抑制
        env::set_var("RUST_BACKTRACE", "0");
    }
    
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![saveSettings, loadSettings, openTextFile, saveTextFile, saveToExistingFile])
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
            // 注意: フロントエンド側で設定を読み込むため、ここではエラーを無視
            let app_handle = app.handle();
            match loadSettings(app_handle.clone()) {
                Ok(settings) => {
                    println!("[Tauri] Settings loaded successfully: {:?}", settings);
                }
                Err(e) => {
                    // 設定ファイルの構造が新しい形式の場合、エラーを無視
                    // フロントエンド側で正しく読み込まれる
                    println!("[Tauri] Settings load failed (may be new format): {}", e);
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
