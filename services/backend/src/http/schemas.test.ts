import { describe, expect, it } from "vitest";
import {
  createMenuItemRequestSchema,
  createCustomerRequestSchema,
  createOrderRequestSchema,
  idParamSchema,
  updateOrderingSettingsRequestSchema,
  updateOrderStatusRequestSchema
} from "./schemas";

const customerId = "00000000-0000-4000-8000-000000000001";
const menuItemId = "00000000-0000-4000-8000-000000000002";
const categoryId = "00000000-0000-4000-8000-000000000003";

describe("createOrderRequestSchema", () => {
  it("accepts customer, item, quantity, and notes only", () => {
    const result = createOrderRequestSchema.safeParse({
      customerId,
      notes: "Pickup near the front counter",
      items: [
        {
          menuItemId,
          quantity: 2
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects client-owned totals and price snapshots", () => {
    const result = createOrderRequestSchema.safeParse({
      customerId,
      totalCents: 1,
      items: [
        {
          menuItemId,
          quantity: 2,
          unitPriceCents: 1,
          lineTotalCents: 2
        }
      ]
    });

    expect(result.success).toBe(false);
  });
});

describe("request schemas", () => {
  it("reject strict body fields outside the API contract", () => {
    expect(
      createMenuItemRequestSchema.safeParse({
        categoryId,
        name: "Market Bowl",
        priceCents: 1400,
        createdAt: "2026-05-22T00:00:00.000Z"
      }).success
    ).toBe(false);

    expect(
      updateOrderStatusRequestSchema.safeParse({
        nextStatus: "accepted",
        status: "completed"
      }).success
    ).toBe(false);

    expect(
      createCustomerRequestSchema.safeParse({
        name: "Guest",
        spendCents: 1000
      }).success
    ).toBe(false);

    expect(
      updateOrderingSettingsRequestSchema.safeParse({
        prepTimeMinutes: 20,
        updatedAt: "2026-05-22T00:00:00.000Z"
      }).success
    ).toBe(false);
  });

  it("requires UUID path identifiers", () => {
    expect(idParamSchema.safeParse({ id: menuItemId }).success).toBe(true);
    expect(idParamSchema.safeParse({ id: "order-1" }).success).toBe(false);
  });

  it("accepts uploaded menu images as data URLs", () => {
    const result = createMenuItemRequestSchema.safeParse({
      categoryId,
      name: "Market Bowl",
      imageUrl: `data:image/png;base64,${"a".repeat(2_000)}`,
      priceCents: 1400
    });

    expect(result.success).toBe(true);
  });
});
