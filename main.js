const {app, BrowserWindow, ipcMain} = require('electron/main')
const path = require('node:path')
const fs = require('fs')

function createMainWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true
        }
    })

    win.loadFile('index.html').then()

    ipcMain.on('writeJsonFile', (event, data, fileUrl) => {
        // 同步通信必须要设置回复内容
        event.returnValue = writeJsonFile(data, fileUrl)
    })
    ipcMain.on('getHabitList', (event) => {
        event.returnValue = getHabitList()
    })

    // https://stackoverflow.com/questions/63827841/receive-data-sent-from-loadfile-to-html-page-in-electron
    ipcMain.on('openHabitWindow', (event, habitID) => {
        // createMainWindow(habitID)
        win.loadFile('habit.html', {
            query: {
                'habit': habitID
            },
        }).then()
    })
}

function writeJsonFile(data, fileUrl) {
    const dataStr = JSON.stringify(data)
    const dataPath = path.join(__dirname, fileUrl)
    try {
        // 同步写文件
        fs.writeFileSync(dataPath, dataStr)
    } catch (err) {
        console.error(err)
        return err
    }
    return null
}

function getHabitList() {
    const configFilePath = '/data/config'
    const pwd = __dirname + configFilePath
    const habitConfigList = []
    try {
        const files = fs.readdirSync(pwd)
        files.forEach(file => {
            const filePath = path.join(pwd, file)
            // 使用 fs.statSync 获取文件信息
            const stats = fs.statSync(filePath)
            if (stats.isFile()) {
                try {
                    const jsonData = fs.readFileSync(filePath, 'utf-8');
                    const jsonObject = JSON.parse(jsonData);
                    habitConfigList.push(jsonObject)
                } catch (jsonErr) {
                    console.error(`Error parsing JSON file ${file}:`, jsonErr);
                }
            }
        })
    } catch (err) {
        console.error('Error reading directory:', err)
        return err
    }

    return habitConfigList
}

app.whenReady().then(() => {
    createMainWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})

app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
    app.exit()
})
