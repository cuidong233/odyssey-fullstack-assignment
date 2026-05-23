export type DomainErrorCode =
  | "CUSTOMER_NOT_FOUND"
  | "DUPLICATE_ORDER_ITEM"
  | "INVALID_ORDER_PAYLOAD"
  | "INVALID_STATUS_TRANSITION"
  | "MENU_ITEM_HAS_ORDERS"
  | "MENU_ITEM_NOT_FOUND"
  | "MENU_ITEM_UNAVAILABLE"
  | "ORDER_NOT_FOUND"
  | "SERVICE_UNAVAILABLE";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "DomainError";
  }
}
