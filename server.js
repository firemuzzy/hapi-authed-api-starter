'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const gcloud = require('gcloud')
const UserDao = require('./models/userDao')

class Server {
  
  constructor(port, secret) {
    if(port == null) throw new Error("port is null");    
    if(secret == null) throw new Error("secret is null")
    
    const GCLOUD_PROJECT_ID = process.env["GCLOUD_PROJECT_ID"]
    const GCLOUD_KEY_FILE_NAME = process.env["GCLOUD_KEY_FILE_NAME"]
    const GCLOUD_API_ENDPOINT = process.env["GCLOUD_API_ENDPOINT"]

    var gcloudParams = {}
    if(GCLOUD_PROJECT_ID == null) throw new Error("GCLOUD_PROJECT_ID environment variable is null")
    else gcloudParams.projectId = GCLOUD_PROJECT_ID
    
    if(GCLOUD_API_ENDPOINT == null || GCLOUD_API_ENDPOINT.indexOf("localhost") != -1) {
      // remote api endpoint, key file is required
      if(GCLOUD_KEY_FILE_NAME == null) throw new Error("GCLOUD_KEY_FILE_NAME environment variable is null")
      else {
        if(GCLOUD_API_ENDPOINT) gcloudParams.apiEndpoint = GCLOUD_API_ENDPOINT
        gcloudParams.keyFilename = GCLOUD_KEY_FILE_NAME
      }
    } else {
      // local api, key file not needed
      gcloudParams.apiEndpoint = GCLOUD_API_ENDPOINT
    }
    
    this.datastore = gcloud.datastore(gcloudParams)
    this.userDao = new UserDao(this.datastore, secret)

    this.server = new Hapi.Server();
    this.server.connection({ port: port });
    
    Server._setupRoutes(this.server)
  }
  
  start() {
    return new Promise( (resolve, reject) => {
      this.server.start((error) => {
        if (error) { reject(error) }
        console.log('Api server running at:', this.server.info.uri);
        resolve()
      });
    })
  }
  
  static _setupRoutes(server) {
    
    server.route({
      method: 'GET',
      path: '/',
      handler: (request, reply) => {    
        reply({fred:'Hello, world!'});
      }
    })

    server.route({
      method: 'POST',
      path: '/users/login',
      config: {
        validate: {
          params: {
            email: Joi.string().email(),
            password: Joi.string(),
            password2: Joi.string()
          }
        }
      },
      handler: (request, reply) => {
        if(password != password2) {
          throw new Error("passwords do not match")
        }
        reply(userDao.login(request.email, request.password))
      }
    })

    server.route({
      method: 'POST',
      path: '/users/signup',
      config: {
        validate: {
          params: {
            email: Joi.string().email(),
            password: Joi.string()
          }
        }
      },
      handler: (request, reply) => {
        reply(userDao.signup(request.email, request.password))
      }
    })

  }
  
  
  
}


module.exports = Server