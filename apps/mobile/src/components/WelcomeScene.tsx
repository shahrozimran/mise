import { useEffect, useRef } from "react";
import { WebView } from "react-native-webview";
import html from "../data/welcome-html.json";
export function WelcomeScene({ closing, onReady }: { closing: boolean; onReady: () => void }) {
  const view = useRef<WebView<Record<never, never>>>(null);
  useEffect(() => { if (closing) view.current?.injectJavaScript("window.miseClose?.();true;"); }, [closing]);
  return <WebView<Record<never, never>> ref={view} source={{ html }} style={{ backgroundColor: "#06141B" }} scrollEnabled={false} originWhitelist={["*"]} onMessage={event=>{if(event.nativeEvent.data==='ready')onReady();}} onError={onReady} onShouldStartLoadWithRequest={r => r.url === "about:blank"} javaScriptEnabled accessible={false} />;
}
