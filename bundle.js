(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js":[function(require,module,exports){
var trailingNewlineRegex = /\n[\s]+$/
var leadingNewlineRegex = /^\n[\s]+/
var trailingSpaceRegex = /[\s]+$/
var leadingSpaceRegex = /^[\s]+/
var multiSpaceRegex = /[\n\s]+/g

var TEXT_TAGS = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'amp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'
]

var VERBATIM_TAGS = [
  'code', 'pre', 'textarea'
]

module.exports = function appendChild (el, childs) {
  if (!Array.isArray(childs)) return

  var nodeName = el.nodeName.toLowerCase()

  var hadText = false
  var value, leader

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      appendChild(el, node)
      continue
    }

    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      typeof node === 'function' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }

    var lastChild = el.childNodes[el.childNodes.length - 1]

    // Iterate over text nodes
    if (typeof node === 'string') {
      hadText = true

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === '#text') {
        lastChild.nodeValue += node

      // We didn't have a text node yet, create one
      } else {
        node = document.createTextNode(node)
        el.appendChild(node)
        lastChild = node
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? '' : ' '
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, ' ')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

    // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')

          // Remove empty text nodes, append otherwise
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        // Trim the child nodes if the current node is not a node
        // where all whitespace must be preserved
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, ' ')
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName
      if (_nodeName) nodeName = _nodeName.toLowerCase()

      // Append the node to the DOM
      el.appendChild(node)
    }
  }
}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js":[function(require,module,exports){
var hyperx = require('hyperx')
var appendChild = require('./appendChild')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var COMMENT_TAG = '!--'

var SVG_TAGS = [
  'svg', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter',
  'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src',
  'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph',
  'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS.indexOf(key) !== -1) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  appendChild(el, children)
  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"./appendChild":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js","hyperx":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/csjs.js":[function(require,module,exports){
(function (global){(function (){
'use strict';

var csjs = require('csjs');
var insertCss = require('insert-css');

function csjsInserter() {
  var args = Array.prototype.slice.call(arguments);
  var result = csjs.apply(null, args);
  if (global.document) {
    insertCss(csjs.getCss(result));
  }
  return result;
}

module.exports = csjsInserter;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/index.js","insert-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/insert-css/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/get-css.js":[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/index.js":[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/csjs.js","./get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/csjs.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/csjs.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/index.js":[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/csjs.js","./get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/base62-encode.js":[function(require,module,exports){
'use strict';

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function encode(integer) {
  if (integer === 0) {
    return '0';
  }
  var str = '';
  while (integer > 0) {
    str = CHARS[integer % 62] + str;
    integer = Math.floor(integer / 62);
  }
  return str;
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/build-exports.js":[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

module.exports = function createExports(classes, keyframes, compositions) {
  var keyframesObj = Object.keys(keyframes).reduce(function(acc, key) {
    var val = keyframes[key];
    acc[val] = makeComposition([key], [val], true);
    return acc;
  }, {});

  var exports = Object.keys(classes).reduce(function(acc, key) {
    var val = classes[key];
    var composition = compositions[key];
    var extended = composition ? getClassChain(composition) : [];
    var allClasses = [key].concat(extended);
    var unscoped = allClasses.map(function(name) {
      return classes[name] ? classes[name] : name;
    });
    acc[val] = makeComposition(allClasses, unscoped);
    return acc;
  }, keyframesObj);

  return exports;
}

function getClassChain(obj) {
  var visited = {}, acc = [];

  function traverse(obj) {
    return Object.keys(obj).forEach(function(key) {
      if (!visited[key]) {
        visited[key] = true;
        acc.push(key);
        traverse(obj[key]);
      }
    });
  }

  traverse(obj);
  return acc;
}

},{"./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js":[function(require,module,exports){
'use strict';

module.exports = {
  makeComposition: makeComposition,
  isComposition: isComposition,
  ignoreComposition: ignoreComposition
};

/**
 * Returns an immutable composition object containing the given class names
 * @param  {array} classNames - The input array of class names
 * @return {Composition}      - An immutable object that holds multiple
 *                              representations of the class composition
 */
function makeComposition(classNames, unscoped, isAnimation) {
  var classString = classNames.join(' ');
  return Object.create(Composition.prototype, {
    classNames: { // the original array of class names
      value: Object.freeze(classNames),
      configurable: false,
      writable: false,
      enumerable: true
    },
    unscoped: { // the original array of class names
      value: Object.freeze(unscoped),
      configurable: false,
      writable: false,
      enumerable: true
    },
    className: { // space-separated class string for use in HTML
      value: classString,
      configurable: false,
      writable: false,
      enumerable: true
    },
    selector: { // comma-separated, period-prefixed string for use in CSS
      value: classNames.map(function(name) {
        return isAnimation ? name : '.' + name;
      }).join(', '),
      configurable: false,
      writable: false,
      enumerable: true
    },
    toString: { // toString() method, returns class string for use in HTML
      value: function() {
        return classString;
      },
      configurable: false,
      writeable: false,
      enumerable: false
    }
  });
}

/**
 * Returns whether the input value is a Composition
 * @param value      - value to check
 * @return {boolean} - whether value is a Composition or not
 */
function isComposition(value) {
  return value instanceof Composition;
}

function ignoreComposition(values) {
  return values.reduce(function(acc, val) {
    if (isComposition(val)) {
      val.classNames.forEach(function(name, i) {
        acc[name] = val.unscoped[i];
      });
    }
    return acc;
  }, {});
}

/**
 * Private constructor for use in `instanceof` checks
 */
function Composition() {}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/csjs.js":[function(require,module,exports){
'use strict';

var extractExtends = require('./css-extract-extends');
var composition = require('./composition');
var isComposition = composition.isComposition;
var ignoreComposition = composition.ignoreComposition;
var buildExports = require('./build-exports');
var scopify = require('./scopeify');
var cssKey = require('./css-key');
var extractExports = require('./extract-exports');

module.exports = function csjsTemplate(opts) {
  opts = (typeof opts === 'undefined') ? {} : opts;
  var noscope = (typeof opts.noscope === 'undefined') ? false : opts.noscope;

  return function csjsHandler(strings, values) {
    // Fast path to prevent arguments deopt
    var values = Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      values[i - 1] = arguments[i];
    }
    var css = joiner(strings, values.map(selectorize));
    var ignores = ignoreComposition(values);

    var scope = noscope ? extractExports(css) : scopify(css, ignores);
    var extracted = extractExtends(scope.css);
    var localClasses = without(scope.classes, ignores);
    var localKeyframes = without(scope.keyframes, ignores);
    var compositions = extracted.compositions;

    var exports = buildExports(localClasses, localKeyframes, compositions);

    return Object.defineProperty(exports, cssKey, {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: extracted.css
    });
  }
}

/**
 * Replaces class compositions with comma seperated class selectors
 * @param  value - the potential class composition
 * @return       - the original value or the selectorized class composition
 */
function selectorize(value) {
  return isComposition(value) ? value.selector : value;
}

/**
 * Joins template string literals and values
 * @param  {array} strings - array of strings
 * @param  {array} values  - array of values
 * @return {string}        - strings and values joined
 */
function joiner(strings, values) {
  return strings.map(function(str, i) {
    return (i !== values.length) ? str + values[i] : str;
  }).join('');
}

/**
 * Returns first object without keys of second
 * @param  {object} obj      - source object
 * @param  {object} unwanted - object with unwanted keys
 * @return {object}          - first object without unwanted keys
 */
function without(obj, unwanted) {
  return Object.keys(obj).reduce(function(acc, key) {
    if (!unwanted[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

},{"./build-exports":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/build-exports.js","./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js","./css-extract-extends":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-extract-extends.js","./css-key":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js","./extract-exports":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/extract-exports.js","./scopeify":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scopeify.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-extract-extends.js":[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

var regex = /\.([^\s]+)(\s+)(extends\s+)(\.[^{]+)/g;

module.exports = function extractExtends(css) {
  var found, matches = [];
  while (found = regex.exec(css)) {
    matches.unshift(found);
  }

  function extractCompositions(acc, match) {
    var extendee = getClassName(match[1]);
    var keyword = match[3];
    var extended = match[4];

    // remove from output css
    var index = match.index + match[1].length + match[2].length;
    var len = keyword.length + extended.length;
    acc.css = acc.css.slice(0, index) + " " + acc.css.slice(index + len + 1);

    var extendedClasses = splitter(extended);

    extendedClasses.forEach(function(className) {
      if (!acc.compositions[extendee]) {
        acc.compositions[extendee] = {};
      }
      if (!acc.compositions[className]) {
        acc.compositions[className] = {};
      }
      acc.compositions[extendee][className] = acc.compositions[className];
    });
    return acc;
  }

  return matches.reduce(extractCompositions, {
    css: css,
    compositions: {}
  });

};

function splitter(match) {
  return match.split(',').map(getClassName);
}

function getClassName(str) {
  var trimmed = str.trim();
  return trimmed[0] === '.' ? trimmed.substr(1) : trimmed;
}

},{"./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js":[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/extract-exports.js":[function(require,module,exports){
'use strict';

var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = extractExports;

function extractExports(css) {
  return {
    css: css,
    keyframes: getExport(css, keyframesRegex),
    classes: getExport(css, classRegex)
  };
}

function getExport(css, regex) {
  var prop = {};
  var match;
  while((match = regex.exec(css)) !== null) {
    var name = match[2];
    prop[name] = name;
  }
  return prop;
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/get-css.js":[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/hash-string.js":[function(require,module,exports){
'use strict';

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */

module.exports = function hashStr(str) {
  var hash = 5381;
  var i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0;
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js":[function(require,module,exports){
'use strict';

var findClasses = /(\.)(?!\d)([^\s\.,{\[>+~#:)]*)(?![^{]*})/.source;
var findKeyframes = /(@\S*keyframes\s*)([^{\s]*)/.source;
var ignoreComments = /(?!(?:[^*/]|\*[^/]|\/[^*])*\*+\/)/.source;

var classRegex = new RegExp(findClasses + ignoreComments, 'g');
var keyframesRegex = new RegExp(findKeyframes + ignoreComments, 'g');

module.exports = {
  classRegex: classRegex,
  keyframesRegex: keyframesRegex,
  ignoreComments: ignoreComments,
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/replace-animations.js":[function(require,module,exports){
var ignoreComments = require('./regex').ignoreComments;

module.exports = replaceAnimations;

function replaceAnimations(result) {
  var animations = Object.keys(result.keyframes).reduce(function(acc, key) {
    acc[result.keyframes[key]] = key;
    return acc;
  }, {});
  var unscoped = Object.keys(animations);

  if (unscoped.length) {
    var regexStr = '((?:animation|animation-name)\\s*:[^};]*)('
      + unscoped.join('|') + ')([;\\s])' + ignoreComments;
    var regex = new RegExp(regexStr, 'g');

    var replaced = result.css.replace(regex, function(match, preamble, name, ending) {
      return preamble + animations[name] + ending;
    });

    return {
      css: replaced,
      keyframes: result.keyframes,
      classes: result.classes
    }
  }

  return result;
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scoped-name.js":[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/base62-encode.js","./hash-string":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/hash-string.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scopeify.js":[function(require,module,exports){
'use strict';

var fileScoper = require('./scoped-name');
var replaceAnimations = require('./replace-animations');
var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = scopify;

function scopify(css, ignores) {
  var makeScopedName = fileScoper(css);
  var replacers = {
    classes: classRegex,
    keyframes: keyframesRegex
  };

  function scopeCss(result, key) {
    var replacer = replacers[key];
    function replaceFn(fullMatch, prefix, name) {
      var scopedName = ignores[name] ? name : makeScopedName(name);
      result[key][scopedName] = name;
      return prefix + scopedName;
    }
    return {
      css: result.css.replace(replacer, replaceFn),
      keyframes: result.keyframes,
      classes: result.classes
    };
  }

  var result = Object.keys(replacers).reduce(scopeCss, {
    css: css,
    keyframes: {},
    classes: {}
  });

  return replaceAnimations(result);
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js","./replace-animations":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/replace-animations.js","./scoped-name":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scoped-name.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperscript-attribute-to-property/index.js":[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js":[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else if (xstate === COMMENT && opts.comments) {
          reg += String(arg)
        } else if (xstate !== COMMENT) {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      if (opts.createFragment) return opts.createFragment(tree[2])
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else if (x === null || x === undefined) return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperscript-attribute-to-property/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/insert-css/index.js":[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/datdot-wallet.js":[function(require,module,exports){
const bel = require('bel')
const csjs = require('csjs-inject')

// components
const layout = require('layout')

module.exports = wallet

function wallet () {
  const css = style
  const el = bel`
  <main class=${css.wrap}>
    ${layout()}
  </main>
  `
  document.body.append(el)
}

let style = csjs`
:root {
  /* define colors ---------------------------------------------*/  
  --b: 0, 0%;
  --r: 100%, 50%;
  --color-white: var(--b), 100%;
  --color-black: var(--b), 0%;
  --color-dark: 223, 13%, 20%;
  --color-deep-black: 222, 18%, 11%;
  --color-red: 358, 99%, 53%;
  --color-amaranth-pink: 329, 100%, 65%;
  --color-persian-rose: 323, 100%, 50%;
  --color-orange: 32, var(--r);
  --color-light-orange: 36, 100%, 55%;
  --color-safety-orange: 27, 100%, 50%;
  --color-deep-saffron: 31, 100%, 56%;
  --color-ultra-red: 348, 96%, 71%;
  --color-flame: 15, 80%, 50%;
  --color-verdigris: 180, 54%, 43%;
  --color-viridian-green: 180, 100%, 63%;
  --color-blue: 214, 100%, 49%;
  --color-heavy-blue: 233, var(--r);
  --color-maya-blue: 205, 96%, 72%;
  --color-slate-blue: 248, 56%, 59%;
  --color-blue-jeans: 204, 96%, 61%;
  --color-dodger-blue: 213, 90%, 59%;
  --color-light-green: 97, 86%, 77%;
  --color-lime-green: 127, 100%, 40%;
  --color-slimy-green: 108, 100%, 28%;
  --color-maximum-blue-green: 180, 54%, 51%;
  --color-deep-green: 136, 79%, 22%;
  --color-green: 136, 82%, 38%;
  --color-lincoln-green: 97, 100%, 18%;
  --color-yellow: 44, 100%, 55%;
  --color-chrome-yellow: 39, var(--r);
  --color-bright-yellow-crayola: 35, 100%, 58%;
  --color-green-yellow-crayola: 51, 100%, 83%;
  --color-purple: 283, var(--r);
  --color-heliotrope: 288, 100%, 73%;
  --color-medium-purple: 269, 100%, 70%;
  --color-electric-violet: 276, 98%, 48%;
  --color-grey33: var(--b), 20%;
  --color-grey66: var(--b), 40%;
  --color-grey70: var(--b), 44%;
  --color-grey88: var(--b), 53%;
  --color-greyA2: var(--b), 64%;
  --color-greyC3: var(--b), 76%;
  --color-greyCB: var(--b), 80%;
  --color-greyD8: var(--b), 85%;
  --color-greyD9: var(--b), 85%;
  --color-greyE2: var(--b), 89%;
  --color-greyEB: var(--b), 92%;
  --color-greyED: var(--b), 93%;
  --color-greyEF: var(--b), 94%;
  --color-greyF2: var(--b), 95%;
  --transparent: transparent;
  /* define font ---------------------------------------------*/
  --snippet-font: Segoe UI Mono, Monospace, Cascadia Mono, Courier New, ui-monospace, Liberation Mono, Menlo, Monaco, Consolas;
  --size12: 1.2rem;
  --size13: 1.3rem;
  --size14: 1.4rem;
  --size15: 1.5rem;
  --size16: 1.6rem;
  --size18: 1.8rem;
  --size20: 2rem;
  --size22: 2.2rem;
  --size24: 2.4rem;
  --size26: 2.6rem;
  --size28: 2.8rem;
  --size30: 3rem;
  --size32: 3.2rem;
  --size34: 3.4rem;
  --size36: 3.6rem;
  --size38: 3.8rem;
  --size40: 4rem;
  --size42: 4.2rem;
  --size44: 4.4rem;
  --size46: 4.6rem;
  --size48: 4.8rem;
  --size50: 5rem;
  --size52: 5.2rem;
  --size54: 5.4rem;
  --size56: 5.6rem;
  --size58: 5.8rem;
  --size60: 6rem;
  --weight100: 100;
  --weight300: 300;
  --weight400: 400;
  --weight600: 600;
  --weight800: 800;
  /* define primary ---------------------------------------------*/
  --primary-body-bg-color: var(--color-greyF2);
  --primary-font: Arial, sens-serif;
  --primary-size: var(--size14);
  --primary-size-hover: var(--primary-size);
  --primary-weight: 300;
  --primary-weight-hover: 300;
  --primary-color: var(--color-black);
  --primary-color-hover: var(--color-white);
  --primary-bg-color: var(--color-white);
  --primary-bg-color-hover: var(--color-black);
  --primary-border-width: 1px;
  --primary-border-style: solid;
  --primary-border-color: var(--color-black);
  --primary-border-opacity: 1;
  --primary-radius: 8px;
  --primary-avatar-width: 100%;
  --primary-avatar-height: auto;
  --primary-avatar-radius: 0;
  --primary-disabled-size: var(--primary-size);
  --primary-disabled-color: var(--color-greyA2);
  --primary-disabled-bg-color: var(--color-greyEB);
  --primary-disabled-icon-size: var(--primary-icon-size);
  --primary-disabled-icon-fill: var(--color-greyA2);
  --primary-listbox-option-icon-size: 20px;
  --primary-listbox-option-avatar-width: 40px;
  --primary-listbox-option-avatar-height: auto;
  --primary-listbox-option-avatar-radius: var(--primary-avatar-radius);
  --primary-option-avatar-width: 30px;
  --primary-option-avatar-height: auto;
  --primary-list-avatar-width: 30px;
  --primary-list-avatar-height: auto;
  --primary-list-avatar-radius: var(--primary-avatar-radius);
  /* define icon settings ---------------------------------------------*/
  --primary-icon-size: var(--size16);
  --primary-icon-size-hover: var(--size16);
  --primary-icon-fill: var(--primary-color);
  --primary-icon-fill-hover: var(--primary-color-hover);
  /* define current ---------------------------------------------*/
  --current-size: var(--primary-size);
  --current-weight: var(--primary-weight);
  --current-color: var(--color-white);
  --current-bg-color: var(--color-black);
  --current-icon-size: var(--primary-icon-size);
  --current-icon-fill: var(--color-white);
  --current-list-selected-icon-size: var(--list-selected-icon-size);
  --current-list-selected-icon-fill: var(--color-white);
  --current-list-selected-icon-fill-hover: var(--color-white);
  --current-list-size: var(--current-size);
  --current-list-color: var(--current-color);
  --current-list-bg-color: var(--current-bg-color);
  --current-list-avatar-width: var(--primary-list-avatar-width);
  --current-list-avatar-height: var(--primary-list-avatar-height);
  /* role listbox settings ---------------------------------------------*/
  /*-- collapsed --*/
  --listbox-collapsed-bg-color: var(--primary-bg-color);
  --listbox-collapsed-bg-color-hover: var(--primary-bg-color-hover);
  --listbox-collapsed-icon-size: var(--size14);
  --listbox-collapsed-icon-size-hover: var(--size14);
  --listbox-collapsed-icon-fill: var(--primary-icon-fill);
  --listbox-collapsed-icon-fill-hover: var(--primary-icon-fill-hover);
  --listbox-collapsed-listbox-size: var(--primary-size);
  --listbox-collapsed-listbox-size-hover: var(--primary-size-hover);
  --listbox-collapsed-listbox-weight: var(--primary-weight);
  --listbox-collapsed-listbox-weight-hover: var(--primary-weight);
  --listbox-collapsed-listbox-color: var(--primary-color);
  --listbox-collapsed-listbox-color-hover: var(--primary-color-hover);
  --listbox-collapsed-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
  --listbox-collapsed-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
  --listbox-collapsed-listbox-icon-size: var(--primary-listbox-option-icon-size);
  --listbox-collapsed-listbox-icon-size-hover: var(--primary-listbox-option-icon-size);
  --listbox-collapsed-listbox-icon-fill: var(--color-blue);
  --listbox-collapsed-listbox-icon-fill-hover: var(--color-yellow);
  /*-- expanded ---*/
  --listbox-expanded-bg-color: var(--current-bg-color);
  --listbox-expanded-icon-size: var(--size14);
  --listbox-expanded-icon-fill: var(--color-light-green);
  --listbox-expanded-listbox-size: var(--size20);
  --listbox-expanded-listbox-weight: var(--primary-weight);
  --listbox-expanded-listbox-color: var(--current-color);
  --listbox-expanded-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
  --listbox-expanded-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
  --listbox-expanded-listbox-icon-size: var(--primary-listbox-option-icon-size);
  --listbox-expanded-listbox-icon-fill: var(--color-light-green);
  /* role option settings ---------------------------------------------*/
  --list-bg-color: var(--primary-bg-color);
  --list-bg-color-hover: var(--primary-bg-color-hover);
  --list-selected-icon-size: var(--size16);
  --list-selected-icon-size-hover: var(--list-selected-icon-size);
  --list-selected-icon-fill: var(--primary-icon-fill);
  --list-selected-icon-fill-hover: var(--primary-icon-fill-hover);
  /* role link settings ---------------------------------------------*/
  --link-size: var(--size14);
  --link-size-hover: var(--primary-link-size);
  --link-color: var(--color-heavy-blue);
  --link-color-hover: var(--color-dodger-blue);
  --link-bg-color: transparent;
  --link-icon-size: var(--size30);
  --link-icon-fill: var(--primary-link-color);
  --link-icon-fill-hover: var(--primary-link-color-hover);
  --link-avatar-width: 60px;
  --link-avatar-width-hover: var(--link-avatar-width);
  --link-avatar-height: auto;
  --link-avatar-height-hover: auto;
  --link-avatar-radius: 0;
  --link-disabled-size: var(--primary-link-size);
  --link-disabled-color: var(--color-greyA2);
  --link-disabled-bg-color: transparent;
  --link-disabled-icon-fill: var(--color-greyA2);
  /* role menuitem settings ---------------------------------------------*/
  --menu-size: var(--size15);
  --menu-size-hover: var(--menu-size);
  --menu-weight: var(--primary-weight);
  --menu-weigh-hover: var(--primary-weight);
  --menu-color: var(--primary-color);
  --menu-color-hover: var(--color-grey88);
  --menu-icon-size: 20px;
  --menu-icon-size-hover: var(--menu-icon-size);
  --menu-icon-fill: var(--primary-color);
  --menu-icon-fill-hover: var(--color-grey88);
  --menu-avatar-width: 50px;
  --menu-avatar-width-hover: var(--menu-avatar-width);
  --menu-avatar-height: auto;
  --menu-avatar-height-hover: var(--menu-avatar-height);
  --menu-avatar-radius: 0;
  --menu-disabled-color: var(--primary-disabled-color);
  --menu-disabled-size: var(--menu-size);
  --menu-disabled-weight: var(--primary-weight);
}
html {
  font-size: 62.5%;
  height: 100%;
}
*, *:before, *:after {
  box-sizing: border-box;
  position: relative;
}
body {
  -webkit-text-size-adjust: 100%;
  margin: 0;
  padding: 0;
  font-size: calc(var(--primary-size) + 2px);
  font-family: var(--primary-font);
  color: var(--primary-color);
  background-color: hsl( var(--primary-body-bg-color) );
  height: 100%;
  overflow: hidden;
}
img {
  width: 100%;
  height: auto;
}
h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
}
.wrap {
  display: grid;
}
`
},{"bel":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js","csjs-inject":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/index.js","layout":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/layout.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/layout.js":[function(require,module,exports){
const bel = require('bel')
const style_sheet = require('support-style-sheet')
module.exports = layout
function layout() {

    function widget () {
        const el = document.createElement('i-layout')
        const shadow = el.attachShadow({mode: 'open'})
        const content = bel`<section class="content"><h1>Datdot wallet</h1></section>`
        shadow.append(content)
        style_sheet(shadow, style)
        return el
    }

    const style = `
    :host(i-layout) {

    }
    `
    return widget()
}

},{"bel":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js":[function(require,module,exports){
module.exports = support_style_sheet
function support_style_sheet (root, style) {
    return (() => {
        try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(style)
            root.adoptedStyleSheets = [sheet]
            return true 
        } catch (error) { 
            const inject_style = `<style>${style}</style>`
            root.innerHTML = `${inject_style}`
            return false
        }
    })()
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/web/head.js":[function(require,module,exports){
module.exports = head

function head (lang = 'UTF-8', title = 'Datdot wallet') {
    document.documentElement.lang = 'en'
    document.title = title
    const lan = document.createElement('meta')
    const viewport = document.createElement('meta')
    const description = document.createElement('meta')
    lan.setAttribute('charset', lang)
    viewport.setAttribute('name', 'viewport')
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no')
    description.setAttribute('name', 'description')
    description.setAttribute('content', 'DatDot Wallet is a crypto wallet for datdot')
    document.head.append(lan, viewport, description)
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/web/wallet.js":[function(require,module,exports){
const wallet = require('..')
const head = require('./head')()
const el = wallet()
// fetch('http://localhost:9966/').then( x => x.text()).then(x => {
//   console.log({x})
// })

},{"..":"/Users/bxbcats/prj/play/web/datdot-wallet/src/datdot-wallet.js","./head":"/Users/bxbcats/prj/play/web/datdot-wallet/web/head.js"}]},{},["/Users/bxbcats/prj/play/web/datdot-wallet/web/wallet.js"]);
