import { useTheme } from "./theme";
import { useNetworkState } from "expo-network";
import { Text, View } from "react-native";

export function useOffline() {
  const network = useNetworkState();
  return network.isConnected === false || network.isInternetReachable === false;
}
export function ConnectionStatus() {
  const { colors } = useTheme();
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const checking = network.isConnected === undefined;
  return <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 6, alignItems: "center", flexShrink: 1 }}>
    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: offline ? colors.muted : colors.muted }} />
    <Text style={{ color: colors.muted, fontSize: 12, flexShrink: 1 }}>{checking ? "Checking connection…" : offline ? "Offline · saved foods ready" : "Online · kitchen ready"}</Text>
  </View>;
}
