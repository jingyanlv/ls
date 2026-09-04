# 批量配置说明

“导出完整配置”的 `extensionConfig` 包含日记、进行中的计时、暂停区间、完成 session、分类和同步契约元数据。导入完整配置时按扩展命名空间合并，未出现的命名空间保留；应用前会创建 `before-config-import` 完整状态备份。

`lingshi-patch/v2` 不应用于改写已完成 session。迁移日记或 session 时必须保留 id、updatedAt、revision、deletedAt、deviceId。安全顺序：先导出当前配置，再预览差异，最后确认应用。