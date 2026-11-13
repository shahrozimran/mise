import { useEffect, useRef } from "react";
import html from "../data/welcome-html.json";
export function WelcomeScene({ closing, onReady }: { closing: boolean; onReady: () => void }) {
  const view = useRef<HTMLIFrameElement>(null);
  useEffect(() => { if(closing) view.current?.contentWindow?.postMessage({type:"close"},"*"); },[closing]);
  useEffect(()=>{
    function receive(event:MessageEvent) { if(event.source===view.current?.contentWindow && event.data?.type==='mise-ready') onReady(); }
    window.addEventListener('message',receive);
    return()=>window.removeEventListener('message',receive);
  },[onReady]);
  return <iframe ref={view} title="Animated Mise kitchen" srcDoc={html} sandbox="allow-scripts" style={{ border: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
