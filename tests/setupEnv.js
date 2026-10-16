// Load .env like the app does, but keep the suite independent of a developer's
// local settings: an API_KEY there would turn every unauthenticated test into
// a 401. Tests that need a key set it themselves.
require('dotenv').config({ quiet: true });
delete process.env.API_KEY;
