import { useRef, useState } from "react";
import { Platform, View, ActivityIndicator, Linking, Pressable } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Food, Ingredient, productBarcode } from "@mise/domain";
import { foods } from "../data/catalog";
import { useKitchen } from "../data/store";
import { lookupBarcode, searchProducts } from "../services/api";
import { Button, Field, Muted, Notice, Sheet, Txt, Row, useTheme } from "./ui";
import { FoodPicker } from "./FoodPicker";
import { CustomFood } from "./CustomFood";
import { MiniMacros } from "./Macros";

export function BarcodeScanner({ visible, onClose, onAdd, onManualFood }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (ingredient: Ingredient) => void;
  onManualFood: (code: string) => void;
}) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Food | null>(null);
  const [choosingAmount, setChoosingAmount] = useState(false);
  const [editing, setEditing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const finding = useRef(false);
  function selectProduct(food: Food) {
    useKitchen.getState().addCustomFood(food);
    setProduct(food);
    setError("");
  }
  async function find(value: string) {
    if (finding.current) return;
    finding.current = true;
    setCode(value);
    setBusy(true);
    setError("");
    try {
      const barcode = productBarcode(value);
      if (!barcode) throw new Error("This QR code does not include a supported product identifier. Scan the printed barcode or search by product name below.");
      const local = [...useKitchen.getState().data!.customFoods, ...foods].find(
        (f) => f.barcode?.padStart(14, "0") === barcode.padStart(14, "0"),
      );
      const matches = local ? [local] : await lookupBarcode(barcode);
      if (!matches.length) throw new Error("No matching product found. Search by name or add the nutrition from your package label.");
      selectProduct(matches[0]);
    } catch (e) { setError((e as Error).message); }
    finally { finding.current = false; setBusy(false); }
  }
  async function search() {
    if (finding.current || !query.trim()) return;
    finding.current = true;
    setBusy(true);
    setError("");
    setResults([]);
    try {
      const matches = await searchProducts(query.trim());
      setResults(matches);
      if (!matches.length) setError("No products found. Try the brand and product name, or add the package label manually.");
    } catch (e) { setError((e as Error).message); }
    finally { finding.current = false; setBusy(false); }
  }
  async function refresh() {
    if (!product?.barcode || finding.current) return;
    finding.current = true;
    setBusy(true);
    setError("");
    try {
      const matches = await lookupBarcode(product.barcode);
      if (!matches.length) throw new Error("No updated label was found. Your saved product is still available.");
      selectProduct(matches[0]);
    } catch (e) { setError((e as Error).message); }
    finally { finding.current = false; setBusy(false); }
  }
  if (product && editing) return <CustomFood visible initialFood={product} onClose={() => setEditing(false)} onSaved={(food) => { setProduct(food); setEditing(false); }} />;
  if (product && choosingAmount) return <FoodPicker key={product.id} visible initialFood={product} onClose={onClose} onAdd={onAdd} />;
  if (product) return (
    <Sheet visible={visible} title="Review product" subtitle="Confirm this matches your package before adding it." onClose={onClose}>
      {!!error && <Notice error>{error}</Notice>}
      <View style={{ gap: 8 }}>
        <Txt style={{ fontSize: 22, fontWeight: "600" }}>{product.name}</Txt>
        {!!product.brand && <Muted>{product.brand}</Muted>}
        <Muted>{product.source} · Barcode {product.barcode ?? "not provided"}</Muted>
      </View>
      <View style={{ backgroundColor: colors.pale, padding: 16, borderRadius: 12, gap: 12 }}>
        <Txt style={{ fontWeight: "600" }}>Nutrition per 100 g</Txt>
        <MiniMacros nutrients={product.nutrients} />
      </View>
      <View style={{ gap: 8 }}>
        <Txt style={{ fontWeight: "600" }}>Package ingredients</Txt>
        <Muted>{product.ingredientsText || "The data source did not provide an ingredient list. You can add it when saving a custom product."}</Muted>
        {!!product.allergensText && <Muted>Reported allergens: {product.allergensText.replace(/\b[a-z]{2}:/g, "")}</Muted>}
      </View>
      <Muted>Check your package for ingredients, allergens, and nutrition. Listed sub-ingredients are not added separately to your meal; the product’s label nutrition is counted once.</Muted>
      <Button label="Choose amount" disabled={busy} onPress={() => setChoosingAmount(true)} />
      <Button label={product.source === "Custom" ? "Edit custom product" : "Save as custom product"} disabled={busy} variant="secondary" onPress={() => setEditing(true)} />
      {product.source !== "Custom" && !!product.barcode && <Button label="Refresh product data" loading={busy} variant="ghost" onPress={() => void refresh()} />}
      <Button label="Scan another product" variant="ghost" onPress={() => { setProduct(null); setCode(""); setSearching(false); setResults([]); }} />
    </Sheet>
  );
  return (
    <Sheet visible={visible} title="Scan a product" subtitle="Scan a barcode or a product QR code, then review its label data." onClose={onClose}>
      {Platform.OS !== "web" && permission?.granted && !searching ? (
        <View style={{ height: 230, borderRadius: 16, overflow: "hidden" }}>
          <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "datamatrix", "code128"] }} onBarcodeScanned={busy || error ? undefined : (event) => { void find(event.data); }} />
        </View>
      ) : Platform.OS !== "web" && !searching ? (
        <Button label="Enable camera" icon="camera-outline" variant="secondary" onPress={() => {
          if (permission && !permission.canAskAgain) void Linking.openSettings();
          else void requestPermission();
        }} />
      ) : Platform.OS === "web" && !searching ? <Notice>Use an Android device for camera scanning, or paste the barcode or product QR link below.</Notice> : null}
      {!searching ? <>
        <Field label="Barcode or QR link" value={code} onChangeText={(value) => { setCode(value); setError(""); }} autoCapitalize="none" autoCorrect={false} maxLength={4096} placeholder="Barcode digits or a product QR link" />
        <Button label="Find product" icon="search" disabled={!code.trim()} loading={busy} onPress={() => void find(code)} />
        <Button label="Search by product name" disabled={busy} variant="secondary" onPress={() => { setSearching(true); setError(""); }} />
      </> : <>
        <Field label="Product name" value={query} onChangeText={setQuery} maxLength={100} placeholder="e.g. brand and product name" />
        <Button label="Search products" icon="search" loading={busy} disabled={!query.trim()} onPress={() => void search()} />
        {results.map((food) => <Pressable key={food.id} accessibilityRole="button" accessibilityLabel={`Review ${food.name}`} onPress={() => selectProduct(food)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Row><View style={{ flex: 1, gap: 4 }}><Txt style={{ fontWeight: "600" }}>{food.name}</Txt><Muted>{food.brand || "Packaged food"}</Muted></View></Row>
        </Pressable>)}
        <Button label="Back to scanning" disabled={busy} variant="ghost" onPress={() => { setSearching(false); setError(""); }} />
      </>}
      {!!error && <Notice error>{error}</Notice>}
      {busy && <View accessibilityLiveRegion="polite" style={{ alignItems: "center", gap: 10 }}><ActivityIndicator color={colors.accent} /><Muted>Finding product label data…</Muted></View>}
      {!!error && !searching && <Button label="Try again" variant="secondary" onPress={() => void find(code)} />}
      <Button label="Add from package label" disabled={busy} variant="ghost" onPress={() => onManualFood(productBarcode(code) ?? "")} />
      <Muted>Previously found products work offline. QR codes need a product identifier, such as a GS1 Digital Link. Product information depends on the available label record.</Muted>
    </Sheet>
  );
}
