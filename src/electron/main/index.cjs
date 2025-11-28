const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'index.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
        win.loadURL('http://localhost:5173')
    } else {
        win.loadFile(path.join(__dirname, '..', '..', '..', 'dist', 'index.html'))
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] })
    if (canceled || filePaths.length === 0) return null
    return filePaths[0]
})

ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (canceled || filePaths.length === 0) return null
    return filePaths[0]
})
try {
    const ffmpegHandlers = require(path.join(__dirname, 'ffmpeg.cjs'))
    if (ffmpegHandlers && typeof ffmpegHandlers.register === 'function') ffmpegHandlers.register(ipcMain)
} catch (e) {
    console.error('Failed to register ffmpeg handlers:', e && e.message ? e.message : e)
}
