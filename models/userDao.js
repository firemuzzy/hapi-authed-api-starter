'use strict'

const print = require('pretty-print');
const bcrypt = require('bcrypt-as-promised')
const jwt = require("jsonwebtoken-promisified");


const errors = require('../errors/errors')
const UseNotFound = errors.UseNotFound
const InvalidPassword = errors.InvalidPassword


class UserDao {
  
  constructor(datastore, secret) {
    if(!datastore) throw new Error("datastore is null")
    if(!secret) throw new Error("secret is null")
    
    this.ds = datastore
    this.secret = secret
  }
  
  _crateUniqueEmail(email) {
    const data = { created: new Date() } 
    return new Promise( (resolve, reject) => {
      var uniquEmailKey = this.ds.key( ["UniqueEmail", email ] )
      this.ds.insert({ key:uniquEmailKey, data:data }, (error) => {   
        if(error) reject(error)
        else resolve( {key:uniquEmailKey, data:data} )        
      })
    })
  }
  
  _createUser(password) {
    var passHashP = null
    if(password) passHashP = bcrypt.hash(password, 10)
    else passHashP = Promise.resolve(null)
    
    return passHashP.then( hashed => {
      return new Promise( (resolve, reject) => {
        const data = { created: new Date(), passwordHash: hashed } 
        var userKey = this.ds.key("User")
        this.ds.insert({ key:userKey, data:data }, (error, apiResponse) => {   
          if(error) reject(error)
          else resolve( {key:userKey, data:data} )       
        })
      })
    })
  }
  
  updateUser(userId, data) {
    return new Promise( (resolve, reject) => {
      var userKey = this.ds.key(["User", userId])
      this.ds.update({ key:userKey, data:data }, (error) => {   
        if(error) reject(error)
        else resolve( {key:userKey, data:data} )       
      })
    })
  }
  
  setDefaultEmail(userId, email) {
    const data = { created: new Date() } 
    
    const userKey = this.ds.key( ["User", userId] )
    this.ds.get(userKey)
    
    return new Promise( (resolve, reject) => {
      const uniquEmailKey = this.ds.key( ["User", email ] )
      this.ds.insert({ key:uniquEmailKey, data:data }, (error, apiResponse) => {   
        if(error) reject(error)
        else resolve(data)        
      })
    })
  }
  
  testSave(email) {
    const data = { created: new Date() } 
    return new Promise( (resolve, reject) => {
      const uniquEmailKey = this.ds.key( ["UniqueEmail", email ] )
      this.ds.insert({ key:uniquEmailKey, data:data }, (error, apiResponse) => {   
        if(error) reject(error)
        else resolve(data)        
      })
    })
  }
  
  findById(userId) {
    return new Promise( (resolve, reject) => {
      const key = this.ds.key(['User', userId])
      this.ds.get(key, (error, entity) => {
        if(error) reject(error)
        else if(entity) resolve(entity)
        else reject( new UserNotFound(userId) )
      })
    })
  }
  
  findByEmail(email) {
    return new Promise( (resolve, reject) => {
      const query = this.ds.createQuery("User").filter('defaultEmail', email).limit(1);
      this.ds.runQuery(query, (err, entities) => {
        if(err) { reject(err) }
        else {
          if(entities.length > 0) resolve(entities[0])
          else reject( new UserNotFound(email) )
        }
      });
    })
  }
  
  findUniqueEmail(email) {    
    return new Promise( (resolve, reject) => {
      const key = this.ds.key(['UniqueEmail', email])
      this.ds.get(key, (error, entity) => {
        if(error) reject(error)
        else resolve(entity)
      })
    })
  }
  
  signup(email, password) {
    return this._createUser(password).then( user => {      
      return this._crateUniqueEmail(email).then(cu => { 
        return {user:user, uniqueEmail:cu} 
      })
    }).then( obj => {
      var user = obj.user
      var uniqueEmail = obj.uniqueEmail
            
      var data = user.data
      data.emailKey = uniqueEmail.key
      data.defaultEmail = uniqueEmail.key.name
      
      return this.updateUser(user.key.id, data)
    })
  }
  
  login(email, password) {
    return this.findByEmail(email).then( user => {
      if(user == null || user.key.id == null || user.data.passwordHash == null) return Promise.reject( new InvalidPassword(email) )
      
      return bcrypt.compare(password, user.data.passwordHash).then(token => user )
    }).then( user => {
      return jwt.signAsync({userId: user.key.id}, this.secret).then( token => { return {user:user, token:token} })
    })
  }
  
}

module.exports = UserDao