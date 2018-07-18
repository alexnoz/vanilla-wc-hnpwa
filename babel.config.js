module.exports = api => ({
  plugins: [
    'transform-custom-element-classes',
    '@babel/plugin-syntax-dynamic-import'
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          esmodules: api.env() !== 'legacy'
        }
      }
    ]
  ]
})
