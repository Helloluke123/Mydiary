import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// --- Firebase 配置 ---
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

// --- Google 登入配置 (解決無法切換帳號問題) ---
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account' // 每次登入都會強制彈出帳號選擇器
});

let currentUser = null;

const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const diaryList = document.getElementById('diary-list');

// --- 登入狀態監聽 ---
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
    }
});

// --- 帳號功能 ---
document.getElementById('google-login-btn')?.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => console.error("Google 登入出錯:", err));
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        // 登出後清空介面
        diaryList.innerHTML = '';
    });
});

// --- 心情選擇 ---
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// --- 儲存日記 ---
document.getElementById('save-btn')?.addEventListener('click', async () => {
    const inputField = document.getElementById('diary-input');
    const content = inputField.value.trim();
    const activeMoodBtn = document.querySelector('.mood-btn.active');
    const mood = activeMoodBtn ? activeMoodBtn.dataset.mood : '😊';
    const date = new Date().toLocaleDateString();

    if (!content || !currentUser) return;

    try {
        const diaryId = Date.now().toString();
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), {
            content, mood, date, createdAt: new Date()
        });
        inputField.value = '';
        await loadDiariesFromCloud();
    } catch (e) {
        console.error("儲存失敗:", e);
    }
});

// --- 讀取並顯示日記 ---
async function loadDiariesFromCloud() {
    if (!currentUser) return;
    diaryList.innerHTML = '<p style="text-align:center;">載入中...</p>';
    
    try {
        const q = query(collection(db, "users", currentUser.uid, "diaries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        diaryList.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'diary-card item';
            div.style.position = 'relative'; 
            div.style.marginBottom = '25px';

            div.innerHTML = `
                <div class="date-tag">${data.date} ${data.mood}</div>
                
                <button class="real-delete-btn" data-id="${docSnap.id}" 
                        style="position: absolute; top: 10px; right: 10px; 
                               background: #ff4d4f; color: white; border: none; 
                               border-radius: 50%; width: 26px; height: 26px; 
                               cursor: pointer; display: flex; align-items: center; 
                               justify-content: center; font-size: 16px; 
                               font-weight: bold; z-index: 999; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    ✕
                </button>

                <div class="content" style="margin-top: 15px; white-space: pre-wrap; color: #333;">
                    ${data.content}
                </div>
            `;
            diaryList.appendChild(div);
        });

        // 綁定刪除按鈕
        document.querySelectorAll('.real-delete-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("確定要刪除這篇日記嗎？")) {
                    await deleteDoc(doc(db, "users", currentUser.uid, "diaries", id));
                    await loadDiariesFromCloud();
                }
            };
        });

    } catch (e) {
        console.error("讀取失敗:", e);
    }
}