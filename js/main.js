import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase 配置
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

// --- 登入狀態監聽 ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
        console.log("登入成功:", user.email);
        await loadDiariesFromCloud();
    } else {
        currentUser = null;
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
        document.getElementById('diary-list').innerHTML = '';
    }
});

// --- 功能按鈕：登入、註冊、登出 ---
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

// --- 心情按鈕切換 ---
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
    const mood = activeMoodBtn ? activeMoodBtn.innerText : '😊';
    const date = new Date().toLocaleDateString();

    if (!content) return alert("寫點什麼吧！");

    if (!currentUser) return alert("尚未登入！");

    const diaryData = {
        content,
        mood,
        date,
        createdAt: new Date()
    };

    try {
        const diaryId = Date.now().toString();
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), diaryData);
        console.log("✅ 儲存成功");
        inputField.value = '';
        await loadDiariesFromCloud(); // 儲存完立即刷新列表
    } catch (e) {
        console.error("❌ 儲存失敗:", e);
        alert("儲存失敗，請檢查網路或權限。");
    }
});

// --- 讀取日記 ---
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
            const div = document.createElement('div');
            div.className = 'diary-card item';
            div.style.marginBottom = '15px'; // 稍微間隔
            div.innerHTML = `
                <div class="date-tag">${data.date} ${data.mood}</div>
                <div class="content" style="margin-top:10px;">${data.content}</div>
            `;
            diaryList.appendChild(div);
        });
    } catch (e) {
        console.error("讀取失敗:", e);
        diaryList.innerHTML = '<p>暫無記錄或讀取失敗</p>';
    }
}