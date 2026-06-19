// Minimal shell-quote stub - satisfies react-devtools-core import without being blocked

function quote(args) {
  return args.map(function(arg) {
    if (typeof arg === 'object') {
      return Object.keys(arg).map(function(k) {
        return k + '=' + quote([arg[k]]);
      }).join(' ');
    }
    if (/[^A-Za-z0-9_\-.,:\/@\n]/.test(arg)) {
      return "'" + arg.replace(/'/g, "'\\''") + "'";
    }
    return arg || "''";
  }).join(' ');
}

function parse(s, env) {
  var chunked = [];
  var match, state = 'normal';
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (state === 'normal') {
      if (c === "'") { state = 'single'; }
      else if (c === '"') { state = 'double'; }
      else if (c === ' ') { if (chunked.length) chunked.push(' '); }
      else { chunked.push(c); }
    } else if (state === 'single') {
      if (c === "'") { state = 'normal'; }
      else { chunked.push(c); }
    } else if (state === 'double') {
      if (c === '"') { state = 'normal'; }
      else { chunked.push(c); }
    }
  }
  return chunked.join('').split(' ').filter(Boolean);
}

exports.quote = quote;
exports.parse = parse;
