// @vitest-environment node

import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { loadRenderers } from 'astro:container';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

describe('index page', () => {
  it('renders the complete metadata lookup shell under the configured base path', async () => {
    vi.stubEnv('BASE_URL', '/dv-fields-lookup');
    const { default: IndexPage } = await import('@/pages/index.astro');
    const renderers = await loadRenderers([getContainerRenderer()]);
    const container = await AstroContainer.create({ renderers });
    const html = await container.renderToString(IndexPage, {
      partial: false,
      request: new Request('https://kenlhlui.github.io/dv-fields-lookup/'),
    });
    expect(html).toMatch(/<html[^>]*\blang="en"/);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(
      /<meta name="description" content="[^"]+">/,
    );
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/dv-fields-lookup/favicon.svg">');
    expect(html).toContain('Search metadata fields');
    expect(html).toContain('Citation Metadata');
  });
});
