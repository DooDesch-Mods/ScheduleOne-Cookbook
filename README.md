# Schedule I Modding Cookbook

The community handbook for building [Schedule I](https://store.steampowered.com/app/3164500/Schedule_I/) mods - reusable code snippets, networking recipes, IL2CPP tricks, Unity/AssetBundle workflows, tooling and best practices, curated from the **Unofficial Schedule One Modding Server**.

> 🛟 **Need help or found a bug?** Get support at [support.doodesch.de](https://support.doodesch.de).

## What this is

A searchable, categorized knowledge base that collects modding know-how which was previously only findable by scrolling Discord. Every piece is credited to its original author with a link back to the source message. Built with [Astro Starlight](https://starlight.astro.build/) and deployed to GitHub Pages.

- **Read it:** https://doodesch-mods.github.io/ScheduleOne-Cookbook
- **Contributors & credits:** see the [Contributors](https://doodesch-mods.github.io/ScheduleOne-Cookbook/contributors/) page.

## Local development

```bash
npm install
npm run dev      # local preview at http://localhost:4321/ScheduleOne-Cookbook
npm run build    # production build into ./dist (fails on broken internal links)
```

Pages live under `src/content/docs/`, organized by the sidebar categories in `astro.config.mjs`.

## Contributing

Found something to add, fix or correct? Open an issue or PR. If you authored a snippet republished here and want the credit adjusted or the content removed, contact [support.doodesch.de](https://support.doodesch.de) and we will sort it out.

## Credits & license

Knowledge here comes from the members of the Unofficial Schedule One Modding Server - thank you. Documentation prose and structure is licensed under [CC BY 4.0](./LICENSE). Code snippets remain under their original authors' terms; they are reproduced here with attribution, not relicensed. See [LICENSE](./LICENSE) for details.
