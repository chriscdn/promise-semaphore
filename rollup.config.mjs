import pkg from './package.json' assert { type: 'json' }
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const input = 'src/index.ts'

export default [
  {
    input,
    plugins: [esbuild()],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        // sourcemap: true,
        // exports: 'default',
      },
    ],
  },
  {
    input,
    plugins: [esbuild()],
    output: [
      {
        file: pkg.module,
        format: 'es',
        // sourcemap: true,
        // exports: 'default',
      },
    ],
  },
  {
    input,
    plugins: [dts()],
    output: {
      file: 'lib/index.d.ts',
      format: 'es',
    },
  },
]
