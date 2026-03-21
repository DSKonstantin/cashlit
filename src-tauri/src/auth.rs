use crate::error::AppError;

#[cfg(target_os = "macos")]
pub fn authenticate(reason: &str) -> Result<bool, AppError> {
    use std::path::PathBuf;

    // Compile a small Swift binary on first use, cache it
    let cache_dir = std::env::temp_dir().join("cashlit");
    let _ = std::fs::create_dir_all(&cache_dir);
    let binary_path = cache_dir.join("Cashlit");

    if !binary_path.exists() {
        let swift_source = r#"
import LocalAuthentication
import Foundation

let reason = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "Authenticate"

let context = LAContext()
let semaphore = DispatchSemaphore(value: 0)
var success = false

var error: NSError?
guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
    print("true")
    exit(0)
}

context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { result, _ in
    success = result
    semaphore.signal()
}

semaphore.wait()
print(success ? "true" : "false")
"#;

        let source_path = cache_dir.join("auth.swift");
        std::fs::write(&source_path, swift_source)
            .map_err(|e| AppError::Config(format!("Failed to write auth source: {}", e)))?;

        let compile = std::process::Command::new("swiftc")
            .args([
                source_path.to_str().unwrap(),
                "-o",
                binary_path.to_str().unwrap(),
            ])
            .output()
            .map_err(|e| AppError::Config(format!("Failed to compile auth: {}", e)))?;

        if !compile.status.success() {
            let stderr = String::from_utf8_lossy(&compile.stderr);
            return Err(AppError::Config(format!("Swift compile error: {}", stderr)));
        }
    }

    let output = std::process::Command::new(&binary_path)
        .arg(reason)
        .output()
        .map_err(|e| AppError::Config(format!("Failed to run auth: {}", e)))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(stdout == "true")
}

#[cfg(not(target_os = "macos"))]
pub fn authenticate(_reason: &str) -> Result<bool, AppError> {
    Ok(true)
}
