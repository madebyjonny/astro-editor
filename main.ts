import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  IpcMainInvokeEvent,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import matter from "gray-matter";
import { spawn, ChildProcess } from "child_process";
import type {
  StoreData,
  RecentProject,
  Schema,
  FieldSchema,
  DevServerInfo,
  Frontmatter,
} from "./src/types";

// Track running dev servers per project
const devServers = new Map<string, DevServerInfo>();

// Simple store implementation using JSON file
const storeFile = path.join(app.getPath("userData"), "config.json");

function getStore(): StoreData {
  try {
    if (fs.existsSync(storeFile)) {
      return JSON.parse(fs.readFileSync(storeFile, "utf8"));
    }
  } catch (e) {
    console.error("Error reading store:", e);
  }
  return {};
}

function setStore(data: StoreData): void {
  try {
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing store:", e);
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const isMac = process.platform === "darwin";
  const isWindows = process.platform === "win32";

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    transparent: true,
    vibrancy: isMac ? "fullscreen-ui" : undefined,
    visualEffectState: isMac ? "active" : undefined,
    backgroundColor: "#00000000",
    backgroundMaterial: isWindows ? "acrylic" : undefined,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the webpack dev server in development or the built file in production
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// Open project folder dialog
ipcMain.handle("open-project", async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Astro Project Folder",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const projectPath = result.filePaths[0];
  const contentPath = path.join(projectPath, "src", "content");

  if (!fs.existsSync(contentPath)) {
    return { error: "No src/content folder found in this project" };
  }

  // Save to recent projects
  addRecentProject(projectPath);

  return { projectPath, contentPath };
});

// Recent projects helpers
function addRecentProject(projectPath: string): void {
  const storeData = getStore();
  const recentProjects = storeData.recentProjects || [];
  // Remove if already exists
  const filtered = recentProjects.filter((p) => p.path !== projectPath);
  // Add to beginning
  filtered.unshift({
    path: projectPath,
    name: path.basename(projectPath),
    lastOpened: new Date().toISOString(),
  });
  // Keep only last 10
  storeData.recentProjects = filtered.slice(0, 10);
  setStore(storeData);
}

// Get recent projects
ipcMain.handle("get-recent-projects", async (): Promise<RecentProject[]> => {
  const storeData = getStore();
  const recentProjects = storeData.recentProjects || [];
  // Filter out projects that no longer exist
  const validProjects = recentProjects.filter((p) => {
    const contentPath = path.join(p.path, "src", "content");
    return fs.existsSync(contentPath);
  });
  // Update store with only valid projects
  if (validProjects.length !== recentProjects.length) {
    storeData.recentProjects = validProjects;
    setStore(storeData);
  }
  return validProjects;
});

// Open a specific project by path
ipcMain.handle(
  "open-project-by-path",
  async (_event: IpcMainInvokeEvent, projectPath: string) => {
    const contentPath = path.join(projectPath, "src", "content");

    if (!fs.existsSync(contentPath)) {
      return { error: "No src/content folder found in this project" };
    }

    // Update recent projects
    addRecentProject(projectPath);

    return { projectPath, contentPath };
  }
);

// Remove a project from recent list
ipcMain.handle(
  "remove-recent-project",
  async (
    _event: IpcMainInvokeEvent,
    projectPath: string
  ): Promise<RecentProject[]> => {
    const storeData = getStore();
    const recentProjects = storeData.recentProjects || [];
    const filtered = recentProjects.filter((p) => p.path !== projectPath);
    storeData.recentProjects = filtered;
    setStore(storeData);
    return filtered;
  }
);

// Check if project can run (has dependencies installed)
ipcMain.handle(
  "check-project-status",
  async (_event: IpcMainInvokeEvent, projectPath: string) => {
    const nodeModulesPath = path.join(projectPath, "node_modules");
    const packageJsonPath = path.join(projectPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return { canRun: false, error: "No package.json found in project" };
    }

    const hasNodeModules = fs.existsSync(nodeModulesPath);
    const hasAstroDep =
      hasNodeModules && fs.existsSync(path.join(nodeModulesPath, "astro"));

    if (!hasNodeModules) {
      return {
        canRun: false,
        error:
          "Dependencies not installed. Run 'npm install' in your project directory.",
      };
    }

    if (!hasAstroDep) {
      return {
        canRun: false,
        error:
          "Astro is not installed. Run 'npm install astro' in your project directory.",
      };
    }

    // Check if dev server is already running
    const isRunning = devServers.has(projectPath);

    return { canRun: true, isRunning };
  }
);

// Start Astro dev server
ipcMain.handle(
  "start-dev-server",
  async (_event: IpcMainInvokeEvent, projectPath: string) => {
    // Check if already running
    if (devServers.has(projectPath)) {
      const server = devServers.get(projectPath)!;
      return {
        success: true,
        port: server.port,
        alreadyRunning: true,
      };
    }

    const packageJsonPath = path.join(projectPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return { error: "No package.json found" };
    }

    // Determine the package manager (check for lock files)
    let command = "npm";
    let args = ["run", "dev"];

    if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) {
      command = "pnpm";
      args = ["dev"];
    } else if (fs.existsSync(path.join(projectPath, "yarn.lock"))) {
      command = "yarn";
      args = ["dev"];
    } else if (fs.existsSync(path.join(projectPath, "bun.lockb"))) {
      command = "bun";
      args = ["run", "dev"];
    }

    return new Promise((resolve) => {
      const serverProcess = spawn(command, args, {
        cwd: projectPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "1" },
      });

      let port = 4321; // Default Astro port
      let resolved = false;
      let output = "";

      const handleOutput = (data: Buffer): void => {
        const text = data.toString();
        output += text;

        // Look for the port in the output
        const portMatch = text.match(/localhost:(\d+)/);
        if (portMatch) {
          port = parseInt(portMatch[1], 10);
        }

        // Check if server started successfully
        if (
          text.includes("watching for file changes") ||
          text.includes("Local") ||
          text.includes("ready")
        ) {
          if (!resolved) {
            resolved = true;
            devServers.set(projectPath, { process: serverProcess, port });
            resolve({ success: true, port });
          }
        }
      };

      serverProcess.stdout?.on("data", handleOutput);
      serverProcess.stderr?.on("data", handleOutput);

      serverProcess.on("error", (err: Error) => {
        if (!resolved) {
          resolved = true;
          resolve({ error: `Failed to start server: ${err.message}` });
        }
      });

      serverProcess.on("close", (code: number | null) => {
        devServers.delete(projectPath);
        if (!resolved) {
          resolved = true;
          resolve({
            error: `Server exited with code ${code}. Output: ${output.slice(
              -500
            )}`,
          });
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          devServers.set(projectPath, { process: serverProcess, port });
          resolve({
            success: true,
            port,
            warning: "Server may still be starting...",
          });
        }
      }, 30000);
    });
  }
);

// Stop dev server
ipcMain.handle(
  "stop-dev-server",
  async (_event: IpcMainInvokeEvent, projectPath: string) => {
    const server = devServers.get(projectPath);
    if (server) {
      server.process.kill();
      devServers.delete(projectPath);
      return { success: true };
    }
    return { success: true, message: "Server was not running" };
  }
);

// Open URL in default browser
ipcMain.handle(
  "open-in-browser",
  async (_event: IpcMainInvokeEvent, url: string) => {
    shell.openExternal(url);
    return { success: true };
  }
);

// Get collections from src/content folder
ipcMain.handle(
  "get-collections",
  async (_event: IpcMainInvokeEvent, contentPath: string) => {
    try {
      const items = fs.readdirSync(contentPath, { withFileTypes: true });
      const collections = items
        .filter((item) => item.isDirectory())
        .map((dir) => ({
          name: dir.name,
          path: path.join(contentPath, dir.name),
        }));
      return collections;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
);

// Get all files from all collections
ipcMain.handle(
  "get-all-files",
  async (_event: IpcMainInvokeEvent, contentPath: string) => {
    try {
      const items = fs.readdirSync(contentPath, { withFileTypes: true });
      const collections = items.filter((item) => item.isDirectory());

      const allFiles: Array<{
        name: string;
        path: string;
        preview: string;
        collectionName: string;
      }> = [];

      for (const collection of collections) {
        const collectionPath = path.join(contentPath, collection.name);
        const files = fs.readdirSync(collectionPath, { withFileTypes: true });

        for (const file of files) {
          if (
            file.isFile() &&
            (file.name.endsWith(".md") || file.name.endsWith(".mdx"))
          ) {
            const filePath = path.join(collectionPath, file.name);
            let preview = "";

            try {
              const content = fs.readFileSync(filePath, "utf8");
              const parsed = matter(content);
              preview = parsed.content
                .trim()
                .substring(0, 200)
                .replace(/\n/g, " ");
            } catch {
              // Ignore errors reading individual files
            }

            allFiles.push({
              name: file.name,
              path: filePath,
              preview,
              collectionName: collection.name,
            });
          }
        }
      }

      return allFiles;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
);

// Get files in a collection
ipcMain.handle(
  "get-collection-files",
  async (_event: IpcMainInvokeEvent, collectionPath: string) => {
    try {
      const items = fs.readdirSync(collectionPath, { withFileTypes: true });
      const files = items
        .filter(
          (item) =>
            item.isFile() &&
            (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
        )
        .map((file) => {
          const filePath = path.join(collectionPath, file.name);
          let preview = "";

          // Read file to get preview
          try {
            const content = fs.readFileSync(filePath, "utf8");
            const parsed = matter(content);
            // Get first 200 characters of content as preview
            preview = parsed.content
              .trim()
              .substring(0, 200)
              .replace(/\n/g, " ");
          } catch {
            // Ignore errors reading individual files
          }

          return {
            name: file.name,
            path: filePath,
            preview,
          };
        });
      return files;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
);

// Read file content with frontmatter
ipcMain.handle(
  "read-file",
  async (_event: IpcMainInvokeEvent, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const parsed = matter(content);
      return {
        frontmatter: parsed.data as Frontmatter,
        content: parsed.content,
        raw: content,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
);

// Save file content
ipcMain.handle(
  "save-file",
  async (
    _event: IpcMainInvokeEvent,
    filePath: string,
    frontmatter: Frontmatter,
    content: string
  ) => {
    try {
      const fileContent = matter.stringify(content, frontmatter);
      fs.writeFileSync(filePath, fileContent, "utf8");
      return { success: true };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
);

// Create new file
ipcMain.handle(
  "create-file",
  async (
    _event: IpcMainInvokeEvent,
    collectionPath: string,
    filename: string,
    frontmatter: Frontmatter,
    content: string
  ) => {
    try {
      const filePath = path.join(collectionPath, filename);
      if (fs.existsSync(filePath)) {
        return { error: "File already exists" };
      }
      const fileContent = matter.stringify(content || "", frontmatter);
      fs.writeFileSync(filePath, fileContent, "utf8");
      return { success: true, path: filePath };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
);

// Get collection schema from config.ts
ipcMain.handle(
  "get-collection-schema",
  async (
    _event: IpcMainInvokeEvent,
    contentPath: string,
    collectionName: string
  ): Promise<Schema> => {
    try {
      const configPath = path.join(contentPath, "config.ts");
      if (!fs.existsSync(configPath)) {
        // Return default schema if no config exists
        return getDefaultSchema();
      }

      const configContent = fs.readFileSync(configPath, "utf8");
      const schema = parseCollectionSchema(configContent, collectionName);
      return schema;
    } catch (error) {
      return getDefaultSchema();
    }
  }
);

function getDefaultSchema(): Schema {
  return {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    date: { type: "date", required: false },
    draft: { type: "boolean", required: false },
    tags: { type: "array", required: false },
  };
}

function parseCollectionSchema(
  configContent: string,
  collectionName: string
): Schema {
  // Basic parsing of Astro content config
  // This is a simplified parser - in production you'd want a proper TS parser
  const schema: Schema = {};

  // Look for the collection definition
  const collectionRegex = new RegExp(
    `${collectionName}\\s*:\\s*defineCollection\\s*\\(\\s*\\{[^}]*schema\\s*:\\s*z\\.object\\s*\\(\\s*\\{([^}]+)\\}`,
    "s"
  );
  const match = configContent.match(collectionRegex);

  if (match) {
    const schemaContent = match[1];

    // Parse field definitions
    const fieldRegex = /(\w+)\s*:\s*z\.(\w+)\([^)]*\)(?:\.optional\(\))?/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(schemaContent)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const isOptional =
        schemaContent.includes(`${fieldName}`) &&
        schemaContent.includes(".optional()");

      schema[fieldName] = {
        type: mapZodType(fieldType),
        required: !isOptional,
      };
    }
  }

  // If no schema found, return default
  if (Object.keys(schema).length === 0) {
    return getDefaultSchema();
  }

  return schema;
}

function mapZodType(zodType: string): FieldSchema["type"] {
  const typeMap: Record<string, FieldSchema["type"]> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "date",
    array: "array",
    enum: "enum",
  };
  return typeMap[zodType] || "string";
}
