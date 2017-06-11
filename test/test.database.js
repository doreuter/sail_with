const should = require('should'),
      mongoose = require('mongoose'),
      User = require('../server/models/user'),
      config = require('../server/config/config');

let db;

describe('Account', function() {

  before(function(done) {
    db = mongoose.connect(config.database + '-test');
    done();
  });

  after(function(done) {
    mongoose.disconnect();
    done();
  });

  beforeEach(function(done) {
    var user = new User({
      email: 'testuser12345@test.de',
      name: 'Test User',
      password: 'Pa$$w0rd!'
    });

    user.save(function(error) {
      if(error) console.log('error: ' + error.message);
      else console.log('no error');
      done();
    });
  });

  it('find a user by username', function(done) {
    User.findOne({ email: 'testuser12345@test.de' }, function(err, user) {
      user.email.should.eql('testuser12345@test.de');
      console.log('    username: ', user.email);
      done();
    });
  });

  afterEach(function(done) {
    User.remove({}, function() {
      done();
    });
  });

});
