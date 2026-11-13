import { PropsWithChildren, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ViewStyle,
} from "react-native";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
export function Enter({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{ delay?: number; style?: ViewStyle }>) {
  const [progress] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 330,
      delay,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduced]);
  return (
    <Animated.View
      testID="entrance-animation"
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function TouchCard({
  children,
  onPress,
  label,
  selected,
  role = "button",
  style,
}: PropsWithChildren<{
  onPress: () => void;
  label: string;
  selected?: boolean;
  role?: "button" | "radio" | "checkbox";
  style?: ViewStyle;
}>) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  function animate(toValue: number) {
    if (!reduced)
      Animated.spring(scale, {
        toValue,
        speed: 28,
        bounciness: 3,
        useNativeDriver: Platform.OS !== "web",
      }).start();
  }
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole={role}
        accessibilityLabel={label}
        accessibilityState={
          role === "button" ? { selected } : { checked: selected }
        }
        aria-checked={role === "button" ? undefined : selected}
        onPress={onPress}
        onPressIn={() => animate(0.975)}
        onPressOut={() => animate(1)}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
