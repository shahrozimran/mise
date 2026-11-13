import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, Platform, View, useWindowDimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, colors, Txt } from "./ui";
import { Enter, useReducedMotion } from "./motion";
import { WelcomeScene } from "./WelcomeScene";

export function Welcome({ready,onDone}:{ready:boolean;onDone:()=>void}) {
  const [elapsed,setElapsed]=useState(false);
  const [closing,setClosing]=useState(false);
  const [sceneReady,setSceneReady]=useState(false);
  const handleSceneReady=useCallback(()=>setSceneReady(true),[]);
  const [fade]=useState(()=>new Animated.Value(1));
  const reduced=useReducedMotion();
  const insets=useSafeAreaInsets();
  const height=useWindowDimensions().height;
  useEffect(()=>{const timer=setTimeout(()=>setElapsed(true),2200);return()=>clearTimeout(timer);},[]);
  useEffect(()=>{const timer=setTimeout(handleSceneReady,3000);return()=>clearTimeout(timer);},[handleSceneReady]);
  useEffect(()=>{
    if(!ready || !elapsed || !sceneReady) return;
    const timer=setTimeout(()=>setClosing(true),600);
    return()=>clearTimeout(timer);
  },[ready,elapsed,sceneReady]);
  useEffect(()=>{
    if(!closing) return;
    const animation=Animated.timing(fade,{toValue:0,duration:reduced?0:420,useNativeDriver:Platform.OS!=="web"});
    animation.start(({finished})=>{if(finished)onDone();});
    return()=>animation.stop();
  },[closing,fade,onDone,reduced]);
  return <Animated.View style={{flex:1,opacity:fade,backgroundColor:colors.bg}}><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:"center",padding:28,paddingBottom:28+insets.bottom,gap:22}}>
    <Enter>
      <Txt style={{textAlign:"center",color:colors.accent,fontWeight:"700",letterSpacing:3}}>A LITTLE PREP. A BETTER DAY.</Txt>
      <View style={{height:Math.min(260,height*.29),borderRadius:120,overflow:"hidden",marginVertical:26}}><WelcomeScene closing={closing} onReady={handleSceneReady}/></View>
      <Txt accessibilityRole="header" style={{fontSize:40,fontWeight:"600",textAlign:"center",letterSpacing:-1.2}}>Welcome to Mise</Txt>
      <Txt style={{color:colors.muted,fontSize:16,lineHeight:25,textAlign:"center",marginTop:14}}>Good food. Clear portions.{"\n"}A kitchen that feels like yours.</Txt>
    </Enter>
    {ready ? <Button label="Enter my kitchen" onPress={()=>setClosing(true)} /> : <View style={{gap:12,alignItems:"center"}}><ActivityIndicator color={colors.accent}/><Txt>Getting your kitchen ready…</Txt></View>}
  </ScrollView></Animated.View>;
}
