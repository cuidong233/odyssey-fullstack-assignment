import { describe, expect, it } from "vitest";
import { buildCreateCustomerBody, buildCreateOrderBody } from "./restaurantOperations";

describe("buildCreateOrderBody", () => {
  it("maps selected menu items to the generated create-order contract", () => {
    expect(
      buildCreateOrderBody({
        customerId: "customer-1",
        menuItemIds: ["menu-item-1", "menu-item-2"]
      })
    ).toEqual({
      customerId: "customer-1",
      items: [
        { menuItemId: "menu-item-1", quantity: 1 },
        { menuItemId: "menu-item-2", quantity: 1 }
      ]
    });
  });
});

describe("buildCreateCustomerBody", () => {
  it("trims required names and normalizes optional contact fields", () => {
    expect(
      buildCreateCustomerBody({
        name: "  New Guest  ",
        email: " ",
        phone: " 555-0199 "
      })
    ).toEqual({
      name: "New Guest",
      email: null,
      phone: "555-0199"
    });
  });
});
