import { useTheme } from "./theme";
import { useEffect, useRef } from "react";
import { WebView } from "react-native-webview";
import html from "../data/welcome-html.json";
export function WelcomeScene({ closing, onReady }: { closing: boolean; onReady: () => void }) {
  const { colors, mode } = useTheme();
  const view = useRef<WebView<Record<never, never>>>(null);
  useEffect(() => { if (closing) view.current?.injectJavaScript("window.miseClose?.();true;"); }, [closing]);
  useEffect(()=>{view.current?.injectJavaScript(`window.miseTheme?.('${mode}');true;`);},[mode]);
  return <WebView<Record<never, never>> ref={view} source={{ html }} style={{ backgroundColor: colors.bg }} scrollEnabled={false} originWhitelist={["*"]} onMessage={event=>{if(event.nativeEvent.data==='ready'){view.current?.injectJavaScript(`window.miseTheme?.('${mode}');true;`);onReady();}}} onError={onReady} onShouldStartLoadWithRequest={r => r.url === "about:blank"} javaScriptEnabled accessible={false} />;
}
