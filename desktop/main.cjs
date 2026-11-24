const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const HOST = '127.0.0.1';
const DEFAULT_PORT = 41867;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
    '.woff2': 'font/woff2',
    '.webp': 'image/webp'
};

let server;
let windowPrincipal;

function serveStaticFiles(root) {
    return http.createServer((request, response) => {
        if (!['GET', 'HEAD'].includes(request.method)) {
            response.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }

        const requestOrigin = request.headers.origin;
        if (requestOrigin && requestOrigin !== windowPrincipal) {
            response.writeHead(403).end();
            return;
        }

        let pathname;
        try {
            pathname = decodeURIComponent(new URL(request.url, windowPrincipal).pathname);
        } catch {
            response.writeHead(400).end();
            return;
        }

        const relativePath = pathname.replace(/^\/+/, '') || 'index.html';
        const filePath = path.resolve(root, relativePath);
        const relativeToRoot = path.relative(root, filePath);
        if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
            response.writeHead(403).end();
            return;
        }

        fs.stat(filePath, (statError, stat) => {
            const resolved = !statError && stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
            fs.readFile(resolved, (readError, content) => {
                if (readError) {
                    response.writeHead(404).end('No se encontró el archivo.');
                    return;
                }
                response.writeHead(200, {
                    'Content-Type': MIME_TYPES[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
                    'X-Content-Type-Options': 'nosniff',
                    'Cache-Control': 'no-store'
                });
                if (request.method === 'HEAD') response.end();
                else response.end(content);
            });
        });
    });
}

function listen(port) {
    return new Promise((resolve, reject) => {
        const candidate = serveStaticFiles(path.join(app.getAppPath(), 'www'));
        candidate.once('error', reject);
        candidate.listen(port, HOST, () => {
            candidate.removeListener('error', reject);
            server = candidate;
            resolve(candidate.address().port);
        });
    });
}

async function startLocalServer() {
    const portFile = path.join(app.getPath('userData'), 'local-server-port');
    let port = DEFAULT_PORT;
    try {
        const saved = Number(fs.readFileSync(portFile, 'utf8'));
        if (Number.isInteger(saved) && saved >= 1024 && saved <= 65535) port = saved;
    } catch { /* Primera ejecución. */ }

    try {
        port = await listen(port);
    } catch (error) {
        if (error.code !== 'EADDRINUSE') throw error;
        for (let candidate = port + 1; candidate <= 65535; candidate++) {
            try {
                port = await listen(candidate);
                break;
            } catch (nextError) {
                if (nextError.code !== 'EADDRINUSE' || candidate === 65535) throw nextError;
            }
        }
    }
    fs.mkdirSync(path.dirname(portFile), { recursive: true });
    fs.writeFileSync(portFile, String(port), 'utf8');
    windowPrincipal = `http://${HOST}:${port}`;
    return windowPrincipal;
}

function createWindow(url) {
    const window = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 900,
        minHeight: 650,
        show: false,
        backgroundColor: '#f3f6f1',
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    window.removeMenu();
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => {
        if (!event.url.startsWith(url)) event.preventDefault();
    });
    window.once('ready-to-show', () => window.show());
    window.loadURL(url);
    return window;
}

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (windowPrincipal) {
            const openWindow = BrowserWindow.getAllWindows()[0];
            if (openWindow) {
                if (openWindow.isMinimized()) openWindow.restore();
                openWindow.focus();
            }
        }
    });

    app.whenReady().then(async () => {
        const url = await startLocalServer();
        windowPrincipal = url;
        createWindow(url);
    }).catch(error => {
        console.error('No se pudo abrir Suculenta Inmortal:', error);
        app.quit();
    });

    app.on('window-all-closed', () => app.quit());
    app.on('before-quit', () => server?.close());
}
