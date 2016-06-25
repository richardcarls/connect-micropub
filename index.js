var _ = require('lodash');
var throwjs = require('throw.js');
var bodyParser = require('body-parser');

var reservedRootProperties = [
  'access_token',
  'h',
  'q',
];

var reservedPrefix = 'mp-';

var updateDirectives = [
  'replace',
  'add',
  'delete',
];

/**
 * Middleware for handling a micropub create action
 * 
 * @param {Object|null} [options] - The options object
 * @param {Boolean} [options.urlencoded=true] - Support for x-www-form-urlencoded
 * @return {middleware} - The middleware function
 */
module.exports.create = function(options) {
  options = options || {};

  options.urlencoded = options.urlencoded !== false;

  var middleware = [];
  
  if (options.urlencoded) {
    middleware.push(bodyParser.urlencoded({ extended: true, }));
  }

  if (options.json) {
    middleware.push(bodyParser.json());
  }

  middleware.push(create);

  return function compose(req, res, next) {
    return middleware.reduce(function(a, b) {
      return a(req, res, function composeCB(err) {
        if (err) { return next(err); }
        
        return b(req, res, next);
      });
    });
  }
  
  /**
   * middleware
   */
  function create(req, res, next) {
    if (req.micropub) { return next(); }

    req.micropub = {};
    
    if (_.isEmpty(req.body)) { return next(); }

    if (req.body['mp-action']) {
      return next(
        new throwjs.badRequest('Use `handleUpdate` or `handleDelete`')
      );
    }

    if (req.body.url) {
      return next(
        new throwjs.badRequest('Cannot specify property `url` for Create action')
      );
    }

    if (req.body.replace ||
        req.body.add ||
        req.body.delete) {
      return next(
        new throwjs.badRequest('Cannot specify Update directives for Create action')
      );
    }
    
    parse(req.body, function(err, mfData) {
      if (err) {
        return next(
          new throwjs.badRequest('Error parsing request')
        );
      }

      req.micropub = mfData;
    });
  }
  
};

module.exports.query = function(options) {
  options = options || {};

  return function middleware(req, res, next) {
    return next();
  };
};


/**
 * @private
 */
function parse(root, callback) {
  if (!root.h && !root.type) {
    return callback(
      new TypeError('Missing required `type` property')
    );
  }
  
  var mfData = {
    type: [(root.type || 'h-' + root.h)],
    properties: {}
  };

  var properties = root.properties || root;

  var key, value;
  for (key in properties) {
    // Filter reserved root properties
    if ((reservedRootProperties.indexOf(key) !== -1) ||
        _.startsWith(key, reservedPrefix)) {
      continue;
    }
    
    value = properties[key];

    // Allow simple content property
    if (key === 'content' && _.isString(value)) {
      value = { value: value, };
    }
    
    // Ensure all values are arrays
    if (!Array.isArray(value)) {
      value = [value];
    }
    
    value.forEach(function(subvalue) {
      // Handle embedded items
      if (subvalue.type) {
        parse(subvalue, function(err, mfData) {
          if (err) { return callback(err, null); }
          subvalue = mfData;
        });
      }
      
      mfData.properties[key] = mfData.properties[key] || [];
      mfData.properties[key].push(subvalue);
    });
  }

  return callback(null, mfData);
}
