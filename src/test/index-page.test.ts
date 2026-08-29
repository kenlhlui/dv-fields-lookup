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

async function renderIndex() {
  const { default: IndexPage } = await import('@/pages/index.astro');
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  return container.renderToString(IndexPage, {
    partial: false,
    request: new Request('https://kenlhlui.github.io/dv-fields-lookup/'),
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
        title: 'Metadata Field Lookup',
        description: 'Search and explore metadata fields.',
        dataverseName: '',
        dataverseURL: '',
        githubUrl: 'https://github.com/kenlhlui/dv-fields-lookup',
        footerText: 'Made with love.',
      },
    }));
    const html = await renderIndex();
    expect(html).toContain('https://dataverse.org/');
    expect(html).toContain('The Dataverse Project');
    expect(html).not.toContain('borealisdata.ca');
  });
});
