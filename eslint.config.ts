import kevinmarrecConfig from '@kevinmarrec/eslint-config'

export default [
    ...Array.from(kevinmarrecConfig),

  {
    rules: {
      'no-console': 'off',
    },
  },
]
