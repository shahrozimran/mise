import { useRef, useState } from "react";
import { Platform, View, ActivityIndicator, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Food, Ingredient } from "@mise/domain";
import { foods } from "../data/catalog";
import { useKitchen } from "../data/store";
import { lookupBarcode } from "../services/api";
import { Button, Field, Muted, Notice, Sheet } from "./ui";
import { FoodPicker } from "./FoodPicker";

export function BarcodeScanner({
  visible,
  onClose,
  onAdd,
  onManualFood,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (ingredient: Ingredient) => void;
  onManualFood: (code: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Food | null>(null);
  const finding = useRef(false);
  async function find(value: string) {
    if (finding.current) return;
    finding.current = true;
    setCode(value);
    setBusy(true);
    setError("");
    try {
      const local = [...useKitchen.getState().data!.customFoods, ...foods].find(
        (f) => f.barcode?.padStart(14, "0") === value.padStart(14, "0"),
      );
      const matches = local ? [local] : await lookupBarcode(value);
      if (!matches.length)
        throw new Error(
          "No matching product found. Add a custom food using the package nutrition label.",
        );
      const food = matches[0];
      useKitchen.getState().addCustomFood(food);
      setProduct(food);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      finding.current = false;
      setBusy(false);
    }
  }
  if (product)
    return (
      <FoodPicker
        key={product.id}
        visible
        onClose={onClose}
        initialFood={product}
        onAdd={onAdd}
      />
    );
  return (
    <Sheet
      visible={visible}
      title="Scan a staple"
      subtitle="Find the package, then confirm the nutrition."
      onClose={onClose}
    >
      {Platform.OS !== "web" && permission?.granted ? (
        <View style={{ height: 230, borderRadius: 18, overflow: "hidden" }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={
              busy || error
                ? undefined
                : (event) => {
                    void find(event.data);
                  }
            }
          />
        </View>
      ) : Platform.OS !== "web" ? (
        <Button
          label="Enable camera"
          icon="camera-outline"
          variant="secondary"
          onPress={() => {
            if(permission && !permission.canAskAgain) void Linking.openSettings();
            else void requestPermission();
          }}
        />
      ) : (
        <Notice>
          Use an Android device for camera scanning, or enter the barcode below.
        </Notice>
      )}
      <Field
        label="Barcode number"
        value={code}
        onChangeText={(v) => {
          setCode(v.replace(/\s/g, ""));
          setError("");
        }}
        keyboardType="number-pad"
        placeholder="UPC or EAN"
      />
      <Button
        label="Look up barcode"
        icon="search"
        disabled={!/^\d{8}$|^\d{12,14}$/.test(code)}
        loading={busy}
        onPress={() => void find(code)}
      />
      {!!error && <Notice error>{error}</Notice>}
      {busy && <View accessibilityLiveRegion="polite" style={{alignItems:"center",gap:10}}><ActivityIndicator/><Muted>Looking up this package…</Muted></View>}
      {!!error && <Button label="Try barcode again" variant="secondary" onPress={()=>void find(code)} />}
      {!!error && <Button label="Add from package label" variant="secondary" onPress={()=>onManualFood(code)} />}
      <Muted>
        Cached products work offline. New products need a connection, and some
        local brands may not be listed.
      </Muted>
    </Sheet>
  );
}
