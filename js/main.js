import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

let currentUser = null;

const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const diaryList = document.getElementById('diary-list');

// --- 介面切換與資料載入 ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
        console.log("登入成功，正在載入雲端日記...");
        await loadDiariesFromCloud();
    } else {
        currentUser = null;
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
        diaryList.innerHTML = '';
    }
});

// --- 登入/註冊功能 ---
document.getElementById('google-login-btn').addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => alert("Google 登入失敗: " + err.message));
});

document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password).catch(err => alert("登入失敗: " + err.message));
});

document.getElementById('signup-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password).then(() => alert("註冊成功！")).catch(err => alert("註冊失敗: " + err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// --- 心情選擇邏輯 ---
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// --- 儲存日記 ---
document.getElementById('save-btn').addEventListener('click', async () => {
    const inputField = document.getElementById('diary-input');
    const content = inputField.value.trim();
    const activeMoodBtn = document.querySelector('.mood-btn.active');
    const mood = activeMoodBtn ? activeMoodBtn.dataset.mood : '😊';
    const date = new Date().toLocaleDateString();

    if (!content) return alert("請寫入點內容吧！");
    if (!currentUser) return alert("連線逾時，請重新登入");

    const diaryData = {
        content: content,
        mood: mood,
        date: date,
        createdAt: new Date()
    };

    try {
        const diaryId = Date.now().toString();
        // 儲存到雲端
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), diaryData);
        console.log("✅ 成功同步至雲端");
        
        // 清空輸入並刷新
        inputField.value = '';
        await loadDiariesFromCloud(); 
    } catch (e) {
        console.error("儲存失敗:", e);
        alert("儲存失敗，請檢查網路連線");
    }
});

// --- 從雲端抓取並顯示卡片 ---
async function loadDiariesFromCloud() {
    diaryList.innerHTML = '<p style="text-align:center; padding:20px;">載入中...</p>';
    
    try {
        const q = query(
            collection(db, "users", currentUser.uid, "diaries"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        diaryList.innerHTML = '';
        
        if (querySnapshot.empty) {
            diaryList.innerHTML = '<p style="text-align:center; color:#888;">尚未有任何紀錄</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const div = document.createElement('div');
            
            // 每一篇日記都使用獨立的 .diary-card 類別
            div.className = 'diary-card item'; 
            div.style.marginBottom = '25px'; 
            
            div.innerHTML = `
                <div class="date-tag">${data.date} ${data.mood}</div>
                <div class="content" style="margin-top:15px; white-space: pre-wrap; font-size:1.1rem; line-height:1.6;">
                    ${data.content}
                </div>
            `;
            diaryList.appendChild(div);
        });
    } catch (e) {
        console.error("讀取失敗:", e);
        diaryList.innerHTML = '<p style="text-align:center;">載入失敗，請確認 Firebase Rules 設定</p>';
    }
}