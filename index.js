document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const bookmarks = document.querySelectorAll('.bookmark');

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
            const tags = new Set(bookmark.dataset.tags.split(','));

            const matchesTags = selectedTags.size === 0 ||
                [...selectedTags].every(tag => tags.has(tag));
            const matchesSearch = title.includes(searchTerm);

            bookmark.style.display = (matchesTags && matchesSearch) ? '' : 'none';
        });
    }

    const debouncedFilterBookmarks = debounce(filterBookmarks, 500); // 500ms 延迟

    searchInput.addEventListener('input', debouncedFilterBookmarks);

    tagButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tag = button.dataset.tag;

            // 移除 'selected' 类，而是使用 'active' 类
            button.classList.toggle('active');
            if (button.classList.contains('active')) {
                selectedTags.add(tag);
            } else {
                selectedTags.delete(tag);
            }

            filterBookmarks(); // 标签筛选不需要防抖
        });
    });

    // 添加触摸事件处理
    tagButtons.forEach(button => {
        button.addEventListener('touchstart', () => {
            button.classList.add('active');
        });

        button.addEventListener('touchend', () => {
            // 如果按钮不在选中状态，移除 'active' 类
            if (!selectedTags.has(button.dataset.tag)) {
                button.classList.remove('active');
            }
        });
    });

    // 初始化时调用一次过滤函数
    filterBookmarks();
});