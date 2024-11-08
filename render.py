import json
from jinja2 import Environment, FileSystemLoader


with open('configs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

name = data['Name']

# 获取书签数据
bookmarks = data['Bookmarks']
# print(bookmarks)

# 获取所有标签
all_tags = list({tag for bookmark in bookmarks for tag in bookmark['tags']})
# print(all_tags)



# 创建模板加载器
templateLoader = FileSystemLoader(searchpath="./")

# 创建模板环境
templateEnv = Environment(loader=templateLoader)

# 加载模板文件
template = templateEnv.get_template("index_template.html")

# 将数据渲染到模板中，并将结果写入目标文件
with open('index.html', 'w', encoding='utf-8') as f:
    result = template.render(all_tags=all_tags, bookmarks=bookmarks, name=name)
    f.write(result)

