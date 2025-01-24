document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input")

    const selectedTags = new Set()
    let debounceTimer
    const sortedLabels = null
    let tinyPinyin = null

    function debounce(func, delay) {
        return function () {
            const args = arguments
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => func.apply(this, args), delay)
        }
    }

    function filterBookmarks() {
        const bookmarks = document.querySelectorAll(".bookmark")
        const searchTerm = searchInput.value.toLowerCase()
        const visibleTags = new Set()

        bookmarks.forEach((bookmark) => {
            const title = bookmark.querySelector(".bookmark-title").textContent.toLowerCase()
            const desc = bookmark.querySelector(".bookmark-desc")?.textContent.toLowerCase() || ""
            const tags = new Set(bookmark.dataset.tags.split(","))

            const matchesTags = selectedTags.size === 0 || [...selectedTags].every((tag) => tags.has(tag))
            const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm)

            const isVisible = matchesTags && matchesSearch
            bookmark.style.display = isVisible ? "" : "none"

            if (isVisible) {
                tags.forEach((tag) => visibleTags.add(tag))
            }
        })

        const hasActiveFilters = selectedTags.size > 0 || searchTerm.length > 0

        if (hasActiveFilters) {
            updateVisibleTags(visibleTags)
            toggleLettersVisibility(false)
        } else {
            showFirstLetterTags()
            toggleLettersVisibility(true)
        }
    }

    function updateVisibleTags(visibleTags) {
        const tagButtons = document.querySelectorAll(".tag-btn")
        tagButtons.forEach((button) => {
            const tag = button.dataset.tag
            if (visibleTags.has(tag)) {
                button.style.display = ""
            } else {
                button.style.display = "none"
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag)
                    button.classList.remove("active")
                }
            }
        })
    }

    const debouncedFilterBookmarks = debounce(filterBookmarks, 500)

    searchInput.addEventListener("input", debouncedFilterBookmarks)

    function toggleTag(button) {
        const tag = button.dataset.tag
        if (selectedTags.has(tag)) {
            selectedTags.delete(tag)
            button.classList.remove("active")
        } else {
            selectedTags.add(tag)
            button.classList.add("active")
        }
        filterBookmarks()
    }

    // Move the tag button event listener setup to a separate function
    function attachTagEventListeners() {
        const tagButtons = document.querySelectorAll(".tag-btn")
        tagButtons.forEach((button) => {
            button.addEventListener("touchstart", handleTouchStart)
            button.addEventListener("touchmove", handleTouchMove)
            button.addEventListener("touchend", handleTouchEnd)
            button.addEventListener("click", handleClick)
        })
    }

    function handleTouchStart(e) {
        e.currentTarget.touchStartTime = Date.now()
        e.currentTarget.isTouchMove = false
    }

    function handleTouchMove(e) {
        e.currentTarget.isTouchMove = true
    }

    function handleTouchEnd(e) {
        const button = e.currentTarget
        if (!button.isTouchMove && Date.now() - button.touchStartTime < 200) {
            e.preventDefault()
            toggleTag(button)
        }
    }

    function handleClick(e) {
        if (!("ontouchstart" in window)) {
            toggleTag(e.currentTarget)
        }
    }

    function toggleLettersVisibility(show) {
        const lettersContainer = document.getElementById("letters-container")
        lettersContainer.style.display = show ? "" : "none"
    }

    let firstLetterTags = []

    function showDialog() {
        const dialog = document.createElement("div")
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h2>设置书签仓库信息</h2>
                <p>请输入您的 GitHub 个人访问令牌。这将用于访问 GitHub API。</p>
                <input type="password" id="github-token-input" placeholder="输入您的 GitHub 令牌">
                <p>请输入您的 GitHub 书签仓库。</p>
                <input type="text" id="github-repo-input" placeholder="输入您的 GitHub 书签仓库: e.g. fenglingback/TDC">
                <button id="save-btn">保存</button>
            </div>
        `
        document.body.appendChild(dialog)
        document.body.style.overflow = "hidden"

        const saveButton = document.getElementById("save-btn")
        saveButton.addEventListener("click", checkAndSaveInfo)
    }

    function closeDialog() {
        document.body.removeChild(document.querySelector(".dialog-overlay").parentNode)
        document.body.style.overflow = ""
    }

    async function checkAndSaveInfo() {
        const tokenInput = document.getElementById("github-token-input")
        const repoInput = document.getElementById("github-repo-input")
        const token = tokenInput.value.trim()
        const repo = repoInput.value.trim()

        const url = `https://api.github.com/repos/${repo}`
        const headers = {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
        }

        try {
            const response = await fetch(url, { method: "GET", headers })

            if (response.ok) {
                const data = await response.json()
                if (data.permissions.admin === true) {
                    localStorage.setItem("githubToken", token)
                    localStorage.setItem("bmRepo", repo)
                    closeDialog()
                    main()
                } else {
                    alert("您不是该仓库的管理员！")
                }
            }
        } catch (error) {
            alert("检查网络连接和输入信息是否正确！")
            console.error("Error:", error)
        }
    }

    // 获取所有issues
    async function getAllIssues(repo, headers) {
        const issues_url = `https://api.github.com/repos/${repo}/issues`

        let page = 1
        let issues = []
        while (true) {
            const response = await fetch(`${issues_url}?page=${page}&per_page=100&state=open`, {
                headers: headers,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            if (data.length === 0) {
                break
            }

            issues = issues.concat(data)
            page++
        }

        const issues_data = issues.map((issue) => {
            let [url, desc] = []
            if (issue.body.includes("\n\n")) {
                ;[url, desc] = issue.body.split("\n\n")
            } else if (issue.body.includes("\r\n\r\n")) {
                ;[url, desc] = issue.body.split("\r\n\r\n")
            } else {
                ;[url, desc] = [issue.body, ""]
            }

            return {
                title: issue.title,
                url: url,
                desc: desc,
                labels: issue.labels.map((label) => label.name),
            }
        })

        // console.log(issues_data);
        return issues_data
    }

    // 提取标签
    async function extractLabels(issues) {
        const labels = new Set()
        for (const issue of issues) {
            for (const label of issue.labels) {
                labels.add(label)
            }
        }

        if (!sortedLabels) {
            if (!tinyPinyin) {
                tinyPinyin = await import("https://cdn.skypack.dev/tiny-pinyin")
            }

            // 构造一个字母到标签的映射
            const letterToLabels = {}
            Array.from(labels).forEach((label) => {
                const pinyin = tinyPinyin.default.parse(label)[0].target.toUpperCase()
                const letter = pinyin[0]
                if (!letterToLabels[letter]) {
                    letterToLabels[letter] = []
                }
                letterToLabels[letter].push(label)
            })

            // console.log(letterToLabels);

            // 按字母顺序重新排列这个映射
            const sortedLetterToLabels = {}
            for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
                if (letterToLabels[letter]) {
                    sortedLetterToLabels[letter] = letterToLabels[letter].sort()
                }
            }

            // console.log(sortedLetterToLabels);

            return sortedLetterToLabels
        }
    }

    function showFirstLetterTags() {
        const tagBtns = document.querySelectorAll(".tag-btn")
        tagBtns.forEach((btn) => {
            if (firstLetterTags.includes(btn.dataset.tag)) {
                btn.style.display = ""
            } else {
                btn.style.display = "none"
            }
        })
    }

    // 渲染页面
    function renderPage(issues_data, sortedLetterToLabels) {
        const lettersContainer = document.getElementById("letters-container")
        for (const letter of Object.keys(sortedLetterToLabels)) {
            lettersContainer.innerHTML += `<div class="letter-item" data-letter="${letter}">${letter}</div>`
        }

        const tagsContainer = document.getElementById("tags-container")
        tagsContainer.innerHTML = "" // 清空现有的标签
        for (const label of Object.values(sortedLetterToLabels).flat()) {
            tagsContainer.innerHTML += `<button class="tag-btn" data-tag="${label}">${label}</button>`
        }
        // 显示第一个元素的标签
        const firstLetter = Object.keys(sortedLetterToLabels)[0]
        if (firstLetter) {
            firstLetterTags = sortedLetterToLabels[firstLetter]
            showFirstLetterTags()
        }
        const bookmarksContainer = document.getElementById("bookmarks-container")
        bookmarksContainer.innerHTML = "" // 清空现有的书签
        for (const issue of issues_data) {
            bookmarksContainer.innerHTML += `
                <a href="${issue.url}" target="_blank" class="bookmark" data-tags="${issue.labels.join(",")}" rel="noopener noreferrer">
                    <span class="bookmark-title">${issue.title}</span>
                    <div class="bookmark-desc">${issue.desc}</div>
                    <div class="bookmark-tags"><span>${issue.labels.join("</span><span>")}</span></div>
                </a>`
        }

        // 添加这行来附加事件监听器
        attachTagEventListeners()

        // 给字母附加事件监听器
        const letterItems = document.querySelectorAll(".letter-item")
        letterItems.forEach((item) => {
            item.addEventListener("click", () => {
                if (selectedTags.size === 0) {
                    const letter = item.dataset.letter
                    const tags = sortedLetterToLabels[letter] || []
                    const tagBtns = document.querySelectorAll(".tag-btn")
                    tagBtns.forEach((btn) => {
                        if (tags.includes(btn.dataset.tag)) {
                            btn.style.display = ""
                        } else {
                            btn.style.display = "none"
                        }
                    })
                }
            })
        })
        toggleLettersVisibility(true)
    }

    async function main() {
        try {
            if (!localStorage.getItem("githubToken") || !localStorage.getItem("bmRepo")) {
                showDialog()
                return
            }

            console.log(
                "\n %c TDC %c https://github.com/fenglingback/TDC \n",
                "color: #0ca7a4; background-image: linear-gradient(90deg, #555555 0%, #555555 100%); padding:5px 1px;",
                "color: #a277ff; background-image: linear-gradient(90deg, #555555 0%, #1d294d 100%); padding:5px 0;",
            )

            const repo = localStorage.getItem("bmRepo")
            const token = localStorage.getItem("githubToken")
            const headers = {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            }

            const issues = await getAllIssues(repo, headers)
            const labels = await extractLabels(issues)
            renderPage(issues, labels)
            document.getElementById("add-bookmark-btn").style.display = "flex"
        } catch (error) {
            console.error(error)
        }
    }

    main()

    const addBookmarkBtn = document.getElementById("add-bookmark-btn")

    addBookmarkBtn.addEventListener("click", () => {
        if (!localStorage.getItem("githubToken") || !localStorage.getItem("bmRepo")) {
            showDialog()
            return
        }

        const labels = Array.from(document.querySelectorAll(".tag-btn")).map((tagBtn) => tagBtn.dataset.tag)
        const dialog = document.createElement("div")
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h2>添加新书签</h2>
                <div class="url-container">
                    <input type="url" id="bookmark-url-input" placeholder="输入网址">
                    <button id="fetch-metadata-btn">建议</button>
                </div>
                <div id="add-tags-container">
                    <div id="chose-tags-container"></div>
                    <input type="text" id="bookmark-tags-input" placeholder="请选择或输入标签">
                    <div id="tags-list">
                        ${labels.map((label) => `<button class="tag" data-tag="${label}">${label}</button>`).join("")}
                    </div>
                </div>
                <input type="text" id="bookmark-title-input" placeholder="标题">
                <textarea id="bookmark-description-input" placeholder="描述"></textarea>
                <button id="save-bookmark-btn">保存书签</button>
                <button id="close-dialog-btn">关闭</button>
            </div>
        `
        document.body.appendChild(dialog)
        document.body.style.overflow = "hidden"

        const closeDialogBtn = document.getElementById("close-dialog-btn")
        const fetchMetadataBtn = document.getElementById("fetch-metadata-btn")
        const saveBookmarkBtn = document.getElementById("save-bookmark-btn")
        const urlInput = document.getElementById("bookmark-url-input")
        const titleInput = document.getElementById("bookmark-title-input")
        const descriptionInput = document.getElementById("bookmark-description-input")
        const choseTagsContainer = document.getElementById("chose-tags-container")
        const tagsInput = document.getElementById("bookmark-tags-input")
        const tagsList = document.getElementById("tags-list")
        const tags = document.querySelectorAll(".tag")

        function changeTagsListDisplay(isVisible) {
            tagsInput.style.borderRadius = isVisible ? "5px 5px 0 0" : "5px"
            tagsInput.style.borderBottom = isVisible ? "none" : ""
            tagsInput.style.outline = isVisible ? "none" : ""
            tagsList.style.display = isVisible ? "block" : "none"
        }

        function checkTagsListDisplay() {
            if (Array.from(tags).filter((tag) => tag.style.display !== "none").length === 0) {
                changeTagsListDisplay(false)
            } else {
                changeTagsListDisplay(true)
            }
        }

        function filterTags() {
            const unchosenTags = Array.from(tags).filter((tag) => !tag.classList.contains("chosen"))
            const inputValue = tagsInput.value.toLowerCase()
            for (const tag of unchosenTags) {
                if (tag.textContent.toLowerCase().includes(inputValue)) {
                    tag.style.display = "block"
                } else {
                    tag.style.display = "none"
                }
            }
            checkTagsListDisplay()
        }

        function addSubmitTag(text) {
            const tagBtn = document.createElement("button")
            tagBtn.classList.add("tag-btn")
            tagBtn.textContent = text
            tagBtn.dataset.tag = text
            tagBtn.addEventListener("click", remove)
            choseTagsContainer.appendChild(tagBtn)
            filterTags()
            return tagBtn
        }

        function remove(e) {
            const tagBtn = e.target
            if (!tagBtn.classList.contains("new")) {
                changeTagsListDisplay(true)
                const tag = tagBtn.dataset.tag
                const tagElement = document.querySelector(`.tag[data-tag="${tag}"]`)
                tagElement.classList.remove("chosen")
                tagElement.style.display = "block"
            }
            choseTagsContainer.removeChild(tagBtn)
        }

        tags.forEach((tag) => {
            tag.addEventListener("click", () => {
                tag.classList.add("chosen")
                tag.style.display = "none"
                tagsInput.value = ""
                addSubmitTag(tag.dataset.tag)
            })
        })

        tagsInput.addEventListener("focus", () => {
            checkTagsListDisplay()
        })

        tagsInput.addEventListener("input", () => {
            filterTags()
        })

        tagsInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const inputValue = tagsInput.value.trim()
                if (inputValue !== "") {
                    tagsInput.value = ""
                    const tagBtn = addSubmitTag(inputValue)
                    tagBtn.classList.add("new")
                }
            }
        })

        closeDialogBtn.addEventListener("click", () => {
            document.body.removeChild(dialog)
            document.body.style.overflow = ""
        })

        fetchMetadataBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`https://apis.vercel.app/site?url=${encodeURIComponent(urlInput.value)}`)
                const data = await response.json()

                if (response.ok) {
                    titleInput.value = data.title || ""
                    descriptionInput.value = data.description || ""
                } else {
                    alert("无法获取元数据。请手动输入信息。")
                }
            } catch (error) {
                console.error("Error fetching metadata:", error)
                alert("获取元数据时出错。请手动输入信息。")
            }
        })

        saveBookmarkBtn.addEventListener("click", async () => {
            const url = urlInput.value.trim()
            const title = titleInput.value.trim()
            const description = descriptionInput.value.trim()
            const tags = Array.from(document.querySelectorAll("#chose-tags-container .tag-btn")).map(
                (tagBtn) => tagBtn.dataset.tag,
            )

            if (!url || !title) {
                alert("请至少输入网址和标题。")
                return
            }

            const repo = localStorage.getItem("bmRepo")
            const token = localStorage.getItem("githubToken")

            try {
                const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
                    method: "POST",
                    headers: {
                        Authorization: `token ${token}`,
                        Accept: "application/vnd.github.v3+json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: title,
                        body: `${url}\n\n${description}`,
                        labels: tags,
                    }),
                })

                if (response.ok) {
                    alert("书签已成功保存！")
                    location.reload()
                } else {
                    alert("保存书签时出错。请稍后再试。")
                }
            } catch (error) {
                console.error("Error saving bookmark:", error)
                alert("保存书签时出错。请检查您的网络连接和 GitHub 令牌。")
            }
        })
    })
})

