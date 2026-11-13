import { useEffect, useRef } from "react";
import html from "../data/welcome-html.json";
import { useTheme } from "./theme";
export function WelcomeScene({ closing, onReady }: { closing: boolean; onReady: () => void }) {
  const {mode}=useTheme();
  const view = useRef<HTMLIFrameElement>(null);
  useEffect(() => { if(closing) view.current?.contentWindow?.postMessage({type:"close"},"*"); },[closing]);
  useEffect(()=>{view.current?.contentWindow?.postMessage({type:"theme",mode},"*");},[mode]);
  useEffect(()=>{
    function receive(event:MessageEvent) { if(event.source===view.current?.contentWindow && event.data?.type==='mise-ready') {view.current?.contentWindow?.postMessage({type:"theme",mode},"*");onReady();} }
    window.addEventListener('message',receive);
    return()=>window.removeEventListener('message',receive);
  },[onReady,mode]);
  return <iframe ref={view} title="Animated Mise kitchen" srcDoc={html} sandbox="allow-scripts" style={{ border: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
