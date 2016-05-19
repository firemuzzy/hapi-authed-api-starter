const chai = require('chai');
const expect = chai.expect;
const bcrypt = require('bcrypt-as-promised')
const jwt = require("jsonwebtoken-promisified");


// const Code = require('code');   // assertion library

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const faker = require('faker')

const gcloud = require('gcloud')
const UserDao = require('../models/userDao.js')

var datastore = gcloud.datastore({
  projectId: 'test',
  apiEndpoint: 'http://localhost:8080'
});
var secret = "ASdfaskdfhaksdhfjaksdhfaskdnfaksdjhfaskdhfaksdyrsqerasdfasdqwert"
const userDao = new UserDao(datastore, secret)


lab.experiment('gcloud user', () => {
    
  lab.before((done) => {
    done();
  });

  lab.beforeEach((done) => {
    // Run before every single test
    done();
  });
  
  // lab.test('do something', (done) => {
  //   const email = faker.internet.email()
  //   userDao.testSave(email).then( (value) => {
  //     return userDao.findByEmail(email)
  //   }).then( (found) => {
  //     console.log(found)
  //     done()
  //   }).catch( (error) => {
  //     console.error(error)
  //     done(error)
  //   })
  // });
  

  lab.test('signup', (done) => {
    
    const email = faker.internet.email()
    const password = faker.internet.password()
    userDao.signup(email, password).then( (value) => {            
      expect(value.key.id).to.exist
      expect(value.key.id).to.be.a('number')
      expect(value.data.emailKey).to.exist
            
      expect(value.data.emailKey.id).to.not.exist
      expect(value.data.emailKey.name).to.exist
      expect(value.data.emailKey.kind).to.exist
      expect(value.data.emailKey.name).to.be.a("string")
      expect(value.data.emailKey.name).to.equal(email)
      expect(value.data.emailKey.kind).to.be.a("string")
      expect(value.data.emailKey.kind).to.equal("UniqueEmail")

      expect(value.data.passwordHash).to.exist
      expect(value.data.passwordHash).to.be.a("string")
      

      expect(value.data.defaultEmail).to.be.a("string")
      expect(value.data.defaultEmail).to.equal(email)
    
      return bcrypt.compare(password, value.data.passwordHash).then( res => { return { bcrypt:res, signedUp:value} })
    }).then( obj => {
      const bcryptData = obj.bcrypt
      const signedUp = obj.signedUp      
      // query to make sure the object exists
      const userId = signedUp.key.id
      return userDao.findById(userId).then( u => { return {signedUp:signedUp, found:u } })
    }).then( (obj) => {
      const signedUp = obj.signedUp
      const foundUser = obj.found
      
      expect(signedUp.key).to.deep.equal(foundUser.key) 
      signedUp.data.created = null 
      foundUser.data.created = null 
      expect(signedUp.data).to.deep.equal(foundUser.data)      
  
      return userDao.findUniqueEmail(email)
    }).then( ue => {
      expect(ue.key.id).to.not.exist
      expect(ue.key.name).to.exist
      expect(ue.key.name).to.be.a('string')
      expect(ue.key.name).to.equal(email)
      done()
    }).catch( (error) => {
      console.error("ERROR",error)
      done(error)
    })
    
  });
  
  lab.test('login', (done) => {
    const email = faker.internet.email()
    const password = faker.internet.password()
    userDao.signup(email, password).then( (user) => {
      return userDao.login(email, password).then( res => {return { signedUp:user, login:res }})      
    }).then( obj => {
      const signedUp = obj.signedUp
      const login = obj.login
      
      return userDao.login(email, password).then( l => { return { signedUp:signedUp, loggedIn:l } })
    }).then( obj => {
      const signedUp = obj.signedUp
      const user = obj.loggedIn.user
      const token = obj.loggedIn.token
      
      expect(signedUp).to.exist
      expect(user).to.exist
      expect(token).to.exist
      
      user.data.created = null
      signedUp.data.created = null
      expect(user).to.deep.equal(signedUp)
      
      const verfiedToken = jwt.verify(token, secret)
      expect(verfiedToken).to.exist
      expect(verfiedToken.userId).to.equal(signedUp.key.id)
      
      done()
    }).catch( (error) => {
      done(error)
    })
  })
  
});