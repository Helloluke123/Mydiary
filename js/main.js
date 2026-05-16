import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBnIewx3yXluFsQaCXcFNryUA7h89h4jdU",
    authDomain: "my-diary-app-7c624.firebaseapp.com",
    projectId: "my-diary-app-7c624",
    storageBucket: "my-diary-app-7c624.firebasestorage.app",
    messagingSenderId: "105338607953",
    appId: "1:105338607953:web:8b9cfbab951990195c5b70",
    measurementId: "G-0WV7HVJZ9W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let allDiaries = []; // 暫存所有從 Firebase 撈出來的日記
let currentMoodFilter = 'all'; // 目前選取的心情篩選條件

const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const diaryList = document.getElementById('diary-list');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
        await loadDiariesFromCloud();
    } else {
        currentUser = null;
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
        diaryList.innerHTML = '';
        allDiaries = [];
    }
});

document.getElementById('google-login-btn')?.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => console.error(err));
});

document.getElementById('logout-btn')?.addEventListener('click', () => { signOut(auth); });

// 寫日記的心情切換
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// 儲存日記
document.getElementById('save-btn')?.addEventListener('click', async () => {
    const inputField = document.getElementById('diary-input');
    const prayerField = document.getElementById('prayer-input');
    const content = inputField.value.trim();
    const prayer = prayerField.value.trim();
    const activeMoodBtn = document.querySelector('.mood-btn.active');
    const mood = activeMoodBtn ? activeMoodBtn.dataset.mood : '😊';
    const date = new Date().toLocaleDateString();

    if (!content || !currentUser) return;

    try {
        const diaryId = Date.now().toString();
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), { 
            content, prayer: prayer || "", mood, date, createdAt: new Date() 
        });
        inputField.value = '';
        prayerField.value = '';
        await loadDiariesFromCloud();
    } catch (e) { console.error(e); }
});

// 1. 從 Firebase 載入原始資料
async function loadDiariesFromCloud() {
    if (!currentUser) return;
    diaryList.innerHTML = '<p style="text-align:center;">載入中...</p>';
    try {
        const q = query(collection(db, "users", currentUser.uid, "diaries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allDiaries = []; // 清空暫存
        querySnapshot.forEach((docSnap) => {
            allDiaries.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        // 抓完資料後，執行篩選與渲染
        filterAndRenderDiaries();
    } catch (e) { console.error(e); }
}

// 2. 前端即時篩選與網頁渲染機制 (核心改動)
function filterAndRenderDiaries() {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    diaryList.innerHTML = '';

    // 進行資料過濾
    const filtered = allDiaries.filter(diary => {
        // 心情條件檢查
        const matchMood = (currentMoodFilter === 'all' || diary.mood === currentMoodFilter);
        
        // 關鍵字檢查 (比對內文、禱告、日期)
        const contentText = diary.content ? diary.content.toLowerCase() : '';
        const prayerText = diary.prayer ? diary.prayer.toLowerCase() : '';
        const dateText = diary.date ? diary.date.toLowerCase() : '';
        const matchKeyword = contentText.includes(keyword) || prayerText.includes(keyword) || dateText.includes(keyword);

        return matchMood && matchKeyword;
    });

    if (filtered.length === 0) {
        diaryList.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">找不到符合條件的日記 🌸</p>';
        return;
    }

    // 渲染過濾後的結果
    filtered.forEach((diary) => {
        const div = document.createElement('div');
        div.className = 'diary-card item';
        div.style.position = 'relative';
        div.style.marginBottom = '25px';

        let prayerHTML = '';
        if (diary.prayer && diary.prayer.trim() !== "") {
            prayerHTML = `
                <div class="prayer-section" style="margin-top: 15px; padding: 12px; background: #fff5f6; border-left: 4px solid #FFB7C5; border-radius: 4px;">
                    <strong style="color: #de7a8c; font-size: 14px;">🙏 禱告託付：</strong>
                    <div style="white-space: pre-wrap; color: #555; font-size: 14px; margin-top: 5px;">${diary.prayer}</div>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="date-tag">${diary.date} ${diary.mood}</div>
            <button class="real-delete-btn" data-id="${diary.id}" 
                    style="position: absolute; top: 12px; right: 12px; background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; z-index: 999;">✕</button>
            <div class="content" style="margin-top: 15px; white-space: pre-wrap; color: #333;">${diary.content}</div>
            ${prayerHTML}
        `;
        diaryList.appendChild(div);
    });

    // 重新綁定刪除按鈕
    document.querySelectorAll('.real-delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm("要刪除這篇日記嗎？")) {
                await deleteDoc(doc(db, "users", currentUser.uid, "diaries", id));
                await loadDiariesFromCloud();
            }
        };
    });
}

// 3. 綁定搜尋輸入框的監聽事件 (打字時即時過濾)
document.getElementById('search-input')?.addEventListener('input', filterAndRenderDiaries);

// 4. 綁定心情篩選按鈕點擊事件
document.querySelectorAll('.filter-mood-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-mood-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = '#fdf0f2';
            b.style.color = '#333';
        });
        
        btn.classList.add('active');
        btn.style.background = '#FFB7C5';
        btn.style.color = 'white';
        
        currentMoodFilter = btn.dataset.filter;
        filterAndRenderDiaries(); // 切換篩選時重新渲染
    });
});

// 註冊 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA 註冊成功'))
            .catch(err => console.log('PWA 註冊失敗', err));
    });
}