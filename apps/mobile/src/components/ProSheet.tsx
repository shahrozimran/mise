import { Linking, View } from "react-native";
import { buyPlan, restorePurchases, useBilling } from "../services/billing";
import { Button, useTheme, Icon, Muted, Notice, Row, Sheet, Txt } from "./ui";

export function ProSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { plans, configured, busy, error, pro, preview } = useBilling();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Mise Pro"
      subtitle="More tools for planning and preparing your meals."
    >
      <View
        style={{
          backgroundColor: colors.pale,
          borderRadius: 17,
          padding: 23,
          gap: 19,
        }}
      >
        {[
          [
            "book-outline",
            "Unlimited master recipes",
            "Keep every variation and every favorite.",
          ],
          [
            "basket-outline",
            "One organized grocery list",
            "Add up ingredients across your weekly batches.",
          ],
          [
            "resize-outline",
            "Your calorie target, built in",
            "Scale the whole recipe in a few taps.",
          ],
          [
            "document-outline",
            "PDF macro cards",
            "Share a printable PDF from your device.",
          ],
        ].map(([icon, title, detail]) => (
          <Row key={title}>
            <Icon name={icon as "book-outline"} color={colors.secondary} size={23} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt style={{ color: colors.ink, fontWeight: "600" }}>{title}</Txt>
              <Txt style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
                {detail}
              </Txt>
            </View>
          </Row>
        ))}
      </View>
      {preview && (
        <Notice>
          Development preview is active. This is not a paid subscription.
        </Notice>
      )}
      {pro && <Notice>Your Pro subscription is active.</Notice>}
      {!!error && <Notice error>{error}</Notice>}
      {!configured ? (
        <Notice>
          Subscriptions are not available in this build yet. All free recipe and
          portion tools work offline.
        </Notice>
      ) : !plans.length ? (
        <Notice>
          No eligible Google Play plans are available. Check your Play account
          or try again later.
        </Notice>
      ) : (
        plans.map((plan) => (
          <View key={plan.id} style={{ gap: 8 }}>
            <Button
              label={`${plan.price} / ${plan.period}`}
              loading={busy}
              onPress={() => {
                void buyPlan(plan);
              }}
            />
            <Muted>{plan.terms}</Muted>
          </View>
        ))
      )}
      <Button
        label="Restore purchases"
        variant="secondary"
        loading={busy}
        onPress={() => void restorePurchases()}
      />
      <Button
        label="Manage Google Play subscription"
        variant="ghost"
        onPress={() => {
          void Linking.openURL(
            "https://play.google.com/store/account/subscriptions",
          );
        }}
      />
      <Muted>
        Payment is handled by Google Play. Subscriptions renew automatically
        unless canceled in Play. Your saved recipes stay on your device after
        Pro ends.
      </Muted>
    </Sheet>
  );
}
