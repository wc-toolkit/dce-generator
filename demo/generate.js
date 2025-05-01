import { generateDeclarativeCustomElements } from "../dist/index.js";

const response = await fetch(
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/custom-elements.json"
);
const manifest = await response.json();
const outputPath = "output.min.html";

// Generate templates
await generateDeclarativeCustomElements(manifest, {
  outdir: "demo",
  fileName: 'output.html',
  modulePathTemplate: (name, tagName) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/${tagName?.replace(
      "sl-",
      ""
    )}/${tagName?.replace("sl-", "")}.js`,
});

await generateDeclarativeCustomElements(manifest, {
  outdir: "demo",
  fileName: 'output.min.html',
  modulePathTemplate: (name, tagName) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/${tagName?.replace(
      "sl-",
      ""
    )}/${tagName?.replace("sl-", "")}.js`,
    minify: true,
});
// await generateDeclarativeCustomElements(manifest, "output.min.html", true);
