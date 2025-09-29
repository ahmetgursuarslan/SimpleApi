exports.now = (req, res) => {
  const d = new Date();
  res.json({
    iso: d.toISOString(),
    epochMs: d.getTime(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};
