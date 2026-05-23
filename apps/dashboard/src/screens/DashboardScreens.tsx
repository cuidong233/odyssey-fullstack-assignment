import { useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BadgeDollarSign, ChefHat, Clock3, Plus, ShoppingBag, SlidersHorizontal, Trash2, Upload } from "lucide-react-native";
import {
  type MenuItem,
  type OrderStatus,
  type TimeRange,
  orderStatuses,
  useGetOrderingSettings,
  useGetHomeSummary,
  useListCustomers,
  useListMenuCategories,
  useListMenuItems,
  useListOrders
} from "@repo/api-client";
import { formatCurrency } from "@repo/shared";
import { AppModal, Badge, Button, Chip, Field, Notice, Panel, SectionTitle, SkeletonRows, Toggle } from "@repo/shared/ui";
import { CustomerRow, Kpi, OrderInspector, OrderStatusMix, OrderTable, OrderTrendChart, PopularItemsPanel, SettingMetric } from "../components/restaurantWidgets";
import { useCreateRestaurantOrder, useMenuItemCreator, useMenuItemDeletion, useMenuItemEditor, useOrderingSettingsEditor, useOrderStatusAction } from "../hooks/restaurantOperations";
import { businessHoursText, customerNameText, orderCodeText } from "../lib/businessText";
import { intlLocale, statusText, useI18n } from "../lib/i18n";
import { menuCategoryNameText, menuItemDescriptionText, menuItemNameText } from "../lib/menuText";
import { c, layout, r, s, type } from "../lib/styles";
import { emptyMenuItemDraft, isMenuItemDraftValid, priceInputToCents, resolveActiveCustomerId, resolveMenuImageUrl, resolveSelectedOrder, toggleSelectedId, type MenuItemDraft } from "./dashboardState";
import { demoCategories, demoCustomers, demoHomeSummaryForRange, demoMenuItems, demoOrdersForRange, demoOrdersForStatus, demoSettings } from "./demoData";

export function HomeScreen({ rangeControl, timeRange, onCreateOrder }: { rangeControl: ReactNode; timeRange: TimeRange; onCreateOrder: () => void }) {
  const { locale, t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const summary = useGetHomeSummary({ range: timeRange });
  const orders = useListOrders({ range: timeRange });
  const isPreview = isApiPreview(summary) || isApiPreview(orders);
  const summaryData = summary.data ?? (isApiPreview(summary) ? demoHomeSummaryForRange(timeRange) : undefined);
  const orderRows = orders.data ?? (isApiPreview(orders) ? demoOrdersForRange(timeRange) : []);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const selectedOrder = useMemo(() => {
    return resolveSelectedOrder(orderRows, selectedOrderId);
  }, [orderRows, selectedOrderId]);

  return (
    <View style={styles.screenStack}>
      <View style={[layout.between, compact && styles.headerCompact]}>
        <View>
          <Text style={type.eyebrow}>{t.home.eyebrow}</Text>
          <Text style={type.h1}>{t.home.title}</Text>
        </View>
        <View style={styles.headerActions}>
          {rangeControl}
          <Button icon={<Plus size={16} color={c.surface} />} onPress={onCreateOrder}>
            {t.topbar.createOrder}
          </Button>
        </View>
      </View>

      {summary.isLoading ? (
        <SkeletonRows />
      ) : (
        <View style={[styles.kpiGrid, compact && styles.kpiGridCompact]}>
          <Kpi icon={<BadgeDollarSign size={20} color={c.success} />} label={t.home.revenue} value={formatCurrency(summaryData?.revenueCents ?? 0, intlLocale(locale))} note={t.home.revenueNote} />
          <Kpi icon={<ShoppingBag size={20} color={c.accent} />} label={t.home.totalOrders} value={`${summaryData?.totalOrders ?? 0}`} note={t.home.totalOrdersNote} />
          <Kpi icon={<Clock3 size={20} color={c.warning} />} label={t.home.pending} value={`${summaryData?.pendingOrders ?? 0}`} note={t.home.pendingNote} />
          <Kpi icon={<ChefHat size={20} color={c.info} />} label={t.home.popularItems} value={`${summaryData?.popularItems.length ?? 0}`} note={t.home.popularItemsNote} />
        </View>
      )}

      {isPreview ? <ApiPreviewNotice /> : null}

      <View style={[styles.visualizationGrid, compact && styles.visualizationGridCompact]}>
        <OrderTrendChart orders={orderRows} />
        <View style={[styles.statusMixColumn, compact && styles.statusMixColumnCompact]}>
          <OrderStatusMix orders={orderRows} />
        </View>
      </View>

      <View style={[styles.homeGrid, compact && styles.homeGridCompact]}>
        <Panel style={[styles.homeOrdersPanel, compact && styles.homeOrdersPanelCompact]}>
          <SectionTitle eyebrow={t.home.queue} title={t.home.recentOrders} />
          <ScrollView style={styles.homeOrdersScroll} contentContainerStyle={styles.homeOrdersScrollContent} showsVerticalScrollIndicator>
            <OrderTable orders={orderRows} selectedOrderId={selectedOrder?.id} onSelect={setSelectedOrderId} />
          </ScrollView>
        </Panel>
        <View style={[styles.sideStack, compact && styles.sideStackCompact]}>
          <PopularItemsPanel items={summaryData?.popularItems ?? []} />
          {selectedOrder ? <OrderInspector order={selectedOrder} /> : null}
        </View>
      </View>
    </View>
  );
}

export function OrdersScreen({ rangeControl, timeRange, onCreateOrder }: { rangeControl: ReactNode; timeRange: TimeRange; onCreateOrder: () => void }) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const orders = useListOrders(filter === "all" ? { range: timeRange } : { range: timeRange, status: filter });
  const updateStatus = useOrderStatusAction();
  const isPreview = isApiPreview(orders);
  const orderRows = orders.data ?? (isPreview ? demoOrdersForStatus(filter, timeRange) : []);
  const selected = orderRows[0];

  return (
    <View style={styles.screenStack}>
      <View style={[layout.between, compact && styles.headerCompact]}>
        <View>
          <Text style={type.eyebrow}>{t.orders.eyebrow}</Text>
          <Text style={type.h1}>{t.orders.title}</Text>
        </View>
        <View style={styles.headerActions}>
          {rangeControl}
          <Button icon={<Plus size={16} color={c.surface} />} onPress={onCreateOrder}>
            {t.topbar.createOrder}
          </Button>
        </View>
      </View>

      <Panel>
        {isPreview ? <ApiPreviewNotice /> : null}
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
        {orders.isLoading ? <SkeletonRows count={5} /> : <OrderTable orders={orderRows} />}
      </Panel>

      {selected ? (
        <Panel>
          <SectionTitle eyebrow={t.orders.actions} title={`${orderCodeText(selected.id)} ${t.orders.nextSteps}`} />
          <View style={styles.actionStrip}>
            {selected.nextStatuses.map((nextStatus) => (
              <Button
                key={nextStatus}
                disabled={isPreview || updateStatus.isPending}
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
  const isPreview = isApiPreview(customers);
  const customerRows = customers.data ?? (isPreview ? demoCustomers : []);

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.crm.eyebrow}</Text>
        <Text style={type.h1}>{t.crm.title}</Text>
      </View>
      <Panel>
        {isPreview ? <ApiPreviewNotice /> : null}
        <SectionTitle eyebrow={t.crm.customers} title={t.crm.stats} />
        <View style={styles.customerList}>
          {customerRows.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </View>
      </Panel>
    </View>
  );
}

export function MenuScreen() {
  const { locale, t } = useI18n();
  const items = useListMenuItems();
  const categories = useListMenuCategories();
  const isPreview = isApiPreview(items) || isApiPreview(categories);
  const itemRows = items.data ?? (isApiPreview(items) ? demoMenuItems : []);
  const categoryRows = categories.data ?? (isApiPreview(categories) ? demoCategories : []);
  const [editing, setEditing] = useState<MenuItem | undefined>();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<MenuItemDraft>(emptyMenuItemDraft);
  const [price, setPrice] = useState("");
  const createItem = useMenuItemCreator({
    onCreated: () => {
      setCreating(false);
      setDraft(emptyMenuItemDraft);
    }
  });
  const updateItem = useMenuItemEditor({ onSaved: () => setEditing(undefined) });
  const deleteItem = useMenuItemDeletion({ onDeleted: () => setEditing(undefined) });

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

  function deleteEditingItem() {
    if (!editing) {
      return;
    }
    deleteItem.deleteMenuItem(editing.id);
  }

  function startCreating() {
    setDraft({ ...emptyMenuItemDraft, categoryId: categoryRows[0]?.id });
    setCreating(true);
  }

  function updateDraft(input: Partial<MenuItemDraft>) {
    setDraft((current) => ({ ...current, ...input }));
  }

  function createMenuItem() {
    if (!draft.categoryId || !isMenuItemDraftValid(draft)) {
      return;
    }

    createItem.createMenuItem({
      available: draft.available,
      categoryId: draft.categoryId,
      description: draft.description.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      name: draft.name.trim(),
      priceCents: priceInputToCents(draft.price),
      sortOrder: itemRows.length + 1
    });
  }

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.menu.eyebrow}</Text>
        <Text style={type.h1}>{t.menu.title}</Text>
      </View>
      <Panel>
        {isPreview ? <ApiPreviewNotice /> : null}
        <SectionTitle eyebrow={t.menu.items} title={t.menu.availability} action={<Button disabled={categoryRows.length === 0} onPress={startCreating} variant="secondary">{t.menu.add}</Button>} />
        <View style={styles.menuGrid}>
          {itemRows.map((item) => {
            const categoryName = categoryRows.find((entry) => entry.id === item.categoryId)?.name;
            const category = categoryName ? menuCategoryNameText(categoryName, locale) : t.common.menuFallback;
            return (
              <Pressable key={item.id} onPress={() => startEditing(item)} style={styles.menuRow}>
                <Image
                  accessibilityLabel=""
                  source={{ uri: resolveMenuImageUrl(item.imageUrl) }}
                  style={styles.menuImage}
                />
                <View style={{ flex: 1, gap: s[1] }}>
                  <Text style={type.body}>{menuItemNameText(item.name, locale)}</Text>
                  <Text style={type.tiny}>{category}</Text>
                </View>
                <Text style={styles.price}>{formatCurrency(item.priceCents, intlLocale(locale))}</Text>
                <Badge tone={item.available ? "success" : "danger"}>{item.available ? t.menu.available : t.menu.paused}</Badge>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      <AppModal title={t.menu.create} visible={creating} onClose={() => setCreating(false)}>
        <View style={{ gap: s[4] }}>
          <Field label={t.menu.name} onChangeText={(name) => updateDraft({ name })} value={draft.name} />
          <Field label={t.menu.description} onChangeText={(description) => updateDraft({ description })} value={draft.description} />
          <MenuImagePicker imageUrl={draft.imageUrl} onImageUrlChange={(imageUrl) => updateDraft({ imageUrl })} />
          <Field keyboardType="numeric" label={t.menu.price} onChangeText={(nextPrice) => updateDraft({ price: nextPrice })} value={draft.price} />
          <View style={styles.chipRow}>
            {categoryRows.map((category) => (
              <Chip key={category.id} active={category.id === draft.categoryId} onPress={() => updateDraft({ categoryId: category.id })}>
                {menuCategoryNameText(category.name, locale)}
              </Chip>
            ))}
          </View>
          <Toggle label={t.menu.availableForOrdering} value={draft.available} onValueChange={(available) => updateDraft({ available })} />
          {!isMenuItemDraftValid(draft) ? <Text style={[type.muted, { color: c.warning }]}>{t.menu.validation}</Text> : null}
          {createItem.error ? <Text style={[type.muted, { color: c.danger }]}>{createItem.error.message}</Text> : null}
          <Button disabled={isPreview || !isMenuItemDraftValid(draft)} loading={createItem.isPending} onPress={createMenuItem}>
            {t.menu.createSave}
          </Button>
        </View>
      </AppModal>

      <AppModal title={t.menu.edit} visible={Boolean(editing)} onClose={() => setEditing(undefined)}>
        {editing ? (
          <View style={{ gap: s[4] }}>
            <Text style={type.body}>{menuItemNameText(editing.name, locale)}</Text>
            {editing.description ? <Text style={type.tiny}>{menuItemDescriptionText(editing.description, locale)}</Text> : null}
            <Field keyboardType="numeric" label={t.menu.price} onChangeText={setPrice} value={price} />
            <Toggle label={t.menu.availableForOrdering} value={editing.available} onValueChange={(available) => setEditing({ ...editing, available })} />
            {deleteItem.error ? <Text style={[type.muted, { color: c.danger }]}>{deleteItem.error.message}</Text> : null}
            <View style={styles.modalActionRow}>
              <Button disabled={isPreview} loading={updateItem.isPending} onPress={saveItem}>
                {t.menu.save}
              </Button>
              <Button disabled={isPreview} icon={<Trash2 size={16} color={c.danger} />} loading={deleteItem.isPending} onPress={deleteEditingItem} variant="danger">
                {t.menu.delete}
              </Button>
            </View>
          </View>
        ) : null}
      </AppModal>
    </View>
  );
}

export function SettingsScreen() {
  const { locale, t } = useI18n();
  const settings = useGetOrderingSettings();
  const update = useOrderingSettingsEditor();
  const isPreview = isApiPreview(settings);
  const data = settings.data ?? (isPreview ? demoSettings : undefined);

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.settings.eyebrow}</Text>
        <Text style={type.h1}>{t.settings.title}</Text>
      </View>
      <Panel>
        {isPreview ? <ApiPreviewNotice /> : null}
        <SectionTitle eyebrow={t.settings.ordering} title={t.settings.rules} />
        {data ? (
          <View style={styles.settingsGrid}>
            <Toggle label={t.settings.open} value={data.serviceAvailable} onValueChange={(serviceAvailable) => update.saveSettings({ serviceAvailable })} />
            <Toggle label={t.settings.autoAccept} value={data.autoAccept} onValueChange={(autoAccept) => update.saveSettings({ autoAccept })} />
            <SettingMetric label={t.settings.prep} value={t.common.minutes(data.prepTimeMinutes)} />
            <SettingMetric label={t.settings.tax} value={`${(data.taxRateBps / 100).toFixed(2)}%`} />
            <SettingMetric label={t.settings.hours} value={businessHoursText(data.openingHoursJson, locale)} />
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
  const { locale, t } = useI18n();
  const customers = useListCustomers();
  const menuItems = useListMenuItems();
  const isPreview = isApiPreview(customers) || isApiPreview(menuItems);
  const customerRows = customers.data ?? (isApiPreview(customers) ? demoCustomers : []);
  const menuRows = menuItems.data ?? (isApiPreview(menuItems) ? demoMenuItems : []);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const createOrder = useCreateRestaurantOrder({
    onCreated: () => {
      setSelectedItems([]);
      onClose();
    }
  });
  const activeCustomerId = resolveActiveCustomerId(customerId, customerRows[0]?.id);
  const activeCustomer = customerRows.find((customer) => customer.id === activeCustomerId);
  const selectedTotalCents = menuRows.reduce((total, item) => {
    return selectedItems.includes(item.id) ? total + item.priceCents : total;
  }, 0);

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
        {isPreview ? <ApiPreviewNotice /> : null}
        <SectionTitle eyebrow={t.create.customer} title={activeCustomer ? customerNameText(activeCustomer.name, locale) : t.common.none} />
        <View style={styles.chipRow}>
          {customerRows.map((customer) => (
            <Chip key={customer.id} active={customer.id === activeCustomerId} onPress={() => setCustomerId(customer.id)}>
              {customerNameText(customer.name, locale)}
            </Chip>
          ))}
        </View>
        <View style={styles.orderDraftSummary}>
          <Text style={type.tiny}>{t.common.itemCount(selectedItems.length)}</Text>
          <Text style={styles.price}>{formatCurrency(selectedTotalCents, intlLocale(locale))}</Text>
        </View>
        <SectionTitle eyebrow={t.create.menuItems} title={t.common.menuSection} />
        <View style={styles.menuGrid}>
          {menuRows.map((item) => (
            <Pressable
              key={item.id}
              disabled={!item.available}
              onPress={() => toggleItem(item.id)}
              style={[styles.menuRow, selectedItems.includes(item.id) && { backgroundColor: c.accentSoft }, !item.available && { opacity: 0.45 }]}
            >
              <Image
                accessibilityLabel=""
                source={{ uri: resolveMenuImageUrl(item.imageUrl) }}
                style={styles.menuImage}
              />
              <Text style={[type.body, { flex: 1 }]}>{menuItemNameText(item.name, locale)}</Text>
              <Text style={styles.price}>{formatCurrency(item.priceCents, intlLocale(locale))}</Text>
            </Pressable>
          ))}
        </View>
        {createOrder.error ? <Text style={[type.muted, { color: c.danger }]}>{createOrder.error.message}</Text> : null}
        <Button disabled={isPreview || selectedItems.length === 0 || !activeCustomerId} loading={createOrder.isPending} onPress={submit}>
          {t.create.submit}
        </Button>
      </View>
    </AppModal>
  );
}

function ApiPreviewNotice() {
  const { t } = useI18n();
  return (
    <Notice title={t.preview.title} tone="warning">
      {t.preview.body}
    </Notice>
  );
}

function MenuImagePicker({
  imageUrl,
  onImageUrlChange
}: {
  imageUrl: string;
  onImageUrlChange: (imageUrl: string) => void;
}) {
  const { t } = useI18n();
  const [fileName, setFileName] = useState<string | undefined>();

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        onImageUrlChange(reader.result);
        setFileName(file.name);
      }
    });
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  }

  return (
    <View style={styles.imagePicker}>
      <Text style={type.tiny}>{t.menu.image}</Text>
      <View style={styles.imagePickerRow}>
        <Image
          accessibilityLabel=""
          source={{ uri: resolveMenuImageUrl(imageUrl) }}
          style={styles.imagePickerPreview}
        />
        <View style={{ flex: 1, gap: s[2] }}>
          {Platform.OS === "web" ? (
            <label style={webUploadLabelStyle}>
              <Upload size={16} color={c.inkMuted} />
              <Text style={type.body}>{t.menu.uploadImage}</Text>
              <input accept="image/*" aria-label={t.menu.uploadImage} onChange={handleImageChange} style={webFileInputStyle} type="file" />
            </label>
          ) : (
            <Text style={type.muted}>{t.menu.uploadImage}</Text>
          )}
          <Text style={type.tiny}>{fileName ?? t.menu.defaultImage}</Text>
        </View>
      </View>
    </View>
  );
}

function isApiPreview(query: { data?: unknown; isError: boolean }) {
  return query.isError && query.data === undefined;
}

const webFileInputStyle = {
  display: "none"
} satisfies CSSProperties;

const webUploadLabelStyle = {
  alignItems: "center",
  borderColor: c.lineStrong,
  borderRadius: r.sm,
  borderWidth: 1,
  cursor: "pointer",
  display: "flex",
  flexDirection: "row",
  gap: s[2],
  justifyContent: "center",
  minHeight: 38,
  paddingLeft: s[4],
  paddingRight: s[4]
} satisfies CSSProperties;

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
  homeGridCompact: {
    flexDirection: "column"
  },
  homeOrdersPanel: {
    flex: 1.35,
    height: 560
  },
  homeOrdersPanelCompact: {
    height: 480,
    width: "100%"
  },
  homeOrdersScroll: {
    flex: 1,
    marginTop: s[5]
  },
  homeOrdersScrollContent: {
    paddingBottom: s[2]
  },
  headerCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: s[3]
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[3]
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[4]
  },
  kpiGridCompact: {
    flexDirection: "column"
  },
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[4]
  },
  menuGrid: {
    gap: s[2],
    marginTop: s[2]
  },
  menuImage: {
    backgroundColor: c.surfaceMuted,
    borderRadius: r.sm,
    height: 46,
    width: 62
  },
  imagePicker: {
    gap: s[2]
  },
  imagePickerPreview: {
    backgroundColor: c.surfaceMuted,
    borderColor: c.line,
    borderRadius: r.md,
    borderWidth: 1,
    height: 88,
    width: 118
  },
  imagePickerRow: {
    alignItems: "center",
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[4],
    padding: s[3]
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
  modalActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[3]
  },
  orderDraftSummary: {
    alignItems: "center",
    backgroundColor: c.surfaceMuted,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
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
  sideStackCompact: {
    flex: undefined,
    minWidth: 0,
    width: "100%"
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
  statusMixColumn: {
    flex: 0.48,
    minWidth: 280
  },
  statusMixColumnCompact: {
    flex: undefined,
    minWidth: 0,
    width: "100%"
  },
  typeScale: {
    gap: s[3],
    marginTop: s[5]
  },
  visualizationGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: s[4]
  },
  visualizationGridCompact: {
    flexDirection: "column"
  }
});
