use std::{
    net::{SocketAddr, TcpStream},
    process::{Child, Command},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};

use tauri::{Manager, RunEvent};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

struct NextServer(Mutex<Option<Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .setup(|app| {

            // PRODUCTION ONLY
            #[cfg(not(debug_assertions))]
            {
                let resource_dir = app.path().resource_dir()?;

                let server_dir = resource_dir.join("next-server");
                let server_js = server_dir.join("server.js");
                let node_exe = resource_dir.join("node.exe");

                if !server_js.exists() {
                    return Err(format!(
                        "Next.js server not found: {}",
                        server_js.display()
                    ).into());
                }

                if !node_exe.exists() {
                    return Err(format!(
                        "Node.js runtime not found: {}",
                        node_exe.display()
                    ).into());
                }

                let mut command = Command::new(&node_exe);

                command
                    .arg(&server_js)
                    .current_dir(&server_dir)
                    .env("HOSTNAME", "127.0.0.1")
                    .env("PORT", "3210");

                #[cfg(target_os = "windows")]
                command.creation_flags(0x08000000);

                let child = command.spawn()?;

                app.manage(NextServer(Mutex::new(Some(child))));

                let address: SocketAddr = "127.0.0.1:3210".parse()?;
                let deadline = Instant::now() + Duration::from_secs(30);

                let mut ready = false;

                while Instant::now() < deadline {
                    if TcpStream::connect_timeout(
                        &address,
                        Duration::from_millis(300),
                    ).is_ok() {
                        ready = true;
                        break;
                    }

                    thread::sleep(Duration::from_millis(250));
                }

                if !ready {
                    return Err("Next.js server failed to start".into());
                }

                if let Some(window) = app.get_webview_window("main") {
                    window.navigate("http://127.0.0.1:3210".parse()?)?;
                }
            }

            // DEVELOPMENT ONLY
            #[cfg(debug_assertions)]
            {
                // Next.js is already running on port 3000.
                // Tauri uses devUrl from tauri.conf.json.
                println!("ASIT development mode: using Next.js dev server.");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Failed to build ASIT");

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            #[cfg(not(debug_assertions))]
            {
                if let Some(server) = handle.try_state::<NextServer>() {
                    if let Ok(mut child) = server.0.lock() {
                        if let Some(process) = child.as_mut() {
                            let _ = process.kill();
                            let _ = process.wait();
                        }
                    }
                }
            }
        }
    });
}