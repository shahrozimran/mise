import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicProduct,foodSchema} from '../src';
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
