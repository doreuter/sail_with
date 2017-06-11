"use strict";

const jwt = require('jsonwebtoken'),
      crypto = require('crypto'),
      User = require('../models/user'),
      config = require('../config/config');

function generateToken(user) {
  return jwt.sign(user, config.secret, {
    expiresIn: 10080 // in seconds = 168 min = 2,8h
  });
}

function setUserInfo(request) {
  return {
    _id: request._id,
    name: request.name,
    email: request.email,
    role: request.role
  }
}

exports.getAllUsers = function(request, response) {
  User.find({}, function(err, user) {
    console.log("Request");

    if(!err){
      response.status(200).json(user);
    }

  });
};

exports.testPost = function(request, response) {
  console.log(request.body);
  response.status(200).json(request.body);
};

// Set user info from request for response
exports.setUserInfo = function(request) {
  return {
    _id: request._id,
    name: request.name,
    email: request.email,
    createdAt: request.createdAt,
    role: request.role
  }
};

//==========================
// Login Route
//==========================
exports.login = function(req, res, next) {

  let userInfo = setUserInfo(req.user);

  res.status(200).json({
    token: 'JWT ' + generateToken(userInfo),
    user: userInfo,
    success: true,
    msg: 'User successfully logged in'
  });
};

//==========================
// Registration Route
//==========================
exports.register = function(req, res, next) {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  // Return error if no email provided
  if (!email) {
    return res.status(422).json({
      msg: 'You must enter an email address.',
      success: false
    });
  }

  // Return error if full name not provided
  if (!name) {
    return res.status(422).json({
      msg: 'You must enter your name.',
      success: false
    });
  }

  // Return error if no password provided
  if (!password) {
    return res.status(422).json({
      msg: 'You must enter a password.',
      success: false
    });
  }

  User.findOne({ email: email }, function(err, existingUser) {
    if(err) { return next(err); }

    // If user is not unique, return error
    if(existingUser) {
      return res.status(422).json({
        msg: 'That email address is already in use.',
        success: false
      });
    }

    // If email is unique and password was provided, create account
    let user = new User({
      email: email,
      password: password,
      name: name
    });

    user.save(function(err, user) {
      if(err) { return next(err); }

      // Subscribe member to Mailchimp list
      // mailchimp.subscribeToNewsletter(user.email);

      // Respond with JWT if user was created

      let userInfo = setUserInfo(user);

      res.status(201).json({
        token: 'JWT ' + generateToken(userInfo),
        user: userInfo,
        success: true,
        msg: 'User successfully signed up'
      });
    });

  });

};

exports.changePassword = function(req, res, next) {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const userId = req.user._id;

  if (!oldPassword || oldPassword === '') {
    return res.status(422).json({
      msg: 'You must provide your old password.',
      success: false
    });
  }
  if (!newPassword || oldPassword === '') {
    return res.status(422).json({
      msg: 'You must enter a new password.',
      success: false
    });
  }
  if (newPassword === oldPassword) {
    return res.status(422).json({
      msg: 'Your new password must not be your old password.',
      success: false
    });
  }

  User.findById(userId, function(err, user) {
    if(err) return res.status(422).json({ error: 'No user was found.' });

    user.comparePassword(oldPassword, function(err, isMatch) {
      if(err) { return res.status(422).json({ error: err }); }
      if(!isMatch) { return res.status(422).json({ error: 'Your provided current password is not correct' }); }

      user.password = newPassword;
      user.save(function(err) {
        if(err) return res.status(500).json({ error: 'An error occurred while saving your new password. Please try again later.' });

        return res.status(200).json({
          success: true,
          msg: 'Your password has been successfully changed'
        });
      });
    });
  });

};

exports.deleteAccount = function(req, res, next) {
  const password = req.body.password;
  User.findById({ _id: req.user._id }, function(err, user) {
    if(err) return res.status(422).json({ error: 'No user was found.' });

    user.comparePassword(password, function(err, isMatch) {
      if(err) return res.status(422).json({ error: err, msg: 'error in comparePassword'});
      if(!isMatch) { return res.status(422).json({ error: 'Your provided current password is not correct' }); }

      User.remove({ _id: req.user._id }, function(err) {
        if(err) {
          return res.status(500).json({
            success: false,
            error: 'Could not delete your account. Please try again later.'
          });
        }
        return res.status(202).json({
          success: true,
          msg: 'Account successfully deleted'
        });
      });
    });
  });
};

//========================================
// Authorization Middleware
//========================================

// Role authorization check
exports.roleAuthorization = function(role) {
  return function(req, res, next) {
    const user = req.user;

    User.findById(user._id, function(err, foundUser) {
      if(err) {
        res.status(422).json({ error: 'No user was found.' });
        return next(err);
      }

      // If user is found, check role
      if(foundUser.role == role) {
        return next();
      }

      res.status(401).json({ error: 'You are not authorized to view this content.' });
      return next('Unauthorized');
    });
  };
};
