import {generateUUID, getNowDate} from "./common.js";
import {TEXT_CONTENT} from "./const.js";

const DEFAULT_THEME = 'green'
const DEFAULT_DATA_RANGE_TYPE = 'six-month'


$(document).ready(function () {
    loadHabitList()
})

function loadHabitList() {
    $('#habitList').empty()
    const habitConfigListOrErr = window.electronAPI.getHabitList()
    if (habitConfigListOrErr instanceof Error) {
        console.error("get habit list error:", habitConfigListOrErr)
        return
    }
    // 按创建时间排序
    habitConfigListOrErr.sort(function (a, b) {
        return b.createTime - a.createTime
    })
    habitConfigListOrErr.forEach(config => {
        const cardHTML = `
             <div class="col">
                <div class="card h-100">
                    <div class="card-body">
                        <span class="text-danger float-end" role="button" name="deleteHabit" value="${config.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </span>
                        <h5 class="card-title">${config.title}</h5>
                        <p class="card-text">${config.description}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-outline-primary float-end btn-sm" name="toggleHabit" value="${config.id}">进入</button>
                    </div>
                </div>
            </div>
        `
        $('#habitList').append(cardHTML)
    })
    // 这个监听事件要写在里面，需等到元素被添加到HTML页面后再添加事件
    $('[name="toggleHabit"]').click(function () {
        const habitID = $(this).val()
        window.electronAPI.openHabitWindow(habitID)
    })
    // 监听删除按钮
    $('[name=deleteHabit]').click(function () {
        // 使用 confirm 函数显示确认对话框
        const isConfirmed = confirm('确认要删除吗？\n 后续可以在回收站中找回')
        if (isConfirmed) {
            const habitID = $(this).attr('value')
            const success = window.electronAPI.deleteHabit(habitID)
            if (!success) {
                console.error('delete habit failed, habitID:', habitID)
                alert(TEXT_CONTENT.SYSTEM_ERROR)
                return
            }
            loadHabitList()
        }
    })
}

$('#newHabitButton').click(function () {
    //清空模态框所有内容
    $('#newHabitTitle').val(null)
    $('#newHabitType').val('CheckIn')
    $('#newHabitCountSettings').css('display', 'none')
    $('#newHabitCountMax').val(null)
    $('#newHabitSplitNum').val(null)
    $('#newHabitDescription').val(null)
})

$('#newHabitType').on('change', function () {
    const selectedValue = $(this).val()
    if (selectedValue === 'Count') {
        $('#newHabitCountSettings').css('display', 'block')
    } else {
        $('#newHabitCountSettings').css('display', 'none')
    }
})

$('#newHabitConfirm').click(function () {
    const title = $('#newHabitTitle').val().trim()
    if (title.length === 0) {
        alert('新习惯的名称不能为空哦~')
        return
    }
    const type = $('#newHabitType').val()
    let maxV, splitNum
    if (type === 'Count') {
        maxV = Number($('#newHabitCountMax').val())
        if (isNaN(Number(maxV)) || Number(maxV) <= 0) {
            alert('打卡次数上限应该是一个合法数字~')
            return
        }
        splitNum = Number($('#newHabitSplitNum').val())
        if (isNaN(Number(splitNum)) || Number(splitNum) <= 0) {
            alert('打卡次数分级应该是一个合法数字~')
            return
        }
    }
    const description = $('#newHabitDescription').val()
    const id = generateUUID()
    const createTime = new Date().getTime() / 1000
    let config
    if (type === 'Count') {
        config = {
            'id': id,
            'title': title,
            'description': description,
            'createTime': createTime,
            'type': type,
            'display': {
                'theme': DEFAULT_THEME,
                'dateRangeType': DEFAULT_DATA_RANGE_TYPE,
                'firstDay': 1,
                'max': maxV,
                'splitNumber': splitNum
            }
        }
    } else {
        config = {
            'id': id,
            'title': title,
            'description': description,
            'createTime': createTime,
            'type': type,
            'display': {
                'theme': DEFAULT_THEME,
                'dateRangeType': DEFAULT_DATA_RANGE_TYPE,
                'firstDay': 1
            }
        }
    }

    const nowDate = getNowDate()
    const recordData = [[nowDate, 0]]
    const success = window.electronAPI.createHabit(id, config, recordData)
    if (!success) {
        console.error('create habit failed, habitID: ', id)
        alert(TEXT_CONTENT.SYSTEM_ERROR)
        return
    }
    alert('新习惯创建成功!')
    $('#newHabitModal').modal('hide')
    // 刷新习惯列表
    loadHabitList()
})

$('#openTrashButton').click(function () {
    $('#deletedHabitListBody').empty()
    const deletedHabitListOrErr = window.electronAPI.getDeletedHabitList()
    if (deletedHabitListOrErr instanceof Error) {
        console.error("get deleted habit list error: ", deletedHabitListOrErr)
        return
    }
    deletedHabitListOrErr.sort(function (a, b) {
        return b.createTime - a.createTime
    })
    deletedHabitListOrErr.forEach(config => {
        const cardHTML = `
            <div class="card" style="margin:0 15px 30px 15px">
            <div class="card-body">
                <h5 class="card-title">${config.title}</h5>
                <p class="card-text">${config.description}</p>
                <button class="btn btn-outline-primary float-end" name="restoreDeletedHabit" value="${config.id}">恢复</button>
                <button class="btn btn-outline-danger float-end" name="completelyDeleteHabit" value="${config.id}" style="margin-right: 15px">彻底删除</button>
            </div>
        </div>
        `
        $('#deletedHabitListBody').append(cardHTML)
    })
    $('[name=restoreDeletedHabit]').click(function () {
        const isConfirmed = confirm('确定要恢复吗？')
        if (!isConfirmed) {
            return
        }
        const deletedHabitId = $(this).val()
        const success = window.electronAPI.restoreDeletedHabit(deletedHabitId)
        if (!success) {
            console.error("restore deleted habit failed, habitID: ", deletedHabitId)
            alert(TEXT_CONTENT.SYSTEM_ERROR)
            return
        }
        $(this).parent().parent().remove()
        loadHabitList()
    })
    $('[name=completelyDeleteHabit]').click(function () {
        const isConfirmed = confirm('确定要彻底删除吗？\n此操作将无法恢复！')
        if (!isConfirmed) {
            return
        }
        const deletedHabitId = $(this).val()
        const success = window.electronAPI.completelyDeleteHabit(deletedHabitId)
        if (!success) {
            console.error("completely delete habit failed, habitID: ", deletedHabitId)
            alert(TEXT_CONTENT.SYSTEM_ERROR)
            return
        }
        $(this).parent().parent().remove()
    })
})

$('#exportData').click(function () {
    if (!window.electronAPI.exportData()) {
        console.error("export data failed")
        alert(TEXT_CONTENT.SYSTEM_ERROR)
    }
})