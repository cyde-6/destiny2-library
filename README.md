# 命运 2 图鉴 · Destiny 2 Library

站点 / Site · `https://cyde-6.github.io/destiny2-library/`

## 简体中文

《命运 2》装备图鉴与传说书馆，可通过 GitHub Pages 免费托管。支持中英文装备检索、稀有度和装备属性筛选、复刻版本切换、传说书阅读及 Markdown 导出。在搜索栏启用「搜传说正文」即可按需加载正文索引。收藏和已读记录保存在当前浏览器，可在「我的收藏」中导出或合并导入 JSON 备份。

### 本地构建

需要 Python 3.11 或更新版本。首次构建会从 Bungie 下载双语清单分表，之后可复用缓存。可设置环境变量 `BUNGIE_API_KEY` 使用自己的 Bungie API 密钥。

```sh
python scripts/build_static.py --out dist
python scripts/preview.py
```

浏览器打开 <http://127.0.0.1:8080/>。可用 `--port` 更改预览端口，用 `--cache-dir` 更改缓存目录。已有包含 `en/` 和 `zh-chs/` 分表的版本目录时，可通过 `--raw-dir <版本目录>` 离线构建。使用 `--check-only` 可查看官方清单版本和相对于现有构建的变更状态。

### GitHub Pages

将源码推送到 `main`，在仓库的 **Settings → Pages → Build and deployment** 中将来源设为 **GitHub Actions**。可选的 `BUNGIE_API_KEY` 通过仓库的 Actions secret 配置。工作流会在推送到 `main` 后、每周三 UTC 18:00 及手动触发时构建和部署。生成的 `dist/` 和原始清单缓存由 Git 忽略。

### Bungie 同人内容声明

本项目是非官方同人项目。Bungie 未赞助、认可或管理本项目。《命运 2》及相关名称、图像和传说文本的权利归 Bungie 及相应权利人所有。MIT 许可证适用于项目代码。 [Bungie 同人内容政策](https://www.bungie.net/7/en/Legal/IntellectualPropertyTrademarks)

## English

Browse and search Destiny 2 gear and lore books in Chinese and English on a static GitHub Pages site. Filter gear by rarity and attributes, compare reissue icons, read lore books, and export Markdown. Turn on **Search Lore Text** to load the optional full-text index. Favorites and read marks are stored in your browser. Use Favorites to export a JSON backup or merge one into your current records.

### Build and preview locally

Use Python 3.11 or newer. The first build downloads the bilingual Bungie Manifest tables and caches them for later runs. Set `BUNGIE_API_KEY` in your environment if you have a key.

```sh
python scripts/build_static.py --out dist
python scripts/preview.py
```

Open <http://127.0.0.1:8080/>. Use `--port` to change the preview port, `--cache-dir` to change the cache location, or `--raw-dir <version-directory>` to build offline from a directory containing the cached `en/` and `zh-chs/` tables. Use `--check-only` to compare Bungie's current Manifest version with your existing build.

### Deploy to GitHub Pages

Push the source to `main` and set **GitHub Actions** as the source under **Settings → Pages → Build and deployment**. Add `BUNGIE_API_KEY` as an Actions secret if you use a key. The workflow builds and deploys on pushes to `main`, every Wednesday at 18:00 UTC, and on manual dispatch. Git ignores the generated `dist/` and raw Manifest cache.

### Bungie fan content and disclaimer

This is an unofficial fan project. Bungie does not sponsor, endorse, or administer it. Destiny 2 and its associated names, images, and lore belong to Bungie and their respective rights holders. The MIT license covers the project source code. [Bungie Fan Content Policy](https://www.bungie.net/7/en/Legal/IntellectualPropertyTrademarks)
