const express = require('express'),
      AuthenticationController = require('../controllers/authentication'),
      passportService = require('../config/passport'),
      passport = require('passport'),
      User = require('../models/user');

const requireAuth = passport.authenticate('jwt', { session: false });
const requireLogin = passport.authenticate('local', { session: false });

module.exports = function(app) {
  // Initializing route groups
  const apiRoutes = express.Router(),
        authRoutes = express.Router(),
        profileRoutes = express.Router();
        testRoutes = express.Router();

  //=========================
  // Auth Routes
  //=========================

  // Set auth routes as subgroup/middleware to apiRoutes
  apiRoutes.use('/auth', authRoutes);

  // Registration route
  authRoutes.post('/register', AuthenticationController.register);

  // Login route
  authRoutes.post('/login', requireLogin, AuthenticationController.login);
  authRoutes.put('/change-password', requireAuth, AuthenticationController.changePassword);
  authRoutes.post('/delete', requireAuth, AuthenticationController.deleteAccount);

  // Test protected route
  apiRoutes.get('/protected', requireAuth, function(req, res) {
    res.send({ content: 'The protected test route is functional!'});
  });

  apiRoutes.get('/account', requireAuth, function(req, res) {
    console.log("authentication?");
    User.findById(req.user._id, function(err, user) {
      if(err) { res.json(err); }

      res.json(AuthenticationController.setUserInfo(user));
    })

  });

  //Test Routes
  testRoutes.get('/getAllUsers', AuthenticationController.getAllUsers);
  testRoutes.post('/testPost', AuthenticationController.testPost);




  // Set url for API group routes
  app.use('/api', apiRoutes);
  app.use('/test', testRoutes);
};
