import { useNetworkState } from "expo-network";
import { Text, View } from "react-native";

export function useOffline() {
  const network = useNetworkState();
  return network.isConnected === false || network.isInternetReachable === false;
}
export function ConnectionStatus() {
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const checking = network.isConnected === undefined;
  return <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 6, alignItems: "center", flexShrink: 1 }}>
    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: offline ? "#9BA8AB" : "#9BA8AB" }} />
    <Text style={{ color: "#9BA8AB", fontSize: 12, flexShrink: 1 }}>{checking ? "Checking connection…" : offline ? "Offline · saved foods ready" : "Online · kitchen ready"}</Text>
  </View>;
}
