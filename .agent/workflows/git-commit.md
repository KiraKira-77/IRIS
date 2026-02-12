---
description: 每次完成功能后自动整理并提交 Git
---

# 自动 Git 提交流程

每当一个功能/任务完成后（通常在 notify_user 之前），执行以下步骤：

// turbo-all

1. 查看变更文件：运行 `git status` 和 `git diff --stat` 了解改动范围
2. 暂存所有变更：运行 `git add -A`
3. 整理 commit message，格式如下：

   ```
   feat/fix/refactor/chore(scope): 简短描述

   - 改动点 1
   - 改动点 2
   - 改动点 3
   ```

   - scope 用模块名，如 standards、types、mock、plan 等
   - 描述用中文，50 字以内
   - body 列出主要改动点

4. 执行提交：运行 `git commit -m "整理好的 commit message"`
5. 提交完成后在 notify_user 中附带提交信息摘要
