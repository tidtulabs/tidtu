import type { Component } from "vue";
import { IconBook, IconMessageReport } from "@tabler/icons-vue";

export interface NavItem {
  title: string;
  icon: Component;
  to: string;
  aliases?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Danh sách thi",
    icon: IconBook,
    to: "/pdaotao/danh-sach-thi",
    aliases: ["/pdaotao/danh-sach-thi", "/pdaotao/examlist"],
  },
  {
    title: "Góp ý & Báo lỗi",
    icon: IconMessageReport,
    to: "/pdaotao/gop-y-bao-loi",
    aliases: ["/pdaotao/gop-y-bao-loi", "/pdaotao/feedback"],
  },
];

export function isNavItemActive(item: NavItem, currentPath: string): boolean {
  if (currentPath === item.to) return true;
  if (item.aliases && item.aliases.includes(currentPath)) return true;
  return false;
}
