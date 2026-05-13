import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 保持與 index.html 相同的 config
const firebaseConfig = {
    apiKey: "AIzaSyBnIewx3yXluFsQaCXcFNryUA7h89h4jdU",
    authDomain: "my-diary-app-7c624.firebaseapp.com",
    projectId: "my-diary-app-7c624",
    storageBucket: "my-diary-app-7c624.firebasestorage.app",
    messagingSenderId: "105338607953",
    appId: "1:105338607953:web:8b9cfbab951990195c5b70"
    measurementId: "G-0WV7HVJZ9W"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// 監聽登入狀態並載入雲端日記
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("正在從雲端載入日記...");
        await loadDiariesFromCloud();
    } else {
        currentUser = null;
        document.getElementById('diary-list').innerHTML = '';
    }
});

// 儲存日記到雲端
async function saveDiaryToCloud(diaryData) {
    if (!currentUser) return;
    try {
        // 使用時間戳記作為文件 ID，確保唯一性
        const diaryId = Date.now().toString();
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), {
            ...diaryData,
            userId: currentUser.uid,
            createdAt: new Date()
        });
        console.log("雲端同步成功！");
    } catch (e) {
        console.error("同步失敗:", e);
    }
}

// 從雲端抓取所有日記
async function loadDiariesFromCloud() {
    const diaryList = document.getElementById('diary-list');
    diaryList.innerHTML = '<p style="text-align:center;">載入中...</p>';
    
    try {
        const q = query(
            collection(db, "users", currentUser.uid, "diaries"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        diaryList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            renderDiaryItem(data);
        });
    } catch (e) {
        console.error("讀取失敗:", e);
        diaryList.innerHTML = '<p>暫無雲端紀錄</p>';
    }
}

// 渲染日記畫面的小工具 (把原本 main.js 的顯示邏輯搬過來)
function renderDiaryItem(data) {
    const diaryList = document.getElementById('diary-list');
    const div = document.createElement('div');
    div.className = 'diary-card item';
    div.innerHTML = `
        <div class="date">${data.date} ${data.mood}</div>
        <div class="content">${data.content}</div>
    `;
    diaryList.appendChild(div);
}

// 攔截原本的 Save 按鈕
document.getElementById('save-btn').addEventListener('click', async () => {
    const content = document.getElementById('diary-input').value;
    const mood = document.querySelector('.mood-btn.active').dataset.mood;
    const date = new Date().toLocaleDateString();

    if (!content) return alert("寫點什麼吧！");

    const diaryData = { content, mood, date };
    
    // 1. 先顯示在畫面上
    renderDiaryItem(diaryData);
    // 2. 存到雲端
    await saveDiaryToCloud(diaryData);
    
    document.getElementById('diary-input').value = '';
});