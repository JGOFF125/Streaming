import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acquireNetflixOperation } from '../src/netflixOperation.ts';
test('diagnostic and room operations cannot run concurrently or release a newer owner',()=>{
 const first=acquireNetflixOperation();assert.equal(typeof first,'function');assert.equal(acquireNetflixOperation(),null);
 first();const second=acquireNetflixOperation();assert.equal(typeof second,'function');
 first();assert.equal(acquireNetflixOperation(),null);second();const third=acquireNetflixOperation();assert.equal(typeof third,'function');third();
});
