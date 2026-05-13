// 設定初始日期
const dateEl = document.getElementById('current-date');
const now = new Date();
dateEl.textContent = `${now.getFullYear()} / ${now.getMonth() + 1} / ${now.getDate()}`;

let selectedMood = '😊';

// 心情選擇邏輯
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.mood-btn.active').classList.remove('active');
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
    });
});

// 儲存日記
const saveBtn = document.getElementById('save-btn');
const inputArea = document.getElementById('diary-input');
const diaryList = document.getElementById('diary-list');

saveBtn.addEventListener('click', () => {
    const text = inputArea.value.trim();
    if (!text) return alert('請寫點東西再保存唷！');

    const diaryEntry = {
        id: Date.now(),
        date: dateEl.textContent,
        content: text,
        mood: selectedMood
    };

    saveToLocal(diaryEntry);
    inputArea.value = '';
    renderDiaries();
});

function saveToLocal(entry) {
    const diaries = JSON.parse(localStorage.getItem('myDiaries') || '[]');
    diaries.unshift(entry); // 最新的放在最前面
    localStorage.setItem('myDiaries', JSON.stringify(diaries));
}

function renderDiaries() {
    const diaries = JSON.parse(localStorage.getItem('myDiaries') || '[]');
    diaryList.innerHTML = diaries.map(item => `
        <div class="diary-card">
            <div class="date-tag">${item.date} ${item.mood}</div>
            <p>${item.content}</p>
        </div>
    `).join('');
}

// 初始讀取
renderDiaries();