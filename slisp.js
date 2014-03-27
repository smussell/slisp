#!/usr/bin/env node

var TOKEN_REGEX = /(\(|\))/g,
    NUMBER = /^-?\d+\.?\d*$/g;

var specials = {
  "quote": function(x, env) { return x[1]; },
  
  "def": function(x, env) {
    env[x[1]] = eval(x[2], env);
    return env[x[1]];
  },
  
  "lambda": function(x, env) {
    return function(){ return eval(x[2], Env(x[1], arguments, env)); };
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
    env.find(x[1])[x[1]] = val;
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
  env.find = function(name) {
    if(!env[name] && !env.parent) return undefined;
    return env[name] ? env : env.parent.find(name);
  };
  return env;
}

function eval(x, env) {
  if( typeof x === "string" ) {
    return env.find(x)[x]; 
  } else if( !(x instanceof Array) ) {
    return x;
  } else if( specials[x[0]] ) {
    return (specials[x[0]])(x, env);
  } else {
    var exps = x.map(function(exp){ return eval(exp, env); }),
        func = exps.splice(0,1)[0];
    return func.apply(null, exps);
  }
} 

function tokenize(s) {
  return s.replace(TOKEN_REGEX, ' $1 ').trim().split(' ').reverse().filter(function(d){ return d !== ''; });
}

function parse(tokens) {
  if(!tokens.length) throw "unexpected EOF"
  var tok = tokens.pop();
  switch(tok) {
    case '(':
      var newList = [];
      while(tokens[tokens.length-1] !== ')') {
        newList.push(parse(tokens));
      }
      tokens.pop();
      return newList;
    case ')':
      throw "unexpected";
    default:
      return atom(tok);
  }
}

function atom(token) {
  var num = token.match(NUMBER);
  return num !== null ? +num[0] : token;
}

var prompt = require('sync-prompt').prompt;
var globalEnv = Env([], [], globals());
function run() {
  while(true) {
    var input = prompt('> ');
    if(input) {
      var parsed = parse(tokenize(input));
      console.log(eval(parsed, globalEnv));  
    }
  }
}

run();