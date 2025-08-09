export interface NavigationItem {
  label: string;
  icon: string;
  action: () => void;
  roles?: string[]; // Optional: restrict to specific roles
  isActive?: () => boolean; // Optional: function to determine if item is active
}

export interface LayoutConfig {
  title: string;
  logoPath: string;
  navigationItems: NavigationItem[];
  userRole?: string;
  showFloatingButton?: boolean;
  floatingButtonIcon?: string;
  floatingButtonAction?: () => void;
  floatingButtonTooltip?: string;
} 
