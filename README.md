# Ootes.io Portfolio Website

This repository contains the source code for **[ootes.io](https://ootes.io)** – the personal portfolio website of **Tom Ootes**. The site is built with **Jekyll** for static site generation, **SCSS** for styling, and **Vite** for JavaScript bundling.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Setup & Development](#setup--development)
5. [Building CSS](#building-css)
6. [Running the Site Locally](#running-the-site-locally)
7. [Adding Blog Posts](#adding-blog-posts)
8. [Project Structure](#project-structure)
9. [Contributing](#contributing)
10. [License](#license)

---

## Features

- **Portfolio & Projects** – Showcase of personal projects with detailed case studies.
- **Blog** – Articles written in Markdown, rendered by Jekyll.
- **Tagging System** – (Planned) Ability to add tags such as `plants` and `ecology` to blog posts for better navigation.
- **Responsive Design** – Tailored for desktop and mobile using custom SCSS utilities.
- **Live Reload** – Development server with automatic rebuilding of assets.

---

## Tech Stack

- **Jekyll** – Static site generator (`bundle exec jekyll serve`).
- **SCSS** – Stylesheets compiled via PostCSS.
- **PostCSS** – Handles autoprefixing and CSS processing.
- **Vite** – Bundles JavaScript assets (`vite`).
- **Yarn** – Package manager for Node dependencies.

---

## Prerequisites

- **Ruby** (>= 2.7) with Bundler (`gem install bundler`).
- **Node.js** (>= 18) and **Yarn** (`npm install -g yarn`).
- **pnpm** (optional, used in original docs for CSS watch).

---

## Setup & Development

```bash
# Clone the repository
git clone https://github.com/yourusername/ootes-io.git
cd ootes-io

# Install Ruby dependencies
bundle install

# Install Node dependencies
yarn install
```

---

## Building CSS

The project uses **PostCSS** to compile `assets/css/main.css` into `assets/css/output.css`.

```bash
# One‑time build
yarn build:css

# Watch for changes (recommended during development)
# If you prefer pnpm, you can also run:
# pnpm watch:css
yarn watch:css
```

---

## Running the Site Locally

```bash
# Start the Jekyll development server
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`. The server watches for changes in content, layout, and SCSS (when the CSS watch command is running).

---

## Adding Blog Posts

Blog posts are stored in the `_posts` directory and must follow Jekyll’s naming convention:

```
YYYY-MM-DD-title.md
```

Each post should include front‑matter, for example:

```yaml
---
layout: post
title: "My New Post"

categories: [blog]
# tags: [plants, ecology]  # Planned feature
---

Your markdown content goes here.
```

---

## Project Structure

```
.
├─ _includes      # Reusable HTML snippets
├─ _layouts       # Page layouts
├─ _posts         # Blog articles (Markdown)
├─ _projects      # Project case‑studies
├─ assets
│  ├─ css         # SCSS source & compiled CSS
│  ├─ img         # Images & icons
│  └─ js          # JavaScript entry point (main.js)
├─ _scss          # Raw SCSS modules
├─ CNAME          # Custom domain configuration
├─ Gemfile        # Ruby dependencies
├─ package.json   # Node dependencies & scripts
└─ README.md      # This file
```

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my‑feature`).
3. Commit your changes and push the branch.
4. Open a Pull Request describing the changes.

---

## License

This project is licensed under the **Creative Commons Attribution 4.0 International (CC‑BY‑4.0)** license. See the `LICENSE` file for details. 

---

*Generated on $(date '+%Y-%m-%d')*
