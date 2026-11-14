import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicProduct,publicProductMatch,foodSchema,productBarcode,makeIngredient,calculateRecipe,equalPortion} from '../src';
const product={code:'3017620422003',product_name:'Example label',nutrition_data_per:'100g',nutriments:{'energy-kcal_100g':540,proteins_100g:6,carbohydrates_100g:57,fat_100g:31}};
test('public label lookup preserves known nutrition and missing fiber',()=>{
  const food=foodSchema.parse(publicProduct(product));
  assert.equal(food.source,'Open Food Facts');
  assert.equal(food.nutrients.kcal,540);
  assert.equal(food.nutrients.fiber,null);
  assert.deepEqual(food.measures,[]);
});
test('liquids never acquire an invented gram density',()=>{
  assert.equal(publicProduct({...product,nutrition_data_per:'100ml'}),null);
  assert.equal(publicProduct({...product,serving_size:'250 ml'}),null);
  assert.equal(publicProduct({...product,nutrition_data_per:undefined}),null);
});
test('unknown barcode records do not become fabricated foods',()=>{
  assert.equal(publicProduct({code:'8964000061121'}),null);
  assert.equal(publicProduct({...product,nutriments:{}}),null);
});

test('product QR identifiers support GS1 links, label links, and explicit product-code parameters',()=>{
  assert.equal(productBarcode(' 3017620422003 '),'3017620422003');
  assert.equal(productBarcode('https://id.gs1.org/01/03017620422003/10/LOT1'),'03017620422003');
  assert.equal(productBarcode('(01)03017620422003(10)LOT1'),'03017620422003');
  assert.equal(productBarcode('https://world.openfoodfacts.org/product/3017620422003/name'),'3017620422003');
  assert.equal(productBarcode('https://brand.example/product?gtin=03017620422003'),'03017620422003');
  for (const unsupported of ['https://brand.example/marketing','javascript:3017620422003','hello','https://example.com/01/123','https://example.com/%ZZ/01/03017620422003'])
    assert.equal(productBarcode(unsupported),null);
});

test('packaged labels retain ingredients, allergens, brand and verified gram servings',()=>{
  const food=foodSchema.parse(publicProduct({...product,brands:'Example Brand',ingredients_text:'Oats, <b>milk</b>, cocoa',allergens:'en:milk',serving_quantity:20,serving_quantity_unit:'g'}));
  assert.equal(food.brand,'Example Brand');
  assert.equal(food.ingredientsText,'Oats, milk, cocoa');
  assert.equal(food.allergensText,'en:milk');
  assert.equal(food.measures[0].grams,20);
  assert.equal(foodSchema.parse(JSON.parse(JSON.stringify(food))).ingredientsText,food.ingredientsText);
});

test('a scanned product combines with other ingredients without counting label sub-ingredients twice',()=>{
  const food=foodSchema.parse(publicProduct({...product,ingredients_text:'Oats, milk, cocoa',nutriments:{...product.nutriments,fiber_100g:4}}));
  const other={...food,id:'other-food',ingredientsText:undefined,nutrients:{kcal:100,protein:20,carbs:5,fat:2,fiber:3}};
  const recipe={id:'mixed',title:'Mixed meal',servings:2,yieldGrams:null,notes:'',updatedAt:new Date().toISOString(),ingredients:[makeIngredient(food,50,'g','product'),makeIngredient(other,100,'g','other')]};
  assert.equal(recipe.ingredients.length,2);
  assert.deepEqual(calculateRecipe(recipe).totals,{kcal:370,protein:23,carbs:33.5,fat:17.5,fiber:5});
  assert.equal(equalPortion(recipe).kcal,185);
});

test('retail barcode validation rejects the partial camera read and expands UPC-E',()=>{
  assert.equal(productBarcode('19640008'),null);
  assert.equal(productBarcode('8964000061121'),'8964000061121');
  assert.equal(productBarcode('8964000061122'),null);
  assert.equal(productBarcode('00000000'),null);
  assert.equal(productBarcode('01234558','upc_e'),'012345000058');
  assert.equal(productBarcode('01234559','upc_e'),null);
});

test('an incomplete valid product record remains visible but cannot be counted as food',()=>{
  const partial=foodSchema.parse(publicProductMatch({code:'8964000061121'}));
  assert.equal(partial.barcode,'8964000061121');
  assert.equal(partial.requiresLabel,true);
  assert.equal(partial.nutrients.kcal,null);
  assert.throws(()=>makeIngredient(partial,100,'g','unverified'),/package nutrition/);
  assert.equal(publicProductMatch({code:'19640008',product_name:'Wrong record'}),null);
});

test('volume-only matches preserve identity without importing volume nutrients as grams',()=>{
  const partial=foodSchema.parse(publicProductMatch({...product,nutrition_data_per:'100ml',ingredients_text_en:'Oil, eggs'}));
  assert.equal(partial.name,'Example label');
  assert.equal(partial.requiresLabel,true);
  assert.equal(partial.ingredientsText,'Oil, eggs');
  assert.deepEqual(partial.nutrients,{kcal:null,protein:null,carbs:null,fat:null,fiber:null});
});
