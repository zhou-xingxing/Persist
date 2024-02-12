import {drawHeatMap} from './heatmap.js'
import {getDateString, getNowDate} from './common.js'
import {TEXT_CONTENT} from "./const.js";


let habit = null


$(document).ready(function () {
    loadHabitList()
    if (habit == null) {
        // 第一次加载页面使用传入的参数habit
        const initHabit = getInitHabit()
        toggleHabit(initHabit)
    }
    loadContent()
})

function loadHabitList() {
    $('#habitListBody').empty()
    const habitConfigListOrErr = window.electronAPI.getHabitList()
    if (habitConfigListOrErr instanceof Error) {
        console.error("get habit list error:", habitConfigListOrErr)
        return
    }
    habitConfigListOrErr.sort(function (a, b) {
        return b.createTime - a.createTime
    })
    habitConfigListOrErr.forEach(config => {
        const cardHTML = `
            <div class="card" style="margin:0 15px 30px 15px">
            <div class="card-body">
                <h5 class="card-title">${config.title}</h5>
                <p class="card-text">${config.description}</p>
                <button class="btn btn-outline-primary float-end" name="toggleHabit" value="${config.id}">切换</button>
            </div>
        </div>
        `
        $('#habitListBody').append(cardHTML)
    })
    // 这个监听事件要写在里面，需等到元素被添加到HTML页面后再添加事件
    $('[name="toggleHabit"]').click(function () {
        toggleHabit($(this).val())
        loadContent()
    })
}

function getInitHabit() {
    const params = new URLSearchParams(location.search)
    const habit = params.get('habit')
    if (habit == null) {
        console.log('habit param is null')
    }
    return habit
}

function toggleHabit(newHabit) {
    habit = newHabit
}

function loadContent() {
    loadData()
    pagePreprocess()
    drawHeatMap(habit)
}


function loadData() {
    const nowDate = getNowDate()
    let recordData = window.electronAPI.getHabitRecord(habit)
    // 数据为空则新建打卡记录文件
    if (recordData == null) {
        recordData = [[nowDate, 0]]
        const success = window.electronAPI.setHabitRecord(habit, recordData)
        if (!success) {
            console.error('setHabitRecord failed, habitID: ', habit)
            alert(TEXT_CONTENT.SYSTEM_ERROR)
        }
    } else {
        // 检查是否有今日数据
        if (recordData[recordData.length - 1][0] !== nowDate) {
            recordData.push([nowDate, 0])
            const success = window.electronAPI.setHabitRecord(habit, recordData)
            if (!success) {
                console.error('setHabitRecord failed, habitID: ', habit)
                alert(TEXT_CONTENT.SYSTEM_ERROR)
            }
        }
    }
}

function pagePreprocess() {
    const config = window.electronAPI.getHabitConfig(habit)
    $('#dateRange').val(config.display.dateRangeType)
    $('#theme').val(config.display.theme)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    $('#datepicker').attr('max', getDateString(yesterday))
    if (config.type === 'Count') {
        $('#historyCheckCount').css('display', 'block')
    } else {
        $('#historyCheckCount').css('display', 'none')
    }
    resetAllButton()
}

function resetAllButton() {
    $('#checkIn').text('今日打卡')
    $('#reset').text('重置今日')
    $('#historyCheck').text('补打卡')
}


$('#checkIn').click(function () {
    // 这里要读最新的
    const config = window.electronAPI.getHabitConfig(habit)
    let recordData = window.electronAPI.getHabitRecord(habit)
    if (config.type === 'Count') {
        // 计数型打卡
        recordData[recordData.length - 1][1] += 1
        const success = window.electronAPI.setHabitRecord(habit, recordData)
        if (!success) {
            console.error('setHabitRecord failed, habitID: ', habit)
            alert(TEXT_CONTENT.SYSTEM_ERROR)
            return
        }
        drawHeatMap(habit)
        $(this).text('今日打卡次数: ' + recordData[recordData.length - 1][1])
    } else {
        if (recordData[recordData.length - 1][1] === 0) {
            recordData[recordData.length - 1][1] += 1
        } else {
            alert('今天已经打过卡啦~')
            return
        }
        const success = window.electronAPI.setHabitRecord(habit, recordData)
        if (!success) {
            console.error('setHabitRecord failed, habitID: ', habit)
            alert(TEXT_CONTENT.SYSTEM_ERROR)
            return
        }
        drawHeatMap(habit)
        $(this).text('打卡成功')
    }
})

$('#reset').click(function () {
    // 这里要读最新的
    const config = window.electronAPI.getHabitConfig(habit)
    let recordData = window.electronAPI.getHabitRecord(habit)
    if (recordData[recordData.length - 1][1] === 0) {
        alert('不需要再重置了哦~')
        return
    }
    recordData[recordData.length - 1][1] = 0
    const success = window.electronAPI.setHabitRecord(habit, recordData)
    if (!success) {
        console.error('setHabitRecord failed, habitID: ', habit)
        alert(TEXT_CONTENT.SYSTEM_ERROR)
        return
    }
    drawHeatMap(habit)
    $(this).text('重置成功')
    $('#checkIn').text('今日打卡')
})

$('#historyCheck').click(function () {
    $('#datepicker').val(null)
    $('#historyCheckCountInput').val(0)
})

$('#historyCheckConfirm').click(function () {
    const selectDateStr = $('#datepicker').val()
    if (selectDateStr === '' || selectDateStr === null || selectDateStr === undefined) {
        alert('请选择一个日期~')
        return
    }
    const config = window.electronAPI.getHabitConfig(habit)
    let recordData = window.electronAPI.getHabitRecord(habit)
    let count = 1
    if (config.type === 'Count') {
        count = Number($('#historyCheckCountInput').val())
        if (isNaN(Number(count)) || Number(count) <= 0) {
            alert('请输入一个合法数字~')
            return
        }
    }

    let flag = false
    for (let i = recordData.length - 1; i >= 0; i--) {
        if (recordData[i][0] === selectDateStr) {
            flag = true
            if (config.type === 'CheckIn' && recordData[i][1] > 0) {
                alert('这一天已经打过卡了呦~')
                return
            }
            recordData[i][1] += count
            break
        }
    }
    if (flag === false) {
        recordData.unshift([selectDateStr, count])
    }
    const success = window.electronAPI.setHabitRecord(habit, recordData)
    if (!success) {
        console.error('setHabitRecord failed, habitID: ', habit)
        alert(TEXT_CONTENT.SYSTEM_ERROR)
        return
    }
    drawHeatMap(habit)
    alert('补卡成功!')
    $('#historySelect').modal('hide')
})


$('#dateRange').change(function () {
    const selected = $(this).val()
    let config = window.electronAPI.getHabitConfig(habit)
    config.display.dateRangeType = selected
    const success = window.electronAPI.setHabitConfig(habit, config)
    if (!success) {
        console.error('setHabitConfig failed, habitID: ', habit)
        alert(TEXT_CONTENT.SYSTEM_ERROR)
        return
    }
    drawHeatMap(habit)
})

$('#theme').change(function () {
    const selected = $(this).val()
    let config = window.electronAPI.getHabitConfig(habit)
    config.display.theme = selected
    const success = window.electronAPI.setHabitConfig(habit, config)
    if (!success) {
        console.error('setHabitConfig failed, habitID: ', habit)
        alert(TEXT_CONTENT.SYSTEM_ERROR)
        return
    }
    drawHeatMap(habit)
})

$('#returnToIndex').click(function () {
    window.electronAPI.openIndexWindow()
})