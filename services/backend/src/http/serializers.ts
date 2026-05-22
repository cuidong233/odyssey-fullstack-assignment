import type {
  Customer,
  MenuCategory,
  MenuItem,
  OrderingSettings,
  Order
} from "../db/schema";
import type {
  CustomerWithStats,
  OrderSummary,
  OrderWithItems
} from "../domain/order-service";
import { getNextOrderStatuses } from "../domain/order-status";

function iso(date: Date): string {
  return date.toISOString();
}

export function serializeMenuItem(item: MenuItem) {
  return {
    ...item,
    createdAt: iso(item.createdAt),
    updatedAt: iso(item.updatedAt)
  };
}

export function serializeCustomer(customer: Customer) {
  return {
    ...customer,
    createdAt: iso(customer.createdAt),
    updatedAt: iso(customer.updatedAt)
  };
}

export function serializeMenuCategory(category: MenuCategory) {
  return {
    ...category,
    createdAt: iso(category.createdAt),
    updatedAt: iso(category.updatedAt)
  };
}

export function serializeOrder(order: Order) {
  return {
    ...order,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt)
  };
}

export function serializeOrderWithItems(order: OrderWithItems) {
  return {
    ...serializeOrder(order),
    customer: serializeCustomer(order.customer),
    items: order.items,
    nextStatuses: getNextOrderStatuses(order.status)
  };
}

export function serializeCustomerWithStats(customer: CustomerWithStats) {
  return {
    ...serializeCustomer(customer),
    orderCount: customer.orderCount,
    spendCents: customer.spendCents,
    recentOrders: customer.recentOrders.map(serializeOrder)
  };
}

export function serializeOrderingSettings(settings: OrderingSettings) {
  return {
    ...settings,
    updatedAt: iso(settings.updatedAt)
  };
}

export function serializeHomeSummary(summary: OrderSummary) {
  return summary;
}
