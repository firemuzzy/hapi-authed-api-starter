'use strict'

class CustomError extends Error {
  constructor(msg) {
    super(msg);
    this.name = this.constructor.name;
  }
}

// define errors
class UserNotFound extends CustomError {
  
  constructor(userId) {
    super(`could not find user ${userId}`)
    this.userId = userId
  }
  
}

class InvalidPassword extends CustomError {
  
  constructor(userId) {
    super(`invalid password for user ${userId}`)
    this.userId = userId
  }
  
}

module.exports.CustomError = CustomError
module.exports.UserNotFound = UserNotFound
module.exports.InvalidPassword = InvalidPassword