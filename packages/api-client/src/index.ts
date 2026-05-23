export * from "./generated/client";
export * from "./runtime/fetcher";
export type * from "./generated/model";
import { GetHomeSummaryRange, UpdateOrderStatusBodyNextStatus } from "./generated/model";
import type {
  GetHomeSummaryRange as GeneratedTimeRange,
  UpdateOrderStatusBodyNextStatus as GeneratedOrderStatus
} from "./generated/model";

export const orderStatuses = Object.values(UpdateOrderStatusBodyNextStatus);
export type OrderStatus = GeneratedOrderStatus;
export const timeRanges = Object.values(GetHomeSummaryRange);
export type TimeRange = GeneratedTimeRange;

export type {
  GetHomeSummary200 as HomeSummary,
  GetHomeSummary200PopularItemsItem as PopularItem,
  GetOrderingSettings200 as BusinessSettings,
  ListCustomers200Item as Customer,
  ListMenuCategories200Item as MenuCategory,
  ListMenuItems200Item as MenuItem,
  ListOrders200Item as Order
} from "./generated/model";
