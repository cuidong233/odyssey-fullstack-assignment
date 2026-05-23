import type { Order } from "@repo/api-client";
import { customerNameText, orderCodeText } from "../lib/businessText";
import type { Locale } from "../lib/i18n";
import { menuItemNameText } from "../lib/menuText";

export type MenuItemDraft = {
  name: string;
  description: string;
  categoryId: string | undefined;
  imageUrl: string;
  price: string;
  available: boolean;
};

export const defaultMenuImageUrl = "/menu-images/market-bowl.png";

export const emptyMenuItemDraft: MenuItemDraft = {
  name: "",
  description: "",
  categoryId: undefined,
  imageUrl: "",
  price: "",
  available: true
};

export function toggleSelectedId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function priceInputToCents(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function resolveActiveCustomerId(selectedCustomerId: string | undefined, fallbackCustomerId: string | undefined) {
  return selectedCustomerId ?? fallbackCustomerId;
}

export function resolveSelectedOrder(orders: Order[], selectedOrderId: string | undefined) {
  return orders.find((order) => order.id === selectedOrderId) ?? orders[0];
}

export function filterOrdersBySearch(orders: Order[], search: string, locale: Locale) {
  const normalizedSearch = normalizeSearchText(search);
  if (!normalizedSearch) {
    return orders;
  }

  return orders.filter((order) => {
    const customer = order.customer;
    const searchableText = [
      order.id,
      orderCodeText(order.id),
      order.status,
      customer.name,
      customerNameText(customer.name, locale),
      customer.email,
      customer.phone,
      ...order.items.flatMap((item) => [
        item.menuItemName,
        menuItemNameText(item.menuItemName, locale)
      ])
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalizeSearchText)
      .join(" ");

    return searchableText.includes(normalizedSearch);
  });
}

export function resolveMenuImageUrl(imageUrl: string | null | undefined) {
  const trimmedImageUrl = imageUrl?.trim();
  return trimmedImageUrl ? trimmedImageUrl : defaultMenuImageUrl;
}

export function isMenuItemDraftValid(draft: MenuItemDraft) {
  return Boolean(draft.name.trim() && draft.categoryId && priceInputToCents(draft.price) > 0);
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}
