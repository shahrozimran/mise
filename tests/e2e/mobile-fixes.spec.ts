import {test,expect} from '@playwright/test';

async function start(page: import('@playwright/test').Page) {
  await page.goto('/');
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
    await route.fulfill({json:{status:1,product:{code:'3017620422003',product_name:'Test packaged spread',nutrition_data_per:'100g',nutriments:{'energy-kcal_100g':540,proteins_100g:6,carbohydrates_100g:57,fat_100g:31}}}});
  });
  await start(page);
  await page.getByRole('button',{name:'Scan a barcode',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode number'}).fill('3017620422003');
  await page.getByRole('button',{name:'Look up barcode',exact:true}).click();
  await expect(page.getByText('Test packaged spread',{exact:true}).last()).toBeVisible();
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Scan a barcode',exact:true})).toBeVisible();
  await page.context().setOffline(true);
  await expect(page.getByText('Offline · saved foods ready',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Scan a barcode',exact:true}).click();
  await page.getByRole('textbox',{name:'Barcode number'}).fill('3017620422003');
  await page.getByRole('button',{name:'Look up barcode',exact:true}).click();
  await expect(page.getByText('Test packaged spread',{exact:true}).last()).toBeVisible();
  expect(calls).toBe(1);
});
