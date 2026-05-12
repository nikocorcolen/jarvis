import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readJarvisConfig } from '../src/core/jarvis-dir.js';
import { writeText, ensureDir } from '../src/io/fs.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('readJarvisConfig', () => {
  it('returns default config with es lang when config.json is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-config-'));
    try {
      const config = readJarvisConfig(dir);
      assert.equal(config.lang, 'es');
      assert.equal(config.formatVersion, 1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('reads lang from valid config.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-config-'));
    try {
      await writeText(join(dir, 'config.json'), JSON.stringify({ lang: 'en', formatVersion: 2 }));
      const config = readJarvisConfig(dir);
      assert.equal(config.lang, 'en');
      assert.equal(config.formatVersion, 2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('falls back to es if lang is missing or invalid in config.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-config-'));
    try {
      await writeText(join(dir, 'config.json'), JSON.stringify({ lang: 'fr' }));
      const config = readJarvisConfig(dir);
      assert.equal(config.lang, 'es');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('falls back to es if config.json is malformed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-config-'));
    try {
      await writeText(join(dir, 'config.json'), '{ malformed json');
      const config = readJarvisConfig(dir);
      assert.equal(config.lang, 'es');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
