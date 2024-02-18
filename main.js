const {app, BrowserWindow, ipcMain, dialog} = require('electron/main')
const path = require('node:path')
const fs = require('fs')
const log = require('electron-log')

// 判断当前环境，修改dataDir路径
const isDev = process.env.isDev;
let dataDirPath
if (isDev === 'true') {
    dataDirPath = path.join(__dirname, 'data/')
} else {
    // 打包后data目录位于app.asar.unpacked下
    const asarName = path.basename(__dirname)
    const unpackedDir = path.join(path.join(__dirname, '..'), asarName + '.unpacked')
    dataDirPath = path.join(unpackedDir, 'data/')
}
const configDirPath = path.join(dataDirPath, 'config/')
const recordDirPath = path.join(dataDirPath, 'record/')
const logDirPath = path.join(dataDirPath, 'log/')


// 配置日志文件位置
// https://github.com/megahertz/electron-log/blob/master/docs/transports/file.md
log.transports.file.resolvePathFn = () => path.join(logDirPath, 'log')
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.console.useStyles = true

log.info('========== Persist app start ==========')

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

    ipcMain.on('getHabitConfig', (event, habitID) => {
        // 同步通信必须要设置回复内容
        event.returnValue = getHabitConfig(habitID)
    })

    ipcMain.on('setHabitConfig', (event, habitID, config) => {
        event.returnValue = setHabitConfig(habitID, config)
    })

    ipcMain.on('getHabitRecord', (event, habitID) => {
        event.returnValue = getHabitRecord(habitID)
    })

    ipcMain.on('setHabitRecord', (event, habitID, record) => {
        event.returnValue = setHabitRecord(habitID, record)
    })

    ipcMain.on('getHabitList', (event) => {
        event.returnValue = getHabitList()
    })

    // https://stackoverflow.com/questions/63827841/receive-data-sent-from-loadfile-to-html-page-in-electron
    ipcMain.on('openHabitWindow', (event, habitID) => {
        win.loadFile('habit.html', {
            query: {
                'habit': habitID
            },
        }).then()
    })

    ipcMain.on('openIndexWindow', (event) => {
        win.loadFile('index.html').then()
    })

    ipcMain.on('exportData', (event) => {
        event.returnValue = exportData(win)
    })

    ipcMain.on('getDeletedHabitList', (event) => {
        event.returnValue = getDeletedHabitList()
    })

    ipcMain.on('restoreDeletedFile', (event, fileUrl) => {
        event.returnValue = restoreDeletedFile(fileUrl)
    })

    ipcMain.on('deleteHabit', (event, habitID) => {
        event.returnValue = deleteHabit(habitID)
    })

    // 彻底删除习惯
    ipcMain.on('completelyDeleteHabit', (event, habitID) => {
        event.returnValue = completelyDeleteHabit(habitID)
    })

    ipcMain.on('restoreDeletedHabit', (event, habitID) => {
        event.returnValue = restoreDeletedHabit(habitID)
    })

    ipcMain.on('createHabit', (event, habitID, config, record) => {
        event.returnValue = createHabit(habitID, config, record)
    })
}

function getHabitConfig(habitID) {
    const filePath = path.join(configDirPath, habitID + '.json')
    return readJsonFile(filePath)
}

function setHabitConfig(habitID, config) {
    const filePath = path.join(configDirPath, habitID + '.json')
    return writeJsonFile(config, filePath)
}

function getHabitRecord(habitID) {
    const filePath = path.join(recordDirPath, habitID + '.json')
    return readJsonFile(filePath)
}

function setHabitRecord(habitID, record) {
    const filePath = path.join(recordDirPath, habitID + '.json')
    return writeJsonFile(record, filePath)
}

function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data)
    } catch (err) {
        log.error(err)
        return null
    }
}

function writeJsonFile(data, filePath) {
    const dataStr = JSON.stringify(data)
    try {
        // 同步写文件
        fs.writeFileSync(filePath, dataStr)
    } catch (err) {
        log.error(err)
        return false
    }
    return true
}

function softDeleteFile(filePath) {
    const fileName = path.basename(filePath)
    const renameFilePath = path.join(path.dirname(filePath), '.' + fileName)
    try {
        fs.renameSync(filePath, renameFilePath)
    } catch (err) {
        log.error(err)
        return false
    }
    return true
}

function hardDeleteFile(filePath) {
    try {
        fs.unlinkSync(filePath)
    } catch (err) {
        log.error(err)
        return false
    }
    return true
}

function isDeletedFile(fileName) {
    return fileName.startsWith('.')
}

function deleteHabit(habitId) {
    const configPath = path.join(configDirPath, habitId + '.json')
    const recordPath = path.join(recordDirPath, habitId + '.json')
    return softDeleteFile(configPath) && softDeleteFile(recordPath)
}

function completelyDeleteHabit(habitId) {
    const configPath = path.join(configDirPath, '.' + habitId + '.json')
    const recordPath = path.join(recordDirPath, '.' + habitId + '.json')
    return hardDeleteFile(configPath) && hardDeleteFile(recordPath)
}

function restoreDeletedHabit(habitId) {
    const configPath = path.join(configDirPath, '.' + habitId + '.json')
    const recordPath = path.join(recordDirPath, '.' + habitId + '.json')
    return restoreDeletedFile(configPath) && restoreDeletedFile(recordPath)
}

// isDeleted为true时获取已删除的文件列表
function getHabitList(isDeleted = false) {
    const pwd = path.join(dataDirPath, 'config')
    const habitConfigList = []
    try {
        const files = fs.readdirSync(pwd)
        files.forEach(file => {
            const filePath = path.join(pwd, file)
            // 使用 fs.statSync 获取文件信息
            const stats = fs.statSync(filePath)
            if (!stats.isFile()) {
                return
            }
            if (isDeleted) {
                if (isDeletedFile(file)) {
                    try {
                        const jsonData = fs.readFileSync(filePath, 'utf-8');
                        const jsonObject = JSON.parse(jsonData);
                        habitConfigList.push(jsonObject)
                    } catch (jsonErr) {
                        log.error(`Error parsing JSON file ${file}:`, jsonErr);
                    }
                }
            } else {
                if (!isDeletedFile(file)) {
                    try {
                        const jsonData = fs.readFileSync(filePath, 'utf-8');
                        const jsonObject = JSON.parse(jsonData);
                        habitConfigList.push(jsonObject)
                    } catch (jsonErr) {
                        log.error(`Error parsing JSON file ${file}:`, jsonErr);
                    }
                }
            }
        })
    } catch (err) {
        log.error('Error reading directory:', err)
        return err
    }

    return habitConfigList
}

function getDeletedHabitList() {
    return getHabitList(true)
}

function restoreDeletedFile(filePath) {
    const newFileName = path.basename(filePath).replace(/^\./, '')
    const renameFilePath = path.join(path.dirname(filePath), newFileName)
    try {
        fs.renameSync(filePath, renameFilePath)
    } catch (err) {
        log.error(err)
        return false
    }
    return true
}

function createHabit(habitID, config, record) {
    let success = setHabitConfig(habitID, config)
    if (!success) {
        log.error('setHabitConfig failed, habitID: ', habitID)
        return false
    }
    success = setHabitRecord(habitID, record)
    if (!success) {
        log.error('setHabitRecord failed, habitID: ', habitID)
        return false
    }
    return true
}

function exportData(window) {
    const options = {
        title: '选择导出文件位置',
        defaultPath: '~/Downloads/Persist_Backup',
        filters: [
            {name: '所有文件', extensions: ['*']}
        ]
    }
    try {
        const userSelectedPath = dialog.showSaveDialogSync(window, options)
        if (userSelectedPath) {
            if (!fs.existsSync(userSelectedPath)) {
                fs.mkdirSync(path.join(userSelectedPath, 'config/'), {recursive: true})
                fs.mkdirSync(path.join(userSelectedPath, 'record/'), {recursive: true})
            }
            // 遍历复制所有文件
            const configFiles = fs.readdirSync(configDirPath)
            configFiles.forEach((file) => {
                fs.copyFileSync(path.join(configDirPath, file), path.join(userSelectedPath, 'config/', file))
            })
            const recordFiles = fs.readdirSync(recordDirPath)
            recordFiles.forEach((file) => {
                fs.copyFileSync(path.join(recordDirPath, file), path.join(userSelectedPath, 'record/', file))
            })
            log.info('导出文件成功：', userSelectedPath)
        } else {
            log.info('用户取消导出文件')
        }
        return true
    } catch (err) {
        log.error('导出文件失败, error: ', err)
        return false
    }
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
    log.info('========== Persist app quit ==========')
    app.quit()
})
