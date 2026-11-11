// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapGoodreadsRow, planImport, readGoodreadsRows } from './goodreads.ts';

const CSV = [
  'Book Id,Title,Author,ISBN,ISBN13,My Rating,Number of Pages,Year Published,Date Read,Date Added,Exclusive Shelf,My Review',
  '1,"Dune (Dune, #1)",Frank Herbert,"=""0441172717""","=""9780441172719""",5,612,1990,2021/03/14,2020/12/01,read,"Slow start.<br/><br/>Worth it, ""truly""."',
  '2,Hyperion,Dan Simmons,"=""""","=""""",0,482,1989,,2021/01/05,to-read,',
  '3,Shogun,James Clavell,"=""""","=""9780440178002""",0,,,,2021/02/02,currently-reading,',
].join('\r\n');

test('maps Goodreads rows to books', () => {
  const [dune, hyperion, shogun] = readGoodreadsRows(CSV).map((r) => mapGoodreadsRow(r));

  assert.deepEqual(dune, {
    title: 'Dune (Dune, #1)',
    author: 'Frank Herbert',
    genres: [],
    status: 'read',
    year: 1990,
    pages: 612,
    isbn: '9780441172719', // ="..." wrapper stripped
    rating: 5,
    review: 'Slow start.\n\nWorth it, "truly".',
    createdAt: '2020-12-01T12:00:00.000Z',
    finishedAt: '2021-03-14',
  });
  assert.equal(hyperion?.status, 'tbr');
  assert.equal(hyperion?.rating, undefined, 'My Rating 0 means unrated');
  assert.equal(shogun?.status, 'reading');

  // Duplicates are skipped by ISBN or by title plus author.
  const plan = planImport(readGoodreadsRows(CSV), [{ title: 'HYPERION', author: 'dan simmons' }, { title: 'Other', author: 'X', isbn: '9780440178002' }]);
  assert.equal(plan.toAdd.length, 1);
  assert.equal(plan.duplicates, 2);
});
