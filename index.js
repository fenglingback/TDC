document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input")
    // 判断设备类型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log("是否为移动设备：", isMobile)

    // 相关标签
    const relatedTags = new Set()
    // 已选标签
    const selectedTags = new Set()
    let debounceTimer
    let tinyPinyin
    const sortedLetterToLabels = {}
    let activeLetter

    // 处理不同设备的点击事件
    function handleClick(element, func) {
        if (isMobile) {
            let isMove = false
            element.addEventListener("touchmove", (e) => {
                isMove = true
            })
            element.addEventListener("touchend", (e) => {
                if (!isMove) {
                    func(e)
                }
                isMove = false
            })

        } else {
            element.addEventListener("click", func)
        }
    }

    function debounce(func, delay) {
        return function () {
            const args = arguments
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => func.apply(this, args), delay)
        }
    }

    function filterBookmarks() {
        const bookmarks = document.querySelectorAll(".bookmark")
        const searchTerm = searchInput.value.trim().toLowerCase()

        bookmarks.forEach((bookmark) => {
            const title = bookmark.querySelector(".bookmark-title").textContent.toLowerCase()
            const desc = bookmark.querySelector(".bookmark-desc").textContent.toLowerCase() || ""
            const tags = new Set(bookmark.dataset.tags.split(","))

            // 标签匹配，如果没有任何标签被选中，或者bookmark包含所有选中的标签
            const matchesTags = selectedTags.size === 0 || [...selectedTags].every((tag) => tags.has(tag))
            const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm)

            const isVisible = matchesTags && matchesSearch
            bookmark.style.display = isVisible ? "" : "none"

            if (isVisible) {
                tags.forEach((tag) => relatedTags.add(tag))
            }
        })
        // console.log("相关标签：", relatedTags)

        // 每次过滤后更新字母导航栏
        const hasActiveFilters = selectedTags.size > 0 || searchTerm.length > 0
        if (hasActiveFilters) {
            toggleLettersVisibility(false)
            updateRelatedTagsVisibility()
        } else {
            toggleLettersVisibility(true)
            showTagsForLetter(activeLetter)
        }
        relatedTags.clear()
    }

    function updateRelatedTagsVisibility() {
        const tagButtons = document.querySelectorAll(".tag-btn")
        tagButtons.forEach((button) => {
            const tag = button.dataset.tag
            if (relatedTags.has(tag)) {
                button.style.display = ""
            } else {
                button.style.display = "none"
            }
        })
    }

    const debouncedFilterBookmarks = debounce(filterBookmarks, 500)

    searchInput.addEventListener("input", debouncedFilterBookmarks)

    // 将标签按钮事件侦听器设置移至单独的功能
    function attachTagEventListeners() {
        const tagButtons = document.querySelectorAll(".tag-btn")
        tagButtons.forEach((button) => {
            const handleTagSelection = (e) => {
                e.preventDefault()
                const tag = button.dataset.tag
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag)
                    button.classList.remove("active")
                } else {
                    selectedTags.add(tag)
                    button.classList.add("active")
                }

                // 清空搜索框
                searchInput.value = ""

                filterBookmarks()
            }

            handleClick(button, handleTagSelection)
        })
    }


    // 将字母按钮事件侦听器设置移至单独的功能
    function attachLetterEventListeners() {
        const letterItems = document.querySelectorAll(".letter-item")
        letterItems.forEach((item) => {
            const handleLetterSelection = (e) => {
                e.preventDefault()
                if (selectedTags.size === 0 && searchInput.value.length === 0) {
                    const letter = item.dataset.letter
                    showTagsForLetter(letter)
                }
            }

            handleClick(item, handleLetterSelection)
        })
    }

    // 控制字母按钮的可见性
    function toggleLettersVisibility(show) {
        const lettersContainer = document.getElementById("letters-container")
        lettersContainer.style.display = show ? "" : "none"
    }

    // 将书签事件侦听器设置移至单独的功能
    function attachBookmarkEventListeners() {
        const bookmarks = document.querySelectorAll(".bookmark")
        bookmarks.forEach((bookmark) => {
            const desc = bookmark.querySelector(".bookmark-desc")

            if (isMobile) {
                // 在移动设备上，点击书签时显示描述
                handleClick(bookmark, (e) => {
                    e.preventDefault()
                    if (!bookmark.classList.contains("bookmark-hover")) {
                        bookmark.classList.add("bookmark-hover")
                        desc.style.display = "block"
                    }
                })
                // 触摸移动时隐藏描述
                bookmark.addEventListener("touchmove", () => {
                    bookmark.classList.remove("bookmark-hover")
                    desc.style.display = ""
                })
                // 按钮点击时在新标签页中打开书签链接
                const target = bookmark.querySelector(".bookmark-target")
                handleClick(target, (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(bookmark.href, "_blank")
                    if (bookmark.classList.contains("bookmark-hover")) {
                        bookmark.classList.remove("bookmark-hover")
                        desc.style.display = ""
                    }
                })
            } else {
                bookmark.addEventListener("mouseover", () => {
                    bookmark.classList.add("bookmark-hover")
                    desc.style.display = "block"
                })
                bookmark.addEventListener("mouseout", () => {
                    bookmark.classList.remove("bookmark-hover")
                    desc.style.display = ""
                })
            }
        })
    }

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
                [url, desc] = issue.body.split("\n\n")
            } else if (issue.body.includes("\r\n\r\n")) {
                [url, desc] = issue.body.split("\r\n\r\n")
            } else {
                [url, desc] = [issue.body, ""]
            }

            return {
                title: issue.title,
                url: url,
                desc: desc,
                labels: issue.labels.map((label) => label.name),
            }
        })

        // console.log(issues_data)
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

        // 按字母顺序重新排列这个映射并赋值给全局变量sortedLetterToLabels
        for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
            if (letterToLabels[letter]) {
                sortedLetterToLabels[letter] = letterToLabels[letter].sort()
            }
        }
        // console.log(sortedLetterToLabels)
    }

    // 点击字母时显示对应的标签
    function showTagsForLetter(letter) {
        document.querySelectorAll(".letter-item").forEach(item => item.classList.remove("active"))
        activeLetter = letter
        document.querySelector(`.letter-item[data-letter="${letter}"]`).classList.add("active")
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
        // 初始化时显示第一个字母的标签
        if (!activeLetter) {
            showTagsForLetter(Object.keys(sortedLetterToLabels)[0])
        }
        const bookmarksContainer = document.getElementById("bookmarks-container")
        bookmarksContainer.innerHTML = "" // 清空现有的书签
        for (const issue of issues_data) {
            bookmarksContainer.innerHTML += `
                <a href="${issue.url}" target="_blank" class="bookmark" data-tags="${issue.labels.join(",")}" rel="noopener noreferrer">
                    <div class="bookmark-info">
                        <span class="bookmark-title">${issue.title}</span>
                        <div class="bookmark-desc">${issue.desc}</div>
                        <div class="bookmark-tags"><span>${issue.labels.join("</span><span>")}</span></div>
                    </div>
                    ${isMobile ? `<div class="bookmark-target"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg></div>` : ""}
                </a>`
        }

        // 给书签附加事件监听器
        attachBookmarkEventListeners()

        // 给标签附加事件监听器
        attachTagEventListeners()

        // 给字母附加事件监听器
        attachLetterEventListeners()
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
            await extractLabels(issues)
            renderPage(issues, sortedLetterToLabels)
            document.getElementById("add-bookmark-btn").style.display = "flex"
        } catch (error) {
            console.error(error)
        }
    }

    main()

    const addBookmarkBtn = document.getElementById("add-bookmark-btn")

    handleClick(addBookmarkBtn, (e) => {
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
                <div class="button-container">
                    <button id="save-bookmark-btn">保存书签</button>
                    <button id="close-dialog-btn">关闭</button>
                </div>
            </div>
        `
        document.body.appendChild(dialog)
        document.body.style.overflow = "hidden"

        const closeDialogBtn = document.getElementById("close-dialog-btn")
        const fetchMetadataBtn = document.getElementById("fetch-metadata-btn")
        const saveBookmarkBtn = document.getElementById("save-bookmark-btn")
        const urlInput = document.getElementById("bookmark-url-input")
        if (!isMobile) {
            urlInput.focus()
        }
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
            // 如果所有标签都被隐藏，则隐藏标签列表
            if (Array.from(tags).filter((tag) => tag.style.display !== "none").length === 0) {
                changeTagsListDisplay(false)
            } else {
                changeTagsListDisplay(true)
                tagsInput.focus()
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

