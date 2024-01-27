const {app, BrowserWindow, ipcMain} = require('electron/main')
const path = require('node:path')
const fs = require('fs')

// 判断当前环境，修改dataDir路径
const isDev = process.env.isDev;
let dataDirPath
if (isDev === 'true') {
    dataDirPath = path.join(__dirname, 'data/')
} else {
    // 打包后data目录位于app.asar.unpacked下
    const asarName = path.basename(__dirname)
    const unpackedDir = path.join(path.join(__dirname, '..'), asarName+'.unpacked')
    dataDirPath = path.join(unpackedDir, 'data/')
}

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

    ipcMain.on('readJsonFile', (event, fileUrl) => {
        event.returnValue = readJsonFile(fileUrl)
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

    ipcMain.on('openIndexWindow', (event) => {
        win.loadFile('index.html').then()
    })

    ipcMain.on('deleteFile', (event, fileUrl) => {
        event.returnValue = deleteFile(fileUrl)
    })
}

function writeJsonFile(data, fileUrl) {
    const dataStr = JSON.stringify(data)
    const filePath = path.join(dataDirPath, fileUrl)
    try {
        // 同步写文件
        fs.writeFileSync(filePath, dataStr)
    } catch (err) {
        console.error(err)
        return err
    }
    return null
}

function readJsonFile(fileUrl) {
    const filePath = path.join(dataDirPath, fileUrl)
    try {
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data)
    } catch (err) {
        console.error(err)
        return err
    }
}

function deleteFile(fileUrl) {
    const filePath = path.join(dataDirPath, fileUrl)
    try {
        fs.unlinkSync(filePath)
    } catch (err) {
        console.error(err)
        return err
    }
    return null
}

function getHabitList() {
    const pwd = path.join(dataDirPath, 'config')
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
