import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BadgeDollarSign, ChefHat, Clock3, Plus, ShoppingBag, SlidersHorizontal } from "lucide-react-native";
import {
  type MenuItem,
  type OrderStatus,
  orderStatuses,
  useGetOrderingSettings,
  useGetHomeSummary,
  useListCustomers,
  useListMenuCategories,
  useListMenuItems,
  useListOrders
} from "@repo/api-client";
import { formatCurrency, formatMinutes } from "@repo/shared";
import { AppModal, Badge, Button, Chip, Field, Notice, Panel, SectionTitle, SelectLike, SkeletonRows, Toggle } from "@repo/shared/ui";
import { CustomerRow, Kpi, OrderInspector, OrderTable, PopularItemsPanel, SettingMetric } from "../components/restaurantWidgets";
import { useCreateRestaurantOrder, useMenuItemEditor, useOrderingSettingsEditor, useOrderStatusAction } from "../hooks/restaurantOperations";
import { statusText, useI18n } from "../lib/i18n";
import { c, layout, r, s, type } from "../lib/styles";
import { priceInputToCents, resolveActiveCustomerId, resolveSelectedOrder, toggleSelectedId } from "./dashboardState";

export function HomeScreen({ onCreateOrder }: { onCreateOrder: () => void }) {
  const { t } = useI18n();
  const summary = useGetHomeSummary();
  const orders = useListOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const selectedOrder = useMemo(() => {
    return resolveSelectedOrder(orders.data ?? [], selectedOrderId);
  }, [orders.data, selectedOrderId]);

  return (
    <View style={styles.screenStack}>
      <View style={layout.between}>
        <View>
          <Text style={type.eyebrow}>{t.home.eyebrow}</Text>
          <Text style={type.h1}>{t.home.title}</Text>
        </View>
        <Button icon={<Plus size={16} color={c.surface} />} onPress={onCreateOrder}>
          {t.home.newOrder}
        </Button>
      </View>

      {summary.isLoading ? (
        <SkeletonRows />
      ) : (
        <View style={styles.kpiGrid}>
          <Kpi icon={<BadgeDollarSign size={20} color={c.success} />} label={t.home.revenue} value={formatCurrency(summary.data?.revenueCents ?? 0)} note={t.home.revenueNote} />
          <Kpi icon={<ShoppingBag size={20} color={c.accent} />} label={t.home.totalOrders} value={`${summary.data?.totalOrders ?? 0}`} note={t.home.totalOrdersNote} />
          <Kpi icon={<Clock3 size={20} color={c.warning} />} label={t.home.pending} value={`${summary.data?.pendingOrders ?? 0}`} note={t.home.pendingNote} />
          <Kpi icon={<ChefHat size={20} color={c.info} />} label={t.home.popularItems} value={`${summary.data?.popularItems.length ?? 0}`} note={t.home.popularItemsNote} />
        </View>
      )}

      <View style={styles.homeGrid}>
        <Panel style={{ flex: 1.35 }}>
          <SectionTitle eyebrow={t.home.queue} title={t.home.recentOrders} action={<SelectLike label={t.home.allChannels} />} />
          <OrderTable orders={orders.data ?? []} selectedOrderId={selectedOrder?.id} onSelect={setSelectedOrderId} />
        </Panel>
        <View style={styles.sideStack}>
          <PopularItemsPanel items={summary.data?.popularItems ?? []} />
          {selectedOrder ? <OrderInspector order={selectedOrder} /> : null}
        </View>
      </View>
    </View>
  );
}

export function OrdersScreen({ onCreateOrder }: { onCreateOrder: () => void }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const orders = useListOrders(filter === "all" ? undefined : { status: filter });
  const updateStatus = useOrderStatusAction();
  const selected = orders.data?.[0];

  return (
    <View style={styles.screenStack}>
      <View style={layout.between}>
        <View>
          <Text style={type.eyebrow}>{t.orders.eyebrow}</Text>
          <Text style={type.h1}>{t.orders.title}</Text>
        </View>
        <Button icon={<Plus size={16} color={c.surface} />} onPress={onCreateOrder}>
          {t.topbar.createOrder}
        </Button>
      </View>

      <Panel>
        <View style={[layout.between, { marginBottom: s[5] }]}>
          <View style={styles.chipRow}>
            <Chip active={filter === "all"} onPress={() => setFilter("all")}>
              {t.orders.all}
            </Chip>
            {orderStatuses.map((status) => (
              <Chip key={status} active={filter === status} onPress={() => setFilter(status)}>
                {statusText(status, t)}
              </Chip>
            ))}
          </View>
          <Button icon={<SlidersHorizontal size={16} color={c.inkMuted} />} variant="secondary">
            {t.orders.filters}
          </Button>
        </View>
        {orders.isLoading ? <SkeletonRows count={5} /> : <OrderTable orders={orders.data ?? []} />}
      </Panel>

      {selected ? (
        <Panel>
          <SectionTitle eyebrow={t.orders.actions} title={`${selected.id} ${t.orders.nextSteps}`} />
          <View style={styles.actionStrip}>
            {selected.nextStatuses.map((nextStatus) => (
              <Button
                key={nextStatus}
                disabled={updateStatus.isPending}
                loading={updateStatus.isPending && updateStatus.variables?.data?.nextStatus === nextStatus}
                onPress={() => updateStatus.moveOrderTo(selected.id, nextStatus)}
                variant={nextStatus === "cancelled" ? "danger" : "secondary"}
              >
                {t.orders.mark} {statusText(nextStatus, t)}
              </Button>
            ))}
          </View>
          {updateStatus.error ? <Text style={[type.muted, { color: c.danger }]}>{updateStatus.error.message}</Text> : null}
        </Panel>
      ) : null}
    </View>
  );
}

export function CrmScreen() {
  const { t } = useI18n();
  const customers = useListCustomers();

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.crm.eyebrow}</Text>
        <Text style={type.h1}>{t.crm.title}</Text>
      </View>
      <Panel>
        <SectionTitle eyebrow={t.crm.customers} title={t.crm.stats} action={<SelectLike label={t.crm.sort} />} />
        <View style={styles.customerList}>
          {(customers.data ?? []).map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </View>
      </Panel>
    </View>
  );
}

export function MenuScreen() {
  const { t } = useI18n();
  const items = useListMenuItems();
  const categories = useListMenuCategories();
  const [editing, setEditing] = useState<MenuItem | undefined>();
  const [price, setPrice] = useState("");
  const updateItem = useMenuItemEditor({ onSaved: () => setEditing(undefined) });

  function startEditing(item: MenuItem) {
    setEditing(item);
    setPrice(String(item.priceCents / 100));
  }

  function saveItem() {
    if (!editing) {
      return;
    }
    updateItem.saveMenuItem(editing.id, {
      available: editing.available,
      priceCents: priceInputToCents(price)
    });
  }

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.menu.eyebrow}</Text>
        <Text style={type.h1}>{t.menu.title}</Text>
      </View>
      <Panel>
        <SectionTitle eyebrow={t.menu.items} title={t.menu.availability} action={<Button variant="secondary">{t.menu.add}</Button>} />
        <View style={styles.menuGrid}>
          {(items.data ?? []).map((item) => {
            const category = categories.data?.find((entry) => entry.id === item.categoryId)?.name ?? "Menu";
            return (
              <Pressable key={item.id} onPress={() => startEditing(item)} style={styles.menuRow}>
                {item.imageUrl ? (
                  <Image
                    accessibilityLabel=""
                    source={{ uri: item.imageUrl }}
                    style={styles.menuImage}
                  />
                ) : null}
                <View style={{ flex: 1, gap: s[1] }}>
                  <Text style={type.body}>{item.name}</Text>
                  <Text style={type.tiny}>{category}</Text>
                </View>
                <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
                <Badge tone={item.available ? "success" : "danger"}>{item.available ? t.menu.available : t.menu.paused}</Badge>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      <AppModal title={t.menu.edit} visible={Boolean(editing)} onClose={() => setEditing(undefined)}>
        {editing ? (
          <View style={{ gap: s[4] }}>
            <Text style={type.body}>{editing.name}</Text>
            <Field keyboardType="numeric" label={t.menu.price} onChangeText={setPrice} value={price} />
            <Toggle label={t.menu.availableForOrdering} value={editing.available} onValueChange={(available) => setEditing({ ...editing, available })} />
            <Button loading={updateItem.isPending} onPress={saveItem}>
              {t.menu.save}
            </Button>
          </View>
        ) : null}
      </AppModal>
    </View>
  );
}

export function SettingsScreen() {
  const { t } = useI18n();
  const settings = useGetOrderingSettings();
  const update = useOrderingSettingsEditor();
  const data = settings.data;

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.settings.eyebrow}</Text>
        <Text style={type.h1}>{t.settings.title}</Text>
      </View>
      <Panel>
        <SectionTitle eyebrow={t.settings.ordering} title={t.settings.rules} />
        {data ? (
          <View style={styles.settingsGrid}>
            <Toggle label={t.settings.open} value={data.serviceAvailable} onValueChange={(serviceAvailable) => update.saveSettings({ serviceAvailable })} />
            <Toggle label={t.settings.autoAccept} value={data.autoAccept} onValueChange={(autoAccept) => update.saveSettings({ autoAccept })} />
            <SettingMetric label={t.settings.prep} value={formatMinutes(data.prepTimeMinutes)} />
            <SettingMetric label={t.settings.tax} value={`${(data.taxRateBps / 100).toFixed(2)}%`} />
            <SettingMetric label={t.settings.hours} value={data.openingHoursJson} />
          </View>
        ) : (
          <SkeletonRows />
        )}
      </Panel>
    </View>
  );
}

export function LibraryScreen() {
  const { t } = useI18n();
  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.library.eyebrow}</Text>
        <Text style={type.h1}>{t.library.title}</Text>
      </View>
      <View style={styles.libraryGrid}>
        <Panel>
          <SectionTitle eyebrow={t.library.tokens} title={t.library.colorSpacing} />
          <View style={styles.swatchGrid}>
            {[c.ink, c.accent, c.success, c.warning, c.danger, c.info, c.surfaceMuted, c.lineStrong].map((color) => (
              <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
            ))}
          </View>
          <View style={styles.spacingScale}>
            {[4, 8, 12, 16, 24, 32, 48].map((width) => (
              <View key={width} style={[styles.spacingBar, { width }]} />
            ))}
          </View>
        </Panel>
        <Panel>
          <SectionTitle eyebrow={t.library.typography} title={t.library.typeScale} />
          <View style={styles.typeScale}>
            <Text style={type.h1}>Aa / 34</Text>
            <Text style={type.h2}>Aa / 20</Text>
            <Text style={type.body}>Aa / 15</Text>
            <Text style={type.tiny}>Aa / 12</Text>
          </View>
        </Panel>
        <Panel>
          <SectionTitle eyebrow={t.library.surfaces} title={t.library.elevation} />
          <View style={styles.surfaceStack}>
            <View style={styles.surfaceMuted} />
            <View style={styles.surfaceRaised} />
          </View>
        </Panel>
        <Panel>
          <SectionTitle eyebrow={t.library.components} title={t.library.states} />
          <View style={styles.actionStrip}>
            <Button>{t.library.primary}</Button>
            <Button variant="secondary">{t.library.secondary}</Button>
            <Button disabled>{t.library.disabled}</Button>
          </View>
          <View style={styles.actionStrip}>
            <Badge tone="success">{t.library.success}</Badge>
            <Badge tone="warning">{t.library.warning}</Badge>
            <Badge tone="danger">{t.library.error}</Badge>
            <Badge tone="info">{t.library.info}</Badge>
          </View>
          <SkeletonRows count={2} />
        </Panel>
        <Panel>
          <SectionTitle eyebrow={t.library.feedback} title={t.library.toast} />
          <Notice title={t.library.success} tone="success">
            {t.library.toastBody}
          </Notice>
          <Notice title={t.library.warning} tone="warning">
            {t.common.clearFilters}
          </Notice>
        </Panel>
      </View>
    </View>
  );
}

export function CreateOrderModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const customers = useListCustomers();
  const menuItems = useListMenuItems();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const createOrder = useCreateRestaurantOrder({
    onCreated: () => {
      setSelectedItems([]);
      onClose();
    }
  });
  const activeCustomerId = resolveActiveCustomerId(customerId, customers.data?.[0]?.id);

  function toggleItem(id: string) {
    setSelectedItems((items) => toggleSelectedId(items, id));
  }

  function submit() {
    if (!activeCustomerId) {
      return;
    }

    createOrder.createOrder({
      customerId: activeCustomerId,
      menuItemIds: selectedItems
    });
  }

  return (
    <AppModal title={t.create.title} visible={visible} onClose={onClose}>
      <View style={{ gap: s[4] }}>
        <View style={styles.chipRow}>
          {(customers.data ?? []).map((customer) => (
            <Chip key={customer.id} active={customer.id === activeCustomerId} onPress={() => setCustomerId(customer.id)}>
              {customer.name}
            </Chip>
          ))}
        </View>
        <View style={styles.menuGrid}>
          {(menuItems.data ?? []).map((item) => (
            <Pressable
              key={item.id}
              disabled={!item.available}
              onPress={() => toggleItem(item.id)}
              style={[styles.menuRow, selectedItems.includes(item.id) && { backgroundColor: c.accentSoft }, !item.available && { opacity: 0.45 }]}
            >
              {item.imageUrl ? (
                <Image
                  accessibilityLabel=""
                  source={{ uri: item.imageUrl }}
                  style={styles.menuImage}
                />
              ) : null}
              <Text style={[type.body, { flex: 1 }]}>{item.name}</Text>
              <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
            </Pressable>
          ))}
        </View>
        {createOrder.error ? <Text style={[type.muted, { color: c.danger }]}>{createOrder.error.message}</Text> : null}
        <Button disabled={selectedItems.length === 0 || !activeCustomerId} loading={createOrder.isPending} onPress={submit}>
          {t.create.submit}
        </Button>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  actionStrip: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[3]
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[2]
  },
  customerList: {
    gap: s[2],
    marginTop: s[5]
  },
  homeGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: s[4]
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[4]
  },
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[4]
  },
  menuGrid: {
    gap: s[2],
    marginTop: s[5]
  },
  menuImage: {
    backgroundColor: c.surfaceMuted,
    borderRadius: r.sm,
    height: 46,
    width: 62
  },
  menuRow: {
    alignItems: "center",
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[4],
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: s[4],
    paddingVertical: s[3]
  },
  price: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right"
  },
  screenStack: {
    gap: s[6]
  },
  settingsGrid: {
    gap: s[3],
    marginTop: s[5]
  },
  sideStack: {
    flex: 0.78,
    gap: s[4],
    minWidth: 320
  },
  spacingBar: {
    backgroundColor: c.accent,
    borderRadius: r.full,
    height: 8
  },
  spacingScale: {
    gap: s[2],
    marginTop: s[5]
  },
  swatch: {
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    height: 42,
    width: 42
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[2],
    marginTop: s[5]
  },
  surfaceMuted: {
    backgroundColor: c.surfaceMuted,
    borderColor: c.line,
    borderRadius: r.md,
    borderWidth: 1,
    height: 76,
    width: 132
  },
  surfaceRaised: {
    backgroundColor: c.surface,
    borderColor: c.lineStrong,
    borderRadius: r.md,
    borderWidth: 1,
    height: 76,
    marginLeft: -44,
    marginTop: 22,
    width: 132
  },
  surfaceStack: {
    flexDirection: "row",
    marginTop: s[5]
  },
  typeScale: {
    gap: s[3],
    marginTop: s[5]
  }
});
