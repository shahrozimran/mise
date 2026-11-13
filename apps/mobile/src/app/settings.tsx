import { useState } from "react";
import { Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppData, dietOptions, goalOptions } from "@mise/domain";
import { Onboarding } from "../components/Onboarding";
import { blankRecipe, initialData, useKitchen } from "../data/store";
import { catalogManifest } from "../data/catalog";
import { useBilling } from "../services/billing";
import { exportBackup, pickBackup } from "../services/export";
import {
  Button,
  Card,
  Chip,
  useTheme,
  Eyebrow,
  Field,
  Muted,
  Notice,
  Page,
  Row,
  Sheet,
  Txt,
} from "../components/ui";
import { ProSheet } from "../components/ProSheet";

export default function Settings() {
  const {mode, colors}=useTheme();
  const { data, commit, replaceData } = useKitchen();
  const billing = useBilling();
  const [proSheet, setProSheet] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<AppData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  async function backup() {
    setBusy(true);
    try {
      await exportBackup(data!);
      setMessage("Backup ready. Store it somewhere safe outside this device.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    setBusy(true);
    try {
      setPending(await pickBackup());
    } catch (e) {
      setMessage(`Import failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Your kitchen, your rules."
      subtitle="A few preferences. A little peace of mind."
    >
      {!!message && (
        <View style={{ marginBottom: 20 }}>
          <Notice>{message}</Notice>
        </View>
      )}
      <View style={{ gap: 20 }}>
        <Card>
          <Eyebrow>APPEARANCE</Eyebrow>
          <Txt style={{fontSize:20,fontWeight:"600"}}>Follows your phone</Txt>
          <Muted>{mode === "dark" ? "Dark mode" : "Light mode"} is active. Mise switches automatically when your system appearance changes.</Muted>
        </Card>
        <Card>
          <Eyebrow>MADE FOR YOU</Eyebrow>
          <Txt style={{ fontSize: 22, fontWeight: "600" }}>
            Your food preferences
          </Txt>
          <Muted>
            {goalOptions.find((g) => g.id === data!.preferences?.goal)?.title ??
              "A balanced start"}{" "}
            ·{" "}
            {dietOptions.find((d) => d.id === data!.preferences?.diet)?.title ??
              "All eating styles"}
          </Muted>
          <Muted>
            Up to {data!.preferences?.minutes ?? 30} minutes ·{" "}
            {data!.preferences?.servings ?? 4} portions
          </Muted>
          <Button
            label="Change my preferences"
            variant="secondary"
            icon="options-outline"
            onPress={() => setPreferencesOpen(true)}
          />
        </Card>
        <Card>
          <Eyebrow>MEASUREMENTS</Eyebrow>
          <Txt style={{ fontSize: 21, fontWeight: "500" }}>
            What’s in your measuring cup?
          </Txt>
          <Row>
            <Chip
              label="US household"
              active={data!.settings.convention === "us"}
              onPress={() =>
                commit((d) => ({
                  ...d,
                  settings: { ...d.settings, convention: "us" },
                }))
              }
            />
            <Chip
              label="Metric / mass"
              active={data!.settings.convention === "metric"}
              onPress={() =>
                commit((d) => ({
                  ...d,
                  settings: { ...d.settings, convention: "metric" },
                }))
              }
            />
          </Row>
          <Muted>
            USDA cup and spoon measures are US household estimates. Metric mode
            offers gram weights and verified piece measures; it doesn’t guess a
            metric cup conversion. Existing ingredients keep the gram weights
            you confirmed.
          </Muted>
        </Card>
        <Card>
          <Eyebrow>ROOM TO GROW</Eyebrow>
          <Row style={{ justifyContent: "space-between" }}>
            <Txt style={{ fontSize: 21, fontWeight: "500" }}>
              {billing.pro ? "Your Pro kitchen" : "Mise, with a little more."}
            </Txt>
            <Chip label={billing.pro ? "Pro active" : "Free plan"} />
          </Row>
          <Muted>
            Unlimited recipes, aggregated groceries, calorie scaling, and
            shareable macro cards.
          </Muted>
          <Button
            label="View Pro and subscription options"
            variant="secondary"
            onPress={() => setProSheet(true)}
          />
          {billing.preview && (
            <Notice>
              Development Pro preview is active. No purchase has been made.
            </Notice>
          )}
          {__DEV__ && (
            <Button
              small
              label={
                billing.preview
                  ? "Turn off development Pro preview"
                  : "Preview Pro tools in this development build"
              }
              variant="ghost"
              onPress={() => useBilling.setState({ preview: !billing.preview })}
            />
          )}
        </Card>
        <Card>
          <Eyebrow>YOUR DATA BELONGS TO YOU</Eyebrow>
          <Txt style={{ fontSize: 21, fontWeight: "500" }}>
            Keep a copy of your kitchen.
          </Txt>
          <Muted>
            Recipes are stored on this device. Uninstalling the app can delete
            them. Export a backup before switching phones.
          </Muted>
          <Row style={{ flexWrap: "wrap" }}>
            <Button
              label="Export backup"
              icon="download-outline"
              loading={busy}
              onPress={() => void backup()}
            />
            <Button
              label="Import backup"
              icon="cloud-upload-outline"
              variant="secondary"
              disabled={busy}
              onPress={() => void restore()}
            />
          </Row>
          <Muted>
            Backups contain your recipes, custom foods, batches, grocery list,
            and settings. Subscription access is restored separately through
            Google Play.
          </Muted>
        </Card>
        <Card>
          <Eyebrow>GOOD DATA, CLEAR LIMITS</Eyebrow>
          <Txt style={{ fontSize: 21, fontWeight: "500" }}>
            {catalogManifest.count.toLocaleString()} foods. Ready offline.
          </Txt>
          <Muted>
            U.S. Department of Agriculture, Agricultural Research Service.
            FoodData Central · SR Legacy, April 2018 · public-domain / CC0 data.
          </Muted>
          <Muted>
            Catalog: {catalogManifest.version}. Custom food values come from the
            labels you enter. Nutrition estimates depend on food selection,
            edible weight, and how evenly the dish is portioned.
          </Muted>
          <Button
            label="Privacy and data use"
            variant="ghost"
            onPress={() => setPrivacy(true)}
          />
        </Card>
        <Card>
          <Eyebrow>RESET THIS DEVICE</Eyebrow>
          <Muted>
            Delete local recipes, custom foods, batches, and grocery lists.
            Export a backup first. This does not cancel a Google Play
            subscription.
          </Muted>
          <Button
            label="Delete local kitchen data"
            variant="danger"
            icon="trash-outline"
            onPress={() => setDeleting(true)}
          />
        </Card>
      </View>
      {proSheet && <ProSheet visible onClose={() => setProSheet(false)} />}
      {preferencesOpen && (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => setPreferencesOpen(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
            <Onboarding editing onClose={() => setPreferencesOpen(false)} />
          </SafeAreaView>
        </Modal>
      )}
      {pending && (
        <Sheet
          visible
          title="Restore this kitchen?"
          subtitle="This replaces the current local data. Export a backup first if you want to keep it."
          onClose={() => setPending(null)}
        >
          <Notice>
            {pending.recipes.length} master recipes · {pending.batches.length}{" "}
            cooked batches · {pending.customFoods.length} custom/cached foods.
            Subscription access is not imported.
          </Notice>
          <Button
            label="Export current data first"
            variant="secondary"
            onPress={() => void backup()}
          />
          <Button
            label="Replace with this backup"
            onPress={() => {
              void replaceData(pending)
                .then(() => {
                  setPending(null);
                  setMessage("Your kitchen has been restored.");
                })
                .catch((e) => setMessage(e.message));
            }}
          />
        </Sheet>
      )}
      {deleting && (
        <Sheet
          visible
          title="Delete local kitchen data?"
          subtitle="This cannot be undone without an exported backup. Type DELETE to confirm."
          onClose={() => setDeleting(false)}
        >
          <Field
            label="Confirmation"
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
          />
          <Button
            label="Delete this device’s data"
            disabled={confirmation !== "DELETE"}
            variant="danger"
            onPress={() => {
              void replaceData({ ...initialData(), draft: blankRecipe() })
                .then(() => {
                  setDeleting(false);
                  setConfirmation("");
                  setMessage("Local kitchen data deleted.");
                })
                .catch((e) => setMessage(e.message));
            }}
          />
        </Sheet>
      )}
      {privacy && (
        <Sheet
          visible
          title="A private little kitchen"
          onClose={() => setPrivacy(false)}
        >
          <Txt>
            Your recipe text, ingredient lists, saved batches, and PDF
            generation stay on your device. The app does not include analytics
            or advertising.
          </Txt>
          <Txt>
            If you choose online search or barcode lookup, your search query or
            barcode is sent to the configured Mise API and USDA FoodData
            Central. Selected foods are cached on your device.
          </Txt>
          <Txt>
            Google Play processes payments. A configured verification service
            stores an anonymous installation identifier and encrypted purchase
            tokens to maintain subscription access. It does not store your
            recipe collection.
          </Txt>
          <Txt>
            Camera access is used only while scanning. Audio recording is
            disabled. Backups and PDF files are shared only when you choose an
            export action.
          </Txt>
          <Notice>
            Your backup contains your personal recipe collection. Store it
            safely and share it only with people you choose.
          </Notice>
        </Sheet>
      )}
    </Page>
  );
}
