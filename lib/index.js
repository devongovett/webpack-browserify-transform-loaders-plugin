/**
 * @copyright 2015, Andrey Popp <8mayday@gmail.com>
 */

'use strict';

var _createDecoratedClass = require('babel-runtime/helpers/create-decorated-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _escapeRegexp = require('escape-regexp');

var _escapeRegexp2 = _interopRequireDefault(_escapeRegexp);

var _nodeCallbackAdapter = require('node-callback-adapter');

var _nodeCallbackAdapter2 = _interopRequireDefault(_nodeCallbackAdapter);

var _minimatch = require('minimatch');

var log = (0, _debug2['default'])('webpack-package-loaders-plugin');

var SPLIT_PATH = /(\/|\\)/;

function readFilePromise(fs, filename, encoding) {
  return new _bluebird2['default'](function (resolve, reject) {
    fs.readFile(filename, function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (encoding !== undefined) {
          data = data.toString(encoding);
        }
        resolve(data);
      }
    });
  });
}

function splitPath(path) {
  var parts = path.split(SPLIT_PATH);
  if (parts.length === 0) {
    return parts;
  } else if (parts[0].length === 0) {
    // when path starts with a slash, the first part is empty string
    return parts.slice(1);
  } else {
    return parts;
  }
}

function pathExists(fs, path) {
  return new _bluebird2['default'](function (resolve, reject) {
    fs.stat(path, function (err) {
      resolve(!err);
    });
  });
}

function findPackageMetadataFilename(fs, currentFullPath, clue) {
  currentFullPath = splitPath(currentFullPath);
  if (!Array.isArray(clue)) {
    clue = [clue];
  }
  return findPackageMetadataFilenameImpl(fs, currentFullPath, clue);
}

function findPackageMetadataFilenameImpl(fs, parts, clue) {
  var p, i, filename, exists;
  return _regeneratorRuntime.async(function findPackageMetadataFilenameImpl$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (!(parts.length === 0)) {
          context$1$0.next = 4;
          break;
        }

        return context$1$0.abrupt('return', { filename: null, dirname: null });

      case 4:
        p = parts.join('');
        i = 0;

      case 6:
        if (!(i < clue.length)) {
          context$1$0.next = 16;
          break;
        }

        filename = _path2['default'].join(p, clue[i]);
        context$1$0.next = 10;
        return _regeneratorRuntime.awrap(pathExists(fs, filename));

      case 10:
        exists = context$1$0.sent;

        if (!exists) {
          context$1$0.next = 13;
          break;
        }

        return context$1$0.abrupt('return', { filename: filename, dirname: p });

      case 13:
        i++;
        context$1$0.next = 6;
        break;

      case 16:
        return context$1$0.abrupt('return', findPackageMetadataFilenameImpl(fs, parts.slice(0, -1), clue));

      case 17:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function getByKeyPath(obj, keyPath) {
  for (var i = 0; i < keyPath.length; i++) {
    if (obj == null) {
      return;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

function parsePackageData(src, loadersKeyPath) {
  var data = JSON.parse(src);
  var loaders = getByKeyPath(data, loadersKeyPath);
  if (loaders) {
    loaders.forEach(function (loader) {
      if (typeof loader.loader === 'string') {
        loader.test = new _minimatch.Minimatch(loader.test);
      }
    });
  }
  return data;
}

function injectNoLoaders(packageData, packageDirname) {
  return [];
}

var DEFAULT_OPTIONS = {
  packageMeta: 'package.json',
  loadersKeyPath: ['browserify', 'transform'],
  injectLoaders: injectNoLoaders
};

function testPattern(pattern, string) {
  if (pattern instanceof RegExp) {
    return pattern.exec(string);
  } else if (pattern) {
    return pattern.match(string);
  } else {
    return false;
  }
}

/**
 * Plugin which injects per-package loaders.
 *
 * @param {Object} options Options object allows the following keys
 */

var PackageLoadersPlugin = (function () {
  function PackageLoadersPlugin(options) {
    _classCallCheck(this, PackageLoadersPlugin);

    this.options = _extends({}, DEFAULT_OPTIONS, options);
    this._packagesByDirectory = {};
    this._packageMetadatFilenameByDirectory = {};
    this._loadersByResource = {};
  }

  _createDecoratedClass(PackageLoadersPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      compiler.plugin('normal-module-factory', function (factory) {
        return factory.plugin('after-resolve', function (data, callback) {
          return _this.onAfterResolve(compiler, factory, data, callback);
        });
      });
    }
  }, {
    key: 'onAfterResolve',
    decorators: [_nodeCallbackAdapter2['default']],
    value: function onAfterResolve(compiler, factory, data) {
      var resolveLoader, fs, _ref, packageData, packageDirname, loaders, resourceRelative;

      return _regeneratorRuntime.async(function onAfterResolve$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            if (!(this._loadersByResource[data.resource] !== undefined)) {
              context$2$0.next = 2;
              break;
            }

            return context$2$0.abrupt('return', _extends({}, data, {
              loaders: data.loaders.concat(this._loadersByResource[data.resource])
            }));

          case 2:
            log('processing ' + data.resource + ' resource');
            resolveLoader = _bluebird2['default'].promisify(compiler.resolvers.loader.resolve);
            fs = compiler.inputFileSystem;
            context$2$0.next = 7;
            return _regeneratorRuntime.awrap(this.findPackageForResource(fs, data.resource));

          case 7:
            _ref = context$2$0.sent;
            packageData = _ref.packageData;
            packageDirname = _ref.packageDirname;

            if (packageData) {
              context$2$0.next = 12;
              break;
            }

            return context$2$0.abrupt('return', data);

          case 12:
            loaders = getByKeyPath(packageData, this.options.loadersKeyPath);

            if (!loaders) {
              loaders = [];
            }
            resourceRelative = _path2['default'].relative(packageDirname, data.resource);

            loaders = loaders.concat(this.options.injectLoaders(packageData, packageDirname, data.resource)).filter(function (loader) {
              return (testPattern(loader.test, resourceRelative) || testPattern(loader.include, resourceRelative)) && !testPattern(loader.exclude, resourceRelative);
            }).map(function (loader) {
              return resolveLoader(_path2['default'].dirname(data.resource), "transform?" + loader);
            }).reverse();
            context$2$0.next = 18;
            return _regeneratorRuntime.awrap(_bluebird2['default'].all(loaders));

          case 18:
            loaders = context$2$0.sent;

            this._loadersByResource[data.resource] = loaders;
            log('adding ' + loaders + ' loaders for ' + resourceRelative + ' resource');
            return context$2$0.abrupt('return', _extends({}, data, {
              loaders: loaders.concat(data.loaders)
            }));

          case 22:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }

    /**
     * Find a package metadata for a specified resource.
     */
  }, {
    key: 'findPackageForResource',
    value: function findPackageForResource(fs, resource) {
      var dirname, _ref2, packageDirname, packageMeta, packageData;

      return _regeneratorRuntime.async(function findPackageForResource$(context$2$0) {
        var _this2 = this;

        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            dirname = _path2['default'].dirname(resource);

            if (this._packageMetadatFilenameByDirectory[dirname] === undefined) {
              log('finding package directory for ' + dirname);
              this._packageMetadatFilenameByDirectory[dirname] = findPackageMetadataFilename(fs, dirname, this.options.packageMeta);
            }
            context$2$0.next = 4;
            return _regeneratorRuntime.awrap(this._packageMetadatFilenameByDirectory[dirname]);

          case 4:
            _ref2 = context$2$0.sent;
            packageDirname = _ref2.dirname;
            packageMeta = _ref2.filename;

            if (packageDirname) {
              context$2$0.next = 10;
              break;
            }

            log('no package metadata found for ' + resource + ' resource');
            return context$2$0.abrupt('return', { packageData: null, packageDirname: packageDirname });

          case 10:
            if (this._packagesByDirectory[packageDirname] === undefined) {
              this._packagesByDirectory[packageDirname] = _bluebird2['default']['try'](function callee$2$0() {
                var packageSource;
                return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
                  while (1) switch (context$3$0.prev = context$3$0.next) {
                    case 0:
                      log('reading package data for ' + packageDirname);
                      context$3$0.next = 3;
                      return _regeneratorRuntime.awrap(readFilePromise(fs, packageMeta, 'utf8'));

                    case 3:
                      packageSource = context$3$0.sent;
                      return context$3$0.abrupt('return', parsePackageData(packageSource, this.options.loadersKeyPath));

                    case 5:
                    case 'end':
                      return context$3$0.stop();
                  }
                }, null, _this2);
              });
            }
            context$2$0.next = 13;
            return _regeneratorRuntime.awrap(this._packagesByDirectory[packageDirname]);

          case 13:
            packageData = context$2$0.sent;
            return context$2$0.abrupt('return', { packageData: packageData, packageDirname: packageDirname });

          case 15:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }]);

  return PackageLoadersPlugin;
})();

exports['default'] = PackageLoadersPlugin;
module.exports = exports['default'];
