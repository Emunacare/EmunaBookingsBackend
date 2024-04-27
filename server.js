// Read the .env file.
require('dotenv').config();
// Require the framework
const Fastify = require('fastify');
const cors = require('fastify-cors');

// Require library to exit fastify process, gracefully (if possible)
const closeWithGrace = require('close-with-grace');
// Register your application as a normal plugin.
const appService = require('./app.js');

async function main() {
  // Instantiate Fastify 
  let app = null;
  // Fastify.register(cors);
  
  if (process.env.NODE_ENV === 'development') {
    app = Fastify({
      logger: {
        level: 'trace',
        transport: {
          level: 'info',
          target: 'pino-pretty',
          options: { destination: 1 },
        },
      },
    });
  }
  else {
    app = Fastify({
      logger: {
        useLevelLabels: true,
        timestamp: false,
        base: null,
        messageKey: 'msg',
      },
    });
  }

  // Register app service
  app.register(appService);
  app.register(require('@fastify/cors'), {
    origin: "*",
  });

  // delay is the number of milliseconds for the graceful close to finish
  const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY || 500 }, async ({
    signal,
    err,
    manual,
  }) => {
    if (err) {
      app.log.error(err);
    }
    await app.close();
  });

  app.addHook('onClose', (instance, done) => {
    closeListeners.uninstall();
    done();
  });

  // Start listening.
  // app.use(cors());
  const listenOptions = {
    host: '0.0.0.0',
    port: process.env.FASTIFY_PORT || 4000,
  };
  app.listen(listenOptions, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}

main();
