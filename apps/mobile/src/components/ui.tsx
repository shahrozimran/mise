import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  useWindowDimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConnectionStatus } from "./ConnectionStatus";

import { colors } from "./theme";
export { colors } from "./theme";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function BrandMark() {
  return <View accessible={false} style={{width:38,height:38,borderRadius:10,borderWidth:1,borderColor:colors.soft,backgroundColor:colors.paper,alignItems:"center",justifyContent:"center"}}>
    <Txt style={{fontSize:23,fontWeight:"600",letterSpacing:-2,color:colors.ink}}>m.</Txt>
  </View>;
}
export function Icon({
  name,
  size = 20,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: React.ComponentProps<typeof Ionicons>["color"];
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Txt({
  children,
  style,
  ...rest
}: React.ComponentProps<typeof Text>) {
  return (
    <Text {...rest} style={[s.text, style]}>
      {children}
    </Text>
  );
}
export function Eyebrow({ children }: PropsWithChildren) {
  return <Txt style={s.eyebrow}>{children}</Txt>;
}
export function Heading({ children }: PropsWithChildren) {
  return <Txt style={s.heading}>{children}</Txt>;
}
export function Muted({ children }: PropsWithChildren) {
  return <Txt style={s.muted}>{children}</Txt>;
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Row({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[s.row, style]}>{children}</View>;
}
export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled,
  loading,
  small,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  testID?: string;
}) {
  const dark = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        small && { minHeight: 40, paddingHorizontal: 14 },
        variant === "primary" && { backgroundColor: colors.accent },
        variant === "secondary" && { backgroundColor: colors.pale },
        variant === "danger" && { backgroundColor: "#253745" },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={dark ? colors.onAccent : colors.accent} />
      ) : icon ? (
        <Icon
          name={icon}
          size={18}
          color={
            dark ? colors.onAccent : variant === "danger" ? colors.error : colors.accent
          }
        />
      ) : null}
      <Txt
        style={{
          fontWeight: "600",
          fontSize: small ? 13 : 14,
          color: dark
            ? colors.onAccent
            : variant === "danger"
              ? colors.error
              : colors.accent,
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 7, flex: 1 }}>
      <Txt style={s.label}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        selectionColor={colors.accent}
        placeholderTextColor="#9BA8AB"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 110, textAlignVertical: "top" },
          props.style,
        ]}
      />
      {!!error && (
        <Txt style={{ color: colors.error, fontSize: 12 }}>{error}</Txt>
      )}
    </View>
  );
}
export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={[
        s.chip,
        active && { backgroundColor: colors.accent, borderColor: colors.accent },
      ]}
    >
      <Txt
        style={{
          fontSize: 12,
          color: active ? colors.onAccent : colors.accent,
          fontWeight: "500",
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Notice({
  children,
  error = false,
}: PropsWithChildren<{ error?: boolean }>) {
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      style={{
        backgroundColor: error ? "#253745" : colors.pale,
        padding: 14,
        borderRadius: 12,
      }}
    >
      <Txt
        style={{
          fontSize: 13,
          lineHeight: 20,
          color: error ? colors.error : colors.accent,
        }}
      >
        {children}
      </Txt>
    </View>
  );
}
export function Page({
  children,
  title,
  subtitle,
  action,
}: PropsWithChildren<{ title: string; subtitle: string; action?: ReactNode }>) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.page}>
        <Row style={{ justifyContent: "space-between", marginBottom: 34 }}>
          <Row style={{ gap: 7 }}>
            <BrandMark />
            <Txt style={s.brand}>mise.</Txt>
          </Row>
          <ConnectionStatus />
        </Row>
        <View style={{ marginBottom: 25, gap: 9 }}>
          <Eyebrow>LESS LOGGING. MORE COOKING.</Eyebrow>
          <Heading>{title}</Heading>
          <Row
            style={{
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <Muted>{subtitle}</Muted>
            {action}
          </Row>
        </View>
        {children}
        <Txt style={s.footer}>Made for real food, in your real kitchen.</Txt>
      </View>
    </ScrollView>
  );
}
export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (event) => setKeyboardTop(event.endCoordinates.screenY));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardTop(null));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const keyboardOverlap = keyboardTop === null ? 0 : Math.max(0, height - keyboardTop);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[s.overlay, { paddingTop: insets.top + 8, paddingBottom: keyboardOverlap }]}>
        <View style={[s.sheet, { paddingBottom: keyboardTop === null ? Math.max(insets.bottom, 20) : 12 }]}>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <Txt style={{ fontSize: 23, fontWeight: "600", flex: 1 }}>
              {title}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={onClose}
              style={s.iconButton}
            >
              <Icon name="close" size={23} />
            </Pressable>
          </Row>
          {!!subtitle && (
            <Txt style={[s.muted, { marginBottom: 16 }]}>{subtitle}</Txt>
          )}
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingBottom: 18 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  text: {
    color: colors.ink,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 2.1,
    fontWeight: "700",
  },
  heading: {
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1.3,
    fontWeight: "600",
    color: colors.ink,
  },
  page: {
    padding: 24,
    paddingTop: 24,
    maxWidth: 1150,
    width: "100%",
    alignSelf: "center",
  },
  brand: { fontSize: 33, fontWeight: "700", letterSpacing: -1.5 },
  brandMark: {
    width: 33,
    height: 35,
    backgroundColor: colors.pale,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#9BA8AB" },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 19,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  label: { fontSize: 12, fontWeight: "600", color: "#9BA8AB" },
  input: {
    minHeight: 48,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.soft,
    borderRadius: 11,
    backgroundColor: "#06141B",
    color: colors.ink,
    fontSize: 15,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: colors.paper,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6,20,27,0.78)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxWidth: 650,
    width: "100%",
    height: "94%",
  },
  footer: {
    color: "#9BA8AB",
    fontSize: 11,
    textAlign: "center",
    marginTop: 32,
  },
});
