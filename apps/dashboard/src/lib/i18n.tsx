import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { OrderStatus } from "@repo/api-client";

export type Locale = "en" | "zh";

const dictionaries = {
  en: {
    nav: { home: "Home", orders: "Orders", crm: "CRM", menu: "Menu", settings: "Settings", library: "UI Library" },
    topbar: { search: "Search orders, guests, menu items", today: "Today", createOrder: "Create order" },
    service: { label: "Service", open: "Open", note: "Average prep time holds at 14 minutes." },
    home: {
      eyebrow: "Live operations",
      title: "Today's floor",
      newOrder: "New order",
      revenue: "Revenue",
      revenueNote: "Net of cancelled orders",
      totalOrders: "Total orders",
      totalOrdersNote: "Across all channels",
      pending: "Pending",
      pendingNote: "Needs action",
      popularItems: "Popular items",
      popularItemsNote: "Tracked from completed orders",
      queue: "Queue",
      recentOrders: "Recent orders",
      allChannels: "All channels"
    },
    orders: { eyebrow: "Order management", title: "Orders", all: "All", filters: "Filters", actions: "Status actions", nextSteps: "next steps", mark: "Mark" },
    crm: { eyebrow: "Guest intelligence", title: "CRM", customers: "Customers", stats: "Spend and order history", sort: "Highest spend", lastOrder: "Last order", spend: "Spend" },
    menu: { eyebrow: "Catalog", title: "Menu", items: "Items", availability: "Availability and pricing", add: "Add item", create: "Add menu item", available: "Available", paused: "Paused", edit: "Edit menu item", name: "Name", description: "Description", category: "Category", price: "Price", availableForOrdering: "Available for ordering", save: "Save item", createSave: "Create item", validation: "Add a name, category, and price greater than zero." },
    settings: { eyebrow: "Business controls", title: "Settings", ordering: "Ordering", rules: "Service rules", open: "Ordering is open", autoAccept: "Auto-accept new orders", prep: "Default prep time", tax: "Tax rate", hours: "Opening hours" },
    library: { eyebrow: "Design system", title: "UI Library", tokens: "Tokens", colorSpacing: "Color and spacing", typography: "Typography", typeScale: "Type scale", surfaces: "Surfaces", elevation: "Elevation", feedback: "Feedback", toast: "Toast pattern", toastBody: "Menu item saved and ordering surfaces refreshed.", components: "Components", states: "States", primary: "Primary", secondary: "Secondary", disabled: "Disabled", success: "Success", warning: "Warning", error: "Error", info: "Info" },
    create: { title: "Create order", submit: "Submit order" },
    preview: { title: "API offline preview", body: "Start the backend on localhost:8787 to switch these views from seeded preview data to live API data." },
    common: { noOrders: "No orders match this view.", clearFilters: "Try clearing filters or creating a new order.", menuSection: "Menu", popularItems: "Popular items", soldToday: "sold today", detail: "Detail", total: "Total", orders: "Orders" },
    status: { pending: "Pending", accepted: "Accepted", preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled" }
  },
  zh: {
    nav: { home: "首页", orders: "订单", crm: "客户", menu: "菜单", settings: "设置", library: "组件库" },
    topbar: { search: "搜索订单、客户、菜单项", today: "今日", createOrder: "创建订单" },
    service: { label: "服务状态", open: "营业中", note: "当前平均备餐时间保持在 14 分钟。" },
    home: {
      eyebrow: "实时运营",
      title: "今日门店",
      newOrder: "新订单",
      revenue: "收入",
      revenueNote: "已排除取消订单",
      totalOrders: "订单总数",
      totalOrdersNote: "覆盖所有渠道",
      pending: "待处理",
      pendingNote: "需要处理",
      popularItems: "热门菜品",
      popularItemsNote: "来自已完成订单",
      queue: "队列",
      recentOrders: "最近订单",
      allChannels: "全部渠道"
    },
    orders: { eyebrow: "订单管理", title: "订单", all: "全部", filters: "筛选", actions: "状态操作", nextSteps: "下一步", mark: "标记为" },
    crm: { eyebrow: "客户洞察", title: "客户", customers: "客户", stats: "消费与订单历史", sort: "消费最高", lastOrder: "最近订单", spend: "消费" },
    menu: { eyebrow: "商品目录", title: "菜单", items: "菜品", availability: "可售状态与价格", add: "添加菜品", create: "添加菜品", available: "可售", paused: "暂停", edit: "编辑菜品", name: "名称", description: "描述", category: "分类", price: "价格", availableForOrdering: "开放点单", save: "保存菜品", createSave: "创建菜品", validation: "请填写名称、分类，并输入大于 0 的价格。" },
    settings: { eyebrow: "业务控制", title: "设置", ordering: "点单", rules: "服务规则", open: "开放点单", autoAccept: "自动接单", prep: "默认备餐时间", tax: "税率", hours: "营业时间" },
    library: { eyebrow: "设计系统", title: "组件库", tokens: "设计变量", colorSpacing: "颜色与间距", typography: "字体", typeScale: "字号层级", surfaces: "界面层级", elevation: "边框与阴影", feedback: "反馈", toast: "提示模式", toastBody: "菜品已保存，点单界面已刷新。", components: "组件", states: "状态", primary: "主按钮", secondary: "次按钮", disabled: "禁用", success: "成功", warning: "警告", error: "错误", info: "信息" },
    create: { title: "创建订单", submit: "提交订单" },
    preview: { title: "API 离线预览", body: "启动 localhost:8787 后端后，这些页面会从预览数据切换为真实 API 数据。" },
    common: { noOrders: "当前视图没有匹配订单。", clearFilters: "可以清除筛选或创建新订单。", menuSection: "菜单", popularItems: "热门菜品", soldToday: "今日售出", detail: "详情", total: "总计", orders: "订单" },
    status: { pending: "待处理", accepted: "已接单", preparing: "制作中", ready: "待取餐", completed: "已完成", cancelled: "已取消" }
  }
} as const;

type Dictionary = (typeof dictionaries)[Locale];

const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: Dictionary } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider.");
  return context;
}

export function statusText(status: OrderStatus, t: Dictionary) {
  return t.status[status];
}
