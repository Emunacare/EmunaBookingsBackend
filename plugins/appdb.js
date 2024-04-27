const fp = require('fastify-plugin');
const knex = require('knex');
const { attachPaginate } = require('knex-paginate');

module.exports = fp(async (fastify, opts) => {
  // Utility function to init db driver
  const knexObj = knex({
    client: 'mysql2',
    connection: {
      user: process.env.APP_DB_USERNAME,
      password: process.env.APP_DB_PASSWORD,
      database: process.env.APP_DB_NAME,
      host : process.env.APP_DB_HOST,
      port :process.env.APP_DB_PORT,
      pool: {
        max: +(process.env.APP_DB_POOL_MAX_SIZE ?? 10),
        min: +(process.env.APP_DB_POOL_MIN_SIZE ?? 0),
        idleTimeoutMillis: +(process.env.APP_DB_IDLE_TIMEOUT ?? 30000),
      },
      options: {
        encrypt: (process.env.APP_DB_OPTION_ENCRYPT ?? 'true').toLowerCase() === 'true', // for azure
        trustServerCertificate: (process.env.APP_DB_OPTION_TRUST_SERVER_CERTIFICATE ?? 'false').toLowerCase() === 'true', // change to true for local dev / self-signed certs
      },
      timezone: '+00:00',
    },
  });

  attachPaginate();
  fastify.decorate('appdb', knexObj);
});
