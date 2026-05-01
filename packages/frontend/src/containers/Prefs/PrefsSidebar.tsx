import Sidebar from './../Sidebar';

interface PrefsSidebarProps {
  menus?: unknown[];
  hideItems?: boolean;
  menuIsLocked?: boolean;
  onToggleItemVisibility?: () => void;
  onLockMenuClicked?: () => void;
}

export const PrefsSidebar = (props: PrefsSidebarProps) => {
  const preferencesMenu = {
    title: 'Preferences',
    items: [
      {
        active: true,
        label: 'Appearance',
        to: '/prefs/general',
        exact: true,
      },
      {
        active: true,
        label: 'Behaviour',
        to: '/prefs/advanced',
        exact: true,
      },
    ],
  };

  const applicationSettingsMenu = {
    title: 'Application Settings',
    items: [
      {
        active: true,
        label: 'Storage',
        to: '/prefs/storage',
        exact: true,
      },
      {
        active: true,
        label: 'Git',
        to: '/prefs/git',
        exact: true,
      },
      {
        active: true,
        label: 'Logging',
        to: '/prefs/logging',
        exact: true,
      },
      {
        active: true,
        label: 'Hugo',
        to: '/prefs/hugo',
        exact: true,
      },
      {
        active: true,
        label: 'Variables',
        to: '/prefs/variables',
        exact: true,
      },
      {
        active: true,
        label: 'Feature Flags',
        to: '/prefs/appsettings-general',
        exact: true,
      },
    ],
  };

  return <Sidebar {...props} menus={[preferencesMenu, applicationSettingsMenu]} />;
};
