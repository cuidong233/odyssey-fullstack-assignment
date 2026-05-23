import { orderStatuses, type Order } from "@repo/api-client";

export type OrderTrendPoint = {
  hour: number;
  orders: number;
  revenueCents: number;
};

export function buildOrderTrend(orders: Order[]): OrderTrendPoint[] {
  const hours = [10, 11, 12, 13, 14, 15, 16, 17];
  return hours.map((hour) => {
    const hourlyOrders = orders.filter((order) => new Date(order.createdAt).getUTCHours() === hour);
    return {
      hour,
      orders: hourlyOrders.length,
      revenueCents: hourlyOrders.reduce((total, order) => total + order.totalCents, 0)
    };
  });
}

export function buildStatusCounts(orders: Order[]) {
  return orderStatuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length
  }));
}
