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

// --- 帳號登入/註冊功能 ---
document.getElementById('google-login-btn')?.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => alert(err.message));
});

document.getElementById('login-btn')?.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password).catch(err => alert(err.message));
});

document.getElementById('signup-btn')?.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password).then(() => alert("註冊成功")).catch(err => alert(err.message));
});

document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));

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
        console.error(e);
    }
});

// --- 讀取並渲染日記卡片 ---
async function loadDiariesFromCloud() {
    diaryList.innerHTML = '<p style="text-align:center;">讀取中...</p>';
    try {
        const q = query(collection(db, "users", currentUser.uid, "diaries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        diaryList.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'diary-card item';
            div.style.position = 'relative'; // 讓按鈕可以定位
            div.style.marginBottom = '20px';

            div.innerHTML = `
                <div class="date-tag">${data.date} ${data.mood}</div>
                
                <!-- 刪除按鈕：固定在右上角 -->
                <button class="delete-btn" data-id="${docSnap.id}" 
                        style="position: absolute; top: 12px; right: 12px; 
                               background: #FFB7C5; color: white; border: none; 
                               border-radius: 50%; width: 28px; height: 28px; 
                               cursor: pointer; font-weight: bold; z-index: 5;">
                    ✕
                </button>

                <div class="content" style="margin-top: 15px; white-space: pre-wrap;">
                    ${data.content}
                </div>
            `;
            diaryList.appendChild(div);
        });

        // 綁定刪除事件
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                if (confirm("確定要刪除這篇日記嗎？")) {
                    await deleteDoc(doc(db, "users", currentUser.uid, "diaries", id));
                    await loadDiariesFromCloud();
                }
            };
        });
    } catch (e) {
        console.error(e);
    }
}