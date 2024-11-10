# TDC
Tags-driven Collector，标签驱动的收集器，浏览器书签的替代品，帮助您摆脱书签与浏览器强绑定的痛苦，并实现真正的多端同步。

## Deployment(Writting...)

### 准备工作

1. 【创建仓库】点击此处👉[通过模板创建仓库](https://github.com/new?template_name=TDC&template_owner=fenglingback)

2. 【启用Pages】在仓库的 `Settings` 中 `Pages->Build and deployment->Source` 下面选择 `Github Actions`。


### 书签导入的两种方式

1. 通过configs.json导入书签（默认、推荐）`🌟`

> [!TIP]  
> 适合使用编辑器、会用git、有批量导入需求的用户，但移动端导入不方便


只需要更改 `configs.json` 文件中的 `Bookmarks` 字段即可，具体格式如下：

```json
{
    "Bookmarks": [
        {
            "title": "Google",
            "url": "https://www.google.com",
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

保存后，提交到仓库，action会自动构建你的书签页面。

<hr>


2. 通过issues导入书签

> [!TIP]  
> 有图形化操作界面，适合有移动端导入需求、不会用git的用户，但不能批量导入






