import { viteBundler } from '@vuepress/bundler-vite'
import { themeDefault } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  // Served from the domain root on Cloudflare Pages (https://vue-ez-form.pages.dev).
  // Switch to '/vue-ez-form/' if moving back to GitHub Pages.
  base: '/',
  lang: 'en-US',
  title: 'EzForm',
  description:
    'A validator-agnostic, component-agnostic Vue 3 form engine. Bring your own inputs, bring your own validation library.',

  bundler: viteBundler(),
  theme: themeDefault({
    logo: '/logo.svg',
    repo: 'jamesallan93/vue-ez-form',
    docsDir: 'docs',
    navbar: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/guide/examples.md' },
    ],
    // Nested groups use `items`, not `children`. Verified against the installed
    // package's own SidebarItem type (node_modules/@vuepress/theme-default/dist/node/index.d.ts).
    // `children` is silently ignored, which is why these groups rendered with no links at all.
    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/guide/README.md' },
          { text: 'Getting Started', link: '/guide/getting-started.md' },
        ],
      },
      {
        text: 'Core concepts',
        collapsed: false,
        items: [
          { text: 'The schema shape', link: '/guide/schema.md' },
          { text: 'Bring your own validation', link: '/guide/validation.md' },
          { text: 'Bring your own components', link: '/guide/components.md' },
          { text: 'Global config', link: '/guide/global-config.md' },
          { text: 'Layout (columns)', link: '/guide/layout.md' },
        ],
      },
      {
        text: 'Features',
        collapsed: false,
        items: [
          { text: 'Groups & arrays', link: '/guide/groups-and-arrays.md' },
          { text: 'Default values', link: '/guide/default-values.md' },
          { text: 'Slots', link: '/guide/slots.md' },
          { text: 'The Form API', link: '/guide/form-api.md' },
        ],
      },
      {
        text: 'More',
        collapsed: false,
        items: [{ text: 'Examples', link: '/guide/examples.md' }],
      },
    ],
  }),
})
