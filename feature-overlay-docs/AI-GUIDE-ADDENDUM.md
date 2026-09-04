## 日记、拾时与未来联动

日记、计时分别由 `system.daily-journal`、`system.focus-timer` 管理，统计由 `statistics.focus-time` 监听完成事件。不得跨扩展直接修改私有数据。计时必须保留开始时间和暂停区间，完成 session 只追加。

未来联动仅有 `system.sync-contract` 数据契约，不得接入真实云服务。可同步记录必须保留 id、updatedAt、revision、deletedAt、deviceId。

完整批量配置的 extensionConfig 承载全部扩展数据；导入时不能用空对象误清其他命名空间。