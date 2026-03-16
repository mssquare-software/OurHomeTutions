import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const PAL = {
  PRIMARY_NAVY: "#1B2A5A",
  DARK_SLATE: "#0F172A",
  SUNSET_ORANGE: "#ffb76c",
  PURE_WHITE: "#FFFFFF",
  SOFT_GRAY: "#F9FAFB",
};

export const TabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const getTabIcon = (routeName: string) => {
    if (routeName === "index") return "🏠";
    if (routeName === "parent-dashboard") return "📊";
    if (routeName === "booking") return "📅";
    if (routeName === "bookmarks") return "🔖";
    if (routeName === "settings") return "⚙️";
    return "●";
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 10, paddingTop: 10 },
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
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
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Text
                style={[
                  styles.iconText,
                  isFocused && styles.iconTextActive,
                ]}
              >
                {getTabIcon(route.name)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: PAL.PURE_WHITE,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginHorizontal: 8,
  },
  tabActive: {
    backgroundColor: "rgba(27,42,90,0.1)",
  },
  iconText: {
    fontSize: 20,
    color: "#9CA3AF",
  },
  iconTextActive: {
    color: PAL.PRIMARY_NAVY,
  },
});
