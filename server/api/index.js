// Vercel serverless entry point.
//
// Vercel invokes an exported handler per request rather than running a
// long-lived listener, so this exports the Express app directly instead of
// calling app.listen(). Local development still uses src/server.js.
import app from '../src/app.js';

export default app;
