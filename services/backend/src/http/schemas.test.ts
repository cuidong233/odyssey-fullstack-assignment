import { describe, expect, it } from "vitest";
import { createOrderRequestSchema } from "./schemas";

const customerId = "00000000-0000-4000-8000-000000000001";
const menuItemId = "00000000-0000-4000-8000-000000000002";

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
