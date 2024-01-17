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
    habitConfigListOrErr.forEach(config => {
        const cardHTML = `
             <div class="col">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${config.title}</h5>
                        <p class="card-text">${config.description}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-outline-primary float-end" name="toggleHabit" value="${config.id}">进入</button>
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