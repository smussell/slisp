#!/usr/bin/env node

var string = require('./string'),
    Reader = require('./reader'),
    when = require('when');

var TOKEN_REGEX = /\s*(,@|[('`,)]|"(?:[\\].|[^\\"])*"|;.*|[^\s('"`,;)]*)(.*)/,
    NUMBER = /^-?\d+\.?\d*$/g;

var Symbol = function(val){ this.val = val; },
    symTable = {},
    Sym = function(val) { if(!symTable[val]) symTable[val] = new Symbol(val); return symTable[val]; };

var specials = {
  "quote": function(x, env) { return x[1]; },

  "def": function(x, env) {
    env[x[1].val] = eval(x[2], env);
    return env[x[1].val];
  },

  "^": function(x, env) {
    return function(){ return eval(x[2], Env(x[1].map(function(d){return d.val;}), arguments, env)); };
  },

  "begin": function(x, env) {
    var val;
    [].slice.call(x, 1).forEach(function(exp){
      val = eval(exp, env);
    });
    return val;
  },

  "set!": function(x, env) {
    var val = eval(x[2], env)
    env.find(x[1])[x[1].val] = val;
    return val;
  },

  "if": function(x, env) {
    return eval(eval(x[1], env) ? x[2] : x[3], env);
  }
}

function globals() {
  function createOp(action){ return function() { return [].reduce.call(arguments,action); } }
  return Env([], [], undefined, {
    '+': createOp(function(a,b){ return a+b; }),
    '-': createOp(function(a,b){ return a-b; }),
    '/': createOp(function(a,b){ return a/b; }),
    '*': createOp(function(a,b){ return a*b; }),
    '<': createOp(function(a,b){ return a<b; }),
    '>': createOp(function(a,b){ return a>b; }),
    '=': createOp(function(a,b){ return a===b; }),
    '%': function(a, b){ return a % b; },
    'not': function(a){ return !a; }
  });
}

function Env(vars, args, parent, defaults) {
  var env = defaults || {};
  vars.forEach( function(v, i){ env[v] = args[i]; } );
  env.parent = parent;
  env.find = function(symbol) {
    if(!env[symbol.val] && !env.parent) return undefined;
    return env[symbol.val] ? env : env.parent.find(symbol);
  };
  return env;
}

function eval(x, env) {
  if( x instanceof Symbol ) {
    return env.find(x)[x.val];
  } else if( !(x instanceof Array) ) {
    return x;
  } else if( x[0].val && specials[x[0].val] ) {
    return (specials[x[0].val])(x, env);
  } else {
    var exps = x.map(function(exp){ return eval(exp, env); }),
        func = exps.splice(0,1)[0];
    return func.apply(null, exps);
  }
}

function parse(reader) {
  function unspool(tok) {
    var defer = when.defer();
    if(tok === '(') {
      var newList = [];
      when.iterate(
          function(d) { return reader.nextToken(); },
          function(d) { return d === ')'; },
          function(d) { return unspool(d).then(function(v){ return newList.push(v);}); },
          reader.nextToken())
        .done(function(d){ defer.resolve(newList); });
    } else if(tok === ')') {
      throw 'unexpcted'
    } else {
      defer.resolve(atom(tok));
    }
    return defer.promise;
  }
  return reader.nextToken().then(unspool);
}

function atom(token) {
  if(token === "#t") return true;
  if(token === "#f") return false;
  if(token.startsWith('"')) return token.substring(1, token.length-1);
  var num = token.match(NUMBER);
  return num !== null ? +num[0] : Sym(token);
}

var prompt = require('sync-prompt').prompt,
    globalEnv = Env([], [], globals()),
    reader = Reader().port(process.stdin);
    
function run() {
  parse(reader).then( function(val) { 
    console.log(eval(val, globalEnv));
    run();
  }).catch(console.log.bind(console));
}
process.stdin.resume();
process.stdin.setEncoding('utf8');
run();
