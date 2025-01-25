<h1 align="center">TDC</h1>

<p align="center">书签分类不够细？书签与浏览器过度绑定以至于被浏览器牵着鼻子走？多端同步？</p>
<p align="center">Tags-driven Collector，标签驱动的收集器，浏览器书签的替代品，帮助您摆脱书签与浏览器强绑定的痛苦，实现真正的多端同步</p>

| PC | 移动端 |
| :---: | :---: |
| ![TDCpc](https://img.picgo.net/2024/11/11/TDCpc10ae908c385d605f.png) | ![TDCmobile](https://img.picgo.net/2024/11/11/TDCmobile47c581fd394c964d.jpg) |


## Deployment

### 准备工作

1. 【创建仓库】创建一个 `私密` 仓库

2. 【创建 Token】创建一个 `Token`：

    [classic token](https://github.com/settings/tokens) -> Generate new token（选classic那个） -> Expiration（选No expiration） -> 勾选 `repo` 项 -> Generate token


<hr>

### 通过issues导入书签

1. 点击 `Issues`，然后点击 `New issue` 新建一个issue，每个issue就是一个书签

2. 填写 `title`，内容是书签名，例如：`Github`

3. 选填 `description`，格式为：`书签链接[两个换行]书签描述`，例如：

```
https://github.com

代码托管平台，资源库
```

> [!WARNING]  
> 严格遵循 `书签链接[两个换行]书签描述` 这个格式，否则会导致导入失败。

> [!NOTE]  
> 书签描述是 `可选的`，不填的话就不会显示。

4. 右边的 `Labels` 的 `⚙` 中添加已有的标签。如果想要添加新标签，在其中的 `Filter labels` 搜索框中输入新标签的名称，然后点击 `Create new label` 就好了

5. 管理标签可以在 `Issues` 页面中点击 `Labels`，可以对标签进行新增、编辑、删除等操作

<hr>

### 获取你的书签页面

1. 打开 https://fenglingback.github.io/TDC

2. 输入你的 `Token` 和 `仓库` 后保存，成功后你的token会被保存到浏览器的本地存储中

3. 等待几秒钟，你的书签页面就生成了


## 致谢

- [tiny-pinyin](https://github.com/creeperyang/pinyin)，一款超轻量级的汉字转拼音库