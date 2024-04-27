// 'use strict'

const path = require('path')
const AutoLoad = require('@fastify/autoload')

module.exports.options = {}

module.exports = async function (fastify, opts) {
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })
  // fastify.addHook('onRequest', (request, reply, done) => {
  //   reply.header('Access-Control-Allow-Origin', '*');
  //   reply.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  //   done();
  // });

  // fastify.register(require('@fastify/cors'), {
  //   origin: true, // Allow requests from all origins
  // });
  // fastify.register(require('fastify-cors'), {
  // origin: '*',
  // });
  
  global.__basedir = __dirname;
  
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
} 
