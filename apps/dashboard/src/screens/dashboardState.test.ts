import { describe, expect, it } from "vitest";
import type { Order } from "@repo/api-client";
import { defaultMenuImageUrl, filterOrdersBySearch, isMenuItemDraftValid, priceInputToCents, resolveActiveCustomerId, resolveMenuImageUrl, resolveSelectedOrder, toggleSelectedId } from "./dashboardState";

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

  it("filters orders by code, customer, and menu item text", () => {
    const orders = [
      makeOrder("local-ORD-1001", "Maya Chen", "Market Bowl"),
      makeOrder("local-ORD-1002", "Theo Morgan", "Roasted Tomato Soup")
    ];

    expect(filterOrdersBySearch(orders, "1002", "en").map((order) => order.id)).toEqual(["local-ORD-1002"]);
    expect(filterOrdersBySearch(orders, "maya", "en").map((order) => order.id)).toEqual(["local-ORD-1001"]);
    expect(filterOrdersBySearch(orders, "番茄", "zh").map((order) => order.id)).toEqual(["local-ORD-1002"]);
    expect(filterOrdersBySearch(orders, "   ", "en")).toBe(orders);
  });

  it("requires new menu items to have a category, name, and positive price", () => {
    expect(isMenuItemDraftValid({ name: "Soup", description: "", categoryId: "cat-1", imageUrl: "", price: "9.5", available: true })).toBe(true);
    expect(isMenuItemDraftValid({ name: "", description: "", categoryId: "cat-1", imageUrl: "", price: "9.5", available: true })).toBe(false);
    expect(isMenuItemDraftValid({ name: "Soup", description: "", categoryId: undefined, imageUrl: "", price: "9.5", available: true })).toBe(false);
    expect(isMenuItemDraftValid({ name: "Soup", description: "", categoryId: "cat-1", imageUrl: "", price: "0", available: true })).toBe(false);
  });

  it("falls back to the default menu image when an item has no image", () => {
    expect(resolveMenuImageUrl(null)).toBe(defaultMenuImageUrl);
    expect(resolveMenuImageUrl("   ")).toBe(defaultMenuImageUrl);
    expect(resolveMenuImageUrl("/menu-images/soup.png")).toBe("/menu-images/soup.png");
  });
});

function makeOrder(id: string, customerName: string, menuItemName: string): Order {
  return {
    id,
    customerId: "customer-1",
    customer: { id: "customer-1", name: customerName, email: null, phone: null, createdAt: "", updatedAt: "" },
    createdAt: "",
    items: [
      {
        id: `${id}-item`,
        menuItemId: "menu-item-1",
        menuItemName,
        orderId: id,
        quantity: 1,
        lineTotalCents: 1200,
        unitPriceCents: 1200
      }
    ],
    nextStatuses: [],
    notes: null,
    status: "pending",
    subtotalCents: 1200,
    taxCents: 0,
    totalCents: 1200,
    updatedAt: ""
  };
}
