import '../styles/main.scss'

import initRouter from './router'
import routes from './routes'

initRouter({routes}).then(() => {
  // Avoid FOUC
  document.querySelector('main').style.opacity = 1
})

const activeLinkClass = 'nav__list-link--active'
addEventListener('viewmount', () => {
  const $activeLink = document.querySelector('.' + activeLinkClass)

  if ($activeLink)
    $activeLink.classList.remove(activeLinkClass)

  const $curLink = [...document.querySelectorAll(`.nav__list-link`)]
    .find($a => location.pathname.startsWith($a.getAttribute('href')))

  if ($curLink)
    $curLink.classList.add(activeLinkClass)
})

if (process.env.NODE_ENV === 'production') {
  /*
    Since we build two production bundles (legacy and modern) we can't just register
    one service worker for all assets, nor can we register a service worker
    that serves only modern assets, because there are browsers that don't support
    <script type=module> but do support service workers (e.g. Samsung Internet).

    Here is a little trick that allows browsers to cache only 'their' assets,
    i.e. browsers that don't support <script type=module> but support service workers
     will cache only legacy assets, and modern browsers will cache only the modern ones.
  */
  window.registerSW = url => {
    if ('serviceWorker' in navigator) {
      // Delay SW registration until 'load' event for performance reasons
      // https://developers.google.com/web/fundamentals/primers/service-workers/registration
      addEventListener('load', e => {
        navigator.serviceWorker.register(url).then(reg => {
          console.log('sw has been registered')
        }).catch(err => {
          console.error('Error during sw registration', err)
        })
      })
    }
  }
  const appendScript = ([attr, val, prefix = '']) => {
    const $script = document.createElement('script')
    $script.setAttribute(attr, val)
    $script.text = `registerSW('/${prefix}sw.js');delete window.registerSW`
    document.body.appendChild($script)
  }
  [['type', 'module'], ['nomodule', '', 'legacy-']].forEach(appendScript)
} else require('../index.pug')
