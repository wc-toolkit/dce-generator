# WC Toolkit - Declarative Custom Element Generator

[![NPM Version](https://img.shields.io/npm/v/dce-generator.svg)](https://www.npmjs.com/package/dce-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **NOTE** This is a proof-of-concept and is not intended for production use.

A tool for generating static HTML templates from Web Components, allowing you to use custom elements in a declarative manner without relying on JavaScript for rendering.

## Why Use DCE Generator?

Web Components are powerful, but they require JavaScript to initialize and render their shadow DOM. This tool solves several key problems:

- **Server-Side Rendering**: Pre-render web components for SSR frameworks
- **Static Site Generation**: Use web components in static site generators
- **No JavaScript Fallbacks**: Provide HTML-only fallbacks for progressive enhancement
- **Framework Integration**: Make it easier to integrate web components with frameworks that expect templates

## Installation

```bash
# Using npm
npm install dce-generator --save-dev

# Using yarn
yarn add dce-generator --dev

# Using pnpm
pnpm add -D dce-generator
```

## Usage

The DCE Generator works by using Puppeteer to render your web components in a headless browser, extract their shadow DOM content, and save it as static HTML templates.

### Basic Example

```js
import { generateDeclarativeCustomElements } from "dce-generator";
import manifest from "./path/to/custom-elements.json";

// Generate templates
await generateDeclarativeCustomElements(manifest, {
  outdir: "./output",
  fileName: "my-components.html",
  minify: true,
  moduleName: "MyComponents",
});
```

### Configuration Options

```ts
type DceGeneratorConfig = {
  /**
   * Path to the output directory
   * @default "./"
   * @example "./output"
   */
  outdir?: string;
  /**
   * Name of the output file
   * @default "declarative-custom-elements.html"
   * @example "my-custom-elements.html"
   */
  fileName?: string;
  /**
   * Minify the output HTML and CSS
   * @default false
   */
  minify?: boolean;
  /**
   * Module name for the generated file
   * @default "DeclarativeCustomElements"
   */
  moduleName: string;
  /**
   * Path to the module where the custom elements are defined
   * @example (name, tagName) => `./dist/components/${name}/${tagName}.js`
   */
  modulePathTemplate?: (name: string, tagName?: string) => string;
  /**
   * Path to the global module where all components are defined
   * @example "./dist/index.js"
   */
  globalModuleTemplate?: string;
  /**
   * Timeout for rendering components in the headless browser
   * @default 1000
   */
  loadTimeout?: number;
}
```

### Custom Module Path

If your components are in individual modules:

```js
await generateDeclarativeCustomElements(manifest, {
  modulePathTemplate: (name, tagName) =>
    `./dist/components/${name}/${tagName}.js`,
});
```

### Global Module

If all your components are in a single bundle:

```js
await generateDeclarativeCustomElements(manifest, {
  globalModuleTemplate: "./dist/all-components.js",
});
```

## Output Format

The generated HTML file contains declarative templates for each web component:

```html
<!-- Generated Component Templates -->

<definition name="my-button">
  <template id="my-button">
    <!-- CSS from shadow DOM or Adopted Stylesheets -->
    <style>
      .button {
        color: blue; /* styles from shadow DOM */
      }
    </style>
    <!-- HTML from shadow DOM -->
    <button class="button">
      <slot></slot>
    </button>
  </template>
</definition>

<!-- More component templates... -->
```

## Performance Optimization

The tool includes several optimizations:

- Removal of empty CSS properties
- Minification option to reduce file size
- Parallel processing of components
- Cleanup of comments and whitespace
