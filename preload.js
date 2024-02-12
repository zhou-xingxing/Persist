const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openHabitWindow: (habitID) => {
        ipcRenderer.send('openHabitWindow', habitID)
    },
    openIndexWindow: () => {
        ipcRenderer.send('openIndexWindow')
    },


    getHabitConfig: (habitID) => {
        return ipcRenderer.sendSync('getHabitConfig', habitID)
    },
    getHabitRecord: (habitID) => {
        return ipcRenderer.sendSync('getHabitRecord', habitID)
    },
    setHabitConfig: (habitID, config) => {
        return ipcRenderer.sendSync('setHabitConfig', habitID, config)
    },
    setHabitRecord: (habitID, record) => {
        return ipcRenderer.sendSync('setHabitRecord', habitID, record)
    },
    deleteHabit: (habitID) => {
        return ipcRenderer.sendSync('deleteHabit', habitID)
    },
    restoreDeletedHabit: (habitID) => {
        return ipcRenderer.sendSync('restoreDeletedHabit', habitID)
    },
    createHabit: (habitID, config, record) => {
        return ipcRenderer.sendSync('createHabit', habitID, config, record)
    },


    getHabitList: () => {
        return ipcRenderer.sendSync('getHabitList')
    },
    getDeletedHabitList: () => {
        return ipcRenderer.sendSync('getDeletedHabitList')
    },

    exportData: () => {
        return ipcRenderer.sendSync('exportData')
    }
})