import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('every selectable portrait has a gallery preview and a full-resolution source', async () => {
  const assets = new URL('../site/thumbnails/', import.meta.url);
  const source = await readFile(new URL('assets/catalog.js', assets), 'utf8');
  const catalog = JSON.parse(source.trim().replace(/^window\.MONEY_PICK_CATALOG=/, '').replace(/;$/, ''));
  assert.ok(catalog.length > 0);
  await Promise.all(catalog.map(async ({ id, script }) => {
    const preview = await readFile(new URL(`assets/photo-previews/${id}.png`, assets));
    const fullSize = await readFile(new URL(script, assets), 'utf8');
    assert.equal(preview.toString('hex', 0, 8), '89504e470d0a1a0a', id);
    assert.equal(preview.readUInt32BE(16), 144, id);
    assert.equal(preview.readUInt32BE(20), 144, id);
    assert.ok(fullSize.includes('image/png;base64,'), id);
  }));
});
