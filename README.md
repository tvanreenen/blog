# Minimal Eleventy Blog Template

A minimal, opinionated template for creating a blog with [Eleventy](https://www.11ty.dev/) and deploying to GitHub Pages.

## Features

- 🚀 Simple setup with minimal dependencies
- 📝 Markdown-based blog posts
- 🎨 Clean, readable typography and layout
- 📱 Responsive design
- 🌓 Automatic light/dark mode support with [Simple.css](https://simplecss.org)
- 🔄 Automatic GitHub Pages deployment

## Getting Started

1. Click "Use this template" to create a new repository
2. Clone your new repository
3. Create your first post in `posts/post-title/index.md`
4. Test locally with `npx @11ty/eleventy --serve`
5. Push to GitHub - your site will be automatically built and deployed

## Project Structure

```
.
├── _includes/         # Layout templates
├── posts/            # Blog posts (post-title/index.md)
├── .eleventy.js      # Eleventy configuration
├── .github/          # GitHub Actions workflow
└── index.html        # Homepage
```

## Writing Posts

Create a new post by adding a markdown file at `posts/post-title/index.md`:

```markdown
---
title: "My First Post"
date: 2024-01-01
---

Your post content here...
```

## Customization

- Customerize the site structure by modifying `_includes/layout.html`.
- Customize Simple.css by adding your own CSS rules in the separate stylesheet. See the [Simple.css customization guide](https://github.com/kevquirk/simple.css/wiki/Getting-Started-With-Simple.css#customise-simplecss) for more details.
- Explore Eleventy's many other customization options in their [official documentation](https://www.11ty.dev/docs/)

## Deployment

The site is automatically built and deployed to GitHub Pages when you push to the `main` branch.

## Credits

- [Eleventy](https://www.11ty.dev/) - Static site generator
- [Simple.css](https://simplecss.org) - Minimal CSS framework
- [GitHub Pages](https://pages.github.com/) - Hosting

---

For a more feature-rich Eleventy blog template, check out [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog).