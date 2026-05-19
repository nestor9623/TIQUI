export interface NavItem {
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  children?: NavItem[];
  visible?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
  expanded?: boolean;
}
