import Fetchable from './fetchable'

/*
  We need a way to define styles that are common to some components and scoped to only these components.
  The problem is that browsers that don't support ShadowDOM API require ShadyCSS for the API to work,
  but ShadyCSS doesn't support dynamically created styles
  (see https://github.com/webcomponents/shadycss#dynamically-created-styles-are-not-supported).

  This is a cumbersome workaround for the problem. For each view we merge the view's template
  and a template that contains common styles. This way the styles stay scoped and won't leak outside.
 */
const commonStyles = document.getElementById('common-view-styles').content
function mergeCommonStyles ($template, name) {
  $template.content.appendChild(commonStyles.cloneNode(true))

  ShadyCSS.prepareTemplate($template, name)
}

export default ($template, name) => {
  mergeCommonStyles($template, name)

  return class extends Fetchable {
    constructor () {
      super()

      // This slot serves as a container for the error element,
      // we insert the element into the slot so that it's possible
      // to style it from the outside
      const $slot = document.createElement('slot')
      $slot.setAttribute('name', 'error')

      const shadow = this.attachShadow({ mode: 'open' })
      shadow.appendChild($template.content.cloneNode(true))
      shadow.appendChild($slot)

      this.titlePrefix = 'HNPWA'
      this.errored = false

      ShadyCSS.styleElement(this)
    }

    disconenctedCallback () {
      this.abortController && this.abortController.abort()
    }

    handleFetchFail (reason) {
    // FIX: this should be router's responsibility
      if (this.errored) return location.reload()

      this.errored = true

      // console.error(reason)

      const $dummy = document.createElement('div')

      $dummy.insertAdjacentHTML(
        'afterbegin',
        // TODO: offline error message
        '<div class="hn-error" slot="error">😱 Oops! Something went wrong, please, try again later 🙏</div>'
      );

      [...this.shadowRoot.querySelectorAll('*:not(slot):not([name="error"])')].forEach($el => $el.remove())

      this.appendChild($dummy.firstChild)
    }
  }
}
