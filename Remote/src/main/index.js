import { app, shell, BrowserWindow, ipcMain, desktopCapturer, screen, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const robot = require('robotjs')

let displays
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    displays = screen.getAllDisplays()

    mainWindow.show()
    mainWindow.setPosition(0, 0)

    desktopCapturer
      .getSources({
        types: ['screen']
        // types: ['window', 'screen']
      })
      .then((sources) => {
        console.log(sources)
      })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  // IPC test
  ipcMain.on('KEY_PRESS', (event, data) => {
    console.log('keyTap')
    robot.keyTap(data)
  })
  ipcMain.on('MOUSE_CLICK', (event, data) => {
    console.log('mouseClick')

    robot.mouseClick('left', false) // true means double-click
  })
  ipcMain.on('MOUSE_MOVE', (event, data) => {
    console.log('mouseMove')

    robot.moveMouse(data.hostX, data.hostY)
  })

  ipcMain.handle('GET_SCREEN_SOURCE', () => {
    return new Promise(async (resolve) => {
      const resource = await desktopCapturer.getSources({
        types: ['screen', 'window', 'audio', 'tab']
      })

      if (resource && resource.length) {
        for (let index in resource) {
          const item = resource[index]

          try {
            const screenshot = item.thumbnail.toDataURL()

            item.screenshot = screenshot
          } catch (error) {
            console.log(error)
          }
        }
      }

      resolve(resource)
    })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.