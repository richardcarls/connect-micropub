/* global describe, it */

var chai = require('chai');
var expect = chai.expect;

var micropub = require('../');

describe('connect-micropub', function() {

  var middleware;
  
  it('should export the create middleware', function() {
    middleware = micropub.create;
    
    expect(middleware).to.be.a.Function;
    expect(middleware.length).to.equal(1); // Accepts options arg
    expect(middleware().length).to.equal(3); // Accepts req, res, next args
  });
    
}); // connect-micropub
