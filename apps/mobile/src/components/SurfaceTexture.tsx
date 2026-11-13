import { Image } from "react-native";
import { useTheme } from "./theme";

// Restrained paper grain only on light-mode feature surfaces.
export function SurfaceTexture() {
  const { mode } = useTheme();
  if (mode === "dark") return null;
  return <Image testID="beige-surface-texture" accessible={false}
    source={require("../../assets/beige-paper.png")} resizeMode="cover"
    style={{position:"absolute",top:0,bottom:0,left:0,right:0,opacity:0.28,pointerEvents:"none"}} />;
}
