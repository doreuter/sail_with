const supertest = require('supertest'),
      mongoose  = require('mongoose'),
      should    = require('should'),
      app       = require('../app'),
      http      = require('http');

const port = process.env.PORT || 6060;
const server = app.listen(port, function() {
  console.log('server is listening on port ' + port);
});

// UNIT test begin
describe('Server', function() {
  before(function () {
    mongoose.disconnect();
  });

  it('should startup the server', function(done) {
    done();
  });

  after(function() {
    server.close();
  });
});
