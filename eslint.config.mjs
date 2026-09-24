import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

// eslint-config-next 15.x est publié au format eslintrc : FlatCompat le
// convertit pour ESLint 9 (flat config).
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintConfigPrettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "db/**"]),
]);

export default eslintConfig;
