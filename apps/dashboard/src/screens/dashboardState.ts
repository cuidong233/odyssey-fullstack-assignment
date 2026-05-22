import type { Order } from "@repo/api-client";

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

export function resolveMenuImageUrl(imageUrl: string | null | undefined) {
  const trimmedImageUrl = imageUrl?.trim();
  return trimmedImageUrl ? trimmedImageUrl : defaultMenuImageUrl;
}

export function isMenuItemDraftValid(draft: MenuItemDraft) {
  return Boolean(draft.name.trim() && draft.categoryId && priceInputToCents(draft.price) > 0);
}
