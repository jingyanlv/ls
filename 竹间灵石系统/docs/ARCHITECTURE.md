# 竹间灵石系统架构

核心版本：1.0.0  
数据版本：1  
配置格式：`lingshi-config/v2`  
修改格式：`lingshi-patch/v2`

## 1. 设计目标

竹间是一个个人长期使用的任务—灵石—心愿系统。架构遵循“核心只定义规则和接口，具体内容由扩展提供”。目标不是建设大型第三方插件平台，而是让常见新增需求变成：新建一个扩展目录、写 `manifest.json` 和 `entry.js`、重建扩展清单。

以下目录视为稳定核心：

```text
core/
  runtime.js          注册表、事件总线、扩展加载器
  storage.js          数据读取、版本与持久化
  services.js         灵石、任务、商城公共服务
  config-engine.js    Config、Patch、差异预览
  theme-engine.js     主题令牌、资源、装饰层、声音
  shell.js            页面、设置页与 UI 插槽宿主
  boot.js             启动次序与故障兜底
```

具体任务、商品、页面、统计和主题全部位于 `extensions/`。除非公开 API 确实无法承载新能力，否则不修改核心。

## 2. 启动流程

1. `index.html` 加载稳定核心。
2. `extensions/registry.generated.js` 注册 manifest 并加载各扩展入口。
3. `boot.js` 创建 Shell 与 ExtensionLoader。
4. Loader 检查核心版本、必需依赖和循环依赖，并按拓扑顺序初始化扩展。
5. 单个扩展失败会写入 `Lingshi.errors`，其余扩展继续加载。
6. 数据种子只在对应集合为空时写入默认内容。
7. 主题商城桥接根据已注册主题自动生成解锁商品。
8. ThemeService 应用当前主题，Shell 根据页面注册表生成界面。

## 3. Manifest

每个扩展目录至少包含：

```text
my-extension/
  manifest.json
  entry.js
  assets/       # 可选
```

manifest 示例：

```json
{
  "id": "theme.example",
  "name": "示例主题",
  "version": "1.0.0",
  "type": "theme",
  "description": "说明",
  "entry": "entry.js",
  "dependencies": [],
  "optionalDependencies": [],
  "assets": ["assets/background.png"],
  "capabilities": ["theme.tokens", "theme.background"],
  "compatibleCoreVersion": "^1.0.0",
  "enabled": true
}
```

`id` 必须全局唯一。`dependencies` 使用扩展 id。加载器检查缺失依赖、循环依赖与核心主版本兼容。`capabilities` 目前用于审查和说明，后续可升级为更严格的能力门控。

新增或移除扩展后运行：

```powershell
./tools/build-registry.ps1
```

脚本自动扫描所有 `manifest.json` 并生成唯一的扩展索引；不需要手工修改 `index.html` 或核心代码。

## 4. Extension API

入口文件只注册工厂：

```js
Lingshi.defineExtension('extension.id', api => {
  api.register('systems', 'system.example', {
    label: '示例系统',
    publicApi: {}
  });
});
```

工厂可以使用：

- `api.coreVersion`：核心版本。
- `api.manifest`：当前扩展清单。
- `api.events`、`api.on()`：事件发布与订阅。
- `api.services`：公开服务集合。
- `api.registries`：只读访问已注册贡献。
- `api.register(kind,id,value)`：注册贡献。
- `api.registerSlot(slot,value)`：向 UI 插槽贡献 widget。
- `api.getState()`、`api.save()`：状态访问；业务扩展应优先调用公开服务。
- `api.toast()`、`api.openModal()`、`api.closeModal()`、`api.refresh()`：有限 UI 能力。

可用注册表：`taskTypes`、`productTypes`、`pages`、`statistics`、`settingsSections`、`themes`、`systems`、`dataSeeds`、`migrations`、`slots`。

模块间优先通过公开服务与事件通信，不应访问另一个扩展的闭包或私有变量。

## 5. Event API

事件总线为同步发布、故障隔离。监听器抛出的异常只记录到扩展错误列表。

当前事件：

- `extension.loaded`、`extensions.ready`
- `app.ready`
- `storage.saved`、`storage.replaced`
- `config.applied`
- `task.created`、`task.updated`、`task.removed`、`task.completed`
- `day.reset`
- `currency.earned`、`currency.spent`
- `shop.purchased`
- `theme.unlocked`、`theme.activated`、`theme.applied`

新增成就或统计系统时，监听事件即可，不需要修改 TaskService 或 EconomyService。

## 6. Task Type API

任务核心只管理生命周期。任务记录必须具有 `id` 与 `type`。对应 handler 可提供：

```js
{
  label: '标准修行',
  fields: [/* 设置页自动渲染的字段 schema */],
  validate(task) {},
  complete(task, context) { return { reward: 50 }; },
  renderCard(task, context) { return '<article>...</article>'; }
}
```

新增阅读、乐器、长期目标等任务类型时，新建 task-type 扩展并注册 handler。任务服务不增加 `switch`。

## 7. Shop Item API

商城核心只负责查找商品、检查余额、扣款、调用 handler、保存购买记录与失败退款。商品效果属于 handler：

```js
{
  label: '休息时长',
  fields: [],
  validate(product) {},
  canPurchase(context) { return true; },
  fulfill(context) { return { fulfilledAt: '...' }; },
  renderCard(product, context) { return '<article>...</article>'; }
}
```

新增游戏时间、声音包、藏品、生活事件等商品时，只新增 product-type 扩展。

## 8. Theme API

主题是独立扩展，通过 `themes` 注册表贡献：

```js
{
  name: '主题名',
  subtitle: '说明',
  icon: '境',
  tags: [],
  license: { price: 800, durationDays: 7 },
  preview: 'url(...) center/cover',
  tokens: { '--color-background-primary': '#...' },
  styles: 'body[data-theme="theme.id"] {...}',
  mount({ layer, events, services, state }) {
    // 只把粒子、装饰层挂到 layer
    return () => { /* 清理监听器或计时器 */ };
  },
  media: { sounds: { earn: null, purchase: null } }
}
```

核心 UI 只使用语义令牌，不包含赛博、水墨、二次元等名称判断。高级主题可提供全景背景、粒子、环境装饰、动画和声音；简单主题只提供 tokens 也能正常使用。`mount` 必须返回清理函数，切换主题时由 ThemeService 调用。

主题不能直接修改任务、商城或灵石。付费主题由 `system.theme-commerce` 自动转换成 `product.theme-unlock` 商品。

## 9. System API

完整子系统使用 `systems` 注册表，并通过其他注册表提供页面、设置、统计、任务类型或商品类型。子系统可把私有数据放在 `state.extensionData[extensionId]`，通过事件与核心交互。

新增成就系统的典型做法：

1. 新建 `extensions/systems/achievements/`。
2. manifest 依赖任务或经济相关扩展。
3. entry 监听 `task.completed`、`currency.earned`。
4. 数据存入自己的 `extensionData` 命名空间。
5. 注册页面、设置项或首页 widget。
6. 重建 registry。

核心无需修改。

## 10. UI Slot API

当前槽位：

- `home.top`
- `home.widgets`
- `home.bottom`
- `shop.sections`
- `themes.bottom`
- `statistics.cards`
- `statistics.bottom`

扩展示例：

```js
api.registerSlot('home.widgets', {
  order: 20,
  render(ctx) { return '<section>...</section>'; },
  mount(root, ctx) {}
});
```

## 11. 设置扩展

扩展向 `settingsSections` 注册 `{label, order, render, mount}`。Shell 自动生成墨房导航。新增设置项不需要修改 Shell。

## 12. 数据与迁移

运行数据包含 `schemaVersion`。StorageService 在读取时逐级迁移；扩展可在 `migrations` 注册表声明迁移。不可兼容的数据结构变更必须提高版本并提供迁移，不能让更新后的程序直接丢弃旧数据。

状态主要分为：用户资料、经济、任务、商城、主题访问、扩展开关、扩展私有数据。Config 导出不包含完成状态、交易历史、购买历史和主题租期。

## 13. Lingshi Config v2

```json
{
  "$schema": "lingshi-config/v2",
  "schemaVersion": 2,
  "profile": {},
  "settings": {},
  "tasks": [],
  "products": [],
  "extensionConfig": {}
}
```

## 14. Lingshi Patch v2

```json
{
  "$schema": "lingshi-patch/v2",
  "schemaVersion": 2,
  "operations": [
    { "op": "set", "collection": "tasks.items", "id": "learn-read", "field": "reward", "value": 60 },
    { "op": "multiply", "collection": "tasks.items", "where": { "field": "category", "equals": "learning" }, "field": "reward", "factor": 1.2 },
    { "op": "add", "collection": "shop.items", "value": { "id": "wish-x", "type": "product.custom" } },
    { "op": "remove", "collection": "shop.items", "id": "wish-old" },
    { "op": "disable", "extensionId": "extension.id" },
    { "op": "enable", "extensionId": "extension.id" },
    { "op": "installExtension", "value": { "id": "theme.data-only", "type": "theme", "contributions": {} } },
    { "op": "uninstallExtension", "extensionId": "theme.data-only" },
    { "op": "adjustBalance", "amount": 100, "label": "手动奖励" }
  ]
}
```

导入流程必须先调用 `preview()`，向用户显示字段级差异，再确认 `apply()`。应用前自动创建本机备份。扩展启用/停用在下次重新打开应用时完全生效。

## 15. 哪些文件不应频繁修改

原则上不应为增加具体内容而修改：

- `core/runtime.js`
- `core/storage.js`
- `core/services.js`
- `core/config-engine.js`
- `core/theme-engine.js`
- `core/shell.js`
- `core/boot.js`
- `index.html`
- `styles/core.css`

允许修改核心的情况：修复核心缺陷、扩展公开 API、数据迁移、通用可访问性或性能改进。新内容、新类型、新页面、新统计、新主题和新子系统应优先进入 `extensions/`。

## 16. 架构审查结论

当前架构可以在不修改核心的情况下加入：

- 新皮肤、背景图、粒子、动画与声音。
- 新任务类型及其字段、计分和卡片 UI。
- 新商品类型及其兑换效果。
- 新统计卡片。
- 新页面与设置页。
- 新首页/商城/统计 widget。
- 新成就、角色、藏品、日记、境界和长期目标子系统。

仍然有意保留的限制：这是可信的个人本地扩展系统，不会动态下载执行未知远程代码；新增代码扩展后需要运行一次 registry 构建脚本。这个限制显著降低安全风险和复杂度，同时保持“新增目录即可扩展”的主要目标。



## 新增扩展契约（2026-09-04）

扩展私有数据统一通过 `api.data.get(defaults)` 与 `api.data.save()` 访问自己的 `extensionData[extensionId]` 命名空间。扩展通过 `migrations` 注册 `{targetVersion,migrate(data,context)}`；核心在种子数据前执行幂等迁移，并记录 `extensions.migrationVersions[extensionId]`。

`system.daily-journal` 提供一日一页、心情、标签、关联任务、历史和搜索；删除使用墓碑。`system.focus-timer` 持久化 `startedAt`、`pausedAt` 和 `pauses[]`，显示时长从时间戳推导，不依赖定时器累加；结束后只追加 immutable session 并发布 `timer.session.completed`。`statistics.focus-time` 只通过公开 API 汇总今日、本周和分类时长。计时灵石默认关闭，以 `timerSessionId` 去重。

`system.sync-contract` 当前不联网，只预留 `createMeta`、`touch`、`tombstone`、`compare`、`resolve`、`registerProvider`。记录包含全局唯一 `id`、`updatedAt`、`revision`、`deletedAt`、`deviceId`。冲突依次按 revision、updatedAt、deviceId 确定性解决；墓碑防止异端复活。

完整配置的 `extensionConfig` 对应整个 `extensionData`，因此日记、活动计时、暂停区间和 session 随导入导出保留；Storage 备份保存完整 state。