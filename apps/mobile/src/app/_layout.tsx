import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useKitchen } from "../data/store";
import { useTheme, Icon, Notice, Txt, Button } from "../components/ui";
import { initializeBilling, refreshEntitlement } from "../services/billing";
import { Onboarding } from "../components/Onboarding";
import { Welcome } from "../components/Welcome";
import * as SystemUI from "expo-system-ui";
import { ThemeProvider } from "../components/theme";

export default function Layout() {
  return <ThemeProvider><SafeAreaProvider><KitchenLayout /></SafeAreaProvider></ThemeProvider>;
}
function KitchenLayout() {
  const { colors, mode } = useTheme();
  useEffect(() => { void SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {}); }, [colors.bg]);
  const insets = useSafeAreaInsets();
  const [welcomed, setWelcomed] = useState(false);
  const { data, loading, error, hydrate } = useKitchen();
  useEffect(() => {
    void hydrate();
    void initializeBilling();
    const refresh = setInterval(
      () => {
        void refreshEntitlement();
      },
      24 * 60 * 60 * 1000,
    );
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshEntitlement();
    });
    return () => {
      sub.remove();
      clearInterval(refresh);
    };
  }, [hydrate]);
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={["top", "left", "right"]}
      >
        {!welcomed ? (
          <Welcome ready={!loading} onDone={() => setWelcomed(true)} />
        ) : loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
            }}
          >
            <Icon name="leaf" size={38} color={colors.accent} />
            <Txt style={{ fontSize: 30, fontWeight: "600" }}>
              Your kitchen is opening.
            </Txt>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !data ? (
          <View style={{ padding: 24, gap: 20 }}>
            <Notice error>
              {error ?? "Unable to open your local kitchen."} Your existing data
              has not been replaced.
            </Notice>
            <Button label="Retry" onPress={() => void hydrate()} />
          </View>
        ) : !data.preferences?.completedAt ? (
          <Onboarding />
        ) : (
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.accent,
              tabBarInactiveTintColor: colors.muted,
              tabBarStyle: {
                backgroundColor: colors.paper,
                borderTopColor: colors.line,
                paddingTop: 9,
                paddingBottom: Math.max(insets.bottom, 10),
                height: 62 + Math.max(insets.bottom, 10),
              },
              tabBarHideOnKeyboard: true,
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: "600",
                marginTop: 3,
              },
              sceneStyle: { backgroundColor: colors.bg },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => (
                  <Icon
                    name="home-outline"
                    color={typeof color === "string" ? color : colors.accent}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="cook"
              options={{
                title: "Build a meal",
                tabBarButton: () => null,
                tabBarItemStyle: { display: "none" },
              }}
            />
            <Tabs.Screen
              name="recipes"
              options={{
                title: "Recipes",
                tabBarIcon: ({ color }) => (
                  <Icon
                    name="book-outline"
                    color={typeof color === "string" ? color : colors.accent}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="grocery"
              options={{
                title: "Shopping",
                tabBarIcon: ({ color }) => (
                  <Icon
                    name="basket-outline"
                    color={typeof color === "string" ? color : colors.accent}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: "Settings",
                tabBarIcon: ({ color }) => (
                  <Icon
                    name="options-outline"
                    color={typeof color === "string" ? color : colors.accent}
                  />
                ),
              }}
            />
          </Tabs>
        )}
      </SafeAreaView>
    </>
  );
}
