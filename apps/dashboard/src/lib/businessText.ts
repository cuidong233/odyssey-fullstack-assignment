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

export function customerNameText(name: string, locale: Locale) {
  return locale === "zh" ? zhCustomerNames[name] ?? name : name;
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
