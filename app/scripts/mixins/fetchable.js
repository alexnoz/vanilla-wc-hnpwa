import { UnfetchAbortController as AbortController } from '../unfetch'

export default class extends HTMLElement {
  constructor () {
    super()

    this.fetchTimeout = 5000
    this.abortController = null
    this.fetchTimer = 0

    // the $$ prefix is to mark it as a special property (for 'router-view' component)
    this.$$ready = null
  }

  async fetchData (fetcher) {
    // fetch is in progress
    if (this.abortController) {
      this.abortController.abort()
      clearTimeout(this.fetchTimer)
    }

    this.abortController = new AbortController()

    this.$$ready = new Promise(async resolve => {
      const cleanReady = () => {
        this.abortController = null
        resolve()
      }

      this.fetchTimer = setTimeout(() => {
        this.abortController.abort()
        cleanReady()
        this.handleFetchFail('timeout')
      }, this.fetchTimeout)

      this.handleFetchStart()

      try {
        const data = await fetcher({ signal: this.abortController.signal })
        this.handleFetchSuccess(data)
      } catch (err) {
        this.handleFetchFail(err.message)
      } finally {
        cleanReady()
        clearTimeout(this.fetchTimer)
      }
    })
  }

  // Hooks should be implemented by descendants
  handleFetchStart () {}
  handleFetchSuccess (data) {}
  handleFetchFail (reason) {}
}
