import { app, BrowserWindow, dialog, Menu } from "electron";
import { createServer } from "node:http";
import path from "node:path";

let httpServer;

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
}

async function createWindow() {
  process.env.DATA_DIR = app.getPath("userData");

  const { createApp } = await import("../server/app.js");
  const port = Number(process.env.PORT ?? 3000);
  httpServer = createServer(createApp());
  await listen(httpServer, port);
  const iconPath = app.isPackaged
    ? path.join(app.getAppPath(), "dist", "morphee-icon.ico")
    : path.join(process.cwd(), "public", "morphee-icon.ico");

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0b0b1a",
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.ELECTRON_DEV_SERVER_URL;
  await window.loadURL(devServerUrl ?? `http://127.0.0.1:${port}`);
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {
    await createWindow();
  } catch (error) {
    console.error(error);
    await dialog.showMessageBox({
      type: "error",
      title: "Morphée",
      message: "Impossible de démarrer le serveur local.",
      detail: error.message,
    });
    app.quit();
  }
});

app.on("before-quit", () => {
  httpServer?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
