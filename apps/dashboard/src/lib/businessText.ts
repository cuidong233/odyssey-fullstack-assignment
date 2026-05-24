import type { Locale } from "./i18n";

const zhCustomerNames: Record<string, string> = {
  "Ari Chen": "陈阿里",
  "Ava Johnson": "艾娃·约翰逊",
  "Jordan Lee": "李乔丹",
  "Lina Park": "朴莉娜",
  "Maya Chen": "陈玛雅",
  "Maya Patel": "玛雅·帕特尔",
  "Noah Patel": "诺亚·帕特尔",
  "Theo Morgan": "西奥·摩根"
};

const zhBusinessHours: Record<string, string> = {
  "Mon-Sun 11:00-22:00": "周一至周日 11:00-22:00"
};

const dayLabels = {
  en: {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun"
  },
  zh: {
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
    saturday: "周六",
    sunday: "周日"
  }
} as const;

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export type BusinessDay = (typeof dayOrder)[number];

export type BusinessHoursRow = {
  day: BusinessDay;
  opensAt: string;
  closesAt: string;
  closed: boolean;
};

export const businessDayOrder = dayOrder;

export function customerNameText(name: string, locale: Locale) {
  return locale === "zh" ? zhCustomerNames[name] ?? name : name;
}

export function businessDayLabel(day: BusinessDay, locale: Locale) {
  return dayLabels[locale][day];
}

export function businessHoursText(hours: string, locale: Locale) {
  const formatted = formatBusinessHoursJson(hours, locale);
  if (formatted) {
    return formatted;
  }
  return locale === "zh" ? zhBusinessHours[hours] ?? hours : hours;
}

function formatBusinessHoursJson(hours: string, locale: Locale) {
  try {
    const parsed = JSON.parse(hours) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    const parts = dayOrder
      .map((day) => {
        const ranges = (parsed as Record<string, unknown>)[day];
        if (!Array.isArray(ranges) || ranges.length === 0) {
          return undefined;
        }
        const firstRange = typeof ranges[0] === "string" ? ranges : ranges[0];
        if (!Array.isArray(firstRange) || firstRange.length < 2 || typeof firstRange[0] !== "string" || typeof firstRange[1] !== "string") {
          return undefined;
        }
        return `${dayLabels[locale][day]} ${firstRange[0]}-${firstRange[1]}`;
      })
      .filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(" · ") : undefined;
  } catch {
    return undefined;
  }
}

export function parseBusinessHoursRows(hours: string): BusinessHoursRow[] {
  const defaults = businessDayOrder.map((day) => ({
    day,
    opensAt: "11:00",
    closesAt: "22:00",
    closed: false
  }));

  try {
    const parsed = JSON.parse(hours) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return parseCompactHours(hours) ?? defaults;
    }

    return businessDayOrder.map((day) => {
      const ranges = (parsed as Record<string, unknown>)[day];
      const range = readFirstRange(ranges);
      if (!range) {
        return { day, opensAt: "11:00", closesAt: "22:00", closed: true };
      }
      return { day, opensAt: range[0], closesAt: range[1], closed: false };
    });
  } catch {
    return parseCompactHours(hours) ?? defaults;
  }
}

export function buildBusinessHoursJson(rows: BusinessHoursRow[]) {
  return JSON.stringify(
    Object.fromEntries(
      rows.map((row) => [
        row.day,
        row.closed ? [] : [row.opensAt.trim() || "11:00", row.closesAt.trim() || "22:00"]
      ])
    )
  );
}

function parseCompactHours(hours: string): BusinessHoursRow[] | undefined {
  const match = hours.match(/^(?:Mon-Sun|Monday-Sunday)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/i);
  if (!match) {
    return undefined;
  }
  const opensAt = match[1];
  const closesAt = match[2];
  if (!opensAt || !closesAt) {
    return undefined;
  }
  return businessDayOrder.map((day) => ({
    day,
    opensAt,
    closesAt,
    closed: false
  }));
}

function readFirstRange(ranges: unknown): [string, string] | undefined {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return undefined;
  }
  const firstRange = typeof ranges[0] === "string" ? ranges : ranges[0];
  if (!Array.isArray(firstRange) || firstRange.length < 2 || typeof firstRange[0] !== "string" || typeof firstRange[1] !== "string") {
    return undefined;
  }
  return [firstRange[0], firstRange[1]];
}

export function orderCodeText(id: string) {
  const explicitOrderNumber = id.match(/(?:^|-)ORD-?(\d+)$/i)?.[1];
  if (explicitOrderNumber) {
    return `#${explicitOrderNumber}`;
  }

  const uuidTail = id.match(/([a-f0-9]{4})$/i)?.[1];
  if (uuidTail) {
    return `#${uuidTail.toUpperCase()}`;
  }

  return `#${id.slice(-6).toUpperCase()}`;
}
