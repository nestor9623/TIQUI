export interface NavItem {
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  children?: NavItem[];
  visible?: boolean;
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
  expanded?: boolean;
}
