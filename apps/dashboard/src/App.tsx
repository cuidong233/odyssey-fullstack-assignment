import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setApiBaseUrl, timeRanges, type TimeRange } from "@repo/api-client";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Home, Library, Menu as MenuIcon, Settings, ShoppingBag, Users } from "lucide-react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Panel, SelectLike } from "@repo/shared/ui";
import { CreateOrderModal, CrmScreen, HomeScreen, LibraryScreen, MenuScreen, OrdersScreen, SettingsScreen } from "./screens/DashboardScreens";
import { I18nProvider, useI18n, type Locale } from "./lib/i18n";
import { c, layout, r, s, type } from "./lib/styles";

type Page = "home" | "orders" | "crm" | "menu" | "settings" | "library";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
if (configuredApiUrl) {
  setApiBaseUrl(configuredApiUrl);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

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
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [page, setPage] = useState<Page>("home");
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  return (
    <View style={[styles.app, compact && styles.appCompact]}>
      <View style={[styles.sidebar, compact && styles.sidebarCompact]}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <OdysseyLogoMark />
          </View>
          <View>
            <Text style={styles.brandTitle}>Odyssey</Text>
            <Text style={styles.brandMeta}>{t.brand.restaurantOps}</Text>
          </View>
        </View>

        <View style={[styles.nav, compact && styles.navCompact]}>
          {navItems.map((item) => {
            return <NavButton key={item.id} active={item.id === page} compact={compact} item={item} label={t.nav[item.id]} onPress={() => setPage(item.id)} />;
          })}
        </View>

        <Panel style={[styles.sidebarPanel, compact && styles.sidebarPanelCompact]}>
          <Text style={type.eyebrow}>{t.service.label}</Text>
          <Text style={styles.sidebarNumber}>{t.service.open}</Text>
          <Text style={type.tiny}>{t.service.note}</Text>
        </Panel>
      </View>

      <View style={styles.main}>
        <View style={[styles.topbar, compact && styles.topbarCompact]}>
          <View style={[layout.row, compact && styles.topbarActionsCompact, { gap: s[3] }]}>
            <LanguageToggle />
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
          {page === "home" ? <HomeScreen rangeControl={<TimeRangeSelect value={timeRange} onChange={setTimeRange} />} timeRange={timeRange} onCreateOrder={() => setCreateOrderOpen(true)} /> : null}
          {page === "orders" ? <OrdersScreen rangeControl={<TimeRangeSelect value={timeRange} onChange={setTimeRange} />} timeRange={timeRange} onCreateOrder={() => setCreateOrderOpen(true)} /> : null}
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

function NavButton({ active, compact, item, label, onPress }: { active: boolean; compact: boolean; item: { id: Page; icon: typeof Home }; label: string; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <Pressable
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, compact && styles.navItemCompact, active && styles.navItemActive, hovered && styles.navItemHover, focused && styles.navItemFocus, pressed && { opacity: 0.78 }]}
    >
      <Icon size={18} color={active ? c.accent : c.inkMuted} />
      <Text style={[styles.navText, active && { color: c.ink }]}>{label}</Text>
    </Pressable>
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

function TimeRangeSelect({ value, onChange }: { value: TimeRange; onChange: (value: TimeRange) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.rangePicker}>
      <SelectLike label={t.range[value]} onPress={() => setOpen((current) => !current)} />
      {open ? (
        <View style={styles.rangeMenu}>
          {timeRanges.map((range) => (
            <Pressable
              key={range}
              onPress={() => {
                onChange(range);
                setOpen(false);
              }}
              style={[styles.rangeOption, range === value && styles.rangeOptionActive]}
            >
              <Text style={[styles.rangeOptionText, range === value && { color: c.accent }]}>{t.range[range]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
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
  appCompact: {
    flexDirection: "column"
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
  contentCompact: {
    padding: s[4]
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
  rangeMenu: {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    boxShadow: "0 10px 24px rgba(38, 45, 38, 0.12)",
    minWidth: 128,
    padding: s[1],
    position: "absolute",
    right: 0,
    top: 44,
    zIndex: 1000
  },
  rangeOption: {
    borderRadius: r.sm,
    paddingHorizontal: s[3],
    paddingVertical: s[2]
  },
  rangeOptionActive: {
    backgroundColor: c.accentSoft
  },
  rangeOptionText: {
    color: c.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  rangePicker: {
    position: "relative",
    zIndex: 10
  },
  main: {
    flex: 1
  },
  nav: {
    gap: s[2]
  },
  navCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%"
  },
  navItem: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[3],
    minHeight: 42,
    paddingHorizontal: s[3]
  },
  navItemCompact: {
    flexBasis: 104,
    flexGrow: 0,
    maxWidth: 104
  },
  navItemActive: {
    backgroundColor: c.accentSoft
  },
  navItemFocus: {
    borderColor: c.accent
  },
  navItemHover: {
    backgroundColor: c.surfaceMuted
  },
  navText: {
    color: c.inkMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  sidebar: {
    backgroundColor: "#fbfcf7",
    borderRightColor: c.line,
    borderRightWidth: 1,
    gap: s[6],
    padding: s[5],
    width: 254
  },
  sidebarCompact: {
    borderBottomColor: c.line,
    borderBottomWidth: 1,
    borderRightWidth: 0,
    gap: s[4],
    padding: s[4],
    width: "100%"
  },
  sidebarNumber: {
    color: c.success,
    fontSize: 28,
    fontWeight: "800"
  },
  sidebarPanel: {
    marginTop: "auto"
  },
  sidebarPanelCompact: {
    display: "none"
  },
  topbar: {
    alignItems: "center",
    backgroundColor: c.canvas,
    borderBottomColor: c.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: s[4],
    justifyContent: "flex-end",
    paddingHorizontal: s[6],
    paddingVertical: s[4],
    position: "relative",
    zIndex: 100
  },
  topbarActionsCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
    flexWrap: "nowrap",
    maxWidth: "100%"
  },
  topbarCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    paddingHorizontal: s[4]
  }
});
