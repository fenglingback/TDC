<h1 align="center">TDC</h1>

<p align="center">Tags-driven Collector，标签驱动的收集器，浏览器书签的替代品，帮助您摆脱书签与浏览器强绑定的痛苦，并实现真正的多端同步。</p>

| PC | 移动端 |
| :---: | :---: |
| ![TDCpc](https://img.picgo.net/2024/11/11/TDCpc10ae908c385d605f.png) | [![TDCmobile](https://img.picgo.net/2024/11/11/TDCmobilea204c9413afe7330.md.jpg)](https://www.picgo.net/image/TDCmobile.oYDclu) |


## Deployment

### 准备工作

1. 【创建仓库】点击此处👉[通过模板创建仓库](https://github.com/new?template_name=TDC&template_owner=fenglingback)

2. 【启用Pages】在仓库的 `Settings` 中 `Pages->Build and deployment->Source` 下面选择 `Github Actions`。

3. 【从以下两种书签导入方式选出适合你的那种，然后禁用另一种的工作流】在仓库的 `Actions` 中，左侧有 `Render by json and Deploy Pages` 和 `Render by issues and Deploy Pages` 两个工作流，对应以下两种导入方式，选择适合你的，然后禁用另一个：点击另一个，在 `Filter workflow runs` 搜索框旁边的 `···` 中选择 `Disable workflow` 禁用它。 



### 1. 通过configs.json导入书签（默认、推荐）`🌟`

> [!TIP]  
> 对应的是 `Render by json and Deploy Pages` 工作流  
> 适合使用编辑器、会用git、有批量导入需求的用户，但移动端导入不方便


书签的增删改都在 `configs.json` 文件中的 `Bookmarks` 字段，具体格式如下：

```json
{
    "Bookmarks": [
        {
            "title": "Google",
            "url": "https://www.google.com",
            "desc": "一个搜索引擎",
            "tags": [
                "搜索"
            ]
        },
        {
            "title": "Github",
            "url": "https://github.com",
            "tags": [
                "code",
                "资源"
            ]
        }
    ]
}
```

`title` 是书签名，`url` 是书签链接，`tags` 是书签的标签。另外，`desc` 是书签的描述，可选。

保存后，提交到仓库，每一次修改提交，都会触发action自动构建你的书签页面。

<hr>


### 2. 通过issues导入书签

> [!TIP]  
> 对应的是 `Render by issues and Deploy Pages` 工作流  
> 有图形化操作界面，适合有移动端导入需求、不会用git的用户，但不能批量导入


> [!IMPORTANT]  
> 首先需要修改render.py，把 `username = fenglingback` 和 `repo_name = TDC` 中的 `fenglingback` 和 `TDC` 分别替换为你的用户名和仓库名，然后把文件末尾的 `render(*get_data_by_json())` 注释或删除，把 `render(*get_data_by_issues())` 取消注释，然后保存。


1. 点击 `Issues`，然后点击 `New issue` 新建一个issue，每个issue就是一个书签

2. 填写 `title`，格式为：`书签名[空格]书签链接`，例如：`Github https://github.com`

3. 选填 `description`，内容是书签的描述

4. 右边的 `Labels` 的 `⚙` 中添加已有的标签。如果想要添加新标签，在其中的 `Filter labels` 搜索框中输入新标签的名称，然后点击 `Create new label` 就好了

5. 管理标签可以在 `Issues` 页面中点击 `Labels`，可以对标签进行新增、编辑、删除等操作


增删改issue、为issue增删标签，都会触发action自动构建你的书签页面。


## 书签页面地址

在仓库的 `Settings` 中的 `Pages` 页面有一个 `Visit site` 的按钮，点击它就可以访问你的书签页面了，你也可以把地址保存到本地方便访问。