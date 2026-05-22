import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Home, Library, Menu as MenuIcon, Plus, Search, Settings, ShoppingBag, Users } from "lucide-react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Button, Panel, SelectLike } from "@repo/shared/ui";
import { CreateOrderModal, CrmScreen, HomeScreen, LibraryScreen, MenuScreen, OrdersScreen, SettingsScreen } from "./screens/DashboardScreens";
import { I18nProvider, useI18n, type Locale } from "./lib/i18n";
import { c, layout, r, s, type } from "./lib/styles";

type Page = "home" | "orders" | "crm" | "menu" | "settings" | "library";

const queryClient = new QueryClient();

const navItems: Array<{ id: Page; icon: typeof Home }> = [
  { id: "home", icon: Home },
  { id: "orders", icon: ShoppingBag },
  { id: "crm", icon: Users },
  { id: "menu", icon: MenuIcon },
  { id: "settings", icon: Settings },
  { id: "library", icon: Library }
];

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <DashboardApp />
      </I18nProvider>
    </QueryClientProvider>
  );
}

function DashboardApp() {
  const { t } = useI18n();
  const [page, setPage] = useState<Page>("home");
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  return (
    <View style={styles.app}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <OdysseyLogoMark />
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
                <Text style={[styles.navText, active && { color: c.ink }]}>{t.nav[item.id]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Panel style={styles.sidebarPanel}>
          <Text style={type.eyebrow}>{t.service.label}</Text>
          <Text style={styles.sidebarNumber}>{t.service.open}</Text>
          <Text style={type.tiny}>{t.service.note}</Text>
        </Panel>
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <View style={styles.searchBox}>
            <Search size={18} color={c.inkSubtle} />
            <Text style={styles.searchText}>{t.topbar.search}</Text>
          </View>
          <View style={[layout.row, { gap: s[3] }]}>
            <LanguageToggle />
            <SelectLike label={t.topbar.today} />
            <Button icon={<Plus size={16} color={c.surface} />} onPress={() => setCreateOrderOpen(true)}>
              {t.topbar.createOrder}
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

function OdysseyLogoMark() {
  return (
    <Svg width={42} height={42} viewBox="0 0 96 96" fill="none">
      <Rect width="96" height="96" rx="24" fill="#202421" />
      <Circle cx="48" cy="48" r="31" fill="#FFF7ED" stroke="#EF6F3E" strokeWidth="3" />
      <Path d="M31 53c5-2 7-11 12-11 6 0 5 14 11 14 5 0 6-10 11-13" stroke="#EF6F3E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M31 66h34" stroke="#227653" strokeWidth="4" strokeLinecap="round" />
      <Path d="M28 33c2-7 8-11 16-9 3-6 12-6 16 0 8-1 14 4 15 12" stroke="#227653" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const options: Array<{ id: Locale; label: string }> = [
    { id: "en", label: "English" },
    { id: "zh", label: "简体中文" }
  ];

  return (
    <View style={styles.languageToggle}>
      {options.map((option) => (
        <Pressable key={option.id} onPress={() => setLocale(option.id)} style={[styles.languageOption, locale === option.id && styles.languageOptionActive]}>
          <Text style={[styles.languageText, locale === option.id && { color: c.accent }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: c.canvas,
    flex: 1,
    flexDirection: "row",
    minHeight: "100%"
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
  brandMeta: {
    color: c.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  brandTitle: {
    color: c.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  content: {
    padding: s[6]
  },
  languageOption: {
    paddingHorizontal: s[3],
    paddingVertical: s[2]
  },
  languageOptionActive: {
    backgroundColor: c.accentSoft
  },
  languageText: {
    color: c.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  languageToggle: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 38,
    overflow: "hidden"
  },
  main: {
    flex: 1
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
  sidebar: {
    backgroundColor: "#fbfcf7",
    borderRightColor: c.line,
    borderRightWidth: 1,
    gap: s[6],
    padding: s[5],
    width: 254
  },
  sidebarNumber: {
    color: c.success,
    fontSize: 28,
    fontWeight: "800"
  },
  sidebarPanel: {
    marginTop: "auto"
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
  }
});
