var restify = require('restify')
var cors = require(process.env.CORS_COMPAT_MODULE || '../src/index')

exports.corsServer = function (corsConfig) {
  var middleware = cors(corsConfig)
  var server = restify.createServer()
  server.pre(middleware.preflight)
  server.use(middleware.actual)
  server.get('/test', function (req, res, next) {
    res.header('Custom-Response-Header', '123456')
    res.header('Max-Age', 5 * 60 * 1000)
    res.send(200, 'ok')
    next()
  })
  return server
}

exports.noHeader = function (name) {
  return function (res) {
    if (Object.prototype.hasOwnProperty.call(res.headers, name)) {
      return 'Should not have header ' + name
    }
  }
}
