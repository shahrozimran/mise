import { useEffect } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useKitchen } from "../data/store";
import { colors, Icon, Notice, Txt, Button } from "../components/ui";
import { initializeBilling, refreshEntitlement } from "../services/billing";
import { Onboarding } from "../components/Onboarding";

export default function Layout() {
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
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={["top", "left", "right"]}
      >
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
            }}
          >
            <Icon name="leaf" size={38} color={colors.green} />
            <Txt style={{ fontSize: 30, fontWeight: "600" }}>
              Your kitchen is opening.
            </Txt>
            <ActivityIndicator color={colors.green} />
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
              tabBarActiveTintColor: colors.green,
              tabBarInactiveTintColor: "#879084",
              tabBarStyle: {
                backgroundColor: "#FFFFFF",
                borderTopColor: colors.line,
                paddingTop: 9,
                paddingBottom: 10,
                height: 72,
              },
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
                    name="restaurant-outline"
                    color={typeof color === "string" ? color : colors.green}
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
                    color={typeof color === "string" ? color : colors.green}
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
                    color={typeof color === "string" ? color : colors.green}
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
                    color={typeof color === "string" ? color : colors.green}
                  />
                ),
              }}
            />
          </Tabs>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
