import { getCurrentWindow } from "@tauri-apps/api/window";

export async function closeWindow() {
  await getCurrentWindow().close();
}

export async function minimizeWindow() {
  await getCurrentWindow().minimize();
}

export async function toggleFullscreen() {
  const win = getCurrentWindow();
  const fs = await win.isFullscreen();
  await win.setFullscreen(!fs);
}

export async function startDrag() {
  await getCurrentWindow().startDragging();
}
