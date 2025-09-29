const startedAt = Date.now();
let requestCount = 0;

exports.increment = (req, res, next) => {
  requestCount += 1;
  next();
};

exports.stats = (req, res) => {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  res.json({ requestCount, uptimeSec });
};
