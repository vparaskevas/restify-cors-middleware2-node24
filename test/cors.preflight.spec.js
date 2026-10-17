//
// Based on the spec at http://www.w3.org/TR/cors/
// The test numbers correspond to steps in the specification
//
/* eslint-env mocha */

const assert = require('assert')
var request = require('supertest')
var test = require('./test')

var METHOD_NOT_ALLOWED = 405

describe('CORS: preflight requests', function () {
  it('6.2.1 Does not set headers if Origin is missing', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .expect(test.noHeader('access-control-allow-origin'))
      .expect(METHOD_NOT_ALLOWED)
      .end(done)
  })

  it('6.2.2 Does not set headers if Origin does not match', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://random-website.com')
      .expect(test.noHeader('access-control-allow-origin'))
      .expect(METHOD_NOT_ALLOWED)
      .end(done)
  })

  it('6.2.3 Does not set headers if Access-Control-Request-Method is missing', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .expect(test.noHeader('access-control-allow-origin'))
      .expect(test.noHeader('access-control-allow-methods'))
      .expect(METHOD_NOT_ALLOWED)
      .end(done)
  })

  xit('6.2.4 Does not terminate if parsing of Access-Control-Request-Headers fails', function (done) {
    done()
  })

  xit('6.2.5 Always matches Access-Control-Request-Method (spec says it is acceptable)', function (done) {
    done()
  })

  it('6.2.6 Does not set headers if Access-Control-Request-Headers does not match', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com'],
      acceptHeaders: ['API-Token']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .set('Access-Control-Request-Headers', 'Weird-Header')
      .expect(test.noHeader('access-control-allow-origin'))
      .expect(test.noHeader('access-control-allow-methods'))
      .expect(test.noHeader('access-control-allow-headers'))
      .expect(METHOD_NOT_ALLOWED)
      .end(done)
  })

  it('6.2.7 Set the Allow-Origin header if it matches', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect('Access-Control-Allow-Origin', 'http://api.myapp.com')
      .expect(204)
      .end(done)
  })

  it('6.2.8 Set the Access-Control-Max-Age header if a max age is provided', function (done) {
    var server = test.corsServer({
      preflightMaxAge: 5,
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect('Access-Control-Max-Age', '5')
      .expect(204)
      .end(done)
  })

  it('6.2.9 Set the Allow-Method header', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect('Access-Control-Allow-Methods', 'GET,OPTIONS')
      .expect(204)
      .end(done)
  })

  it('6.2.10 Set the Allow-Headers to all configured custom headers', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com'],
      allowHeaders: ['HeaderA']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect('Access-Control-Allow-Headers', /accept-version/) // restify defaults
      .expect('Access-Control-Allow-Headers', /x-api-version/) // restify defaults
      .expect('Access-Control-Allow-Headers', /HeaderA/) // custom header
      .expect(204)
      .end(done)
  })

  it('[Not in spec] The Allow-Headers should not contain duplicates', function (done) {
    var server = test.corsServer({
      origins: ['http://api.myapp.com', 'http://www.myapp.com']
    })
    request(server)
      .options('/test')
      .set('Origin', 'http://api.myapp.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .then(function (request) {
        var allowHeaders = request.headers['access-control-allow-headers'].split(', ')

        if (((new Set(allowHeaders)).size !== allowHeaders.length)) {
          return done(new Error('duplicate header detected'))
        }

        done(null)
      })
  })
})

describe('Credentialed API CORS compatibility', function () {
  let server

  beforeEach(function () {
    server = test.corsServer({
      preflightMaxAge: 5,
      origins: ['https://app.example.test', 'http://localhost:*'],
      credentials: true,
      allowCredentialsAllOrigins: false,
      allowHeaders: ['Authorization', 'X-CSRF-Token', 'Content-Type'],
      exposeHeaders: ['API-Token-Expiry', 'x-total-count']
    })
  })

  it('runs against the exact tested Restify 12 peer', function () {
    assert.strictEqual(require('restify/package.json').version, '12.0.0')
    assert.strictEqual(require('../package.json').peerDependencies.restify, '12.0.0')
  })

  for (const origin of ['https://app.example.test', 'http://localhost:5173']) {
    it('preserves credentialed actual response headers for ' + origin, async function () {
      const response = await request(server)
        .get('/test')
        .set('Origin', origin)
        .set('Cookie', 'session_token=synthetic-local-cookie')
        .expect(200)

      assert.strictEqual(response.headers['access-control-allow-origin'], origin)
      assert.strictEqual(response.headers['access-control-allow-credentials'], 'true')
      const exposedHeaders = response.headers['access-control-expose-headers'].toLowerCase().split(',')
      assert(exposedHeaders.includes('api-token-expiry'))
      assert(exposedHeaders.includes('x-total-count'))
      assert.strictEqual(response.headers.vary, 'origin,access-control-request-method,access-control-request-headers')
    })

    it('preserves credentialed preflight and CSRF headers for ' + origin, async function () {
      const response = await request(server)
        .options('/test')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,x-csrf-token,content-type')
        .expect(204)

      assert.strictEqual(response.headers['access-control-allow-origin'], origin)
      assert.strictEqual(response.headers['access-control-allow-credentials'], 'true')
      assert.strictEqual(response.headers['access-control-allow-methods'], 'POST,OPTIONS')
      assert.strictEqual(response.headers['access-control-max-age'], '5')
      const allowedHeaders = response.headers['access-control-allow-headers'].toLowerCase().split(',')
      assert(allowedHeaders.includes('authorization'))
      assert(allowedHeaders.includes('x-csrf-token'))
      assert(allowedHeaders.includes('content-type'))
      assert.deepStrictEqual(response.headers['access-control-allow-headers'].split(','), [
        'Authorization', 'X-CSRF-Token', 'Content-Type',
        'accept', 'accept-version', 'content-type', 'request-id',
        'origin', 'x-api-version', 'x-request-id', 'x-requested-with'
      ])
    })
  }

  for (const origin of [
    'https://evil.example.test',
    'https://app.example.test.evil.test',
    'https://app.example.test@evil.test',
    'http://app.example.test',
    'http://localhost.evil.test:5173',
    'null'
  ]) {
    it('does not grant actual response access to ' + origin, async function () {
      const response = await request(server)
        .get('/test')
        .set('Origin', origin)
        .expect(200)

      for (const header of ['access-control-allow-origin', 'access-control-allow-credentials', 'access-control-expose-headers']) {
        assert.strictEqual(response.headers[header], undefined, header)
      }
      assert.strictEqual(response.headers.vary, 'origin,access-control-request-method,access-control-request-headers')
    })

    it('does not grant preflight access to ' + origin, async function () {
      const response = await request(server)
        .options('/test')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,x-csrf-token')
        .expect(METHOD_NOT_ALLOWED)

      for (const header of ['access-control-allow-origin', 'access-control-allow-credentials', 'access-control-allow-methods', 'access-control-allow-headers']) {
        assert.strictEqual(response.headers[header], undefined, header)
      }
    })
  }

  it('does not grant credentialed actual access without an Origin', async function () {
    const response = await request(server).get('/test').expect(200)

    assert.strictEqual(response.headers['access-control-allow-origin'], undefined)
    assert.strictEqual(response.headers['access-control-allow-credentials'], undefined)
  })

  it('does not grant preflight access without an Origin', async function () {
    const response = await request(server)
      .options('/test')
      .set('Access-Control-Request-Method', 'POST')
      .expect(METHOD_NOT_ALLOWED)

    assert.strictEqual(response.headers['access-control-allow-origin'], undefined)
    assert.strictEqual(response.headers['access-control-allow-credentials'], undefined)
  })

  it('does not grant preflight access without a requested method', async function () {
    const response = await request(server)
      .options('/test')
      .set('Origin', 'https://app.example.test')
      .expect(METHOD_NOT_ALLOWED)

    assert.strictEqual(response.headers['access-control-allow-origin'], undefined)
    assert.strictEqual(response.headers['access-control-allow-credentials'], undefined)
  })

  it('does not reflect an unconfigured requested header into the allowlist', async function () {
    const response = await request(server)
      .options('/test')
      .set('Origin', 'https://app.example.test')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'x-unconfigured-header')
      .expect(204)

    const allowedHeaders = response.headers['access-control-allow-headers'].toLowerCase().split(',')
    assert(!allowedHeaders.includes('x-unconfigured-header'))
  })

  it('finishes a permitted preflight before authentication without credentials', async function () {
    let authenticationCalls = 0
    server.use(function requireAuthentication (req, res, next) {
      authenticationCalls += 1
      res.send(401)
      return next(false)
    })

    await request(server)
      .options('/test')
      .set('Origin', 'https://app.example.test')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'x-csrf-token')
      .expect(204)

    assert.strictEqual(authenticationCalls, 0)
  })

  it('does not bypass authentication on an actual request from an allowed Origin', async function () {
    let authenticationCalls = 0
    server.use(function requireAuthentication (req, res, next) {
      authenticationCalls += 1
      res.send(401)
      return next(false)
    })

    const response = await request(server)
      .get('/test')
      .set('Origin', 'https://app.example.test')
      .expect(401)

    assert.strictEqual(authenticationCalls, 1)
    assert.strictEqual(response.headers['access-control-allow-origin'], 'https://app.example.test')
    assert.strictEqual(response.headers['access-control-allow-credentials'], 'true')
  })

  it('keeps wildcard credentials disabled when explicitly configured', function () {
    assert.throws(function () {
      test.corsServer({
        origins: ['*'],
        credentials: true,
        allowCredentialsAllOrigins: false
      })
    }, /credentials not supported with wildcard/)
  })
})
