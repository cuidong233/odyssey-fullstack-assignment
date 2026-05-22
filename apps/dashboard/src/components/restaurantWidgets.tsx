import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BookOpen } from "lucide-react-native";
import type { Customer, Order, OrderStatus } from "@repo/api-client";
import { formatCurrency } from "@repo/shared";
import { Badge, Panel, SectionTitle } from "@repo/shared/ui";
import { formatLocalizedDateTime, intlLocale, statusText, useI18n } from "../lib/i18n";
import { c, layout, r, s, type } from "../lib/styles";

export function Kpi({ icon, label, note, value }: { icon: ReactNode; label: string; note: string; value: string }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <Panel style={[styles.kpi, compact && styles.kpiCompact]}>
      <View style={[layout.between, compact && styles.kpiHeaderCompact]}>
        <View style={styles.kpiIcon}>{icon}</View>
        <Text style={type.tiny}>{label}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={type.tiny}>{note}</Text>
    </Panel>
  );
}

export function OrderTable({ orders, selectedOrderId, onSelect }: { orders: Order[]; selectedOrderId?: string | undefined; onSelect?: (id: string) => void }) {
  const { locale, t } = useI18n();
  if (orders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <BookOpen size={26} color={c.inkSubtle} />
        <Text style={type.body}>{t.common.noOrders}</Text>
        <Text style={type.tiny}>{t.common.clearFilters}</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      {orders.map((order) => (
        <Pressable key={order.id} onPress={() => onSelect?.(order.id)} style={[styles.tableRow, selectedOrderId === order.id && styles.tableRowActive]}>
          <View style={{ flex: 0.8 }}>
            <Text style={styles.tableStrong}>{order.id}</Text>
            <Text style={type.tiny}>{formatLocalizedDateTime(order.createdAt, locale)}</Text>
          </View>
          <View style={{ flex: 1.1 }}>
            <Text style={type.body}>{order.customer.name}</Text>
            <Text style={type.tiny}>{t.common.itemCount(order.items.length)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <LocalizedStatusBadge status={order.status} />
          </View>
          <Text style={[styles.price, { flex: 0.7 }]}>{formatCurrency(order.totalCents, intlLocale(locale))}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PopularItemsPanel({ items }: { items: Array<{ name: string; quantity: number }> }) {
  const { t } = useI18n();
  return (
    <Panel>
      <SectionTitle eyebrow={t.common.menuSection} title={t.common.popularItems} />
      <View style={{ gap: s[3] }}>
        {items.map((item) => (
          <View key={item.name} style={layout.between}>
            <View>
              <Text style={type.body}>{item.name}</Text>
              <Text style={type.tiny}>
                {item.quantity} {t.common.soldToday}
              </Text>
            </View>
            <Text style={styles.price}>#{item.quantity}</Text>
          </View>
        ))}
      </View>
    </Panel>
  );
}

export function OrderInspector({ order }: { order: Order }) {
  const { locale, t } = useI18n();
  return (
    <Panel>
      <SectionTitle eyebrow={t.common.detail} title={order.id} action={<LocalizedStatusBadge status={order.status} />} />
      <View style={{ gap: s[3] }}>
        <Text style={type.body}>{order.customer.name}</Text>
        {order.items.map((item) => (
          <View key={item.id} style={layout.between}>
            <Text style={type.muted}>
              {item.quantity} x {item.menuItemName}
            </Text>
            <Text style={styles.price}>{formatCurrency(item.unitPriceCents, intlLocale(locale))}</Text>
          </View>
        ))}
        <View style={layout.divider} />
        <View style={layout.between}>
          <Text style={type.body}>{t.common.total}</Text>
          <Text style={styles.price}>{formatCurrency(order.totalCents, intlLocale(locale))}</Text>
        </View>
      </View>
    </Panel>
  );
}

export function CustomerRow({ customer }: { customer: Customer }) {
  const { locale, t } = useI18n();
  return (
    <View style={styles.customerRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{customer.name.slice(0, 1)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{customer.name}</Text>
        <Text style={type.tiny}>
          {customer.email ?? t.common.noEmail} · {customer.phone ?? t.common.noPhone}
        </Text>
      </View>
      <SettingMetric label={t.common.orders} value={`${customer.orderCount}`} />
      <SettingMetric label={t.crm.spend} value={formatCurrency(customer.spendCents, intlLocale(locale))} />
      <SettingMetric label={t.crm.lastOrder} value={customer.recentOrders[0] ? formatLocalizedDateTime(customer.recentOrders[0].createdAt, locale) : t.common.none} />
    </View>
  );
}

export function LocalizedStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return <Badge tone={status === "cancelled" ? "danger" : status === "completed" || status === "ready" ? "success" : status === "pending" ? "warning" : status === "preparing" ? "accent" : "info"}>{statusText(status, t)}</Badge>;
}

export function SettingMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricMini}>
      <Text style={type.tiny}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: c.accentSoft,
    borderRadius: r.full,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  avatarText: {
    color: c.accent,
    fontSize: 16,
    fontWeight: "800"
  },
  customerRow: {
    alignItems: "center",
    borderBottomColor: c.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: s[4],
    paddingVertical: s[4]
  },
  emptyState: {
    alignItems: "center",
    borderColor: c.line,
    borderRadius: r.md,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: s[2],
    marginTop: s[5],
    padding: s[8]
  },
  kpi: {
    flexBasis: 220,
    flexGrow: 1,
    gap: s[3]
  },
  kpiCompact: {
    flexBasis: "auto",
    width: "100%"
  },
  kpiHeaderCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: s[2]
  },
  kpiIcon: {
    alignItems: "center",
    backgroundColor: c.surfaceMuted,
    borderRadius: r.sm,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  kpiValue: {
    color: c.ink,
    fontSize: 30,
    fontWeight: "800"
  },
  metricMini: {
    gap: s[1],
    minWidth: 96
  },
  metricValue: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  price: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right"
  },
  table: {
    gap: s[1],
    marginTop: s[5]
  },
  tableRow: {
    alignItems: "center",
    borderRadius: r.sm,
    flexDirection: "row",
    gap: s[4],
    minHeight: 68,
    paddingHorizontal: s[3],
    paddingVertical: s[3]
  },
  tableRowActive: {
    backgroundColor: c.surfaceMuted
  },
  tableStrong: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
