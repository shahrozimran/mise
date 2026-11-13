import {test,expect} from '@playwright/test';

test('system appearance switches all surfaces without losing a meal or open search input',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Skip setup for now'}).click();
  await expect(page.getByTestId('meal-focus-card')).toHaveCSS('background-color','rgb(238, 232, 223)');
  await expect(page.getByTestId('beige-surface-texture')).toHaveCount(1);
  await page.screenshot({path:'artifacts/mise-system-light-mobile.png'});
  await page.getByRole('button',{name:'Build my own meal',exact:true}).click();
  await page.getByRole('textbox',{name:'Dish name',exact:true}).fill('My theme-switch meal');
  await page.getByRole('button',{name:'Add ingredient',exact:true}).click();
  await page.getByRole('textbox',{name:'Search foods',exact:true}).fill('broccoli');
  await expect(page.getByTestId('sheet-surface')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await page.emulateMedia({colorScheme:'dark'});
  await expect(page.getByTestId('sheet-surface')).toHaveCSS('background-color','rgb(27, 27, 27)');
  await expect(page.getByRole('textbox',{name:'Search foods',exact:true})).toHaveValue('broccoli');
  await page.screenshot({path:'artifacts/mise-system-dark-search.png'});
  await page.getByRole('button',{name:'Select Broccoli, raw',exact:true}).click();
  await page.getByRole('button',{name:'Add to dish',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Dish name',exact:true})).toHaveValue('My theme-switch meal');
  await page.getByRole('tab',{name:/Home/}).click();
  await expect(page.getByTestId('meal-focus-card')).toHaveCSS('background-color','rgb(43, 43, 43)');
  await expect(page.getByTestId('beige-surface-texture')).toHaveCount(0);
  await page.getByRole('button',{name:'Edit preferences',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/mise-system-dark-mobile.png'});
  await page.getByRole('tab',{name:'Settings'}).click();
  await expect(page.getByTestId('page-surface').last()).toHaveCSS('background-color','rgb(14, 14, 14)');
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.getByTestId('page-surface').last()).toHaveCSS('background-color','rgb(248, 246, 241)');
  await page.reload();
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await expect(page.getByTestId('page-surface').last()).toHaveCSS('background-color','rgb(248, 246, 241)');
});

test('dark system appearance also reaches the bundled welcome renderer',async({page})=>{
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.goto('/');
  const body=page.frameLocator('iframe').locator('body');
  await expect(body).toHaveAttribute('data-settled','true');
  await expect(body).toHaveCSS('background-color','rgb(14, 14, 14)');
  await expect(page.getByRole('heading',{name:'Welcome to Mise'})).toHaveCSS('color','rgb(237, 237, 237)');
  await page.screenshot({path:'artifacts/mise-system-dark-welcome.png'});
});
