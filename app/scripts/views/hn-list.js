/* eslint-disable indent, new-parens */
import '../components/hn-pager'

import GenericView from '../mixins/generic-view'
import { pageFetcher } from '../api'

const $template = document.createElement('template')
$template.innerHTML =
`<style>
  * {
    box-sizing: border-box;
  }
  :host {
    display: block;
    padding-top: 3em;
  }
  #pager {
    text-align: center;
  }
  .story {
    display: flex;
    justify-content: start;
    margin-bottom: 1.5em;
    padding: 0 0.5em;
  }
  .stat {
    width: 10%;
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: space-evenly;
  }
  .rank {
    line-height: 1;
    font-size: 1.5em;
  }
  .points {
    font-size: .75em;
    white-space: nowrap;
  }
  .info {
    margin-left: 2em;
    flex: 1;
  }
  ul {
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    list-style: none;
  }
  .title {
    margin-top: 0;
  }
  .host, .meta {
    color: grey;
  }
  hn-pager {
    width: 100%;
    left: 0;
    top: var(--pad-top);
  }
</style>
<hn-pager></hn-pager>
<ul id="list"></ul>`

// TODO: refactor it into a separate component
const hnStoryTemplate = ({
  comments_count: commentsCount,
  time_ago: time,
  domain: host,
  points,
  title,
  type,
  rank,
  user,
  url,
  id
}) => (
`<li class="story">
  <div class="stat">
    <span class="rank">${rank}</span>
    <span class="points">☆ ${points || 0}</span>
  </div>
  <div class="info">
    <p class="title">
      <a class="link" href="${normalizeItemUrl(url)}" rel="noopener noreferer" target="_blank">
        ${title}
      </a>
      ${host ? `<span class="host">(${host})</span>` : ''}
    </p>
    <span class="meta">
      ${user ? `by <a href="/users/${user}">${user}</a>` : ''}
      <span class="time">${time}</span>
      ${
        type !== 'job'
          ? (
            `| <a href="/item/${id}">${
              commentsCount
                ? `${commentsCount} comment${commentsCount === 1 ? '' : 's'}`
                : 'discuss'
            }</a>`
          )
          : ''
        }
    </span>
  </div>
</li>`
)

const name = 'hn-list'

class HNList extends GenericView($template, name) {
  static get observedAttributes () { return ['page', 'pages', 'type'] }

  attributeChangedCallback (name, oldVal, newVal) {
    if (this.errored) return

    switch (name) {
      case 'page':
      case 'pages':
      case 'type':
        this.shadowRoot.querySelector('hn-pager').setAttribute(name, newVal)
    }
  }

  connectedCallback () {
    const { type } = this
    document.title = this.titlePrefix + ' | ' + type[0].toUpperCase() + type.slice(1)
    this.fetchData(pageFetcher(this.type, this.page))
  }

  set type (val) {
    if (this.getAttribute('type') !== val)
      this.setAttribute('type', val)
  }
  get type () {
    return this.getAttribute('type')
  }

  set page (val) {
    if (this.page !== val)
      this.setAttribute('page', val)
  }
  get page () {
    return +this.getAttribute('page')
  }

  get itemsPerPage () {
    return +this.getAttribute('itemsperpage')
  }

  // Use setter as a trigger for data fetching
  set $$routeParams ({ page, pagechange }) {
    this.page = page ? +page : 1

    if (this.isConnected)
      this.fetchData(pageFetcher(this.type, this.page), pagechange)
  }

  handleFetchSuccess (stories) {
    const { page, itemsPerPage } = this

    const html = stories.map((story, i) =>
      hnStoryTemplate({
        ...story,
        rank: i + 1 + itemsPerPage * (page - 1)
      })
    ).join('')

    this.shadowRoot.querySelector('#list').innerHTML = html
  }
}

customElements.define(name, HNList)

export default props => {
  const $hnList = document.createElement(name)
  // pass initial data to the component
  assignProps($hnList, props)
  return $hnList
}

function normalizeItemUrl (url) {
  const match = url.match(/^item\?id=(\d+)$/)

  return match ? `/item/${match[1]}` : url
}

function assignProps ($el, props) {
  for (const key of Object.keys(props))
    $el.setAttribute(key, props[key])
}
