import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { APP_FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

const TAB_ICON_SIZE = 24;

/** Bottom tabs: Documents and Settings. Colours, font and labels follow theme and language. */
export default function TabsLayout() {
  const theme = useTheme();
  const t = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontFamily: APP_FONT_FAMILY, fontWeight: '500' },
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.documents.title,
          tabBarIcon: ({ focused }) => (
            <AppIcon
              ios={focused ? 'doc.text.fill' : 'doc.text'}
              android="description"
              size={TAB_ICON_SIZE}
              color={focused ? 'primary' : 'textSecondary'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.nav.settings,
          tabBarIcon: ({ focused }) => (
            <AppIcon
              ios={focused ? 'gearshape.fill' : 'gearshape'}
              android="settings"
              size={TAB_ICON_SIZE}
              color={focused ? 'primary' : 'textSecondary'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
