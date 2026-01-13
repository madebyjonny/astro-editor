/// <reference types="vite/client" />

// CSS imports
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// CSS side-effect imports (no default export needed)
declare module "*.css" {}
