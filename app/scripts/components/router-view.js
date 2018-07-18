const $template = document.createElement('template')
$template.innerHTML = `
<style>
  .fallback {
    display: flex;
    place-content: center;
    place-items: center;
    position: fixed;
    width: 100%;
    height: 100%;
  }
</style>
<div class="fallback" style="display:none"><slot></slot></div>
<slot name="views"></slot>
`
ShadyCSS.prepareTemplate($template, 'router-view')
class RouterView extends HTMLElement {
  constructor () {
    super()

    ShadyCSS.styleElement(this)
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild($template.content.cloneNode(true))

    // We put views into this 'slot' element so that
    // it's possible to style them from the outside
    this.$views = shadow.querySelector('slot[name="views"]')

    this.$fallback = shadow.querySelector('.fallback')
    this.fallbackExists = !!this.$fallback.firstElementChild.assignedNodes()[0]

    this.timer = 0

    this.resolveReady = null
    this.ready = new Promise(r => this.resolveReady = r)
  }

  connectedCallback () {
    // Start displaying fallback element after 1s
    if (!this.timeout) this.timeout = 1000
    this.resolveReady()
    delete this.resolveReady
  }

  set timeout (val) {
    this.setAttribute('timeout', val)
  }
  get timeout () {
    return +this.getAttribute('timeout')
  }

  async setNewView ($view) {
    this.dispatchEvent(new CustomEvent('viewmount', {
      bubbles: true,
      composed: true
    }))

    $view.setAttribute('slot', 'views')

    const $oldView = this.querySelector('[slot="views"]')

    if (this.fallbackExists) {
      const $staleView = this.querySelectorAll('[slot="views"]')[1]
      removeIfExist($staleView)

      await this.displayFallbackUntilViewReady($view)

      removeIfExist($oldView)
    } else
      $oldView ? this.replaceChild($view, $oldView) : this.appendChild($view)
  }

  async displayFallbackUntilViewReady ($view, viewchange = true) {
    this.hideFallbackIfDisplayed()

    if (viewchange) {
      $view.style.display = 'none'
      this.appendChild($view)
    }

    this.timer = setTimeout(() => {
      this.$fallback.style.display = ''
      this.fallbackDisplayed = true
    }, this.timeout)

    await $view.$$ready

    if (viewchange)
      $view.style.display = ''

    this.hideFallbackIfDisplayed()
  }

  hideFallbackIfDisplayed () {
    if (this.fallbackDisplayed) {
      this.$fallback.style.display = 'none'
      this.fallbackDisplayed = false
    } else
      clearTimeout(this.timer)
  }
}

customElements.define('router-view', RouterView)

function removeIfExist ($el) {
  // In Firefox, child.remove() doesn't work here for some reason
  $el && $el.parentNode && $el.parentNode.removeChild($el)
}
