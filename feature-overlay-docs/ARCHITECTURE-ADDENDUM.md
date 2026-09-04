## 新增扩展契约（2026-09-04）

扩展私有数据统一通过 `api.data.get(defaults)` 与 `api.data.save()` 访问自己的 `extensionData[extensionId]` 命名空间。扩展通过 `migrations` 注册 `{targetVersion,migrate(data,context)}`；核心在种子数据前执行幂等迁移，并记录 `extensions.migrationVersions[extensionId]`。

`system.daily-journal` 提供一日一页、心情、标签、关联任务、历史和搜索；删除使用墓碑。`system.focus-timer` 持久化 `startedAt`、`pausedAt` 和 `pauses[]`，显示时长从时间戳推导，不依赖定时器累加；结束后只追加 immutable session 并发布 `timer.session.completed`。`statistics.focus-time` 只通过公开 API 汇总今日、本周和分类时长。计时灵石默认关闭，以 `timerSessionId` 去重。

`system.sync-contract` 当前不联网，只预留 `createMeta`、`touch`、`tombstone`、`compare`、`resolve`、`registerProvider`。记录包含全局唯一 `id`、`updatedAt`、`revision`、`deletedAt`、`deviceId`。冲突依次按 revision、updatedAt、deviceId 确定性解决；墓碑防止异端复活。

完整配置的 `extensionConfig` 对应整个 `extensionData`，因此日记、活动计时、暂停区间和 session 随导入导出保留；Storage 备份保存完整 state。