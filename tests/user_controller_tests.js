'use strict'

const chai = require('chai');
const expect = chai.expect;
const faker = require('faker');

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const injectThen = require('inject-then')

const Server = require('../server.js')

const envParams = {
  "GCLOUD_PROJECT_ID": "test",
  "GCLOUD_API_ENDPOINT": "http://localhost:8080"
}
    
const server = new Server(3000, "asdfasdfwqerscvxcgqwerasdf", envParams)
server.server.register(injectThen, function (err) {
  if (err) throw err
})

lab.experiment('User Api', () => {
  
  lab.before((done) => {
    server.start().then( v => {
      done()
    }).catch( error => {
      done(error)
    })
  });

  lab.beforeEach((done) => {
    // Run before every single test
    done();
  });
  
  lab.test('signup without params', (done) => {
    var options = { method: "POST", url: "/users/signup",
        payload: {}
    };
 
    server.server.inject(options, function(response) {
      var result = response.result;
      expect(response.statusCode).to.equal(400)      
      done()
    }) 
  })
  
  lab.test('signup with mismatched passwords', (done) => {
    
    var options = { method: "POST", url: "/users/signup",
        payload: { email: faker.internet.email(), password: faker.internet.password(), password2: faker.internet.password() }
    };
 
    server.server.inject(options, function(response) {
      var result = response.result;      
      expect(response.statusCode).to.equal(400)      
      done()
    })
    
  })
  
  lab.test('signup', (done) => {
    
    var password = faker.internet.password()
    var options = { method: "POST", url: "/users/signup",
        payload: { email: faker.internet.email(), password: password, password2: password }
    };
 
    server.server.inject(options, function(response) {
      var result = response.result;
      
      expect(response.statusCode).to.equal(200)      
      expect(result.token).to.exist
      expect(result.user).to.exist
      done()
    })
    
  })
  
  lab.test('login', (done) => {
    const email = faker.internet.email()
    const password = faker.internet.password()
    
    var signupOptions = { method: "POST", url: "/users/signup",
      payload: { email: email, password: password, password2: password }
    };
    var loginOptions = { method: "POST", url: "/users/login",
      payload: { email: email, password: password }
    };
    
    var signupToken = null
    var loginToken = null    
    server.server.injectThen(signupOptions).then( response => {
      expect(response.statusCode).to.equal(200)            
      signupToken = response.result.token
      
      return server.server.injectThen(loginOptions)
    }).then( (response) => {
      expect(response.statusCode).to.equal(200)    
      
      loginToken = response.result.token
      expect(loginToken).to.equal(signupToken)
      done()
      
    }).catch( error => {
      done(error)
    })
    
    
  })
  
})

