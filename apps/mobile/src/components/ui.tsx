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

import { useTheme, themes, ThemeColors } from "./theme";
export { useTheme } from "./theme";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function BrandMark() {
  const { colors } = useTheme();
  return <View accessible={false} style={{width:38,height:38,borderRadius:10,borderWidth:1,borderColor:colors.soft,backgroundColor:colors.paper,alignItems:"center",justifyContent:"center"}}>
    <Txt style={{fontSize:23,fontWeight:"600",letterSpacing:-2,color:colors.ink}}>m.</Txt>
  </View>;
}
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: React.ComponentProps<typeof Ionicons>["color"];
}) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.ink} />;
}
export function Txt({
  children,
  style,
  ...rest
}: React.ComponentProps<typeof Text>) {
  const s = useStyles();
  return (
    <Text {...rest} style={[s.text, style]}>
      {children}
    </Text>
  );
}
export function Eyebrow({ children }: PropsWithChildren) {
  const s = useStyles();
  return <Txt style={s.eyebrow}>{children}</Txt>;
}
export function Heading({ children }: PropsWithChildren) {
  const s = useStyles();
  return <Txt accessibilityRole="header" style={s.heading}>{children}</Txt>;
}
export function Muted({ children }: PropsWithChildren) {
  const s = useStyles();
  return <Txt style={s.muted}>{children}</Txt>;
}
export function Card({
  children,
  style,
  testID,
}: PropsWithChildren<{ style?: ViewStyle; testID?: string }>) {
  const s = useStyles();
  return <View testID={testID} style={[s.card, style]}>{children}</View>;
}
export function Row({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  const s = useStyles();
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
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  testID?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const dark = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      aria-disabled={!!disabled || !!loading}
      aria-busy={!!loading}
      disabled={disabled || loading}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        small && { minHeight: 44, paddingHorizontal: 14 },
        variant === "primary" && { backgroundColor: colors.accent },
        variant === "secondary" && { backgroundColor: colors.pale },
        variant === "danger" && { backgroundColor: colors.pale },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
        style,
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
          fontSize: small ? 13 : 15,
          flexShrink: 1,
          textAlign: "center",
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
  containerStyle,
  ...props
}: TextInputProps & { label: string; error?: string; containerStyle?: ViewStyle }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={[{ gap: 7, flex: 1, minWidth: 0 }, containerStyle]}>
      <Txt style={s.label}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        selectionColor={colors.accent}
        placeholderTextColor={colors.muted}
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
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected: active } : undefined}
      aria-selected={onPress ? active : undefined}
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
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      style={{
        backgroundColor: error ? colors.pale : colors.pale,
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
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <ScrollView
      testID="page-surface"
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.page}>
        <Row style={{ justifyContent: "space-between", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.line, flexWrap: "wrap" }}>
          <Row style={{ gap: 7 }}>
            <BrandMark />
            <Txt style={s.brand}>mise.</Txt>
          </Row>
          <ConnectionStatus />
        </Row>
        <View style={{ marginBottom: 24, gap: 8 }}>
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
  const s = useStyles();
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
        <View testID="sheet-surface" style={[s.sheet, { paddingBottom: keyboardTop === null ? Math.max(insets.bottom, 20) : 12 }]}>
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
function createUIStyles(colors: ThemeColors) { return StyleSheet.create({
  text: {
    color: colors.ink,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  heading: {
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.8,
    fontWeight: "600",
    color: colors.ink,
  },
  page: {
    padding: 20,
    paddingTop: 24,
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
  },
  brand: { fontSize: 28, fontWeight: "700", letterSpacing: -1.2 },
  brandMark: {
    width: 33,
    height: 35,
    backgroundColor: colors.pale,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 19,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted },
  input: {
    minHeight: 48,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.soft,
    borderRadius: 11,
    backgroundColor: colors.bg,
    color: colors.ink,
    fontSize: 15,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 8,
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
    backgroundColor: colors.bg === themes.dark.bg ? "rgba(0,0,0,0.72)" : "rgba(37,36,34,0.28)",
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
});
}
const styles = { light: createUIStyles(themes.light), dark: createUIStyles(themes.dark) };
export function useStyles() { const { mode } = useTheme(); return styles[mode]; }
