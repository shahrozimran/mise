import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, ScrollView, ScrollViewProps, StyleSheet, TextInput, useWindowDimensions } from "react-native";

export type InputHandle = React.ComponentRef<typeof TextInput>;

export const RevealInputContext = createContext<(input: InputHandle | null) => void>(() => {});

/** Scroll again after the keyboard or viewport changes, including Android edge-to-edge. */
export function KeyboardScroll({ children, reserveKeyboardSpace = true, contentContainerStyle, ...props }: ScrollViewProps & { reserveKeyboardSpace?: boolean }) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const focused = useRef<InputHandle | null>(null);
  const frame = useRef<number | null>(null);
  const { height } = useWindowDimensions();
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const reveal = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const input = focused.current;
      if (!input || !input.isFocused()) return;
      if (Platform.OS === "web") {
        (input as unknown as { scrollIntoView?: (options: { block: "nearest" }) => void }).scrollIntoView?.({ block: "nearest" });
      } else {
        scroll.current?.scrollResponderScrollNativeHandleToKeyboard(input, 24, true);
      }
    });
  }, []);
  const focus = useCallback((input: InputHandle | null) => { focused.current = input; reveal(); }, [reveal]);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (event) => { setKeyboardTop(event.endCoordinates.screenY); reveal(); });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardTop(null));
    return () => { show.remove(); hide.remove(); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [reveal]);
  useEffect(() => { reveal(); }, [height, keyboardTop, reveal]);
  const basePadding = StyleSheet.flatten(contentContainerStyle)?.paddingBottom;
  const overlap = reserveKeyboardSpace && keyboardTop !== null ? Math.max(0, height - keyboardTop) : 0;
  return (
    <ScrollView {...props} ref={scroll} onLayout={(event) => { props.onLayout?.(event); reveal(); }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentContainerStyle={[contentContainerStyle, overlap > 0 && { paddingBottom: (typeof basePadding === "number" ? basePadding : 0) + overlap }]}>
      <RevealInputContext.Provider value={focus}>{children}</RevealInputContext.Provider>
    </ScrollView>
  );
}
