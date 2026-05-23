import { describe, expect, it } from "vitest";
import { businessHoursText, customerNameText, orderCodeText } from "./businessText";

describe("localized business text", () => {
  it("keeps source business labels for English", () => {
    expect(customerNameText("Maya Chen", "en")).toBe("Maya Chen");
    expect(businessHoursText("Mon-Sun 11:00-22:00", "en")).toBe("Mon-Sun 11:00-22:00");
  });

  it("localizes known customer names and business hours for Chinese", () => {
    expect(customerNameText("Maya Chen", "zh")).toBe("陈玛雅");
    expect(businessHoursText("Mon-Sun 11:00-22:00", "zh")).toBe("周一至周日 11:00-22:00");
  });

  it("formats JSON opening hours into readable day ranges", () => {
    const hours = JSON.stringify({
      monday: [["10:00", "21:00"]],
      tuesday: [["10:00", "21:00"]],
      sunday: [["11:00", "20:00"]]
    });

    expect(businessHoursText(hours, "en")).toBe("Mon 10:00-21:00 · Tue 10:00-21:00 · Sun 11:00-20:00");
    expect(businessHoursText(hours, "zh")).toBe("周一 10:00-21:00 · 周二 10:00-21:00 · 周日 11:00-20:00");
  });

  it("falls back to source text for new backend data", () => {
    expect(customerNameText("Walk-in Guest", "zh")).toBe("Walk-in Guest");
    expect(businessHoursText("Weekends 10:00-20:00", "zh")).toBe("Weekends 10:00-20:00");
  });

  it("formats backend ids as operator-friendly order codes", () => {
    expect(orderCodeText("ORD-1048")).toBe("#1048");
    expect(orderCodeText("44444444-4444-4444-8444-444444441048")).toBe("#1048");
  });
});
