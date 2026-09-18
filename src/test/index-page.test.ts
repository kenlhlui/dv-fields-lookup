// @vitest-environment node

import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { loadRenderers } from 'astro:container';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@/site.config');
  vi.resetModules();
});

async function renderIndex(path = '') {
  const { default: IndexPage } = path
    ? await import('@/pages/zh-hk/index.astro')
    : await import('@/pages/index.astro');
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  return container.renderToString(IndexPage, {
    partial: false,
    request: new Request(`https://kenlhlui.github.io/dv-fields-lookup/${path}`),
  });
}

describe('index page', () => {
  it('renders the complete metadata lookup shell under the configured base path', async () => {
    vi.stubEnv('BASE_URL', '/dv-fields-lookup');
    const html = await renderIndex();
    expect(html).toMatch(/<html[^>]*\blang="en"/);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(
      /<meta name="description" content="[^"]+">/,
    );
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/dv-fields-lookup/favicon.svg">');
    expect(html).toContain('Search metadata fields');
    expect(html).toContain('Citation Metadata');
  });

  it('links the configured Dataverse installation', async () => {
    const html = await renderIndex();
    expect(html).toContain('https://borealisdata.ca/');
    expect(html).toContain('Borealis');
  });

  it('falls back to The Dataverse Project when the installation is not configured', async () => {
    vi.resetModules();
    vi.doMock('@/site.config', () => ({
      site: {
        dataverseName: '',
        dataverseURL: '',
        githubUrl: 'https://github.com/kenlhlui/dv-fields-lookup',
      },
    }));
    const html = await renderIndex();
    expect(html).toContain('https://dataverse.org/');
    expect(html).toContain('The Dataverse Project');
    expect(html).not.toContain('borealisdata.ca');
  });

  it('renders the zh-HK page in Chinese, keeping the untranslated Dataverse data in English', async () => {
    const html = await renderIndex('zh-hk/');

    expect(html).toMatch(/<html[^>]*\blang="zh-hk"/);
    expect(html).toContain('搵元數據欄位');
    // Block description from src/data/zh-hk/block-descriptions.yaml.
    expect(html).toContain('在 Dataverse 儲存庫發布資料集所需的核心元數據');
    // Field names come from metadata.json, which is not localized.
    expect(html).toContain('Citation Metadata');
  });

  it('offers both locales on every page, as hreflang alternates and switcher links', async () => {
    for (const path of ['', 'zh-hk/']) {
      const html = await renderIndex(path);
      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="zh-hk"');
      expect(html).toContain('繁體中文');
    }
  });

  it('builds the language switcher as a native disclosure of plain links, not an island', async () => {
    const html = await renderIndex('zh-hk/');
    const switcher = html.match(/<details class="[^"]*" data-lang-switcher>.*?<\/details>/s)?.[0];

    expect(switcher).toBeDefined();
    // Real anchors, so the switcher works with no JS and keeps the hreflang signal.
    // Paths are asserted base-agnostically; the configured base is covered by the icon test above.
    expect(switcher).toMatch(/<a href="\S*\/" hreflang="en"/);
    expect(switcher).toMatch(/<a href="\S*\/zh-hk\/" hreflang="zh-hk"/);
    // The marked option is the page you are on.
    expect(switcher).toMatch(/hreflang="zh-hk"[^>]*aria-current="page"/);
    expect(switcher).not.toContain('astro-island');
  });
});
