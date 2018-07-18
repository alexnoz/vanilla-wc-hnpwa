const getListView = props => () =>
  import(/* webpackChunkName: 'list-view' */ './views/hn-list')
    .then(m => m.default(props))

const commonProps = { itemsPerPage: 30 }
const listViewsProps = {
  // Number of pages is set by the api
  // https://github.com/tastejs/hacker-news-pwas/blob/master/docs/api.md#paging
  '/top': { pages: 10 },
  '/new': { pages: 12 },
  '/ask': { pages: 2 },
  '/show': { pages: 2 },
  '/jobs': { pages: 1 }
}

const listViewRoutes = Object.keys(listViewsProps).map(viewPath => ({
  path: `(?:^${viewPath})(?:/:page(\\d+))?$`,
  component: getListView({
    type: viewPath.slice(1),
    ...listViewsProps[viewPath],
    ...commonProps
  })
}))

export default [
  ...listViewRoutes,
  {
    path: '^/users/:id(\\w+)$',
    component: () =>
      import(/* webpackChunkName: 'user-view' */ './views/hn-user')
        .then(m => m.default())
  },
  {
    path: '^/item/:id(\\w+)$',
    component: () =>
      import(/* webpackChunkName: 'comments-view' */ './views/hn-comments')
        .then(m => m.default())
  },
  {
    path: '/',
    redirect: '/top'
  }
]
