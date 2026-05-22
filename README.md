<p align="center">
  <a href="#english">English</a> | <a href="#simplified-chinese">简体中文</a>
</p>

<p align="center">
  <img src="docs/assets/odyssey-restaurant-ops-mark.svg" width="88" alt="Odyssey Restaurant Ops logo" />
</p>

<h1 id="english" align="center">Odyssey Restaurant Ops</h1>

<p align="center">
  A fullstack restaurant operations dashboard for menu management, order flow, customer insight, and service settings.
</p>

## Product

Odyssey Restaurant Ops is a compact back-office product for a modern restaurant team. It gives operators one place to watch live service, create orders, manage menu availability, review customer history, and tune ordering settings.

The product is designed as a real operations tool rather than a static mock: pages have interactive state, reusable UI primitives, backend-owned order rules, and a contract-first TypeScript architecture.

## What You Can Do

- Track revenue, order volume, pending work, prep time, popular items, and recent activity on Home.
- Create orders, filter the queue, inspect order details, and move orders through valid status actions.
- Review CRM data with customer contact details, spend, order counts, and recent order signals.
- Manage menu categories and menu items, including price and availability changes.
- Update ordering settings such as prep time, auto-accept, service availability, tax rate, and opening hours.
- Browse the UI Library route to inspect tokens, typography, spacing, surfaces, components, and states.

## Stack

- pnpm workspace + Turborepo
- Expo + React Native + Web dashboard in `apps/dashboard`
- Hono API on Cloudflare Workers in `services/backend`
- PostgreSQL + Drizzle ORM + drizzle-zod
- OpenAPI contract generation
- Orval-style API client/hooks package in `packages/api-client`
- React Query
- Shared design tokens and utilities in `packages/shared`

## Architecture

The intended contract pipeline is:

```text
Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> frontend hooks/types
```

Data ownership starts in the Drizzle schema. Backend domain services own persistence validation, menu availability checks, server-side totals, and explicit order status transitions. The dashboard composes product flows from generated client hooks, shared formatting helpers, and reusable UI primitives.

## Repository Map

```text
apps/dashboard        Expo web dashboard and UI composition
services/backend      Hono Worker, Drizzle schema, order domain logic
packages/shared       design tokens, status labels, formatting helpers
packages/api-client   typed client/hooks exports for the dashboard
docs/assets           README and product preview assets
```

## Local Setup

```bash
pnpm install
pnpm dev:dashboard
pnpm dev:backend
```

Useful root scripts:

```bash
pnpm gen:contract
pnpm lint
pnpm typecheck
pnpm test
```

Backend package scripts:

```bash
pnpm --filter @repo/backend db:generate
pnpm --filter @repo/backend seed
```

## Current Build Notes

Implemented pieces include the Expo web dashboard shell, shared design tokens, reusable UI primitives, Drizzle schema, backend OpenAPI generation, generated contract types, Orval-generated React Query hooks, and backend order-domain tests for order creation and status rules.

Still in progress: production database seeding/persistence polish and broader frontend test coverage. The README keeps those tradeoffs visible so reviewers can quickly understand the current edge of the build.

<p align="center">
  <a href="#english">English</a> | <a href="#simplified-chinese">简体中文</a>
</p>

<p align="center">
  <img src="docs/assets/odyssey-restaurant-ops-mark.svg" width="88" alt="Odyssey Restaurant Ops 标识" />
</p>

<h1 id="simplified-chinese" align="center">Odyssey Restaurant Ops</h1>

<p align="center">
  一个用于菜单管理、订单流转、客户洞察和营业设置的全栈餐厅运营后台。
</p>

## 产品介绍

Odyssey Restaurant Ops 是一个面向现代餐厅团队的小型运营工作台。店员和运营者可以在一个界面里查看实时营业状态、创建订单、管理菜单可售状态、查看客户历史，并调整点单相关设置。

这个项目不是静态展示页，而是按真实后台产品来构建：页面有交互状态，可复用 UI primitives，订单规则由后端领域逻辑负责，并采用契约优先的 TypeScript 架构。

## 核心功能

- 在 Home 查看收入、订单量、待处理订单、平均备餐时间、热门菜品和最近动态。
- 在 Orders 创建订单、筛选队列、查看订单详情，并通过合法动作推进订单状态。
- 在 CRM 查看客户联系方式、消费金额、订单数量和最近下单信号。
- 在 Menu 管理菜单分类、菜品价格和可售状态。
- 在 Settings 调整备餐时间、自动接单、营业状态、税率和营业时间。
- 在 UI Library 查看 tokens、字体、间距、surface、组件和不同状态。

## 技术栈

- pnpm workspace + Turborepo
- `apps/dashboard`：Expo + React Native + Web dashboard
- `services/backend`：运行在 Cloudflare Workers 上的 Hono API
- PostgreSQL + Drizzle ORM + drizzle-zod
- OpenAPI 契约生成
- `packages/api-client`：面向 dashboard 的 API client/hooks 包
- React Query
- `packages/shared`：共享 design tokens 和工具函数

## 架构

目标契约链路：

```text
Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> frontend hooks/types
```

数据真源从 Drizzle schema 开始。后端领域服务负责持久化校验、菜单可售性检查、服务端价格计算，以及显式的订单状态流转。前端 dashboard 通过 client hooks、共享格式化工具和可复用 UI primitives 组合出产品流程。

## 仓库结构

```text
apps/dashboard        Expo Web 后台和页面组合
services/backend      Hono Worker、Drizzle schema、订单领域逻辑
packages/shared       design tokens、状态文案、格式化工具
packages/api-client   dashboard 使用的 typed client/hooks exports
docs/assets           README 和产品预览资源
```

## 本地运行

```bash
pnpm install
pnpm dev:dashboard
pnpm dev:backend
```

常用根命令：

```bash
pnpm gen:contract
pnpm lint
pnpm typecheck
pnpm test
```

后端相关命令：

```bash
pnpm --filter @repo/backend db:generate
pnpm --filter @repo/backend seed
```

## 当前状态

已经完成的部分包括 Expo Web dashboard shell、共享 design tokens、可复用 UI primitives、Drizzle schema、后端 OpenAPI 生成、生成式契约类型、Orval 生成的 React Query hooks，以及覆盖订单创建和状态规则的后端领域测试。

仍在推进的部分包括生产数据库 seed/持久化细节打磨，以及更完整的前端测试覆盖。这里保留这些取舍，方便 reviewer 快速理解当前项目边界。
