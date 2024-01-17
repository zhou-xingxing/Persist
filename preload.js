const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    writeJsonFile: (data, fileUrl) => {
        // 同步通信，必须要在主进程里设置回复
        return ipcRenderer.sendSync('writeJsonFile', data, fileUrl)
    },
    getHabitList: () => {
        return ipcRenderer.sendSync('getHabitList')
    }
})