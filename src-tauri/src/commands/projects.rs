use tauri::State;

use crate::error::AppError;
use crate::providers::types::*;
use crate::state::AppState;

#[tauri::command]
pub async fn get_projects(state: State<'_, AppState>) -> Result<Vec<Project>, AppError> {
    let projects = state.projects.read().await;
    Ok(projects.clone())
}

#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    project: NewProject,
) -> Result<Project, AppError> {
    let new = Project {
        id: uuid::Uuid::new_v4().to_string(),
        name: project.name,
        provider_ids: vec![],
    };

    let mut projects = state.projects.write().await;
    projects.push(new.clone());
    state.save_projects(&projects);

    Ok(new)
}

#[tauri::command]
pub async fn update_project(
    state: State<'_, AppState>,
    project: Project,
) -> Result<(), AppError> {
    let mut projects = state.projects.write().await;
    if let Some(p) = projects.iter_mut().find(|p| p.id == project.id) {
        p.name = project.name;
        p.provider_ids = project.provider_ids;
    }
    state.save_projects(&projects);
    Ok(())
}

#[tauri::command]
pub async fn delete_project(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    let mut projects = state.projects.write().await;
    projects.retain(|p| p.id != id);
    state.save_projects(&projects);
    Ok(())
}
