/* eslint-disable indent */
import GenericView from '../mixins/generic-view'
import { commentsFetcher } from '../api'

const $template = document.createElement('template')
$template.innerHTML =
`<style>
  :host {
    display: block;
    word-break: break-word;
  }
  h1 {
    font-size: 1.25rem;
    margin-bottom: 0;
  }
  ul {
    list-style: none;
    padding-left: 1em;
  }
  li:not(:first-child) {
    margin-top: 1rem;
    border-top: 1px solid #bfbfbf;
  }
  .top-wrap {
    padding: 1em;
  }
  .top-wrap > ul {
    padding-left: 0;
  }
  pre {
    white-space: pre-wrap;
  }
  .meta {
    color: grey;
  }
  summary {
    position: relative;
  }
  .replies {
    padding: 0 1em 0 .5em;
    background-color: white;
  }
  summary::after {
    content: '';
    position: absolute;
    height: 1px;
    top: 50%;
    right: 0;
    width: 95%;
    z-index: -1;
    background-color: #bfbfbf;
  }
</style>
<div class="top-wrap">
  <div>
    <h1><a class="title" rel="noopener noreferer" target="_blank"></a></h1>
    <span class="host"></span>
  </div>
  <p class="meta">
    <span class="points"></span> points | by <a class="user"></a> <span class="time"></span>
  </p>
  <span class="comments-count"></span>
</div>`

const camelToKebab = str => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

const name = 'hn-comments'

class HNComments extends GenericView($template, name) {
  connectedCallback () {
    document.title = this.titlePrefix
    this.fetchData(commentsFetcher(this.id))
  }

  set $$routeParams ({ id }) {
    this.id = id
  }

  handleFetchSuccess ({
    comments_count: commentsCount,
    time_ago: time,
    domain: host,
    comments,
    points,
    title,
    user,
    url
  }) {
    document.title = this.titlePrefix + ' | ' + title
    host = host && `(${host})`
    commentsCount = `${commentsCount || 'No'} comment${commentsCount === 1 ? '' : 's'}`

    const shadow = this.shadowRoot
    const commentMeta = { title, points, user, host, time, commentsCount }

    Object.keys(commentMeta).forEach(key => {
      const content = commentMeta[key]

      if (!content) return

      shadow.querySelector('.' + camelToKebab(key)).innerText = content
    })

    shadow.querySelector('.title').href = url
    shadow.querySelector('.user').href = '/users/' + user

    if (comments && comments.length)
      shadow.querySelector('.top-wrap')
        .insertAdjacentHTML('beforeend', commentsHtml(comments, true))
  }
}

function commentsHtml (comments, topLevel = false) {
  const html = comments.reduce((str, comment) => (
    str + commentTemplate(comment)
  ), '<ul>') + '</ul>'

  const { length } = comments

  return topLevel
    ? html
    : `<details open><summary><span class="replies">${length} ${
      length === 1 ? 'reply' : 'replies'
    }</span></summary>${html}</details>`
}

const commentTemplate = ({
  user,
  content,
  comments,
  time_ago: time
}) => (
  `<li class="comment">
    <p class="meta">
      by <a href="/users/${user}">${user}</a>
      <span class="time">${time}</span>
    </p>
    <div class="content">${content}</div>
    ${
      comments && comments.length
        ? commentsHtml(comments)
        : ''
    }
  </li>`
)

customElements.define(name, HNComments)

export default () => document.createElement(name)
