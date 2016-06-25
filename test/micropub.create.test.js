/* global describe, it, before */

var util = require('util');
var chai = require('chai');
chai.use(require('chai-things'));
var expect = chai.expect;

var micropub = require('..');

describe('connect-micropub :: create', function() {

  describe('with a valid request', function() {

    var request;
    var body;
    var middleware = micropub.create();

    before('invoke middleware', function() {
      body = {
        h: 'entry',
        summary: 'Test Summary',
        content: { value: 'Test Content', },
        category: ['cat1', 'cat2', 'cat3',],
        location: {
          type: 'h-geo',
          properties: {
            latitude: '42.8706429',
            longitude: '-78.7434937',
          },
        },
      };
      
      request = {
        method: 'post',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        url: 'https://example.com/client',
        body: body,
      };

      middleware(request, {}, function(){});
    });
    
    it('should create the micropub property', function() {
      expect(request.micropub).to.be.ok;
    });

    it('should identify the item type', function() {
      expect(request.micropub).to.have.property('type')
        .that.includes('h-entry');
    });

    it('should correctly parse normal properties', function() {
      expect(request.micropub.properties.summary)
        .to.include('Test Summary');
    });

    it('should correctly parse multiple value properties', function() {
      expect(request.micropub.properties.category)
        .to.be.an('array')
        .with.length(3);
    });
    
    it('should correctly parse content', function() {
      expect(request.micropub.properties.content)
        .to.include.something
        .that.deep.equals({ value: 'Test Content', });
    });

    it('should correctly parse nested items', function() {
      expect(request.micropub.properties.location)
        .to.include.something
        .that.deep.equals({
          type: [ 'h-geo' ],
          properties: {
            latitude: [ '42.8706429' ],
            longitude: [ '-78.7434937' ]
          }
        });
    });
    
  }); // with a valid request

  describe('error cases', function() {

    var request;
    var middleware = micropub.create();
    
    beforeEach('mock request', function() {
      request = {
        method: 'post',
        headers: { 'content-type': 'application/x-www-form-urlencoded', },
        url: 'https://example.com/client',
      };
    });

    it('should error with `mp-action` property', function() {
      request.body = {
        'mp-action': 'update',
        add: { content: 'Test', },
      };

      middleware(request, {}, function(err) {
        expect(err.statusCode).to.equal(400);
      });
    });

    it('should error with `url` property', function() {
      request.body = {
        h: 'entry',
        url: 'https://example.com/notes/1',
      };

      middleware(request, {}, function(err) {
        expect(err.statusCode).to.equal(400);
      });
    });

    it('should error with update action directives', function() {
      request.body = {
        h: 'entry',
        add: { content: 'Test', },
      };

      middleware(request, {}, function(err) {
        expect(err.statusCode).to.equal(400);
      });
    });
    
    it('should error without `h` property', function() {
      request.body = {
        properties: { content: 'Test', },
      };

      middleware(request, {}, function(err) {
        expect(err.statusCode).to.equal(400);
      });
    });
    
  }); // error cases

  describe('corner cases', function() {

    var request;
    var middleware = micropub.create();
    
    beforeEach('mock request', function() {
      request = {
        method: 'post',
        headers: { 'content-type': 'application/x-www-form-urlencoded', },
        url: 'https://example.com/client',
      };
    });

    it('should correctly parse single string content', function() {
      request.body = {
        h: 'entry',
        properties: { content: 'Test', },
      };

      middleware(request, {}, function(err) {
        expect(request.micropub.properties.content)
          .to.include.something.with.property('value', 'Test');
      });
    });
    
  }); // corner cases

}); // connect-micropub :: create
