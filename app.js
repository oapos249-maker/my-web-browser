// --- Элементы интерфейса ---
const tabsContainer = document.getElementById('tabs-container');
const webviewContainer = document.getElementById('webview-container');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const bookmarkBtn = document.getElementById('bookmark-btn');
const bookmarksBtn = document.getElementById('bookmarks-btn');
const bookmarksDropdown = document.getElementById('bookmarks-dropdown');
const themeBtn = document.getElementById('theme-btn');

// --- Состояние ---
let tabs = [];
let activeTabId = null;
let tabCounter = 0;

// Поисковики
const searchEngines = {
    google: 'https://www.google.com/search?q=',
    yandex: 'https://yandex.ru/search/?text=',
    duckduckgo: 'https://duckduckgo.com/?q='
};
let currentEngine = localStorage.getItem('searchEngine') || 'google';

// --- ТЕМА ---
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// --- ЛОГИКА ВКЛАДОК ---

function createTab(url = 'about:blank') {
    const tabId = 'tab-' + (++tabCounter);
    
    // Создаем iframe (сайт)
    const iframe = document.createElement('iframe');
    iframe.id = tabId + '-iframe';
    iframe.src = url;
    webviewContainer.appendChild(iframe);

    // Создаем визуальную вкладку
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.id = tabId + '-ui';
    tabEl.innerHTML = `
        <div class="tab-title">Новая вкладка</div>
        <button class="tab-close">×</button>
    `;
    tabsContainer.appendChild(tabEl);

    // Сохраняем
    tabs.push({ id: tabId, iframe, tabEl, url: url });

    // Обновляем заголовок вкладки (если iframe загрузится)
    iframe.addEventListener('load', () => {
        try {
            // Из-за политики безопасности мы не всегда можем получить доступ к title,
            // но попробуем.
            const title = iframe.contentDocument.title || 'Сайт';
            tabEl.querySelector('.tab-title').textContent = title;
        } catch(e) {
            tabEl.querySelector('.tab-title').textContent = 'Сайт (Защищено)';
        }
    });

    // Обработчики событий
    tabEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) switchTab(tabId);
    });
    tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tabId);
    });

    switchTab(tabId);
}

function switchTab(tabId) {
    activeTabId = tabId;
    tabs.forEach(tab => {
        if (tab.id === tabId) {
            tab.iframe.classList.add('active');
            tab.tabEl.classList.add('active');
            urlBar.value = tab.url === 'about:blank' ? '' : tab.url;
        } else {
            tab.iframe.classList.remove('active');
            tab.tabEl.classList.remove('active');
        }
    });
}

function closeTab(tabId) {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    if (tabs.length === 1) createTab(); // Если последняя, создаем новую

    const tab = tabs[tabIndex];
    tab.iframe.remove();
    tab.tabEl.remove();
    tabs.splice(tabIndex, 1);

    if (activeTabId === tabId) {
        switchTab(tabs[0].id);
    }
}

// --- НАВИГАЦИЯ ---

function navigate(url) {
    if (!url) return;
    
    // Если это не ссылка, а поисковый запрос
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('.')) {
        url = searchEngines[currentEngine] + encodeURIComponent(url);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
        activeTab.url = url;
        activeTab.iframe.src = url;
        urlBar.value = url;
        
        // Меняем заголовок вкладки на время загрузки
        activeTab.tabEl.querySelector('.tab-title').textContent = 'Загрузка...';
    }
}

urlBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigate(urlBar.value.trim());
    }
});

// --- КНОПКИ ---
newTabBtn.addEventListener('click', () => createTab());

document.getElementById('reload-btn').addEventListener('click', () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) activeTab.iframe.src = activeTab.iframe.src; // Перезагрузка
});

// Кнопки назад/вперед (в iframe они не работают напрямую из-за безопасности, поэтому делаем вид)
document.getElementById('back-btn').addEventListener('click', () => {
    alert('В веб-версии кнопка "Назад" ограничена из-за безопасности браузера. Используйте кнопку "Назад" в самом браузере.');
});
document.getElementById('forward-btn').addEventListener('click', () => {
    alert('В веб-версии кнопка "Вперед" ограничена из-за безопасности браузера.');
});

// --- ЗАКЛАДКИ ---
let bookmarks = JSON.parse(localStorage.getItem('web_bookmarks')) || [];

function renderBookmarks() {
    const list = document.getElementById('bookmarks-list');
    list.innerHTML = '';
    if (bookmarks.length === 0) {
        list.innerHTML = '<div style="padding:16px; color:var(--text-muted); text-align:center;">Закладок пока нет</div>';
        return;
    }
    bookmarks.forEach((bm, i) => {
        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.innerHTML = `<span class="bookmark-title">${bm.title}</span><button class="bookmark-delete">×</button>`;
        
        div.querySelector('.bookmark-title').onclick = () => {
            createTab(bm.url);
            bookmarksDropdown.classList.remove('active');
        };
        div.querySelector('.bookmark-delete').onclick = (e) => {
            e.stopPropagation();
            bookmarks.splice(i, 1);
            localStorage.setItem('web_bookmarks', JSON.stringify(bookmarks));
            renderBookmarks();
        };
        list.appendChild(div);
    });
}

bookmarksBtn.addEventListener('click', () => {
    bookmarksDropdown.classList.toggle('active');
    if (bookmarksDropdown.classList.contains('active')) renderBookmarks();
});

bookmarkBtn.addEventListener('click', () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab && activeTab.url !== 'about:blank') {
        bookmarks.push({ url: activeTab.url, title: activeTab.url });
        localStorage.setItem('web_bookmarks', JSON.stringify(bookmarks));
        bookmarkBtn.style.color = '#fbbc04';
    }
});

document.addEventListener('click', (e) => {
    if (!bookmarksDropdown.contains(e.target) && e.target !== bookmarksBtn) {
        bookmarksDropdown.classList.remove('active');
    }
});

// --- СТАРТОВАЯ СТРАНИЦА ---
// Создаем красивую страницу приветствия прямо в коде
const startPageHTML = `
    data:text/html;charset=utf-8,
    <html>
    <head>
        <style>
            body { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            h1 { font-size: 48px; margin-bottom: 10px; }
            p { color: #ccc; margin-bottom: 40px; font-size: 18px; }
            .links { display: flex; gap: 20px; }
            a { display: flex; flex-direction: column; align-items: center; gap: 10px; color: white; text-decoration: none; font-size: 16px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; width: 100px; backdrop-filter: blur(10px); transition: 0.3s; }
            a:hover { background: rgba(255,255,255,0.2); transform: translateY(-5px); }
            .icon { font-size: 32px; }
        </style>
    </head>
    <body>
        <h1>My Web Browser</h1>
        <p>Введите адрес сайта в строку сверху или выберите сервис ниже</p>
        <div class="links">
            <a href="https://www.google.com" target="_blank"><span class="icon">🔍</span>Google</a>
            <a href="https://yandex.ru" target="_blank"><span class="icon">🇷🇺</span>Яндекс</a>
            <a href="https://github.com" target="_blank"><span class="icon">🐙</span>GitHub</a>
            <a href="https://www.youtube.com" target="_blank"><span class="icon">▶️</span>YouTube</a>
        </div>
        <p style="margin-top: 50px; font-size: 12px; color: #aaa; max-width: 400px; text-align: center;">
            <b>Внимание:</b> Многие крупные сайты (Google, YouTube) запрещают открывать себя внутри других сайтов. Если вы видите белый экран, нажмите кнопку <b>"Открыть в новой вкладке"</b> (в самом браузере) или кнопку ниже.
        </p>
    </body>
    </html>
`;

// Запускаем первую вкладку
createTab(startPageHTML);