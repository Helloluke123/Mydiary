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
    }
});

document.getElementById('google-login-btn')?.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => console.error(err));
});

document.getElementById('logout-btn')?.addEventListener('click', () => { signOut(auth); });

document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.getElementById('save-btn')?.addEventListener('click', async () => {
    const inputField = document.getElementById('diary-input');
    const content = inputField.value.trim();
    const activeMoodBtn = document.querySelector('.mood-btn.active');
    const mood = activeMoodBtn ? activeMoodBtn.dataset.mood : '😊';
    const date = new Date().toLocaleDateString();
    if (!content || !currentUser) return;
    try {
        const diaryId = Date.now().toString();
        await setDoc(doc(db, "users", currentUser.uid, "diaries", diaryId), { content, mood, date, createdAt: new Date() });
        inputField.value = '';
        await loadDiariesFromCloud();
    } catch (e) { console.error(e); }
});

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
                        style="position: absolute; top: 12px; right: 12px; background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; z-index: 999;">✕</button>
                <div class="content" style="margin-top: 15px; white-space: pre-wrap; color: #333;">${data.content}</div>
            `;
            diaryList.appendChild(div);
        });
        document.querySelectorAll('.real-delete-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("要刪除這篇日記嗎？")) {
                    await deleteDoc(doc(db, "users", currentUser.uid, "diaries", id));
                    await loadDiariesFromCloud();
                }
            };
        });
    } catch (e) { console.error(e); }
}

// --- 註冊 Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA 註冊成功'))
            .catch(err => console.log('PWA 註冊失敗', err));
    });
}