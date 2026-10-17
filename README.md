# restify-cors-middleware2

> CORS middleware with full [W3C spec](https://www.w3.org/TR/cors/) support.

[![NPM](http://img.shields.io/npm/v/restify-cors-middleware2.svg?style=flat)](https://npmjs.org/package/restify-cors-middleware2)
[![License](http://img.shields.io/npm/l/restify-cors-middleware2.svg?style=flat)](https://github.com/DatatracCorporation/restify-cors-middleware2)

[![Build Status](http://img.shields.io/travis/DatatracCorporation/restify-cors-middleware2.svg?style=flat)](http://travis-ci.org/DatatracCorporation/restify-cors-middleware2)
[![Dependencies](http://img.shields.io/david/DatatracCorporation/restify-cors-middleware2.svg?style=flat)](https://david-dm.org/DatatracCorporation/restify-cors-middleware2)
[![Dev dependencies](http://img.shields.io/david/dev/DatatracCorporation/restify-cors-middleware2.svg?style=flat)](https://david-dm.org/DatatracCorporation/restify-cors-middleware2)
[![Peer dependencies](http://img.shields.io/david/peer/DatatracCorporation/restify-cors-middleware2.svg?style=flat)](https://david-dm.org/DatatracCorporation/restify-cors-middleware2)
[![Known Vulnerabilities](https://snyk.io/package/npm/restify-cors-middleware2/badge.svg)](https://snyk.io/package/npm/restify-cors-middleware2)

[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Node 24 derivative

This derivative starts from the complete Git history of
[DatatracCorporation/restify-cors-middleware](https://github.com/DatatracCorporation/restify-cors-middleware),
at npm version `2.2.1`'s recorded source commit
`0b19d7f3c6cd31db0d071766417d589292fd6d2a`.
The original author (Datatrac Corporation), MIT license declaration and upstream
documentation are retained. The source commit has no standalone license file.

The derivative version is `2.2.1-node24.0`, for Node `24.x` and exactly
Restify `12.0.0`. The peer range is deliberately limited to the tested version;
it does not claim compatibility with other Restify releases. Runtime files in
`src/` are unchanged from that source commit. No allowlist, credential or
preflight policy has been relaxed.

On Node 24.19.0 / Restify 12.0.0, `npm test -- --reporter dot` passes
51 tests, including 24 credentialed API HTTP cases, with two inherited pending
tests. The existing tooling emits a `util.isArray` deprecation warning.
These are local middleware checks, not application session/CSRF or end-to-end
verification. The original case-sensitive configured/default header list is
preserved, including `Content-Type` alongside `content-type`.

The same suite can exercise an installed artifact by setting `CORS_COMPAT_MODULE`
to its absolute package directory. This only changes the test fixture's import;
production middleware does not read that variable.

This derivative is distributed from
[vparaskevas/restify-cors-middleware2-node24](https://github.com/vparaskevas/restify-cors-middleware2-node24),
not as a new npm release. Consumers must pin its verified published full commit
SHA. The upstream npm setup instructions below do not install the Node 24
derivative; upstream `2.2.1` still excludes Restify 12 from its peer contract.

## Setup
```sh
$ npm install restify-cors-middleware2 --save
```

## Usage

```js
const corsMiddleware = require('restify-cors-middleware2')

const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['http://api.myapp.com', 'http://web.myapp.com'],
  allowHeaders: ['API-Token'],
  exposeHeaders: ['API-Token-Expiry']
})

server.pre(cors.preflight)
server.use(cors.actual)
```

## Allowed origins

You can specify the full list of domains and subdomains allowed in your application, using strings or regular expressions.

```js
origins: [
  'http://myapp.com',
  'http://*.myapp.com',
  /^https?:\/\/myapp.com(:[\d]+)?$/
]
```

For added security, this middleware sets `Access-Control-Allow-Origin` to the origin that matched, not the configured wildcard.
This means callers won't know about other domains that are supported.

Setting `origins: ['*']` is also valid, although it comes with obvious security implications. Note that it will still return a customised response (matching Origin), so any caching layer (reverse proxy or CDN) will grow in size accordingly.

By default, credentials are not allowed for the `*` origin.  This can be
overridden with the `allowCredentialsAllOrigins` option.

## Troubleshooting

As per the spec, requests without an `Origin` will not receive any CORS headers. Requests with a matching `Origin` will receive the appropriate response headers. Always be careful that any reverse proxies (e.g. Varnish) vary their cache depending on the origin, so you don't serve CORS headers to the wrong request.

## Compliance to the spec

See [unit tests](https://github.com/DatatracCorporation/restify-cors-middleware2/tree/master/test) for examples of preflight and actual requests.

## TypeScript declaration file support

A basic declaration file has been added (thanks to Dane Horak), but we
don't use TypeScript locally, so we have not validated it.  Let us know
if there is more that can be added.
