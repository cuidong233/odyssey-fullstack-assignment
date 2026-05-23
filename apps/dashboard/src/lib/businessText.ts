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

export function customerNameText(name: string, locale: Locale) {
  return locale === "zh" ? zhCustomerNames[name] ?? name : name;
}

export function businessHoursText(hours: string, locale: Locale) {
  return locale === "zh" ? zhBusinessHours[hours] ?? hours : hours;
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
