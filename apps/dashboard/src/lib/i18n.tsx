import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { OrderStatus } from "@repo/api-client";

export type Locale = "en" | "zh";

export const defaultLocale: Locale = "en";

export const dictionaries = {
  en: {
    brand: { restaurantOps: "Restaurant Ops" },
    nav: { home: "Home", orders: "Orders", crm: "CRM", menu: "Menu", settings: "Settings", library: "UI Library" },
    topbar: { search: "Search orders, guests, menu items", today: "Today", createOrder: "Create order" },
    range: { today: "Today", week: "This week", month: "This month" },
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
      trend: "Order trend",
      trendNote: "Today by hour",
      statusMix: "Status mix",
      queue: "Queue",
      recentOrders: "Recent orders",
      allChannels: "All channels"
    },
    orders: { eyebrow: "Order management", title: "Orders", all: "All", filters: "Filters", actions: "Status actions", nextSteps: "next steps", mark: "Mark" },
    crm: { eyebrow: "Guest intelligence", title: "CRM", customers: "Customers", stats: "Spend and order history", sort: "Highest spend", lastOrder: "Last order", spend: "Spend", add: "Add customer", edit: "Edit", save: "Save customer", validation: "Add a customer name before saving." },
    menu: { eyebrow: "Catalog", title: "Menu", items: "Items", availability: "Availability and pricing", add: "Add item", create: "Add menu item", available: "Available", paused: "Paused", edit: "Edit menu item", name: "Name", description: "Description", category: "Category", price: "Price", image: "Image", uploadImage: "Upload image", defaultImage: "Default image", availableForOrdering: "Available for ordering", save: "Save item", delete: "Delete item", createSave: "Create item", validation: "Add a name, category, and price greater than zero." },
    settings: { eyebrow: "Business controls", title: "Settings", ordering: "Ordering", rules: "Service rules", open: "Ordering is open", closed: "Closed", autoAccept: "Auto-accept new orders", autoAcceptHint: "New orders skip pending when enabled.", prep: "Default prep time", tax: "Tax rate", pricing: "Timing and tax", hours: "Opening hours", orderingHint: "Update service availability, order handling, prep timing, tax, and weekly hours from one backend-backed rule set.", save: "Save changes", reset: "Reset", saved: "Settings saved.", validation: "Use a prep time from 1-240 minutes, tax from 0-25%, and HH:MM times." },
    library: { eyebrow: "Design system", title: "UI Library", tokens: "Tokens", colorSpacing: "Color and spacing", typography: "Typography", typeScale: "Type scale", surfaces: "Surfaces", elevation: "Elevation", feedback: "Feedback", toast: "Toast pattern", toastBody: "Menu item saved and ordering surfaces refreshed.", components: "Components", states: "States", primary: "Primary", secondary: "Secondary", disabled: "Disabled", success: "Success", warning: "Warning", error: "Error", info: "Info" },
    create: { title: "Create order", customer: "Customer", menuItems: "Menu items", addCustomer: "New customer", name: "Name", email: "Email optional", phone: "Phone optional", saveCustomer: "Save customer", submit: "Submit order" },
    preview: { title: "API offline preview", body: "Start the backend on localhost:8787 to switch these views from seeded preview data to live API data." },
    common: {
      noOrders: "No orders match this view.",
      clearFilters: "Try clearing filters or creating a new order.",
      clearSearch: "Clear search",
      menuSection: "Menu",
      popularItems: "Popular items",
      soldToday: "sold today",
      detail: "Detail",
      total: "Total",
      orders: "Orders",
      noEmail: "No email",
      noPhone: "No phone",
      none: "None",
      cancel: "Cancel",
      menuFallback: "Menu",
      itemCount: (count: number) => `${count} ${count === 1 ? "item" : "items"}`,
      minutes: (minutes: number) => `${minutes} min`
    },
    status: { pending: "Pending", accepted: "Accepted", preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled" }
  },
  zh: {
    brand: { restaurantOps: "餐厅运营" },
    nav: { home: "首页", orders: "订单", crm: "客户", menu: "菜单", settings: "设置", library: "组件库" },
    topbar: { search: "搜索订单、客户、菜单项", today: "今日", createOrder: "新建订单" },
    range: { today: "今日", week: "本周", month: "本月" },
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
      trend: "订单趋势",
      trendNote: "今日按小时",
      statusMix: "状态分布",
      queue: "队列",
      recentOrders: "最近订单",
      allChannels: "全部渠道"
    },
    orders: { eyebrow: "订单管理", title: "订单", all: "全部", filters: "筛选", actions: "状态操作", nextSteps: "下一步", mark: "标记为" },
    crm: { eyebrow: "客户洞察", title: "客户", customers: "客户", stats: "消费与订单历史", sort: "消费最高", lastOrder: "最近订单", spend: "消费", add: "添加客户", edit: "编辑", save: "保存客户", validation: "保存前请填写客户姓名。" },
    menu: { eyebrow: "商品目录", title: "菜单", items: "菜品", availability: "可售状态与价格", add: "添加菜品", create: "添加菜品", available: "可售", paused: "暂停", edit: "编辑菜品", name: "名称", description: "描述", category: "分类", price: "价格", image: "图片", uploadImage: "上传图片", defaultImage: "默认图片", availableForOrdering: "开放点单", save: "保存菜品", delete: "删除菜品", createSave: "创建菜品", validation: "请填写名称、分类，并输入大于 0 的价格。" },
    settings: { eyebrow: "业务控制", title: "设置", ordering: "点单", rules: "服务规则", open: "开放点单", closed: "已关闭", autoAccept: "自动接单", autoAcceptHint: "开启后新订单会跳过待处理状态。", prep: "默认备餐时间", tax: "税率", pricing: "时间与税费", hours: "营业时间", orderingHint: "在同一组后端业务规则里更新服务状态、接单方式、备餐时间、税率和每周营业时间。", save: "保存更改", reset: "重置", saved: "设置已保存。", validation: "备餐时间需为 1-240 分钟，税率 0-25%，时间格式为 HH:MM。" },
    library: { eyebrow: "设计系统", title: "组件库", tokens: "设计变量", colorSpacing: "颜色与间距", typography: "字体", typeScale: "字号层级", surfaces: "界面层级", elevation: "边框与阴影", feedback: "反馈", toast: "提示模式", toastBody: "菜品已保存，点单界面已刷新。", components: "组件", states: "状态", primary: "主按钮", secondary: "次按钮", disabled: "禁用", success: "成功", warning: "警告", error: "错误", info: "信息" },
    create: { title: "新建订单", customer: "客户", menuItems: "菜品", addCustomer: "新客户", name: "姓名", email: "邮箱（选填）", phone: "电话（选填）", saveCustomer: "保存客户", submit: "提交订单" },
    preview: { title: "API 离线预览", body: "启动 localhost:8787 后端后，这些页面会从预览数据切换为真实 API 数据。" },
    common: {
      noOrders: "当前视图没有匹配订单。",
      clearFilters: "可以清除筛选或创建新订单。",
      clearSearch: "清除搜索",
      menuSection: "菜单",
      popularItems: "热门菜品",
      soldToday: "今日售出",
      detail: "详情",
      total: "总计",
      orders: "订单",
      noEmail: "无邮箱",
      noPhone: "无电话",
      none: "无",
      cancel: "取消",
      menuFallback: "菜单",
      itemCount: (count: number) => `${count} 项`,
      minutes: (minutes: number) => `${minutes} 分钟`
    },
    status: { pending: "待处理", accepted: "已接单", preparing: "制作中", ready: "待取餐", completed: "已完成", cancelled: "已取消" }
  }
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: Dictionary } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
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

export function intlLocale(locale: Locale) {
  return locale === "zh" ? "zh-CN" : "en-US";
}

export function formatLocalizedDateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
