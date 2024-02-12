// Date类型转换为固定类型日期字符串
export function getDateString(originDate) {
    let month = originDate.getMonth() + 1
    let strDate = originDate.getDate()
    const seperator = '-'
    if (month >= 1 && month <= 9) {
        month = '0' + month
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = '0' + strDate
    }
    return originDate.getFullYear() + seperator + month + seperator + strDate
}

export function getNowDate() {
    const date = new Date()
    return getDateString(date)
}

// 返回位于[start,end]范围内的日期字符串
export function getDateRange(startDateStr, endDateStr) {
    let date_all = []
    const startDate = new Date(startDateStr)
    startDate.setHours(0)
    const endDate = new Date(endDateStr)
    endDate.setHours(0)
    while ((endDate.getTime() - startDate.getTime()) >= 0) {
        date_all.push(getDateString(startDate))
        startDate.setDate(startDate.getDate() + 1)
    }
    return date_all
}

// 返回给定日期所在周的周一和周日的日期字符串
export function getMondayAndSunday(date) {
    // 一天里一共的毫秒数
    const oneDayTime = 1000 * 60 * 60 * 24
    // 若那一天是周末时，则强制赋值为7
    const day = date.getDay() || 7
    const startDate = new Date(date.getTime() - oneDayTime * (day - 1))
    const endDate = new Date(date.getTime() + oneDayTime * (7 - day))
    return [startDate, endDate]
}

// 生成UUID
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 比较日期字符串的大小
export function compareDateStr(dateStr1, dateStr2) {
    const date1 = new Date(dateStr1)
    const date2 = new Date(dateStr2)
    // 返回正数表示date1大于date2，返回0表示date1等于date2，返回负数表示date1小于date2
    return date1.getTime() - date2.getTime()
}

// 在给定的日期数组中二分查找记录的位置
export function binSearchRecord(recordArray, dateStr) {
    let low = 0
    let high = recordArray.length - 1
    while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        if (compareDateStr(recordArray[mid][0], dateStr) === 0) {
            return mid
        } else if (compareDateStr(recordArray[mid][0], dateStr) < 0) {
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return -1
}

// 在给定的日期数组中二分查找插入记录的位置
export function binSearchInsertRecord(recordArray, dateStr) {
    let low = 0
    let high = recordArray.length - 1
    while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        if (compareDateStr(recordArray[mid][0], dateStr) === 0) {
            return mid
        } else if (compareDateStr(recordArray[mid][0], dateStr) < 0) {
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return low
}