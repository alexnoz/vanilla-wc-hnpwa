const $template = document.createElement('template')
$template.innerHTML =
`<style>
  :host {
    position: fixed;
    width: 100%;
    z-index: 2;
    text-align: center;
    background-color: white;
    padding: 1rem;
    border-top: 1px solid #e4e4e4;
    box-shadow: 0 1.1rem 2rem -1.5rem;
  }
  a {
    color: black;
  }
  a.disabled {
    text-decoration: none;
    pointer-events: none;
    color: grey;
  }
</style>
<a id="prev">
  <slot name="prev">&lt; prev</slot>
</a>
<span id="pages">1 / 1</span>
<a id="next">
  <slot name="next">next &gt;</slot>
</a>`

ShadyCSS.prepareTemplate($template, 'hn-pager')

class HNPager extends HTMLElement {
  static get observedAttributes () { return ['page', 'pages'] }

  constructor () {
    super()
    ShadyCSS.styleElement(this)

    const shadow = this.attachShadow({ mode: 'open' })

    shadow.appendChild($template.content.cloneNode(true))

    this.pagerText = shadow.querySelector('#pages').firstChild
    this.$prev = shadow.querySelector('#prev')
    this.$next = shadow.querySelector('#next')
  }

  connectedCallback () {
    if (!this.hasAttribute('page'))
      this.setAttribute('page', 1)

    if (!this.hasAttribute('pages'))
      this.setAttribute('pages', 1)
  }

  attributeChangedCallback (name, oldVal, newVal) {
    const { pages, pagerText } = this

    switch (name) {
      case 'page': {
        const { $next, $prev } = this
        const prevDisabled = $prev.classList.contains('disabled')
        const nextDisabled = $next.classList.contains('disabled')

        const type = this.getAttribute('type')
        const page = +newVal

        if (page - 1 > 0) {
          $prev.href = `/${type}/${page - 1}`

          if (prevDisabled)
            $prev.classList.remove('disabled')
        } else if (!prevDisabled)
          $prev.classList.add('disabled')

        if (page + 1 <= pages) {
          $next.href = `/${type}/${page + 1}`

          if (nextDisabled)
            $next.classList.remove('disabled')
        } else if (!nextDisabled)
          $next.classList.add('disabled')

        pagerText.data = `${newVal} / ${pages}`

        break
      }
      case 'pages':
        pagerText.data = `${this.page} / ${newVal}`
    }
  }

  get page () {
    return this.getAttribute('page')
  }

  get pages () {
    return +this.getAttribute('pages')
  }
}

customElements.define('hn-pager', HNPager)
