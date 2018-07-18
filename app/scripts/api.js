import { unfetch as fetch } from './unfetch'

const apiBaseUrl = 'https://api.hnpwa.com/v0/'

const endpoints = {
  top: 'news',
  new: 'newest',
  ask: 'ask',
  jobs: 'jobs',
  show: 'show'
}

const jsonFetcher = endpoint => opts =>
  fetch(apiBaseUrl + endpoint + '.json', opts).then(res => res.json())

export const pageFetcher = (type, page) =>
  jsonFetcher(endpoints[type] + '/' + page)

export const userFetcher = id =>
  jsonFetcher('user/' + id)

export const commentsFetcher = id =>
  jsonFetcher('item/' + id)
