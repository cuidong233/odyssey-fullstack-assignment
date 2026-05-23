import type { Locale } from "./i18n";

const zhMenuItemNames: Record<string, string> = {
  "Charred Chicken Bowl": "炭烤鸡肉碗",
  "Charred Citrus Salmon": "炭烤柑橘三文鱼",
  "Chili Garlic Noodles": "蒜香辣油面",
  "Coconut Rice Pudding": "椰香米布丁",
  "Crispy Mushroom Bao": "脆蘑菇包",
  "Espresso Tonic": "浓缩咖啡汤力",
  "Ginger Lime Tea": "姜味青柠茶",
  "Market Bowl": "市场谷物碗",
  "Market Grain Bowl": "市场谷物碗",
  "Miso Salmon Plate": "味噌三文鱼套餐",
  "Roasted Tomato Soup": "烤番茄汤",
  "Sesame Cucumber Salad": "芝麻黄瓜沙拉",
  "Smoked Short Rib Plate": "烟熏牛小排套餐",
  "Sparkling Berry Shrub": "气泡莓果醋饮",
  "Yuzu Mint Spritz": "柚子薄荷气泡饮"
};

const zhMenuDescriptions: Record<string, string> = {
  "Berry shrub, citrus, mint, sparkling water": "莓果醋饮、柑橘、薄荷、气泡水",
  "Braised beef, pickled onions, jus.": "慢炖牛肉、腌洋葱、肉汁。",
  "Chicken, rice, pickled vegetables, herb sauce": "鸡肉、米饭、腌渍蔬菜、香草酱",
  "Chilled cucumbers, sesame dressing, chili crisp": "冰镇黄瓜、芝麻酱汁、辣椒脆",
  "Coconut rice pudding, mango, toasted coconut": "椰香米布丁、芒果、烤椰片",
  "Currently sold out": "当前已售罄",
  "Farro, roasted squash, feta, green tahini.": "法罗麦、烤南瓜、菲达奶酪、绿色芝麻酱。",
  "Grains, greens, seasonal vegetables": "谷物、绿叶菜、时令蔬菜",
  "House brewed tea with lime": "自制茶底配青柠",
  "Noodles, chili oil, scallions, jammy egg": "面条、辣椒油、葱花、溏心蛋",
  "Salmon, cucumber salad, brown rice, sesame": "三文鱼、黄瓜沙拉、糙米、芝麻",
  "Seared salmon, preserved lemon, herb rice.": "煎三文鱼、腌柠檬、香草米饭。",
  "Sparkling tonic with a double espresso": "气泡汤力水配双份浓缩",
  "Steamed buns, crispy mushrooms, pickles, chili mayo": "蒸包、脆蘑菇、酸黄瓜、辣味蛋黄酱",
  "Yuzu, mint, soda.": "柚子、薄荷、苏打水。"
};

const zhCategoryNames: Record<string, string> = {
  Bowls: "主食碗",
  Desserts: "甜点",
  Drinks: "饮品",
  Sides: "配菜",
  Signatures: "招牌",
  Snacks: "小食"
};

export function menuItemNameText(name: string, locale: Locale) {
  return locale === "zh" ? zhMenuItemNames[name] ?? name : name;
}

export function menuItemDescriptionText(description: string | null | undefined, locale: Locale) {
  if (!description) {
    return description;
  }
  return locale === "zh" ? zhMenuDescriptions[description] ?? description : description;
}

export function menuCategoryNameText(name: string, locale: Locale) {
  return locale === "zh" ? zhCategoryNames[name] ?? name : name;
}
