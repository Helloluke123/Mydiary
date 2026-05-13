import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase 配置 (請保持你的專案資訊)
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

// --- 監聽登入狀態 ---
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
        diaryList.innerHTML = '';
    }
});

// --- 帳號功能 ---
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

// --- 心情選擇切換 ---
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

    if (!content) return alert("寫點什麼吧！");
    if (!currentUser) return;

    const diaryData = {
        content: content,
        mood: mood,
        date: date,
        createdAt: new Date()
    };

    try {
        const diaryId = Date.now().toString();
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), diaryData);
        inputField.value = '';
        await loadDiariesFromCloud(); 
    } catch (e) {
        console.error("儲存失敗:", e);
    }
});

// --- 讀取雲端資料並生成卡片 ---
async function loadDiariesFromCloud() {
    diaryList.innerHTML = '<p style="text-align:center;">載入中...</p>';
    try {
        const q = query(
            collection(db, "users", currentUser.uid, "diaries"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        diaryList.innerHTML = '';
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'diary-card item';
            div.style.marginBottom = '25px';
            
            // 在卡片中嵌入刪除按鈕，並綁定 document ID
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="date-tag">${data.date} ${data.mood}</div>
                    <button class="delete-btn" data-id="${docSnap.id}" style="background:none; border:none; color:#FFB7C5; cursor:pointer; font-size:1.2rem;">🗑️</button>
                </div>
                <div class="content" style="margin-top:15px; white-space: pre-wrap; font-size:1.1rem; line-height:1.6;">
                    ${data.content}
                </div>
            `;
            diaryList.appendChild(div);
        });

        // 幫所有的刪除按鈕加上監聽器
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const diaryId = e.currentTarget.dataset.id;
                if (confirm("要刪除這篇日記嗎？")) {
                    await deleteDiary(diaryId);
                }
            });
        });
    } catch (e) {
        console.error("讀取失敗:", e);
    }
}

// --- 刪除功能實作 ---
async function deleteDiary(diaryId) {
    try {
        const docRef = doc(db, "users", currentUser.uid, "diaries", diaryId);
        await deleteDoc(docRef); // 執行刪除命令
        console.log("✅ 已刪除文件:", diaryId);
        await loadDiariesFromCloud(); // 重新整理列表
    } catch (e) {
        console.error("刪除失敗:", e);
        alert("刪除失敗，請檢查權限");
    }
}