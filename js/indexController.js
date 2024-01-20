import {generateUUID, getConfigUrl} from "./common.js";
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
}

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
    const configUrl = getConfigUrl(id)
    const err = window.electronAPI.writeJsonFile(config, configUrl)
    if (err != null) {
        console.log(err)
        alert(TEXT_CONTENT.SYSTEM_ERROR)
    } else {
        alert('新习惯创建成功')
        $('#newHabitModal').modal('hide')
        // 刷新习惯列表
        loadHabitList()
    }
})