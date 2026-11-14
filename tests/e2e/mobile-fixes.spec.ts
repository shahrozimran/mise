import {test,expect} from '@playwright/test';
import { completePersonalDetails } from './helpers/profile';

async function start(page: import('@playwright/test').Page) {
  await page.goto('/');
  await completePersonalDetails(page);
  await page.getByRole('button',{name:'Skip setup for now'}).click();
  await page.getByRole('button',{name:'Build my own meal',exact:true}).click();
}
test('welcome opens smoothly and a short phone viewport keeps food suggestions usable', async({page})=>{
  await page.setViewportSize({width:360,height:640});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Welcome to Mise'})).toBeVisible();
  await expect(page.frameLocator('iframe').locator('body')).toHaveAttribute('data-settled','true');
  for(const enter of await page.getByTestId('entrance-animation').all()) await expect(enter).toHaveCSS('opacity','1');
  await page.screenshot({path:'artifacts/mise-welcome-mobile.png'});
  await completePersonalDetails(page);
  await page.getByRole('button',{name:'Skip setup for now'}).click();
  await page.getByRole('button',{name:'Build my own meal',exact:true}).click();
  await page.getByRole('button',{name:'Add ingredient',exact:true}).click();
  await page.setViewportSize({width:360,height:440});
  await page.getByRole('textbox',{name:'Search foods',exact:true}).fill('broccoli');
  const choice=page.getByRole('button',{name:'Select Broccoli, raw',exact:true});
  await choice.scrollIntoViewIfNeeded();
  await expect(choice).toBeInViewport();
  await page.screenshot({path:'artifacts/mise-short-screen-search.png'});
  await choice.click();
  await expect(page.getByRole('textbox',{name:'Quantity',exact:true})).toBeVisible();
});
test('barcode lookup works without a server and persists for offline reuse',async({page})=>{
  let calls=0;
  await page.route('https://world.openfoodfacts.org/**',async route=>{
    calls++;
    await route.fulfill({json:{status:1,product:{code:'3017620422003',product_name:'Test packaged spread',ingredients_text:calls > 1 ? 'Cocoa, sugar' : undefined,nutrition_data_per:'100g',nutriments:{'energy-kcal_100g':540,proteins_100g:6,carbohydrates_100g:57,fat_100g:31}}}});
  });
  await start(page);
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('3017620422003');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText('Test packaged spread',{exact:true}).last()).toBeVisible();
  await page.getByRole('button',{name:'Refresh product data',exact:true}).click();
  await expect(page.getByText('Cocoa, sugar',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Choose amount',exact:true}).click();
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Scan barcode or QR code',exact:true})).toBeVisible();
  await page.context().setOffline(true);
  await expect(page.getByText('Offline · saved foods ready',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('3017620422003');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText('Test packaged spread',{exact:true}).last()).toBeVisible();
  expect(calls).toBe(2);
});


test('GS1 product QR becomes an editable custom product and combines with a meal offline', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  let calls = 0;
  await page.route('https://world.openfoodfacts.org/**', async route => {
    calls++;
    expect(route.request().url()).toContain('/api/v2/product/3017620422003.json');
    await route.fulfill({json:{status:1,product:{code:'3017620422003',product_name:'Cocoa spread',brands:'Label Foods',ingredients_text:'Oats, cocoa, milk',allergens:'en:milk',nutrition_data_per:'100g',serving_quantity:20,serving_quantity_unit:'g',nutriments:{'energy-kcal_100g':540,proteins_100g:6,carbohydrates_100g:57,fat_100g:31,fiber_100g:4}}}});
  });
  await start(page);
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('https://id.gs1.org/01/03017620422003/10/LOT1');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText('Oats, cocoa, milk',{exact:true})).toBeVisible();
  await expect(page.getByText('Label Foods',{exact:true})).toBeVisible();
  await page.screenshot({path:'artifacts/mise-product-review.png'});
  await page.getByRole('button',{name:'Save as custom product',exact:true}).click();
  await expect(async () => {
    const ingredients = await page.getByRole('textbox',{name:'Package ingredients (optional)',exact:true}).boundingBox();
    const nextLabel = await page.getByText('Allergen information (optional)',{exact:true}).boundingBox();
    expect(nextLabel!.y).toBeGreaterThan(ingredients!.y + ingredients!.height);
  }).toPass();
  await expect(page.getByRole('textbox',{name:'Label serving weight (g)',exact:true})).toHaveValue('20');
  await expect(page.getByRole('textbox',{name:'Calories (kcal) per label serving',exact:true})).toHaveValue('108');
  await page.getByRole('textbox',{name:'Food name',exact:true}).fill('My cocoa spread');
  await page.getByRole('textbox',{name:'Calories (kcal) per label serving',exact:true}).fill('100');
  await page.getByRole('textbox',{name:'Package ingredients (optional)',exact:true}).fill('Oats, cocoa, milk, vanilla');
  await page.getByRole('button',{name:'Save custom food',exact:true}).click();
  const savedSource = await page.evaluate(() => JSON.parse(localStorage.getItem('mise-state-v1')!).customFoods.find((food: { source: string }) => food.source === 'Custom').sourceVersion);
  expect(savedSource).toContain('ODbL');
  await expect(page.getByRole('button',{name:'Edit custom product',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Choose amount',exact:true}).click();
  await page.getByRole('textbox',{name:'Quantity',exact:true}).fill('50');
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await expect(page.getByText('250 kcal',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'Add ingredient',exact:true}).click();
  await page.getByRole('textbox',{name:'Search foods',exact:true}).fill('broccoli');
  await page.getByRole('button',{name:'Select Broccoli, raw',exact:true}).click();
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await expect(page.getByText('284 kcal',{exact:true}).first()).toBeVisible();
  await page.getByRole('textbox',{name:'Number of portions',exact:true}).fill('2');
  await page.getByRole('textbox',{name:'Number of portions',exact:true}).blur();
  await expect(page.getByText('142 kcal / container',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save recipe',exact:true}).click();
  await page.reload();
  await expect(page.getByText('284 kcal',{exact:true}).first()).toBeVisible();
  await page.context().setOffline(true);
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('3017620422003');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText('My cocoa spread',{exact:true}).last()).toBeVisible();
  await expect(page.getByText('Oats, cocoa, milk, vanilla',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Edit custom product',exact:true})).toBeVisible();
  expect(calls).toBe(1);
});

test('a QR without a product identifier offers product-name lookup without opening its URL',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  let calls=0;
  await page.route('https://world.openfoodfacts.org/**',async route=>{
    calls++;
    expect(route.request().url()).toContain('/cgi/search.pl');
    await route.fulfill({json:{products:[{code:'3017620422003',product_name:'Searchable spread',ingredients_text:'Cocoa, sugar',nutrition_data_per:'100g',nutriments:{'energy-kcal_100g':500,proteins_100g:5,carbohydrates_100g:50,fat_100g:30}}]}});
  });
  await start(page);
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('https://brand.example/marketing');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText(/does not include a supported product identifier/)).toBeVisible();
  expect(calls).toBe(0);
  expect(page.url()).toContain('localhost:8081');
  await page.getByRole('button',{name:'Search by product name',exact:true}).click();
  await page.getByRole('textbox',{name:'Product name',exact:true}).fill('brand cocoa spread');
  await page.getByRole('button',{name:'Search products',exact:true}).click();
  await page.getByRole('button',{name:'Review Searchable spread',exact:true}).click();
  await expect(page.getByText('Cocoa, sugar',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Choose amount',exact:true}).click();
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await expect(page.getByText('500 kcal',{exact:true}).first()).toBeVisible();
  expect(calls).toBe(1);
});

test('a liquid without verified gram nutrition can be saved from a measured package label and added immediately',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('https://world.openfoodfacts.org/**',async route=>{
    await route.fulfill({json:{status:1,product:{code:'3017620422003',product_name:'Example milk',nutrition_data_per:'100ml',nutriments:{'energy-kcal_100g':50,proteins_100g:3}}}});
  });
  await start(page);
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('3017620422003');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText(/online record does not have usable gram-based nutrition/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Choose amount',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Complete package label',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Label serving weight (g)',exact:true})).toHaveValue('');
  await page.getByRole('textbox',{name:'Food name',exact:true}).fill('Milk, measured');
  await page.getByRole('textbox',{name:'Label serving weight (g)',exact:true}).fill('206');
  await page.getByRole('textbox',{name:'Calories (kcal) per label serving',exact:true}).fill('100');
  await page.getByRole('textbox',{name:'Protein (g) per label serving',exact:true}).fill('6');
  await page.getByRole('textbox',{name:'Carbohydrate (g) per label serving',exact:true}).fill('10');
  await page.getByRole('textbox',{name:'Fat (g) per label serving',exact:true}).fill('4');
  await page.getByRole('textbox',{name:'Fiber (g) per label serving',exact:true}).fill('0');
  await page.getByRole('button',{name:'Save custom food',exact:true}).click();
  await page.getByRole('button',{name:'Choose amount',exact:true}).click();
  await page.getByRole('textbox',{name:'Quantity',exact:true}).fill('103');
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await expect(page.getByText('50 kcal',{exact:true}).first()).toBeVisible();
});

test('the photographed Youngs barcode is retained while an invalid partial read never reaches lookup',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  let calls=0;
  await page.route('https://world.openfoodfacts.org/**',async route=>{
    calls++;
    expect(route.request().url()).toContain('/api/v2/product/8964000061121.json');
    await route.fulfill({json:{status:1,product:{code:'8964000061121'}}});
  });
  await start(page);
  await page.getByRole('button',{name:'Scan barcode or QR code',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('19640008');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText(/barcode is incomplete or was misread/)).toBeVisible();
  expect(calls).toBe(0);
  await page.getByRole('textbox',{name:'Barcode or QR link'}).fill('8964000061121');
  await page.getByRole('button',{name:'Find product',exact:true}).click();
  await expect(page.getByText('Product 8964000061121',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Choose amount',exact:true})).toHaveCount(0);
  await page.screenshot({path:'artifacts/mise-incomplete-product-review.png'});
  await page.getByRole('button',{name:'Complete package label',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Product barcode (optional)',exact:true})).toHaveValue('8964000061121');
  await expect(page.getByRole('textbox',{name:'Label serving weight (g)',exact:true})).toHaveValue('');
  await page.getByRole('textbox',{name:'Food name',exact:true}).fill('Youngs mayonnaise — my label');
  // Synthetic user-entered values test conversion, not the real product's nutrition.
  await page.getByRole('textbox',{name:'Label serving weight (g)',exact:true}).fill('10');
  await page.getByRole('textbox',{name:'Calories (kcal) per label serving',exact:true}).fill('50');
  await page.getByRole('button',{name:'Save custom food',exact:true}).click();
  await page.getByRole('button',{name:'Choose amount',exact:true}).click();
  await page.getByRole('textbox',{name:'Quantity',exact:true}).fill('20');
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await expect(page.getByText('100 kcal',{exact:true}).first()).toBeVisible();
  expect(calls).toBe(1);
});
