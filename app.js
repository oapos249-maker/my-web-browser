const tabsContainer = document.getElementById('tabs-container');
const webviewContainer = document.getElementById('webview-container');
const startPage = document.getElementById('start-page');
const urlBar = document.getElementById('url-bar');

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

const searchEngines = { google: 'https://www.google.com/search?q=', yandex: 'https://yandex.ru/search/?text=' };
let currentEngine = localStorage.getItem('searchEngine') || 'yandex';

// --- ТЕМА ---
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
document.getElementById('theme-btn').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
document.getElementById('theme-btn').addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('theme-btn').textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// --- ВКЛАДКИ ---
function createTab() {
    const tabId = 'tab-' + (++tabCounter);
    
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.id = tabId + '-ui';
    tabEl.innerHTML = `<div class="tab-title">Новая вкладка</div><button class="tab-close">×</button>`;
    tabsContainer.appendChild(tabEl);

    tabs.push({ id: tabId, tabEl, iframe: null, url: '' });

    tabEl.addEventListener('click', (e) => { if (!e.target.classList.contains('tab-close')) switchTab(tabId); });
    tabEl.querySelector('.tab-close').addEventListener('click', (e) => { e.stopPropagation(); closeTab(tabId); });

    switchTab(tabId);
}

// Глобальная функция для кнопок на стартовой странице
window.openTab = function(url) {
    navigate(url);
};

function switchTab(tabId) {
    activeTabId = tabId;
    tabs.forEach(tab => {
        if (tab.id === tabId) {
            tab.tabEl.classList.add('active');
            urlBar.value = tab.url;
            
            if (tab.iframe) {
                startPage.classList.remove('active');
                webviewContainer.classList.add('active');
                document.querySelectorAll('iframe').forEach(f => f.classList.remove('active'));
                tab.iframe.classList.add('active');
            } else {
                startPage.classList.add('active');
                webviewContainer.classList.remove('active');
                document.querySelectorAll('iframe').forEach(f => f.classList.remove('active'));
            }
        } else {
            tab.tabEl.classList.remove('active');
        }
    });
}

function closeTab(tabId) {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    if (tabs.length === 1) createTab();
    
    const tab = tabs[tabIndex];
    if (tab.iframe) tab.iframe.remove();
    tab.tabEl.remove();
    tabs.splice(tabIndex, 1);
    
    if (activeTabId === tabId) switchTab(tabs[0].id);
}

// --- НАВИГАЦИЯ ---
function navigate(url) {
    if (!url) return;
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Формируем URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = url.includes('.') ? 'https://' + url : searchEngines[currentEngine] + encodeURIComponent(url);
    }
    
    activeTab.url = url;
    urlBar.value = url;
    activeTab.tabEl.querySelector('.tab-title').textContent = 'Загрузка...';

    // Если iframe еще нет, создаем его
    if (!activeTab.iframe) {
        const iframe = document.createElement('iframe');
        iframe.id = activeTab.id + '-iframe';
        iframe.src = url;
        webviewContainer.appendChild(iframe);
        activeTab.iframe = iframe;

        // При загрузке страницы пытаемся взять заголовок
        iframe.addEventListener('load', () => {
            try {
                const title = iframe.contentDocument.title || url;
                activeTab.tabEl.querySelector('.tab-title').textContent = title;
            } catch(e) {
                activeTab.tabEl.querySelector('.tab-title').textContent = url;
            }
        });
    } else {
        activeTab.iframe.src = url;
    }

    switchTab(activeTabId);
}

urlBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') navigate(urlBar.value.trim());
});

document.getElementById('new-tab-btn').addEventListener('click', () => createTab());
document.getElementById('reload-btn').addEventListener('click', () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab && activeTab.iframe) activeTab.iframe.src = activeTab.iframe.src;
});

// --- ЗАКЛАДКИ ---
let bookmarks = JSON.parse(localStorage.getItem('web_bookmarks')) || [];
const bookmarksDropdown = document.getElementById('bookmarks-dropdown');

function renderBookmarks() {
    const list = document.getElementById('bookmarks-list');
    list.innerHTML = '';
    if (bookmarks.length === 0) { list.innerHTML = '<div style="padding:16px; color:var(--text-muted); text-align:center;">Закладок пока нет</div>'; return; }
    bookmarks.forEach((bm, i) => {
        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.innerHTML = `<span class="bookmark-title">${bm.title}</span><button class="bookmark-delete">×</button>`;
        div.querySelector('.bookmark-title').onclick = () => { navigate(bm.url); bookmarksDropdown.classList.remove('active'); };
        div.querySelector('.bookmark-delete').onclick = (e) => { e.stopPropagation(); bookmarks.splice(i, 1); localStorage.setItem('web_bookmarks', JSON.stringify(bookmarks)); renderBookmarks(); };
        list.appendChild(div);
    });
}

document.getElementById('bookmarks-btn').addEventListener('click', () => {
    bookmarksDropdown.classList.toggle('active');
    if (bookmarksDropdown.classList.contains('active')) renderBookmarks();
});

document.getElementById('bookmark-btn').addEventListener('click', () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab && activeTab.url) {
        bookmarks.push({ url: activeTab.url, title: activeTab.tabEl.querySelector('.tab-title').textContent });
        localStorage.setItem('web_bookmarks', JSON.stringify(bookmarks));
        document.getElementById('bookmark-btn').style.color = '#fbbc04';
    }
});

document.addEventListener('click', (e) => {
    if (!bookmarksDropdown.contains(e.target) && e.target !== document.getElementById('bookmarks-btn')) bookmarksDropdown.classList.remove('active');
});

// Запуск
createTab();
