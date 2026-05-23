import { describe, expect, it } from "vitest";
import type { Order } from "@repo/api-client";
import { buildOrderTrend, buildStatusCounts } from "../lib/visualizations";

const baseOrder = {
  id: "order-1",
  customerId: "customer-1",
  customer: { id: "customer-1", name: "Maya", email: null, phone: null, createdAt: "", updatedAt: "" },
  items: [],
  nextStatuses: [],
  notes: null,
  subtotalCents: 0,
  taxCents: 0,
  updatedAt: ""
} satisfies Partial<Order>;

describe("restaurant visualization helpers", () => {
  it("groups orders by hour for the home trend chart", () => {
    const orders = [
      makeOrder("order-1", "pending", "2026-05-22T12:10:00.000Z", 1200),
      makeOrder("order-2", "ready", "2026-05-22T12:50:00.000Z", 800),
      makeOrder("order-3", "completed", "2026-05-22T13:20:00.000Z", 1500)
    ];

    const trend = buildOrderTrend(orders);

    expect(trend.find((point) => point.hour === 12)).toMatchObject({ orders: 2, revenueCents: 2000 });
    expect(trend.find((point) => point.hour === 13)).toMatchObject({ orders: 1, revenueCents: 1500 });
  });

  it("counts orders by status in workflow order", () => {
    const counts = buildStatusCounts([
      makeOrder("order-1", "pending", "2026-05-22T12:10:00.000Z", 1200),
      makeOrder("order-2", "pending", "2026-05-22T12:50:00.000Z", 800),
      makeOrder("order-3", "ready", "2026-05-22T13:20:00.000Z", 1500)
    ]);

    expect(counts.map((entry) => [entry.status, entry.count])).toEqual([
      ["pending", 2],
      ["accepted", 0],
      ["preparing", 0],
      ["ready", 1],
      ["completed", 0],
      ["cancelled", 0]
    ]);
  });
});

function makeOrder(id: string, status: Order["status"], createdAt: string, totalCents: number): Order {
  return {
    ...baseOrder,
    id,
    status,
    createdAt,
    totalCents
  } as Order;
}
