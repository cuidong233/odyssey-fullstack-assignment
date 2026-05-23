import { describe, expect, it } from "vitest";
import { menuCategoryNameText, menuItemDescriptionText, menuItemNameText } from "./menuText";

describe("localized menu text", () => {
  it("keeps menu data unchanged for English", () => {
    expect(menuItemNameText("Miso Salmon Plate", "en")).toBe("Miso Salmon Plate");
    expect(menuCategoryNameText("Drinks", "en")).toBe("Drinks");
    expect(menuItemDescriptionText("House brewed tea with lime", "en")).toBe("House brewed tea with lime");
  });

  it("localizes known menu names, categories, and descriptions for Chinese", () => {
    expect(menuItemNameText("Miso Salmon Plate", "zh")).toBe("味噌三文鱼套餐");
    expect(menuCategoryNameText("Drinks", "zh")).toBe("饮品");
    expect(menuItemDescriptionText("House brewed tea with lime", "zh")).toBe("自制茶底配青柠");
  });

  it("falls back to source text for custom menu data", () => {
    expect(menuItemNameText("Chef Special", "zh")).toBe("Chef Special");
    expect(menuCategoryNameText("Seasonal", "zh")).toBe("Seasonal");
  });
});
