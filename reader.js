var when = require('when'),
    string = require('./string');

var TOKENS = /\s*(,@|[('`,)]|"(?:[\\].|[^\\"])*"|;.*|[^\s('"`,;)]*)(.*)/;

function Reader() {
  var port,
      buffer = '';

  function self() { return self; }

  self.port = function(_) {
    if(!arguments.length) return _;
    port = _;
    return self;
  }

  function next(str) {
    var matches = str.match(TOKENS);
    buffer = matches[2];
    return matches[1];
  }

  self.nextToken = function() {
    return when.iterate(
      function(d) { return buffer !== '' ? next(buffer) : readLine().then(next); },
      function(d) { return d !== '' && !d.startsWith(';') },
      function(d) { buffer = d; },
      next(buffer)).catch(function(e){console.log(e)});
  }

  function readLine() {
    var line = '',
        deferred = when.defer();
    port.resume();
    if(port === process.stdin) process.stdout.write('> ');
    port.once('data', function(char) {
      port.pause();
      if(char.contains('\n')) {
        var parts = char.split('\n');
        deferred.resolve(line + parts.shift());
        port.removeAllListeners('end');
        port.unshift(parts.join('\n'));
        line = '';
      } else {
        line += char;
        port.resume();
      }
    })
    .once('end', function() {
      deferred.resolve(line);
    });
    deferred.promise.catch(function(e){  console.log(e);});
    return deferred.promise;
  }

  return self;
}

module.exports = Reader();

