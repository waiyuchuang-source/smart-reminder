---
trigger: always_on
---

## 1. 基本原则

- **最小改动**：只改与需求直接相关的代码，不顺手重构
- **保留注释**：不删除、不修改与变更无关的注释和文档
- **显式类型**：禁止 `any`，用 `unknown` + 类型守卫替代
- **单一职责**：单文件不超过 300 行，超出则拆分

---

## 2. 禁止项

| 禁止 | 替代 |
|------|------|
| `useEffect` / `useLayoutEffect` | 事件回调、派生计算、SWR 生命周期回调 |
| 手写 `useMemo` / `useCallback` | React Compiler 自动优化 |
| `any` 类型 | 显式标注或 `unknown` |
| `as` 强制断言 | 类型守卫 / Zod 校验 |
| `eval` / `new Function` | 无例外 |
| 空 `catch {}` 吞掉错误 | 至少记录日志或上报 |
| 组件内直接调用 `fetch` / `axios` | 通过 service 层封装的 Hook 调用 |
| 直接操作 `localStorage` | 通过封装的 storage 工具访问 |
| `dangerouslySetInnerHTML`（未消毒） | 先用 sanitize 库处理 |

---

## 3. 状态管理

| 场景 | 方案 |
|------|------|
| 服务端数据 | SWR / React Query |
| 组件内简单状态 | `useState` |
| 深层嵌套数据更新 | `immer`（`produce` / `useImmer`） |
| 高频交互状态 | Signals / Zustand |
| URL 状态 | `nuqs` / `useSearchParams` |

**关键约束**：
- 2 层以上的嵌套展开 → 必须用 `immer`
- 如非必要，禁止新建 `Context`

---

## 4. 样式（Tailwind CSS v4）

- **禁止** className 中出现 `px` 单位（`1px` 除外，写作 `w-px`）
- **禁止**硬编码 hex/rgb，使用设计令牌类名
- **禁止**百分比任意值 `w-[50%]`，用分数写法 `w-1/2`
- 条件类名合并使用 `cn()` 工具函数
- 后端返回的动态色值允许用 `style`，静态部分仍用 Tailwind

---

## 5. 性能

- 超过 50 项的列表 → 虚拟滚动
- 图片 → `next/image`，指定尺寸
- 非首屏模块 → `dynamic()` / `React.lazy()`
- 避免请求瀑布 → 并行请求或独立 SWR Hook
- 加载态 → Skeleton 骨架屏，禁止全局 `Loading...`

---

## 6. UI

- 使用ui-ux-pro-max-skill这个skill

---

## 7. 自检清单

生成代码后内部验证（不需要输出）：

- [ ] 无 `useEffect`
- [ ] 无手写 `useMemo` / `useCallback`
- [ ] 无 `any`
- [ ] 无 `px` 任意值
- [ ] 无硬编码颜色
- [ ] 深层更新用了 `immer`
- [ ] 无空 `catch`
- [ ] 保留了无关注释

