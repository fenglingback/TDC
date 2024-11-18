document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const bookmarks = document.querySelectorAll('.bookmark');
    const bm_repo = document.body.dataset.reponame;
    const bm_user = document.body.dataset.username;
    const starButton = document.getElementById('star-button');
    const starIcon = starButton.querySelector('.star-icon');

    let selectedTags = new Set();
    let debounceTimer;


    function debounce(func, delay) {
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function filterBookmarks() {
        const searchTerm = searchInput.value.toLowerCase();

        bookmarks.forEach(bookmark => {
            const title = bookmark.querySelector('.bookmark-title').textContent.toLowerCase();
            const desc = bookmark.querySelector('.bookmark-desc')?.textContent.toLowerCase() || '';
            const tags = new Set(bookmark.dataset.tags.split(','));

            const matchesTags = selectedTags.size === 0 || [...selectedTags].every(tag => tags.has(tag));
            const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);

            bookmark.style.display = matchesTags && matchesSearch ? '' : 'none';
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

    tagButtons.forEach(button => {
        button.addEventListener('touchstart', handleTouchStart);
        button.addEventListener('touchmove', handleTouchMove);
        button.addEventListener('touchend', handleTouchEnd);
        button.addEventListener('click', handleClick);
    });

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

    filterBookmarks();

    function showTokenDialog() {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h2>设置 GitHub 个人访问令牌</h2>
                <p>请输入您的 GitHub 个人访问令牌。这将用于访问 GitHub API。</p>
                <input type="password" id="github-token-input" placeholder="输入您的 GitHub 令牌">
                <button id="save-token-btn">保存</button>
                <button id="cancel-btn">&times;</button>
            </div>
        `;
        document.body.appendChild(dialog);
        document.body.style.overflow = 'hidden';

        const saveButton = document.getElementById('save-token-btn');
        const cancelButton = document.getElementById('cancel-btn');
        saveButton.addEventListener('click', checkAndSaveGitHubToken);
        cancelButton.addEventListener('click', closeDialog);
    }

    function closeDialog() {
        document.body.removeChild(document.querySelector('.dialog-overlay').parentNode);
        document.body.style.overflow = '';
    }

    async function checkAndSaveGitHubToken() {
        const tokenInput = document.getElementById('github-token-input');
        const token = tokenInput.value.trim();

        const url = `https://api.github.com/user`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        try {
            const response = await fetch(url, { method: 'GET', headers });

            if (response.status === 200) {
                const data = await response.json();
                if (data.login === bm_user) {
                    localStorage.setItem('githubToken', token);
                    closeDialog();
                    alert('令牌设置成功！');
                } else {
                    alert('抱歉，你没有权限部署！');
                    tokenInput.value = '';
                }
            } else {
                alert('令牌无效，请检查令牌是否正确');
                tokenInput.value = '';
            }
        } catch (error) {
            alert('检查网络连接！');
            console.error('Error:', error);
        }
    }

    async function toggleStar() {
        const token = localStorage.getItem('githubToken');
        if (!token) {
            showTokenDialog();
            return;
        }

        const url = `https://api.github.com/user/starred/${bm_user}/${bm_repo}`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        try {
            const starResponse = await fetch(url, { method: 'PUT', headers });

            if (starResponse.status === 204) {
                starButton.classList.add('starred');
                starIcon.setAttribute('fill', 'currentColor');
                console.log('Successfully starred the repository');

                setTimeout(async () => {
                    const unstarResponse = await fetch(url, { method: 'DELETE', headers });

                    if (unstarResponse.status === 204) {
                        starButton.classList.remove('starred');
                        starIcon.setAttribute('fill', 'none');
                        console.log('Successfully unstarred the repository');
                        alert('正在启动部署，部署时间平均30s，部署完成后刷新页面即可');
                    } else {
                        console.error('Failed to unstar the repository');
                    }
                }, 1000);
            } else {
                console.error('Failed to star the repository');
            }
        } catch (error) {
            alert('部署失败，打开控制台查看报错，检查你的token和网络连接，如果仍然无法解决，请联系网站管理员');
            console.error('Error:', error);
        }
    }

    starButton.addEventListener('click', toggleStar);

    console.log("\n %c TDC %c https://github.com/fenglingback/TDC \n", "color: #0ca7a4; background-image: linear-gradient(90deg, #555555 0%, #555555 100%); padding:5px 1px;", "color: #a277ff; background-image: linear-gradient(90deg, #555555 0%, #1d294d 100%); padding:5px 0;");
});