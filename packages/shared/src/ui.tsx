import { useState, type ReactNode } from "react";
import { Modal as NativeModal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, ChevronDown, LoaderCircle, X } from "lucide-react-native";
import { tokens } from "./index";

type Tone = "accent" | "success" | "warning" | "danger" | "info" | "muted";

const c = tokens.color;
const s = tokens.space;
const r = tokens.radius;

const type = StyleSheet.create({
  h2: {
    color: c.ink,
    fontSize: tokens.font.size.lg,
    fontWeight: "700",
    letterSpacing: 0
  },
  body: {
    color: c.ink,
    fontSize: tokens.font.size.base,
    lineHeight: 22
  },
  eyebrow: {
    color: c.inkSubtle,
    fontSize: tokens.font.size.xs,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  }
});

const layout = StyleSheet.create({
  between: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

const toneMap: Record<Tone, { bg: string; fg: string; border: string }> = {
  accent: { bg: c.accentSoft, fg: c.accent, border: "#ffd5bf" },
  success: { bg: c.successSoft, fg: c.success, border: "#bfe6d1" },
  warning: { bg: c.warningSoft, fg: c.warning, border: "#f2d48d" },
  danger: { bg: c.dangerSoft, fg: c.danger, border: "#f2baba" },
  info: { bg: c.infoSoft, fg: c.info, border: "#b9dde6" },
  muted: { bg: c.surfaceMuted, fg: c.inkMuted, border: c.line }
};

export function Panel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[ui.panel, style]}>{children}</View>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <View style={[layout.between, { gap: s[4] }]}>
      <View style={{ gap: s[1] }}>
        {eyebrow ? <Text style={type.eyebrow}>{eyebrow}</Text> : null}
        <Text style={type.h2}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Button({
  children,
  icon,
  onPress,
  variant = "primary",
  disabled,
  loading
}: {
  children: ReactNode;
  icon?: ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        variant === "primary" && ui.buttonPrimary,
        variant === "secondary" && ui.buttonSecondary,
        variant === "ghost" && ui.buttonGhost,
        variant === "danger" && ui.buttonDanger,
        hovered && ui.interactiveHover,
        focused && ui.interactiveFocus,
        (pressed || loading) && { opacity: 0.78 },
        disabled && { opacity: 0.45 }
      ]}
    >
      {loading ? <LoaderCircle size={16} color={variant === "primary" ? c.surface : c.inkMuted} /> : icon}
      <Text style={[ui.buttonText, variant === "primary" && { color: c.surface }, variant === "danger" && { color: c.danger }]}>{children}</Text>
    </Pressable>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  const colors = toneMap[tone];
  return (
    <View style={[ui.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[ui.badgeText, { color: colors.fg }]}>{children}</Text>
    </View>
  );
}

export function Notice({ children, title, tone = "info" }: { children: ReactNode; title: string; tone?: Tone }) {
  const colors = toneMap[tone];
  return (
    <View style={[ui.notice, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[ui.noticeTitle, { color: colors.fg }]}>{title}</Text>
      <Text style={ui.noticeText}>{children}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default"
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ gap: s[2] }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkSubtle}
        style={ui.input}
        value={value}
      />
    </View>
  );
}

export function Toggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <Pressable onPress={() => onValueChange(!value)} style={ui.toggleRow}>
      <Text style={type.body}>{label}</Text>
      <View style={[ui.toggleTrack, value && { backgroundColor: c.success }]}>
        <View style={[ui.toggleThumb, value && { transform: [{ translateX: 18 }] }]}>
          {value ? <Check size={12} color={c.success} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Chip({ active, children, onPress }: { active?: boolean; children: ReactNode; onPress?: () => void }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [ui.chip, active && ui.chipActive, hovered && ui.interactiveHover, focused && ui.interactiveFocus, pressed && { opacity: 0.78 }]}
    >
      <Text style={[ui.chipText, active && { color: c.accent }]}>{children}</Text>
    </Pressable>
  );
}

export function SelectLike({ label }: { label: string }) {
  return (
    <View style={ui.selectLike}>
      <Text style={ui.selectText}>{label}</Text>
      <ChevronDown size={15} color={c.inkMuted} />
    </View>
  );
}

export function AppModal({ title, visible, onClose, children }: { title: string; visible: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <NativeModal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={ui.modalBackdrop}>
        <View style={ui.modalCard}>
          <View style={layout.between}>
            <Text style={type.h2}>{title}</Text>
            <Pressable onPress={onClose} style={ui.iconButton}>
              <X size={18} color={c.inkMuted} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </NativeModal>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: s[3] }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={ui.skeletonRow}>
          <View style={[ui.skeletonBlock, { width: "28%" }]} />
          <View style={[ui.skeletonBlock, { width: "18%" }]} />
          <View style={[ui.skeletonBlock, { width: "22%" }]} />
        </View>
      ))}
    </View>
  );
}

const ui = StyleSheet.create({
  panel: {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.md,
    borderWidth: 1,
    padding: s[5]
  },
  button: {
    alignItems: "center",
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[2],
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: s[4]
  },
  buttonPrimary: {
    backgroundColor: c.accent,
    borderColor: c.accent
  },
  buttonSecondary: {
    backgroundColor: c.surface,
    borderColor: c.lineStrong
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  buttonDanger: {
    backgroundColor: c.dangerSoft,
    borderColor: "#f2baba"
  },
  buttonText: {
    color: c.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  interactiveFocus: {
    borderColor: c.accent
  },
  interactiveHover: {
    transform: [{ translateY: -1 }]
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: r.full,
    borderWidth: 1,
    paddingHorizontal: s[3],
    paddingVertical: 5
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  notice: {
    borderRadius: r.md,
    borderWidth: 1,
    gap: s[1],
    padding: s[4]
  },
  noticeText: {
    color: c.inkMuted,
    fontSize: 13,
    lineHeight: 18
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "800"
  },
  label: {
    color: c.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  input: {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    color: c.ink,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: s[3]
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: c.surfaceMuted,
    borderColor: c.line,
    borderRadius: r.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: s[4]
  },
  toggleTrack: {
    backgroundColor: c.lineStrong,
    borderRadius: r.full,
    height: 24,
    padding: 3,
    width: 48
  },
  toggleThumb: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: r.full,
    height: 18,
    justifyContent: "center",
    width: 18
  },
  chip: {
    borderColor: c.line,
    borderRadius: r.full,
    borderWidth: 1,
    paddingHorizontal: s[3],
    paddingVertical: s[2]
  },
  chipActive: {
    backgroundColor: c.accentSoft,
    borderColor: "#ffd5bf"
  },
  chipText: {
    color: c.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  selectLike: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: s[2],
    minHeight: 38,
    paddingHorizontal: s[3]
  },
  selectText: {
    color: c.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(32, 36, 33, 0.28)",
    flex: 1,
    justifyContent: "center",
    padding: s[6]
  },
  modalCard: {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderRadius: r.lg,
    borderWidth: 1,
    gap: s[5],
    maxWidth: 560,
    padding: s[6],
    width: "100%"
  },
  iconButton: {
    alignItems: "center",
    borderColor: c.line,
    borderRadius: r.sm,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  skeletonRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: s[3]
  },
  skeletonBlock: {
    backgroundColor: c.surfaceMuted,
    borderRadius: r.sm,
    height: 18
  }
});
