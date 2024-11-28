document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');

    let selectedTags = new Set();
    let debounceTimer;
    let sortedLabels = null;
    let tinyPinyin = null;

    function debounce(func, delay) {
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function filterBookmarks() {
        const bookmarks = document.querySelectorAll('.bookmark');
        const searchTerm = searchInput.value.toLowerCase();
        const visibleTags = new Set();

        bookmarks.forEach(bookmark => {
            const title = bookmark.querySelector('.bookmark-title').textContent.toLowerCase();
            const desc = bookmark.querySelector('.bookmark-desc')?.textContent.toLowerCase() || '';
            const tags = new Set(bookmark.dataset.tags.split(','));

            const matchesTags = selectedTags.size === 0 || [...selectedTags].every(tag => tags.has(tag));
            const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);

            const isVisible = matchesTags && matchesSearch;
            bookmark.style.display = isVisible ? '' : 'none';

            if (isVisible) {
                tags.forEach(tag => visibleTags.add(tag));
            }
        });

        updateVisibleTags(visibleTags);
    }

    function updateVisibleTags(visibleTags) {
        const tagButtons = document.querySelectorAll('.tag-btn');
        tagButtons.forEach(button => {
            const tag = button.dataset.tag;
            if (visibleTags.has(tag)) {
                button.style.display = '';
            } else {
                button.style.display = 'none';
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag);
                    button.classList.remove('active');
                }
            }
        });
    }

    const debouncedFilterBookmarks = debounce(filterBookmarks, 500);

    searchInput.addEventListener('input', debouncedFilterBookmarks);

    function toggleTag(button) {
        const tag = button.dataset.tag;
        if (selectedTags.has(tag)) {
            selectedTags.delete(tag);
            button.classList.remove('active');
        } else {
            selectedTags.add(tag);
            button.classList.add('active');
        }
        filterBookmarks();
    }

    // Move the tag button event listener setup to a separate function
    function attachTagEventListeners() {
        const tagButtons = document.querySelectorAll('.tag-btn');
        tagButtons.forEach(button => {
            button.addEventListener('touchstart', handleTouchStart);
            button.addEventListener('touchmove', handleTouchMove);
            button.addEventListener('touchend', handleTouchEnd);
            button.addEventListener('click', handleClick);
        });
    }

    function handleTouchStart(e) {
        e.currentTarget.touchStartTime = Date.now();
        e.currentTarget.isTouchMove = false;
    }

    function handleTouchMove(e) {
        e.currentTarget.isTouchMove = true;
    }

    function handleTouchEnd(e) {
        const button = e.currentTarget;
        if (!button.isTouchMove && (Date.now() - button.touchStartTime) < 200) {
            e.preventDefault();
            toggleTag(button);
        }
    }

    function handleClick(e) {
        if (!('ontouchstart' in window)) {
            toggleTag(e.currentTarget);
        }
    }

    function showDialog() {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h2>设置书签仓库信息</h2>
                <p>请输入您的 GitHub 个人访问令牌。这将用于访问 GitHub API。</p>
                <input type="password" id="github-token-input" placeholder="输入您的 GitHub 令牌">
                <p>请输入您的 GitHub 书签仓库。</p>
                <input type="text" id="github-repo-input" placeholder="输入您的 GitHub 书签仓库: e.g. fenglingback/TDC">
                <button id="save-token-btn">保存</button>
            </div>
        `;
        document.body.appendChild(dialog);
        document.body.style.overflow = 'hidden';

        const saveButton = document.getElementById('save-token-btn');
        saveButton.addEventListener('click', checkAndSaveInfo);
    }

    function closeDialog() {
        document.body.removeChild(document.querySelector('.dialog-overlay').parentNode);
        document.body.style.overflow = '';
    }

    async function checkAndSaveInfo() {
        const tokenInput = document.getElementById('github-token-input');
        const repoInput = document.getElementById('github-repo-input');
        const token = tokenInput.value.trim();
        const repo = repoInput.value.trim();

        const url = `https://api.github.com/repos/${repo}`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        try {
            const response = await fetch(url, { method: 'GET', headers });

            if (response.ok) {
                const data = await response.json();
                if (data.permissions.admin === true) {
                    localStorage.setItem('githubToken', token);
                    localStorage.setItem('bmRepo', repo);
                    closeDialog();
                    main();
                } else {
                    alert('您不是该仓库的管理员！');
                }
            }
        } catch (error) {
            alert('检查网络连接和输入信息是否正确！');
            console.error('Error:', error);
        }
    }

    // 获取所有issues
    async function getAllIssues(repo, headers) {

        const issues_url = `https://api.github.com/repos/${repo}/issues`;

        let page = 1;
        let issues = [];
        while (true) {
            const response = await fetch(`${issues_url}?page=${page}&per_page=100&state=open`, {
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.length === 0) {
                break;
            }

            issues = issues.concat(data);
            page++;
        }

        const issues_data = issues.map(issue => {
            let [url, desc] = [];
            if (issue.body.includes('\n\n')) {
                [url, desc] = issue.body.split('\n\n');
            } else if (issue.body.includes('\r\n\r\n')) {
                [url, desc] = issue.body.split('\r\n\r\n');
            } else {
                [url, desc] = [issue.body, '']
            }


            return {
                title: issue.title,
                url: url,
                desc: desc,
                labels: issue.labels.map(label => label.name)
            };
        })

        // console.log(issues_data);
        return issues_data;
    }


    // 提取标签
    async function extractLabels(issues) {
        const labels = new Set();
        for (const issue of issues) {
            for (const label of issue.labels) {
                labels.add(label);
            }
        }

        if (!sortedLabels) {
            if (!tinyPinyin) {
                tinyPinyin = await import('https://cdn.skypack.dev/tiny-pinyin');
            }
            sortedLabels = Array.from(labels).sort((a, b) => {
                const pinyinA = tinyPinyin.default.parse(a)[0].target.toLowerCase();
                const pinyinB = tinyPinyin.default.parse(b)[0].target.toLowerCase();
                return pinyinA.localeCompare(pinyinB);
            });
        }

        return sortedLabels;
    }


    // 渲染页面
    function renderPage(issues_data, labels) {
        const tagsContainer = document.getElementById('tags-container');
        tagsContainer.innerHTML = ''; // 清空现有的标签
        for (const label of labels) {
            tagsContainer.innerHTML += `<button class="tag-btn" data-tag="${label}">${label}</button>`;
        }
        const bookmarksContainer = document.getElementById('bookmarks-container');
        bookmarksContainer.innerHTML = ''; // 清空现有的书签
        for (const issue of issues_data) {
            bookmarksContainer.innerHTML += `
                <a href="${issue.url}" target="_blank" class="bookmark" data-tags="${issue.labels.join(',')}" rel="noopener noreferrer">
                    <span class="bookmark-title">${issue.title}</span>
                    <div class="bookmark-desc">${issue.desc}</div>
                    <div class="bookmark-tags"><span>${issue.labels.join('</span><span>')}</span></div>
                </a>`;
        }

        // 添加这行来附加事件监听器
        attachTagEventListeners();
    }


    async function main() {

        try {
            if (!localStorage.getItem('githubToken') || !localStorage.getItem('bmRepo')) {
                showDialog();
                return;
            }

            console.log("\n %c TDC %c https://github.com/fenglingback/TDC \n", "color: #0ca7a4; background-image: linear-gradient(90deg, #555555 0%, #555555 100%); padding:5px 1px;", "color: #a277ff; background-image: linear-gradient(90deg, #555555 0%, #1d294d 100%); padding:5px 0;");

            const repo = localStorage.getItem('bmRepo');
            const token = localStorage.getItem('githubToken');
            const headers = {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            const issues = await getAllIssues(repo, headers);
            const labels = await extractLabels(issues);
            renderPage(issues, labels);

            filterBookmarks();
        } catch (error) {
            console.error(error);
        }

    }

    main();
});