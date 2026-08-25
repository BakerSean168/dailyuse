import { baseLibraryConfig, createLocalOnlyDtsPaths } from '../../tools/build/tsup.base.config.ts'
const config = baseLibraryConfig('@memoflow/label')
export default { ...config, entry: ['src/index.ts'], tsconfig: 'tsconfig.build.json', dts: createLocalOnlyDtsPaths() }
