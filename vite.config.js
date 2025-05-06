const { defineConfig } = require("vite");
const { viteObfuscateFile } = require("vite-plugin-obfuscator");

module.exports = defineConfig({
  build: {
    minify: 'terser',
    outDir: 'dist/obfuscated'
  },
  plugins: [
    viteObfuscateFile({
      compact: true,
      controlFlowFlattening: true,
      deadCodeInjection: true,
      stringArray: true,
      stringArrayThreshold: 0.75,
      debugProtection: true,
      debugProtectionInterval: 4000,
    }),
  ],
});
