import type { AutoImportsOptions } from 'bun-plugin-auto-imports'
import { plugin } from 'bun'
import { resolve } from '@stacksjs/path'
import { autoImports } from 'bun-plugin-auto-imports'

export function initiateImports(): void {
  const options: AutoImportsOptions = {
    dts: resolve.storagePath('@backend/types/server-auto-imports.d.ts'),
    dirs: [
      resolve.storagePath('@backend/database/src/interfaces'),
      resolve.storagePath('@backend/database/src/schema'),
    ],
    eslint: {
      enabled: true, // TODO: not needed in production envs
      filepath: resolve.storagePath('framework/server-auto-imports.json'),
    },
  }

  plugin(autoImports(options))
}