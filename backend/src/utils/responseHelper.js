function ok(res, data, message = null, status = 200) {
  return res.status(status).json({ data, error: null, message })
}

function fail(res, error, message, status = 400) {
  return res.status(status).json({ data: null, error, message })
}

module.exports = { ok, fail }
