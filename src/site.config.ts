// Locale-independent configuration for this installation. All user-facing *text* — including
// the site title, description and footer — lives in src/i18n/ui.ts so it can be translated.

interface SiteConfig {
  dataverseName?: string;
  dataverseURL: string;
  githubUrl: string;
  collectionId?: string;
}

export const site: SiteConfig = {
  dataverseName: 'Borealis',
  dataverseURL: 'https://borealisdata.ca/',
  githubUrl: 'https://github.com/kenlhlui/dv-fields-lookup',
};
