// Generated by CoffeeScript 1.4.0
(function() {
  var concat, indexOf, pouchdb, slice, sortedIndex;

  pouchdb = angular.module('pouchdb', ['ng']);

  slice = Array.prototype.slice;

  concat = Array.prototype.concat;

  sortedIndex = function(array, value, callback) {
    var high, low, mid;
    low = 0;
    high = array != null ? array.length : low;
    callback = callback || identity;
    value = callback(value);
    while (low < high) {
      mid = (low + high) >>> 1;
      if (callback(array[mid]) < value) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  };

  indexOf = function(array, value, callback) {
    var idx;
    idx = sortedIndex(array, value, callback);
    if (array[idx] === value(idx)) {

    } else {
      return -1;
    }
  };

  pouchdb.provider('pouchdb', function() {
    return {
      withAllDbsEnabled: function() {
        return PouchDB.enableAllDbs = true;
      },
      $get: function($q, $rootScope) {
        var qify;
        qify = function(fn) {
          return function() {
            var args, callback, deferred;
            deferred = $q.defer();
            callback = function(err, res) {
              return $rootScope.$apply(function() {
                if (err) {
                  return deferred.reject(err);
                } else {
                  return deferred.resolve(res);
                }
              });
            };
            args = arguments != null ? slice.call(arguments) : [];
            args.push(callback);
            fn.apply(this, args);
            return deferred.promise;
          };
        };
        return {
          create: function(name, options) {
            var db;
            db = new PouchDB(name, options);
            return {
              id: db.id,
              put: qify(db.put),
              post: qify(db.post),
              get: qify(db.get),
              remove: qify(db.remove),
              bulkDocs: qify(db.bulkDocs),
              allDocs: qify(db.allDocs),
              changes: function(options) {
                var clone;
                clone = angular.copy(options);
                clone.onChange = function(change) {
                  return $rootScope.$apply(function() {
                    return options.onChange(change);
                  });
                };
                return db.changes(clone);
              },
              putAttachment: qify(db.putAttachment),
              getAttachment: qify(db.getAttachment),
              removeAttachment: qify(db.removeAttachment),
              query: qify(db.query),
              info: qify(db.info),
              compact: qify(db.compact),
              revsDiff: qify(db.revsDiff)
            };
          },
          allDbs: qify(PouchDB.allDbs),
          destroy: qify(PouchDB.destroy),
          replicate: PouchDB.replicate
        };
      }
    };
  });

  pouchdb.directive('pouchRepeat', function($parse, $animate) {
    return {
      transclude: 'element',
      priority: 10,
      compile: function(elem, attrs, transclude) {
        return function($scope, $element, $attr) {
          var add, blocks, collection, cursor, fld, getters, parent, remove, sort, top, update, vectorOf, _ref;
          parent = $element.parent();
          top = angular.element(document.createElement('div'));
          parent.append(top);
          _ref = /^\s*([a-zA-Z0-9]+)\s*in\s*([a-zA-Z0-9]+)\s*(?:order by\s*([a-zA-Z0-9\.,]+))?$/.exec($attr.pouchRepeat).splice(1), cursor = _ref[0], collection = _ref[1], sort = _ref[2];
          blocks = [];
          vectorOf = sort != null ? (getters = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = sort.split(',');
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              fld = _ref1[_i];
              _results.push($parse(fld));
            }
            return _results;
          })(), console.info('getters', getters), function(doc) {
            var getter, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = getters.length; _i < _len; _i++) {
              getter = getters[_i];
              _results.push(getter(doc));
            }
            return _results;
          }) : null;
          add = function(doc) {
            var childScope;
            childScope = $scope.$new();
            childScope[cursor] = doc;
            return transclude(childScope, function(clone) {
              var block, index, last, preceding;
              block = {
                doc: doc,
                clone: clone,
                scope: childScope,
                vector: vectorOf != null ? vectorOf(doc) : null
              };
              last = blocks[blocks.length - 1];
              if (vectorOf != null) {
                console.info('Block vector', block.vector);
                console.info('Blocks', blocks);
                index = sortedIndex(blocks, block, function(block) {
                  return block.vector;
                });
                console.info('Index', index);
                preceding = index > 0 ? blocks[index - 1] : null;
                if (preceding != null) {
                  console.info("Adding after", doc, preceding.doc);
                }
                $animate.enter(clone, parent, preceding != null ? preceding.clone : top);
                return blocks = concat.call(slice.call(blocks, 0, index - 1), [block], slice.call(blocks, index));
              } else {
                blocks.push(block);
                if (last != null) {
                  return $animate.enter(clone, parent, last.clone);
                } else {
                  return $animate.enter(clone, parent, top);
                }
              }
            });
          };
          update = function(doc) {
            var block, idx, newidx, stripped, wrapped;
            wrapped = {
              doc: doc
            };
            idx = indexOf(blocks, wrapped, function(block) {
              return block.doc.id;
            });
            block = blocks[idx];
            block.scope[cursor] = doc;
            block.vector = vectorOf(doc);
            stripped = concat.call(slice.call(blocks, 0, idx - 1), slice.call(blocks, idx + 1));
            newidx = sortedIndex(stripped, block, function(block) {
              return block.vector;
            });
            blocks = concat.call(slice.call(blocks, 0, newidx - 1), [block], slice.call(blocks, newidx));
            return $animate.move(block.clone, parent, newidx > 0 ? blocks[newidx - 1] : top);
          };
          remove = function(doc) {
            var block, idx, wrapped;
            wrapped = {
              doc: doc
            };
            idx = indexOf(blocks, wrapped, function(block) {
              return block.doc.id;
            });
            block = blocks[idx];
            if (block != null) {
              return block.scope.$destroy();
            }
          };
          return $scope.$watch(collection, function() {
            var process;
            process = function(result) {
              var row, _i, _len, _ref1, _results;
              _ref1 = result.rows;
              _results = [];
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                row = _ref1[_i];
                _results.push(add(row.doc));
              }
              return _results;
            };
            $scope[collection].allDocs({
              include_docs: true
            }).then(process);
            $scope[collection].info().then(function(info) {
              return $scope[collection].changes({
                include_docs: true,
                continuous: true,
                since: info.update_seq,
                onChange: function(update) {
                  var idx;
                  if (update.deleted) {
                    return remove(update.doc);
                  } else {
                    idx = indexOf(blocks, {
                      doc: updated.doc
                    }, function(block) {
                      return block.doc.id;
                    });
                    if (idx >= 0) {
                      return update(update.doc);
                    } else {
                      return add(update.doc);
                    }
                  }
                }
              });
            });
          });
        };
      }
    };
  });

}).call(this);
