// @ts-check
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  external: ['chai'], // Object.keys(pkg.dependencies),
  output: [
    {
      file: `dist/esm/index.js`,
      format: 'es',
      sourcemap: true,
    },
    {
      file: `dist/cjs/index.js`,
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({ tsconfig: 'tsconfig.json' }),
    terser({
      module: true,
      compress: {
        ecma: 2015,
        pure_getters: true
      }
    }),
  ]
};
