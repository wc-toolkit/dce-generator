import { generateDeclarativeCustomElements } from "../dist/index.js";

const response = await fetch(
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/custom-elements.json"
);
const manifest = await response.json();

// Generate templates
await generateDeclarativeCustomElements(manifest, {
  outdir: "demo/default",
  fileName: "shoelace-dces",
  moduleName: "ShoelaceDeclarativeCustomElements",
  modulePathTemplate: (name, tagName) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/${tagName?.replace(
      "sl-",
      ""
    )}/${tagName?.replace("sl-", "")}.js`,
});

await generateDeclarativeCustomElements(manifest, {
  outdir: "demo/min",
  fileName: "shoelace-dces.min",
  moduleName: "ShoelaceDeclarativeCustomElementsMin",
  modulePathTemplate: (name, tagName) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/${tagName?.replace(
      "sl-",
      ""
    )}/${tagName?.replace("sl-", "")}.js`,
  minify: true,
});
