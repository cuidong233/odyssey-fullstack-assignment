# Odyssey Fullstack Developer Assignment

This repository contains the assignment brief for the Odyssey Fullstack Developer interview project.

The goal of the assignment is to build a small, production-minded restaurant operations product using Odyssey's preferred fullstack architecture. Candidates are expected to create a new project from scratch, implement both frontend and backend features, and demonstrate strong judgment in architecture, type safety, UX, testing, and AI-assisted development.

## What This Assignment Is About

You will build a restaurant dashboard and ordering system with:

- a polished dashboard UI
- a reusable design system
- restaurant operations pages such as Home, Settings, CRM, Orders, and Menu
- a backend-backed ordering flow
- PostgreSQL persistence with Drizzle ORM
- generated API contracts and generated frontend client/hooks
- local development scripts, seed data, and targeted tests

The assignment is designed to evaluate how you build, not only what you build.

## Required Stack

The implementation should use:

- pnpm workspace and Turborepo
- `apps/dashboard`: Expo + React Native + Web
- `services/backend`: Hono on Cloudflare Workers
- PostgreSQL + Drizzle ORM
- drizzle-zod
- OpenAPI generation
- Orval-generated client/hooks
- React Query
- shared packages for UI, utilities, and types

The expected project shape is roughly:

```text
apps/dashboard
services/backend
packages/shared
packages/types
packages/api-client
```

Alternative stacks such as Next.js, NestJS, Prisma, tRPC, Supabase, Firebase, or handwritten frontend API types should not replace the required architecture.

## Main Product Scope

The dashboard should include:

- Home
- Settings
- CRM
- Orders
- Menu
- a dedicated UI library or design system route

The backend should support:

- menu categories and menu items
- customers
- orders and order items
- ordering-related business settings
- order creation, filtering, detail views, and valid status transitions
- customer order history and spend summaries
- dashboard summary data

Backend behavior should be deliberate and validated. For example, the server should reject invalid order payloads, reject unavailable menu items, calculate or verify totals server-side, and enforce valid order state transitions.

## Architecture Expectations

The preferred contract flow is:

```text
Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> generated frontend types/hooks
```

Important expectations:

- persisted data truth starts in the Drizzle schema
- API contracts are generated instead of manually duplicated
- frontend API types come from generated/shared types
- frontend data fetching uses generated hooks
- presentational components stay focused on UI
- business logic lives in hooks, services, or backend modules
- reusable UI patterns become shared components
- design tokens are centralized

## Expected Scripts

A completed implementation should expose scripts similar to:

```bash
pnpm dev:dashboard
pnpm dev:backend
pnpm gen:contract
pnpm lint
pnpm typecheck
pnpm test
```

## Deliverables

Candidates should submit:

- a GitHub repository
- local setup and run instructions
- seed or bootstrap instructions
- a short explanation of architecture decisions
- a short note on tradeoffs or incomplete areas

An optional Loom walkthrough may also be included.

## Source Document

The original assignment brief is available in:

```text
fullstack_developer_assignment_ody(1).md
```

---

# Odyssey 全栈开发面试项目说明

本仓库包含 Odyssey Fullstack Developer 面试项目的任务说明。

这个项目要求候选人从零创建一个小型但接近真实产品的餐厅运营系统，使用 Odyssey 偏好的全栈技术栈和架构方式。评估重点不仅是功能是否完成，也包括前端质量、后端设计、类型安全、架构判断、用户体验、测试意识，以及如何有效使用 AI 工具完成开发。

## 这个项目是做什么的

你需要实现一个餐厅运营 dashboard 和订单系统，包含：

- 视觉完成度较高的管理后台
- 可复用的设计系统
- Home、Settings、CRM、Orders、Menu 等业务页面
- 后端真实支撑的点单和订单流程
- 使用 PostgreSQL 和 Drizzle ORM 持久化数据
- 生成式 API 契约和生成式前端 client/hooks
- 本地开发脚本、种子数据和关键测试

这个作业重点考察“你如何构建系统”，而不只是“是否做出了页面”。

## 必须使用的技术栈

实现时应使用：

- pnpm workspace 和 Turborepo
- `apps/dashboard`：Expo + React Native + Web
- `services/backend`：运行在 Cloudflare Workers 上的 Hono
- PostgreSQL + Drizzle ORM
- drizzle-zod
- OpenAPI 生成
- Orval 生成的 client/hooks
- React Query
- 用于 UI、工具函数和类型的 shared packages

推荐的项目结构大致如下：

```text
apps/dashboard
services/backend
packages/shared
packages/types
packages/api-client
```

不要用 Next.js、NestJS、Prisma、tRPC、Supabase、Firebase 或手写前端 API 类型来替代指定技术栈。

## 主要产品范围

Dashboard 至少应包含：

- Home
- Settings
- CRM
- Orders
- Menu
- 一个专门展示 UI library 或 design system 的页面/路由

后端至少应支持：

- 菜单分类和菜单项
- 客户记录
- 订单和订单项
- 与点单相关的业务设置
- 创建订单、订单筛选、订单详情和合法状态流转
- 客户订单历史与消费金额汇总
- Home 页所需的汇总数据

后端逻辑应当是明确且经过校验的。例如：服务端应拒绝无效订单、拒绝不可售菜单项、在服务端计算或校验总价，并强制订单只能按合法状态流转。

## 架构要求

推荐的契约流是：

```text
Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> generated frontend types/hooks
```

关键要求：

- 持久化数据的真源从 Drizzle schema 开始
- API 契约应生成，而不是手动重复维护
- 前端 API 类型来自 generated/shared types
- 前端数据请求使用生成的 hooks
- 展示型组件专注 UI
- 业务逻辑放在 hooks、services 或后端模块中
- 可复用 UI 模式沉淀为 shared components
- design tokens 集中管理，不要散落在各处

## 期望脚本

完成后的项目应提供类似脚本：

```bash
pnpm dev:dashboard
pnpm dev:backend
pnpm gen:contract
pnpm lint
pnpm typecheck
pnpm test
```

## 交付内容

候选人应提交：

- GitHub 仓库
- 本地运行说明
- 数据 seed 或 bootstrap 说明
- 简短的架构决策说明
- 简短的取舍和未完成事项说明

也可以附上可选的 Loom 讲解视频。

## 原始文档

原始 assignment 文档位于：

```text
fullstack_developer_assignment_ody(1).md
```
