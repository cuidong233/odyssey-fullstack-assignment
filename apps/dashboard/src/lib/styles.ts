import { StyleSheet } from "react-native";
import { tokens } from "@repo/shared";

export const c = tokens.color;
export const s = tokens.space;
export const r = tokens.radius;

export const type = StyleSheet.create({
  eyebrow: {
    color: c.inkSubtle,
    fontSize: tokens.font.size.xs,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  h1: {
    color: c.ink,
    fontSize: tokens.font.size.display,
    fontWeight: "700",
    letterSpacing: 0
  },
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
  muted: {
    color: c.inkMuted,
    fontSize: tokens.font.size.sm,
    lineHeight: 19
  },
  tiny: {
    color: c.inkSubtle,
    fontSize: tokens.font.size.xs,
    lineHeight: 16
  }
});

export const layout = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row"
  },
  between: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  divider: {
    backgroundColor: c.line,
    height: 1
  }
});
