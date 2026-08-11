# 每日动画守护机制设计

## 目标

每天北京时间 00:00 生成 1 至 20 的当天维护次数；随后每小时无条件使用不可变 benchmark 覆写主页动画，提交到 `main`。任何一次覆写前发现动画偏离 benchmark 时，系统自动恢复并在 README 主页卡片中以预警色标记当天数字。

## 范围与约束

- 被守护的产物仅为 `TTTimsy-contribution-animation.svg` 与 `TTTimsy-contribution-animation-dark.svg`。
- benchmark 是自动化的唯一真源。日常脚本与维护工作流不得写入 `benchmark/`。
- 每次维护均须创建提交；动画内容相同也必须使用空提交。
- 提交直接推送默认分支，并使用仓库所有者对应的 GitHub noreply 邮箱，使其满足 Contributions 的作者归属条件。
- README 中的状态卡为即时执行记录；Contribution 图最多可能延迟 24 小时，因此只能作为延后核验。

## 文件与职责

| 文件 | 职责 |
| --- | --- |
| `benchmark/TTTimsy-contribution-animation.svg` | 只读的浅色正确动画样本。 |
| `benchmark/TTTimsy-contribution-animation-dark.svg` | 只读的深色正确动画样本。 |
| `benchmark/manifest.json` | 两个样本的 SHA-256 哈希，用于发现 benchmark 本身被改动。 |
| `automation/daily-maintenance-state.json` | 当天日期、随机次数、已完成次数、异常标志和最近维护时间。 |
| `scripts/daily-animation-sentinel.cjs` | 可测试的状态决策、哈希比对、覆写和 README 状态卡渲染函数。 |
| `tests/verify_daily_animation_sentinel.cjs` | 守护脚本的行为测试。 |
| `.github/workflows/daily-animation-sentinel.yml` | 00:00 初始化和逐小时维护的 GitHub Actions 工作流。 |
| `README.md` | 含有状态卡的明确开始/结束标记；脚本仅更新标记内内容。 |

## 运行流程

1. 工作流以 UTC `0 16 * * *` 在北京时间 00:00 触发初始化。它生成 `N`（含端点的 1–20 随机整数），创建当天状态文件，渲染 README 守护卡并提交一次“排班初始化”提交。
2. 同一工作流另在每小时的整点触发。若状态日期不是当天，说明 00:00 调度延迟或遗漏，则立即补建当天状态，保证当天进入可维护状态。
3. 对于状态中的每一小时维护：若 `completed < planned`，脚本先读取产物并与 benchmark 比对，再无条件复制 benchmark 到两个主页 SVG。即使完全相同，也将状态完成数加一并提交。
4. 覆写前任何一份动画不一致即设定 `alert: true`。该标志在当天不可清除；README 将当天维护数字由暖金色切换为朱红色并显示“已自动恢复”。
5. 每次维护提交使用 `git commit --allow-empty`。因此当天预期自动提交数是 `N + 1`：一条 00:00 排班初始化提交，及 `N` 条覆写提交。状态卡同时显示 `N`、`completed/N`、预计提交数、实际维护时间和预警状态。
6. 状态在完成 N 次后不再产生维护提交，直至下一个北京时间日期。手动触发工作流可运行同一逻辑，但不会重置已存在的当天状态。

## 主页状态卡

README 的标记内容采用暖金色、深酒红色、棕色和低饱和米色：

- 标题为“Animation Sentinel / 动画守护”。
- 大号数字显示当天的 `N`，并以一排小圆点显示 `completed/N`。
- 正常状态使用暖金色；预警状态使用朱红色，并带有“发现偏差 · 已覆写恢复”的文案。
- 显示“预计提交 N+1 条”，使 Contributions 与每日维护目标可以直接对照；Contribution 图的刷新滞后不改变 README 的即时状态。

## 可靠性与失败处理

- 工作流设置 `contents: write`、并发组和 `cancel-in-progress: false`，防止相邻小时互相取消。
- 每小时任务从默认分支最新提交 checkout，更新后以 `git pull --rebase` 再 push，短暂冲突时重试有限次数。不能安全 push 时工作流失败，README 不伪造成功。
- GitHub 可能延迟或遗漏整点调度。后续小时任务根据状态中的 `completed` 执行一次补偿维护，并记录实际时间；它不伪造错过小时的多个提交。
- benchmark 哈希不匹配时脚本立即失败，拒绝把不可信的 benchmark 覆写到主页产物。
- 工作流触发路径不含由它写入的 SVG、README 和状态文件，避免维护提交再次触发生成工作流。

## 验证策略

新增测试必须先失败，随后验证以下行为：

1. 初始化产生包含边界值 1 和 20 的合法次数，并拒绝无效状态。
2. benchmark 清单哈希正确时允许覆写，任一哈希不同即失败且不写主页 SVG。
3. 相同产物仍会被覆写、计数并产生可供工作流创建空提交的维护结果。
4. 不同产物会在覆写后保留 `alert: true`，并渲染朱红预警卡。
5. README 仅替换明确标记间的卡片，标记缺失时失败，不破坏其余内容。
6. 已完成 `N` 次时不再安排维护；跨日或缺失状态时会安全初始化。
7. 工作流的 cron、贡献作者、空提交、benchmark 路径与状态文件路径均由静态测试验证。

## 非目标

- 不尝试阻止仓库管理员手工修改 benchmark；其不可变性是自动化策略与代码审查边界，而非对管理员的权限限制。
- 不承诺 Contribution 图的即时刷新，也不把它作为唯一成功判定。
- 不修改动画生成器或现有动画设计；守护机制只复制已批准的 benchmark。
