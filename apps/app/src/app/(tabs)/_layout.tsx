import { Tabs } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Building2, Search, User } from 'lucide-react-native';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { name: 'home', label: 'Home', Icon: Home },
  { name: 'orgs', label: 'Orgs', Icon: Building2 },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'profile', label: 'Profile', Icon: User },
] as const;

type TabBarProps = {
  state: any;
  navigation: any;
  descriptors: any;
  insets: ReturnType<typeof useSafeAreaInsets>;
};

export const FLOATING_TABBAR_HEIGHT = 64;

function TabBar({ state, navigation, descriptors, insets }: TabBarProps) {
  return (
    <View
      style={[
        cn(
          'absolute flex-row items-center bg-card border border-border rounded-3xl shadow-lg shadow-black/10'
        ),
        {
          left: insets.left + 24,
          right: insets.right + 24,
          bottom: insets.bottom + 16,
          height: FLOATING_TABBAR_HEIGHT,
          shadowColor: '#2b2b2b',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 12,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const tab = TAB_ITEMS.find((t) => t.name === route.name);
        if (!tab) return null;
        const Icon = tab.Icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
            onPress={onPress}
            style={({ pressed }) =>
              cn(
                'flex-1 items-center justify-center',
                pressed && 'opacity-60'
              )
            }
          >
            <Icon
              size={24}
              strokeWidth={2}
              color={isFocused ? '#e35d1e' : '#686868'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} insets={insets} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="orgs" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="notifications" options={{ href: false }} />
    </Tabs>
  );
}
