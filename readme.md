# Vanilla Web Components HNPWA

> Hacker News Progressive Web Application built with vanilla JS and [Web Components](https://www.webcomponents.org/introduction).

<p align="center">
  <a href="https://vanilla-wc-hnpwa.firebaseapp.com" target="_blank">
    <img src="https://raw.githubusercontent.com/alexnoz/hacker-news-pwas/72debb7d141a4ba32f84d965110ac62650dcbde1/site/assets/images/vanilla-wc-hn.png" width="350px">
    <br>
    Demo
  </a>
</p>

## Features

* Two bundles - legacy (for browsers that don't support `<script type=module>`) and modern (see [Phillip Walton's great post](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/) for details)
* [PRPL pattern](https://developers.google.com/web/fundamentals/performance/prpl-pattern/)
* Route-level code splitting
* Critical CSS inlining
* Preload / prefetch resource hints
* App manifest
* Service Worker
* Lighthouse score 100/100

## Development

1) Run `git clone https://github.com/alexnoz/vanilla-wc-hnpwa.git` to clone the repo
2) `cd vanilla-wc-hnpwa`
3) Run `yarn install` to install the dependencies
4) Run `yarn start` to kick off `webpack-dev-server`
5) Do something cool
6) Run `yarn build` to build the production version of the app

These steps require [firebase](https://firebase.google.com/docs/hosting/quickstart) to be installed:

7) Run `firebase serve` to serve the production version locally
8) Run `yarn run deploy` to deploy the app

## Coming soon (hopefully)

* SSR
