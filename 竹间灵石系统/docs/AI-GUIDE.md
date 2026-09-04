# 给未来 AI：竹间灵石系统维护说明

请先阅读同目录的 `ARCHITECTURE.md`。

这是一个个人长期使用的任务—灵石—心愿应用。核心位于 `core/`，具体内容全部位于 `extensions/`。新增功能时优先新增一个扩展目录，不要直接把具体任务、商品、主题或页面写入核心。

每个扩展需要 `manifest.json` 与 `entry.js`。入口调用 `Lingshi.defineExtension(id, factory)`，通过 `api.register()` 注册任务类型、商品类型、页面、统计、主题、设置页、系统或数据种子；通过 `api.registerSlot()` 向已有页面插入 widget；跨模块通信使用事件总线。

核心商城不认识现金、休息、皮肤等具体类型；核心任务不认识学习、锻炼、阅读等具体类型。请把类型行为放在 handler 中。主题只能改变设计令牌、样式、装饰层和媒体，不能修改经济或任务业务。

新增扩展后运行 `tools/build-registry.ps1`。不要手工编辑 `extensions/registry.generated.js`。

批量数据修改优先生成 `lingshi-patch/v2`。合法操作为 `set`、`add`、`remove`、`multiply`、`enable`、`disable`、`installExtension`、`uninstallExtension`、`adjustBalance`。只输出合法 JSON，不要 Markdown 围栏。使用已有稳定 id；新增内容生成唯一、可读的小写英文 id。应用前必须让用户查看差异预览。

如果需求是新皮肤、新商品类型、新任务类型、新统计、新页面或完整子系统，请先证明已有 registry/API/slot/event 不能满足，再考虑修改核心。非兼容数据变化必须提高 `schemaVersion` 并提供迁移。



## 日记、拾时与未来联动

日记、计时分别由 `system.daily-journal`、`system.focus-timer` 管理，统计由 `statistics.focus-time` 监听完成事件。不得跨扩展直接修改私有数据。计时必须保留开始时间和暂停区间，完成 session 只追加。

未来联动仅有 `system.sync-contract` 数据契约，不得接入真实云服务。可同步记录必须保留 id、updatedAt、revision、deletedAt、deviceId。

完整批量配置的 extensionConfig 承载全部扩展数据；导入时不能用空对象误清其他命名空间。