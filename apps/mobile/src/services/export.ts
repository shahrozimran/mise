import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import {
  AppData,
  calculateRecipe,
  equalPortion,
  escapeHtml,
  formatNumber,
  importBackup,
  Recipe,
} from "@mise/domain";

function download(content: string, name: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function exportBackup(data: AppData) {
  const json = JSON.stringify(data, null, 2);
  const name = `mise-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === "web") {
    download(json, name, "application/json");
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(json);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is unavailable on this device.");
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Save your kitchen backup",
  });
}
export async function pickBackup(): Promise<AppData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > 25 * 1024 * 1024)
    throw new Error("Backup must be smaller than 25 MB.");
  const text =
    Platform.OS === "web" && asset.file
      ? await asset.file.text()
      : await new File(asset.uri).text();
  return importBackup(text);
}
export function macroCardHtml(recipe: Recipe): string {
  const total = calculateRecipe(recipe).totals;
  const portion = equalPortion(recipe);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(recipe.title)}</title><style>
    @page{size:auto;margin:18mm}body{font-family:Arial,sans-serif;color:#11212D;font-size:12px;line-height:1.6}h1{font-family:Arial,sans-serif;font-size:34px;line-height:1.2}h2{font-size:18px}header{border-bottom:2px solid #253745;padding-bottom:18px}.brand{font-size:22px;font-weight:bold;color:#253745}.card{background:#CCD0CF;padding:22px;margin:22px 0;break-inside:avoid;border-radius:12px}.cal{font-size:42px;color:#253745}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px 0;border-bottom:1px solid #9BA8AB}tr{break-inside:avoid}.muted{color:#4A5C6A}footer{margin-top:25px;font-size:10px}.notes{white-space:pre-wrap}</style></head><body>
    <header><div class="brand">mise.</div><h1>${escapeHtml(recipe.title)}</h1><div class="muted">${recipe.servings} containers${recipe.yieldGrams ? ` · ${formatNumber(recipe.yieldGrams)} g cooked yield · ${formatNumber(recipe.yieldGrams / recipe.servings)} g per container` : " · cooked yield not recorded"}</div></header>
    <div class="card"><div>PER CONTAINER</div><div class="cal">${formatNumber(portion.kcal, 0)} <small>kcal</small></div><div>Protein ${formatNumber(portion.protein)} g &nbsp;·&nbsp; Carbs ${formatNumber(portion.carbs)} g &nbsp;·&nbsp; Fat ${formatNumber(portion.fat)} g &nbsp;·&nbsp; Fiber ${formatNumber(portion.fiber)} g</div></div>
    <h2>What goes in</h2><table><thead><tr><th>Ingredient</th><th>Weight</th></tr></thead><tbody>${recipe.ingredients.map((item) => `<tr><td>${escapeHtml(item.food.name)}</td><td>${formatNumber(item.grams)} g</td></tr>`).join("")}</tbody></table>
    <h2>Entire batch</h2><p>${formatNumber(total.kcal, 0)} kcal · Protein ${formatNumber(total.protein)} g · Carbs ${formatNumber(total.carbs)} g · Fat ${formatNumber(total.fat)} g · Fiber ${formatNumber(total.fiber)} g</p>
    ${recipe.yieldGrams ? `<p>Per 100 g cooked: ${formatNumber(total.kcal === null ? null : (total.kcal / recipe.yieldGrams) * 100, 0)} kcal</p>` : ""}
    ${recipe.notes ? `<h2>Kitchen notes</h2><p class="notes">${escapeHtml(recipe.notes)}</p>` : ""}
    <footer>Created ${new Date().toISOString().slice(0, 10)} · Nutrition estimates based on edible ingredients retained in the dish and equal portions. — means unknown. Household measures are food-specific estimates. Fiber is included within carbohydrate values. Sources: ${escapeHtml([...new Set(recipe.ingredients.map((i) => `${i.food.source} (${i.food.sourceVersion})`))].join("; "))}. USDA FoodData Central: fdc.nal.usda.gov.</footer></body></html>`;
}
export async function exportMacroCard(recipe: Recipe) {
  const html = macroCardHtml(recipe);
  if (Platform.OS === "web") {
    const popup = window.open("", "_blank");
    if (!popup)
      throw new Error(
        "Allow pop-ups to print or save this macro card as a PDF.",
      );
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    return;
  }
  const result = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(result.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Your macro card",
  });
}
