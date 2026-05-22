import { describe, expect, it } from "vitest";
import type { OrderStatus } from "../db/schema";
import type { OrderWithItems } from "../domain/order-service";
import { serializeOrderWithItems } from "./serializers";

describe("serializeOrderWithItems", () => {
  it("includes backend-derived next status actions", () => {
    expect(serializeOrderWithItems(buildOrder("pending")).nextStatuses).toEqual([
      "accepted",
      "cancelled"
    ]);
    expect(serializeOrderWithItems(buildOrder("completed")).nextStatuses).toEqual(
      []
    );
  });
});

function buildOrder(status: OrderStatus): OrderWithItems {
  const now = new Date("2026-01-01T12:00:00.000Z");

  return {
    id: "order-1",
    customerId: "customer-1",
    status,
    subtotalCents: 1200,
    taxCents: 105,
    totalCents: 1305,
    notes: null,
    createdAt: now,
    updatedAt: now,
    customer: {
      id: "customer-1",
      name: "Maya Chen",
      email: "maya@example.com",
      phone: "555-0101",
      createdAt: now,
      updatedAt: now
    },
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        menuItemId: "menu-item-1",
        menuItemName: "Avocado Toast",
        quantity: 1,
        unitPriceCents: 1200,
        lineTotalCents: 1200
      }
    ]
  };
}
