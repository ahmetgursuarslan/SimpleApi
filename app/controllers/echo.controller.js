exports.echo = (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body,
  });
};
