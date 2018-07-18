import './components/router-view'

// the regexp from https://github.com/pillarjs/path-to-regexp/blob/master/index.js
const pathRegexp = new RegExp('(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?', 'g')
function pathToRegexp (path) {
  const names = []
  let str = path
  let res

  while (res = pathRegexp.exec(path)) {
    const [match, name, namedGroup, group] = res

    const parenGroup = namedGroup || group

    if (parenGroup)
      str = str.replace(match, '(' + parenGroup + ')')

    if (namedGroup) names.push(name)
  }

  return {
    regexp: new RegExp(str),
    names
  }
}

function getRouteForUrl (routeMap, url) {
  for (const { regexp, names, ...rest } of routeMap) {
    const match = regexp.exec(url)

    if (match) {
      const params = {}

      names && names.length && names.forEach((name, i) => {
        params[name] = match[i + 1]
      })

      return { params, ...rest }
    }
  }

  return null
}

const createRouteMap = routes => routes.map(({ path, ...rest }) => ({
  ...pathToRegexp(path),
  ...rest
}))

// Should be called only once
export default routerConfig => {
  const routeMap = createRouteMap(routerConfig.routes)
  const $routerView = document.querySelector('router-view')
  let $currentView = null
  let currentUrl = location.pathname

  addEventListener('popstate', e => handleTransition(e))
  addEventListener('click', e => {
    const $link = e.composedPath().find($el =>
      $el.tagName === 'A' && $el.getAttribute('href')[0] === '/'
    )

    if (!$link) return

    e.preventDefault()

    handleTransition(e, $link.getAttribute('href'))
  })

  renderView(resolveUrl(currentUrl))

  // Return a Promise that resolves when 'router-view' is connected.
  // We return it after whenDefined is called, otherwise it doesn't work in Firefox
  return customElements.whenDefined('router-view').then(() => $routerView.ready)

  function resolveUrl (url) {
    const route = getRouteForUrl(routeMap, url)

    if (!route)
      throw new Error("Couldn't find a route for " + url)

    return route
  }

  async function renderView ({ params, component, redirect: redirectUrl }) {
    if (redirectUrl) {
      currentUrl = redirectUrl
      history.replaceState(null, null, redirectUrl)
      const route = resolveUrl(redirectUrl)
      params = route.params
      component = route.component
    }

    $currentView = await component()
    $currentView.$$routeParams = params
    $routerView.setNewView($currentView)
  }

  function handleTransition ({ type }, toUrl = location.pathname) {
    if (toUrl === currentUrl) return

    // naive logic for subrouting
    const shouldChangeView = toUrl.split('/')[1] !== currentUrl.split('/')[1]
    const route = resolveUrl(toUrl)

    if (shouldChangeView) renderView(route)
    else {
      const params = { pagechange: true, ...route.params }

      // send route params to the view
      $currentView.$$routeParams = params

      if ($routerView.fallbackExists)
        $routerView.displayFallbackUntilViewReady($currentView, false)
    }

    if (type !== 'popstate')
      history.pushState(null, null, toUrl)

    currentUrl = toUrl
  }
}
