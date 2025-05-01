import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { setTimeout } from "node:timers/promises";
import { getAllComponents } from "@wc-toolkit/cem-utilities";

export type DceGeneratorConfig = {
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
   * Custom wrapper templates for the generated file
   */
  customWrapperTemplates?: WrapperTemplate[];
  /**
   * Timeout for rendering components in the headless browser
   * @default 1000
   */
  loadTimeout?: number;
};

export type WrapperTemplate = {
  fileName?: string;
  template?: (contents: string) => string;
};

const defaultConfig: DceGeneratorConfig = {
  outdir: "./",
  fileName: "declarative-custom-elements.html",
  minify: false,
  moduleName: "DeclarativeCustomElements",
  loadTimeout: 1000,
};

/**
 * Extract shadow DOM content from web components and generate templates
 * @param {string} manifest - Path to the custom elements manifest
 * @param {string} outputPath - Path to the output file
 * @param {boolean} minify - Minify output HTML and CSS
 */
async function generateDeclarativeCustomElements(
  manifest: unknown,
  config: DceGeneratorConfig
) {
  try {
    config = { ...defaultConfig, ...config };
    console.log(`Loading manifest`);

    // Extract all custom elements from the manifest
    const customElements = getAllComponents(manifest);

    console.log(
      `Found ${customElements.length} custom elements in the manifest`
    );

    // Create a temporary HTML file to load the components
    const tempHtmlPath = path.join(process.cwd(), "temp-components.html");

    // Create HTML with all components
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        ${config.globalModuleTemplate ? `<script type="module" src="${config.globalModuleTemplate}" />` : ""}
        ${
          config.modulePathTemplate
            ? customElements
                .map(
                  (component) =>
                    `<script type="module" src="${config.modulePathTemplate!(component.name, component.tagName)}"></script>`
                )
                .join("\n")
            : ""
        }
      </head>
      <body>
        ${customElements.map((component) => `<${component.tagName}></${component.tagName}>`).join("\n")}
      </body>
      </html>
    `;

    await fs.writeFile(tempHtmlPath, htmlContent);
    console.log("Created temporary HTML file with all components");

    // Launch puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the temporary HTML file
    await page.goto(`file://${tempHtmlPath}`);
    console.log("Loaded components in headless browser");

    // Give components time to render
    await setTimeout(config.loadTimeout || 1000);

    // Extract shadow DOM content for each component - use Promise.all for parallel processing
    const templates = await page.evaluate((elements) => {
      // Compile regex once for better performance
      const emptyPropsRegex = /([^{};:]+):\s*;/g;

      return elements.map((component) => {
        const element = document.querySelector(component.tagName || "");
        if (!element || !element.shadowRoot) {
          return { tagName: component.tagName, html: "" };
        }

        // Get shadow root HTML content
        const content = element.shadowRoot.innerHTML;
        const css = element.shadowRoot.adoptedStyleSheets?.map((sheet) => {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText.replace(emptyPropsRegex, ""))
            .join("\n");
        });
        const cssText = css ? css.join("\n") : "";
        const html = `<style>\n${cssText}\n</style>\n${content}`;

        return { tagName: component.tagName, html };
      });
    }, customElements);

    await browser.close();
    console.log("Extracted shadow DOM content");

    // Generate output file with templates
    let outputContent = "<!-- Generated Component Templates -->\n\n";

    templates.forEach((template) => {
      outputContent += `<definition name="${template.tagName}">\n`;
      outputContent += `  <template id="${template.tagName}">\n`;
      outputContent += `    ${template.html}\n`;
      outputContent += `  </template>\n`;
      outputContent += `</definition>\n\n`;
    });

    const outputPath = path.join(
      config.outdir || process.cwd(),
      config.fileName || "declarative-custom-elements.html"
    );

    // Create output directory if it doesn't exist
    createOutDir(config.outdir || process.cwd());
    console.log(`Creating output directory: ${config.outdir || process.cwd()}`);

    await fs.writeFile(
      outputPath,
      config.minify ? minifyHTML(outputContent) : cleanUp(outputContent)
    );
    console.log(`Generated templates file at ${outputPath}`);

    // Clean up temporary file
    await fs.unlink(tempHtmlPath);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

function minifyHTML(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove CSS comments
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/:\s+/g, ":") // Remove space after colons in CSS
    .replace(/;\s+/g, ";") // Remove space after semicolons in CSS
    .replace(/{\s+/g, "{") // Remove space after opening braces
    .replace(/\s+}/g, "}") // Remove space before closing braces
    .replace(/;\}/g, "}") // Remove unnecessary semicolons before closing braces
    .replace(/\s+>/g, ">") // Remove space before closing tags
    .replace(/>\s+</g, "><") // Remove space between tags
    .trim();
}

function cleanUp(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove CSS comments
    .trim();
}

function createOutDir(outDir: string) {
  if (outDir !== "./" && !fsSync.existsSync(outDir)) {
    fsSync.mkdirSync(outDir, { recursive: true });
  }
}

export { generateDeclarativeCustomElements };
