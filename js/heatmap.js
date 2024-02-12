import {getDateString, getMondayAndSunday} from './common.js'
import {ENUM_DATE_RANGE, THEME_MAP, THEME_RGB_MAP} from './const.js'

let myChart

export function drawHeatMap(habit) {
    const recordData = window.electronAPI.getHabitRecord(habit)
    if (recordData == null) {
        console.warn('draw from recordData==null, habit: ', habit)
        return
    }
    const config = window.electronAPI.getHabitConfig(habit)
    if (config == null) {
        console.warn('draw from config==null, habit: ', habit)
        return
    }
    const option = buildOption(recordData, config)
    if (myChart != null && myChart !== '' && myChart !== undefined) {
        myChart.dispose()
    }
    myChart = echarts.init(document.getElementById('heatmap'))
    // 监听窗口变化，图表响应
    window.addEventListener('resize', function () {
        myChart.resize()
    })
    myChart.setOption(option)
}

function getDateRangeOption(config) {
    const dateRangeType = config.display.dateRangeType
    const nowDate = new Date()
    Date.prototype.clone = function () {
        return new Date(this.valueOf())
    }
    // 这里是深拷贝
    const startDate = nowDate.clone()
    switch (dateRangeType) {
        case ENUM_DATE_RANGE.TWELVE_MONTH: {
            startDate.setMonth(nowDate.getMonth() - 12)
            break
        }
        case ENUM_DATE_RANGE.SIX_MONTH: {
            startDate.setMonth(nowDate.getMonth() - 6)
            break
        }
        case ENUM_DATE_RANGE.THREE_MONTH: {
            startDate.setMonth(nowDate.getMonth() - 3)
            break
        }
    }
    // 找到起始日所在的完整的周
    const startMonday = getMondayAndSunday(startDate)[0]
    const nowSunday = getMondayAndSunday(nowDate)[1]

    const startMondayStr = getDateString(startMonday)
    const nowSundayStr = getDateString(nowSunday)
    return [startMondayStr, nowSundayStr]
}

function getCheckInColor(config) {
    const color = THEME_MAP.get(config.display.theme)
    if (color == null) {
        return ['#ffffff', '#1d953f']
    } else {
        return ['#ffffff', color]
    }
}

// 计数型活动自定义分段
function getPiecesOption(config) {
    if (config.type !== 'Count') {
        return
    }
    const piecesOption = []
    const min = 1
    const max = config.display.max
    const splitNum = config.display.splitNumber

    // 边界值数组
    const numArray = []
    for (let i = 1; i <= splitNum; i++) {
        numArray.push((max - min) * i / Number(splitNum) + min)
    }

    // 透明度数组
    const alphaArray = []
    for (let i = 1; i <= splitNum + 1; i++) {
        alphaArray.push(i / Number(splitNum + 1))
    }

    let rgb = THEME_RGB_MAP.get(config.display.theme)
    if (rgb == null) {
        rgb = [29, 149, 63]
    }
    // 颜色数组
    const colorArray = []
    for (const alpha of alphaArray) {
        const red = rgb[0]
        const green = rgb[1]
        const blue = rgb[2]
        const color = `rgb(${red},${green},${blue},${alpha})`
        colorArray.push(color)
    }
    let leftBound = min
    let rightBound
    for (let i = 0; i < splitNum; i++) {
        rightBound = numArray[i]
        piecesOption.push({
            'min': leftBound,
            'max': rightBound,
            'color': colorArray[i]
        })
        leftBound = rightBound
    }
    // >max的样式
    piecesOption.push({
        'min': numArray[numArray.length - 1],
        'color': colorArray[colorArray.length - 1]
    })

    return piecesOption
}

function buildOption(calendarData, config) {
    const dateRangeOption = getDateRangeOption(config)
    const piecesOption = getPiecesOption(config)

    // 默认计数型活动
    const option = {
        // 标题
        title: {
            top: 10,
            left: 'center',
            text: config.title
        },
        tooltip: {
            triggerOn: 'mousemove',
        },
        visualMap: {
            // 数值到视觉的映射方式：离散型
            type: 'piecewise',
            // 样例样式
            left: 'center',
            top: '20%',
            showLabel: true,
            // 样例方向
            orient: 'horizontal',
            // 样例文字模板
            formatter: '{value} ~ {value2}',
            selectedMode: 'multiple',
            // itemSymbol: 'circle',
            // 自定义分段
            pieces: piecesOption,
            // 将data的哪一列数据映射到视觉元素
            dimension: 1,
            inRange: {}
        },
        calendar: {
            top: 100,
            left: 20,
            right: 5,
            // 日历格大小[宽, 高]
            cellSize: [20, 20],
            // 支持区间
            range: dateRangeOption,
            itemStyle: {
                borderColor: '#d7d3d3',
                borderWidth: 1,
            },
            orient: 'horizontal',
            yearLabel: {show: false},
            dayLabel: {
                firstDay: config.display.firstDay,
                margin: 5,
            }
        },
        series: {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: calendarData,
            tooltip: {
                formatter: function (params) {
                    if (params.data[1] === 0) {
                        return
                    }
                    return `${params.data[0]}<br>打卡次数：${params.data[1]}`
                }
            }
        }
    }
    // 打卡型活动
    if (config.type === 'CheckIn') {
        const colorOption = getCheckInColor(config)
        option.visualMap.show = false
        option.visualMap.categories = [0, 1]
        option.visualMap.inRange.color = {
            0: colorOption[0],
            1: colorOption[1]
        }
        option.series.tooltip.formatter = function (params) {
            if (params.data[1] === 0) {
                return
            }
            return `${params.data[0]}<br>已打卡`
        }
    }
    return option
}