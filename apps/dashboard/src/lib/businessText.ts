import type { Locale } from "./i18n";

const zhCustomerNames: Record<string, string> = {
  "Ava Johnson": "艾娃·约翰逊",
  "Maya Chen": "陈玛雅",
  "Maya Patel": "玛雅·帕特尔",
  "Noah Patel": "诺亚·帕特尔"
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
