import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BadgeDollarSign,
  BookOpen,
  ChefHat,
  Clock3,
  Home,
  Library,
  Menu as MenuIcon,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Users
} from "lucide-react-native";
import {
  type Customer,
  type MenuItem,
  type Order,
  useCreateOrder,
  useGetOrderingSettings,
  useGetHomeSummary,
  useListCustomers,
  useListMenuCategories,
  useListMenuItems,
  useListOrders,
  useUpdateOrderingSettings,
  useUpdateMenuItem,
  useUpdateOrderStatus
} from "@repo/api-client";
import { formatCurrency, formatMinutes, orderStatuses, statusLabels, type OrderStatus, tokens } from "@repo/shared";
import { AppModal, Badge, Button, Chip, Field, Panel, SectionTitle, SelectLike, SkeletonRows, StatusBadge, Toggle } from "./components/ui";
import { c, layout, r, s, type } from "./lib/styles";

type Page = "home" | "orders" | "crm" | "menu" | "settings" | "library";

const queryClient = new QueryClient();

const navItems: Array<{ id: Page; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "crm", label: "CRM", icon: Users },
  { id: "menu", label: "Menu", icon: MenuIcon },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "library", label: "UI Library", icon: Library }
];

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardApp />
    </QueryClientProvider>
  );
}

function DashboardApp() {
  const [page, setPage] = useState<Page>("home");
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  return (
    <View style={styles.app}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <ChefHat size={20} color={c.surface} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Odyssey</Text>
            <Text style={styles.brandMeta}>Restaurant Ops</Text>
          </View>
        </View>

        <View style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === page;
            return (
              <Pressable key={item.id} onPress={() => setPage(item.id)} style={[styles.navItem, active && styles.navItemActive]}>
                <Icon size={18} color={active ? c.accent : c.inkMuted} />
                <Text style={[styles.navText, active && { color: c.ink }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Panel style={styles.sidebarPanel}>
          <Text style={type.eyebrow}>Service</Text>
          <Text style={styles.sidebarNumber}>Open</Text>
          <Text style={type.tiny}>Average prep time holds at 14 minutes.</Text>
        </Panel>
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <View style={styles.searchBox}>
            <Search size={18} color={c.inkSubtle} />
            <Text style={styles.searchText}>Search orders, guests, menu items</Text>
          </View>
          <View style={[layout.row, { gap: s[3] }]}>
            <SelectLike label="Today" />
            <Button icon={<Plus size={16} color={c.surface} />} onPress={() => setCreateOrderOpen(true)}>
              Create order
            </Button>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {page === "home" ? <HomeScreen onCreateOrder={() => setCreateOrderOpen(true)} /> : null}
          {page === "orders" ? <OrdersScreen onCreateOrder={() => setCreateOrderOpen(true)} /> : null}
          {page === "crm" ? <CrmScreen /> : null}
          {page === "menu" ? <MenuScreen /> : null}
          {page === "settings" ? <SettingsScreen /> : null}
          {page === "library" ? <LibraryScreen /> : null}
        </ScrollView>
      </View>

      <CreateOrderModal visible={createOrderOpen} onClose={() => setCreateOrderOpen(false)} />
    </View>
  );
}

function HomeScreen({ onCreateOrder }: { onCreateOrder: () => void }) {
  const summary = useGetHomeSummary();
  const orders = useListOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const selectedOrder = useMemo(() => {
    const list = orders.data ?? [];
    return list.find((order) => order.id === selectedOrderId) ?? list[0];
  }, [orders.data, selectedOrderId]);

  return (
    <View style={styles.screenStack}>
      <View style={layout.between}>
        <View>
          <Text style={type.eyebrow}>Live operations</Text>
          <Text style={type.h1}>Today&apos;s floor</Text>
        </View>
        <Button icon={<Plus size={16} color={c.surface} />} onPress={onCreateOrder}>
          New order
        </Button>
      </View>

      {summary.isLoading ? (
        <SkeletonRows />
      ) : (
        <View style={styles.kpiGrid}>
          <Kpi icon={<BadgeDollarSign size={20} color={c.success} />} label="Revenue" value={formatCurrency(summary.data?.revenueCents ?? 0)} note="Net of cancelled orders" />
          <Kpi icon={<ShoppingBag size={20} color={c.accent} />} label="Total orders" value={`${summary.data?.totalOrders ?? 0}`} note="Across all channels" />
          <Kpi icon={<Clock3 size={20} color={c.warning} />} label="Pending" value={`${summary.data?.pendingOrders ?? 0}`} note="Needs action" />
          <Kpi icon={<ChefHat size={20} color={c.info} />} label="Popular items" value={`${summary.data?.popularItems.length ?? 0}`} note="Tracked from completed orders" />
        </View>
      )}

      <View style={styles.homeGrid}>
        <Panel style={{ flex: 1.35 }}>
          <SectionTitle eyebrow="Queue" title="Recent orders" action={<SelectLike label="All channels" />} />
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

function OrdersScreen({ onCreateOrder }: { onCreateOrder: () => void }) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const orders = useListOrders(filter === "all" ? undefined : { status: filter });
  const updateStatus = useUpdateOrderStatus();
  const selected = orders.data?.[0];

  return (
    <View style={styles.screenStack}>
      <View style={layout.between}>
        <View>
          <Text style={type.eyebrow}>Order management</Text>
          <Text style={type.h1}>Orders</Text>
        </View>
        <Button icon={<Plus size={16} color={c.surface} />} onPress={onCreateOrder}>
          Create order
        </Button>
      </View>

      <Panel>
        <View style={[layout.between, { marginBottom: s[5] }]}>
          <View style={styles.chipRow}>
            <Chip active={filter === "all"} onPress={() => setFilter("all")}>
              All
            </Chip>
            {orderStatuses.slice(0, 5).map((status) => (
              <Chip key={status} active={filter === status} onPress={() => setFilter(status)}>
                {statusLabels[status]}
              </Chip>
            ))}
          </View>
          <Button icon={<SlidersHorizontal size={16} color={c.inkMuted} />} variant="secondary">
            Filters
          </Button>
        </View>
        {orders.isLoading ? <SkeletonRows count={5} /> : <OrderTable orders={orders.data ?? []} />}
      </Panel>

      {selected ? (
        <Panel>
          <SectionTitle eyebrow="Status actions" title={`${selected.id} next steps`} />
          <View style={styles.actionStrip}>
            {(["accepted", "preparing", "ready", "completed", "cancelled"] as OrderStatus[]).map((nextStatus) => (
              <Button
                key={nextStatus}
                disabled={updateStatus.isPending}
                loading={updateStatus.isPending && updateStatus.variables?.data?.nextStatus === nextStatus}
                onPress={() => updateStatus.mutate({ id: selected.id, data: { nextStatus } })}
                variant={nextStatus === "cancelled" ? "danger" : "secondary"}
              >
                Mark {statusLabels[nextStatus]}
              </Button>
            ))}
          </View>
          {updateStatus.error ? <Text style={[type.muted, { color: c.danger }]}>{updateStatus.error.message}</Text> : null}
        </Panel>
      ) : null}
    </View>
  );
}

function CrmScreen() {
  const customers = useListCustomers();

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>Guest intelligence</Text>
        <Text style={type.h1}>CRM</Text>
      </View>
      <Panel>
        <SectionTitle eyebrow="Customers" title="Spend and order history" action={<SelectLike label="Highest spend" />} />
        <View style={styles.customerList}>
          {(customers.data ?? []).map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </View>
      </Panel>
    </View>
  );
}

function MenuScreen() {
  const items = useListMenuItems();
  const categories = useListMenuCategories();
  const updateItem = useUpdateMenuItem();
  const [editing, setEditing] = useState<MenuItem | undefined>();
  const [price, setPrice] = useState("");

  function startEditing(item: MenuItem) {
    setEditing(item);
    setPrice(String(item.priceCents / 100));
  }

  function saveItem() {
    if (!editing) {
      return;
    }
    updateItem.mutate(
      { id: editing.id, data: { available: editing.available, priceCents: Math.round(Number(price) * 100) } },
      { onSuccess: () => setEditing(undefined) }
    );
  }

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>Catalog</Text>
        <Text style={type.h1}>Menu</Text>
      </View>
      <Panel>
        <SectionTitle eyebrow="Items" title="Availability and pricing" action={<Button variant="secondary">Add item</Button>} />
        <View style={styles.menuGrid}>
          {(items.data ?? []).map((item) => {
            const category = categories.data?.find((entry) => entry.id === item.categoryId)?.name ?? "Menu";
            return (
              <Pressable key={item.id} onPress={() => startEditing(item)} style={styles.menuRow}>
                <View style={{ flex: 1, gap: s[1] }}>
                  <Text style={type.body}>{item.name}</Text>
                  <Text style={type.tiny}>
                    {category}
                  </Text>
                </View>
                <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
                <Badge tone={item.available ? "success" : "danger"}>{item.available ? "Available" : "Paused"}</Badge>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      <AppModal title="Edit menu item" visible={Boolean(editing)} onClose={() => setEditing(undefined)}>
        {editing ? (
          <View style={{ gap: s[4] }}>
            <Text style={type.body}>{editing.name}</Text>
            <Field keyboardType="numeric" label="Price" onChangeText={setPrice} value={price} />
            <Toggle label="Available for ordering" value={editing.available} onValueChange={(available) => setEditing({ ...editing, available })} />
            <Button loading={updateItem.isPending} onPress={saveItem}>
              Save item
            </Button>
          </View>
        ) : null}
      </AppModal>
    </View>
  );
}

function SettingsScreen() {
  const settings = useGetOrderingSettings();
  const update = useUpdateOrderingSettings();
  const data = settings.data;

  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>Business controls</Text>
        <Text style={type.h1}>Settings</Text>
      </View>
      <Panel>
        <SectionTitle eyebrow="Ordering" title="Service rules" />
        {data ? (
          <View style={styles.settingsGrid}>
            <Toggle label="Ordering is open" value={data.serviceAvailable} onValueChange={(serviceAvailable) => update.mutate({ data: { serviceAvailable } })} />
            <Toggle label="Auto-accept new orders" value={data.autoAccept} onValueChange={(autoAccept) => update.mutate({ data: { autoAccept } })} />
            <SettingMetric label="Default prep time" value={formatMinutes(data.prepTimeMinutes)} />
            <SettingMetric label="Tax rate" value={`${(data.taxRateBps / 100).toFixed(2)}%`} />
            <SettingMetric label="Opening hours" value={data.openingHoursJson} />
          </View>
        ) : (
          <SkeletonRows />
        )}
      </Panel>
    </View>
  );
}

function LibraryScreen() {
  return (
    <View style={styles.screenStack}>
      <View>
        <Text style={type.eyebrow}>Design system</Text>
        <Text style={type.h1}>UI Library</Text>
      </View>
      <View style={styles.libraryGrid}>
        <Panel>
          <SectionTitle eyebrow="Tokens" title="Color and spacing" />
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
          <SectionTitle eyebrow="Components" title="States" />
          <View style={styles.actionStrip}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button disabled>Disabled</Button>
          </View>
          <View style={styles.actionStrip}>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Error</Badge>
            <Badge tone="info">Info</Badge>
          </View>
          <SkeletonRows count={2} />
        </Panel>
      </View>
    </View>
  );
}

function CreateOrderModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const customers = useListCustomers();
  const menuItems = useListMenuItems();
  const createOrder = useCreateOrder();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const activeCustomerId = customerId ?? customers.data?.[0]?.id;

  function toggleItem(id: string) {
    setSelectedItems((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  function submit() {
    if (!activeCustomerId) {
      return;
    }

    createOrder.mutate(
      {
        data: {
          customerId: activeCustomerId,
          items: selectedItems.map((menuItemId) => ({ menuItemId, quantity: 1 }))
        }
      },
      {
        onSuccess: () => {
          setSelectedItems([]);
          onClose();
        }
      }
    );
  }

  return (
    <AppModal title="Create order" visible={visible} onClose={onClose}>
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
              <Text style={type.body}>{item.name}</Text>
              <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
            </Pressable>
          ))}
        </View>
        {createOrder.error ? <Text style={[type.muted, { color: c.danger }]}>{createOrder.error.message}</Text> : null}
        <Button disabled={selectedItems.length === 0 || !activeCustomerId} loading={createOrder.isPending} onPress={submit}>
          Submit order
        </Button>
      </View>
    </AppModal>
  );
}

function Kpi({ icon, label, note, value }: { icon: React.ReactNode; label: string; note: string; value: string }) {
  return (
    <Panel style={styles.kpi}>
      <View style={layout.between}>
        <View style={styles.kpiIcon}>{icon}</View>
        <Text style={type.tiny}>{label}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={type.tiny}>{note}</Text>
    </Panel>
  );
}

function OrderTable({ orders, selectedOrderId, onSelect }: { orders: Order[]; selectedOrderId?: string | undefined; onSelect?: (id: string) => void }) {
  if (orders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <BookOpen size={26} color={c.inkSubtle} />
        <Text style={type.body}>No orders match this view.</Text>
        <Text style={type.tiny}>Try clearing filters or creating a new order.</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      {orders.map((order) => (
        <Pressable key={order.id} onPress={() => onSelect?.(order.id)} style={[styles.tableRow, selectedOrderId === order.id && styles.tableRowActive]}>
          <View style={{ flex: 0.8 }}>
            <Text style={styles.tableStrong}>{order.id}</Text>
            <Text style={type.tiny}>{formatDateTime(order.createdAt)}</Text>
          </View>
          <View style={{ flex: 1.1 }}>
            <Text style={type.body}>{order.customer.name}</Text>
            <Text style={type.tiny}>{order.items.length} items</Text>
          </View>
          <View style={{ flex: 1 }}>
            <StatusBadge status={order.status} />
          </View>
          <Text style={[styles.price, { flex: 0.7 }]}>{formatCurrency(order.totalCents)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PopularItemsPanel({ items }: { items: Array<{ name: string; quantity: number }> }) {
  return (
    <Panel>
      <SectionTitle eyebrow="Menu" title="Popular items" />
      <View style={{ gap: s[3] }}>
        {items.map((item) => (
          <View key={item.name} style={layout.between}>
            <View>
              <Text style={type.body}>{item.name}</Text>
              <Text style={type.tiny}>{item.quantity} sold</Text>
            </View>
            <Text style={styles.price}>#{item.quantity}</Text>
          </View>
        ))}
      </View>
    </Panel>
  );
}

function OrderInspector({ order }: { order: Order }) {
  return (
    <Panel>
      <SectionTitle eyebrow="Detail" title={order.id} action={<StatusBadge status={order.status} />} />
      <View style={{ gap: s[3] }}>
        <Text style={type.body}>{order.customer.name}</Text>
        {order.items.map((item) => (
          <View key={item.id} style={layout.between}>
            <Text style={type.muted}>
              {item.quantity} x {item.menuItemName}
            </Text>
            <Text style={styles.price}>{formatCurrency(item.unitPriceCents)}</Text>
          </View>
        ))}
        <View style={layout.divider} />
        <View style={layout.between}>
          <Text style={type.body}>Total</Text>
          <Text style={styles.price}>{formatCurrency(order.totalCents)}</Text>
        </View>
      </View>
    </Panel>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <View style={styles.customerRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{customer.name.slice(0, 1)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{customer.name}</Text>
        <Text style={type.tiny}>
          {customer.email ?? "No email"} · {customer.phone ?? "No phone"}
        </Text>
      </View>
      <SettingMetric label="Orders" value={`${customer.orderCount}`} />
      <SettingMetric label="Spend" value={formatCurrency(customer.spendCents)} />
      <SettingMetric label="Last order" value={customer.recentOrders[0] ? formatDateTime(customer.recentOrders[0].createdAt) : "None"} />
    </View>
  );
}

function SettingMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricMini}>
      <Text style={type.tiny}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: c.canvas,
    flex: 1,
    flexDirection: "row",
    minHeight: "100%"
  },
  sidebar: {
    backgroundColor: "#fbfcf7",
    borderRightColor: c.line,
    borderRightWidth: 1,
    gap: s[6],
    padding: s[5],
    width: 254
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[3]
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: c.accent,
    borderRadius: r.md,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  brandTitle: {
    color: c.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  brandMeta: {
    color: c.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  nav: {
    gap: s[2]
  },
  navItem: {
    alignItems: "center",
    borderRadius: r.sm,
    flexDirection: "row",
    gap: s[3],
    minHeight: 42,
    paddingHorizontal: s[3]
  },
  navItemActive: {
    backgroundColor: c.accentSoft
  },
  navText: {
    color: c.inkMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  sidebarPanel: {
    marginTop: "auto"
  },
  sidebarNumber: {
    color: c.success,
    fontSize: 28,
    fontWeight: "800"
  },
  main: {
    flex: 1
  },
  topbar: {
    alignItems: "center",
    backgroundColor: c.canvas,
    borderBottomColor: c.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: s[4],
    justifyContent: "space-between",
    paddingHorizontal: s[6],
    paddingVertical: s[4]
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: s[3],
    maxWidth: 520,
    minHeight: 42,
    paddingHorizontal: s[3]
  },
  searchText: {
    color: c.inkSubtle,
    fontSize: 14,
    fontWeight: "600"
  },
  content: {
    padding: s[6]
  },
  screenStack: {
    gap: s[6]
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[4]
  },
  kpi: {
    flexBasis: 220,
    flexGrow: 1,
    gap: s[3]
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
  homeGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: s[4]
  },
  sideStack: {
    flex: 0.78,
    gap: s[4],
    minWidth: 320
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[2]
  },
  actionStrip: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[3]
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
  },
  price: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right"
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
  customerList: {
    gap: s[2],
    marginTop: s[5]
  },
  customerRow: {
    alignItems: "center",
    borderBottomColor: c.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: s[4],
    paddingVertical: s[4]
  },
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
  metricMini: {
    gap: s[1],
    minWidth: 96
  },
  metricValue: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  menuGrid: {
    gap: s[2],
    marginTop: s[5]
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
  settingsGrid: {
    gap: s[3],
    marginTop: s[5]
  },
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s[4]
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  spacingScale: {
    gap: s[2],
    marginTop: s[5]
  },
  spacingBar: {
    backgroundColor: c.accent,
    borderRadius: r.full,
    height: 8
  }
});
