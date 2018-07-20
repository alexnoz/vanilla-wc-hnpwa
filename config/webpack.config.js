const path = require('path')

const express = require('express')
const chalk = require('chalk')
const glob = require('glob')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const HtmlInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const PreloadPlugin = require('preload-webpack-plugin')
const SWPrecachePlugin = require('sw-precache-webpack-plugin')
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin')

const ModernBundlePlugin = require('./modern-bundle-plugin')
const parts = require('./webpack.parts')

const cwd = process.cwd()
const isProd = process.env.NODE_ENV === 'production'

const lintJSOptions = {
  emitWarning: true,
  failOnWarning: false,
  failOnError: isProd,
  fix: true,
  cache: true,
  quiet: isProd,

  formatter: require('eslint-friendly-formatter')
}

/*
  To move all assets to some static folder
  getPaths({ staticDir: 'some-name' })

  To rename asset build folder
  getPaths({ js: 'some-name' })

  To move assets to the root build folder
  getPaths({ css: '' })

  Defaults values:
     sourceDir - 'app',
      buildDir - 'build',
     staticDir - '',

        images - 'images',
         fonts - 'fonts',
           css - 'styles',
            js - 'scripts'
*/
const paths = getPaths()

const cssPreprocessorLoader = { loader: 'fast-sass-loader' }

let entry = `${paths.app}/scripts`

const commonConfig = merge([
  {
    context: paths.app,
    resolve: {
      unsafeCache: true,
      symlinks: false
    },
    output: {
      path: paths.build,
      publicPath: parts.publicPath
    },
    stats: {
      warningsFilter: warning => warning.includes('entrypoint size limit'),
      children: false,
      modules: false
    },
    plugins: [
      new FriendlyErrorsPlugin()
    ],
    module: {
      noParse: /\.min\.js/
    }
  },
  parts.loadPug(),
  parts.lintJS({ include: paths.app, options: lintJSOptions })
])

const developmentConfig = merge([
  {
    entry,
    mode: 'development',
    plugins: [
      new HtmlPlugin({template: './index.pug'})
    ]
  },
  parts.devServer({
    host: process.env.HOST,
    port: process.env.PORT,
    before (app) {
      app.use('/public', express.static(path.join(cwd, 'public')))
      app.use(require('./noop-sw-middleware')())
    }
  }),
  parts.loadCSS({ include: paths.app, use: [cssPreprocessorLoader] }),
  parts.loadJS({
    include: paths.app,
    options: {
      babelrc: false
    }
  })
])

if (isProd)
  console.log(
    chalk`\n\n{cyan Start building {bold ${
      process.env.BUNDLE || 'legacy'
    }} bundle...}\n\n`
  )

module.exports = merge(commonConfig, isProd ? getProdConfig() : developmentConfig)

function getProdConfig () {
  const isLegacy = process.env.BUNDLE !== 'modern'
  const prefix = isLegacy ? 'legacy-' : ''
  const outputFilename = `${paths.js}/${prefix}[name].[chunkhash:8].js`
  const plugins = [
    // Don't emit styles and runtime because we inline them
    new IgnoreEmitPlugin([/\.css$/, /runtime/]),
    new webpack.HashedModuleIdsPlugin(),
    new SWPrecachePlugin({
      // By default, a cache-busting query parameter is appended to requests
      // used to populate the caches, to ensure the responses are fresh.
      // If a URL is already hashed by Webpack, then there is no concern
      // about it being stale, and the cache-busting can be skipped.
      dontCacheBustUrlsMatching: /\.\w{8}\./,
      filename: prefix + 'sw.js',
      minify: true,
      logger (message) {
        // This message occurs for every build and is a bit too noisy.
        if (message.indexOf('Total precache size is') === 0) return

        // This message obscures real errors so we ignore it.
        // https://github.com/facebook/create-react-app/issues/2612
        if (message.indexOf('Skipping static resource') === 0) return

        console.log(message)
      },
      runtimeCaching: [{
        urlPattern: /\.json$/,
        handler: 'networkFirst'
      }, {
        urlPattern: /^https:\/\/unpkg\.com\//,
        handler: 'cacheFirst'
      }],

      staticFileGlobsIgnorePatterns: [/\.map$/],

      // `navigateFallback` and `navigateFallbackWhitelist` are disabled by default; see
      // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#service-worker-considerations
      navigateFallback: '/index.html'
    })
  ]
  const htmlPlugins = [new HtmlInlineSourcePlugin()]
  const htmlPluginOptions = {
    template: './index.pug',
    /*
      We inline both runtime entries (legacy and modern), because:
      * It saves an http request (Webpack runtime's hash changes with every build)
      * Despite that we ship some extra bytes (i.e. legacy browsers
      download (but not run) modern runtime as well (same with modern browsers)),
      it notably improves performance metrics (Lighthouse).
    */
    inlineSource: '(runtime)|(\\.css$)'
  }
  const cssLoaders = [cssPreprocessorLoader]
  const cssParts = []

  if (isLegacy) {
    process.env.BABEL_ENV = 'legacy'
    entry = ['@babel/polyfill', entry]
    plugins.push(new CleanPlugin(paths.build, { root: cwd }))
    htmlPlugins.push(new ModernBundlePlugin(paths.build, false))
  } else {
    cssLoaders.unshift(parts.autoprefix())
    htmlPlugins.push(
      new PreloadPlugin({
        rel: 'preload',
        include: 'initial',

        // Blacklist css and runtime chunks because we inline them
        fileBlacklist: [/\.css$/, /runtime/]
      }),
      new PreloadPlugin({
        rel: 'prefetch',
        include: 'asyncChunks'
      }),
      new ModernBundlePlugin(paths.build, true)
    )

    htmlPluginOptions.minify = {
      removeScriptTypeAttributes: true,
      removeRedundantAttributes: true,
      removeComments: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      minifyCSS: true,
      minifyJS: true
    }

    cssParts.push(
      parts.purifyCSS({
        paths: glob.sync(`${paths.app}/**/*.+(pug|js)`, { nodir: true }),
        styleExtensions: ['.css', '.scss']
      }),
      parts.minifyCSS({
        options: {
          discardComments: {
            removeAll: true
          },

          // Run cssnano in safe mode to avoid
          // potentially unsafe transformations.
          safe: true
        }
      })
    )
  }

  htmlPlugins.unshift(new HtmlPlugin(htmlPluginOptions))

  cssParts.unshift(
    parts.extractCSS({
      include: paths.app,
      use: cssLoaders,
      options: {
        filename: `${paths.css}/[name].[contenthash:8].css`,
        chunkFilename: `${paths.css}/[id].[contenthash:8].css`
      }
    })
  )

  return merge([
    {
      entry,
      mode: 'production',
      optimization: {
        splitChunks: {
          chunks: 'all'
        },
        runtimeChunk: 'single'
      },
      output: {
        chunkFilename: outputFilename,
        filename: outputFilename
      },
      performance: {
        hints: 'warning', // 'error', false
        maxEntrypointSize: 100000,
        maxAssetSize: 450000
      },
      plugins: [
        ...htmlPlugins,
        ...plugins
      ]
    },
    parts.minifyJS({
      uglifyOptions: {
        parse: {
          // we want uglify-js to parse ecma 8 code. However, we don't want it
          // to apply any minfication steps that turns valid ecma 5 code
          // into invalid ecma 5 code. This is why the 'compress' and 'output'
          // sections only apply transformations that are ecma 5 safe
          // https://github.com/facebook/create-react-app/pull/4234
          ecma: 8
        },
        compress: {
          ecma: 5,
          warnings: false,

          // Disabled because of an issue with Uglify breaking seemingly valid code:
          // https://github.com/facebook/create-react-app/issues/2376
          // Pending further investigation:
          // https://github.com/mishoo/UglifyJS2/issues/2011
          comparisons: false
        },
        mangle: {
          safari10: true
        },
        output: {
          ecma: 5,
          comments: false,

          // Turned on because emoji and regex is not minified properly using default
          // https://github.com/facebook/create-react-app/issues/2488
          ascii_only: true
        }
      },

      // Use multi-process parallel running to improve the build speed
      // Default number of concurrent runs: os.cpus().length - 1
      parallel: true,

      // Enable file caching
      cache: true
    }),
    parts.loadJS({
      include: paths.app,
      options: {
        cacheDirectory: true
      }
    }),
    ...cssParts
  ])
}

function getPaths ({
  sourceDir = 'app',
  buildDir = 'build',
  staticDir = '',
  js = 'scripts',
  css = 'styles'
} = {}) {
  const assets = { js, css }

  return Object.keys(assets).reduce((obj, assetName) => {
    const assetPath = assets[assetName]

    obj[assetName] = !staticDir ? assetPath : `${staticDir}/${assetPath}`

    return obj
  }, {
    app: path.join(cwd, sourceDir),
    build: path.join(cwd, buildDir),
    staticDir
  })
}
