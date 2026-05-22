import { describe, expect, it } from "vitest";
import type { Order } from "@repo/api-client";
import { priceInputToCents, resolveActiveCustomerId, resolveSelectedOrder, toggleSelectedId } from "./dashboardState";

describe("dashboard state helpers", () => {
  it("toggles selected ids without duplicating values", () => {
    expect(toggleSelectedId(["item-1"], "item-2")).toEqual(["item-1", "item-2"]);
    expect(toggleSelectedId(["item-1", "item-2"], "item-1")).toEqual(["item-2"]);
  });

  it("maps editable menu price input to generated contract cents", () => {
    expect(priceInputToCents("12.45")).toBe(1245);
    expect(priceInputToCents("bad input")).toBe(0);
  });

  it("keeps explicit customer selection over the default customer", () => {
    expect(resolveActiveCustomerId("customer-2", "customer-1")).toBe("customer-2");
    expect(resolveActiveCustomerId(undefined, "customer-1")).toBe("customer-1");
  });

  it("resolves the active order detail from selection and falls back to the first order", () => {
    const orders = [{ id: "order-1" }, { id: "order-2" }] as Order[];

    expect(resolveSelectedOrder(orders, "order-2")?.id).toBe("order-2");
    expect(resolveSelectedOrder(orders, undefined)?.id).toBe("order-1");
  });
});
