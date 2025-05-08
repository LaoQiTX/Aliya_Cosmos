const { defineConfig } = require("vite");
const { viteObfuscateFile } = require("vite-plugin-obfuscator");

module.exports = defineConfig({
  base: "./",
  build: {
    minify: "terser",
    outDir: "dist/obfuscated",
  },
  // publicDir:'res',
  plugins: [
    viteObfuscateFile({
      compact: true,
      controlFlowFlattening: true,
      deadCodeInjection: true,
      stringArray: true,
      stringArrayThreshold: 0.75,
      // debugProtection: true,
      // debugProtectionInterval: 4000,
    }),
  ],
  server:{
    host:'localhost',
    port:3000,
    open:false
  }
});
