import { describe, expect, it } from "vitest";
import { businessHoursText, customerNameText } from "./businessText";

describe("localized business text", () => {
  it("keeps source business labels for English", () => {
    expect(customerNameText("Maya Chen", "en")).toBe("Maya Chen");
    expect(businessHoursText("Mon-Sun 11:00-22:00", "en")).toBe("Mon-Sun 11:00-22:00");
  });

  it("localizes known customer names and business hours for Chinese", () => {
    expect(customerNameText("Maya Chen", "zh")).toBe("陈玛雅");
    expect(businessHoursText("Mon-Sun 11:00-22:00", "zh")).toBe("周一至周日 11:00-22:00");
  });

  it("falls back to source text for new backend data", () => {
    expect(customerNameText("Walk-in Guest", "zh")).toBe("Walk-in Guest");
    expect(businessHoursText("Weekends 10:00-20:00", "zh")).toBe("Weekends 10:00-20:00");
  });
});
