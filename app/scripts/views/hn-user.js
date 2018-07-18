import GenericView from '../mixins/generic-view'
import { userFetcher } from '../api'

const $template = document.createElement('template')
$template.innerHTML =
`<style>
  :host {
    width: max-content;
    width: -moz-max-content;
    display: block;
  }
</style>
<h1>User: <span class="id"></span></h1>
<span>Created: <span class="created"></span></span>
<span>Karma: <span class="karma"></span></span>
<p class="about"></p>
<p class="links">
  <a target="_blank" rel="noopener noreferer">submissions</a> |
  <a target="_blank" rel="noopener noreferer">comments</a>
</p>`

const name = 'hn-user'

class UserView extends GenericView($template, name) {
  connectedCallback () {
    document.title = this.titlePrefix + ' | ' + this.userId
    this.fetchData(userFetcher(this.userId))
  }

  set $$routeParams ({ id }) {
    this.userId = id
  }

  handleFetchSuccess ({ about, ...rest }) {
    const shadow = this.shadowRoot

    const $about = shadow.querySelector('.about')
    if (!about) $about.remove()
    else $about.innerHTML = about

    Object.keys(rest).forEach(key => {
      const content = rest[key]
      const $el = shadow.querySelector('.' + key)

      if ($el) $el.innerText = content
    })

    const links = shadow.querySelector('.links').children;
    ['submitted', 'threads'].forEach((type, i) => {
      links[i].href = `https://news.ycombinator.com/${type}?id=${rest.id}`
    })
  }
}

customElements.define(name, UserView)

export default () => document.createElement(name)
