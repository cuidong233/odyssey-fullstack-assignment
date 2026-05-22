import { describe, expect, it } from "vitest";
import { defaultLocale, dictionaries, formatLocalizedDateTime, intlLocale } from "./i18n";

function keyShape(value: unknown): unknown {
  if (typeof value !== "object" || value === null || typeof value === "function") {
    return typeof value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, keyShape(entry)])
  );
}

describe("dashboard i18n", () => {
  it("defaults the dashboard to English", () => {
    expect(defaultLocale).toBe("en");
  });

  it("keeps English and Chinese dictionaries structurally aligned", () => {
    expect(keyShape(dictionaries.zh)).toEqual(keyShape(dictionaries.en));
  });

  it("localizes reusable format helpers", () => {
    expect(intlLocale("en")).toBe("en-US");
    expect(intlLocale("zh")).toBe("zh-CN");
    expect(dictionaries.en.common.itemCount(2)).toBe("2 items");
    expect(dictionaries.zh.common.itemCount(2)).toBe("2 项");
    expect(formatLocalizedDateTime("2026-05-22T12:58:00.000Z", "zh")).toContain("5月");
  });
});
