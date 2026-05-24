import { useMemo, useState, type ReactNode } from "react";
import type { DimensionValue } from "react-native";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BookOpen } from "lucide-react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import type { Customer, Order, OrderStatus } from "@repo/api-client";
import { formatCurrency } from "@repo/shared";
import { Badge, Panel, SectionTitle } from "@repo/shared/ui";
import { customerNameText, orderCodeText } from "../lib/businessText";
import { formatLocalizedDateTime, intlLocale, statusText, useI18n } from "../lib/i18n";
import { menuItemNameText } from "../lib/menuText";
import { c, layout, r, s, type } from "../lib/styles";
import { buildOrderTrend, buildStatusCounts } from "../lib/visualizations";

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

export function OrderTrendChart({ orders }: { orders: Order[] }) {
  const { locale, t } = useI18n();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const points = buildOrderTrend(orders);
  const maxOrders = Math.max(1, ...points.map((point) => point.orders));
  const maxRevenue = Math.max(1, ...points.map((point) => point.revenueCents));
  const chartWidth = 520;
  const chartHeight = 190;
  const left = 34;
  const right = 18;
  const top = 20;
  const bottom = 36;
  const usableWidth = chartWidth - left - right;
  const usableHeight = chartHeight - top - bottom;
  const chartPoints = useMemo(
    () =>
      points.map((point, index) => {
        const x = left + (usableWidth * index) / Math.max(1, points.length - 1);
        const y = top + usableHeight - (point.orders / maxOrders) * usableHeight;
        const barHeight = Math.max(3, (point.revenueCents / maxRevenue) * 42);
        return { ...point, barHeight, x, y };
      }),
    [maxOrders, maxRevenue, points, usableHeight, usableWidth]
  );
  const path = chartPoints
    .map((point, index) => {
      const x = left + (usableWidth * index) / Math.max(1, points.length - 1);
      const y = point.y;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const totalRevenue = points.reduce((total, point) => total + point.revenueCents, 0);
  const activePoint = hoveredIndex === null ? null : chartPoints[hoveredIndex];
  const tooltipLeft: DimensionValue = activePoint ? `${(Math.min(chartWidth - 72, Math.max(72, activePoint.x)) / chartWidth) * 100}%` : "0%";
  const tooltipTop = activePoint ? Math.max(0, activePoint.y - 58) : 0;

  return (
    <Panel style={styles.chartPanel}>
      <SectionTitle eyebrow={t.home.trendNote} title={t.home.trend} action={<Text style={styles.price}>{formatCurrency(totalRevenue, intlLocale(locale))}</Text>} />
      <View style={styles.chartFrame}>
        <View style={styles.chartCanvas}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {[0, 1, 2].map((line) => {
              const y = top + (usableHeight * line) / 2;
              return <Line key={line} x1={left} x2={chartWidth - right} y1={y} y2={y} stroke={c.line} strokeWidth="1" />;
            })}
            {chartPoints.map((point) => (
              <Rect key={point.hour} x={point.x - 9} y={chartHeight - bottom - point.barHeight} width="18" height={point.barHeight} rx="5" fill={c.accentSoft} />
            ))}
            {activePoint ? <Line x1={activePoint.x} x2={activePoint.x} y1={top} y2={chartHeight - bottom} stroke={c.lineStrong} strokeDasharray="4 5" strokeWidth="1.5" /> : null}
            <Path d={path} fill="none" stroke={c.accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
            {activePoint ? <Circle cx={activePoint.x} cy={activePoint.y} r="6" fill={c.surface} stroke={c.accent} strokeWidth="3" /> : null}
          </Svg>
          <View pointerEvents="box-none" style={styles.chartHitLayer}>
            {chartPoints.map((point, index) => {
              const previousX = chartPoints[index - 1]?.x ?? left;
              const nextX = chartPoints[index + 1]?.x ?? chartWidth - right;
              const segmentLeft = index === 0 ? left : (previousX + point.x) / 2;
              const segmentRight = index === chartPoints.length - 1 ? chartWidth - right : (point.x + nextX) / 2;
              return (
                <Pressable
                  key={`${point.hour}-hit`}
                  accessibilityLabel={`${point.hour}:00, ${point.orders} ${t.common.orders}, ${formatCurrency(point.revenueCents, intlLocale(locale))}`}
                  onHoverIn={() => setHoveredIndex(index)}
                  onHoverOut={() => setHoveredIndex(null)}
                  onPressIn={() => setHoveredIndex(index)}
                  style={[
                    styles.chartHitArea,
                    {
                      left: `${(segmentLeft / chartWidth) * 100}%`,
                      width: `${((segmentRight - segmentLeft) / chartWidth) * 100}%`
                    }
                  ]}
                />
              );
            })}
          </View>
          {activePoint ? (
            <View pointerEvents="none" style={[styles.chartTooltip, { left: tooltipLeft, top: tooltipTop }]}>
              <Text style={styles.tooltipTime}>{`${activePoint.hour}:00`}</Text>
              <View style={styles.tooltipRow}>
                <View style={[styles.statusDot, { backgroundColor: c.accent }]} />
                <Text style={styles.tooltipValue}>
                  {activePoint.orders} {t.common.orders}
                </Text>
              </View>
              <Text style={type.tiny}>{formatCurrency(activePoint.revenueCents, intlLocale(locale))}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.chartAxis}>
          {points.map((point) => (
            <Text key={point.hour} style={type.tiny}>{`${point.hour}:00`}</Text>
          ))}
        </View>
      </View>
    </Panel>
  );
}

export function OrderStatusMix({ orders }: { orders: Order[] }) {
  const { t } = useI18n();
  const counts = buildStatusCounts(orders);
  const total = Math.max(1, orders.length);

  return (
    <Panel>
      <SectionTitle eyebrow={t.home.queue} title={t.home.statusMix} />
      <View style={styles.statusBar}>
        {counts.map(({ count, status }) => (
          <View key={status} style={[styles.statusBarSegment, { backgroundColor: statusColor(status), flexGrow: count, flexBasis: count > 0 ? `${Math.max(4, (count / total) * 100)}%` : 0 }]} />
        ))}
      </View>
      <View style={styles.statusLegend}>
        {counts.map(({ count, status }) => (
          <View key={status} style={styles.statusLegendItem}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
            <Text style={type.tiny}>{statusText(status, t)}</Text>
            <Text style={styles.statusCount}>{count}</Text>
          </View>
        ))}
      </View>
    </Panel>
  );
}

export function OrderTable({ orders, selectedOrderId, onSelect }: { orders: Order[]; selectedOrderId?: string | undefined; onSelect?: (id: string) => void }) {
  const { locale, t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 760;
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
        <Pressable
          key={order.id}
          onPress={() => onSelect?.(order.id)}
          style={[styles.tableRow, compact && styles.tableRowCompact, selectedOrderId === order.id && styles.tableRowActive]}
        >
          {compact ? (
            <>
              <View style={styles.tableCompactTop}>
                <View style={styles.tableCompactCode}>
                  <Text style={styles.tableStrong}>{orderCodeText(order.id)}</Text>
                  <Text style={type.tiny}>{formatLocalizedDateTime(order.createdAt, locale)}</Text>
                </View>
                <Text style={styles.price}>{formatCurrency(order.totalCents, intlLocale(locale))}</Text>
              </View>
              <View style={styles.tableCompactBottom}>
                <View style={styles.tableCompactCustomer}>
                  <Text numberOfLines={2} style={type.body}>{customerNameText(order.customer.name, locale)}</Text>
                  <Text style={type.tiny}>{t.common.itemCount(order.items.length)}</Text>
                </View>
                <LocalizedStatusBadge status={order.status} />
              </View>
            </>
          ) : (
            <>
              <View style={{ flex: 0.8 }}>
                <Text style={styles.tableStrong}>{orderCodeText(order.id)}</Text>
                <Text style={type.tiny}>{formatLocalizedDateTime(order.createdAt, locale)}</Text>
              </View>
              <View style={{ flex: 1.1 }}>
                <Text style={type.body}>{customerNameText(order.customer.name, locale)}</Text>
                <Text style={type.tiny}>{t.common.itemCount(order.items.length)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <LocalizedStatusBadge status={order.status} />
              </View>
              <Text style={[styles.price, { flex: 0.7 }]}>{formatCurrency(order.totalCents, intlLocale(locale))}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

export function PopularItemsPanel({ items }: { items: Array<{ name: string; quantity: number }> }) {
  const { locale, t } = useI18n();
  return (
    <Panel>
      <SectionTitle eyebrow={t.common.menuSection} title={t.common.popularItems} />
      <View style={{ gap: s[3] }}>
        {items.map((item) => (
          <View key={item.name} style={layout.between}>
            <View>
              <Text style={type.body}>{menuItemNameText(item.name, locale)}</Text>
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
      <SectionTitle eyebrow={t.common.detail} title={orderCodeText(order.id)} action={<LocalizedStatusBadge status={order.status} />} />
      <View style={{ gap: s[3] }}>
        <Text style={type.body}>{customerNameText(order.customer.name, locale)}</Text>
        {order.items.map((item) => (
          <View key={item.id} style={layout.between}>
            <Text style={type.muted}>
              {item.quantity} x {menuItemNameText(item.menuItemName, locale)}
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
  const { width } = useWindowDimensions();
  const compact = width < 760;
  return (
    <View style={[styles.customerRow, compact && styles.customerRowCompact]}>
      <View style={styles.customerIdentity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name.slice(0, 1)}</Text>
        </View>
        <View style={styles.customerCopy}>
          <Text numberOfLines={2} style={type.body}>{customerNameText(customer.name, locale)}</Text>
          <Text numberOfLines={2} style={type.tiny}>
            {customer.email ?? t.common.noEmail} · {customer.phone ?? t.common.noPhone}
          </Text>
        </View>
      </View>
      <View style={[styles.customerMetrics, compact && styles.customerMetricsCompact]}>
        <SettingMetric label={t.common.orders} value={`${customer.orderCount}`} />
        <SettingMetric label={t.crm.spend} value={formatCurrency(customer.spendCents, intlLocale(locale))} />
        <SettingMetric label={t.crm.lastOrder} value={customer.recentOrders[0] ? formatLocalizedDateTime(customer.recentOrders[0].createdAt, locale) : t.common.none} />
      </View>
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
      <Text numberOfLines={3} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function statusColor(status: OrderStatus) {
  if (status === "pending") return c.warning;
  if (status === "accepted") return c.info;
  if (status === "preparing") return c.accent;
  if (status === "ready") return c.success;
  if (status === "completed") return c.inkMuted;
  return c.danger;
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
  customerRowCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: s[3]
  },
  customerIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: s[3],
    minWidth: 0
  },
  customerCopy: {
    flex: 1,
    minWidth: 0
  },
  customerMetrics: {
    flexDirection: "row",
    gap: s[3]
  },
  customerMetricsCompact: {
    flexWrap: "wrap"
  },
  chartAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: s[2]
  },
  chartCanvas: {
    position: "relative"
  },
  chartFrame: {
    gap: s[1],
    marginTop: s[4]
  },
  chartHitArea: {
    bottom: 0,
    position: "absolute",
    top: 0
  },
  chartHitLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  chartPanel: {
    flex: 1
  },
  chartTooltip: {
    backgroundColor: c.surface,
    borderColor: c.lineStrong,
    borderRadius: r.sm,
    borderWidth: 1,
    gap: s[1],
    marginLeft: -72,
    minWidth: 144,
    paddingHorizontal: s[3],
    paddingVertical: s[2],
    position: "absolute",
    shadowColor: "#262d26",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18
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
    backgroundColor: c.surfaceMuted,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    gap: s[1],
    padding: s[3],
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
  statusBar: {
    borderRadius: r.full,
    flexDirection: "row",
    height: 12,
    marginTop: s[4],
    overflow: "hidden"
  },
  statusBarSegment: {
    minWidth: 8
  },
  statusCount: {
    color: c.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  statusDot: {
    borderRadius: r.full,
    height: 8,
    width: 8
  },
  statusLegend: {
    gap: s[2],
    marginTop: s[4]
  },
  statusLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[2],
    justifyContent: "space-between"
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
  tableRowCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: s[3],
    paddingHorizontal: s[3],
    paddingVertical: s[3]
  },
  tableRowActive: {
    backgroundColor: c.surfaceMuted
  },
  tableCompactTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: s[3],
    justifyContent: "space-between"
  },
  tableCompactBottom: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[3],
    justifyContent: "space-between"
  },
  tableCompactCode: {
    minWidth: 76
  },
  tableCompactCustomer: {
    flex: 1,
    minWidth: 0
  },
  tableStrong: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  tooltipRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[2]
  },
  tooltipTime: {
    color: c.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  tooltipValue: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
