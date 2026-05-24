import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { BadgeDollarSign, ChefHat, Clock3, Edit3, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2, Upload, X } from "lucide-react-native";
import {
  type Customer,
  type MenuItem,
  type OrderStatus,
  type BusinessSettings,
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
import { CustomerRow, Kpi, OrderInspector, OrderStatusMix, OrderTable, OrderTrendChart, PopularItemsPanel } from "../components/restaurantWidgets";
import { useCreateRestaurantOrder, useCustomerCreator, useCustomerEditor, useMenuItemCreator, useMenuItemDeletion, useMenuItemEditor, useOrderingSettingsEditor, useOrderStatusAction } from "../hooks/restaurantOperations";
import { buildBusinessHoursJson, businessDayLabel, customerNameText, orderCodeText, parseBusinessHoursRows, type BusinessHoursRow } from "../lib/businessText";
import { intlLocale, statusText, useI18n } from "../lib/i18n";
import { menuCategoryNameText, menuItemDescriptionText, menuItemNameText } from "../lib/menuText";
import { c, layout, r, s, type } from "../lib/styles";
import { emptyMenuItemDraft, filterOrdersBySearch, isMenuItemDraftValid, priceInputToCents, resolveActiveCustomerId, resolveMenuImageUrl, resolveSelectedOrder, toggleSelectedId, type MenuItemDraft } from "./dashboardState";
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
      <View style={[layout.between, styles.headerLayer, compact && styles.headerCompact]}>
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
  const { locale, t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const orders = useListOrders(filter === "all" ? { range: timeRange } : { range: timeRange, status: filter });
  const updateStatus = useOrderStatusAction();
  const isPreview = isApiPreview(orders);
  const orderRows = orders.data ?? (isPreview ? demoOrdersForStatus(filter, timeRange) : []);
  const visibleOrders = useMemo(() => filterOrdersBySearch(orderRows, search, locale), [locale, orderRows, search]);
  const selected = useMemo(() => {
    return resolveSelectedOrder(visibleOrders, selectedOrderId);
  }, [selectedOrderId, visibleOrders]);

  return (
    <View style={styles.screenStack}>
      <View style={[layout.between, styles.headerLayer, compact && styles.headerCompact]}>
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

      <View style={styles.ordersSearchBox}>
        <Search size={18} color={c.inkSubtle} />
        <TextInput
          accessibilityLabel={t.topbar.search}
          onChangeText={setSearch}
          placeholder={t.topbar.search}
          placeholderTextColor={c.inkSubtle}
          style={styles.ordersSearchInput}
          value={search}
        />
        {search ? (
          <Pressable accessibilityLabel={t.common.clearSearch} onPress={() => setSearch("")} style={styles.searchClearButton}>
            <X size={16} color={c.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      <Panel>
        {isPreview ? <ApiPreviewNotice /> : null}
        <View style={[styles.filtersBar, compact && styles.filtersBarCompact]}>
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
        {orders.isLoading ? <SkeletonRows count={5} /> : <OrderTable orders={visibleOrders} selectedOrderId={selected?.id} onSelect={setSelectedOrderId} />}
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
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [customerDraft, setCustomerDraft] = useState(emptyCustomerDraft);
  const updateCustomer = useCustomerEditor({
    onSaved: () => {
      setEditingCustomer(undefined);
      setCustomerDraft(emptyCustomerDraft);
    }
  });

  function startEditingCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setCustomerDraft(customerToDraft(customer));
  }

  function updateCustomerDraft(input: Partial<CustomerDraft>) {
    setCustomerDraft((current) => ({ ...current, ...input }));
  }

  function closeCustomerEditor() {
    setEditingCustomer(undefined);
    setCustomerDraft(emptyCustomerDraft);
  }

  function saveCustomer() {
    if (!editingCustomer || !customerDraft.name.trim()) {
      return;
    }

    updateCustomer.saveCustomer(editingCustomer.id, customerDraft);
  }

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
            <CustomerRow
              key={customer.id}
              action={
                <Button
                  disabled={isPreview}
                  icon={<Edit3 size={16} color={c.inkMuted} />}
                  onPress={() => startEditingCustomer(customer)}
                  variant="secondary"
                >
                  {t.crm.edit}
                </Button>
              }
              customer={customer}
            />
          ))}
        </View>
      </Panel>
      <AppModal title={t.crm.edit} visible={Boolean(editingCustomer)} onClose={closeCustomerEditor}>
        <View style={{ gap: s[4] }}>
          <SectionTitle eyebrow={t.create.customer} title={customerDraft.name.trim() || t.create.name} />
          <View style={styles.inlineFieldGrid}>
            <Field label={t.create.name} value={customerDraft.name} onChangeText={(name) => updateCustomerDraft({ name })} />
            <Field label={t.create.email} value={customerDraft.email} onChangeText={(email) => updateCustomerDraft({ email })} />
            <Field label={t.create.phone} value={customerDraft.phone} onChangeText={(phone) => updateCustomerDraft({ phone })} />
          </View>
          {!customerDraft.name.trim() ? <Text style={[type.muted, { color: c.warning }]}>{t.crm.validation}</Text> : null}
          {updateCustomer.error ? <Text style={[type.muted, { color: c.danger }]}>{updateCustomer.error.message}</Text> : null}
          <View style={styles.actionStrip}>
            <Button disabled={isPreview || !customerDraft.name.trim()} loading={updateCustomer.isPending} onPress={saveCustomer}>
              {t.crm.save}
            </Button>
            <Button onPress={closeCustomerEditor} variant="secondary">
              {t.common.cancel}
            </Button>
          </View>
        </View>
      </AppModal>
    </View>
  );
}

export function MenuScreen() {
  const { locale, t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 760;
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
      imageUrl: editing.imageUrl?.trim() || null,
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
              <Pressable key={item.id} onPress={() => startEditing(item)} style={[styles.menuRow, compact && styles.menuRowCompact]}>
                <Image
                  accessibilityLabel=""
                  source={{ uri: resolveMenuImageUrl(item.imageUrl) }}
                  style={styles.menuImage}
                />
                <View style={styles.menuItemCopy}>
                  <Text numberOfLines={2} style={type.body}>{menuItemNameText(item.name, locale)}</Text>
                  <Text style={type.tiny}>{category}</Text>
                </View>
                <View style={[styles.menuItemMeta, compact && styles.menuItemMetaCompact]}>
                  <Text style={styles.price}>{formatCurrency(item.priceCents, intlLocale(locale))}</Text>
                  <Badge tone={item.available ? "success" : "danger"}>{item.available ? t.menu.available : t.menu.paused}</Badge>
                </View>
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
            <MenuImagePicker imageUrl={editing.imageUrl ?? ""} onImageUrlChange={(imageUrl) => setEditing({ ...editing, imageUrl })} />
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
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const settings = useGetOrderingSettings();
  const update = useOrderingSettingsEditor();
  const isPreview = isApiPreview(settings);
  const data = settings.data ?? (isPreview ? demoSettings : undefined);
  const [draft, setDraft] = useState<SettingsDraft | undefined>(() => (data ? settingsToDraft(data) : undefined));

  useEffect(() => {
    if (data) {
      setDraft(settingsToDraft(data));
    }
  }, [data]);

  const validation = draft ? validateSettingsDraft(draft) : undefined;
  const savedDraft = data ? settingsToDraft(data) : undefined;
  const isDirty = Boolean(draft && savedDraft && settingsDraftKey(draft) !== settingsDraftKey(savedDraft));

  function saveDraft() {
    if (!draft || !validation?.valid || isPreview) {
      return;
    }

    update.saveSettings({
      autoAccept: draft.autoAccept,
      serviceAvailable: draft.serviceAvailable,
      prepTimeMinutes: validation.prepTimeMinutes,
      taxRateBps: validation.taxRateBps,
      openingHoursJson: buildBusinessHoursJson(draft.hours)
    });
  }

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.settings.eyebrow}</Text>
        <Text style={type.h1}>{t.settings.title}</Text>
      </View>
      <Panel>
        {isPreview ? <ApiPreviewNotice /> : null}
        <SectionTitle eyebrow={t.settings.ordering} title={t.settings.rules} />
        <Text style={[type.muted, styles.settingsLead]}>{t.settings.orderingHint}</Text>
        {draft ? (
          <View style={styles.settingsForm}>
            <View style={[styles.settingsTwoColumn, compact && styles.settingsTwoColumnCompact]}>
              <View style={styles.settingsSection}>
                <View style={styles.settingControl}>
                  <View style={styles.settingControlCopy}>
                    <Text style={[type.body, styles.strongText]}>{t.settings.open}</Text>
                    <Text style={type.tiny}>{draft.serviceAvailable ? t.service.open : t.settings.closed}</Text>
                  </View>
                  <SmallSwitch value={draft.serviceAvailable} onValueChange={(serviceAvailable) => setDraft({ ...draft, serviceAvailable })} />
                </View>
                <View style={styles.settingControl}>
                  <View style={styles.settingControlCopy}>
                    <Text style={[type.body, styles.strongText]}>{t.settings.autoAccept}</Text>
                    <Text style={type.tiny}>{t.settings.autoAcceptHint}</Text>
                  </View>
                  <SmallSwitch value={draft.autoAccept} onValueChange={(autoAccept) => setDraft({ ...draft, autoAccept })} />
                </View>
              </View>
              <View style={styles.settingsSection}>
                <Text style={type.eyebrow}>{t.settings.pricing}</Text>
                <View style={[styles.settingsFieldsRow, compact && styles.settingsFieldsRowCompact]}>
                  <View style={styles.settingsField}>
                    <Field keyboardType="numeric" label={t.settings.prep} onChangeText={(prepTimeMinutes) => setDraft({ ...draft, prepTimeMinutes })} value={draft.prepTimeMinutes} />
                  </View>
                  <View style={styles.settingsField}>
                    <Field keyboardType="numeric" label={t.settings.tax} onChangeText={(taxRatePercent) => setDraft({ ...draft, taxRatePercent })} value={draft.taxRatePercent} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={type.eyebrow}>{t.settings.hours}</Text>
              <View style={styles.hoursList}>
                {draft.hours.map((row) => (
                  <BusinessHoursEditorRow
                    key={row.day}
                    compact={compact}
                    label={businessDayLabel(row.day, locale)}
                    row={row}
                    onChange={(nextRow) =>
                      setDraft({
                        ...draft,
                        hours: draft.hours.map((item) => (item.day === nextRow.day ? nextRow : item))
                      })
                    }
                  />
                ))}
              </View>
            </View>

            {!validation?.valid ? <Notice title={t.library.error} tone="danger">{t.settings.validation}</Notice> : null}
            {update.error ? <Notice title={t.library.error} tone="danger">{update.error.message}</Notice> : null}
            {update.isSuccess && !isDirty ? <Notice title={t.library.success} tone="success">{t.settings.saved}</Notice> : null}

            <View style={styles.settingsActions}>
              <Button disabled={!isDirty || !validation?.valid || isPreview} loading={update.isPending} onPress={saveDraft}>
                {t.settings.save}
              </Button>
              <Button disabled={!isDirty || !savedDraft} onPress={() => savedDraft && setDraft(savedDraft)} variant="secondary">
                {t.settings.reset}
              </Button>
            </View>
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
  const { width } = useWindowDimensions();
  const compact = width < 760;
  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>{t.library.eyebrow}</Text>
        <Text style={type.h1}>{t.library.title}</Text>
      </View>
      <View style={styles.libraryGrid}>
        <Panel style={compact ? styles.libraryPanelCompact : undefined}>
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
        <Panel style={compact ? styles.libraryPanelCompact : undefined}>
          <SectionTitle eyebrow={t.library.typography} title={t.library.typeScale} />
          <View style={styles.typeScale}>
            <Text style={type.h1}>Aa / 34</Text>
            <Text style={type.h2}>Aa / 20</Text>
            <Text style={type.body}>Aa / 15</Text>
            <Text style={type.tiny}>Aa / 12</Text>
          </View>
        </Panel>
        <Panel style={compact ? styles.libraryPanelCompact : undefined}>
          <SectionTitle eyebrow={t.library.surfaces} title={t.library.elevation} />
          <View style={styles.surfaceStack}>
            <View style={styles.surfaceMuted} />
            <View style={styles.surfaceRaised} />
          </View>
        </Panel>
        <Panel style={compact ? styles.libraryPanelCompact : undefined}>
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
        <Panel style={compact ? styles.libraryPanelCompact : undefined}>
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
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [customerDraft, setCustomerDraft] = useState({ name: "", email: "", phone: "" });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const createCustomer = useCustomerCreator({
    onCreated: (customer) => {
      setCustomerId(customer.id);
      setAddingCustomer(false);
      setCustomerDraft({ name: "", email: "", phone: "" });
    }
  });
  const createOrder = useCreateRestaurantOrder({
    onCreated: () => {
      setSelectedItems([]);
      resetCustomerForm();
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

  function updateCustomerDraft(input: Partial<typeof customerDraft>) {
    setCustomerDraft((current) => ({ ...current, ...input }));
  }

  function resetCustomerForm() {
    setAddingCustomer(false);
    setCustomerDraft({ name: "", email: "", phone: "" });
  }

  function closeModal() {
    resetCustomerForm();
    onClose();
  }

  function submitCustomer() {
    const name = customerDraft.name.trim();
    if (!name) {
      return;
    }

    createCustomer.createCustomer(customerDraft);
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
    <AppModal title={t.create.title} visible={visible} onClose={closeModal}>
      <View style={{ gap: s[4] }}>
        {isPreview ? <ApiPreviewNotice /> : null}
        <SectionTitle eyebrow={t.create.customer} title={activeCustomer ? customerNameText(activeCustomer.name, locale) : t.common.none} />
        <View style={styles.chipRow}>
          <Chip active={addingCustomer} onPress={() => setAddingCustomer(true)}>
            {t.create.addCustomer}
          </Chip>
          {customerRows.map((customer) => (
            <Chip
              key={customer.id}
              active={!addingCustomer && customer.id === activeCustomerId}
              onPress={() => {
                setAddingCustomer(false);
                setCustomerId(customer.id);
              }}
            >
              {customerNameText(customer.name, locale)}
            </Chip>
          ))}
        </View>
        {addingCustomer ? (
          <Panel style={styles.inlineFormPanel}>
            <SectionTitle eyebrow={t.create.addCustomer} title={customerDraft.name.trim() || t.create.name} />
            <View style={styles.inlineFieldGrid}>
              <Field label={t.create.name} value={customerDraft.name} onChangeText={(name) => updateCustomerDraft({ name })} />
              <Field label={t.create.email} value={customerDraft.email} onChangeText={(email) => updateCustomerDraft({ email })} />
              <Field label={t.create.phone} value={customerDraft.phone} onChangeText={(phone) => updateCustomerDraft({ phone })} />
            </View>
            {createCustomer.error ? <Text style={[type.muted, { color: c.danger }]}>{createCustomer.error.message}</Text> : null}
            <Button disabled={isPreview || !customerDraft.name.trim()} loading={createCustomer.isPending} onPress={submitCustomer} variant="secondary">
              {t.create.saveCustomer}
            </Button>
          </Panel>
        ) : null}
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

type SettingsDraft = {
  serviceAvailable: boolean;
  autoAccept: boolean;
  prepTimeMinutes: string;
  taxRatePercent: string;
  hours: BusinessHoursRow[];
};

type CustomerDraft = {
  name: string;
  email: string;
  phone: string;
};

const emptyCustomerDraft: CustomerDraft = { name: "", email: "", phone: "" };

function customerToDraft(customer: Customer): CustomerDraft {
  return {
    name: customer.name,
    email: customer.email ?? "",
    phone: customer.phone ?? ""
  };
}

function settingsToDraft(settings: BusinessSettings): SettingsDraft {
  return {
    serviceAvailable: settings.serviceAvailable,
    autoAccept: settings.autoAccept,
    prepTimeMinutes: String(settings.prepTimeMinutes),
    taxRatePercent: (settings.taxRateBps / 100).toFixed(2),
    hours: parseBusinessHoursRows(settings.openingHoursJson)
  };
}

function settingsDraftKey(draft: SettingsDraft) {
  return JSON.stringify({
    serviceAvailable: draft.serviceAvailable,
    autoAccept: draft.autoAccept,
    prepTimeMinutes: Number.parseInt(draft.prepTimeMinutes, 10),
    taxRatePercent: Number.parseFloat(draft.taxRatePercent),
    openingHoursJson: buildBusinessHoursJson(draft.hours)
  });
}

function validateSettingsDraft(draft: SettingsDraft):
  | { valid: true; prepTimeMinutes: number; taxRateBps: number }
  | { valid: false } {
  const prepTimeMinutes = Number.parseInt(draft.prepTimeMinutes, 10);
  const taxRatePercent = Number.parseFloat(draft.taxRatePercent);
  const taxRateBps = Math.round(taxRatePercent * 100);
  const hasValidHours = draft.hours.every((row) => row.closed || (isTimeValue(row.opensAt) && isTimeValue(row.closesAt)));

  if (!Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 1 || prepTimeMinutes > 240 || !Number.isFinite(taxRatePercent) || taxRateBps < 0 || taxRateBps > 2500 || !hasValidHours) {
    return { valid: false };
  }

  return { valid: true, prepTimeMinutes, taxRateBps };
}

function isTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

function SmallSwitch({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onValueChange(!value)} style={[styles.smallSwitchTrack, value && styles.smallSwitchTrackActive]}>
      <View style={[styles.smallSwitchThumb, value && styles.smallSwitchThumbActive]} />
    </Pressable>
  );
}

function BusinessHoursEditorRow({
  compact,
  label,
  row,
  onChange
}: {
  compact: boolean;
  label: string;
  row: BusinessHoursRow;
  onChange: (row: BusinessHoursRow) => void;
}) {
  return (
    <View style={[styles.hoursRow, compact && styles.hoursRowCompact]}>
      <View style={styles.hoursDay}>
        <Text style={[type.body, styles.strongText]}>{label}</Text>
        <SmallSwitch value={!row.closed} onValueChange={(open) => onChange({ ...row, closed: !open })} />
      </View>
      <View style={[styles.hoursInputs, compact && styles.hoursInputsCompact, row.closed && styles.hoursInputsDisabled]}>
        <TextInput
          editable={!row.closed}
          onChangeText={(opensAt) => onChange({ ...row, opensAt })}
          placeholder="11:00"
          placeholderTextColor={c.inkSubtle}
          style={styles.timeInput}
          value={row.opensAt}
        />
        <Text style={type.tiny}>-</Text>
        <TextInput
          editable={!row.closed}
          onChangeText={(closesAt) => onChange({ ...row, closesAt })}
          placeholder="22:00"
          placeholderTextColor={c.inkSubtle}
          style={styles.timeInput}
          value={row.closesAt}
        />
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
  filtersBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[4],
    justifyContent: "space-between",
    marginBottom: s[5]
  },
  filtersBarCompact: {
    alignItems: "flex-start",
    flexDirection: "column"
  },
  headerLayer: {
    position: "relative",
    zIndex: 20
  },
  hoursDay: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 150
  },
  hoursInputs: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: s[3],
    justifyContent: "flex-end"
  },
  hoursInputsCompact: {
    justifyContent: "space-between",
    width: "100%"
  },
  hoursInputsDisabled: {
    opacity: 0.42
  },
  hoursList: {
    gap: s[2]
  },
  hoursRow: {
    alignItems: "center",
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[4],
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: s[4],
    paddingVertical: s[3]
  },
  hoursRowCompact: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  inlineFieldGrid: {
    flexDirection: "column",
    gap: s[3]
  },
  inlineFormPanel: {
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
  libraryPanelCompact: {
    width: "100%"
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
  menuRowCompact: {
    alignItems: "center",
    gap: s[3],
    paddingHorizontal: s[3]
  },
  menuItemCopy: {
    flex: 1,
    gap: s[1],
    minWidth: 0
  },
  menuItemMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[3]
  },
  menuItemMetaCompact: {
    alignItems: "flex-end",
    flexDirection: "column",
    gap: s[2],
    minWidth: 86
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
  ordersSearchBox: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[3],
    maxWidth: 520,
    minHeight: 42,
    paddingHorizontal: s[3],
    width: "100%"
  },
  ordersSearchInput: {
    color: c.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 38,
    padding: 0
  },
  searchClearButton: {
    alignItems: "center",
    borderRadius: r.full,
    height: 28,
    justifyContent: "center",
    width: 28
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
  settingControl: {
    alignItems: "center",
    backgroundColor: c.surfaceMuted,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[4],
    justifyContent: "space-between",
    minHeight: 70,
    padding: s[4]
  },
  settingControlCopy: {
    flex: 1,
    gap: s[1]
  },
  settingsActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[3]
  },
  settingsField: {
    flex: 1,
    minWidth: 160
  },
  settingsFieldsRow: {
    flexDirection: "row",
    gap: s[3]
  },
  settingsFieldsRowCompact: {
    flexDirection: "column"
  },
  settingsForm: {
    gap: s[3],
    marginTop: s[5]
  },
  settingsLead: {
    marginTop: s[2],
    maxWidth: 760
  },
  settingsSection: {
    flex: 1,
    gap: s[3]
  },
  settingsTwoColumn: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: s[4]
  },
  settingsTwoColumnCompact: {
    flexDirection: "column"
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
  smallSwitchThumb: {
    backgroundColor: c.surface,
    borderRadius: r.full,
    height: 18,
    transform: [{ translateX: 0 }],
    width: 18
  },
  smallSwitchThumbActive: {
    transform: [{ translateX: 20 }]
  },
  smallSwitchTrack: {
    backgroundColor: c.lineStrong,
    borderRadius: r.full,
    height: 24,
    justifyContent: "center",
    padding: 3,
    width: 48
  },
  smallSwitchTrackActive: {
    backgroundColor: c.success
  },
  strongText: {
    fontWeight: "700"
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
  timeInput: {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    color: c.ink,
    fontSize: 14,
    fontWeight: "700",
    height: 38,
    paddingHorizontal: s[3],
    textAlign: "center",
    width: 92
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
