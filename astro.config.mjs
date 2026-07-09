// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { rehypeBaseLinks } from './plugins/rehype-base-links.mjs';

// For GitHub Pages project sites the site is the org page and base is the repo name.
// If a custom domain (e.g. modding.doodesch.de) is added later, set BASE to '/'.
const BASE = '/ScheduleOne-Cookbook';

export default defineConfig({
  site: 'https://doodesch-mods.github.io',
  base: BASE,
  markdown: {
    rehypePlugins: [[rehypeBaseLinks, { base: BASE }]],
  },
  integrations: [
    starlight({
      title: 'Schedule I Modding Cookbook',
      description:
        'A community knowledge base for modding Schedule I - snippets, networking, IL2CPP, tooling and best practices, curated from the Unofficial Schedule One Modding Server.',
      tagline: 'The community handbook for building Schedule I mods.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/DooDesch-Mods/ScheduleOne-Cookbook',
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/DooDesch-Mods/ScheduleOne-Cookbook/edit/main/',
      },
      lastUpdated: true,
      sidebar: [
        { label: 'Introduction', link: '/' },
        {
          label: 'Getting Started',
          items: [{ autogenerate: { directory: 'getting-started' } }],
        },
        {
          label: 'Frameworks & Libraries',
          items: [{ autogenerate: { directory: 'frameworks' } }],
        },
        {
          label: 'Best Practices',
          items: [{ autogenerate: { directory: 'best-practices' } }],
        },
        {
          label: 'Core Concepts & Game Internals',
          items: [{ autogenerate: { directory: 'core-concepts' } }],
        },
        {
          label: 'Networking (FishNet)',
          items: [{ autogenerate: { directory: 'networking' } }],
        },
        {
          label: 'IL2CPP Specifics',
          items: [{ autogenerate: { directory: 'il2cpp' } }],
        },
        {
          label: 'Unity & AssetBundles',
          items: [{ autogenerate: { directory: 'unity-assetbundles' } }],
        },
        {
          label: 'Code Snippets',
          items: [{ autogenerate: { directory: 'snippets' } }],
        },
        {
          label: 'Tooling & Resources',
          items: [{ autogenerate: { directory: 'tooling' } }],
        },
        {
          label: 'Publishing',
          items: [{ autogenerate: { directory: 'publishing' } }],
        },
        { label: 'Contributors', link: '/contributors' },
      ],

    }),
  ],
});
