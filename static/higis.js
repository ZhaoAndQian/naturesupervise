$.fn.drag = function (onmove, onstart, onend) {
    var _document = $(document);
    var _body = $(document.body);
    var _mouseup = function (e) {
        onend(e);
        _body.unbind("selectstart");
        _document.off("mousemove", onmove).off("mouseup", _mouseup);
    };
    this.on("mousedown", function (e) {
        if (e.button === 0) {
            onstart(e);
            _body.bind("selectstart", function () {
                return false;
            });
            _document.on("mousemove", onmove).on("mouseup", _mouseup);
        }
    });
};

(function (window, document, undefined) {
    var oldL = window.L, L = {};
    L.version = "0.7.2";
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = L;
    } else if (typeof define === "function" && define.amd) {
        define(L);
    }
    L.noConflict = function () {
        window.L = oldL;
        return this;
    };
    window.L = L;
    L.Util = {
        extend: function (dest) {
            var sources = Array.prototype.slice.call(arguments, 1), i, j, len, src;
            for (j = 0, len = sources.length; j < len; j++) {
                src = sources[j] || {};
                for (i in src) {
                    if (src.hasOwnProperty(i)) {
                        dest[i] = src[i];
                    }
                }
            }
            return dest;
        },
        bind: function (fn, obj) {
            var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
            return function () {
                return fn.apply(obj, args || arguments);
            };
        },
        stamp: function () {
            var lastId = 0, key = "_leaflet_id";
            return function (obj) {
                obj[key] = obj[key] || ++lastId;
                return obj[key];
            };
        }(),
        invokeEach: function (obj, method, context) {
            var i, args;
            if (typeof obj === "object") {
                args = Array.prototype.slice.call(arguments, 3);
                for (i in obj) {
                    method.apply(context, [i, obj[i]].concat(args));
                }
                return true;
            }
            return false;
        },
        limitExecByInterval: function (fn, time, context) {
            var lock, execOnUnlock;
            return function wrapperFn() {
                var args = arguments;
                if (lock) {
                    execOnUnlock = true;
                    return;
                }
                lock = true;
                setTimeout(function () {
                    lock = false;
                    if (execOnUnlock) {
                        wrapperFn.apply(context, args);
                        execOnUnlock = false;
                    }
                }, time);
                fn.apply(context, args);
            };
        },
        falseFn: function () {
            return false;
        },
        formatNum: function (num, digits) {
            var pow = Math.pow(10, digits || 5);
            return Math.round(num * pow) / pow;
        },
        trim: function (str) {
            return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "");
        },
        splitWords: function (str) {
            return L.Util.trim(str).split(/\s+/);
        },
        setOptions: function (obj, options) {
            obj.options = L.extend({}, obj.options, options);
            return obj.options;
        },
        getParamString: function (obj, existingUrl, uppercase) {
            var params = [];
            for (var i in obj) {
                params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + "=" + encodeURIComponent(obj[i]));
            }
            return (!existingUrl || existingUrl.indexOf("?") === -1 ? "?" : "&") + params.join("&");
        },
        template: function (str, data) {
            return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
                var value = data[key];
                if (value === undefined) {
                    throw new Error("No value provided for variable " + str);
                } else if (typeof value === "function") {
                    value = value(data);
                }
                return value;
            });
        },
        isArray: Array.isArray || function (obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        },
        emptyImageUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
    };
    (function () {
        function getPrefixed(name) {
            var i, fn, prefixes = ["webkit", "moz", "o", "ms"];
            for (i = 0; i < prefixes.length && !fn; i++) {
                fn = window[prefixes[i] + name];
            }
            return fn;
        }

        var lastTime = 0;

        function timeoutDefer(fn) {
            var time = +new Date(), timeToCall = Math.max(0, 16 - (time - lastTime));
            lastTime = time + timeToCall;
            return window.setTimeout(fn, timeToCall);
        }

        var requestFn = window.requestAnimationFrame || getPrefixed("RequestAnimationFrame") || timeoutDefer;
        var cancelFn = window.cancelAnimationFrame || getPrefixed("CancelAnimationFrame") || getPrefixed("CancelRequestAnimationFrame") || function (id) {
                window.clearTimeout(id);
            };
        L.Util.requestAnimFrame = function (fn, context, immediate, element) {
            fn = L.bind(fn, context);
            if (immediate && requestFn === timeoutDefer) {
                fn();
            } else {
                return requestFn.call(window, fn, element);
            }
        };
        L.Util.cancelAnimFrame = function (id) {
            if (id) {
                cancelFn.call(window, id);
            }
        };
    })();
    L.extend = L.Util.extend;
    L.bind = L.Util.bind;
    L.stamp = L.Util.stamp;
    L.setOptions = L.Util.setOptions;
    L.Class = function () {
    };
    L.Class.extend = function (props) {
        var NewClass = function () {
            if (this.initialize) {
                this.initialize.apply(this, arguments);
            }
            if (this._initHooks) {
                this.callInitHooks();
            }
        };
        var F = function () {
        };
        F.prototype = this.prototype;
        var proto = new F();
        proto.constructor = NewClass;
        NewClass.prototype = proto;
        for (var i in this) {
            if (this.hasOwnProperty(i) && i !== "prototype") {
                NewClass[i] = this[i];
            }
        }
        if (props.statics) {
            L.extend(NewClass, props.statics);
            delete props.statics;
        }
        if (props.includes) {
            L.Util.extend.apply(null, [proto].concat(props.includes));
            delete props.includes;
        }
        if (props.options && proto.options) {
            props.options = L.extend({}, proto.options, props.options);
        }
        L.extend(proto, props);
        proto._initHooks = [];
        var parent = this;
        NewClass.__super__ = parent.prototype;
        proto.callInitHooks = function () {
            if (this._initHooksCalled) {
                return;
            }
            if (parent.prototype.callInitHooks) {
                parent.prototype.callInitHooks.call(this);
            }
            this._initHooksCalled = true;
            for (var i = 0, len = proto._initHooks.length; i < len; i++) {
                proto._initHooks[i].call(this);
            }
        };
        return NewClass;
    };
    L.Class.include = function (props) {
        L.extend(this.prototype, props);
    };
    L.Class.mergeOptions = function (options) {
        L.extend(this.prototype.options, options);
    };
    L.Class.addInitHook = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        var init = typeof fn === "function" ? fn : function () {
            this[fn].apply(this, args);
        };
        this.prototype._initHooks = this.prototype._initHooks || [];
        this.prototype._initHooks.push(init);
    };
    var eventsKey = "_leaflet_events";
    L.Mixin = {};
    L.Mixin.Events = {
        addEventListener: function (types, fn, context) {
            if (L.Util.invokeEach(types, this.addEventListener, this, fn, context)) {
                return this;
            }
            var events = this[eventsKey] = this[eventsKey] || {}, contextId = context && context !== this && L.stamp(context), i, len, event, type, indexKey, indexLenKey, typeIndex;
            types = L.Util.splitWords(types);
            for (i = 0, len = types.length; i < len; i++) {
                event = {
                    action: fn,
                    context: context || this
                };
                type = types[i];
                if (contextId) {
                    indexKey = type + "_idx";
                    indexLenKey = indexKey + "_len";
                    typeIndex = events[indexKey] = events[indexKey] || {};
                    if (!typeIndex[contextId]) {
                        typeIndex[contextId] = [];
                        events[indexLenKey] = (events[indexLenKey] || 0) + 1;
                    }
                    typeIndex[contextId].push(event);
                } else {
                    events[type] = events[type] || [];
                    events[type].push(event);
                }
            }
            return this;
        },
        hasEventListeners: function (type) {
            var events = this[eventsKey];
            return !!events && (type in events && events[type].length > 0 || type + "_idx" in events && events[type + "_idx_len"] > 0);
        },
        removeEventListener: function (types, fn, context) {
            if (!this[eventsKey]) {
                return this;
            }
            if (!types) {
                return this.clearAllEventListeners();
            }
            if (L.Util.invokeEach(types, this.removeEventListener, this, fn, context)) {
                return this;
            }
            var events = this[eventsKey], contextId = context && context !== this && L.stamp(context), i, len, type, listeners, j, indexKey, indexLenKey, typeIndex, removed;
            types = L.Util.splitWords(types);
            for (i = 0, len = types.length; i < len; i++) {
                type = types[i];
                indexKey = type + "_idx";
                indexLenKey = indexKey + "_len";
                typeIndex = events[indexKey];
                if (!fn) {
                    delete events[type];
                    delete events[indexKey];
                    delete events[indexLenKey];
                } else {
                    listeners = contextId && typeIndex ? typeIndex[contextId] : events[type];
                    if (listeners) {
                        for (j = listeners.length - 1; j >= 0; j--) {
                            if (listeners[j].action === fn && (!context || listeners[j].context === context)) {
                                removed = listeners.splice(j, 1);
                                removed[0].action = L.Util.falseFn;
                            }
                        }
                        if (context && typeIndex && listeners.length === 0) {
                            delete typeIndex[contextId];
                            events[indexLenKey]--;
                        }
                    }
                }
            }
            return this;
        },
        clearAllEventListeners: function () {
            delete this[eventsKey];
            return this;
        },
        fireEvent: function (type, data) {
            if (!this.hasEventListeners(type)) {
                return this;
            }
            var event = L.Util.extend({}, data, {
                type: type,
                target: this
            });
            var events = this[eventsKey], listeners, i, len, typeIndex, contextId;
            if (events[type]) {
                listeners = events[type].slice();
                for (i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].action.call(listeners[i].context, event);
                }
            }
            typeIndex = events[type + "_idx"];
            for (contextId in typeIndex) {
                listeners = typeIndex[contextId].slice();
                if (listeners) {
                    for (i = 0, len = listeners.length; i < len; i++) {
                        listeners[i].action.call(listeners[i].context, event);
                    }
                }
            }
            return this;
        },
        addOneTimeEventListener: function (types, fn, context) {
            if (L.Util.invokeEach(types, this.addOneTimeEventListener, this, fn, context)) {
                return this;
            }
            var handler = L.bind(function () {
                this.removeEventListener(types, fn, context).removeEventListener(types, handler, context);
            }, this);
            return this.addEventListener(types, fn, context).addEventListener(types, handler, context);
        }
    };
    L.Mixin.Events.on = L.Mixin.Events.addEventListener;
    L.Mixin.Events.off = L.Mixin.Events.removeEventListener;
    L.Mixin.Events.once = L.Mixin.Events.addOneTimeEventListener;
    L.Mixin.Events.fire = L.Mixin.Events.fireEvent;
    (function () {
        var ie = "ActiveXObject" in window, ielt9 = ie && !document.addEventListener, ua = navigator.userAgent.toLowerCase(), webkit = ua.indexOf("webkit") !== -1, chrome = ua.indexOf("chrome") !== -1, phantomjs = ua.indexOf("phantom") !== -1, android = ua.indexOf("android") !== -1, android23 = ua.search("android [23]") !== -1, gecko = ua.indexOf("gecko") !== -1, mobile = typeof orientation !== undefined + "", msPointer = window.navigator && window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints && !window.PointerEvent, pointer = window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints || msPointer, retina = "devicePixelRatio" in window && window.devicePixelRatio > 1 || "matchMedia" in window && window.matchMedia("(min-resolution:144dpi)") && window.matchMedia("(min-resolution:144dpi)").matches, doc = document.documentElement, ie3d = ie && "transition" in doc.style, webkit3d = "WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix() && !android23, gecko3d = "MozPerspective" in doc.style, opera3d = "OTransition" in doc.style, any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;
        var touch = !window.L_NO_TOUCH && !phantomjs && function () {
                var startName = "ontouchstart";
                if (pointer || startName in doc) {
                    return true;
                }
                var div = document.createElement("div"), supported = false;
                if (!div.setAttribute) {
                    return false;
                }
                div.setAttribute(startName, "return;");
                if (typeof div[startName] === "function") {
                    supported = true;
                }
                div.removeAttribute(startName);
                div = null;
                return supported;
            }();
        L.Browser = {
            ie: ie,
            ielt9: ielt9,
            webkit: webkit,
            gecko: gecko && !webkit && !window.opera && !ie,
            android: android,
            android23: android23,
            chrome: chrome,
            ie3d: ie3d,
            webkit3d: webkit3d,
            gecko3d: gecko3d,
            opera3d: opera3d,
            any3d: any3d,
            mobile: mobile,
            mobileWebkit: mobile && webkit,
            mobileWebkit3d: mobile && webkit3d,
            mobileOpera: mobile && window.opera,
            touch: touch,
            msPointer: msPointer,
            pointer: pointer,
            retina: retina
        };
    })();
    L.Point = function (x, y, round) {
        this.x = round ? Math.round(x) : x;
        this.y = round ? Math.round(y) : y;
    };
    L.Point.prototype = {
        clone: function () {
            return new L.Point(this.x, this.y);
        },
        add: function (point) {
            return this.clone()._add(L.point(point));
        },
        _add: function (point) {
            this.x += point.x;
            this.y += point.y;
            return this;
        },
        subtract: function (point) {
            return this.clone()._subtract(L.point(point));
        },
        _subtract: function (point) {
            this.x -= point.x;
            this.y -= point.y;
            return this;
        },
        divideBy: function (num) {
            return this.clone()._divideBy(num);
        },
        _divideBy: function (num) {
            this.x /= num;
            this.y /= num;
            return this;
        },
        multiplyBy: function (num) {
            return this.clone()._multiplyBy(num);
        },
        _multiplyBy: function (num) {
            this.x *= num;
            this.y *= num;
            return this;
        },
        round: function () {
            return this.clone()._round();
        },
        _round: function () {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        },
        floor: function () {
            return this.clone()._floor();
        },
        _floor: function () {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            return this;
        },
        distanceTo: function (point) {
            point = L.point(point);
            var x = point.x - this.x, y = point.y - this.y;
            return Math.sqrt(x * x + y * y);
        },
        equals: function (point) {
            point = L.point(point);
            return point.x === this.x && point.y === this.y;
        },
        contains: function (point) {
            point = L.point(point);
            return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
        },
        toString: function () {
            return "Point(" + L.Util.formatNum(this.x) + ", " + L.Util.formatNum(this.y) + ")";
        }
    };
    L.point = function (x, y, round) {
        if (x instanceof L.Point) {
            return x;
        }
        if (L.Util.isArray(x)) {
            return new L.Point(x[0], x[1]);
        }
        if (x === undefined || x === null) {
            return x;
        }
        return new L.Point(x, y, round);
    };
    L.Bounds = function (a, b) {
        if (!a) {
            return;
        }
        var points = b ? [a, b] : a;
        for (var i = 0, len = points.length; i < len; i++) {
            this.extend(points[i]);
        }
    };
    L.Bounds.prototype = {
        extend: function (point) {
            point = L.point(point);
            if (!this.min && !this.max) {
                this.min = point.clone();
                this.max = point.clone();
            } else {
                this.min.x = Math.min(point.x, this.min.x);
                this.max.x = Math.max(point.x, this.max.x);
                this.min.y = Math.min(point.y, this.min.y);
                this.max.y = Math.max(point.y, this.max.y);
            }
            return this;
        },
        getCenter: function (round) {
            return new L.Point((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, round);
        },
        getBottomLeft: function () {
            return new L.Point(this.min.x, this.max.y);
        },
        getTopRight: function () {
            return new L.Point(this.max.x, this.min.y);
        },
        getSize: function () {
            return this.max.subtract(this.min);
        },
        contains: function (obj) {
            var min, max;
            if (typeof obj[0] === "number" || obj instanceof L.Point) {
                obj = L.point(obj);
            } else {
                obj = L.bounds(obj);
            }
            if (obj instanceof L.Bounds) {
                min = obj.min;
                max = obj.max;
            } else {
                min = max = obj;
            }
            return min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y;
        },
        intersects: function (bounds) {
            bounds = L.bounds(bounds);
            var min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xIntersects = max2.x >= min.x && min2.x <= max.x, yIntersects = max2.y >= min.y && min2.y <= max.y;
            return xIntersects && yIntersects;
        },
        isValid: function () {
            return !!(this.min && this.max);
        }
    };
    L.bounds = function (a, b) {
        if (!a || a instanceof L.Bounds) {
            return a;
        }
        return new L.Bounds(a, b);
    };
    L.Transformation = function (a, b, c, d) {
        this._a = a;
        this._b = b;
        this._c = c;
        this._d = d;
    };
    L.Transformation.prototype = {
        transform: function (point, scale) {
            return this._transform(point.clone(), scale);
        },
        _transform: function (point, scale) {
            scale = scale || 1;
            point.x = scale * (this._a * point.x + this._b);
            point.y = scale * (this._c * point.y + this._d);
            return point;
        },
        untransform: function (point, scale) {
            scale = scale || 1;
            return new L.Point((point.x / scale - this._b) / this._a, (point.y / scale - this._d) / this._c);
        }
    };
    L.DomUtil = {
        get: function (id) {
            return typeof id === "string" ? document.getElementById(id) : id;
        },
        getStyle: function (el, style) {
            var value = el.style[style];
            if (!value && el.currentStyle) {
                value = el.currentStyle[style];
            }
            if ((!value || value === "auto") && document.defaultView) {
                var css = document.defaultView.getComputedStyle(el, null);
                value = css ? css[style] : null;
            }
            return value === "auto" ? null : value;
        },
        getViewportOffset: function (element) {
            var top = 0, left = 0, el = element, docBody = document.body, docEl = document.documentElement, pos;
            do {
                top += el.offsetTop || 0;
                left += el.offsetLeft || 0;
                top += parseInt(L.DomUtil.getStyle(el, "borderTopWidth"), 10) || 0;
                left += parseInt(L.DomUtil.getStyle(el, "borderLeftWidth"), 10) || 0;
                pos = L.DomUtil.getStyle(el, "position");
                if (el.offsetParent === docBody && pos === "absolute") {
                    break;
                }
                if (pos === "fixed") {
                    top += docBody.scrollTop || docEl.scrollTop || 0;
                    left += docBody.scrollLeft || docEl.scrollLeft || 0;
                    break;
                }
                if (pos === "relative" && !el.offsetLeft) {
                    var width = L.DomUtil.getStyle(el, "width"), maxWidth = L.DomUtil.getStyle(el, "max-width"), r = el.getBoundingClientRect();
                    if (width !== "none" || maxWidth !== "none") {
                        left += r.left + el.clientLeft;
                    }
                    top += r.top + (docBody.scrollTop || docEl.scrollTop || 0);
                    break;
                }
                el = el.offsetParent;
            } while (el);
            el = element;
            do {
                if (el === docBody) {
                    break;
                }
                top -= el.scrollTop || 0;
                left -= el.scrollLeft || 0;
                el = el.parentNode;
            } while (el);
            return new L.Point(left, top);
        },
        documentIsLtr: function () {
            if (!L.DomUtil._docIsLtrCached) {
                L.DomUtil._docIsLtrCached = true;
                L.DomUtil._docIsLtr = L.DomUtil.getStyle(document.body, "direction") === "ltr";
            }
            return L.DomUtil._docIsLtr;
        },
        create: function (tagName, className, container) {
            var el = document.createElement(tagName);
            el.className = className;
            if (container) {
                container.appendChild(el);
            }
            return el;
        },
        hasClass: function (el, name) {
            if (el.classList !== undefined) {
                return el.classList.contains(name);
            }
            var className = L.DomUtil._getClass(el);
            return className.length > 0 && new RegExp("(^|\\s)" + name + "(\\s|$)").test(className);
        },
        addClass: function (el, name) {
            if (el.classList !== undefined) {
                var classes = L.Util.splitWords(name);
                for (var i = 0, len = classes.length; i < len; i++) {
                    el.classList.add(classes[i]);
                }
            } else if (!L.DomUtil.hasClass(el, name)) {
                var className = L.DomUtil._getClass(el);
                L.DomUtil._setClass(el, (className ? className + " " : "") + name);
            }
        },
        removeClass: function (el, name) {
            if (el.classList !== undefined) {
                el.classList.remove(name);
            } else {
                L.DomUtil._setClass(el, L.Util.trim((" " + L.DomUtil._getClass(el) + " ").replace(" " + name + " ", " ")));
            }
        },
        _setClass: function (el, name) {
            if (el.className.baseVal === undefined) {
                el.className = name;
            } else {
                el.className.baseVal = name;
            }
        },
        _getClass: function (el) {
            return el.className.baseVal === undefined ? el.className : el.className.baseVal;
        },
        setOpacity: function (el, value) {
            if ("opacity" in el.style) {
                el.style.opacity = value;
            } else if ("filter" in el.style) {
                var filter = false, filterName = "DXImageTransform.Microsoft.Alpha";
                try {
                    filter = el.filters.item(filterName);
                } catch (e) {
                    if (value === 1) {
                        return;
                    }
                }
                value = Math.round(value * 100);
                if (filter) {
                    filter.Enabled = value !== 100;
                    filter.Opacity = value;
                } else {
                    el.style.filter += " progid:" + filterName + "(opacity=" + value + ")";
                }
            }
        },
        testProp: function (props) {
            var style = document.documentElement.style;
            for (var i = 0; i < props.length; i++) {
                if (props[i] in style) {
                    return props[i];
                }
            }
            return false;
        },
        getTranslateString: function (point) {
            var is3d = L.Browser.webkit3d, open = "translate" + (is3d ? "3d" : "") + "(", close = (is3d ? ",0" : "") + ")";
            return open + point.x + "px," + point.y + "px" + close;
        },
        getScaleString: function (scale, origin) {
            var preTranslateStr = L.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))), scaleStr = " scale(" + scale + ") ";
            return preTranslateStr + scaleStr;
        },
        setPosition: function (el, point, disable3D) {
            el._leaflet_pos = point;
            if (!disable3D && L.Browser.any3d) {
                el.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(point);
            } else {
                el.style.left = point.x + "px";
                el.style.top = point.y + "px";
            }
        },
        getPosition: function (el) {
            return el._leaflet_pos;
        }
    };
    L.DomUtil.TRANSFORM = L.DomUtil.testProp(["transform", "WebkitTransform", "OTransform", "MozTransform", "msTransform"]);
    L.DomUtil.TRANSITION = L.DomUtil.testProp(["webkitTransition", "transition", "OTransition", "MozTransition", "msTransition"]);
    L.DomUtil.TRANSITION_END = L.DomUtil.TRANSITION === "webkitTransition" || L.DomUtil.TRANSITION === "OTransition" ? L.DomUtil.TRANSITION + "End" : "transitionend";
    (function () {
        if ("onselectstart" in document) {
            L.extend(L.DomUtil, {
                disableTextSelection: function () {
                    L.DomEvent.on(window, "selectstart", L.DomEvent.preventDefault);
                },
                enableTextSelection: function () {
                    L.DomEvent.off(window, "selectstart", L.DomEvent.preventDefault);
                }
            });
        } else {
            var userSelectProperty = L.DomUtil.testProp(["userSelect", "WebkitUserSelect", "OUserSelect", "MozUserSelect", "msUserSelect"]);
            L.extend(L.DomUtil, {
                disableTextSelection: function () {
                    if (userSelectProperty) {
                        var style = document.documentElement.style;
                        this._userSelect = style[userSelectProperty];
                        style[userSelectProperty] = "none";
                    }
                },
                enableTextSelection: function () {
                    if (userSelectProperty) {
                        document.documentElement.style[userSelectProperty] = this._userSelect;
                        delete this._userSelect;
                    }
                }
            });
        }
        L.extend(L.DomUtil, {
            disableImageDrag: function () {
                L.DomEvent.on(window, "dragstart", L.DomEvent.preventDefault);
            },
            enableImageDrag: function () {
                L.DomEvent.off(window, "dragstart", L.DomEvent.preventDefault);
            }
        });
    })();
    L.LatLng = function (lat, lng, alt) {
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        if (isNaN(lat) || isNaN(lng)) {
            throw new Error("Invalid LatLng object: (" + lat + ", " + lng + ")");
        }
        this.lat = lat;
        this.lng = lng;
        if (alt !== undefined) {
            this.alt = parseFloat(alt);
        }
    };
    L.extend(L.LatLng, {
        DEG_TO_RAD: Math.PI / 180,
        RAD_TO_DEG: 180 / Math.PI,
        MAX_MARGIN: 1e-9
    });
    L.LatLng.prototype = {
        equals: function (obj) {
            if (!obj) {
                return false;
            }
            obj = L.latLng(obj);
            var margin = Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng));
            return margin <= L.LatLng.MAX_MARGIN;
        },
        toString: function (precision) {
            return "LatLng(" + L.Util.formatNum(this.lat, precision) + ", " + L.Util.formatNum(this.lng, precision) + ")";
        },
        distanceTo: function (other) {
            other = L.latLng(other);
            var R = 6378137, d2r = L.LatLng.DEG_TO_RAD, dLat = (other.lat - this.lat) * d2r, dLon = (other.lng - this.lng) * d2r, lat1 = this.lat * d2r, lat2 = other.lat * d2r, sin1 = Math.sin(dLat / 2), sin2 = Math.sin(dLon / 2);
            var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        },
        wrap: function (a, b) {
            var lng = this.lng;
            a = a || -180;
            b = b || 180;
            lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);
            return new L.LatLng(this.lat, lng);
        }
    };
    L.latLng = function (a, b) {
        if (a instanceof L.LatLng) {
            return a;
        }
        if (L.Util.isArray(a)) {
            if (typeof a[0] === "number" || typeof a[0] === "string") {
                return new L.LatLng(a[0], a[1], a[2]);
            } else {
                return null;
            }
        }
        if (a === undefined || a === null) {
            return a;
        }
        if (typeof a === "object" && "lat" in a) {
            return new L.LatLng(a.lat, "lng" in a ? a.lng : a.lon);
        }
        if (b === undefined) {
            return null;
        }
        return new L.LatLng(a, b);
    };
    L.LatLngBounds = function (southWest, northEast) {
        if (!southWest) {
            return;
        }
        var latlngs = northEast ? [southWest, northEast] : southWest;
        for (var i = 0, len = latlngs.length; i < len; i++) {
            this.extend(latlngs[i]);
        }
    };
    L.LatLngBounds.prototype = {
        extend: function (obj) {
            if (!obj) {
                return this;
            }
            var latLng = L.latLng(obj);
            if (latLng !== null) {
                obj = latLng;
            } else {
                obj = L.latLngBounds(obj);
            }
            if (obj instanceof L.LatLng) {
                if (!this._southWest && !this._northEast) {
                    this._southWest = new L.LatLng(obj.lat, obj.lng);
                    this._northEast = new L.LatLng(obj.lat, obj.lng);
                } else {
                    this._southWest.lat = Math.min(obj.lat, this._southWest.lat);
                    this._southWest.lng = Math.min(obj.lng, this._southWest.lng);
                    this._northEast.lat = Math.max(obj.lat, this._northEast.lat);
                    this._northEast.lng = Math.max(obj.lng, this._northEast.lng);
                }
            } else if (obj instanceof L.LatLngBounds) {
                this.extend(obj._southWest);
                this.extend(obj._northEast);
            }
            return this;
        },
        pad: function (bufferRatio) {
            var sw = this._southWest, ne = this._northEast, heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio, widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
            return new L.LatLngBounds(new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer), new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
        },
        getCenter: function () {
            return new L.LatLng((this._southWest.lat + this._northEast.lat) / 2, (this._southWest.lng + this._northEast.lng) / 2);
        },
        getSouthWest: function () {
            return this._southWest;
        },
        getNorthEast: function () {
            return this._northEast;
        },
        getNorthWest: function () {
            return new L.LatLng(this.getNorth(), this.getWest());
        },
        getSouthEast: function () {
            return new L.LatLng(this.getSouth(), this.getEast());
        },
        getWest: function () {
            return this._southWest.lng;
        },
        getSouth: function () {
            return this._southWest.lat;
        },
        getEast: function () {
            return this._northEast.lng;
        },
        getNorth: function () {
            return this._northEast.lat;
        },
        contains: function (obj) {
            if (typeof obj[0] === "number" || obj instanceof L.LatLng) {
                obj = L.latLng(obj);
            } else {
                obj = L.latLngBounds(obj);
            }
            var sw = this._southWest, ne = this._northEast, sw2, ne2;
            if (obj instanceof L.LatLngBounds) {
                sw2 = obj.getSouthWest();
                ne2 = obj.getNorthEast();
            } else {
                sw2 = ne2 = obj;
            }
            return sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng;
        },
        intersects: function (bounds) {
            bounds = L.latLngBounds(bounds);
            var sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat, lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;
            return latIntersects && lngIntersects;
        },
        toBBoxString: function () {
            return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(",");
        },
        equals: function (bounds) {
            if (!bounds) {
                return false;
            }
            bounds = L.latLngBounds(bounds);
            return this._southWest.equals(bounds.getSouthWest()) && this._northEast.equals(bounds.getNorthEast());
        },
        isValid: function () {
            return !!(this._southWest && this._northEast);
        }
    };
    L.latLngBounds = function (a, b) {
        if (!a || a instanceof L.LatLngBounds) {
            return a;
        }
        return new L.LatLngBounds(a, b);
    };
    L.Projection = {};
    L.Projection.SphericalMercator = {
        MAX_LATITUDE: 85.0511287798,
        project: function (latlng) {
            var d = L.LatLng.DEG_TO_RAD, max = this.MAX_LATITUDE, lat = Math.max(Math.min(max, latlng.lat), -max), x = latlng.lng * d, y = lat * d;
            y = Math.log(Math.tan(Math.PI / 4 + y / 2));
            return new L.Point(x, y);
        },
        unproject: function (point) {
            var d = L.LatLng.RAD_TO_DEG, lng = point.x * d, lat = (2 * Math.atan(Math.exp(point.y)) - Math.PI / 2) * d;
            return new L.LatLng(lat, lng);
        }
    };
    L.Projection.LonLat = {
        project: function (latlng) {
            return new L.Point(latlng.lng, latlng.lat);
        },
        unproject: function (point) {
            return new L.LatLng(point.y, point.x);
        }
    };
    L.CRS = {
        latLngToPoint: function (latlng, zoom) {
            var projectedPoint = this.projection.project(latlng), scale = this.scale(zoom);
            return this.transformation._transform(projectedPoint, scale);
        },
        pointToLatLng: function (point, zoom) {
            var scale = this.scale(zoom), untransformedPoint = this.transformation.untransform(point, scale);
            return this.projection.unproject(untransformedPoint);
        },
        project: function (latlng) {
            return this.projection.project(latlng);
        },
        scale: function (zoom) {
            return 256 * Math.pow(2, zoom);
        },
        getSize: function (zoom) {
            var s = this.scale(zoom);
            return L.point(s, s);
        }
    };
    L.CRS.Simple = L.extend({}, L.CRS, {
        projection: L.Projection.LonLat,
        transformation: new L.Transformation(1, 0, -1, 0),
        scale: function (zoom) {
            return Math.pow(2, zoom);
        }
    });
    L.CRS.EPSG3857 = L.extend({}, L.CRS, {
        code: "EPSG:3857",
        projection: L.Projection.SphericalMercator,
        transformation: new L.Transformation(.5 / Math.PI, .5, -.5 / Math.PI, .5),
        project: function (latlng) {
            var projectedPoint = this.projection.project(latlng), earthRadius = 6378137;
            return projectedPoint.multiplyBy(earthRadius);
        }
    });
    L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
        code: "EPSG:900913"
    });
    L.CRS.EPSG4326 = L.extend({}, L.CRS, {
        code: "EPSG:4326",
        projection: L.Projection.LonLat,
        transformation: new L.Transformation(1 / 360, .5, -1 / 360, .5)
    });

    /*
     * L.Map is the central class of the API - it is used to create a map.jj
     */
    L.Map = L.Class.extend({
        includes: L.Mixin.Events,
        options: {
            crs: L.CRS.EPSG3857,
            fadeAnimation: L.DomUtil.TRANSITION && !L.Browser.android23,
            trackResize: true,
            markerZoomAnimation: L.DomUtil.TRANSITION && L.Browser.any3d
        },
        initialize: function (id, options) {
            options = L.setOptions(this, options);
            this._initContainer(id);
            this._initLayout();
            this._onResize = L.bind(this._onResize, this);
            this._initEvents();
            if (options.maxBounds) {
                this.setMaxBounds(options.maxBounds);
            }
            if (options.center && options.zoom !== undefined) {
                this.setView(L.latLng(options.center), options.zoom, {
                    reset: true
                });
            }
            this._handlers = [];
            this._layers = {};
            this._zoomBoundLayers = {};
            this._tileLayersNum = 0;
            this.callInitHooks();
            this._addLayers(options.layers);
        },
        setView: function (center, zoom) {
            zoom = zoom === undefined ? this.getZoom() : zoom;
            this._resetView(L.latLng(center), this._limitZoom(zoom));
            return this;
        },
        setZoom: function (zoom, options) {
            if (!this._loaded) {
                this._zoom = this._limitZoom(zoom);
                return this;
            }
            return this.setView(this.getCenter(), zoom, {
                zoom: options
            });
        },
        zoomIn: function (delta, options) {
            return this.setZoom(this._zoom + (delta || 1), options);
        },
        zoomOut: function (delta, options) {
            return this.setZoom(this._zoom - (delta || 1), options);
        },
        setZoomAround: function (latlng, zoom, options) {
            var scale = this.getZoomScale(zoom), viewHalf = this.getSize().divideBy(2), containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng), centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale), newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));
            return this.setView(newCenter, zoom, {
                zoom: options
            });
        },
        fitBounds: function (bounds, options) {
            options = options || {};
            bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);
            var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]), zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR)), paddingOffset = paddingBR.subtract(paddingTL).divideBy(2), swPoint = this.project(bounds.getSouthWest(), zoom), nePoint = this.project(bounds.getNorthEast(), zoom), center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
            zoom = options && options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;
            return this.setView(center, zoom, options);
        },
        fitWorld: function (options) {
            return this.fitBounds([[-90, -180], [90, 180]], options);
        },
        panTo: function (center, options) {
            return this.setView(center, this._zoom, {
                pan: options
            });
        },
        panBy: function (offset) {
            this.fire("movestart");
            this._rawPanBy(L.point(offset));
            this.fire("move");
            return this.fire("moveend");
        },
        setMaxBounds: function (bounds) {
            bounds = L.latLngBounds(bounds);
            this.options.maxBounds = bounds;
            if (!bounds) {
                return this.off("moveend", this._panInsideMaxBounds, this);
            }
            if (this._loaded) {
                this._panInsideMaxBounds();
            }
            return this.on("moveend", this._panInsideMaxBounds, this);
        },
        panInsideBounds: function (bounds, options) {
            var center = this.getCenter(), newCenter = this._limitCenter(center, this._zoom, bounds);
            if (center.equals(newCenter)) {
                return this;
            }
            return this.panTo(newCenter, options);
        },
        addLayer: function (layer) {
            var id = L.stamp(layer);
            //if (this._layers[id]) {
            //    return this;
            //}
            this._layers[id] = layer;
            if (layer.options && (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom))) {
                this._zoomBoundLayers[id] = layer;
                this._updateZoomLevels();
            }
            if (this.options.zoomAnimation && L.TileLayer && layer instanceof L.TileLayer) {
                this._tileLayersNum++;
                this._tileLayersToLoad++;
                layer.on("load", this._onTileLayerLoad, this);
            }
            if (this._loaded) {
                this._layerAdd(layer);
            }
            return this;
        },
        removeLayer: function (layer) {
            var id = L.stamp(layer);
            if (!this._layers[id]) {
                return this;
            }
            if (this._loaded) {
                layer.onRemove(this);
            }
            delete this._layers[id];
            if (this._loaded) {
                this.fire("layerremove", {
                    layer: layer
                });
            }
            if (this._zoomBoundLayers[id]) {
                delete this._zoomBoundLayers[id];
                this._updateZoomLevels();
            }
            if (this.options.zoomAnimation && L.TileLayer && layer instanceof L.TileLayer) {
                this._tileLayersNum--;
                this._tileLayersToLoad--;
                layer.off("load", this._onTileLayerLoad, this);
            }
            return this;
        },
        hasLayer: function (layer) {
            if (!layer) {
                return false;
            }
            return L.stamp(layer) in this._layers;
        },
        eachLayer: function (method, context) {
            for (var i in this._layers) {
                method.call(context, this._layers[i]);
            }
            return this;
        },
        invalidateSize: function (options) {
            if (!this._loaded) {
                return this;
            }
            options = L.extend({
                animate: false,
                pan: true
            }, options === true ? {
                animate: true
            } : options);
            var oldSize = this.getSize();
            this._sizeChanged = true;
            this._initialCenter = null;
            var newSize = this.getSize(), oldCenter = oldSize.divideBy(2).round(), newCenter = newSize.divideBy(2).round(), offset = oldCenter.subtract(newCenter);
            if (!offset.x && !offset.y) {
                return this;
            }
            if (options.animate && options.pan) {
                this.panBy(offset);
            } else {
                if (options.pan) {
                    this._rawPanBy(offset);
                }
                this.fire("move");
                if (options.debounceMoveend) {
                    clearTimeout(this._sizeTimer);
                    this._sizeTimer = setTimeout(L.bind(this.fire, this, "moveend"), 200);
                } else {
                    this.fire("moveend");
                }
            }
            return this.fire("resize", {
                oldSize: oldSize,
                newSize: newSize
            });
        },
        addHandler: function (name, HandlerClass) {
            if (!HandlerClass) {
                return this;
            }
            var handler = this[name] = new HandlerClass(this);
            this._handlers.push(handler);
            if (this.options[name]) {
                handler.enable();
            }
            return this;
        },
        remove: function () {
            if (this._loaded) {
                this.fire("unload");
            }
            this._initEvents("off");
            try {
                delete this._container._leaflet;
            } catch (e) {
                this._container._leaflet = undefined;
            }
            this._clearPanes();
            if (this._clearControlPos) {
                this._clearControlPos();
            }
            this._clearHandlers();
            return this;
        },
        getCenter: function () {
            this._checkIfLoaded();
            if (this._initialCenter && !this._moved()) {
                return this._initialCenter;
            }
            return this.layerPointToLatLng(this._getCenterLayerPoint());
        },
        getZoom: function () {
            return this._zoom;
        },
        getBounds: function () {
            var bounds = this.getPixelBounds(), sw = this.unproject(bounds.getBottomLeft()), ne = this.unproject(bounds.getTopRight());
            return new L.LatLngBounds(sw, ne);
        },
        getMinZoom: function () {
            return this.options.minZoom === undefined ? this._layersMinZoom === undefined ? 0 : this._layersMinZoom : this.options.minZoom;
        },
        getMaxZoom: function () {
            return this.options.maxZoom === undefined ? this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom : this.options.maxZoom;
        },
        getBoundsZoom: function (bounds, inside, padding) {
            bounds = L.latLngBounds(bounds);
            var zoom = this.getMinZoom() - (inside ? 1 : 0), maxZoom = this.getMaxZoom(), size = this.getSize(), nw = bounds.getNorthWest(), se = bounds.getSouthEast(), zoomNotFound = true, boundsSize;
            padding = L.point(padding || [0, 0]);
            do {
                zoom++;
                boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
                zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;
            } while (zoomNotFound && zoom <= maxZoom);
            if (zoomNotFound && inside) {
                return null;
            }
            return inside ? zoom : zoom - 1;
        },
        getSize: function () {
            if (!this._size || this._sizeChanged) {
                this._size = new L.Point(this._container.clientWidth, this._container.clientHeight);
                this._sizeChanged = false;
            }
            return this._size.clone();
        },
        getPixelBounds: function () {
            var topLeftPoint = this._getTopLeftPoint();
            return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
        },
        getPixelOrigin: function () {
            this._checkIfLoaded();
            return this._initialTopLeftPoint;
        },
        getPanes: function () {
            return this._panes;
        },
        getContainer: function () {
            return this._container;
        },
        getZoomScale: function (toZoom) {
            var crs = this.options.crs;
            return crs.scale(toZoom) / crs.scale(this._zoom);
        },
        getScaleZoom: function (scale) {
            return this._zoom + Math.log(scale) / Math.LN2;
        },
        project: function (latlng, zoom) {
            zoom = zoom === undefined ? this._zoom : zoom;
            return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
        },
        unproject: function (point, zoom) {
            zoom = zoom === undefined ? this._zoom : zoom;
            return this.options.crs.pointToLatLng(L.point(point), zoom);
        },
        layerPointToLatLng: function (point) {
            var projectedPoint = L.point(point).add(this.getPixelOrigin());
            return this.unproject(projectedPoint);
        },
        latLngToLayerPoint: function (latlng) {
            var projectedPoint = this.project(L.latLng(latlng))._round();
            return projectedPoint._subtract(this.getPixelOrigin());
        },
        containerPointToLayerPoint: function (point) {
            return L.point(point).subtract(this._getMapPanePos());
        },
        layerPointToContainerPoint: function (point) {
            return L.point(point).add(this._getMapPanePos());
        },
        containerPointToLatLng: function (point) {
            var layerPoint = this.containerPointToLayerPoint(L.point(point));
            return this.layerPointToLatLng(layerPoint);
        },
        latLngToContainerPoint: function (latlng) {
            return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
        },
        mouseEventToContainerPoint: function (e) {
            return L.DomEvent.getMousePosition(e, this._container);
        },
        mouseEventToLayerPoint: function (e) {
            return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
        },
        mouseEventToLatLng: function (e) {
            return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
        },
        _initContainer: function (id) {
            var container = this._container = L.DomUtil.get(id);
            if (!container) {
                throw new Error("Map container not found.");
            } else if (container._leaflet) {
                throw new Error("Map container is already initialized.");
            }
            container._leaflet = true;
        },
        _initLayout: function () {
            var container = this._container;
            L.DomUtil.addClass(container, "leaflet-container" + (L.Browser.touch ? " leaflet-touch" : "") + (L.Browser.retina ? " leaflet-retina" : "") + (L.Browser.ielt9 ? " leaflet-oldie" : "") + (this.options.fadeAnimation ? " leaflet-fade-anim" : ""));
            var position = L.DomUtil.getStyle(container, "position");
            if (position !== "absolute" && position !== "relative" && position !== "fixed") {
                container.style.position = "relative";
            }
            this._initPanes();
            if (this._initControlPos) {
                this._initControlPos();
            }
        },
        _initPanes: function () {
            var panes = this._panes = {};
            this._mapPane = panes.mapPane = this._createPane("leaflet-map-pane", this._container);
            this._tilePane = panes.tilePane = this._createPane("leaflet-tile-pane", this._mapPane);
            panes.objectsPane = this._createPane("leaflet-objects-pane", this._mapPane);
            panes.shadowPane = this._createPane("leaflet-shadow-pane");
            panes.overlayPane = this._createPane("leaflet-overlay-pane");
            panes.markerPane = this._createPane("leaflet-marker-pane");
            panes.popupPane = this._createPane("leaflet-popup-pane");
            var zoomHide = " leaflet-zoom-hide";
            if (!this.options.markerZoomAnimation) {
                L.DomUtil.addClass(panes.markerPane, zoomHide);
                L.DomUtil.addClass(panes.shadowPane, zoomHide);
                L.DomUtil.addClass(panes.popupPane, zoomHide);
            }
        },
        _createPane: function (className, container) {
            return L.DomUtil.create("div", className, container || this._panes.objectsPane);
        },
        _clearPanes: function () {
            this._container.removeChild(this._mapPane);
        },
        _addLayers: function (layers) {
            layers = layers ? L.Util.isArray(layers) ? layers : [layers] : [];
            for (var i = 0, len = layers.length; i < len; i++) {
                this.addLayer(layers[i]);
            }
        },
        _resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {
            var zoomChanged = this._zoom !== zoom;
            if (!afterZoomAnim) {
                this.fire("movestart");
                if (zoomChanged) {
                    this.fire("zoomstart");
                }
            }
            this._zoom = zoom;
            this._initialCenter = center;
            this._initialTopLeftPoint = this._getNewTopLeftPoint(center);
            if (!preserveMapOffset) {
                L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
            } else {
                this._initialTopLeftPoint._add(this._getMapPanePos());
            }
            this._tileLayersToLoad = this._tileLayersNum;
            var loading = !this._loaded;
            this._loaded = true;
            if (loading) {
                this.fire("load");
                this.eachLayer(this._layerAdd, this);
            }
            this.fire("viewreset", {
                hard: !preserveMapOffset
            });
            this.fire("move");
            if (zoomChanged || afterZoomAnim) {
                this.fire("zoomend");
            }
            this.fire("moveend", {
                hard: !preserveMapOffset
            });
        },
        _rawPanBy: function (offset) {
            L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
        },
        _getZoomSpan: function () {
            return this.getMaxZoom() - this.getMinZoom();
        },
        _updateZoomLevels: function () {
            var i, minZoom = Infinity, maxZoom = -Infinity, oldZoomSpan = this._getZoomSpan();
            for (i in this._zoomBoundLayers) {
                var layer = this._zoomBoundLayers[i];
                if (!isNaN(layer.options.minZoom)) {
                    minZoom = Math.min(minZoom, layer.options.minZoom);
                }
                if (!isNaN(layer.options.maxZoom)) {
                    maxZoom = Math.max(maxZoom, layer.options.maxZoom);
                }
            }
            if (i === undefined) {
                this._layersMaxZoom = this._layersMinZoom = undefined;
            } else {
                this._layersMaxZoom = maxZoom;
                this._layersMinZoom = minZoom;
            }
            if (oldZoomSpan !== this._getZoomSpan()) {
                this.fire("zoomlevelschange");
            }
        },
        _panInsideMaxBounds: function () {
            this.panInsideBounds(this.options.maxBounds);
        },
        _checkIfLoaded: function () {
            if (!this._loaded) {
                throw new Error("Set map center and zoom first.");
            }
        },
        _initEvents: function (onOff) {
            if (!L.DomEvent) {
                return;
            }
            onOff = onOff || "on";
            L.DomEvent[onOff](this._container, "click", this._onMouseClick, this);
            var events = ["dblclick", "mousedown", "mouseup", "mouseenter", "mouseleave", "mousemove", "contextmenu"], i, len;
            for (i = 0, len = events.length; i < len; i++) {
                L.DomEvent[onOff](this._container, events[i], this._fireMouseEvent, this);
            }
            if (this.options.trackResize) {
                L.DomEvent[onOff](window, "resize", this._onResize, this);
            }
        },
        _onResize: function () {
            L.Util.cancelAnimFrame(this._resizeRequest);
            this._resizeRequest = L.Util.requestAnimFrame(function () {
                this.invalidateSize({
                    debounceMoveend: true
                });
            }, this, false, this._container);
        },
        _onMouseClick: function (e) {
            if (!this._loaded || !e._simulated && (this.dragging && this.dragging.moved() || this.boxZoom && this.boxZoom.moved()) || L.DomEvent._skipped(e)) {
                return;
            }
            this.fire("preclick");
            this._fireMouseEvent(e);
        },
        _fireMouseEvent: function (e) {
            if (!this._loaded || L.DomEvent._skipped(e)) {
                return;
            }
            var type = e.type;
            type = type === "mouseenter" ? "mouseover" : type === "mouseleave" ? "mouseout" : type;
            if (!this.hasEventListeners(type)) {
                return;
            }
            if (type === "contextmenu") {
                L.DomEvent.preventDefault(e);
            }
            var containerPoint = this.mouseEventToContainerPoint(e), layerPoint = this.containerPointToLayerPoint(containerPoint), latlng = this.layerPointToLatLng(layerPoint);
            this.fire(type, {
                latlng: latlng,
                layerPoint: layerPoint,
                containerPoint: containerPoint,
                originalEvent: e
            });
        },
        _onTileLayerLoad: function () {
            this._tileLayersToLoad--;
            if (this._tileLayersNum && !this._tileLayersToLoad) {
                this.fire("tilelayersload");
            }
        },
        _clearHandlers: function () {
            for (var i = 0, len = this._handlers.length; i < len; i++) {
                this._handlers[i].disable();
            }
        },
        whenReady: function (callback, context) {
            if (this._loaded) {
                callback.call(context || this, this);
            } else {
                this.on("load", callback, context);
            }
            return this;
        },
        _layerAdd: function (layer) {
            layer.onAdd(this);
            this.fire("layeradd", {
                layer: layer
            });
        },
        _getMapPanePos: function () {
            return L.DomUtil.getPosition(this._mapPane);
        },
        _moved: function () {
            var pos = this._getMapPanePos();
            return pos && !pos.equals([0, 0]);
        },
        _getTopLeftPoint: function () {
            return this.getPixelOrigin().subtract(this._getMapPanePos());
        },
        _getNewTopLeftPoint: function (center, zoom) {
            var viewHalf = this.getSize()._divideBy(2);
            return this.project(center, zoom)._subtract(viewHalf)._round();
        },
        _latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
            var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());
            return this.project(latlng, newZoom)._subtract(topLeft);
        },
        _getCenterLayerPoint: function () {
            return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
        },
        _getCenterOffset: function (latlng) {
            return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
        },
        _limitCenter: function (center, zoom, bounds) {
            if (!bounds) {
                return center;
            }
            var centerPoint = this.project(center, zoom), viewHalf = this.getSize().divideBy(2), viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)), offset = this._getBoundsOffset(viewBounds, bounds, zoom);
            return this.unproject(centerPoint.add(offset), zoom);
        },
        _limitOffset: function (offset, bounds) {
            if (!bounds) {
                return offset;
            }
            var viewBounds = this.getPixelBounds(), newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
            return offset.add(this._getBoundsOffset(newBounds, bounds));
        },
        _getBoundsOffset: function (pxBounds, maxBounds, zoom) {
            var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min), seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max), dx = this._rebound(nwOffset.x, -seOffset.x), dy = this._rebound(nwOffset.y, -seOffset.y);
            return new L.Point(dx, dy);
        },
        _rebound: function (left, right) {
            return left + right > 0 ? Math.round(left - right) / 2 : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
        },
        _limitZoom: function (zoom) {
            var min = this.getMinZoom(), max = this.getMaxZoom();
            return Math.max(min, Math.min(max, zoom));
        }
    });
    L.map = function (id, options) {
        return new L.Map(id, options);
    };


    L.Projection.Mercator = {
        MAX_LATITUDE: 85.0840591556,
        R_MINOR: 6356752.314245179,
        R_MAJOR: 6378137,
        project: function (latlng) {
            var d = L.LatLng.DEG_TO_RAD, max = this.MAX_LATITUDE, lat = Math.max(Math.min(max, latlng.lat), -max), r = this.R_MAJOR, r2 = this.R_MINOR, x = latlng.lng * d * r, y = lat * d, tmp = r2 / r, eccent = Math.sqrt(1 - tmp * tmp), con = eccent * Math.sin(y);
            con = Math.pow((1 - con) / (1 + con), eccent * .5);
            var ts = Math.tan(.5 * (Math.PI * .5 - y)) / con;
            y = -r * Math.log(ts);
            return new L.Point(x, y);
        },
        unproject: function (point) {
            var d = L.LatLng.RAD_TO_DEG, r = this.R_MAJOR, r2 = this.R_MINOR, lng = point.x * d / r, tmp = r2 / r, eccent = Math.sqrt(1 - tmp * tmp), ts = Math.exp(-point.y / r), phi = Math.PI / 2 - 2 * Math.atan(ts), numIter = 15, tol = 1e-7, i = numIter, dphi = .1, con;
            while (Math.abs(dphi) > tol && --i > 0) {
                con = eccent * Math.sin(phi);
                dphi = Math.PI / 2 - 2 * Math.atan(ts * Math.pow((1 - con) / (1 + con), .5 * eccent)) - phi;
                phi += dphi;
            }
            return new L.LatLng(phi * d, lng);
        }
    };
    L.CRS.EPSG3395 = L.extend({}, L.CRS, {
        code: "EPSG:3395",
        projection: L.Projection.Mercator,
        transformation: function () {
            var m = L.Projection.Mercator, r = m.R_MAJOR, scale = .5 / (Math.PI * r);
            return new L.Transformation(scale, .5, -scale, .5);
        }()
    });
    L.TileLayer = L.Class.extend({
        includes: L.Mixin.Events,
        options: {
            minZoom: 0,
            maxZoom: 18,
            tileSize: 256,
            subdomains: "abc",
            errorTileUrl: "",
            attribution: "",
            zoomOffset: 0,
            opacity: 1,
            unloadInvisibleTiles: L.Browser.mobile,
            updateWhenIdle: L.Browser.mobile
        },
        initialize: function (url, options) {
            options = L.setOptions(this, options);
            if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {
                options.tileSize = Math.floor(options.tileSize / 2);
                options.zoomOffset++;
                if (options.minZoom > 0) {
                    options.minZoom--;
                }
                this.options.maxZoom--;
            }
            if (options.bounds) {
                options.bounds = L.latLngBounds(options.bounds);
            }
            this._url = url;
            var subdomains = this.options.subdomains;
            if (typeof subdomains === "string") {
                this.options.subdomains = subdomains.split("");
            }
        },
        onAdd: function (map) {
            this._map = map;
            this._animated = map._zoomAnimated;
            this._initContainer();
            map.on({
                viewreset: this._reset,
                moveend: this._update
            }, this);
            if (this._animated) {
                map.on({
                    zoomanim: this._animateZoom,
                    zoomend: this._endZoomAnim
                }, this);
            }
            if (!this.options.updateWhenIdle) {
                this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
                map.on("move", this._limitedUpdate, this);
            }
            this._reset();
            this._update();
        },
        addTo: function (map) {
            map.addLayer(this);
            return this;
        },
        onRemove: function (map) {
            this._container.parentNode.removeChild(this._container);
            map.off({
                viewreset: this._reset,
                moveend: this._update
            }, this);
            if (this._animated) {
                map.off({
                    zoomanim: this._animateZoom,
                    zoomend: this._endZoomAnim
                }, this);
            }
            if (!this.options.updateWhenIdle) {
                map.off("move", this._limitedUpdate, this);
            }
            this._container = null;
            this._map = null;
        },
        bringToFront: function () {
            var pane = this._map._panes.tilePane;
            if (this._container) {
                pane.appendChild(this._container);
                this._setAutoZIndex(pane, Math.max);
            }
            return this;
        },
        bringToBack: function () {
            var pane = this._map._panes.tilePane;
            if (this._container) {
                pane.insertBefore(this._container, pane.firstChild);
                this._setAutoZIndex(pane, Math.min);
            }
            return this;
        },
        getAttribution: function () {
            return this.options.attribution;
        },
        getContainer: function () {
            return this._container;
        },
        setOpacity: function (opacity) {
            this.options.opacity = opacity;
            if (this._map) {
                this._updateOpacity();
            }
            return this;
        },
        setZIndex: function (zIndex) {
            this.options.zIndex = zIndex;
            this._updateZIndex();
            return this;
        },
        setUrl: function (url, noRedraw) {
            this._url = url;
            if (!noRedraw) {
                this.redraw();
            }
            return this;
        },
        redraw: function () {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },
        _updateZIndex: function () {
            if (this._container && this.options.zIndex !== undefined) {
                this._container.style.zIndex = this.options.zIndex;
            }
        },
        _setAutoZIndex: function (pane, compare) {
            var layers = pane.children, edgeZIndex = -compare(Infinity, -Infinity), zIndex, i, len;
            for (i = 0, len = layers.length; i < len; i++) {
                if (layers[i] !== this._container) {
                    zIndex = parseInt(layers[i].style.zIndex, 10);
                    if (!isNaN(zIndex)) {
                        edgeZIndex = compare(edgeZIndex, zIndex);
                    }
                }
            }
            this.options.zIndex = this._container.style.zIndex = (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
        },
        _updateOpacity: function () {
            var i, tiles = this._tiles;
            if (L.Browser.ielt9) {
                for (i in tiles) {
                    L.DomUtil.setOpacity(tiles[i], this.options.opacity);
                }
            } else {
                L.DomUtil.setOpacity(this._container, this.options.opacity);
            }
        },
        _initContainer: function () {
            var tilePane = this._map._panes.tilePane;
            if (!this._container) {
                this._container = L.DomUtil.create("div", "leaflet-layer");
                this._updateZIndex();
                if (this._animated) {
                    var className = "leaflet-tile-container";
                    this._bgBuffer = L.DomUtil.create("div", className, this._container);
                    this._tileContainer = L.DomUtil.create("div", className, this._container);
                } else {
                    this._tileContainer = this._container;
                }
                tilePane.appendChild(this._container);
                if (this.options.opacity < 1) {
                    this._updateOpacity();
                }
            }
        },
        _reset: function (e) {
            for (var key in this._tiles) {
                this.fire("tileunload", {
                    tile: this._tiles[key]
                });
            }
            this._tiles = {};
            this._tilesToLoad = 0;
            if (this.options.reuseTiles) {
                this._unusedTiles = [];
            }
            this._tileContainer.innerHTML = "";
            if (this._animated && e && e.hard) {
                this._clearBgBuffer();
            }
            this._initContainer();
        },
        _getTileSize: function () {
            var map = this._map, zoom = map.getZoom() + this.options.zoomOffset, zoomN = this.options.maxNativeZoom, tileSize = this.options.tileSize;
            if (zoomN && zoom > zoomN) {
                tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
            }
            return tileSize;
        },
        _update: function () {
            if (!this._map) {
                return;
            }
            var map = this._map, bounds = map.getPixelBounds(), zoom = map.getZoom(), tileSize = this._getTileSize();
            if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
                return;
            }
            var tileBounds = L.bounds(bounds.min.divideBy(tileSize)._floor(), bounds.max.divideBy(tileSize)._floor());
            this._addTilesFromCenterOut(tileBounds);
            if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
                this._removeOtherTiles(tileBounds);
            }
        },
        _addTilesFromCenterOut: function (bounds) {
            var queue = [], center = bounds.getCenter();
            var j, i, point;
            for (j = bounds.min.y; j <= bounds.max.y; j++) {
                for (i = bounds.min.x; i <= bounds.max.x; i++) {
                    point = new L.Point(i, j);
                    if (this._tileShouldBeLoaded(point)) {
                        queue.push(point);
                    }
                }
            }
            var tilesToLoad = queue.length;
            if (tilesToLoad === 0) {
                return;
            }
            queue.sort(function (a, b) {
                return a.distanceTo(center) - b.distanceTo(center);
            });
            var fragment = document.createDocumentFragment();
            if (!this._tilesToLoad) {
                this.fire("loading");
            }
            this._tilesToLoad += tilesToLoad;
            for (i = 0; i < tilesToLoad; i++) {
                this._addTile(queue[i], fragment);
            }
            this._tileContainer.appendChild(fragment);
        },
        _tileShouldBeLoaded: function (tilePoint) {
            if (tilePoint.x + ":" + tilePoint.y in this._tiles) {
                return false;
            }
            var options = this.options;
            if (!options.continuousWorld) {
                var limit = this._getWrapTileNum();
                if (options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x) || tilePoint.y < 0 || tilePoint.y >= limit.y) {
                    return false;
                }
            }
            if (options.bounds) {
                var tileSize = options.tileSize, nwPoint = tilePoint.multiplyBy(tileSize), sePoint = nwPoint.add([tileSize, tileSize]), nw = this._map.unproject(nwPoint), se = this._map.unproject(sePoint);
                if (!options.continuousWorld && !options.noWrap) {
                    nw = nw.wrap();
                    se = se.wrap();
                }
                if (!options.bounds.intersects([nw, se])) {
                    return false;
                }
            }
            return true;
        },
        _removeOtherTiles: function (bounds) {
            var kArr, x, y, key;
            for (key in this._tiles) {
                kArr = key.split(":");
                x = parseInt(kArr[0], 10);
                y = parseInt(kArr[1], 10);
                if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
                    this._removeTile(key);
                }
            }
        },
        _removeTile: function (key) {
            var tile = this._tiles[key];
            this.fire("tileunload", {
                tile: tile,
                url: tile.src
            });
            if (this.options.reuseTiles) {
                L.DomUtil.removeClass(tile, "leaflet-tile-loaded");
                this._unusedTiles.push(tile);
            } else if (tile.parentNode === this._tileContainer) {
                this._tileContainer.removeChild(tile);
            }
            if (!L.Browser.android) {
                tile.onload = null;
                tile.src = L.Util.emptyImageUrl;
            }
            delete this._tiles[key];
        },
        _addTile: function (tilePoint, container) {
            var tilePos = this._getTilePos(tilePoint);
            var tile = this._getTile();
            L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome);
            this._tiles[tilePoint.x + ":" + tilePoint.y] = tile;
            this._loadTile(tile, tilePoint);
            if (tile.parentNode !== this._tileContainer) {
                container.appendChild(tile);
            }
        },
        _getZoomForUrl: function () {
            var options = this.options, zoom = this._map.getZoom();
            if (options.zoomReverse) {
                zoom = options.maxZoom - zoom;
            }
            zoom += options.zoomOffset;
            return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
        },
        _getTilePos: function (tilePoint) {
            var origin = this._map.getPixelOrigin(), tileSize = this._getTileSize();
            return tilePoint.multiplyBy(tileSize).subtract(origin);
        },
        getTileUrl: function (tilePoint) {
            return L.Util.template(this._url, L.extend({
                s: this._getSubdomain(tilePoint),
                z: tilePoint.z,
                x: tilePoint.x,
                y: tilePoint.y
            }, this.options));
        },
        _getWrapTileNum: function () {
            var crs = this._map.options.crs, size = crs.getSize(this._map.getZoom());
            return size.divideBy(this._getTileSize())._floor();
        },
        _adjustTilePoint: function (tilePoint) {
            var limit = this._getWrapTileNum();
            if (!this.options.continuousWorld && !this.options.noWrap) {
                tilePoint.x = (tilePoint.x % limit.x + limit.x) % limit.x;
            }
            if (this.options.tms) {
                tilePoint.y = limit.y - tilePoint.y - 1;
            }
            tilePoint.z = this._getZoomForUrl();
        },
        _getSubdomain: function (tilePoint) {
            var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
            return this.options.subdomains[index];
        },
        _getTile: function () {
            if (this.options.reuseTiles && this._unusedTiles.length > 0) {
                var tile = this._unusedTiles.pop();
                this._resetTile(tile);
                return tile;
            }
            return this._createTile();
        },
        _resetTile: function () {
        },
        _createTile: function () {
            var tile = L.DomUtil.create("img", "leaflet-tile");
            tile.style.width = tile.style.height = this._getTileSize() + "px";
            tile.galleryimg = "no";
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            if (L.Browser.ielt9 && this.options.opacity !== undefined) {
                L.DomUtil.setOpacity(tile, this.options.opacity);
            }
            if (L.Browser.mobileWebkit3d) {
                tile.style.WebkitBackfaceVisibility = "hidden";
            }
            return tile;
        },
        _loadTile: function (tile, tilePoint) {
            tile._layer = this;
            tile.onload = this._tileOnLoad;
            tile.onerror = this._tileOnError;
            this._adjustTilePoint(tilePoint);
            tile.src = this.getTileUrl(tilePoint);
            this.fire("tileloadstart", {
                tile: tile,
                url: tile.src
            });
        },
        _tileLoaded: function () {
            this._tilesToLoad--;
            if (this._animated) {
                L.DomUtil.addClass(this._tileContainer, "leaflet-zoom-animated");
            }
            if (!this._tilesToLoad) {
                this.fire("load");
                if (this._animated) {
                    clearTimeout(this._clearBgBufferTimer);
                    this._clearBgBufferTimer = setTimeout(L.bind(this._clearBgBuffer, this), 500);
                }
            }
        },
        _tileOnLoad: function () {
            var layer = this._layer;
            if (this.src !== L.Util.emptyImageUrl) {
                L.DomUtil.addClass(this, "leaflet-tile-loaded");
                layer.fire("tileload", {
                    tile: this,
                    url: this.src
                });
            }
            layer._tileLoaded();
        },
        _tileOnError: function () {
            var layer = this._layer;
            layer.fire("tileerror", {
                tile: this,
                url: this.src
            });
            var newUrl = layer.options.errorTileUrl;
            if (newUrl) {
                this.src = newUrl;
            }
            layer._tileLoaded();
        }
    });
    L.tileLayer = function (url, options) {
        return new L.TileLayer(url, options);
    };
    L.TileLayer.WMS = L.TileLayer.extend({
        defaultWmsParams: {
            service: "WMS",
            request: "GetMap",
            version: "1.1.1",
            layers: "",
            styles: "",
            format: "image/jpeg",
            transparent: false
        },
        initialize: function (url, options) {
            this._url = url;
            var wmsParams = L.extend({}, this.defaultWmsParams), tileSize = options.tileSize || this.options.tileSize;
            if (options.detectRetina && L.Browser.retina) {
                wmsParams.width = wmsParams.height = tileSize * 2;
            } else {
                wmsParams.width = wmsParams.height = tileSize;
            }
            for (var i in options) {
                if (!this.options.hasOwnProperty(i) && i !== "crs") {
                    wmsParams[i] = options[i];
                }
            }
            this.wmsParams = wmsParams;
            L.setOptions(this, options);
        },
        onAdd: function (map) {
            this._crs = this.options.crs || map.options.crs;
            this._wmsVersion = parseFloat(this.wmsParams.version);
            var projectionKey = this._wmsVersion >= 1.3 ? "crs" : "srs";
            this.wmsParams[projectionKey] = this._crs.code;
            L.TileLayer.prototype.onAdd.call(this, map);
        },
        getTileUrl: function (tilePoint) {
            var map = this._map, tileSize = this.options.tileSize, nwPoint = tilePoint.multiplyBy(tileSize), sePoint = nwPoint.add([tileSize, tileSize]), nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)), se = this._crs.project(map.unproject(sePoint, tilePoint.z)), bbox = this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ? [se.y, nw.x, nw.y, se.x].join(",") : [nw.x, se.y, se.x, nw.y].join(","), url = L.Util.template(this._url, {
                s: this._getSubdomain(tilePoint)
            });
            return url + L.Util.getParamString(this.wmsParams, url, true) + "&BBOX=" + bbox;
        },
        setParams: function (params, noRedraw) {
            L.extend(this.wmsParams, params);
            if (!noRedraw) {
                this.redraw();
            }
            return this;
        }
    });
    L.tileLayer.wms = function (url, options) {
        return new L.TileLayer.WMS(url, options);
    };
    L.TileLayer.Canvas = L.TileLayer.extend({
        options: {
            async: false
        },
        initialize: function (options) {
            L.setOptions(this, options);
        },
        redraw: function () {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            for (var i in this._tiles) {
                this._redrawTile(this._tiles[i]);
            }
            return this;
        },
        _redrawTile: function (tile) {
            this.drawTile(tile, tile._tilePoint, this._map._zoom);
        },
        _createTile: function () {
            var tile = L.DomUtil.create("canvas", "leaflet-tile");
            tile.width = tile.height = this.options.tileSize;
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            return tile;
        },
        _loadTile: function (tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            this._redrawTile(tile);
            if (!this.options.async) {
                this.tileDrawn(tile);
            }
        },
        drawTile: function () {
        },
        tileDrawn: function (tile) {
            this._tileOnLoad.call(tile);
        }
    });
    L.tileLayer.canvas = function (options) {
        return new L.TileLayer.Canvas(options);
    };
    L.ImageOverlay = L.Class.extend({
        includes: L.Mixin.Events,
        options: {
            opacity: 1
        },
        initialize: function (url, bounds, options) {
            this._url = url;
            this._bounds = L.latLngBounds(bounds);
            L.setOptions(this, options);
        },
        onAdd: function (map) {
            this._map = map;
            if (!this._image) {
                this._initImage();
            }
            map._panes.overlayPane.appendChild(this._image);
            map.on("viewreset", this._reset, this);
            if (map.options.zoomAnimation && L.Browser.any3d) {
                map.on("zoomanim", this._animateZoom, this);
            }
            this._reset();
        },
        onRemove: function (map) {
            map.getPanes().overlayPane.removeChild(this._image);
            map.off("viewreset", this._reset, this);
            if (map.options.zoomAnimation) {
                map.off("zoomanim", this._animateZoom, this);
            }
        },
        addTo: function (map) {
            map.addLayer(this);
            return this;
        },
        setOpacity: function (opacity) {
            this.options.opacity = opacity;
            this._updateOpacity();
            return this;
        },
        bringToFront: function () {
            if (this._image) {
                this._map._panes.overlayPane.appendChild(this._image);
            }
            return this;
        },
        bringToBack: function () {
            var pane = this._map._panes.overlayPane;
            if (this._image) {
                pane.insertBefore(this._image, pane.firstChild);
            }
            return this;
        },
        setUrl: function (url) {
            this._url = url;
            this._image.src = this._url;
        },
        getAttribution: function () {
            return this.options.attribution;
        },
        _initImage: function () {
            this._image = L.DomUtil.create("img", "leaflet-image-layer");
            if (this._map.options.zoomAnimation && L.Browser.any3d) {
                L.DomUtil.addClass(this._image, "leaflet-zoom-animated");
            } else {
                L.DomUtil.addClass(this._image, "leaflet-zoom-hide");
            }
            this._updateOpacity();
            L.extend(this._image, {
                galleryimg: "no",
                onselectstart: L.Util.falseFn,
                onmousemove: L.Util.falseFn,
                onload: L.bind(this._onImageLoad, this),
                src: this._url
            });
        },
        _animateZoom: function (e) {
            var map = this._map, image = this._image, scale = map.getZoomScale(e.zoom), nw = this._bounds.getNorthWest(), se = this._bounds.getSouthEast(), topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center), size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft), origin = topLeft._add(size._multiplyBy(1 / 2 * (1 - 1 / scale)));
            image.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(origin) + " scale(" + scale + ") ";
        },
        _reset: function () {
            var image = this._image, topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()), size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);
            L.DomUtil.setPosition(image, topLeft);
            image.style.width = size.x + "px";
            image.style.height = size.y + "px";
        },
        _onImageLoad: function () {
            this.fire("load");
        },
        _updateOpacity: function () {
            L.DomUtil.setOpacity(this._image, this.options.opacity);
        }
    });
    L.imageOverlay = function (url, bounds, options) {
        return new L.ImageOverlay(url, bounds, options);
    };
    L.Icon = L.Class.extend({
        options: {
            className: ""
        },
        initialize: function (options) {
            L.setOptions(this, options);
        },
        createIcon: function (oldIcon) {
            return this._createIcon("icon", oldIcon);
        },
        createShadow: function (oldIcon) {
            return this._createIcon("shadow", oldIcon);
        },
        _createIcon: function (name, oldIcon) {
            var src = this._getIconUrl(name);
            if (!src) {
                if (name === "icon") {
                    throw new Error("iconUrl not set in Icon options (see the docs).");
                }
                return null;
            }
            var img;
            if (!oldIcon || oldIcon.tagName !== "IMG") {
                img = this._createImg(src);
            } else {
                img = this._createImg(src, oldIcon);
            }
            this._setIconStyles(img, name);
            return img;
        },
        _setIconStyles: function (img, name) {
            var options = this.options, size = L.point(options[name + "Size"]), anchor;
            if (name === "shadow") {
                anchor = L.point(options.shadowAnchor || options.iconAnchor);
            } else {
                anchor = L.point(options.iconAnchor);
            }
            if (!anchor && size) {
                anchor = size.divideBy(2, true);
            }
            img.className = "leaflet-marker-" + name + " " + options.className;
            if (anchor) {
                img.style.marginLeft = -anchor.x + "px";
                img.style.marginTop = -anchor.y + "px";
            }
            if (size) {
                img.style.width = size.x + "px";
                img.style.height = size.y + "px";
            }
        },
        _createImg: function (src, el) {
            el = el || document.createElement("img");
            el.src = src;
            return el;
        },
        _getIconUrl: function (name) {
            if (L.Browser.retina && this.options[name + "RetinaUrl"]) {
                return this.options[name + "RetinaUrl"];
            }
            return this.options[name + "Url"];
        }
    });
    L.icon = function (options) {
        return new L.Icon(options);
    };
    L.Icon.Default = L.Icon.extend({
        options: {
            iconSize: [30, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        },
        _getIconUrl: function (name) {
            var key = name + "Url";
            if (this.options[key]) {
                return this.options[key];
            }
            if (L.Browser.retina && name === "icon") {
                name += "-2x";
            }
            var path = L.Icon.Default.imagePath;
            if (!path) {
                throw new Error("Couldn't autodetect L.Icon.Default.imagePath, set it manually.");
            }
            return path + "/marker-" + name + ".png";
        }
    });
    L.Icon.Default.imagePath = function () {
        var scripts = document.getElementsByTagName("script"), leafletRe = /[\/^]higis[\-\._]?([\w\-\._]*)\.js\??/;
        var i, len, src, matches, path;
        for (i = 0, len = scripts.length; i < len; i++) {
            src = scripts[i].src;
            matches = src.match(leafletRe);
            if (matches) {
                path = src.split(leafletRe)[0];
                return (path ? path + "/" : "") + "images";
            }
        }
    }();

    /*
     * L.Marker is used to display clickable/draggable icons on the map.jj
     */
    L.Marker = L.Class.extend({
        includes: L.Mixin.Events,
        options: {
            icon: new L.Icon.Default(),
            title: "",
            alt: "",
            clickable: true,
            draggable: false,
            keyboard: true,
            zIndexOffset: 0,
            opacity: 1,
            riseOnHover: false,
            riseOffset: 250
        },
        initialize: function (latlng, options) {
            L.setOptions(this, options);
            this._latlng = L.latLng(latlng);
        },
        onAdd: function (map) {
            this._map = map;
            map.on("viewreset", this.update, this);
            this._initIcon();
            this.update();
            this.fire("add");
            if (map.options.zoomAnimation && map.options.markerZoomAnimation) {
                map.on("zoomanim", this._animateZoom, this);
            }
        },
        addTo: function (map) {
            map.addLayer(this);
            return this;
        },
        onRemove: function (map) {
            if (this.dragging) {
                this.dragging.disable();
            }
            this._removeIcon();
            this._removeShadow();
            this.fire("remove");
            map.off({
                viewreset: this.update,
                zoomanim: this._animateZoom
            }, this);
            this._map = null;
        },
        getLatLng: function () {
            return this._latlng;
        },
        setLatLng: function (latlng) {
            this._latlng = L.latLng(latlng);
            this.update();
            return this.fire("move", {
                latlng: this._latlng
            });
        },
        setZIndexOffset: function (offset) {
            this.options.zIndexOffset = offset;
            this.update();
            return this;
        },
        setIcon: function (icon) {
            this.options.icon = icon;
            if (this._map) {
                this._initIcon();
                this.update();
            }
            if (this._popup) {
                this.bindPopup(this._popup);
            }
            return this;
        },
        update: function () {
            if (this._icon) {
                var pos = this._map.latLngToLayerPoint(this._latlng).round();
                this._setPos(pos);
            }
            return this;
        },
        _initIcon: function () {
            var options = this.options, map = this._map, animation = map.options.zoomAnimation && map.options.markerZoomAnimation, classToAdd = animation ? "leaflet-zoom-animated" : "leaflet-zoom-hide";
            var icon = options.icon.createIcon(this._icon), addIcon = false;
            if (icon !== this._icon) {
                if (this._icon) {
                    this._removeIcon();
                }
                addIcon = true;
                if (options.title) {
                    icon.title = options.title;
                }
                if (options.alt) {
                    icon.alt = options.alt;
                }
            }
            L.DomUtil.addClass(icon, classToAdd);
            if (options.keyboard) {
                icon.tabIndex = "0";
            }
            this._icon = icon;
            this._initInteraction();
            if (options.riseOnHover) {
                L.DomEvent.on(icon, "mouseover", this._bringToFront, this).on(icon, "mouseout", this._resetZIndex, this);
            }
            var newShadow = options.icon.createShadow(this._shadow), addShadow = false;
            if (newShadow !== this._shadow) {
                this._removeShadow();
                addShadow = true;
            }
            if (newShadow) {
                L.DomUtil.addClass(newShadow, classToAdd);
            }
            this._shadow = newShadow;
            if (options.opacity < 1) {
                this._updateOpacity();
            }
            var panes = this._map._panes;
            if (addIcon) {
                panes.markerPane.appendChild(this._icon);
            }
            if (newShadow && addShadow) {
                panes.shadowPane.appendChild(this._shadow);
            }
        },
        _removeIcon: function () {
            if (this.options.riseOnHover) {
                L.DomEvent.off(this._icon, "mouseover", this._bringToFront).off(this._icon, "mouseout", this._resetZIndex);
            }
            this._map._panes.markerPane.removeChild(this._icon);
            this._icon = null;
        },
        _removeShadow: function () {
            if (this._shadow) {
                this._map._panes.shadowPane.removeChild(this._shadow);
            }
            this._shadow = null;
        },
        _setPos: function (pos) {
            L.DomUtil.setPosition(this._icon, pos);
            if (this._shadow) {
                L.DomUtil.setPosition(this._shadow, pos);
            }
            this._zIndex = pos.y + this.options.zIndexOffset;
            this._resetZIndex();
        },
        _updateZIndex: function (offset) {
            this._icon.style.zIndex = this._zIndex + offset;
        },
        _animateZoom: function (opt) {
            var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
            this._setPos(pos);
        },
        _initInteraction: function () {
            if (!this.options.clickable) {
                return;
            }
            var icon = this._icon, events = ["dblclick", "mousedown", "mouseover", "mouseout", "contextmenu"];
            L.DomUtil.addClass(icon, "leaflet-clickable");
            L.DomEvent.on(icon, "click", this._onMouseClick, this);
            L.DomEvent.on(icon, "keypress", this._onKeyPress, this);
            for (var i = 0; i < events.length; i++) {
                L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
            }
            if (L.Handler.MarkerDrag) {
                this.dragging = new L.Handler.MarkerDrag(this);
                if (this.options.draggable) {
                    this.dragging.enable();
                }
            }
        },
        _onMouseClick: function (e) {
            var wasDragged = this.dragging && this.dragging.moved();
            if (this.hasEventListeners(e.type) || wasDragged) {
                L.DomEvent.stopPropagation(e);
            }
            if (wasDragged) {
                return;
            }
            if ((!this.dragging || !this.dragging._enabled) && this._map.dragging && this._map.dragging.moved()) {
                return;
            }
            this.fire(e.type, {
                originalEvent: e,
                latlng: this._latlng
            });
        },
        _onKeyPress: function (e) {
            if (e.keyCode === 13) {
                this.fire("click", {
                    originalEvent: e,
                    latlng: this._latlng
                });
            }
        },
        _fireMouseEvent: function (e) {
            this.fire(e.type, {
                originalEvent: e,
                latlng: this._latlng
            });
            if (e.type === "contextmenu" && this.hasEventListeners(e.type)) {
                L.DomEvent.preventDefault(e);
            }
            if (e.type !== "mousedown") {
                L.DomEvent.stopPropagation(e);
            } else {
                L.DomEvent.preventDefault(e);
            }
        },
        setOpacity: function (opacity) {
            this.options.opacity = opacity;
            if (this._map) {
                this._updateOpacity();
            }
            return this;
        },
        _updateOpacity: function () {
            L.DomUtil.setOpacity(this._icon, this.options.opacity);
            if (this._shadow) {
                L.DomUtil.setOpacity(this._shadow, this.options.opacity);
            }
        },
        _bringToFront: function () {
            this._updateZIndex(this.options.riseOffset);
        },
        _resetZIndex: function () {
            this._updateZIndex(0);
        }
    });
    L.marker = function (latlng, options) {
        return new L.Marker(latlng, options);
    };


    L.DivIcon = L.Icon.extend({
        options: {
            iconSize: [12, 12],
            className: "leaflet-div-icon",
            html: false
        },
        createIcon: function (oldIcon) {
            var div = oldIcon && oldIcon.tagName === "DIV" ? oldIcon : document.createElement("div"), options = this.options;
            if (options.html !== false) {
                div.innerHTML = options.html;
            } else {
                div.innerHTML = "";
            }
            if (options.bgPos) {
                div.style.backgroundPosition = -options.bgPos.x + "px " + -options.bgPos.y + "px";
            }
            this._setIconStyles(div, "icon");
            return div;
        },
        createShadow: function () {
            return null;
        }
    });
    L.divIcon = function (options) {
        return new L.DivIcon(options);
    };
    L.Map.mergeOptions({
        closePopupOnClick: true
    });
    L.Popup = L.Class.extend({
        includes: L.Mixin.Events,
        options: {
            minWidth: 50,
            maxWidth: 300,
            autoPan: true,
            closeButton: true,
            offset: [0, 7],
            autoPanPadding: [5, 5],
            keepInView: false,
            className: "",
            zoomAnimation: true
        },
        initialize: function (options, source) {
            L.setOptions(this, options);
            this._source = source;
            this._animated = L.Browser.any3d && this.options.zoomAnimation;
            this._isOpen = false;
        },
        onAdd: function (map) {
            this._map = map;
            if (!this._container) {
                this._initLayout();
            }
            var animFade = map.options.fadeAnimation;
            if (animFade) {
                L.DomUtil.setOpacity(this._container, 0);
            }
            map._panes.popupPane.appendChild(this._container);
            map.on(this._getEvents(), this);
            this.update();
            if (animFade) {
                L.DomUtil.setOpacity(this._container, 1);
            }
            this.fire("open");
            map.fire("popupopen", {
                popup: this
            });
            if (this._source) {
                this._source.fire("popupopen", {
                    popup: this
                });
            }
        },
        addTo: function (map) {
            map.addLayer(this);
            return this;
        },
        openOn: function (map) {
            map.openPopup(this);
            return this;
        },
        onRemove: function (map) {
            map._panes.popupPane.removeChild(this._container);
            L.Util.falseFn(this._container.offsetWidth);
            map.off(this._getEvents(), this);
            if (map.options.fadeAnimation) {
                L.DomUtil.setOpacity(this._container, 0);
            }
            this._map = null;
            this.fire("close");
            map.fire("popupclose", {
                popup: this
            });
            if (this._source) {
                this._source.fire("popupclose", {
                    popup: this
                });
            }
        },
        getLatLng: function () {
            return this._latlng;
        },
        setLatLng: function (latlng) {
            this._latlng = L.latLng(latlng);
            if (this._map) {
                this._updatePosition();
                this._adjustPan();
            }
            return this;
        },
        getContent: function () {
            return this._content;
        },
        setContent: function (content) {
            this._content = content;
            this.update();
            return this;
        },
        update: function () {
            if (!this._map) {
                return;
            }
            this._container.style.visibility = "hidden";
            this._updateContent();
            this._updateLayout();
            this._updatePosition();
            this._container.style.visibility = "";
            this._adjustPan();
        },
        _getEvents: function () {
            var events = {
                viewreset: this._updatePosition
            };
            if (this._animated) {
                events.zoomanim = this._zoomAnimation;
            }
            if ("closeOnClick" in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
                events.preclick = this._close;
            }
            if (this.options.keepInView) {
                events.moveend = this._adjustPan;
            }
            return events;
        },
        _close: function () {
            if (this._map) {
                this._map.closePopup(this);
            }
        },
        _initLayout: function () {
            var prefix = "leaflet-popup", containerClass = prefix + " " + this.options.className + " leaflet-zoom-" + (this._animated ? "animated" : "hide"), container = this._container = L.DomUtil.create("div", containerClass), closeButton;
            if (this.options.closeButton) {
                closeButton = this._closeButton = L.DomUtil.create("a", prefix + "-close-button", container);
                closeButton.href = "#close";
                closeButton.innerHTML = "&#215;";
                L.DomEvent.disableClickPropagation(closeButton);
                L.DomEvent.on(closeButton, "click", this._onCloseButtonClick, this);
            }
            var wrapper = this._wrapper = L.DomUtil.create("div", prefix + "-content-wrapper", container);
            L.DomEvent.disableClickPropagation(wrapper);
            this._contentNode = L.DomUtil.create("div", prefix + "-content", wrapper);
            L.DomEvent.disableScrollPropagation(this._contentNode);
            L.DomEvent.on(wrapper, "contextmenu", L.DomEvent.stopPropagation);
            this._tipContainer = L.DomUtil.create("div", prefix + "-tip-container", container);
            this._tip = L.DomUtil.create("div", prefix + "-tip", this._tipContainer);
        },
        _updateContent: function () {
            if (!this._content) {
                return;
            }
            if (typeof this._content === "string") {
                this._contentNode.innerHTML = this._content;
            } else {
                while (this._contentNode.hasChildNodes()) {
                    this._contentNode.removeChild(this._contentNode.firstChild);
                }
                this._contentNode.appendChild(this._content);
            }
            this.fire("contentupdate");
        },
        _updateLayout: function () {
            var container = this._contentNode, style = container.style;
            style.width = "";
            style.whiteSpace = "nowrap";
            var width = container.offsetWidth;
            width = Math.min(width, this.options.maxWidth);
            width = Math.max(width, this.options.minWidth);
            style.width = width + 1 + "px";
            style.whiteSpace = "";
            style.height = "";
            var height = container.offsetHeight, maxHeight = this.options.maxHeight, scrolledClass = "leaflet-popup-scrolled";
            if (maxHeight && height > maxHeight) {
                style.height = maxHeight + "px";
                L.DomUtil.addClass(container, scrolledClass);
            } else {
                L.DomUtil.removeClass(container, scrolledClass);
            }
            this._containerWidth = this._container.offsetWidth;
        },
        _updatePosition: function () {
            if (!this._map) {
                return;
            }
            var pos = this._map.latLngToLayerPoint(this._latlng), animated = this._animated, offset = L.point(this.options.offset);
            if (animated) {
                L.DomUtil.setPosition(this._container, pos);
            }
            this._containerBottom = -offset.y - (animated ? 0 : pos.y);
            this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (animated ? 0 : pos.x);
            this._container.style.bottom = this._containerBottom + "px";
            this._container.style.left = this._containerLeft + "px";
        },
        _zoomAnimation: function (opt) {
            var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);
            L.DomUtil.setPosition(this._container, pos);
        },
        _adjustPan: function () {
            if (!this.options.autoPan) {
                return;
            }
            var map = this._map, containerHeight = this._container.offsetHeight, containerWidth = this._containerWidth, layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);
            if (this._animated) {
                layerPos._add(L.DomUtil.getPosition(this._container));
            }
            var containerPos = map.layerPointToContainerPoint(layerPos), padding = L.point(this.options.autoPanPadding), paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding), paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding), size = map.getSize(), dx = 0, dy = 0;
            if (containerPos.x + containerWidth + paddingBR.x > size.x) {
                dx = containerPos.x + containerWidth - size.x + paddingBR.x;
            }
            if (containerPos.x - dx - paddingTL.x < 0) {
                dx = containerPos.x - paddingTL.x;
            }
            if (containerPos.y + containerHeight + paddingBR.y > size.y) {
                dy = containerPos.y + containerHeight - size.y + paddingBR.y;
            }
            if (containerPos.y - dy - paddingTL.y < 0) {
                dy = containerPos.y - paddingTL.y;
            }
            if (dx || dy) {
                map.fire("autopanstart").panBy([dx, dy]);
            }
        },
        _onCloseButtonClick: function (e) {
            this._close();
            L.DomEvent.stop(e);
        }
    });
    L.popup = function (options, source) {
        return new L.Popup(options, source);
    };
    L.Map.include({
        openPopup: function (popup, latlng, options) {
            this.closePopup();
            if (!(popup instanceof L.Popup)) {
                var content = popup;
                popup = new L.Popup(options).setLatLng(latlng).setContent(content);
            }
            popup._isOpen = true;
            this._popup = popup;
            return this.addLayer(popup);
        },
        closePopup: function (popup) {
            if (!popup || popup === this._popup) {
                popup = this._popup;
                this._popup = null;
            }
            if (popup) {
                this.removeLayer(popup);
                popup._isOpen = false;
            }
            return this;
        }
    });
    L.Marker.include({
        openPopup: function () {
            if (this._popup && this._map && !this._map.hasLayer(this._popup)) {
                this._popup.setLatLng(this._latlng);
                this._map.openPopup(this._popup);
            }
            return this;
        },
        closePopup: function () {
            if (this._popup) {
                this._popup._close();
            }
            return this;
        },
        togglePopup: function () {
            if (this._popup) {
                if (this._popup._isOpen) {
                    this.closePopup();
                } else {
                    this.openPopup();
                }
            }
            return this;
        },
        bindPopup: function (content, options) {
            var anchor = L.point(this.options.icon.options.popupAnchor || [0, 0]);
            anchor = anchor.add(L.Popup.prototype.options.offset);
            if (options && options.offset) {
                anchor = anchor.add(options.offset);
            }
            options = L.extend({
                offset: anchor
            }, options);
            if (!this._popupHandlersAdded) {
                this.on("click", this.togglePopup, this).on("remove", this.closePopup, this).on("move", this._movePopup, this);
                this._popupHandlersAdded = true;
            }
            if (content instanceof L.Popup) {
                L.setOptions(content, options);
                this._popup = content;
            } else {
                this._popup = new L.Popup(options, this).setContent(content);
            }
            return this;
        },
        setPopupContent: function (content) {
            if (this._popup) {
                this._popup.setContent(content);
            }
            return this;
        },
        unbindPopup: function () {
            if (this._popup) {
                this._popup = null;
                this.off("click", this.togglePopup, this).off("remove", this.closePopup, this).off("move", this._movePopup, this);
                this._popupHandlersAdded = false;
            }
            return this;
        },
        getPopup: function () {
            return this._popup;
        },
        _movePopup: function (e) {
            this._popup.setLatLng(e.latlng);
        }
    });
    L.LayerGroup = L.Class.extend({
        initialize: function (layers) {
            this._layers = {};
            var i, len;
            if (layers) {
                for (i = 0, len = layers.length; i < len; i++) {
                    this.addLayer(layers[i]);
                }
            }
        },
        addLayer: function (layer) {
            var id = this.getLayerId(layer);
            this._layers[id] = layer;
            if (this._map) {
                this._map.addLayer(layer);
            }
            return this;
        },
        removeLayer: function (layer) {
            var id = layer in this._layers ? layer : this.getLayerId(layer);
            if (this._map && this._layers[id]) {
                this._map.removeLayer(this._layers[id]);
            }
            delete this._layers[id];
            return this;
        },
        hasLayer: function (layer) {
            if (!layer) {
                return false;
            }
            return layer in this._layers || this.getLayerId(layer) in this._layers;
        },
        clearLayers: function () {
            this.eachLayer(this.removeLayer, this);
            return this;
        },
        invoke: function (methodName) {
            var args = Array.prototype.slice.call(arguments, 1), i, layer;
            for (i in this._layers) {
                layer = this._layers[i];
                if (layer[methodName]) {
                    layer[methodName].apply(layer, args);
                }
            }
            return this;
        },
        onAdd: function (map) {
            this._map = map;
            this.eachLayer(map.addLayer, map);
        },
        onRemove: function (map) {
            this.eachLayer(map.removeLayer, map);
            this._map = null;
        },
        addTo: function (map) {
            map.addLayer(this);
            return this;
        },
        eachLayer: function (method, context) {
            for (var i in this._layers) {
                method.call(context, this._layers[i]);
            }
            return this;
        },
        getLayer: function (id) {
            return this._layers[id];
        },
        getLayers: function () {
            var layers = [];
            for (var i in this._layers) {
                layers.push(this._layers[i]);
            }
            return layers;
        },
        setZIndex: function (zIndex) {
            return this.invoke("setZIndex", zIndex);
        },
        getLayerId: function (layer) {
            return L.stamp(layer);
        }
    });
    L.layerGroup = function (layers) {
        return new L.LayerGroup(layers);
    };
    L.FeatureGroup = L.LayerGroup.extend({
        includes: L.Mixin.Events,
        statics: {
            EVENTS: "click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose"
        },
        addLayer: function (layer) {
            if (this.hasLayer(layer)) {
                return this;
            }
            if ("on" in layer) {
                layer.on(L.FeatureGroup.EVENTS, this._propagateEvent, this);
            }
            L.LayerGroup.prototype.addLayer.call(this, layer);
            if (this._popupContent && layer.bindPopup) {
                layer.bindPopup(this._popupContent, this._popupOptions);
            }
            return this.fire("layeradd", {
                layer: layer
            });
        },
        removeLayer: function (layer) {
            if (!this.hasLayer(layer)) {
                return this;
            }
            if (layer in this._layers) {
                layer = this._layers[layer];
            }
            layer.off(L.FeatureGroup.EVENTS, this._propagateEvent, this);
            L.LayerGroup.prototype.removeLayer.call(this, layer);
            if (this._popupContent) {
                this.invoke("unbindPopup");
            }
            return this.fire("layerremove", {
                layer: layer
            });
        },
        bindPopup: function (content, options) {
            this._popupContent = content;
            this._popupOptions = options;
            return this.invoke("bindPopup", content, options);
        },
        openPopup: function (latlng) {
            for (var id in this._layers) {
                this._layers[id].openPopup(latlng);
                break;
            }
            return this;
        },
        setStyle: function (style) {
            return this.invoke("setStyle", style);
        },
        bringToFront: function () {
            return this.invoke("bringToFront");
        },
        bringToBack: function () {
            return this.invoke("bringToBack");
        },
        getBounds: function () {
            var bounds = new L.LatLngBounds();
            this.eachLayer(function (layer) {
                bounds.extend(layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds());
            });
            return bounds;
        },
        _propagateEvent: function (e) {
            e = L.extend({
                layer: e.target,
                target: this
            }, e);
            this.fire(e.type, e);
        }
    });
    L.featureGroup = function (layers) {
        return new L.FeatureGroup(layers);
    };
    L.Path = L.Class.extend({
        includes: [L.Mixin.Events],
        statics: {
            CLIP_PADDING: function () {
                var max = L.Browser.mobile ? 1280 : 2e3, target = (max / Math.max(window.outerWidth, window.outerHeight) - 1) / 2;
                return Math.max(0, Math.min(.5, target));
            }()
        },
        options: {
            stroke: true,
            color: "#0033ff",
            dashArray: null,
            lineCap: null,
            lineJoin: null,
            weight: 5,
            opacity: .5,
            fill: false,
            fillColor: null,
            fillOpacity: .2,
            clickable: true
        },
        initialize: function (options) {
            L.setOptions(this, options);
        },
        onAdd: function (map) {
            this._map = map;
            if (!this._container) {
                this._initElements();
                this._initEvents();
            }
            this.projectLatlngs();
            this._updatePath();
            if (this._container) {
                this._map._pathRoot.appendChild(this._container);
            }
            this.fire("add");
            map.on({
                viewreset: this.projectLatlngs,
                moveend: this._updatePath
            }, this);
        },
        addTo: function (map) {
            map.addLayer(this);
            return this;
        },
        onRemove: function (map) {
            map._pathRoot.removeChild(this._container);
            this.fire("remove");
            this._map = null;
            if (L.Browser.vml) {
                this._container = null;
                this._stroke = null;
                this._fill = null;
            }
            map.off({
                viewreset: this.projectLatlngs,
                moveend: this._updatePath
            }, this);
        },
        projectLatlngs: function () {
        },
        setStyle: function (style) {
            L.setOptions(this, style);
            if (this._container) {
                this._updateStyle();
            }
            return this;
        },
        redraw: function () {
            if (this._map) {
                this.projectLatlngs();
                this._updatePath();
            }
            return this;
        }
    });
    L.Map.include({
        _updatePathViewport: function () {
            var p = L.Path.CLIP_PADDING, size = this.getSize(), panePos = L.DomUtil.getPosition(this._mapPane), min = panePos.multiplyBy(-1)._subtract(size.multiplyBy(p)._round()), max = min.add(size.multiplyBy(1 + p * 2)._round());
            this._pathViewport = new L.Bounds(min, max);
        }
    });
    L.Path.SVG_NS = "http://www.w3.org/2000/svg";
    L.Browser.svg = !!(document.createElementNS && document.createElementNS(L.Path.SVG_NS, "svg").createSVGRect);
    L.Path = L.Path.extend({
        statics: {
            SVG: L.Browser.svg
        },
        bringToFront: function () {
            var root = this._map._pathRoot, path = this._container;
            if (path && root.lastChild !== path) {
                root.appendChild(path);
            }
            return this;
        },
        bringToBack: function () {
            var root = this._map._pathRoot, path = this._container, first = root.firstChild;
            if (path && first !== path) {
                root.insertBefore(path, first);
            }
            return this;
        },
        getPathString: function () {
        },
        _createElement: function (name) {
            return document.createElementNS(L.Path.SVG_NS, name);
        },
        _initElements: function () {
            this._map._initPathRoot();
            this._initPath();
            this._initStyle();
        },
        _initPath: function () {
            this._container = this._createElement("g");
            this._path = this._createElement("path");
            if (this.options.className) {
                L.DomUtil.addClass(this._path, this.options.className);
            }
            this._container.appendChild(this._path);
        },
        _initStyle: function () {
            if (this.options.stroke) {
                this._path.setAttribute("stroke-linejoin", "round");
                this._path.setAttribute("stroke-linecap", "round");
            }
            if (this.options.fill) {
                this._path.setAttribute("fill-rule", "evenodd");
            }
            if (this.options.pointerEvents) {
                this._path.setAttribute("pointer-events", this.options.pointerEvents);
            }
            if (!this.options.clickable && !this.options.pointerEvents) {
                this._path.setAttribute("pointer-events", "none");
            }
            this._updateStyle();
        },
        _updateStyle: function () {
            if (this.options.stroke) {
                this._path.setAttribute("stroke", this.options.color);
                this._path.setAttribute("stroke-opacity", this.options.opacity);
                this._path.setAttribute("stroke-width", this.options.weight);
                if (this.options.dashArray) {
                    this._path.setAttribute("stroke-dasharray", this.options.dashArray);
                } else {
                    this._path.removeAttribute("stroke-dasharray");
                }
                if (this.options.lineCap) {
                    this._path.setAttribute("stroke-linecap", this.options.lineCap);
                }
                if (this.options.lineJoin) {
                    this._path.setAttribute("stroke-linejoin", this.options.lineJoin);
                }
            } else {
                this._path.setAttribute("stroke", "none");
            }
            if (this.options.fill) {
                this._path.setAttribute("fill", this.options.fillColor || this.options.color);
                this._path.setAttribute("fill-opacity", this.options.fillOpacity);
            } else {
                this._path.setAttribute("fill", "none");
            }
        },
        _updatePath: function () {
            var str = this.getPathString();
            if (!str) {
                str = "M0 0";
            }
            this._path.setAttribute("d", str);
        },
        _initEvents: function () {
            if (this.options.clickable) {
                if (L.Browser.svg || !L.Browser.vml) {
                    L.DomUtil.addClass(this._path, "leaflet-clickable");
                }
                L.DomEvent.on(this._container, "click", this._onMouseClick, this);
                var events = ["dblclick", "mousedown", "mouseover", "mouseout", "mousemove", "contextmenu"];
                for (var i = 0; i < events.length; i++) {
                    L.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);
                }
            }
        },
        _onMouseClick: function (e) {
            if (this._map.dragging && this._map.dragging.moved()) {
                return;
            }
            this._fireMouseEvent(e);
        },
        _fireMouseEvent: function (e) {
            if (!this.hasEventListeners(e.type)) {
                return;
            }
            var map = this._map, containerPoint = map.mouseEventToContainerPoint(e), layerPoint = map.containerPointToLayerPoint(containerPoint), latlng = map.layerPointToLatLng(layerPoint);
            this.fire(e.type, {
                latlng: latlng,
                layerPoint: layerPoint,
                containerPoint: containerPoint,
                originalEvent: e
            });
            if (e.type === "contextmenu") {
                L.DomEvent.preventDefault(e);
            }
            if (e.type !== "mousemove") {
                L.DomEvent.stopPropagation(e);
            }
        }
    });
    L.Map.include({
        _initPathRoot: function () {
            if (!this._pathRoot) {
                this._pathRoot = L.Path.prototype._createElement("svg");
                this._panes.overlayPane.appendChild(this._pathRoot);
                if (this.options.zoomAnimation && L.Browser.any3d) {
                    L.DomUtil.addClass(this._pathRoot, "leaflet-zoom-animated");
                    this.on({
                        zoomanim: this._animatePathZoom,
                        zoomend: this._endPathZoom
                    });
                } else {
                    L.DomUtil.addClass(this._pathRoot, "leaflet-zoom-hide");
                }
                this.on("moveend", this._updateSvgViewport);
                this._updateSvgViewport();
            }
        },
        _animatePathZoom: function (e) {
            var scale = this.getZoomScale(e.zoom), offset = this._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._pathViewport.min);
            this._pathRoot.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + " scale(" + scale + ") ";
            this._pathZooming = true;
        },
        _endPathZoom: function () {
            this._pathZooming = false;
        },
        _updateSvgViewport: function () {
            if (this._pathZooming) {
                return;
            }
            this._updatePathViewport();
            var vp = this._pathViewport, min = vp.min, max = vp.max, width = max.x - min.x, height = max.y - min.y, root = this._pathRoot, pane = this._panes.overlayPane;
            if (L.Browser.mobileWebkit) {
                pane.removeChild(root);
            }
            L.DomUtil.setPosition(root, min);
            root.setAttribute("width", width);
            root.setAttribute("height", height);
            root.setAttribute("viewBox", [min.x, min.y, width, height].join(" "));
            if (L.Browser.mobileWebkit) {
                pane.appendChild(root);
            }
        }
    });
    L.Path.include({
        bindPopup: function (content, options) {
            if (content instanceof L.Popup) {
                this._popup = content;
            } else {
                if (!this._popup || options) {
                    this._popup = new L.Popup(options, this);
                }
                this._popup.setContent(content);
            }
            if (!this._popupHandlersAdded) {
                this.on("click", this._openPopup, this).on("remove", this.closePopup, this);
                this._popupHandlersAdded = true;
            }
            return this;
        },
        unbindPopup: function () {
            if (this._popup) {
                this._popup = null;
                this.off("click", this._openPopup).off("remove", this.closePopup);
                this._popupHandlersAdded = false;
            }
            return this;
        },
        openPopup: function (latlng) {
            if (this._popup) {
                latlng = latlng || this._latlng || this._latlngs[Math.floor(this._latlngs.length / 2)];
                this._openPopup({
                    latlng: latlng
                });
            }
            return this;
        },
        closePopup: function () {
            if (this._popup) {
                this._popup._close();
            }
            return this;
        },
        _openPopup: function (e) {
            this._popup.setLatLng(e.latlng);
            this._map.openPopup(this._popup);
        }
    });
    L.Browser.vml = !L.Browser.svg && function () {
            try {
                var div = document.createElement("div");
                div.innerHTML = '<v:shape adj="1"/>';
                var shape = div.firstChild;
                shape.style.behavior = "url(#default#VML)";
                return shape && typeof shape.adj === "object";
            } catch (e) {
                return false;
            }
        }();
    L.Path = L.Browser.svg || !L.Browser.vml ? L.Path : L.Path.extend({
        statics: {
            VML: true,
            CLIP_PADDING: .02
        },
        _createElement: function () {
            try {
                document.namespaces.add("lvml", "urn:schemas-microsoft-com:vml");
                return function (name) {
                    return document.createElement("<lvml:" + name + ' class="lvml">');
                };
            } catch (e) {
                return function (name) {
                    return document.createElement("<" + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
                };
            }
        }(),
        _initPath: function () {
            var container = this._container = this._createElement("shape");
            L.DomUtil.addClass(container, "leaflet-vml-shape" + (this.options.className ? " " + this.options.className : ""));
            if (this.options.clickable) {
                L.DomUtil.addClass(container, "leaflet-clickable");
            }
            container.coordsize = "1 1";
            this._path = this._createElement("path");
            container.appendChild(this._path);
            this._map._pathRoot.appendChild(container);
        },
        _initStyle: function () {
            this._updateStyle();
        },
        _updateStyle: function () {
            var stroke = this._stroke, fill = this._fill, options = this.options, container = this._container;
            container.stroked = options.stroke;
            container.filled = options.fill;
            if (options.stroke) {
                if (!stroke) {
                    stroke = this._stroke = this._createElement("stroke");
                    stroke.endcap = "round";
                    container.appendChild(stroke);
                }
                stroke.weight = options.weight + "px";
                stroke.color = options.color;
                stroke.opacity = options.opacity;
                if (options.dashArray) {
                    stroke.dashStyle = L.Util.isArray(options.dashArray) ? options.dashArray.join(" ") : options.dashArray.replace(/( *, *)/g, " ");
                } else {
                    stroke.dashStyle = "";
                }
                if (options.lineCap) {
                    stroke.endcap = options.lineCap.replace("butt", "flat");
                }
                if (options.lineJoin) {
                    stroke.joinstyle = options.lineJoin;
                }
            } else if (stroke) {
                container.removeChild(stroke);
                this._stroke = null;
            }
            if (options.fill) {
                if (!fill) {
                    fill = this._fill = this._createElement("fill");
                    container.appendChild(fill);
                }
                fill.color = options.fillColor || options.color;
                fill.opacity = options.fillOpacity;
            } else if (fill) {
                container.removeChild(fill);
                this._fill = null;
            }
        },
        _updatePath: function () {
            var style = this._container.style;
            style.display = "none";
            this._path.v = this.getPathString() + " ";
            style.display = "";
        }
    });
    L.Map.include(L.Browser.svg || !L.Browser.vml ? {} : {
        _initPathRoot: function () {
            if (this._pathRoot) {
                return;
            }
            var root = this._pathRoot = document.createElement("div");
            root.className = "leaflet-vml-container";
            this._panes.overlayPane.appendChild(root);
            this.on("moveend", this._updatePathViewport);
            this._updatePathViewport();
        }
    });
    L.Browser.canvas = function () {
        return !!document.createElement("canvas").getContext;
    }();
    L.Path = L.Path.SVG && !window.L_PREFER_CANVAS || !L.Browser.canvas ? L.Path : L.Path.extend({
        statics: {
            CANVAS: true,
            SVG: false
        },
        redraw: function () {
            if (this._map) {
                this.projectLatlngs();
                this._requestUpdate();
            }
            return this;
        },
        setStyle: function (style) {
            L.setOptions(this, style);
            if (this._map) {
                this._updateStyle();
                this._requestUpdate();
            }
            return this;
        },
        onRemove: function (map) {
            map.off("viewreset", this.projectLatlngs, this).off("moveend", this._updatePath, this);
            if (this.options.clickable) {
                this._map.off("click", this._onClick, this);
                this._map.off("mousemove", this._onMouseMove, this);
            }
            this._requestUpdate();
            this._map = null;
        },
        _requestUpdate: function () {
            if (this._map && !L.Path._updateRequest) {
                L.Path._updateRequest = L.Util.requestAnimFrame(this._fireMapMoveEnd, this._map);
            }
        },
        _fireMapMoveEnd: function () {
            L.Path._updateRequest = null;
            this.fire("moveend");
        },
        _initElements: function () {
            this._map._initPathRoot();
            this._ctx = this._map._canvasCtx;
        },
        _updateStyle: function () {
            var options = this.options;
            if (options.stroke) {
                this._ctx.lineWidth = options.weight;
                this._ctx.strokeStyle = options.color;
            }
            if (options.fill) {
                this._ctx.fillStyle = options.fillColor || options.color;
            }
        },
        _drawPath: function () {
            var i, j, len, len2, point, drawMethod;
            this._ctx.beginPath();
            for (i = 0, len = this._parts.length; i < len; i++) {
                for (j = 0, len2 = this._parts[i].length; j < len2; j++) {
                    point = this._parts[i][j];
                    drawMethod = (j === 0 ? "move" : "line") + "To";
                    this._ctx[drawMethod](point.x, point.y);
                }
                if (this instanceof L.Polygon) {
                    this._ctx.closePath();
                }
            }
        },
        _checkIfEmpty: function () {
            return !this._parts.length;
        },
        _updatePath: function () {
            if (this._checkIfEmpty()) {
                return;
            }
            var ctx = this._ctx, options = this.options;
            this._drawPath();
            ctx.save();
            this._updateStyle();
            if (options.fill) {
                ctx.globalAlpha = options.fillOpacity;
                ctx.fill();
            }
            if (options.stroke) {
                ctx.globalAlpha = options.opacity;
                ctx.stroke();
            }
            ctx.restore();
        },
        _initEvents: function () {
            if (this.options.clickable) {
                this._map.on("mousemove", this._onMouseMove, this);
                this._map.on("click", this._onClick, this);
            }
        },
        _onClick: function (e) {
            if (this._containsPoint(e.layerPoint)) {
                this.fire("click", e);
            }
        },
        _onMouseMove: function (e) {
            if (!this._map || this._map._animatingZoom) {
                return;
            }
            if (this._containsPoint(e.layerPoint)) {
                this._ctx.canvas.style.cursor = "pointer";
                this._mouseInside = true;
                this.fire("mouseover", e);
            } else if (this._mouseInside) {
                this._ctx.canvas.style.cursor = "";
                this._mouseInside = false;
                this.fire("mouseout", e);
            }
        }
    });
    L.Map.include(L.Path.SVG && !window.L_PREFER_CANVAS || !L.Browser.canvas ? {} : {
        _initPathRoot: function () {
            var root = this._pathRoot, ctx;
            if (!root) {
                root = this._pathRoot = document.createElement("canvas");
                root.style.position = "absolute";
                ctx = this._canvasCtx = root.getContext("2d");
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                this._panes.overlayPane.appendChild(root);
                if (this.options.zoomAnimation) {
                    this._pathRoot.className = "leaflet-zoom-animated";
                    this.on("zoomanim", this._animatePathZoom);
                    this.on("zoomend", this._endPathZoom);
                }
                this.on("moveend", this._updateCanvasViewport);
                this._updateCanvasViewport();
            }
        },
        _updateCanvasViewport: function () {
            if (this._pathZooming) {
                return;
            }
            this._updatePathViewport();
            var vp = this._pathViewport, min = vp.min, size = vp.max.subtract(min), root = this._pathRoot;
            L.DomUtil.setPosition(root, min);
            root.width = size.x;
            root.height = size.y;
            root.getContext("2d").translate(-min.x, -min.y);
        }
    });
    L.LineUtil = {
        simplify: function (points, tolerance) {
            if (!tolerance || !points.length) {
                return points.slice();
            }
            var sqTolerance = tolerance * tolerance;
            points = this._reducePoints(points, sqTolerance);
            points = this._simplifyDP(points, sqTolerance);
            return points;
        },
        pointToSegmentDistance: function (p, p1, p2) {
            return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
        },
        closestPointOnSegment: function (p, p1, p2) {
            return this._sqClosestPointOnSegment(p, p1, p2);
        },
        _simplifyDP: function (points, sqTolerance) {
            var len = points.length, ArrayConstructor = typeof Uint8Array !== undefined + "" ? Uint8Array : Array, markers = new ArrayConstructor(len);
            markers[0] = markers[len - 1] = 1;
            this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
            var i, newPoints = [];
            for (i = 0; i < len; i++) {
                if (markers[i]) {
                    newPoints.push(points[i]);
                }
            }
            return newPoints;
        },
        _simplifyDPStep: function (points, markers, sqTolerance, first, last) {
            var maxSqDist = 0, index, i, sqDist;
            for (i = first + 1; i <= last - 1; i++) {
                sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);
                if (sqDist > maxSqDist) {
                    index = i;
                    maxSqDist = sqDist;
                }
            }
            if (maxSqDist > sqTolerance) {
                markers[index] = 1;
                this._simplifyDPStep(points, markers, sqTolerance, first, index);
                this._simplifyDPStep(points, markers, sqTolerance, index, last);
            }
        },
        _reducePoints: function (points, sqTolerance) {
            var reducedPoints = [points[0]];
            for (var i = 1, prev = 0, len = points.length; i < len; i++) {
                if (this._sqDist(points[i], points[prev]) > sqTolerance) {
                    reducedPoints.push(points[i]);
                    prev = i;
                }
            }
            if (prev < len - 1) {
                reducedPoints.push(points[len - 1]);
            }
            return reducedPoints;
        },
        clipSegment: function (a, b, bounds, useLastCode) {
            var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds), codeB = this._getBitCode(b, bounds), codeOut, p, newCode;
            this._lastCode = codeB;
            while (true) {
                if (!(codeA | codeB)) {
                    return [a, b];
                } else if (codeA & codeB) {
                    return false;
                } else {
                    codeOut = codeA || codeB;
                    p = this._getEdgeIntersection(a, b, codeOut, bounds);
                    newCode = this._getBitCode(p, bounds);
                    if (codeOut === codeA) {
                        a = p;
                        codeA = newCode;
                    } else {
                        b = p;
                        codeB = newCode;
                    }
                }
            }
        },
        _getEdgeIntersection: function (a, b, code, bounds) {
            var dx = b.x - a.x, dy = b.y - a.y, min = bounds.min, max = bounds.max;
            if (code & 8) {
                return new L.Point(a.x + dx * (max.y - a.y) / dy, max.y);
            } else if (code & 4) {
                return new L.Point(a.x + dx * (min.y - a.y) / dy, min.y);
            } else if (code & 2) {
                return new L.Point(max.x, a.y + dy * (max.x - a.x) / dx);
            } else if (code & 1) {
                return new L.Point(min.x, a.y + dy * (min.x - a.x) / dx);
            }
        },
        _getBitCode: function (p, bounds) {
            var code = 0;
            if (p.x < bounds.min.x) {
                code |= 1;
            } else if (p.x > bounds.max.x) {
                code |= 2;
            }
            if (p.y < bounds.min.y) {
                code |= 4;
            } else if (p.y > bounds.max.y) {
                code |= 8;
            }
            return code;
        },
        _sqDist: function (p1, p2) {
            var dx = p2.x - p1.x, dy = p2.y - p1.y;
            return dx * dx + dy * dy;
        },
        _sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
            var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y, dot = dx * dx + dy * dy, t;
            if (dot > 0) {
                t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
                if (t > 1) {
                    x = p2.x;
                    y = p2.y;
                } else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }
            dx = p.x - x;
            dy = p.y - y;
            return sqDist ? dx * dx + dy * dy : new L.Point(x, y);
        }
    };
    L.Polyline = L.Path.extend({
        initialize: function (latlngs, options, type) {
            L.Path.prototype.initialize.call(this, options);
            this._latlngs = this._convertLatLngs(latlngs);
            this._meatures = this.getMeatures(type);
        },
        options: {
            smoothFactor: 1,
            noClip: false
        },
        projectLatlngs: function () {
            this._originalPoints = [];
            for (var i = 0, len = this._latlngs.length; i < len; i++) {
                this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
            }
        },
        getPathString: function () {
            for (var i = 0, len = this._parts.length, str = ""; i < len; i++) {
                str += this._getPathPartStr(this._parts[i]);
            }
            return str;
        },
        getLatLngs: function () {
            return this._latlngs;
        },
        setLatLngs: function (latlngs) {
            this._latlngs = this._convertLatLngs(latlngs);
            return this.redraw();
        },
        getDistances: function () {
            var _distance = 0;
            for (var i = 1; i < this._latlngs.length; i++) {
                _distance += this._latlngs[i].distanceTo(this._latlngs[i - 1]);
            }
            if (_distance > 1000) {
                _distance = (_distance * 0.001).toFixed(2) + ' km';
            } else {
                _distance = _distance.toFixed(2) + ' m';
            }
            return _distance;
        },
        getAreas: function () {
            var area = 0;
            area = L.PolygonUtil.geodesicArea(this._latlngs);
            // Convert to most appropriate units
            if (area > 1000000) {
                area = (area * 0.000001).toFixed(2) + ' km&sup2;';
            } else if (area > 10000) {
                area = (area * 0.0001).toFixed(2) + ' ha';
            } else {
                area = area.toFixed(2) + ' m&sup2;';
            }
            return area;
        },
        getMeatures: function (type) {
            var meatures = '';
            if (type == 'polygon' || type == 'fpolygon' || type == 'rectangle') {
                meatures = this.getAreas();
            } else if (type == 'polyline' || type == 'fpolyline') {
                meatures = this.getDistances();
            }
            return meatures;
        },
        addLatLng: function (latlng) {
            this._latlngs.push(L.latLng(latlng));
            return this.redraw();
        },
        spliceLatLngs: function () {
            var removed = [].splice.apply(this._latlngs, arguments);
            this._convertLatLngs(this._latlngs, true);
            this.redraw();
            return removed;
        },
        closestLayerPoint: function (p) {
            var minDistance = Infinity, parts = this._parts, p1, p2, minPoint = null;
            for (var j = 0, jLen = parts.length; j < jLen; j++) {
                var points = parts[j];
                for (var i = 1, len = points.length; i < len; i++) {
                    p1 = points[i - 1];
                    p2 = points[i];
                    var sqDist = L.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);
                    if (sqDist < minDistance) {
                        minDistance = sqDist;
                        minPoint = L.LineUtil._sqClosestPointOnSegment(p, p1, p2);
                    }
                }
            }
            if (minPoint) {
                minPoint.distance = Math.sqrt(minDistance);
            }
            return minPoint;
        },
        getBounds: function () {
            return new L.LatLngBounds(this.getLatLngs());
        },
        _convertLatLngs: function (latlngs, overwrite) {
            var i, len, target = overwrite ? latlngs : [];
            for (i = 0, len = latlngs.length; i < len; i++) {
                if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== "number") {
                    return;
                }
                target[i] = L.latLng(latlngs[i]);
            }
            return target;
        },
        _initEvents: function () {
            L.Path.prototype._initEvents.call(this);
        },
        _getPathPartStr: function (points) {
            var round = L.Path.VML;
            for (var j = 0, len2 = points.length, str = "", p; j < len2; j++) {
                p = points[j];
                if (round) {
                    p._round();
                }
                str += (j ? "L" : "M") + p.x + " " + p.y;
            }
            return str;
        },
        _clipPoints: function () {
            var points = this._originalPoints, len = points.length, i, k, segment;
            if (this.options.noClip) {
                this._parts = [points];
                return;
            }
            this._parts = [];
            var parts = this._parts, vp = this._map._pathViewport, lu = L.LineUtil;
            for (i = 0, k = 0; i < len - 1; i++) {
                segment = lu.clipSegment(points[i], points[i + 1], vp, i);
                if (!segment) {
                    continue;
                }
                parts[k] = parts[k] || [];
                parts[k].push(segment[0]);
                if (segment[1] !== points[i + 1] || i === len - 2) {
                    parts[k].push(segment[1]);
                    k++;
                }
            }
        },
        _simplifyPoints: function () {
            var parts = this._parts, lu = L.LineUtil;
            for (var i = 0, len = parts.length; i < len; i++) {
                parts[i] = lu.simplify(parts[i], this.options.smoothFactor);
            }
        },
        _updatePath: function () {
            if (!this._map) {
                return;
            }
            this._clipPoints();
            this._simplifyPoints();
            L.Path.prototype._updatePath.call(this);
        }
    });
    L.polyline = function (latlngs, options, type) {
        return new L.Polyline(latlngs, options, type);
    };
    L.PolyUtil = {};
    L.PolyUtil.clipPolygon = function (points, bounds) {
        var clippedPoints, edges = [1, 4, 2, 8], i, j, k, a, b, len, edge, p, lu = L.LineUtil;
        for (i = 0, len = points.length; i < len; i++) {
            points[i]._code = lu._getBitCode(points[i], bounds);
        }
        for (k = 0; k < 4; k++) {
            edge = edges[k];
            clippedPoints = [];
            for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
                a = points[i];
                b = points[j];
                if (!(a._code & edge)) {
                    if (b._code & edge) {
                        p = lu._getEdgeIntersection(b, a, edge, bounds);
                        p._code = lu._getBitCode(p, bounds);
                        clippedPoints.push(p);
                    }
                    clippedPoints.push(a);
                } else if (!(b._code & edge)) {
                    p = lu._getEdgeIntersection(b, a, edge, bounds);
                    p._code = lu._getBitCode(p, bounds);
                    clippedPoints.push(p);
                }
            }
            points = clippedPoints;
        }
        return points;
    };
    L.Polygon = L.Polyline.extend({
        options: {
            fill: true
        },
        initialize: function (latlngs, options, type) {
            L.Polyline.prototype.initialize.call(this, latlngs, options, type);
            this._initWithHoles(latlngs);
        },
        _initWithHoles: function (latlngs) {
            var i, len, hole;
            if (latlngs && L.Util.isArray(latlngs[0]) && typeof latlngs[0][0] !== "number") {
                this._latlngs = this._convertLatLngs(latlngs[0]);
                this._holes = latlngs.slice(1);
                for (i = 0, len = this._holes.length; i < len; i++) {
                    hole = this._holes[i] = this._convertLatLngs(this._holes[i]);
                    if (hole[0].equals(hole[hole.length - 1])) {
                        hole.pop();
                    }
                }
            }
            latlngs = this._latlngs;
            if (latlngs.length >= 2 && latlngs[0].equals(latlngs[latlngs.length - 1])) {
                latlngs.pop();
            }
        },
        projectLatlngs: function () {
            L.Polyline.prototype.projectLatlngs.call(this);
            this._holePoints = [];
            if (!this._holes) {
                return;
            }
            var i, j, len, len2;
            for (i = 0, len = this._holes.length; i < len; i++) {
                this._holePoints[i] = [];
                for (j = 0, len2 = this._holes[i].length; j < len2; j++) {
                    this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);
                }
            }
        },
        setLatLngs: function (latlngs) {
            if (latlngs && L.Util.isArray(latlngs[0]) && typeof latlngs[0][0] !== "number") {
                this._initWithHoles(latlngs);
                return this.redraw();
            } else {
                return L.Polyline.prototype.setLatLngs.call(this, latlngs);
            }
        },
        getAreas: function () {
            var area = 0;
            area = L.PolygonUtil.geodesicArea(this._latlngs);
            // Convert to most appropriate units
            if (area > 1000000) {
                area = (area * 0.000001).toFixed(2) + ' km&sup2;';
            } else if (area > 10000) {
                area = (area * 0.0001).toFixed(2) + ' ha';
            } else {
                area = area.toFixed(2) + ' m&sup2;';
            }
            return area;
        },
        _clipPoints: function () {
            var points = this._originalPoints, newParts = [];
            this._parts = [points].concat(this._holePoints);
            if (this.options.noClip) {
                return;
            }
            for (var i = 0, len = this._parts.length; i < len; i++) {
                var clipped = L.PolyUtil.clipPolygon(this._parts[i], this._map._pathViewport);
                if (clipped.length) {
                    newParts.push(clipped);
                }
            }
            this._parts = newParts;
        },
        _getPathPartStr: function (points) {
            var str = L.Polyline.prototype._getPathPartStr.call(this, points);
            return str + (L.Browser.svg ? "z" : "x");
        }
    });
    L.polygon = function (latlngs, options) {
        return new L.Polygon(latlngs, options);
    };


    (function () {
        function createMulti(Klass) {
            return L.FeatureGroup.extend({
                initialize: function (latlngs, options) {
                    this._layers = {};
                    this._options = options;
                    this.setLatLngs(latlngs);
                },
                setLatLngs: function (latlngs) {
                    var i = 0, len = latlngs.length;
                    this.eachLayer(function (layer) {
                        if (i < len) {
                            layer.setLatLngs(latlngs[i++]);
                        } else {
                            this.removeLayer(layer);
                        }
                    }, this);
                    while (i < len) {
                        this.addLayer(new Klass(latlngs[i++], this._options));
                    }
                    return this;
                },
                getLatLngs: function () {
                    var latlngs = [];
                    this.eachLayer(function (layer) {
                        latlngs.push(layer.getLatLngs());
                    });
                    return latlngs;
                }
            });
        }

        L.MultiPolyline = createMulti(L.Polyline);
        L.MultiPolygon = createMulti(L.Polygon);
        L.multiPolyline = function (latlngs, options) {
            return new L.MultiPolyline(latlngs, options);
        };
        L.multiPolygon = function (latlngs, options) {
            return new L.MultiPolygon(latlngs, options);
        };
    })();
    L.Rectangle = L.Polygon.extend({
        initialize: function (latLngBounds, options, type) {
            L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options, type);
        },
        setBounds: function (latLngBounds) {
            this.setLatLngs(this._boundsToLatLngs(latLngBounds));
        },
        _boundsToLatLngs: function (latLngBounds) {
            latLngBounds = L.latLngBounds(latLngBounds);
            return [latLngBounds.getSouthWest(), latLngBounds.getNorthWest(), latLngBounds.getNorthEast(), latLngBounds.getSouthEast()];
        }
    });
    L.rectangle = function (latLngBounds, options, type) {
        return new L.Rectangle(latLngBounds, options, type);
    };
    L.Circle = L.Path.extend({
        initialize: function (latlng, radius, options) {
            L.Path.prototype.initialize.call(this, options);
            this._latlng = L.latLng(latlng);
            this._mRadius = radius;
            this._meatures = this.getAreas(radius);
        },
        options: {
            fill: true
        },
        setLatLng: function (latlng) {
            this._latlng = L.latLng(latlng);
            return this.redraw();
        },
        setRadius: function (radius) {
            this._mRadius = radius;
            return this.redraw();
        },
        getAreas: function (radius) {
            var area = (Math.PI) * (radius * radius);
            if (area > 1000000) {
                area = (area * 0.000001).toFixed(2) + ' km&sup2;';
            } else if (area > 10000) {
                area = (area * 0.0001).toFixed(2) + ' ha';
            } else {
                area = area.toFixed(2) + ' m&sup2;';
            }
            return area;
        },
        projectLatlngs: function () {
            var lngRadius = this._getLngRadius(), latlng = this._latlng, pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);
            this._point = this._map.latLngToLayerPoint(latlng);
            this._radius = Math.max(this._point.x - pointLeft.x, 1);
        },
        getBounds: function () {
            var lngRadius = this._getLngRadius(), latRadius = this._mRadius / 40075017 * 360, latlng = this._latlng;
            return new L.LatLngBounds([latlng.lat - latRadius, latlng.lng - lngRadius], [latlng.lat + latRadius, latlng.lng + lngRadius]);
        },
        getLatLng: function () {
            return this._latlng;
        },
        getPathString: function () {
            var p = this._point, r = this._radius;
            if (this._checkIfEmpty()) {
                return "";
            }
            if (L.Browser.svg) {
                return "M" + p.x + "," + (p.y - r) + "A" + r + "," + r + ",0,1,1," + (p.x - .1) + "," + (p.y - r) + " z";
            } else {
                p._round();
                r = Math.round(r);
                return "AL " + p.x + "," + p.y + " " + r + "," + r + " 0," + 65535 * 360;
            }
        },
        getRadius: function () {
            return this._mRadius;
        },
        _getLatRadius: function () {
            return this._mRadius / 40075017 * 360;
        },
        _getLngRadius: function () {
            return this._getLatRadius() / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat);
        },
        _checkIfEmpty: function () {
            if (!this._map) {
                return false;
            }
            var vp = this._map._pathViewport, r = this._radius, p = this._point;
            return p.x - r > vp.max.x || p.y - r > vp.max.y || p.x + r < vp.min.x || p.y + r < vp.min.y;
        }
    });
    L.circle = function (latlng, radius, options) {
        return new L.Circle(latlng, radius, options);
    };

    L.CircleEditor = L.Circle.extend({
        options: {
            icon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: 'leaflet-div-icon leaflet-editing-icon'
            }),
            extendedIconClass: 'extend-icon'
        },
        onAdd: function (map) {
            L.Path.prototype.onAdd.call(this, map);
            this.addHooks();
        },
        onRemove: function (map) {
            this.removeHooks();

            L.Path.prototype.onRemove.call(this, map);
        },
        addHooks: function () {
            if (this._map) {
                if (!this._markerGroup) {
                    this._initMarkers();
                }
                this._map.addLayer(this._markerGroup);
            }
            if (this._tooltip == undefined || this._tooltip == '') {
                this._tooltip = new L.Tooltip(this._map);
            }
        },
        removeHooks: function () {
            if (this._map) {
                this._map.removeLayer(this._markerGroup);
                this.removeTooltip();
                delete this._markerGroup;
                delete this._markers;
                delete this._tooltip;
            }
        },
        updateMarkers: function () {
            this._markerGroup.clearLayers();
            this._initMarkers();
        },
        _initMarkers: function () {
            this._markerGroup = new L.LayerGroup();
            this._markers = [];
            var markerCenter = this._createMarker(this._latlng, 0, true);
            this._markers.push(markerCenter);
            var circleBounds = this.getBounds(),
                center = circleBounds.getCenter(),
                neCoord = circleBounds.getNorthEast(),
                northCenterCoord = new L.LatLng(center.lat, neCoord.lng, true);
            markerNorthCenter = this._createMarker(northCenterCoord, 1);

            this._markers.push(markerNorthCenter);
        },
        _createMarker: function (latlng, index, isCenter) {
            var marker = new L.Marker(latlng, {
                draggable: true,
                icon: this.options.icon
            });
            if (isCenter === undefined) {
                isCenter = false;
            }
            //console.log("this is center point: " + isCenter);
            marker._origLatLng = latlng;
            marker._index = index;
            marker._isCenter = isCenter;
            if (isCenter) {
                marker.on('drag', this._onCenterMove, this)
                    .on('dragend', this._onCenterMoveEnd, this);
            } else {
                //marker.on('drag', this._onMarkerDrag, this);
                marker.on('drag', this._onMarkerDrag, this)
                    .on('dragend', this._onMarkerDragend, this);
            }
            marker.on('dragend', this._fireEdit, this)
                .on('mouseover', this._onMouseOver, this)
                .on('mouseout', this._onMouseOut, this);

            if (isCenter == false) {
                this._markerGroup.addLayer(marker);
            }
            return marker;
        },
        _onMouseOver: function (e) {
            var target = e.target,
                icon = target._icon,
                classValues = icon.getAttribute("class");
            //icon.setAttribute("class", "extend-icon " + classValues);
            icon.setAttribute("class", this.options.extendedIconClass + " " + classValues);
        },
        _onMouseOut: function (e) {
            var target = e.target,
                icon = target._icon,
                classValues = icon.getAttribute("class");
            //icon.setAttribute("class", classValues.replace("extend-icon", ""));
            icon.setAttribute("class", classValues.replace(this.options.extendedIconClass, ""));
        },
        _fireEdit: function () {
            this.fire('edit');
        },
        _onCenterMove: function (e) {
            var marker = e.target;
            //console.log("center move - START");
            L.Util.extend(marker._origLatLng, marker._latlng);
            var mm = this._markers[1];
            mm.setOpacity(0.1);
            this.redraw();
            //console.log("END");
        },
        _onCenterMoveEnd: function (e) {
            var marker = e.target;

            //now resetting the side point
            var circleBounds = this.getBounds(),
                center = circleBounds.getCenter(),
                neCoord = circleBounds.getNorthEast(),
                northCenterCoord = new L.LatLng(center.lat, neCoord.lng, true);

            var mm = this._markers[1];
            mm.setLatLng(northCenterCoord);
            mm.setOpacity(1);

            this._map.fire('centerchange');
        },
        _onMarkerDrag: function (e) {
            var marker = e.target;
            //console.log("marker drag - START");
            var center = this._markers[0].getLatLng();
            var axis = marker._latlng;

            var distance = center.distanceTo(axis);

            this.setRadius(distance);

            this.redraw();
            //console.log("END");
            this.radiuschange(axis);

            this._map.fire('radiuschange');
        },

        _onMarkerDragend: function () {
            this._map.fire('radiusend', {
                center: this._markers[0],
                radius: this._mRadius
            });
        },
        centerchange: function () {
        },
        radiuschange: function (axis) {
            this._tooltip.updatePosition(axis);
            this._tooltip.updateContent({
                text: "Release mouse to drag for gazetteer.",
                subtext: "Radius:" + (this._mRadius + '').split('.')[0]
            });
        },
        removeTooltip: function () {
            if (this._tooltip._container && this._tooltip._container.parentNode) {
                this._tooltip._container.parentNode.removeChild(this._tooltip._container);
            }
        }
    });
    L.circleEditor = function (latlng, options) {
        return new L.CircleEditor(latlng, options);
    };

    L.CircleMarker = L.Circle.extend({
        options: {
            radius: 10,
            weight: 2
        },
        initialize: function (latlng, options) {
            L.Circle.prototype.initialize.call(this, latlng, null, options);
            this._radius = this.options.radius;
        },
        projectLatlngs: function () {
            this._point = this._map.latLngToLayerPoint(this._latlng);
        },
        _updateStyle: function () {
            L.Circle.prototype._updateStyle.call(this);
            this.setRadius(this.options.radius);
        },
        setLatLng: function (latlng) {
            L.Circle.prototype.setLatLng.call(this, latlng);
            if (this._popup && this._popup._isOpen) {
                this._popup.setLatLng(latlng);
            }
            return this;
        },
        setRadius: function (radius) {
            this.options.radius = this._radius = radius;
            return this.redraw();
        },
        getRadius: function () {
            return this._radius;
        }
    });
    L.circleMarker = function (latlng, options) {
        return new L.CircleMarker(latlng, options);
    };
    L.Polyline.include(!L.Path.CANVAS ? {} : {
        _containsPoint: function (p, closed) {
            var i, j, k, len, len2, dist, part, w = this.options.weight / 2;
            if (L.Browser.touch) {
                w += 10;
            }
            for (i = 0, len = this._parts.length; i < len; i++) {
                part = this._parts[i];
                for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
                    if (!closed && j === 0) {
                        continue;
                    }
                    dist = L.LineUtil.pointToSegmentDistance(p, part[k], part[j]);
                    if (dist <= w) {
                        return true;
                    }
                }
            }
            return false;
        }
    });
    L.Polygon.include(!L.Path.CANVAS ? {} : {
        _containsPoint: function (p) {
            var inside = false, part, p1, p2, i, j, k, len, len2;
            if (L.Polyline.prototype._containsPoint.call(this, p, true)) {
                return true;
            }
            for (i = 0, len = this._parts.length; i < len; i++) {
                part = this._parts[i];
                for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
                    p1 = part[j];
                    p2 = part[k];
                    if (p1.y > p.y !== p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x) {
                        inside = !inside;
                    }
                }
            }
            return inside;
        }
    });
    L.Circle.include(!L.Path.CANVAS ? {} : {
        _drawPath: function () {
            var p = this._point;
            this._ctx.beginPath();
            this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);
        },
        _containsPoint: function (p) {
            var center = this._point, w2 = this.options.stroke ? this.options.weight / 2 : 0;
            return p.distanceTo(center) <= this._radius + w2;
        }
    });
    L.CircleMarker.include(!L.Path.CANVAS ? {} : {
        _updateStyle: function () {
            L.Path.prototype._updateStyle.call(this);
        }
    });
    L.GeoJSON = L.FeatureGroup.extend({
        initialize: function (geojson, options) {
            L.setOptions(this, options);
            this._layers = {};
            if (geojson) {
                this.addData(geojson);
            }
        },
        addData: function (geojson) {
            var features = L.Util.isArray(geojson) ? geojson : geojson.features, i, len, feature;
            if (features) {
                for (i = 0, len = features.length; i < len; i++) {
                    feature = features[i];
                    if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
                        this.addData(features[i]);
                    }
                }
                return this;
            }
            var options = this.options;
            if (options.filter && !options.filter(geojson)) {
                return;
            }
            var layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer, options.coordsToLatLng, options);
            layer.feature = L.GeoJSON.asFeature(geojson);
            layer.defaultOptions = layer.options;
            this.resetStyle(layer);
            if (options.onEachFeature) {
                options.onEachFeature(geojson, layer);
            }
            return this.addLayer(layer);
        },
        resetStyle: function (layer) {
            var style = this.options.style;
            if (style) {
                L.Util.extend(layer.options, layer.defaultOptions);
                this._setLayerStyle(layer, style);
            }
        },
        setStyle: function (style) {
            this.eachLayer(function (layer) {
                this._setLayerStyle(layer, style);
            }, this);
        },
        _setLayerStyle: function (layer, style) {
            if (typeof style === "function") {
                style = style(layer.feature);
            }
            if (layer.setStyle) {
                layer.setStyle(style);
            }
        }
    });
    L.extend(L.GeoJSON, {
        geometryToLayer: function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {
            var geometry = geojson.type === "Feature" ? geojson.geometry : geojson, coords = geometry.coordinates, layers = [], latlng, latlngs, i, len;
            coordsToLatLng = coordsToLatLng || this.coordsToLatLng;
            switch (geometry.type) {
                case "Point":
                    latlng = coordsToLatLng(coords);
                    return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

                case "MultiPoint":
                    for (i = 0, len = coords.length; i < len; i++) {
                        latlng = coordsToLatLng(coords[i]);
                        layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
                    }
                    return new L.FeatureGroup(layers);

                case "LineString":
                    latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
                    return new L.Polyline(latlngs, vectorOptions);

                case "Polygon":
                    if (coords.length === 2 && !coords[1].length) {
                        throw new Error("Invalid GeoJSON object.");
                    }
                    latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
                    return new L.Polygon(latlngs, vectorOptions);

                case "MultiLineString":
                    latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
                    return new L.MultiPolyline(latlngs, vectorOptions);

                case "MultiPolygon":
                    latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);
                    return new L.MultiPolygon(latlngs, vectorOptions);

                case "GeometryCollection":
                    for (i = 0, len = geometry.geometries.length; i < len; i++) {
                        layers.push(this.geometryToLayer({
                            geometry: geometry.geometries[i],
                            type: "Feature",
                            properties: geojson.properties
                        }, pointToLayer, coordsToLatLng, vectorOptions));
                    }
                    return new L.FeatureGroup(layers);

                default:
                    throw new Error("Invalid GeoJSON object.");
            }
        },
        coordsToLatLng: function (coords) {
            return new L.LatLng(coords[1], coords[0], coords[2]);
        },
        coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) {
            var latlng, i, len, latlngs = [];
            for (i = 0, len = coords.length; i < len; i++) {
                latlng = levelsDeep ? this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) : (coordsToLatLng || this.coordsToLatLng)(coords[i]);
                latlngs.push(latlng);
            }
            return latlngs;
        },
        latLngToCoords: function (latlng) {
            var coords = [latlng.lng, latlng.lat];
            if (latlng.alt !== undefined) {
                coords.push(latlng.alt);
            }
            return coords;
        },
        latLngsToCoords: function (latLngs) {
            var coords = [];
            for (var i = 0, len = latLngs.length; i < len; i++) {
                coords.push(L.GeoJSON.latLngToCoords(latLngs[i]));
            }
            return coords;
        },
        getFeature: function (layer, newGeometry) {
            return layer.feature ? L.extend({}, layer.feature, {
                geometry: newGeometry
            }) : L.GeoJSON.asFeature(newGeometry);
        },
        asFeature: function (geoJSON) {
            if (geoJSON.type === "Feature") {
                return geoJSON;
            }
            return {
                type: "Feature",
                properties: {},
                geometry: geoJSON
            };
        }
    });
    var PointToGeoJSON = {
        toGeoJSON: function () {
            return L.GeoJSON.getFeature(this, {
                type: "Point",
                coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
            });
        }
    };
    L.Marker.include(PointToGeoJSON);
    L.Circle.include(PointToGeoJSON);
    L.CircleMarker.include(PointToGeoJSON);
    L.Polyline.include({
        toGeoJSON: function () {
            return L.GeoJSON.getFeature(this, {
                type: "LineString",
                coordinates: L.GeoJSON.latLngsToCoords(this.getLatLngs())
            });
        }
    });
    L.Polygon.include({
        toGeoJSON: function () {
            var coords = [L.GeoJSON.latLngsToCoords(this.getLatLngs())], i, len, hole;
            coords[0].push(coords[0][0]);
            if (this._holes) {
                for (i = 0, len = this._holes.length; i < len; i++) {
                    hole = L.GeoJSON.latLngsToCoords(this._holes[i]);
                    hole.push(hole[0]);
                    coords.push(hole);
                }
            }
            return L.GeoJSON.getFeature(this, {
                type: "Polygon",
                coordinates: coords
            });
        }
    });
    (function () {
        function multiToGeoJSON(type) {
            return function () {
                var coords = [];
                this.eachLayer(function (layer) {
                    coords.push(layer.toGeoJSON().geometry.coordinates);
                });
                return L.GeoJSON.getFeature(this, {
                    type: type,
                    coordinates: coords
                });
            };
        }

        L.MultiPolyline.include({
            toGeoJSON: multiToGeoJSON("MultiLineString")
        });
        L.MultiPolygon.include({
            toGeoJSON: multiToGeoJSON("MultiPolygon")
        });
        L.LayerGroup.include({
            toGeoJSON: function () {
                var geometry = this.feature && this.feature.geometry, jsons = [], json;
                if (geometry && geometry.type === "MultiPoint") {
                    return multiToGeoJSON("MultiPoint").call(this);
                }
                var isGeometryCollection = geometry && geometry.type === "GeometryCollection";
                this.eachLayer(function (layer) {
                    if (layer.toGeoJSON) {
                        json = layer.toGeoJSON();
                        jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));
                    }
                });
                if (isGeometryCollection) {
                    return L.GeoJSON.getFeature(this, {
                        geometries: jsons,
                        type: "GeometryCollection"
                    });
                }
                return {
                    type: "FeatureCollection",
                    features: jsons
                };
            }
        });
    })();
    L.geoJson = function (geojson, options) {
        return new L.GeoJSON(geojson, options);
    };
    L.DomEvent = {
        addListener: function (obj, type, fn, context) {
            var id = L.stamp(fn), key = "_leaflet_" + type + id, handler, originalHandler, newType;
            if (obj[key]) {
                return this;
            }
            handler = function (e) {
                return fn.call(context || obj, e || L.DomEvent._getEvent());
            };
            if (L.Browser.pointer && type.indexOf("touch") === 0) {
                return this.addPointerListener(obj, type, handler, id);
            }
            if (L.Browser.touch && type === "dblclick" && this.addDoubleTapListener) {
                this.addDoubleTapListener(obj, handler, id);
            }
            if ("addEventListener" in obj) {
                if (type === "mousewheel") {
                    obj.addEventListener("DOMMouseScroll", handler, false);
                    obj.addEventListener(type, handler, false);
                } else if (type === "mouseenter" || type === "mouseleave") {
                    originalHandler = handler;
                    newType = type === "mouseenter" ? "mouseover" : "mouseout";
                    handler = function (e) {
                        if (!L.DomEvent._checkMouse(obj, e)) {
                            return;
                        }
                        return originalHandler(e);
                    };
                    obj.addEventListener(newType, handler, false);
                } else if (type === "click" && L.Browser.android) {
                    originalHandler = handler;
                    handler = function (e) {
                        return L.DomEvent._filterClick(e, originalHandler);
                    };
                    obj.addEventListener(type, handler, false);
                } else {
                    obj.addEventListener(type, handler, false);
                }
            } else if ("attachEvent" in obj) {
                obj.attachEvent("on" + type, handler);
            }
            obj[key] = handler;
            return this;
        },
        removeListener: function (obj, type, fn) {
            var id = L.stamp(fn), key = "_leaflet_" + type + id, handler = obj[key];
            if (!handler) {
                return this;
            }
            if (L.Browser.pointer && type.indexOf("touch") === 0) {
                this.removePointerListener(obj, type, id);
            } else if (L.Browser.touch && type === "dblclick" && this.removeDoubleTapListener) {
                this.removeDoubleTapListener(obj, id);
            } else if ("removeEventListener" in obj) {
                if (type === "mousewheel") {
                    obj.removeEventListener("DOMMouseScroll", handler, false);
                    obj.removeEventListener(type, handler, false);
                } else if (type === "mouseenter" || type === "mouseleave") {
                    obj.removeEventListener(type === "mouseenter" ? "mouseover" : "mouseout", handler, false);
                } else {
                    obj.removeEventListener(type, handler, false);
                }
            } else if ("detachEvent" in obj) {
                obj.detachEvent("on" + type, handler);
            }
            obj[key] = null;
            return this;
        },
        stopPropagation: function (e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                e.cancelBubble = true;
            }
            L.DomEvent._skipped(e);
            return this;
        },
        disableScrollPropagation: function (el) {
            var stop = L.DomEvent.stopPropagation;
            return L.DomEvent.on(el, "mousewheel", stop).on(el, "MozMousePixelScroll", stop);
        },
        disableClickPropagation: function (el) {
            var stop = L.DomEvent.stopPropagation;
            for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
                L.DomEvent.on(el, L.Draggable.START[i], stop);
            }
            return L.DomEvent.on(el, "click", L.DomEvent._fakeStop).on(el, "dblclick", stop);
        },
        preventDefault: function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            return this;
        },
        stop: function (e) {
            return L.DomEvent.preventDefault(e).stopPropagation(e);
        },
        getMousePosition: function (e, container) {
            if (!container) {
                return new L.Point(e.clientX, e.clientY);
            }
            var rect = container.getBoundingClientRect();
            return new L.Point(e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop);
        },
        getWheelDelta: function (e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = e.wheelDelta / 120;
            }
            if (e.detail) {
                delta = -e.detail / 3;
            }
            return delta;
        },
        _skipEvents: {},
        _fakeStop: function (e) {
            L.DomEvent._skipEvents[e.type] = true;
        },
        _skipped: function (e) {
            var skipped = this._skipEvents[e.type];
            this._skipEvents[e.type] = false;
            return skipped;
        },
        _checkMouse: function (el, e) {
            var related = e.relatedTarget;
            if (!related) {
                return true;
            }
            try {
                while (related && related !== el) {
                    related = related.parentNode;
                }
            } catch (err) {
                return false;
            }
            return related !== el;
        },
        _getEvent: function () {
            var e = window.event;
            if (!e) {
                var caller = arguments.callee.caller;
                while (caller) {
                    e = caller["arguments"][0];
                    if (e && window.Event === e.constructor) {
                        break;
                    }
                    caller = caller.caller;
                }
            }
            return e;
        },
        _filterClick: function (e, handler) {
            var timeStamp = e.timeStamp || e.originalEvent.timeStamp, elapsed = L.DomEvent._lastClick && timeStamp - L.DomEvent._lastClick;
            if (elapsed && elapsed > 100 && elapsed < 1e3 || e.target._simulatedClick && !e._simulated) {
                L.DomEvent.stop(e);
                return;
            }
            L.DomEvent._lastClick = timeStamp;
            return handler(e);
        }
    };
    L.DomEvent.on = L.DomEvent.addListener;
    L.DomEvent.off = L.DomEvent.removeListener;
    L.Draggable = L.Class.extend({
        includes: L.Mixin.Events,
        statics: {
            START: L.Browser.touch ? ["touchstart", "mousedown"] : ["mousedown"],
            END: {
                mousedown: "mouseup",
                touchstart: "touchend",
                pointerdown: "touchend",
                MSPointerDown: "touchend"
            },
            MOVE: {
                mousedown: "mousemove",
                touchstart: "touchmove",
                pointerdown: "touchmove",
                MSPointerDown: "touchmove"
            }
        },
        initialize: function (element, dragStartTarget) {
            this._element = element;
            this._dragStartTarget = dragStartTarget || element;
        },
        enable: function () {
            if (this._enabled) {
                return;
            }
            for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
                L.DomEvent.on(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
            }
            this._enabled = true;
        },
        disable: function () {
            if (!this._enabled) {
                return;
            }
            for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
                L.DomEvent.off(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
            }
            this._enabled = false;
            this._moved = false;
        },
        _onDown: function (e) {
            this._moved = false;
            if (e.shiftKey || e.which !== 1 && e.button !== 1 && !e.touches) {
                return;
            }
            L.DomEvent.stopPropagation(e);
            if (L.Draggable._disabled) {
                return;
            }
            L.DomUtil.disableImageDrag();
            L.DomUtil.disableTextSelection();
            if (this._moving) {
                return;
            }
            var first = e.touches ? e.touches[0] : e;
            this._startPoint = new L.Point(first.clientX, first.clientY);
            this._startPos = this._newPos = L.DomUtil.getPosition(this._element);
            L.DomEvent.on(document, L.Draggable.MOVE[e.type], this._onMove, this).on(document, L.Draggable.END[e.type], this._onUp, this);
        },
        _onMove: function (e) {
            if (e.touches && e.touches.length > 1) {
                this._moved = true;
                return;
            }
            var first = e.touches && e.touches.length === 1 ? e.touches[0] : e, newPoint = new L.Point(first.clientX, first.clientY), offset = newPoint.subtract(this._startPoint);
            if (!offset.x && !offset.y) {
                return;
            }
            L.DomEvent.preventDefault(e);
            if (!this._moved) {
                this.fire("dragstart");
                this._moved = true;
                this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);
                L.DomUtil.addClass(document.body, "leaflet-dragging");
                L.DomUtil.addClass(e.target || e.srcElement, "leaflet-drag-target");
            }
            this._newPos = this._startPos.add(offset);
            this._moving = true;
            L.Util.cancelAnimFrame(this._animRequest);
            this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
        },
        _updatePosition: function () {
            this.fire("predrag");
            L.DomUtil.setPosition(this._element, this._newPos);
            this.fire("drag");
        },
        _onUp: function (e) {
            L.DomUtil.removeClass(document.body, "leaflet-dragging");
            L.DomUtil.removeClass(e.target || e.srcElement, "leaflet-drag-target");
            for (var i in L.Draggable.MOVE) {
                L.DomEvent.off(document, L.Draggable.MOVE[i], this._onMove).off(document, L.Draggable.END[i], this._onUp);
            }
            L.DomUtil.enableImageDrag();
            L.DomUtil.enableTextSelection();
            if (this._moved && this._moving) {
                L.Util.cancelAnimFrame(this._animRequest);
                this.fire("dragend", {
                    distance: this._newPos.distanceTo(this._startPos)
                });
            }
            this._moving = false;
        }
    });
    L.Handler = L.Class.extend({
        initialize: function (map) {
            this._map = map;
        },
        enable: function () {
            if (this._enabled) {
                return;
            }
            this._enabled = true;
            this.addHooks();
        },
        disable: function () {
            if (!this._enabled) {
                return;
            }
            this._enabled = false;
            this.removeHooks();
        },
        enabled: function () {
            return !!this._enabled;
        }
    });
    L.Map.mergeOptions({
        dragging: true,
        inertia: !L.Browser.android23,
        inertiaDeceleration: 3400,
        inertiaMaxSpeed: Infinity,
        inertiaThreshold: L.Browser.touch ? 32 : 18,
        easeLinearity: .25,
        worldCopyJump: false
    });
    L.Map.Drag = L.Handler.extend({
        addHooks: function () {
            if (!this._draggable) {
                var map = this._map;
                this._draggable = new L.Draggable(map._mapPane, map._container);
                this._draggable.on({
                    dragstart: this._onDragStart,
                    drag: this._onDrag,
                    dragend: this._onDragEnd
                }, this);
                if (map.options.worldCopyJump) {
                    this._draggable.on("predrag", this._onPreDrag, this);
                    map.on("viewreset", this._onViewReset, this);
                    map.whenReady(this._onViewReset, this);
                }
            }
            this._draggable.enable();
        },
        removeHooks: function () {
            this._draggable.disable();
        },
        moved: function () {
            return this._draggable && this._draggable._moved;
        },
        _onDragStart: function () {
            var map = this._map;
            if (map._panAnim) {
                map._panAnim.stop();
            }
            map.fire("movestart").fire("dragstart");
            if (map.options.inertia) {
                this._positions = [];
                this._times = [];
            }
        },
        _onDrag: function () {
            if (this._map.options.inertia) {
                var time = this._lastTime = +new Date(), pos = this._lastPos = this._draggable._newPos;
                this._positions.push(pos);
                this._times.push(time);
                if (time - this._times[0] > 200) {
                    this._positions.shift();
                    this._times.shift();
                }
            }
            this._map.fire("move").fire("drag");
        },
        _onViewReset: function () {
            var pxCenter = this._map.getSize()._divideBy(2), pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);
            this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
            this._worldWidth = this._map.project([0, 180]).x;
        },
        _onPreDrag: function () {
            var worldWidth = this._worldWidth, halfWidth = Math.round(worldWidth / 2), dx = this._initialWorldOffset, x = this._draggable._newPos.x, newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx, newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx, newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;
            this._draggable._newPos.x = newX;
        },
        _onDragEnd: function (e) {
            var map = this._map, options = map.options, delay = +new Date() - this._lastTime, noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];
            map.fire("dragend", e);
            if (noInertia) {
                map.fire("moveend");
            } else {
                var direction = this._lastPos.subtract(this._positions[0]), duration = (this._lastTime + delay - this._times[0]) / 1e3, ease = options.easeLinearity, speedVector = direction.multiplyBy(ease / duration), speed = speedVector.distanceTo([0, 0]), limitedSpeed = Math.min(options.inertiaMaxSpeed, speed), limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed), decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease), offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();
                if (!offset.x || !offset.y) {
                    map.fire("moveend");
                } else {
                    offset = map._limitOffset(offset, map.options.maxBounds);
                    L.Util.requestAnimFrame(function () {
                        map.panBy(offset, {
                            duration: decelerationDuration,
                            easeLinearity: ease,
                            noMoveStart: true
                        });
                    });
                }
            }
        }
    });
    L.Map.addInitHook("addHandler", "dragging", L.Map.Drag);
    L.Map.mergeOptions({
        doubleClickZoom: true
    });
    L.Map.DoubleClickZoom = L.Handler.extend({
        addHooks: function () {
            this._map.on("dblclick", this._onDoubleClick, this);
        },
        removeHooks: function () {
            this._map.off("dblclick", this._onDoubleClick, this);
        },
        _onDoubleClick: function (e) {
            var map = this._map, zoom = map.getZoom() + (e.originalEvent.shiftKey ? -1 : 1);
            if (map.options.doubleClickZoom === "center") {
                map.setZoom(zoom);
            } else {
                map.setZoomAround(e.containerPoint, zoom);
            }
        }
    });
    L.Map.addInitHook("addHandler", "doubleClickZoom", L.Map.DoubleClickZoom);
    L.Map.mergeOptions({
        scrollWheelZoom: true
    });
    L.Map.ScrollWheelZoom = L.Handler.extend({
        addHooks: function () {
            L.DomEvent.on(this._map._container, "mousewheel", this._onWheelScroll, this);
            L.DomEvent.on(this._map._container, "MozMousePixelScroll", L.DomEvent.preventDefault);
            this._delta = 0;
        },
        removeHooks: function () {
            L.DomEvent.off(this._map._container, "mousewheel", this._onWheelScroll);
            L.DomEvent.off(this._map._container, "MozMousePixelScroll", L.DomEvent.preventDefault);
        },
        _onWheelScroll: function (e) {
            var delta = L.DomEvent.getWheelDelta(e);
            this._delta += delta;
            this._lastMousePos = this._map.mouseEventToContainerPoint(e);
            if (!this._startTime) {
                this._startTime = +new Date();
            }
            var left = Math.max(40 - (+new Date() - this._startTime), 0);
            clearTimeout(this._timer);
            this._timer = setTimeout(L.bind(this._performZoom, this), left);
            L.DomEvent.preventDefault(e);
            L.DomEvent.stopPropagation(e);
        },
        _performZoom: function () {
            var map = this._map, delta = this._delta, zoom = map.getZoom();
            delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
            delta = Math.max(Math.min(delta, 4), -4);
            delta = map._limitZoom(zoom + delta) - zoom;
            this._delta = 0;
            this._startTime = null;
            if (!delta) {
                return;
            }
            if (map.options.scrollWheelZoom === "center") {
                map.setZoom(zoom + delta);
            } else {
                map.setZoomAround(this._lastMousePos, zoom + delta);
            }
        }
    });
    L.Map.addInitHook("addHandler", "scrollWheelZoom", L.Map.ScrollWheelZoom);
    L.extend(L.DomEvent, {
        _touchstart: L.Browser.msPointer ? "MSPointerDown" : L.Browser.pointer ? "pointerdown" : "touchstart",
        _touchend: L.Browser.msPointer ? "MSPointerUp" : L.Browser.pointer ? "pointerup" : "touchend",
        addDoubleTapListener: function (obj, handler, id) {
            var last, doubleTap = false, delay = 250, touch, pre = "_leaflet_", touchstart = this._touchstart, touchend = this._touchend, trackedTouches = [];

            function onTouchStart(e) {
                var count;
                if (L.Browser.pointer) {
                    trackedTouches.push(e.pointerId);
                    count = trackedTouches.length;
                } else {
                    count = e.touches.length;
                }
                if (count > 1) {
                    return;
                }
                var now = Date.now(), delta = now - (last || now);
                touch = e.touches ? e.touches[0] : e;
                doubleTap = delta > 0 && delta <= delay;
                last = now;
            }

            function onTouchEnd(e) {
                if (L.Browser.pointer) {
                    var idx = trackedTouches.indexOf(e.pointerId);
                    if (idx === -1) {
                        return;
                    }
                    trackedTouches.splice(idx, 1);
                }
                if (doubleTap) {
                    if (L.Browser.pointer) {
                        var newTouch = {}, prop;
                        for (var i in touch) {
                            prop = touch[i];
                            if (typeof prop === "function") {
                                newTouch[i] = prop.bind(touch);
                            } else {
                                newTouch[i] = prop;
                            }
                        }
                        touch = newTouch;
                    }
                    touch.type = "dblclick";
                    handler(touch);
                    last = null;
                }
            }

            obj[pre + touchstart + id] = onTouchStart;
            obj[pre + touchend + id] = onTouchEnd;
            var endElement = L.Browser.pointer ? document.documentElement : obj;
            obj.addEventListener(touchstart, onTouchStart, false);
            endElement.addEventListener(touchend, onTouchEnd, false);
            if (L.Browser.pointer) {
                endElement.addEventListener(L.DomEvent.POINTER_CANCEL, onTouchEnd, false);
            }
            return this;
        },
        removeDoubleTapListener: function (obj, id) {
            var pre = "_leaflet_";
            obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);
            (L.Browser.pointer ? document.documentElement : obj).removeEventListener(this._touchend, obj[pre + this._touchend + id], false);
            if (L.Browser.pointer) {
                document.documentElement.removeEventListener(L.DomEvent.POINTER_CANCEL, obj[pre + this._touchend + id], false);
            }
            return this;
        }
    });
    L.extend(L.DomEvent, {
        POINTER_DOWN: L.Browser.msPointer ? "MSPointerDown" : "pointerdown",
        POINTER_MOVE: L.Browser.msPointer ? "MSPointerMove" : "pointermove",
        POINTER_UP: L.Browser.msPointer ? "MSPointerUp" : "pointerup",
        POINTER_CANCEL: L.Browser.msPointer ? "MSPointerCancel" : "pointercancel",
        _pointers: [],
        _pointerDocumentListener: false,
        addPointerListener: function (obj, type, handler, id) {
            switch (type) {
                case "touchstart":
                    return this.addPointerListenerStart(obj, type, handler, id);

                case "touchend":
                    return this.addPointerListenerEnd(obj, type, handler, id);

                case "touchmove":
                    return this.addPointerListenerMove(obj, type, handler, id);

                default:
                    throw "Unknown touch event type";
            }
        },
        addPointerListenerStart: function (obj, type, handler, id) {
            var pre = "_leaflet_", pointers = this._pointers;
            var cb = function (e) {
                L.DomEvent.preventDefault(e);
                var alreadyInArray = false;
                for (var i = 0; i < pointers.length; i++) {
                    if (pointers[i].pointerId === e.pointerId) {
                        alreadyInArray = true;
                        break;
                    }
                }
                if (!alreadyInArray) {
                    pointers.push(e);
                }
                e.touches = pointers.slice();
                e.changedTouches = [e];
                handler(e);
            };
            obj[pre + "touchstart" + id] = cb;
            obj.addEventListener(this.POINTER_DOWN, cb, false);
            if (!this._pointerDocumentListener) {
                var internalCb = function (e) {
                    for (var i = 0; i < pointers.length; i++) {
                        if (pointers[i].pointerId === e.pointerId) {
                            pointers.splice(i, 1);
                            break;
                        }
                    }
                };
                document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
                document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);
                this._pointerDocumentListener = true;
            }
            return this;
        },
        addPointerListenerMove: function (obj, type, handler, id) {
            var pre = "_leaflet_", touches = this._pointers;

            function cb(e) {
                if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === "mouse") && e.buttons === 0) {
                    return;
                }
                for (var i = 0; i < touches.length; i++) {
                    if (touches[i].pointerId === e.pointerId) {
                        touches[i] = e;
                        break;
                    }
                }
                e.touches = touches.slice();
                e.changedTouches = [e];
                handler(e);
            }

            obj[pre + "touchmove" + id] = cb;
            obj.addEventListener(this.POINTER_MOVE, cb, false);
            return this;
        },
        addPointerListenerEnd: function (obj, type, handler, id) {
            var pre = "_leaflet_", touches = this._pointers;
            var cb = function (e) {
                for (var i = 0; i < touches.length; i++) {
                    if (touches[i].pointerId === e.pointerId) {
                        touches.splice(i, 1);
                        break;
                    }
                }
                e.touches = touches.slice();
                e.changedTouches = [e];
                handler(e);
            };
            obj[pre + "touchend" + id] = cb;
            obj.addEventListener(this.POINTER_UP, cb, false);
            obj.addEventListener(this.POINTER_CANCEL, cb, false);
            return this;
        },
        removePointerListener: function (obj, type, id) {
            var pre = "_leaflet_", cb = obj[pre + type + id];
            switch (type) {
                case "touchstart":
                    obj.removeEventListener(this.POINTER_DOWN, cb, false);
                    break;

                case "touchmove":
                    obj.removeEventListener(this.POINTER_MOVE, cb, false);
                    break;

                case "touchend":
                    obj.removeEventListener(this.POINTER_UP, cb, false);
                    obj.removeEventListener(this.POINTER_CANCEL, cb, false);
                    break;
            }
            return this;
        }
    });
    L.Map.mergeOptions({
        touchZoom: L.Browser.touch && !L.Browser.android23,
        bounceAtZoomLimits: true
    });
    L.Map.TouchZoom = L.Handler.extend({
        addHooks: function () {
            L.DomEvent.on(this._map._container, "touchstart", this._onTouchStart, this);
        },
        removeHooks: function () {
            L.DomEvent.off(this._map._container, "touchstart", this._onTouchStart, this);
        },
        _onTouchStart: function (e) {
            var map = this._map;
            if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) {
                return;
            }
            var p1 = map.mouseEventToLayerPoint(e.touches[0]), p2 = map.mouseEventToLayerPoint(e.touches[1]), viewCenter = map._getCenterLayerPoint();
            this._startCenter = p1.add(p2)._divideBy(2);
            this._startDist = p1.distanceTo(p2);
            this._moved = false;
            this._zooming = true;
            this._centerOffset = viewCenter.subtract(this._startCenter);
            if (map._panAnim) {
                map._panAnim.stop();
            }
            L.DomEvent.on(document, "touchmove", this._onTouchMove, this).on(document, "touchend", this._onTouchEnd, this);
            L.DomEvent.preventDefault(e);
        },
        _onTouchMove: function (e) {
            var map = this._map;
            if (!e.touches || e.touches.length !== 2 || !this._zooming) {
                return;
            }
            var p1 = map.mouseEventToLayerPoint(e.touches[0]), p2 = map.mouseEventToLayerPoint(e.touches[1]);
            this._scale = p1.distanceTo(p2) / this._startDist;
            this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter);
            if (this._scale === 1) {
                return;
            }
            if (!map.options.bounceAtZoomLimits) {
                if (map.getZoom() === map.getMinZoom() && this._scale < 1 || map.getZoom() === map.getMaxZoom() && this._scale > 1) {
                    return;
                }
            }
            if (!this._moved) {
                L.DomUtil.addClass(map._mapPane, "leaflet-touching");
                map.fire("movestart").fire("zoomstart");
                this._moved = true;
            }
            L.Util.cancelAnimFrame(this._animRequest);
            this._animRequest = L.Util.requestAnimFrame(this._updateOnMove, this, true, this._map._container);
            L.DomEvent.preventDefault(e);
        },
        _updateOnMove: function () {
            var map = this._map, origin = this._getScaleOrigin(), center = map.layerPointToLatLng(origin), zoom = map.getScaleZoom(this._scale);
            map._animateZoom(center, zoom, this._startCenter, this._scale, this._delta);
        },
        _onTouchEnd: function () {
            if (!this._moved || !this._zooming) {
                this._zooming = false;
                return;
            }
            var map = this._map;
            this._zooming = false;
            L.DomUtil.removeClass(map._mapPane, "leaflet-touching");
            L.Util.cancelAnimFrame(this._animRequest);
            L.DomEvent.off(document, "touchmove", this._onTouchMove).off(document, "touchend", this._onTouchEnd);
            var origin = this._getScaleOrigin(), center = map.layerPointToLatLng(origin), oldZoom = map.getZoom(), floatZoomDelta = map.getScaleZoom(this._scale) - oldZoom, roundZoomDelta = floatZoomDelta > 0 ? Math.ceil(floatZoomDelta) : Math.floor(floatZoomDelta), zoom = map._limitZoom(oldZoom + roundZoomDelta), scale = map.getZoomScale(zoom) / this._scale;
            map._animateZoom(center, zoom, origin, scale);
        },
        _getScaleOrigin: function () {
            var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
            return this._startCenter.add(centerOffset);
        }
    });
    L.Map.addInitHook("addHandler", "touchZoom", L.Map.TouchZoom);
    L.Map.mergeOptions({
        tap: true,
        tapTolerance: 15
    });
    L.Map.Tap = L.Handler.extend({
        addHooks: function () {
            L.DomEvent.on(this._map._container, "touchstart", this._onDown, this);
        },
        removeHooks: function () {
            L.DomEvent.off(this._map._container, "touchstart", this._onDown, this);
        },
        _onDown: function (e) {
            if (!e.touches) {
                return;
            }
            L.DomEvent.preventDefault(e);
            this._fireClick = true;
            if (e.touches.length > 1) {
                this._fireClick = false;
                clearTimeout(this._holdTimeout);
                return;
            }
            var first = e.touches[0], el = first.target;
            this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);
            if (el.tagName && el.tagName.toLowerCase() === "a") {
                L.DomUtil.addClass(el, "leaflet-active");
            }
            this._holdTimeout = setTimeout(L.bind(function () {
                if (this._isTapValid()) {
                    this._fireClick = false;
                    this._onUp();
                    this._simulateEvent("contextmenu", first);
                }
            }, this), 1e3);
            L.DomEvent.on(document, "touchmove", this._onMove, this).on(document, "touchend", this._onUp, this);
        },
        _onUp: function (e) {
            clearTimeout(this._holdTimeout);
            L.DomEvent.off(document, "touchmove", this._onMove, this).off(document, "touchend", this._onUp, this);
            if (this._fireClick && e && e.changedTouches) {
                var first = e.changedTouches[0], el = first.target;
                if (el && el.tagName && el.tagName.toLowerCase() === "a") {
                    L.DomUtil.removeClass(el, "leaflet-active");
                }
                if (this._isTapValid()) {
                    this._simulateEvent("click", first);
                }
            }
        },
        _isTapValid: function () {
            return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
        },
        _onMove: function (e) {
            var first = e.touches[0];
            this._newPos = new L.Point(first.clientX, first.clientY);
        },
        _simulateEvent: function (type, e) {
            var simulatedEvent = document.createEvent("MouseEvents");
            simulatedEvent._simulated = true;
            e.target._simulatedClick = true;
            simulatedEvent.initMouseEvent(type, true, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, false, false, 0, null);
            e.target.dispatchEvent(simulatedEvent);
        }
    });
    if (L.Browser.touch && !L.Browser.pointer) {
        L.Map.addInitHook("addHandler", "tap", L.Map.Tap);
    }
    L.Map.mergeOptions({
        boxZoom: true
    });
    L.Map.BoxZoom = L.Handler.extend({
        initialize: function (map) {
            this._map = map;
            this._container = map._container;
            this._pane = map._panes.overlayPane;
            this._moved = false;
        },
        addHooks: function () {
            L.DomEvent.on(this._container, "mousedown", this._onMouseDown, this);
        },
        removeHooks: function () {
            L.DomEvent.off(this._container, "mousedown", this._onMouseDown);
            this._moved = false;
        },
        moved: function () {
            return this._moved;
        },
        _onMouseDown: function (e) {
            this._moved = false;
            if (!e.shiftKey || e.which !== 1 && e.button !== 1) {
                return false;
            }
            L.DomUtil.disableTextSelection();
            L.DomUtil.disableImageDrag();
            this._startLayerPoint = this._map.mouseEventToLayerPoint(e);
            L.DomEvent.on(document, "mousemove", this._onMouseMove, this).on(document, "mouseup", this._onMouseUp, this).on(document, "keydown", this._onKeyDown, this);
        },
        _onMouseMove: function (e) {
            if (!this._moved) {
                this._box = L.DomUtil.create("div", "leaflet-zoom-box", this._pane);
                L.DomUtil.setPosition(this._box, this._startLayerPoint);
                this._container.style.cursor = "crosshair";
                this._map.fire("boxzoomstart");
            }
            var startPoint = this._startLayerPoint, box = this._box, layerPoint = this._map.mouseEventToLayerPoint(e), offset = layerPoint.subtract(startPoint), newPos = new L.Point(Math.min(layerPoint.x, startPoint.x), Math.min(layerPoint.y, startPoint.y));
            L.DomUtil.setPosition(box, newPos);
            this._moved = true;
            box.style.width = Math.max(0, Math.abs(offset.x) - 4) + "px";
            box.style.height = Math.max(0, Math.abs(offset.y) - 4) + "px";
        },
        _finish: function () {
            if (this._moved) {
                this._pane.removeChild(this._box);
                this._container.style.cursor = "";
            }
            L.DomUtil.enableTextSelection();
            L.DomUtil.enableImageDrag();
            L.DomEvent.off(document, "mousemove", this._onMouseMove).off(document, "mouseup", this._onMouseUp).off(document, "keydown", this._onKeyDown);
        },
        _onMouseUp: function (e) {
            this._finish();
            var map = this._map, layerPoint = map.mouseEventToLayerPoint(e);
            if (this._startLayerPoint.equals(layerPoint)) {
                return;
            }
            var bounds = new L.LatLngBounds(map.layerPointToLatLng(this._startLayerPoint), map.layerPointToLatLng(layerPoint));
            map.fitBounds(bounds);
            map.fire("boxzoomend", {
                boxZoomBounds: bounds
            });
        },
        _onKeyDown: function (e) {
            if (e.keyCode === 27) {
                this._finish();
            }
        }
    });
    L.Map.addInitHook("addHandler", "boxZoom", L.Map.BoxZoom);
    L.Map.mergeOptions({
        keyboard: true,
        keyboardPanOffset: 80,
        keyboardZoomOffset: 1
    });
    L.Map.Keyboard = L.Handler.extend({
        keyCodes: {
            left: [37],
            right: [39],
            down: [40],
            up: [38],
            zoomIn: [187, 107, 61, 171],
            zoomOut: [189, 109, 173]
        },
        initialize: function (map) {
            this._map = map;
            this._setPanOffset(map.options.keyboardPanOffset);
            this._setZoomOffset(map.options.keyboardZoomOffset);
        },
        addHooks: function () {
            var container = this._map._container;
            if (container.tabIndex === -1) {
                container.tabIndex = "0";
            }
            L.DomEvent.on(container, "focus", this._onFocus, this).on(container, "blur", this._onBlur, this).on(container, "mousedown", this._onMouseDown, this);
            this._map.on("focus", this._addHooks, this).on("blur", this._removeHooks, this);
        },
        removeHooks: function () {
            this._removeHooks();
            var container = this._map._container;
            L.DomEvent.off(container, "focus", this._onFocus, this).off(container, "blur", this._onBlur, this).off(container, "mousedown", this._onMouseDown, this);
            this._map.off("focus", this._addHooks, this).off("blur", this._removeHooks, this);
        },
        _onMouseDown: function () {
            if (this._focused) {
                return;
            }
            var body = document.body, docEl = document.documentElement, top = body.scrollTop || docEl.scrollTop, left = body.scrollLeft || docEl.scrollLeft;
            this._map._container.focus();
            window.scrollTo(left, top);
        },
        _onFocus: function () {
            this._focused = true;
            this._map.fire("focus");
        },
        _onBlur: function () {
            this._focused = false;
            this._map.fire("blur");
        },
        _setPanOffset: function (pan) {
            var keys = this._panKeys = {}, codes = this.keyCodes, i, len;
            for (i = 0, len = codes.left.length; i < len; i++) {
                keys[codes.left[i]] = [-1 * pan, 0];
            }
            for (i = 0, len = codes.right.length; i < len; i++) {
                keys[codes.right[i]] = [pan, 0];
            }
            for (i = 0, len = codes.down.length; i < len; i++) {
                keys[codes.down[i]] = [0, pan];
            }
            for (i = 0, len = codes.up.length; i < len; i++) {
                keys[codes.up[i]] = [0, -1 * pan];
            }
        },
        _setZoomOffset: function (zoom) {
            var keys = this._zoomKeys = {}, codes = this.keyCodes, i, len;
            for (i = 0, len = codes.zoomIn.length; i < len; i++) {
                keys[codes.zoomIn[i]] = zoom;
            }
            for (i = 0, len = codes.zoomOut.length; i < len; i++) {
                keys[codes.zoomOut[i]] = -zoom;
            }
        },
        _addHooks: function () {
            L.DomEvent.on(document, "keydown", this._onKeyDown, this);
        },
        _removeHooks: function () {
            L.DomEvent.off(document, "keydown", this._onKeyDown, this);
        },
        _onKeyDown: function (e) {
            var key = e.keyCode, map = this._map;
            if (key in this._panKeys) {
                if (map._panAnim && map._panAnim._inProgress) {
                    return;
                }
                map.panBy(this._panKeys[key]);
                if (map.options.maxBounds) {
                    map.panInsideBounds(map.options.maxBounds);
                }
            } else if (key in this._zoomKeys) {
                map.setZoom(map.getZoom() + this._zoomKeys[key]);
            } else {
                return;
            }
            L.DomEvent.stop(e);
        }
    });
    L.Map.addInitHook("addHandler", "keyboard", L.Map.Keyboard);
    L.Handler.MarkerDrag = L.Handler.extend({
        initialize: function (marker) {
            this._marker = marker;
        },
        addHooks: function () {
            var icon = this._marker._icon;
            if (!this._draggable) {
                this._draggable = new L.Draggable(icon, icon);
            }
            this._draggable.on("dragstart", this._onDragStart, this).on("drag", this._onDrag, this).on("dragend", this._onDragEnd, this);
            this._draggable.enable();
            L.DomUtil.addClass(this._marker._icon, "leaflet-marker-draggable");
        },
        removeHooks: function () {
            this._draggable.off("dragstart", this._onDragStart, this).off("drag", this._onDrag, this).off("dragend", this._onDragEnd, this);
            this._draggable.disable();
            L.DomUtil.removeClass(this._marker._icon, "leaflet-marker-draggable");
        },
        moved: function () {
            return this._draggable && this._draggable._moved;
        },
        _onDragStart: function () {
            this._marker.closePopup().fire("movestart").fire("dragstart");
        },
        _onDrag: function () {
            var marker = this._marker, shadow = marker._shadow, iconPos = L.DomUtil.getPosition(marker._icon), latlng = marker._map.layerPointToLatLng(iconPos);
            if (shadow) {
                L.DomUtil.setPosition(shadow, iconPos);
            }
            marker._latlng = latlng;
            marker.fire("move", {
                latlng: latlng
            }).fire("drag");
        },
        _onDragEnd: function (e) {
            this._marker.fire("moveend").fire("dragend", e);
        }
    });
    L.Control = L.Class.extend({
        options: {
            position: "topright"
        },
        initialize: function (options) {
            L.setOptions(this, options);
        },
        getPosition: function () {
            return this.options.position;
        },
        setPosition: function (position) {
            var map = this._map;
            if (map) {
                map.removeControl(this);
            }
            this.options.position = position;
            if (map) {
                map.addControl(this);
            }
            return this;
        },
        getContainer: function () {
            return this._container;
        },
        addTo: function (map) {
            this._map = map;
            var container = this._container = this.onAdd(map), pos = this.getPosition(), corner = map._controlCorners[pos];
            L.DomUtil.addClass(container, "leaflet-control");
            if (pos.indexOf("bottom") !== -1) {
                corner.insertBefore(container, corner.firstChild);
            } else {
                corner.appendChild(container);
            }
            return this;
        },
        removeFrom: function (map) {
            var pos = this.getPosition(), corner = map._controlCorners[pos];
            corner.removeChild(this._container);
            this._map = null;
            if (this.onRemove) {
                this.onRemove(map);
            }
            return this;
        },
        _refocusOnMap: function () {
            if (this._map) {
                this._map.getContainer().focus();
            }
        }
    });
    L.control = function (options) {
        return new L.Control(options);
    };
    L.Map.include({
        addControl: function (control) {
            control.addTo(this);
            return this;
        },
        removeControl: function (control) {
            control.removeFrom(this);
            return this;
        },
        _initControlPos: function () {
            var corners = this._controlCorners = {}, l = "leaflet-", container = this._controlContainer = L.DomUtil.create("div", l + "control-container", this._container);

            function createCorner(vSide, hSide) {
                var className = l + vSide + " " + l + hSide;
                corners[vSide + hSide] = L.DomUtil.create("div", className, container);
            }

            createCorner("top", "left");
            createCorner("top", "right");
            createCorner("bottom", "left");
            createCorner("bottom", "right");
        },
        _clearControlPos: function () {
            this._container.removeChild(this._controlContainer);
        }
    });
    L.Control.Zoom = L.Control.extend({
        options: {
            position: "topleft",
            zoomInText: "+",
            zoomInTitle: "Zoom in",
            zoomOutText: "-",
            zoomOutTitle: "Zoom out"
        },
        onAdd: function (map) {
            var zoomName = "leaflet-control-zoom", container = L.DomUtil.create("div", zoomName + " leaflet-bar");
            this._map = map;
            this._zoomInButton = this._createButton(this.options.zoomInText, this.options.zoomInTitle, zoomName + "-in", container, this._zoomIn, this);
            this._zoomOutButton = this._createButton(this.options.zoomOutText, this.options.zoomOutTitle, zoomName + "-out", container, this._zoomOut, this);
            this._updateDisabled();
            map.on("zoomend zoomlevelschange", this._updateDisabled, this);
            return container;
        },
        onRemove: function (map) {
            map.off("zoomend zoomlevelschange", this._updateDisabled, this);
        },
        _zoomIn: function (e) {
            this._map.zoomIn(e.shiftKey ? 3 : 1);
        },
        _zoomOut: function (e) {
            this._map.zoomOut(e.shiftKey ? 3 : 1);
        },
        _createButton: function (html, title, className, container, fn, context) {
            var link = L.DomUtil.create("a", className, container);
            link.innerHTML = html;
            link.href = "#";
            link.title = title;
            var stop = L.DomEvent.stopPropagation;
            L.DomEvent.on(link, "click", stop).on(link, "mousedown", stop).on(link, "dblclick", stop).on(link, "click", L.DomEvent.preventDefault).on(link, "click", fn, context).on(link, "click", this._refocusOnMap, context);
            return link;
        },
        _updateDisabled: function () {
            var map = this._map, className = "leaflet-disabled";
            L.DomUtil.removeClass(this._zoomInButton, className);
            L.DomUtil.removeClass(this._zoomOutButton, className);
            if (map._zoom === map.getMinZoom()) {
                L.DomUtil.addClass(this._zoomOutButton, className);
            }
            if (map._zoom === map.getMaxZoom()) {
                L.DomUtil.addClass(this._zoomInButton, className);
            }
        }
    });
    L.Map.mergeOptions({
        zoomControl: true
    });
    L.Map.addInitHook(function () {
        if (this.options.zoomControl) {
            this.zoomControl = new L.Control.Zoom();
            this.addControl(this.zoomControl);
        }
    });
    L.control.zoom = function (options) {
        return new L.Control.Zoom(options);
    };
    L.Control.Attribution = L.Control.extend({
        options: {
            position: "bottomright",
            prefix: '<div class="logo-sm"></div>'
        },
        initialize: function (options) {
            L.setOptions(this, options);
            this._attributions = {};
        },
        onAdd: function (map) {
            this._container = L.DomUtil.create("div", "leaflet-control-attribution");
            L.DomEvent.disableClickPropagation(this._container);
            for (var i in map._layers) {
                if (map._layers[i].getAttribution) {
                    this.addAttribution(map._layers[i].getAttribution());
                }
            }
            map.on("layeradd", this._onLayerAdd, this).on("layerremove", this._onLayerRemove, this);
            this._update();
            return this._container;
        },
        onRemove: function (map) {
            map.off("layeradd", this._onLayerAdd).off("layerremove", this._onLayerRemove);
        },
        setPrefix: function (prefix) {
            this.options.prefix = prefix;
            this._update();
            return this;
        },
        addAttribution: function (text) {
            if (!text) {
                return;
            }
            if (!this._attributions[text]) {
                this._attributions[text] = 0;
            }
            this._attributions[text]++;
            this._update();
            return this;
        },
        removeAttribution: function (text) {
            if (!text) {
                return;
            }
            if (this._attributions[text]) {
                this._attributions[text]--;
                this._update();
            }
            return this;
        },
        _update: function () {
            if (!this._map) {
                return;
            }
            var attribs = [];
            for (var i in this._attributions) {
                if (this._attributions[i]) {
                    attribs.push(i);
                }
            }
            var prefixAndAttribs = [];
            if (this.options.prefix) {
                prefixAndAttribs.push(this.options.prefix);
            }
            if (attribs.length) {
                prefixAndAttribs.push(attribs.join(", "));
            }
            this._container.innerHTML = prefixAndAttribs.join(" | ");
        },
        _onLayerAdd: function (e) {
            if (e.layer.getAttribution) {
                this.addAttribution(e.layer.getAttribution());
            }
        },
        _onLayerRemove: function (e) {
            if (e.layer.getAttribution) {
                this.removeAttribution(e.layer.getAttribution());
            }
        }
    });
    L.Map.mergeOptions({
        attributionControl: true
    });
    L.Map.addInitHook(function () {
        if (this.options.attributionControl) {
            this.attributionControl = new L.Control.Attribution().addTo(this);
        }
    });
    L.control.attribution = function (options) {
        return new L.Control.Attribution(options);
    };
    L.Control.Scale = L.Control.extend({
        options: {
            position: "bottomleft",
            maxWidth: 100,
            metric: true,
            imperial: true,
            updateWhenIdle: false
        },
        onAdd: function (map) {
            this._map = map;
            var className = "leaflet-control-scale", container = L.DomUtil.create("div", className), options = this.options;
            this._addScales(options, className, container);
            map.on(options.updateWhenIdle ? "moveend" : "move", this._update, this);
            map.whenReady(this._update, this);
            return container;
        },
        onRemove: function (map) {
            map.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this);
        },
        _addScales: function (options, className, container) {
            if (options.metric) {
                this._mScale = L.DomUtil.create("div", className + "-line", container);
            }
            if (options.imperial) {
                this._iScale = L.DomUtil.create("div", className + "-line", container);
            }
        },
        _update: function () {
            var bounds = this._map.getBounds(), centerLat = bounds.getCenter().lat, halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180), dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180, size = this._map.getSize(), options = this.options, maxMeters = 0;
            if (size.x > 0) {
                maxMeters = dist * (options.maxWidth / size.x);
            }
            this._updateScales(options, maxMeters);
        },
        _updateScales: function (options, maxMeters) {
            if (options.metric && maxMeters) {
                this._updateMetric(maxMeters);
            }
            if (options.imperial && maxMeters) {
                this._updateImperial(maxMeters);
            }
        },
        _updateMetric: function (maxMeters) {
            var meters = this._getRoundNum(maxMeters);
            this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + "px";
            this._mScale.innerHTML = meters < 1e3 ? meters + " m" : meters / 1e3 + " km";
        },
        _updateImperial: function (maxMeters) {
            var maxFeet = maxMeters * 3.2808399, scale = this._iScale, maxMiles, miles, feet;
            if (maxFeet > 5280) {
                maxMiles = maxFeet / 5280;
                miles = this._getRoundNum(maxMiles);
                scale.style.width = this._getScaleWidth(miles / maxMiles) + "px";
                scale.innerHTML = miles + " mi";
            } else {
                feet = this._getRoundNum(maxFeet);
                scale.style.width = this._getScaleWidth(feet / maxFeet) + "px";
                scale.innerHTML = feet + " ft";
            }
        },
        _getScaleWidth: function (ratio) {
            return Math.round(this.options.maxWidth * ratio) - 10;
        },
        _getRoundNum: function (num) {
            var pow10 = Math.pow(10, (Math.floor(num) + "").length - 1), d = num / pow10;
            d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
            return pow10 * d;
        }
    });
    L.control.scale = function (options) {
        return new L.Control.Scale(options);
    };



    L.Control.Layers = L.Control.extend({
        options: {
            collapsed: true,
            position: "topright",
            autoZIndex: true
        },
        initialize: function (baseLayers, overlays, options) {
            L.setOptions(this, options);
            this._layers = {};
            this._lastZIndex = 0;
            this._handlingClick = false;
            for (var i in baseLayers) {
                this._addLayer(baseLayers[i], i);
            }
            for (i in overlays) {
                this._addLayer(overlays[i], i, true);
            }
        },
        onAdd: function (map) {
            this._initLayout();
            this._update();
            map.on("layeradd", this._onLayerChange, this).on("layerremove", this._onLayerChange, this);
            return this._container;
        },
        onRemove: function (map) {
            map.off("layeradd", this._onLayerChange).off("layerremove", this._onLayerChange);
        },
        addBaseLayer: function (layer, name) {
            this._addLayer(layer, name);
            this._update();
            return this;
        },
        addOverlay: function (layer, name) {
            this._addLayer(layer, name, true);
            this._update();
            return this;
        },
        removeLayer: function (layer) {
            var id = L.stamp(layer);
            delete this._layers[id];
            this._update();
            return this;
        },
        _initLayout: function () {
            var className = "leaflet-control-layers", container = this._container = L.DomUtil.create("div", className);
            container.setAttribute("aria-haspopup", true);
            if (!L.Browser.touch) {
                L.DomEvent.disableClickPropagation(container).disableScrollPropagation(container);
            } else {
                L.DomEvent.on(container, "click", L.DomEvent.stopPropagation);
            }
            var form = this._form = L.DomUtil.create("form", className + "-list");
            if (this.options.collapsed) {
                if (!L.Browser.android) {
                    L.DomEvent.on(container, "mouseover", this._expand, this).on(container, "mouseout", this._collapse, this);
                }
                var link = this._layersLink = L.DomUtil.create("a", className + "-toggle", container);
                link.href = "#";
                link.title = "Layers";
                if (L.Browser.touch) {
                    L.DomEvent.on(link, "click", L.DomEvent.stop).on(link, "click", this._expand, this);
                } else {
                    L.DomEvent.on(link, "focus", this._expand, this);
                }
                L.DomEvent.on(form, "click", function () {
                    setTimeout(L.bind(this._onInputClick, this), 0);
                }, this);
                this._map.on("click", this._collapse, this);
            } else {
                this._expand();
            }
            this._baseLayersList = L.DomUtil.create("div", className + "-base", form);
            this._separator = L.DomUtil.create("div", className + "-separator", form);
            this._overlaysList = L.DomUtil.create("div", className + "-overlays", form);
            container.appendChild(form);
        },
        _addLayer: function (layer, name, overlay) {
            var id = L.stamp(layer);
            this._layers[id] = {
                layer: layer,
                name: name,
                overlay: overlay
            };
            if (this.options.autoZIndex && layer.setZIndex) {
                this._lastZIndex++;
                layer.setZIndex(this._lastZIndex);
            }
        },
        _update: function () {
            if (!this._container) {
                return;
            }
            this._baseLayersList.innerHTML = "";
            this._overlaysList.innerHTML = "";
            var baseLayersPresent = false, overlaysPresent = false, i, obj;
            for (i in this._layers) {
                obj = this._layers[i];
                this._addItem(obj);
                overlaysPresent = overlaysPresent || obj.overlay;
                baseLayersPresent = baseLayersPresent || !obj.overlay;
            }
            this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none";
        },
        _onLayerChange: function (e) {
            var obj = this._layers[L.stamp(e.layer)];
            if (!obj) {
                return;
            }
            if (!this._handlingClick) {
                this._update();
            }
            var type = obj.overlay ? e.type === "layeradd" ? "overlayadd" : "overlayremove" : e.type === "layeradd" ? "baselayerchange" : null;
            if (type) {
                this._map.fire(type, obj);
            }
        },
        _createRadioElement: function (name, checked) {
            var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
            if (checked) {
                radioHtml += ' checked="checked"';
            }
            radioHtml += "/>";
            var radioFragment = document.createElement("div");
            radioFragment.innerHTML = radioHtml;
            return radioFragment.firstChild;
        },
        _addItem: function (obj) {
            var label = document.createElement("label"), input, checked = this._map.hasLayer(obj.layer);
            if (obj.overlay) {
                input = document.createElement("input");
                input.type = "checkbox";
                input.className = "leaflet-control-layers-selector";
                input.defaultChecked = checked;
            } else {
                input = this._createRadioElement("leaflet-base-layers", checked);
            }
            input.layerId = L.stamp(obj.layer);
            L.DomEvent.on(input, "click", this._onInputClick, this);
            var name = document.createElement("span");
            name.innerHTML = " " + obj.name;
            label.appendChild(input);
            label.appendChild(name);
            var container = obj.overlay ? this._overlaysList : this._baseLayersList;
            container.appendChild(label);
            return label;
        },
        _onInputClick: function () {
            var i, input, obj, inputs = this._form.getElementsByTagName("input"), inputsLen = inputs.length;
            this._handlingClick = true;
            for (i = 0; i < inputsLen; i++) {
                input = inputs[i];
                obj = this._layers[input.layerId];
                if (input.checked && !this._map.hasLayer(obj.layer)) {
                    this._map.addLayer(obj.layer);
                } else if (!input.checked && this._map.hasLayer(obj.layer)) {
                    this._map.removeLayer(obj.layer);
                }
            }
            this._handlingClick = false;
            this._refocusOnMap();
        },
        _expand: function () {
            L.DomUtil.addClass(this._container, "leaflet-control-layers-expanded");
        },
        _collapse: function () {
            this._container.className = this._container.className.replace(" leaflet-control-layers-expanded", "");
        }
    });
    L.control.layers = function (baseLayers, overlays, options) {
        return new L.Control.Layers(baseLayers, overlays, options);
    };
    L.PosAnimation = L.Class.extend({
        includes: L.Mixin.Events,
        run: function (el, newPos, duration, easeLinearity) {
            this.stop();
            this._el = el;
            this._inProgress = true;
            this._newPos = newPos;
            this.fire("start");
            el.style[L.DomUtil.TRANSITION] = "all " + (duration || .25) + "s cubic-bezier(0,0," + (easeLinearity || .5) + ",1)";
            L.DomEvent.on(el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
            L.DomUtil.setPosition(el, newPos);
            L.Util.falseFn(el.offsetWidth);
            this._stepTimer = setInterval(L.bind(this._onStep, this), 50);
        },
        stop: function () {
            if (!this._inProgress) {
                return;
            }
            L.DomUtil.setPosition(this._el, this._getPos());
            this._onTransitionEnd();
            L.Util.falseFn(this._el.offsetWidth);
        },
        _onStep: function () {
            var stepPos = this._getPos();
            if (!stepPos) {
                this._onTransitionEnd();
                return;
            }
            this._el._leaflet_pos = stepPos;
            this.fire("step");
        },
        _transformRe: /([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,
        _getPos: function () {
            var left, top, matches, el = this._el, style = window.getComputedStyle(el);
            if (L.Browser.any3d) {
                matches = style[L.DomUtil.TRANSFORM].match(this._transformRe);
                if (!matches) {
                    return;
                }
                left = parseFloat(matches[1]);
                top = parseFloat(matches[2]);
            } else {
                left = parseFloat(style.left);
                top = parseFloat(style.top);
            }
            return new L.Point(left, top, true);
        },
        _onTransitionEnd: function () {
            L.DomEvent.off(this._el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
            if (!this._inProgress) {
                return;
            }
            this._inProgress = false;
            this._el.style[L.DomUtil.TRANSITION] = "";
            this._el._leaflet_pos = this._newPos;
            clearInterval(this._stepTimer);
            this.fire("step").fire("end");
        }
    });
    L.Map.include({
        setView: function (center, zoom, options) {
            zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
            center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
            options = options || {};
            if (this._panAnim) {
                this._panAnim.stop();
            }
            if (this._loaded && !options.reset && options !== true) {
                if (options.animate !== undefined) {
                    options.zoom = L.extend({
                        animate: options.animate
                    }, options.zoom);
                    options.pan = L.extend({
                        animate: options.animate
                    }, options.pan);
                }
                var animated = this._zoom !== zoom ? this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) : this._tryAnimatedPan(center, options.pan);
                if (animated) {
                    clearTimeout(this._sizeTimer);
                    return this;
                }
            }
            this._resetView(center, zoom);
            return this;
        },
        panBy: function (offset, options) {
            offset = L.point(offset).round();
            options = options || {};
            if (!offset.x && !offset.y) {
                return this;
            }
            if (!this._panAnim) {
                this._panAnim = new L.PosAnimation();
                this._panAnim.on({
                    step: this._onPanTransitionStep,
                    end: this._onPanTransitionEnd
                }, this);
            }
            if (!options.noMoveStart) {
                this.fire("movestart");
            }
            if (options.animate !== false) {
                L.DomUtil.addClass(this._mapPane, "leaflet-pan-anim");
                var newPos = this._getMapPanePos().subtract(offset);
                this._panAnim.run(this._mapPane, newPos, options.duration || .25, options.easeLinearity);
            } else {
                this._rawPanBy(offset);
                this.fire("move").fire("moveend");
            }
            return this;
        },
        _onPanTransitionStep: function () {
            this.fire("move");
        },
        _onPanTransitionEnd: function () {
            L.DomUtil.removeClass(this._mapPane, "leaflet-pan-anim");
            this.fire("moveend");
        },
        _tryAnimatedPan: function (center, options) {
            var offset = this._getCenterOffset(center)._floor();
            if ((options && options.animate) !== true && !this.getSize().contains(offset)) {
                return false;
            }
            this.panBy(offset, options);
            return true;
        }
    });
    L.PosAnimation = L.DomUtil.TRANSITION ? L.PosAnimation : L.PosAnimation.extend({
        run: function (el, newPos, duration, easeLinearity) {
            this.stop();
            this._el = el;
            this._inProgress = true;
            this._duration = duration || .25;
            this._easeOutPower = 1 / Math.max(easeLinearity || .5, .2);
            this._startPos = L.DomUtil.getPosition(el);
            this._offset = newPos.subtract(this._startPos);
            this._startTime = +new Date();
            this.fire("start");
            this._animate();
        },
        stop: function () {
            if (!this._inProgress) {
                return;
            }
            this._step();
            this._complete();
        },
        _animate: function () {
            this._animId = L.Util.requestAnimFrame(this._animate, this);
            this._step();
        },
        _step: function () {
            var elapsed = +new Date() - this._startTime, duration = this._duration * 1e3;
            if (elapsed < duration) {
                this._runFrame(this._easeOut(elapsed / duration));
            } else {
                this._runFrame(1);
                this._complete();
            }
        },
        _runFrame: function (progress) {
            var pos = this._startPos.add(this._offset.multiplyBy(progress));
            L.DomUtil.setPosition(this._el, pos);
            this.fire("step");
        },
        _complete: function () {
            L.Util.cancelAnimFrame(this._animId);
            this._inProgress = false;
            this.fire("end");
        },
        _easeOut: function (t) {
            return 1 - Math.pow(1 - t, this._easeOutPower);
        }
    });
    L.Map.mergeOptions({
        zoomAnimation: true,
        zoomAnimationThreshold: 4
    });
    if (L.DomUtil.TRANSITION) {
        L.Map.addInitHook(function () {
            this._zoomAnimated = this.options.zoomAnimation && L.DomUtil.TRANSITION && L.Browser.any3d && !L.Browser.android23 && !L.Browser.mobileOpera;
            if (this._zoomAnimated) {
                L.DomEvent.on(this._mapPane, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
            }
        });
    }
    L.Map.include(!L.DomUtil.TRANSITION ? {} : {
        _catchTransitionEnd: function (e) {
            if (this._animatingZoom && e.propertyName.indexOf("transform") >= 0) {
                this._onZoomTransitionEnd();
            }
        },
        _nothingToAnimate: function () {
            return !this._container.getElementsByClassName("leaflet-zoom-animated").length;
        },
        _tryAnimatedZoom: function (center, zoom, options) {
            if (this._animatingZoom) {
                return true;
            }
            options = options || {};
            if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() || Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) {
                return false;
            }
            var scale = this.getZoomScale(zoom), offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale), origin = this._getCenterLayerPoint()._add(offset);
            if (options.animate !== true && !this.getSize().contains(offset)) {
                return false;
            }
            this.fire("movestart").fire("zoomstart");
            this._animateZoom(center, zoom, origin, scale, null, true);
            return true;
        },
        _animateZoom: function (center, zoom, origin, scale, delta, backwards) {
            this._animatingZoom = true;
            L.DomUtil.addClass(this._mapPane, "leaflet-zoom-anim");
            this._animateToCenter = center;
            this._animateToZoom = zoom;
            if (L.Draggable) {
                L.Draggable._disabled = true;
            }
            this.fire("zoomanim", {
                center: center,
                zoom: zoom,
                origin: origin,
                scale: scale,
                delta: delta,
                backwards: backwards
            });
        },
        _onZoomTransitionEnd: function () {
            this._animatingZoom = false;
            L.DomUtil.removeClass(this._mapPane, "leaflet-zoom-anim");
            this._resetView(this._animateToCenter, this._animateToZoom, true, true);
            if (L.Draggable) {
                L.Draggable._disabled = false;
            }
        }
    });
    L.TileLayer.include({
        _animateZoom: function (e) {
            if (!this._animating) {
                this._animating = true;
                this._prepareBgBuffer();
            }
            var bg = this._bgBuffer, transform = L.DomUtil.TRANSFORM, initialTransform = e.delta ? L.DomUtil.getTranslateString(e.delta) : bg.style[transform], scaleStr = L.DomUtil.getScaleString(e.scale, e.origin);
            bg.style[transform] = e.backwards ? scaleStr + " " + initialTransform : initialTransform + " " + scaleStr;
        },
        _endZoomAnim: function () {
            var front = this._tileContainer, bg = this._bgBuffer;
            front.style.visibility = "";
            front.parentNode.appendChild(front);
            L.Util.falseFn(bg.offsetWidth);
            this._animating = false;
        },
        _clearBgBuffer: function () {
            var map = this._map;
            if (map && !map._animatingZoom && !map.touchZoom._zooming) {
                this._bgBuffer.innerHTML = "";
                this._bgBuffer.style[L.DomUtil.TRANSFORM] = "";
            }
        },
        _prepareBgBuffer: function () {
            var front = this._tileContainer, bg = this._bgBuffer;
            var bgLoaded = this._getLoadedTilesPercentage(bg), frontLoaded = this._getLoadedTilesPercentage(front);
            if (bg && bgLoaded > .5 && frontLoaded < .5) {
                front.style.visibility = "hidden";
                this._stopLoadingImages(front);
                return;
            }
            bg.style.visibility = "hidden";
            bg.style[L.DomUtil.TRANSFORM] = "";
            this._tileContainer = bg;
            bg = this._bgBuffer = front;
            this._stopLoadingImages(bg);
            clearTimeout(this._clearBgBufferTimer);
        },
        _getLoadedTilesPercentage: function (container) {
            var tiles = container.getElementsByTagName("img"), i, len, count = 0;
            for (i = 0, len = tiles.length; i < len; i++) {
                if (tiles[i].complete) {
                    count++;
                }
            }
            return count / len;
        },
        _stopLoadingImages: function (container) {
            var tiles = Array.prototype.slice.call(container.getElementsByTagName("img")), i, len, tile;
            for (i = 0, len = tiles.length; i < len; i++) {
                tile = tiles[i];
                if (!tile.complete) {
                    tile.onload = L.Util.falseFn;
                    tile.onerror = L.Util.falseFn;
                    tile.src = L.Util.emptyImageUrl;
                    tile.parentNode.removeChild(tile);
                }
            }
        }
    });
    L.Map.include({
        _defaultLocateOptions: {
            watch: false,
            setView: false,
            maxZoom: Infinity,
            timeout: 1e4,
            maximumAge: 0,
            enableHighAccuracy: false
        },
        locate: function (options) {
            options = this._locateOptions = L.extend(this._defaultLocateOptions, options);
            if (!navigator.geolocation) {
                this._handleGeolocationError({
                    code: 0,
                    message: "Geolocation not supported."
                });
                return this;
            }
            var onResponse = L.bind(this._handleGeolocationResponse, this), onError = L.bind(this._handleGeolocationError, this);
            if (options.watch) {
                this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options);
            } else {
                navigator.geolocation.getCurrentPosition(onResponse, onError, options);
            }
            return this;
        },
        stopLocate: function () {
            if (navigator.geolocation) {
                navigator.geolocation.clearWatch(this._locationWatchId);
            }
            if (this._locateOptions) {
                this._locateOptions.setView = false;
            }
            return this;
        },
        _handleGeolocationError: function (error) {
            var c = error.code, message = error.message || (c === 1 ? "permission denied" : c === 2 ? "position unavailable" : "timeout");
            if (this._locateOptions.setView && !this._loaded) {
                this.fitWorld();
            }
            this.fire("locationerror", {
                code: c,
                message: "Geolocation error: " + message + "."
            });
        },
        _handleGeolocationResponse: function (pos) {
            var lat = pos.coords.latitude, lng = pos.coords.longitude, latlng = new L.LatLng(lat, lng), latAccuracy = 180 * pos.coords.accuracy / 40075017, lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat), bounds = L.latLngBounds([lat - latAccuracy, lng - lngAccuracy], [lat + latAccuracy, lng + lngAccuracy]), options = this._locateOptions;
            if (options.setView) {
                var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);
                this.setView(latlng, zoom);
            }
            var data = {
                latlng: latlng,
                bounds: bounds,
                timestamp: pos.timestamp
            };
            for (var i in pos.coords) {
                if (typeof pos.coords[i] === "number") {
                    data[i] = pos.coords[i];
                }
            }
            this.fire("locationfound", data);
        }
    });
})(window, document);

(function (window, document, undefined) {
    L.drawVersion = "0.2.0-dev";
    L.drawLocal = {
        draw: {
            toolbar: {
                title: "Cancel drawing",
                text: "Cancel",
                polyline: "Measure a line",
                fpolyline: "Draw a free line",
                polygon: "Draw a polygon",
                fpolygon: "Draw a fpolygon",
                rectangle: "Select features",
                circle: "Draw a circle",
                marker: "Draw a marker",
                clearSelection: "Clear Selection",
                style: "Style Editor"
            },
            circle: {
                tooltip: {
                    start: "Click and drag to draw circle.",
                    radius: "Radius:",
                    uint: " m"
                }
            },
            marker: {
                tooltip: {
                    start: "Click map to place marker."
                }
            },
            polygon: {
                tooltip: {
                    start: "Click to start drawing shape.",
                    cont: "Click to continue drawing shape.",
                    end: "Click first point to close this shape."
                }
            },
            fpolygon: {
                tooltip: {
                    start: "Click to start drawing shape.",
                    cont: "Click to continue drawing shape.",
                    end: "Click first point to close this shape."
                }
            },
            polyline: {
                error: "<strong>Error:</strong> shape edges cannot cross!",
                tooltip: {
                    start: "Click to start drawing line.",
                    cont: "Click to continue drawing line.",
                    end: "Click last point to finish line."
                }
            },
            fpolyline: {
                error: "<strong>Error:</strong> shape edges cannot cross!",
                tooltip: {
                    start: "Click to start drawing fline.",
                    cont: "Click to continue drawing fline.",
                    end: "Click last point to finish fline."
                }
            },
            rectangle: {
                tooltip: {
                    start: "Click and drag to draw rectangle."
                }
            },
            simpleshape: {
                tooltip: {
                    end: "Release mouse to finish drawing."
                }
            }
        },
        edit: {
            toolbar: {
                edit: {
                    title: "Edit layers",
                    save: {
                        title: "Save changes.",
                        text: "Save"
                    },
                    cancel: {
                        title: "Cancel editing, discards all changes.",
                        text: "Cancel"
                    }
                },
                remove: {
                    title: "Delete layers",
                    tooltip: "Click on a feature to remove"
                }
            },
            tooltip: {
                text: "Drag handles, or marker to edit feature.",
                subtext: "Click cancel to undo changes."
            }
        }
    };
    L.Draw = {};
    L.Draw.Feature = L.Handler.extend({
        includes: L.Mixin.Events,
        initialize: function (map, options) {
            this._map = map;
            this._container = map._container;
            this._overlayPane = map._panes.overlayPane;
            this._popupPane = map._panes.popupPane;
            if (options && options.shapeOptions) {
                options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
            }
            L.Util.extend(this.options, options);
        },
        enable: function () {
            if (this._enabled) {
                return;
            }
            L.Handler.prototype.enable.call(this);
            this.fire("enabled", {
                handler: this.type
            });
            this._map.fire("draw:drawstart", {
                layerType: this.type
            });
        },
        disable: function () {
            if (!this._enabled) {
                return;
            }
            L.Handler.prototype.disable.call(this);
            this.fire("disabled", {
                handler: this.type
            });
            this._map.fire("draw:drawstop", {
                layerType: this.type
            });
        },
        addHooks: function () {
            if (this._map) {
                L.DomUtil.disableTextSelection();
                this._tooltip = new L.Tooltip(this._map);
                L.DomEvent.addListener(this._container, "keyup", this._cancelDrawing, this);
            }
        },
        removeHooks: function () {
            if (this._map) {
                L.DomUtil.enableTextSelection();
                this._tooltip.dispose();
                this._tooltip = null;
                L.DomEvent.removeListener(this._container, "keyup", this._cancelDrawing);
            }
        },
        setOptions: function (options) {
            L.setOptions(this, options);
        },
        _fireCreatedEvent: function (layer) {
            this._map.fire("draw:created", {
                layer: layer,
                layerType: this.type
            });
        },
        _cancelDrawing: function (e) {
            if (e.keyCode === 27) {
                this.disable();
            }
        }
    });
    L.Draw.Polyline = L.Draw.Feature.extend({
        statics: {
            TYPE: "polyline"
        },
        Poly: L.Polyline,
        options: {
            allowIntersection: true,
            drawError: {
                color: "#b00b00",
                message: L.drawLocal.draw.polyline.error,
                timeout: 2500
            },
            icon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: "leaflet-div-icon leaflet-editing-icon"
            }),
            guidelineDistance: 20,
            shapeOptions: {
                stroke: true,
                color: "#f06eaa",
                weight: 4,
                opacity: .5,
                fill: false,
                clickable: true
            },
            zIndexOffset: 2e3
        },
        initialize: function (map, options) {
            if (options && options.drawError) {
                options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
            }
            this.type = L.Draw.Polyline.TYPE;
            L.Draw.Feature.prototype.initialize.call(this, map, options);
        },
        addHooks: function () {
            L.Draw.Feature.prototype.addHooks.call(this);
            if (this._map) {
                this._markers = [];
                this._markerGroup = new L.LayerGroup();
                this._map.addLayer(this._markerGroup);
                this._poly = new L.Polyline([], this.options.shapeOptions, this.type);
                this._tooltip.updateContent(this._getTooltipText());
                if (!this._mouseMarker) {
                    this._mouseMarker = L.marker(this._map.getCenter(), {
                        icon: L.divIcon({
                            className: "leaflet-mouse-marker",
                            iconAnchor: [20, 20],
                            iconSize: [40, 40]
                        }),
                        opacity: 0,
                        zIndexOffset: this.options.zIndexOffset
                    });
                }
                this._mouseMarker.on("click", this._onClick, this).addTo(this._map);
                this._map.on("mousemove", this._onMouseMove, this).on("zoomend", this._onZoomEnd, this);
            }
        },
        removeHooks: function () {
            L.Draw.Feature.prototype.removeHooks.call(this);
            this._clearHideErrorTimeout();
            this._cleanUpShape();
            this._map.removeLayer(this._markerGroup);
            delete this._markerGroup;
            delete this._markers;
            this._map.removeLayer(this._poly);
            delete this._poly;
            this._mouseMarker.off("click", this._onClick, this);
            this._map.removeLayer(this._mouseMarker);
            delete this._mouseMarker;
            this._clearGuides();
            this._map.off("mousemove", this._onMouseMove, this).off("zoomend", this._onZoomEnd, this);
        },
        _finishShape: function () {
            var intersects = this._poly.newLatLngIntersects(this._poly.getLatLngs()[0], true);
            if (!this.options.allowIntersection && intersects || !this._shapeIsValid()) {
                this._showErrorTooltip();
                return;
            }
            this._fireCreatedEvent();
            this.disable();
        },
        _shapeIsValid: function () {
            return true;
        },
        _onZoomEnd: function () {
            this._updateGuide();
        },
        _onMouseMove: function (e) {
            var newPos = e.layerPoint, latlng = e.latlng;
            this._currentLatLng = latlng;
            this._updateTooltip(latlng);
            this._updateGuide(newPos);
            this._mouseMarker.setLatLng(latlng);
            L.DomEvent.preventDefault(e.originalEvent);
        },
        _onClick: function (e) {
            var latlng = e.target.getLatLng(), markerCount = this._markers.length;
            if (markerCount > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
                this._showErrorTooltip();
                return;
            } else if (this._errorShown) {
                this._hideErrorTooltip();
            }
            this._markers.push(this._createMarker(latlng));
            this._poly.addLatLng(latlng);
            if (this._poly.getLatLngs().length === 2) {
                this._map.addLayer(this._poly);
            }
            this._updateFinishHandler();
            this._vertexAdded(latlng);
            this._clearGuides();
            this._updateTooltip();
        },
        _updateFinishHandler: function () {
            var markerCount = this._markers.length;
            if (markerCount > 1) {
                this._markers[markerCount - 1].on("click", this._finishShape, this);
            }
            if (markerCount > 2) {
                this._markers[markerCount - 2].off("click", this._finishShape, this);
            }
        },
        _createMarker: function (latlng) {
            var marker = new L.Marker(latlng, {
                icon: this.options.icon,
                zIndexOffset: this.options.zIndexOffset * 2
            });
            this._markerGroup.addLayer(marker);
            return marker;
        },
        _updateGuide: function (newPos) {
            newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);
            var markerCount = this._markers.length;
            if (markerCount > 0) {
                this._clearGuides();
                this._drawGuide(this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()), newPos);
            }
        },
        _updateTooltip: function (latLng) {
            var text = this._getTooltipText();
            if (latLng) {
                this._tooltip.updatePosition(latLng);
            }
            if (!this._errorShown) {
                this._tooltip.updateContent(text);
            }
        },
        _drawGuide: function (pointA, pointB) {
            var length = Math.floor(Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2))), i, fraction, dashPoint, dash;
            if (!this._guidesContainer) {
                this._guidesContainer = L.DomUtil.create("div", "leaflet-draw-guides", this._overlayPane);
            }
            for (i = this.options.guidelineDistance; i < length; i += this.options.guidelineDistance) {
                fraction = i / length;
                dashPoint = {
                    x: Math.floor(pointA.x * (1 - fraction) + fraction * pointB.x),
                    y: Math.floor(pointA.y * (1 - fraction) + fraction * pointB.y)
                };
                dash = L.DomUtil.create("div", "leaflet-draw-guide-dash", this._guidesContainer);
                dash.style.backgroundColor = !this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;
                L.DomUtil.setPosition(dash, dashPoint);
            }
        },
        _updateGuideColor: function (color) {
            if (this._guidesContainer) {
                for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
                    this._guidesContainer.childNodes[i].style.backgroundColor = color;
                }
            }
        },
        _clearGuides: function () {
            if (this._guidesContainer) {
                while (this._guidesContainer.firstChild) {
                    this._guidesContainer.removeChild(this._guidesContainer.firstChild);
                }
            }
        },
        _getTooltipText: function () {
            var labelText, distance, distanceStr;
            if (this._markers.length === 0) {
                labelText = {
                    text: L.drawLocal.draw.polyline.tooltip.start
                };
            } else {
                distance = this._measurementRunningTotal + this._currentLatLng.distanceTo(this._markers[this._markers.length - 1].getLatLng());
                distanceStr = distance > 1e3 ? (distance / 1e3).toFixed(2) + " km" : Math.ceil(distance) + " m";
                if (this._markers.length === 1) {
                    labelText = {
                        text: L.drawLocal.draw.polyline.tooltip.cont,
                        subtext: distanceStr
                    };
                } else {
                    labelText = {
                        text: L.drawLocal.draw.polyline.tooltip.end,
                        subtext: distanceStr
                    };
                }
            }
            return labelText;
        },
        _showErrorTooltip: function () {
            this._errorShown = true;
            this._tooltip.showAsError().updateContent({
                text: this.options.drawError.message
            });
            this._updateGuideColor(this.options.drawError.color);
            this._poly.setStyle({
                color: this.options.drawError.color
            });
            this._clearHideErrorTimeout();
            this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
        },
        _hideErrorTooltip: function () {
            this._errorShown = false;
            this._clearHideErrorTimeout();
            this._tooltip.removeError().updateContent(this._getTooltipText());
            this._updateGuideColor(this.options.shapeOptions.color);
            this._poly.setStyle({
                color: this.options.shapeOptions.color
            });
        },
        _clearHideErrorTimeout: function () {
            if (this._hideErrorTimeout) {
                clearTimeout(this._hideErrorTimeout);
                this._hideErrorTimeout = null;
            }
        },
        _vertexAdded: function (latlng) {
            if (this._markers.length === 1) {
                this._measurementRunningTotal = 0;
            } else {
                this._measurementRunningTotal += latlng.distanceTo(this._markers[this._markers.length - 2].getLatLng());
            }
        },
        _cleanUpShape: function () {
            if (this._markers.length > 1) {
                this._markers[this._markers.length - 1].off("click", this._finishShape, this);
            }
        },
        _fireCreatedEvent: function () {
            var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions, this.type);
            //poly['distance'] = this._poly.getDistances();
            L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
        }
    });
    L.Draw.Polygon = L.Draw.Polyline.extend({
        statics: {
            TYPE: "polygon"
        },
        Poly: L.Polygon,
        options: {
            areaIncross: true,
            showArea: false,
            shapeOptions: {
                stroke: true,
                color: "#f06eaa",
                weight: 4,
                opacity: .5,
                fill: true,
                fillColor: null,
                fillOpacity: .2,
                clickable: true
            }
        },
        initialize: function (map, options) {
            L.Draw.Polyline.prototype.initialize.call(this, map, options);
            this.type = L.Draw.Polygon.TYPE;
        },
        _updateFinishHandler: function () {
            var markerCount = this._markers.length;
            if (markerCount === 1) {
                this._markers[0].on("click", this._finishShape, this);
            }
            if (markerCount > 2) {
                this._markers[markerCount - 1].on("dblclick", this._finishShape, this);
                if (markerCount > 3) {
                    this._markers[markerCount - 2].off("dblclick", this._finishShape, this);
                }
            }
        },
        _getTooltipText: function () {
            var text, subtext;
            if (this._markers.length === 0) {
                text = L.drawLocal.draw.polygon.tooltip.start;
            } else if (this._markers.length < 3) {
                text = L.drawLocal.draw.polygon.tooltip.cont;
            } else {
                text = L.drawLocal.draw.polygon.tooltip.end;
                subtext = this._area;
            }
            return {
                text: text,
                subtext: subtext
            };
        },
        _shapeIsValid: function () {
            return this._markers.length >= 3;
        },
        _vertexAdded: function () {
            if (!this.options.areaIncross) {
                if (this.options.allowIntersection || !this.options.showArea) {
                    return;
                }
            }
            var latLngs = this._poly.getLatLngs(), area = L.PolygonUtil.geodesicArea(latLngs);
            if (area > 1e6) {
                area = (area * 1e-6).toFixed(2) + " km&sup2;";
            } else if (area > 1e4) {
                area = (area * 1e-4).toFixed(2) + " ha";
            } else {
                area = area.toFixed(2) + " m&sup2;";
            }
            this._area = area;
        },
        _cleanUpShape: function () {
            var markerCount = this._markers.length;
            if (markerCount > 0) {
                this._markers[0].off("click", this._finishShape, this);
                if (markerCount > 2) {
                    this._markers[markerCount - 1].off("dblclick", this._finishShape, this);
                }
            }
        }
    });
    L.SimpleShape = {};
    L.Draw.SimpleShape = L.Draw.Feature.extend({
        addHooks: function () {
            L.Draw.Feature.prototype.addHooks.call(this);
            if (this._map) {
                //this._tooltip.updateContent({
                //    text: this._initialLabelText
                //});
                if (this.type == 'circle') {
                    this._tooltip.updateContent({
                        text: L.drawLocal.draw.circle.tooltip.start
                    });
                } else {
                    this._tooltip.updateContent({
                        text: L.drawLocal.draw.rectangle.tooltip.start
                    });
                }
                this._map.dragging.disable();
                this._container.style.cursor = "crosshair";
                this._map.on("mousedown", this._onMouseDown, this).on("mousemove", this._onMouseMove, this);
            }
        },
        removeHooks: function () {
            L.Draw.Feature.prototype.removeHooks.call(this);
            if (this._map) {
                this._map.dragging.enable();
                this._container.style.cursor = "";
                this._map.off("mousedown", this._onMouseDown, this).off("mousemove", this._onMouseMove, this);
                L.DomEvent.off(document, "mouseup", this._onMouseUp);
                if (this._shape) {
                    this._map.removeLayer(this._shape);
                    delete this._shape;
                }
            }
            this._isDrawing = false;
        },
        _onMouseDown: function (e) {
            this._isDrawing = true;
            this._startLatLng = e.latlng;
            L.DomEvent.on(document, "mouseup", this._onMouseUp, this).preventDefault(e.originalEvent);
        },
        _onMouseMove: function (e) {
            var latlng = e.latlng;
            this._tooltip.updatePosition(latlng);
            if (this._isDrawing) {
                this._tooltip.updateContent({
                    text: L.drawLocal.draw.simpleshape.tooltip.end
                });
                this._drawShape(latlng);
            }
        },
        _onMouseUp: function () {
            if (this._shape) {
                this._fireCreatedEvent();
            }
            this.disable();
        }
    });
    L.Draw.Rectangle = L.Draw.SimpleShape.extend({
        statics: {
            TYPE: "rectangle"
        },
        options: {
            shapeOptions: {
                stroke: true,
                color: "#f06eaa",
                weight: 4,
                opacity: .5,
                fill: true,
                fillColor: null,
                fillOpacity: .2,
                clickable: true
            }
        },
        initialize: function (map, options) {
            this.type = L.Draw.Rectangle.TYPE;
            L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
        },
        _initialLabelText: L.drawLocal.draw.rectangle.tooltip.start,
        _drawShape: function (latlng) {
            if (!this._shape) {
                this._shape = new L.Rectangle(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
                this._map.addLayer(this._shape);
            } else {
                this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
            }
        },
        _fireCreatedEvent: function () {
            var rectangle = new L.Rectangle(this._shape.getBounds(), this.options.shapeOptions, this.type);
            L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, rectangle);
        },
        _boundsToLatLngs: function (latLngBounds) {
            latLngBounds = L.latLngBounds(latLngBounds);
            return [latLngBounds.getSouthWest(), latLngBounds.getNorthWest(), latLngBounds.getNorthEast(), latLngBounds.getSouthEast()];
        },
        _convertLatLngs: function (latlngs, overwrite) {
            var i, len, target = overwrite ? latlngs : [];
            for (i = 0, len = latlngs.length; i < len; i++) {
                if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== "number") {
                    return;
                }
                target[i] = L.latLng(latlngs[i]);
            }
            return target;
        },
        getAreas: function () {
            var area = 0;
            area = L.PolygonUtil.geodesicArea(this._latlngs);
            // Convert to most appropriate units
            if (area > 1000000) {
                area = (area * 0.000001).toFixed(2) + ' km&sup2;';
            } else if (area > 10000) {
                area = (area * 0.0001).toFixed(2) + ' ha';
            } else {
                area = area.toFixed(2) + ' m&sup2;';
            }
            return area;
        },
        _onMouseMove: function (e) {
            var latlng = e.latlng, area = 0, latlngBounds;
            this._tooltip.updatePosition(latlng);
            if (this._isDrawing) {
                this._drawShape(latlng);
                latlngBounds = this._boundsToLatLngs(new L.LatLngBounds(this._startLatLng, latlng));
                this._latlngs = this._convertLatLngs(latlngBounds);
                area = this.getAreas();
                this._tooltip.updateContent({
                    text: "Release mouse to finish drawing.",
                    subtext: "Areas: " + area
                });
            }
        }
    });
    L.Draw.Circle = L.Draw.SimpleShape.extend({
        statics: {
            TYPE: "circle"
        },
        options: {
            shapeOptions: {
                stroke: true,
                color: "#f06eaa",
                weight: 4,
                opacity: .5,
                fill: true,
                fillColor: null,
                fillOpacity: .2,
                clickable: true,
                extendedIconClass: 'extend-icon'
            },
            radiusScalable: false
        },
        initialize: function (map, options) {
            this.type = L.Draw.Circle.TYPE;
            L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
            this.options.radiusScalable = this.options.radiusScalable || options.radiusScalable;
        },
        _initialLabelText: L.drawLocal.draw.circle.tooltip.start,
        _drawShape: function (latlng) {
            if (!this._shape) {
                this._shape = new L.Circle(this._startLatLng, this._startLatLng.distanceTo(latlng), this.options.shapeOptions);
                this._map.addLayer(this._shape);
            } else {
                this._shape.setRadius(this._startLatLng.distanceTo(latlng));
            }
        },
        _fireCreatedEvent: function () {
            var circle = null;
            if (this.options.radiusScalable) {
                circle = new L.CircleEditor(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
            } else {
                circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
            }
            //var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
            L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
        },
        _onMouseMove: function (e) {
            var latlng = e.latlng, radius;
            this._tooltip.updatePosition(latlng);
            if (this._isDrawing) {
                this._drawShape(latlng);
                radius = this._shape.getRadius().toFixed(1);
                this._tooltip.updateContent({
                    text: L.drawLocal.draw.simpleshape.tooltip.end,
                    subtext: L.drawLocal.draw.circle.radius + radius + L.drawLocal.draw.circle.uint
                });
            }
        }
    });
    L.Draw.Marker = L.Draw.Feature.extend({
        statics: {
            TYPE: "marker"
        },
        options: {
            icon: new L.Icon.Default(),
            zIndexOffset: 2e3
        },
        initialize: function (map, options) {
            this.type = L.Draw.Marker.TYPE;
            L.Draw.Feature.prototype.initialize.call(this, map, options);
        },
        addHooks: function () {
            L.Draw.Feature.prototype.addHooks.call(this);
            if (this._map) {
                this._tooltip.updateContent({
                    text: L.drawLocal.draw.marker.tooltip.start
                });
                if (!this._mouseMarker) {
                    this._mouseMarker = L.marker(this._map.getCenter(), {
                        icon: L.divIcon({
                            className: "leaflet-mouse-marker",
                            iconAnchor: [20, 20],
                            iconSize: [40, 40]
                        }),
                        opacity: 0,
                        zIndexOffset: this.options.zIndexOffset
                    });
                }
                this._mouseMarker.on("click", this._onClick, this).addTo(this._map);
                this._map.on("mousemove", this._onMouseMove, this);
            }
        },
        removeHooks: function () {
            L.Draw.Feature.prototype.removeHooks.call(this);
            if (this._map) {
                if (this._marker) {
                    this._marker.off("click", this._onClick, this);
                    this._map.off("click", this._onClick, this).removeLayer(this._marker);
                    delete this._marker;
                }
                this._mouseMarker.off("click", this._onClick, this);
                this._map.removeLayer(this._mouseMarker);
                delete this._mouseMarker;
                this._map.off("mousemove", this._onMouseMove, this);
            }
        },
        _onMouseMove: function (e) {
            var latlng = e.latlng;
            this._tooltip.updatePosition(latlng);
            this._mouseMarker.setLatLng(latlng);
            if (!this._marker) {
                this._marker = new L.Marker(latlng, {
                    icon: this.options.icon,
                    zIndexOffset: this.options.zIndexOffset
                });
                this._marker.on("click", this._onClick, this);
                this._map.on("click", this._onClick, this).addLayer(this._marker);
            } else {
                this._marker.setLatLng(latlng);
            }
        },
        _onClick: function () {
            this._fireCreatedEvent();
            //this.disable();
            this.enable();
        },
        _fireCreatedEvent: function () {
            var marker = new L.Marker(this._marker.getLatLng(), {
                icon: this.options.icon
            });
            L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
        }
    });

    L.Draw.fPolyline = L.Draw.Polyline.extend({
        includes: L.Mixin.Events,
        statics: {
            TYPE: 'fpolyline'
        },

        Poly: L.Polyline,

        options: {
            title: "Draw a free line",
            allowIntersection: true,
            areaIncross: true,
            drawError: {
                color: '#b00b00',
                message: L.drawLocal.draw.polyline.error,
                timeout: 2500
            },
            icon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: 'leaflet-div-icon leaflet-editing-icon'
            }),
            guidelineDistance: 20,
            shapeOptions: {
                stroke: true,
                color: '#f06eaa',
                weight: 4,
                opacity: 0.5,
                fill: false,
                clickable: true
            },
            zIndexOffset: 2000 // This should be > than the highest z-index any map layers
        },

        initialize: function (map, options) {
            // Merge default drawError options with custom options
            if (options && options.drawError) {
                options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
            }

            // Save the type so super can fire, need to do this as cannot do this.TYPE :(
            this.type = L.Draw.fPolyline.TYPE;

            L.Draw.Feature.prototype.initialize.call(this, map, options);
        },

        addHooks: function () {
            L.Draw.Feature.prototype.addHooks.call(this);
            if (this._map) {
                this._markers = [];

                this._markerGroup = new L.LayerGroup();
                this._map.addLayer(this._markerGroup);

                this._poly = new L.Polyline([], this.options.shapeOptions, this.type);

                this._tooltip.updateContent(this._getTooltipText());

                // Make a transparent marker that will used to catch click events. These click
                // events will create the vertices. We need to do this so we can ensure that
                // we can create vertices over other map layers (markers, vector layers). We
                // also do not want to trigger any click handlers of objects we are clicking on
                // while drawing.
                if (!this._mouseMarker) {
                    this._mouseMarker = L.marker(this._map.getCenter(), {
                        icon: L.divIcon({
                            className: 'leaflet-mouse-marker',
                            iconAnchor: [20, 20],
                            iconSize: [40, 40]
                        }),
                        opacity: 0,
                        zIndexOffset: this.options.zIndexOffset
                    });
                }

                this._mouseMarker
                    .on('click', this._onClick, this)
                    .addTo(this._map);

                this._map
                    .on('click', function () {
                        this._map.on('mousemove', this._onMouseMove, this);
                    }, this)
                    .on('zoomend', this._onZoomEnd, this);
            }
        },

        removeHooks: function () {
            L.Draw.Feature.prototype.removeHooks.call(this);

            this._clearHideErrorTimeout();

            this._cleanUpShape();

            // remove markers from map
            this._map.removeLayer(this._markerGroup);
            delete this._markerGroup;
            delete this._markers;

            this._map.removeLayer(this._poly);
            delete this._poly;

            this._mouseMarker.off('click', this._onClick, this);
            this._map.removeLayer(this._mouseMarker);
            delete this._mouseMarker;

            // clean up DOM
            this._clearGuides();

            this._map
                .off('mousemove', this._onMouseMove, this)
                .off('zoomend', this._onZoomEnd, this);
        },

        _finishShape: function () {
            var intersects = this._poly.newLatLngIntersects(this._poly.getLatLngs()[0], true);

            if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
                this._showErrorTooltip();
                return;
            }

            this._fireCreatedEvent();
            this._map.off('click');
            //this.enabled();
            this.disable();
        },

        //Called to verify the shape is valid when the user tries to finish it
        //Return false if the shape is not valid
        _shapeIsValid: function () {
            return true;
        },

        _onZoomEnd: function () {
            this._updateGuide();
        },

        _onMouseMove: function (e) {
            var newPos = e.layerPoint,
                latlng = e.latlng,
                markerCount = this._markers.length;

            // Save latlng
            // should this be moved to _updateGuide() ?
            this._currentLatLng = latlng;

            this._updateTooltip(latlng);

            // Update the guide line
            this._updateGuide(newPos);

            // Update the mouse marker position
            this._mouseMarker.setLatLng(latlng);

            L.DomEvent.preventDefault(e.originalEvent);
            //////
            if (markerCount > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
                this._showErrorTooltip();
                return;
            }
            else if (this._errorShown) {
                this._hideErrorTooltip();
            }

            this._markers.push(this._createMarker(latlng));

            this._poly.addLatLng(latlng);

            if (this._poly.getLatLngs().length === 2) {
                this._map.addLayer(this._poly);
            }

            this._updateFinishHandler();

            this._vertexAdded(latlng);

            this._clearGuides();

            this._updateTooltip();
        },

        _onClick: function (e) {
            var latlng = e.target.getLatLng(),
                markerCount = this._markers.length;

            if (markerCount > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
                this._showErrorTooltip();
                return;
            }
            else if (this._errorShown) {
                this._hideErrorTooltip();
            }

            this._markers.push(this._createMarker(latlng));

            this._poly.addLatLng(latlng);

            if (this._poly.getLatLngs().length === 2) {
                this._map.addLayer(this._poly);
            }

            this._updateFinishHandler();

            this._vertexAdded(latlng);

            this._clearGuides();

            this._updateTooltip();
        },

        _updateFinishHandler: function () {
            var markerCount = this._markers.length;
            // The last marker should have a click handler to close the polyline
            if (markerCount > 1) {
                this._markers[markerCount - 1].on('click', this._finishShape, this);
            }

            // Remove the old marker click handler (as only the last point should close the polyline)
            if (markerCount > 2) {
                this._markers[markerCount - 2].off('click', this._finishShape, this);
            }
        },

        _createMarker: function (latlng) {
            var marker = new L.Marker(latlng, {
                icon: this.options.icon,
                zIndexOffset: this.options.zIndexOffset * 2
            });

            this._markerGroup.addLayer(marker);

            return marker;
        },

        _updateGuide: function (newPos) {
            newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

            var markerCount = this._markers.length;

            if (markerCount > 0) {
                // draw the guide line
                this._clearGuides();
                this._drawGuide(
                    this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
                    newPos
                );
            }
        },

        _updateTooltip: function (latLng) {
            var text = this._getTooltipText();

            if (latLng) {
                this._tooltip.updatePosition(latLng);
            }

            if (!this._errorShown) {
                this._tooltip.updateContent(text);
            }
        },

        _drawGuide: function (pointA, pointB) {
            var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
                i,
                fraction,
                dashPoint,
                dash;

            //create the guides container if we haven't yet
            if (!this._guidesContainer) {
                this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
            }

            //draw a dash every GuildeLineDistance
            for (i = this.options.guidelineDistance; i < length; i += this.options.guidelineDistance) {
                //work out fraction along line we are
                fraction = i / length;

                //calculate new x,y point
                dashPoint = {
                    x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
                    y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
                };

                //add guide dash to guide container
                dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
                dash.style.backgroundColor =
                    !this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

                L.DomUtil.setPosition(dash, dashPoint);
            }
        },

        _updateGuideColor: function (color) {
            if (this._guidesContainer) {
                for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
                    this._guidesContainer.childNodes[i].style.backgroundColor = color;
                }
            }
        },

        // removes all child elements (guide dashes) from the guides container
        _clearGuides: function () {
            if (this._guidesContainer) {
                while (this._guidesContainer.firstChild) {
                    this._guidesContainer.removeChild(this._guidesContainer.firstChild);
                }
            }
        },

        _getTooltipText: function () {
            var labelText,
                distance,
                distanceStr;

            if (this._markers.length === 0) {
                labelText = {
                    text: L.drawLocal.draw.polyline.tooltip.start
                };
            } else {
                // calculate the distance from the last fixed point to the mouse position
                distance = this._measurementRunningTotal + this._currentLatLng.distanceTo(this._markers[this._markers.length - 1].getLatLng());
                // show metres when distance is < 1km, then show km
                distanceStr = distance > 1000 ? (distance / 1000).toFixed(2) + ' km' : Math.ceil(distance) + ' m';

                if (this._markers.length === 1) {
                    labelText = {
                        text: L.drawLocal.draw.polyline.tooltip.cont,
                        subtext: distanceStr
                    };
                } else {
                    labelText = {
                        text: L.drawLocal.draw.polyline.tooltip.end,
                        subtext: distanceStr
                    };
                }
            }
            return labelText;
        },

        _showErrorTooltip: function () {
            this._errorShown = true;

            // Update tooltip
            this._tooltip
                .showAsError()
                .updateContent({text: this.options.drawError.message});

            // Update shape
            this._updateGuideColor(this.options.drawError.color);
            this._poly.setStyle({color: this.options.drawError.color});

            // Hide the error after 2 seconds
            this._clearHideErrorTimeout();
            this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
        },

        _hideErrorTooltip: function () {
            this._errorShown = false;

            this._clearHideErrorTimeout();

            // Revert tooltip
            this._tooltip
                .removeError()
                .updateContent(this._getTooltipText());

            // Revert shape
            this._updateGuideColor(this.options.shapeOptions.color);
            this._poly.setStyle({color: this.options.shapeOptions.color});
        },

        _clearHideErrorTimeout: function () {
            if (this._hideErrorTimeout) {
                clearTimeout(this._hideErrorTimeout);
                this._hideErrorTimeout = null;
            }
        },

        _vertexAdded: function (latlng) {
            if (this._markers.length === 1) {
                this._measurementRunningTotal = 0;
            }
            else {
                this._measurementRunningTotal +=
                    latlng.distanceTo(this._markers[this._markers.length - 2].getLatLng());
            }
        },

        _cleanUpShape: function () {
            if (this._markers.length > 1) {
                this._markers[this._markers.length - 1].off('click', this._finishShape, this);
            }
        },

        _fireCreatedEvent: function () {
            var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions, this.type);
            L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
        }
    });
    L.Draw.fPolygon = L.Draw.fPolyline.extend({
        statics: {
            TYPE: 'fpolygon'
        },

        Poly: L.Polygon,

        options: {
            showArea: true,
            shapeOptions: {
                stroke: true,
                color: '#f06eaa',
                weight: 4,
                opacity: 0.5,
                fill: true,
                fillColor: null, //same as color by default
                fillOpacity: 0.2,
                clickable: true
            }
        },

        initialize: function (map, options, type) {
            L.Draw.Polygon.prototype.initialize.call(this, map, options, type);

            // Save the type so super can fire, need to do this as cannot do this.TYPE :(
            this.type = L.Draw.fPolygon.TYPE;
        },

        _updateFinishHandler: function () {
            var markerCount = this._markers.length;

            // The first marker shold have a click handler to close the polygon
            if (markerCount === 1) {
                this._markers[0].on('click', this._finishShape, this);
            }

            // Add and update the double click handler
            if (markerCount > 2) {
                this._markers[markerCount - 1].on('dblclick', this._finishShape, this);
                // Only need to remove handler if has been added before
                if (markerCount > 3) {
                    this._markers[markerCount - 2].off('dblclick', this._finishShape, this);
                }
            }
        },

        _getTooltipText: function () {
            var text, subtext;

            if (this._markers.length === 0) {
                text = L.drawLocal.draw.polygon.tooltip.start;
            } else if (this._markers.length < 3) {
                text = L.drawLocal.draw.polygon.tooltip.cont;
            } else {
                text = L.drawLocal.draw.polygon.tooltip.end;
                subtext = this._area;
            }

            return {
                text: text,
                subtext: subtext
            };
        },

        _shapeIsValid: function () {
            return this._markers.length >= 3;
        },

        _vertexAdded: function () {
            // Check to see if we should show the area
            if (!this.options.areaIncross) {
                if (this.options.allowIntersection || !this.options.showArea) {
                    return;
                }
            }
            var latLngs = this._poly.getLatLngs(),
                area = L.PolygonUtil.geodesicArea(latLngs);

            // Convert to most appropriate units
            if (area > 1000000) {
                area = (area * 0.000001).toFixed(2) + ' km&sup2;';
            } else if (area > 10000) {
                area = (area * 0.0001).toFixed(2) + ' ha';
            } else {
                area = area.toFixed(2) + ' m&sup2;';
            }

            this._area = area;
        },

        _cleanUpShape: function () {
            var markerCount = this._markers.length;

            if (markerCount > 0) {
                this._markers[0].off('click', this._finishShape, this);

                if (markerCount > 2) {
                    this._markers[markerCount - 1].off('dblclick', this._finishShape, this);
                }
            }
        }
    });

    L.Edit = L.Edit || {};
    L.Edit.Poly = L.Handler.extend({
        options: {
            icon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: "leaflet-div-icon leaflet-editing-icon"
            })
        },
        initialize: function (poly, options) {
            this._poly = poly;
            L.setOptions(this, options);
        },
        addHooks: function () {
            if (this._poly._map) {
                if (!this._markerGroup) {
                    this._initMarkers();
                }
                this._poly._map.addLayer(this._markerGroup);
            }
        },
        removeHooks: function () {
            if (this._poly._map) {
                this._poly._map.removeLayer(this._markerGroup);
                delete this._markerGroup;
                delete this._markers;
            }
        },
        updateMarkers: function () {
            this._markerGroup.clearLayers();
            this._initMarkers();
        },
        _initMarkers: function () {
            if (!this._markerGroup) {
                this._markerGroup = new L.LayerGroup();
            }
            this._markers = [];
            var latlngs = this._poly._latlngs, i, j, len, marker;
            for (i = 0, len = latlngs.length; i < len; i++) {
                marker = this._createMarker(latlngs[i], i);
                marker.on("click", this._onMarkerClick, this);
                this._markers.push(marker);
            }
            var markerLeft, markerRight;
            for (i = 0, j = len - 1; i < len; j = i++) {
                if (i === 0 && !(L.Polygon && this._poly instanceof L.Polygon)) {
                    continue;
                }
                markerLeft = this._markers[j];
                markerRight = this._markers[i];
                this._createMiddleMarker(markerLeft, markerRight);
                this._updatePrevNext(markerLeft, markerRight);
            }
        },
        _createMarker: function (latlng, index) {
            var marker = new L.Marker(latlng, {
                draggable: true,
                icon: this.options.icon
            });
            marker._origLatLng = latlng;
            marker._index = index;
            marker.on("drag", this._onMarkerDrag, this);
            marker.on("dragend", this._fireEdit, this);
            this._markerGroup.addLayer(marker);
            return marker;
        },
        _removeMarker: function (marker) {
            var i = marker._index;
            this._markerGroup.removeLayer(marker);
            this._markers.splice(i, 1);
            this._poly.spliceLatLngs(i, 1);
            this._updateIndexes(i, -1);
            marker.off("drag", this._onMarkerDrag, this).off("dragend", this._fireEdit, this).off("click", this._onMarkerClick, this);
        },
        _fireEdit: function () {
            this._poly.edited = true;
            this._poly.fire("edit");
        },
        _onMarkerDrag: function (e) {
            var marker = e.target;
            L.extend(marker._origLatLng, marker._latlng);
            if (marker._middleLeft) {
                marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
            }
            if (marker._middleRight) {
                marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
            }
            this._poly.redraw();
        },
        _onMarkerClick: function (e) {
            if (this._poly._latlngs.length < 3) {
                return;
            }
            var marker = e.target;
            this._removeMarker(marker);
            this._updatePrevNext(marker._prev, marker._next);
            if (marker._middleLeft) {
                this._markerGroup.removeLayer(marker._middleLeft);
            }
            if (marker._middleRight) {
                this._markerGroup.removeLayer(marker._middleRight);
            }
            if (marker._prev && marker._next) {
                this._createMiddleMarker(marker._prev, marker._next);
            } else if (!marker._prev) {
                marker._next._middleLeft = null;
            } else if (!marker._next) {
                marker._prev._middleRight = null;
            }
            this._fireEdit();
        },
        _updateIndexes: function (index, delta) {
            this._markerGroup.eachLayer(function (marker) {
                if (marker._index > index) {
                    marker._index += delta;
                }
            });
        },
        _createMiddleMarker: function (marker1, marker2) {
            var latlng = this._getMiddleLatLng(marker1, marker2), marker = this._createMarker(latlng), onClick, onDragStart, onDragEnd;
            marker.setOpacity(.6);
            marker1._middleRight = marker2._middleLeft = marker;
            onDragStart = function () {
                var i = marker2._index;
                marker._index = i;
                marker.off("click", onClick, this).on("click", this._onMarkerClick, this);
                latlng.lat = marker.getLatLng().lat;
                latlng.lng = marker.getLatLng().lng;
                this._poly.spliceLatLngs(i, 0, latlng);
                this._markers.splice(i, 0, marker);
                marker.setOpacity(1);
                this._updateIndexes(i, 1);
                marker2._index++;
                this._updatePrevNext(marker1, marker);
                this._updatePrevNext(marker, marker2);
            };
            onDragEnd = function () {
                marker.off("dragstart", onDragStart, this);
                marker.off("dragend", onDragEnd, this);
                this._createMiddleMarker(marker1, marker);
                this._createMiddleMarker(marker, marker2);
            };
            onClick = function () {
                onDragStart.call(this);
                onDragEnd.call(this);
                this._fireEdit();
            };
            marker.on("click", onClick, this).on("dragstart", onDragStart, this).on("dragend", onDragEnd, this);
            this._markerGroup.addLayer(marker);
        },
        _updatePrevNext: function (marker1, marker2) {
            if (marker1) {
                marker1._next = marker2;
            }
            if (marker2) {
                marker2._prev = marker1;
            }
        },
        _getMiddleLatLng: function (marker1, marker2) {
            var map = this._poly._map, p1 = map.latLngToLayerPoint(marker1.getLatLng()), p2 = map.latLngToLayerPoint(marker2.getLatLng());
            return map.layerPointToLatLng(p1._add(p2)._divideBy(2));
        }
    });
    L.Polyline.addInitHook(function () {
        if (this.editing) {
            return;
        }
        if (L.Edit.Poly) {
            this.editing = new L.Edit.Poly(this);
            if (this.options.editable) {
                this.editing.enable();
            }
        }
        this.on("add", function () {
            if (this.editing && this.editing.enabled()) {
                this.editing.addHooks();
            }
        });
        this.on("remove", function () {
            if (this.editing && this.editing.enabled()) {
                this.editing.removeHooks();
            }
        });
    });
    L.Edit = L.Edit || {};
    L.Edit.SimpleShape = L.Handler.extend({
        options: {
            moveIcon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: "leaflet-div-icon leaflet-editing-icon leaflet-edit-move"
            }),
            resizeIcon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: "leaflet-div-icon leaflet-editing-icon leaflet-edit-resize"
            })
        },
        initialize: function (shape, options) {
            this._shape = shape;
            L.Util.setOptions(this, options);
        },
        addHooks: function () {
            if (this._shape._map) {
                this._map = this._shape._map;
                if (!this._markerGroup) {
                    this._initMarkers();
                }
                this._map.addLayer(this._markerGroup);
            }
        },
        removeHooks: function () {
            if (this._shape._map) {
                this._unbindMarker(this._moveMarker);
                for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
                    this._unbindMarker(this._resizeMarkers[i]);
                }
                this._resizeMarkers = null;
                this._map.removeLayer(this._markerGroup);
                delete this._markerGroup;
            }
            this._map = null;
        },
        updateMarkers: function () {
            this._markerGroup.clearLayers();
            this._initMarkers();
        },
        _initMarkers: function () {
            if (!this._markerGroup) {
                this._markerGroup = new L.LayerGroup();
            }
            this._createMoveMarker();
            this._createResizeMarker();
        },
        _createMoveMarker: function () {
        },
        _createResizeMarker: function () {
        },
        _createMarker: function (latlng, icon) {
            var marker = new L.Marker(latlng, {
                draggable: true,
                icon: icon,
                zIndexOffset: 10
            });
            this._bindMarker(marker);
            this._markerGroup.addLayer(marker);
            return marker;
        },
        _bindMarker: function (marker) {
            marker.on("dragstart", this._onMarkerDragStart, this).on("drag", this._onMarkerDrag, this).on("dragend", this._onMarkerDragEnd, this);
        },
        _unbindMarker: function (marker) {
            marker.off("dragstart", this._onMarkerDragStart, this).off("drag", this._onMarkerDrag, this).off("dragend", this._onMarkerDragEnd, this);
        },
        _onMarkerDragStart: function (e) {
            var marker = e.target;
            marker.setOpacity(0);
        },
        _fireEdit: function () {
            this._shape.edited = true;
            this._shape.fire("edit");
        },
        _onMarkerDrag: function (e) {
            var marker = e.target, latlng = marker.getLatLng();
            if (marker === this._moveMarker) {
                this._move(latlng);
            } else {
                this._resize(latlng);
            }
            this._shape.redraw();
        },
        _onMarkerDragEnd: function (e) {
            var marker = e.target;
            marker.setOpacity(1);
            this._shape.fire("edit");
            this._fireEdit();
        },
        _move: function () {
        },
        _resize: function () {
        }
    });
    L.Edit = L.Edit || {};
    L.Edit.Rectangle = L.Edit.SimpleShape.extend({
        _createMoveMarker: function () {
            var bounds = this._shape.getBounds(), center = bounds.getCenter();
            this._moveMarker = this._createMarker(center, this.options.moveIcon);
        },
        _createResizeMarker: function () {
            var corners = this._getCorners();
            this._resizeMarkers = [];
            for (var i = 0, l = corners.length; i < l; i++) {
                this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
                this._resizeMarkers[i]._cornerIndex = i;
            }
        },
        _onMarkerDragStart: function (e) {
            L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);
            var corners = this._getCorners(), marker = e.target, currentCornerIndex = marker._cornerIndex;
            this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];
            this._toggleCornerMarkers(0, currentCornerIndex);
        },
        _onMarkerDragEnd: function (e) {
            var marker = e.target, bounds, center;
            if (marker === this._moveMarker) {
                bounds = this._shape.getBounds();
                center = bounds.getCenter();
                marker.setLatLng(center);
            }
            this._toggleCornerMarkers(1);
            this._repositionCornerMarkers();
            L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
        },
        _move: function (newCenter) {
            var latlngs = this._shape.getLatLngs(), bounds = this._shape.getBounds(), center = bounds.getCenter(), offset, newLatLngs = [];
            for (var i = 0, l = latlngs.length; i < l; i++) {
                offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
                newLatLngs.push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
            }
            this._shape.setLatLngs(newLatLngs);
            this._repositionCornerMarkers();
        },
        _resize: function (latlng) {
            var bounds;
            this._shape.setBounds(L.latLngBounds(latlng, this._oppositeCorner));
            bounds = this._shape.getBounds();
            this._moveMarker.setLatLng(bounds.getCenter());
        },
        _getCorners: function () {
            var bounds = this._shape.getBounds(), nw = bounds.getNorthWest(), ne = bounds.getNorthEast(), se = bounds.getSouthEast(), sw = bounds.getSouthWest();
            return [nw, ne, se, sw];
        },
        _toggleCornerMarkers: function (opacity) {
            for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
                this._resizeMarkers[i].setOpacity(opacity);
            }
        },
        _repositionCornerMarkers: function () {
            var corners = this._getCorners();
            for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
                this._resizeMarkers[i].setLatLng(corners[i]);
            }
        }
    });
    L.Rectangle.addInitHook(function () {
        if (L.Edit.Rectangle) {
            this.editing = new L.Edit.Rectangle(this);
            if (this.options.editable) {
                this.editing.enable();
            }
        }
    });
    L.Edit = L.Edit || {};
    L.Edit.Circle = L.Edit.SimpleShape.extend({
        _createMoveMarker: function () {
            var center = this._shape.getLatLng();
            this._moveMarker = this._createMarker(center, this.options.moveIcon);
        },
        _createResizeMarker: function () {
            var center = this._shape.getLatLng(), resizemarkerPoint = this._getResizeMarkerPoint(center);
            this._resizeMarkers = [];
            this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
        },
        _getResizeMarkerPoint: function (latlng) {
            var delta = this._shape._radius * Math.cos(Math.PI / 4), point = this._map.project(latlng);
            return this._map.unproject([point.x + delta, point.y - delta]);
        },
        _move: function (latlng) {
            var resizemarkerPoint = this._getResizeMarkerPoint(latlng);
            this._resizeMarkers[0].setLatLng(resizemarkerPoint);
            this._shape.setLatLng(latlng);
        },
        _resize: function (latlng) {
            var moveLatLng = this._moveMarker.getLatLng(), radius = moveLatLng.distanceTo(latlng);
            this._shape.setRadius(radius);
        }
    });
    L.Circle.addInitHook(function () {
        if (L.Edit.Circle) {
            this.editing = new L.Edit.Circle(this);
            if (this.options.editable) {
                this.editing.enable();
            }
        }
        this.on("add", function () {
            if (this.editing && this.editing.enabled()) {
                this.editing.addHooks();
            }
        });
        this.on("remove", function () {
            if (this.editing && this.editing.enabled()) {
                this.editing.removeHooks();
            }
        });
    });
    L.LatLngUtil = {
        cloneLatLngs: function (latlngs) {
            var clone = [];
            for (var i = 0, l = latlngs.length; i < l; i++) {
                clone.push(this.cloneLatLng(latlngs[i]));
            }
            return clone;
        },
        cloneLatLng: function (latlng) {
            return L.latLng(latlng.lat, latlng.lng);
        }
    };
    L.PolygonUtil = {
        geodesicArea: function (latLngs) {
            var pointsCount = latLngs.length, area = 0, d2r = L.LatLng.DEG_TO_RAD, p1, p2;
            if (pointsCount > 2) {
                for (var i = 0; i < pointsCount; i++) {
                    p1 = latLngs[i];
                    p2 = latLngs[(i + 1) % pointsCount];
                    area += (p2.lng - p1.lng) * d2r * (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
                }
                area = area * 6378137 * 6378137 / 2;
            }
            return Math.abs(area);
        }
    };
    L.Util.extend(L.LineUtil, {
        segmentsIntersect: function (p, p1, p2, p3) {
            return this._checkCounterclockwise(p, p2, p3) !== this._checkCounterclockwise(p1, p2, p3) && this._checkCounterclockwise(p, p1, p2) !== this._checkCounterclockwise(p, p1, p3);
        },
        _checkCounterclockwise: function (p, p1, p2) {
            return (p2.y - p.y) * (p1.x - p.x) > (p1.y - p.y) * (p2.x - p.x);
        }
    });
    L.Polyline.include({
        intersects: function () {
            var points = this._originalPoints, len = points ? points.length : 0, i, p, p1;
            if (this._tooFewPointsForIntersection()) {
                return false;
            }
            for (i = len - 1; i >= 3; i--) {
                p = points[i - 1];
                p1 = points[i];
                if (this._lineSegmentsIntersectsRange(p, p1, i - 2)) {
                    return true;
                }
            }
            return false;
        },
        newLatLngIntersects: function (latlng, skipFirst) {
            if (!this._map) {
                return false;
            }
            return this.newPointIntersects(this._map.latLngToLayerPoint(latlng), skipFirst);
        },
        newPointIntersects: function (newPoint, skipFirst) {
            var points = this._originalPoints, len = points ? points.length : 0, lastPoint = points ? points[len - 1] : null, maxIndex = len - 2;
            if (this._tooFewPointsForIntersection(1)) {
                return false;
            }
            return this._lineSegmentsIntersectsRange(lastPoint, newPoint, maxIndex, skipFirst ? 1 : 0);
        },
        _tooFewPointsForIntersection: function (extraPoints) {
            var points = this._originalPoints, len = points ? points.length : 0;
            len += extraPoints || 0;
            return !this._originalPoints || len <= 3;
        },
        _lineSegmentsIntersectsRange: function (p, p1, maxIndex, minIndex) {
            var points = this._originalPoints, p2, p3;
            minIndex = minIndex || 0;
            for (var j = maxIndex; j > minIndex; j--) {
                p2 = points[j - 1];
                p3 = points[j];
                if (L.LineUtil.segmentsIntersect(p, p1, p2, p3)) {
                    return true;
                }
            }
            return false;
        }
    });
    L.Polygon.include({
        intersects: function () {
            var polylineIntersects, points = this._originalPoints, len, firstPoint, lastPoint, maxIndex;
            if (this._tooFewPointsForIntersection()) {
                return false;
            }
            polylineIntersects = L.Polyline.prototype.intersects.call(this);
            if (polylineIntersects) {
                return true;
            }
            len = points.length;
            firstPoint = points[0];
            lastPoint = points[len - 1];
            maxIndex = len - 2;
            return this._lineSegmentsIntersectsRange(lastPoint, firstPoint, maxIndex, 1);
        }
    });
    L.Control.Draw = L.Control.extend({
        options: {
            position: "topleft",
            draw: {},
            edit: false
        },
        initialize: function (options) {
            if (L.version <= "0.5.1") {
                throw new Error("Leaflet.draw 0.2.0+ requires Leaflet 0.6.0+. Download latest from https://github.com/Leaflet/Leaflet/");
            }
            L.Control.prototype.initialize.call(this, options);
            var id, toolbar;
            this._toolbars = {};
            if (L.DrawToolbar && this.options.draw) {
                toolbar = new L.DrawToolbar(this.options.draw);
                id = L.stamp(toolbar);
                this._toolbars[id] = toolbar;
                this._toolbars[id].on("enable", this._toolbarEnabled, this);
            }
            if (L.EditToolbar && this.options.edit) {
                toolbar = new L.EditToolbar(this.options.edit);
                id = L.stamp(toolbar);
                this._toolbars[id] = toolbar;
                this._toolbars[id].on("enable", this._toolbarEnabled, this);
            }
        },
        onAdd: function (map) {
            var container = L.DomUtil.create("div", "leaflet-draw"), addedTopClass = false, topClassName = "leaflet-draw-toolbar-top", toolbarContainer;
            for (var toolbarId in this._toolbars) {
                if (this._toolbars.hasOwnProperty(toolbarId)) {
                    toolbarContainer = this._toolbars[toolbarId].addToolbar(map);
                    if (!addedTopClass) {
                        if (!L.DomUtil.hasClass(toolbarContainer, topClassName)) {
                            L.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
                        }
                        addedTopClass = true;
                    }
                    container.appendChild(toolbarContainer);
                }
            }
            return container;
        },
        onRemove: function () {
            for (var toolbarId in this._toolbars) {
                if (this._toolbars.hasOwnProperty(toolbarId)) {
                    this._toolbars[toolbarId].removeToolbar();
                }
            }
        },
        setDrawingOptions: function (options) {
            for (var toolbarId in this._toolbars) {
                if (this._toolbars[toolbarId] instanceof L.DrawToolbar) {
                    this._toolbars[toolbarId].setOptions(options);
                }
            }
        },
        _toolbarEnabled: function (e) {
            var id = "" + L.stamp(e.target);
            for (var toolbarId in this._toolbars) {
                if (this._toolbars.hasOwnProperty(toolbarId) && toolbarId !== id) {
                    this._toolbars[toolbarId].disable();
                }
            }
        }
    });
    L.Map.mergeOptions({
        drawControl: false
    });
    L.Map.addInitHook(function () {
        if (this.options.drawControl) {
            this.drawControl = new L.Control.Draw();
            this.addControl(this.drawControl);
        }
    });
    L.Toolbar = L.Class.extend({
        includes: [L.Mixin.Events],
        initialize: function (options) {
            L.setOptions(this, options);
            this._modes = {};
            this._actionButtons = [];
            this._activeMode = null;
        },
        enabled: function () {
            return this._activeMode !== null;
        },
        disable: function () {
            if (!this.enabled()) {
                return;
            }
            this._activeMode.handler.disable();
        },
        removeToolbar: function () {
            for (var handlerId in this._modes) {
                if (this._modes.hasOwnProperty(handlerId)) {
                    this._disposeButton(this._modes[handlerId].button, this._modes[handlerId].handler.enable);
                    this._modes[handlerId].handler.disable();
                    this._modes[handlerId].handler.off("enabled", this._handlerActivated, this).off("disabled", this._handlerDeactivated, this);
                }
            }
            this._modes = {};
            for (var i = 0, l = this._actionButtons.length; i < l; i++) {
                this._disposeButton(this._actionButtons[i].button, this._actionButtons[i].callback);
            }
            this._actionButtons = [];
            this._actionsContainer = null;
        },
        _initModeHandler: function (handler, container, buttonIndex, classNamePredix) {
            var type = handler.type;
            this._modes[type] = {};
            this._modes[type].handler = handler;
            this._modes[type].button = this._createButton({
                title: this.options[type].title,
                className: classNamePredix + "-" + type,
                container: container,
                callback: this._modes[type].handler.enable,
                context: this._modes[type].handler
            });
            this._modes[type].buttonIndex = buttonIndex;
            this._modes[type].handler.on("enabled", this._handlerActivated, this).on("disabled", this._handlerDeactivated, this);
        },
        _createButton: function (options) {
            var link = L.DomUtil.create("a", options.className || "", options.container);
            link.href = "#";
            if (options.text) {
                link.innerHTML = options.text;
            }
            if (options.title) {
                link.title = options.title;
            }
            L.DomEvent.on(link, "click", L.DomEvent.stopPropagation).on(link, "mousedown", L.DomEvent.stopPropagation).on(link, "dblclick", L.DomEvent.stopPropagation).on(link, "click", L.DomEvent.preventDefault).on(link, "click", options.callback, options.context);
            return link;
        },
        _disposeButton: function (button, callback) {
            L.DomEvent.off(button, "click", L.DomEvent.stopPropagation).off(button, "mousedown", L.DomEvent.stopPropagation).off(button, "dblclick", L.DomEvent.stopPropagation).off(button, "click", L.DomEvent.preventDefault).off(button, "click", callback);
        },
        _handlerActivated: function (e) {
            if (this._activeMode && this._activeMode.handler.enabled()) {
                this._activeMode.handler.disable();
            }
            this._activeMode = this._modes[e.handler];
            L.DomUtil.addClass(this._activeMode.button, "leaflet-draw-toolbar-button-enabled");
            this._showActionsToolbar();
            this.fire("enable");
        },
        _handlerDeactivated: function () {
            this._hideActionsToolbar();
            L.DomUtil.removeClass(this._activeMode.button, "leaflet-draw-toolbar-button-enabled");
            this._activeMode = null;
            this.fire("disable");
        },
        _createActions: function (buttons) {
            var container = L.DomUtil.create("ul", "leaflet-draw-actions"), buttonWidth = 50, l = buttons.length, containerWidth = l * buttonWidth + (l - 1), li, button;
            for (var i = 0; i < l; i++) {
                li = L.DomUtil.create("li", "", container);
                button = this._createButton({
                    title: buttons[i].title,
                    text: buttons[i].text,
                    container: li,
                    callback: buttons[i].callback,
                    context: buttons[i].context
                });
                this._actionButtons.push({
                    button: button,
                    callback: buttons[i].callback
                });
            }
            container.style.width = containerWidth + "px";
            return container;
        },
        _showActionsToolbar: function () {
            var buttonIndex = this._activeMode.buttonIndex, lastButtonIndex = this._lastButtonIndex, buttonHeight = 26, borderHeight = 1, toolbarPosition = buttonIndex * buttonHeight + buttonIndex * borderHeight - 1;
            this._actionsContainer.style.top = toolbarPosition + "px";
            if (buttonIndex === 0) {
                L.DomUtil.addClass(this._toolbarContainer, "leaflet-draw-toolbar-notop");
                L.DomUtil.addClass(this._actionsContainer, "leaflet-draw-actions-top");
            }
            if (buttonIndex === lastButtonIndex) {
                L.DomUtil.addClass(this._toolbarContainer, "leaflet-draw-toolbar-nobottom");
                L.DomUtil.addClass(this._actionsContainer, "leaflet-draw-actions-bottom");
            }
            this._actionsContainer.style.display = "block";
        },
        _hideActionsToolbar: function () {
            this._actionsContainer.style.display = "none";
            L.DomUtil.removeClass(this._toolbarContainer, "leaflet-draw-toolbar-notop");
            L.DomUtil.removeClass(this._toolbarContainer, "leaflet-draw-toolbar-nobottom");
            L.DomUtil.removeClass(this._actionsContainer, "leaflet-draw-actions-top");
            L.DomUtil.removeClass(this._actionsContainer, "leaflet-draw-actions-bottom");
        }
    });
    L.Tooltip = L.Class.extend({
        initialize: function (map) {
            this._map = map;
            this._popupPane = map._panes.popupPane;
            this._container = L.DomUtil.create("div", "leaflet-draw-tooltip", this._popupPane);
            this._singleLineLabel = false;
        },
        dispose: function () {
            this._popupPane.removeChild(this._container);
            this._container = null;
        },
        updateContent: function (labelText) {
            labelText.subtext = labelText.subtext || "";
            if (labelText.subtext.length === 0 && !this._singleLineLabel) {
                L.DomUtil.addClass(this._container, "leaflet-draw-tooltip-single");
                this._singleLineLabel = true;
            } else if (labelText.subtext.length > 0 && this._singleLineLabel) {
                L.DomUtil.removeClass(this._container, "leaflet-draw-tooltip-single");
                this._singleLineLabel = false;
            }
            this._container.innerHTML = (labelText.subtext.length > 0 ? '<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + "</span>" + "<br />" : "") + "<span>" + labelText.text + "</span>";
            return this;
        },
        updatePosition: function (latlng) {
            var pos = this._map.latLngToLayerPoint(latlng);
            L.DomUtil.setPosition(this._container, pos);
            return this;
        },
        showAsError: function () {
            L.DomUtil.addClass(this._container, "leaflet-error-draw-tooltip");
            return this;
        },
        removeError: function () {
            L.DomUtil.removeClass(this._container, "leaflet-error-draw-tooltip");
            return this;
        }
    });
    L.DrawToolbar = L.Toolbar.extend({
        options: {
            polyline: {
                title: L.drawLocal.draw.toolbar.polyline
            },
            fpolyline: {
                title: L.drawLocal.draw.toolbar.fpolyline
            },
            polygon: {
                title: L.drawLocal.draw.toolbar.polygon
            },
            fpolygon: {
                title: L.drawLocal.draw.toolbar.fpolygon
            },
            rectangle: {
                title: L.drawLocal.draw.toolbar.rectangle
            },
            circle: {
                title: L.drawLocal.draw.toolbar.circle
            },
            marker: {
                title: L.drawLocal.draw.toolbar.marker
            }
        },
        initialize: function (options) {
            for (var type in this.options) {
                if (this.options.hasOwnProperty(type)) {
                    if (options[type]) {
                        options[type] = L.extend({}, this.options[type], options[type]);
                    }
                }
            }
            L.Toolbar.prototype.initialize.call(this, options);
        },
        addToolbar: function (map) {
            var container = L.DomUtil.create("div", "leaflet-draw-section"), buttonIndex = 0, buttonClassPrefix = "leaflet-draw-draw";
            this._toolbarContainer = L.DomUtil.create("div", "leaflet-draw-toolbar leaflet-bar");
            if (this.options.polyline) {
                this._initModeHandler(new L.Draw.Polyline(map, this.options.polyline), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.fpolyline) {
                this._initModeHandler(new L.Draw.fPolyline(map, this.options.fpolyline), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.polygon) {
                this._initModeHandler(new L.Draw.Polygon(map, this.options.polygon), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.fpolygon) {
                this._initModeHandler(new L.Draw.fPolygon(map, this.options.fpolygon), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.rectangle) {
                this._initModeHandler(new L.Draw.Rectangle(map, this.options.rectangle), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.circle) {
                this._initModeHandler(new L.Draw.Circle(map, this.options.circle), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.marker) {
                this._initModeHandler(new L.Draw.Marker(map, this.options.marker), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            this._lastButtonIndex = --buttonIndex;
            this._actionsContainer = this._createActions([{
                title: L.drawLocal.draw.toolbar.title,
                text: L.drawLocal.draw.toolbar.text,
                callback: this.disable,
                context: this
            }]);
            container.appendChild(this._toolbarContainer);
            container.appendChild(this._actionsContainer);
            return container;
        },
        setOptions: function (options) {
            L.setOptions(this, options);
            for (var type in this._modes) {
                if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
                    this._modes[type].handler.setOptions(options[type]);
                }
            }
        }
    });
    L.EditToolbar = L.Toolbar.extend({
        options: {
            edit: {
                title: L.drawLocal.edit.toolbar.edit.title,
                selectedPathOptions: {
                    color: "#fe57a1",
                    opacity: .6,
                    dashArray: "10, 10",
                    fill: true,
                    fillColor: "#fe57a1",
                    fillOpacity: .1
                }
            },
            remove: {
                title: L.drawLocal.edit.toolbar.remove.title
            },
            featureGroup: null
        },
        initialize: function (options) {
            for (var type in this.options) {
                if (type != 'featureGroup') {
                    if (this.options.hasOwnProperty(type)) {
                        if (options[type]) {
                            options[type] = L.extend({}, this.options[type], options[type]);
                        }
                    }
                }
            }
            if (options.edit && typeof options.edit.selectedPathOptions === "undefined") {
                options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
            }
            //options.edit = L.extend({}, this.options.edit, options.edit);
            //options.remove = L.extend({}, this.options.remove, options.remove);
            L.Toolbar.prototype.initialize.call(this, options);
            this._selectedFeatureCount = 0;
        },
        addToolbar: function (map) {
            var container = L.DomUtil.create("div", "leaflet-draw-section"), buttonIndex = 0, buttonClassPrefix = "leaflet-draw-edit";
            this._toolbarContainer = L.DomUtil.create("div", "leaflet-draw-toolbar leaflet-bar");
            this._map = map;
            if (this.options.edit) {
                this._initModeHandler(new L.EditToolbar.Edit(map, {
                    featureGroup: this.options.featureGroup,
                    selectedPathOptions: this.options.edit.selectedPathOptions
                }), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            if (this.options.remove) {
                this._initModeHandler(new L.EditToolbar.Delete(map, {
                    featureGroup: this.options.featureGroup
                }), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            }
            this._lastButtonIndex = --buttonIndex;
            this._actionsContainer = this._createActions([{
                title: L.drawLocal.edit.toolbar.edit.save.title,
                text: L.drawLocal.edit.toolbar.edit.save.text,
                callback: this._save,
                context: this
            }, {
                title: L.drawLocal.edit.toolbar.edit.cancel.title,
                text: L.drawLocal.edit.toolbar.edit.cancel.text,
                callback: this.disable,
                context: this
            }]);
            container.appendChild(this._toolbarContainer);
            container.appendChild(this._actionsContainer);
            return container;
        },
        disable: function () {
            if (!this.enabled()) {
                return;
            }
            this._activeMode.handler.revertLayers();
            L.Toolbar.prototype.disable.call(this);
        },
        _save: function () {
            this._activeMode.handler.save();
            this._activeMode.handler.disable();
        },
        setOptions: function (options) {
            L.setOptions(this, options);
            for (var type in this._modes) {
                if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
                    this._modes[type].handler.setOptions(options[type]);
                }
            }
        }
    });
    L.EditToolbar.Edit = L.Handler.extend({
        statics: {
            TYPE: "edit"
        },
        includes: L.Mixin.Events,
        initialize: function (map, options) {
            L.Handler.prototype.initialize.call(this, map);
            this._selectedPathOptions = options.selectedPathOptions;
            this._featureGroup = options.featureGroup;
            //if(this._featureGroup != null){
            //    if (!(this._featureGroup instanceof L.FeatureGroup)) {
            //        throw new Error("options.featureGroup must be a L.FeatureGroup");
            //    }
            //}
            if (!(this._featureGroup instanceof L.FeatureGroup)) {
                throw new Error("options.featureGroup must be a L.FeatureGroup");
            }
            this._uneditedLayerProps = {};
            this.type = L.EditToolbar.Edit.TYPE;
        },
        enable: function () {
            if (this._enabled) {
                return;
            }
            L.Handler.prototype.enable.call(this);
            this._featureGroup.on("layeradd", this._enableLayerEdit, this).on("layerremove", this._disableLayerEdit, this);
            this.fire("enabled", {
                handler: this.type
            });
        },
        disable: function () {
            if (!this._enabled) {
                return;
            }
            this.fire("disabled", {
                handler: this.type
            });
            this._featureGroup.off("layeradd", this._enableLayerEdit, this).off("layerremove", this._disableLayerEdit, this);
            L.Handler.prototype.disable.call(this);
        },
        addHooks: function () {
            if (this._map) {
                this._featureGroup.eachLayer(this._enableLayerEdit, this);
                this._tooltip = new L.Tooltip(this._map);
                this._tooltip.updateContent({
                    text: L.drawLocal.edit.tooltip.text,
                    subtext: L.drawLocal.edit.tooltip.subtext
                });
                this._map.on("mousemove", this._onMouseMove, this);
            }
        },
        removeHooks: function () {
            if (this._map) {
                this._featureGroup.eachLayer(this._disableLayerEdit, this);
                this._uneditedLayerProps = {};
                this._tooltip.dispose();
                this._tooltip = null;
                this._map.off("mousemove", this._onMouseMove, this);
            }
        },
        revertLayers: function () {
            this._featureGroup.eachLayer(function (layer) {
                this._revertLayer(layer);
            }, this);
        },
        save: function () {
            var editedLayers = new L.LayerGroup();
            this._featureGroup.eachLayer(function (layer) {
                if (layer.edited) {
                    editedLayers.addLayer(layer);
                    layer.edited = false;
                }
            });
            this._map.fire("draw:edited", {
                layers: editedLayers
            });
        },
        _backupLayer: function (layer) {
            var id = L.Util.stamp(layer);
            if (!this._uneditedLayerProps[id]) {
                if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                    this._uneditedLayerProps[id] = {
                        latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
                    };
                } else if (layer instanceof L.Circle) {
                    this._uneditedLayerProps[id] = {
                        latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
                        radius: layer.getRadius()
                    };
                } else {
                    this._uneditedLayerProps[id] = {
                        latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
                    };
                }
            }
        },
        _revertLayer: function (layer) {
            var id = L.Util.stamp(layer);
            layer.edited = false;
            if (this._uneditedLayerProps.hasOwnProperty(id)) {
                if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                    layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
                } else if (layer instanceof L.Circle) {
                    layer.setLatLng(this._uneditedLayerProps[id].latlng);
                    layer.setRadius(this._uneditedLayerProps[id].radius);
                } else {
                    layer.setLatLng(this._uneditedLayerProps[id].latlng);
                }
            }
        },
        _toggleMarkerHighlight: function (marker) {
            var icon = marker._icon;
            icon.style.display = "none";
            if (L.DomUtil.hasClass(icon, "leaflet-edit-marker-selected")) {
                L.DomUtil.removeClass(icon, "leaflet-edit-marker-selected");
                this._offsetMarker(icon, -4);
            } else {
                L.DomUtil.addClass(icon, "leaflet-edit-marker-selected");
                this._offsetMarker(icon, 4);
            }
            icon.style.display = "";
        },
        _offsetMarker: function (icon, offset) {
            var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset, iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;
            icon.style.marginTop = iconMarginTop + "px";
            icon.style.marginLeft = iconMarginLeft + "px";
        },
        _enableLayerEdit: function (e) {
            var layer = e.layer || e.target || e, pathOptions;
            this._backupLayer(layer);
            if (this._selectedPathOptions) {
                pathOptions = L.Util.extend({}, this._selectedPathOptions);
                if (layer instanceof L.Marker) {
                    this._toggleMarkerHighlight(layer);
                } else {
                    layer.options.previousOptions = layer.options;
                    if (!(layer instanceof L.Circle) && !(layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
                        pathOptions.fill = false;
                    }
                    layer.setStyle(pathOptions);
                }
            }
            if (layer instanceof L.Marker) {
                layer.dragging.enable();
                layer.on("dragend", this._onMarkerDragEnd);
            } else {
                layer.editing.enable();
            }
        },
        _disableLayerEdit: function (e) {
            var layer = e.layer || e.target || e;
            layer.edited = false;
            if (this._selectedPathOptions) {
                if (layer instanceof L.Marker) {
                    this._toggleMarkerHighlight(layer);
                } else {
                    layer.setStyle(layer.options.previousOptions);
                    delete layer.options.previousOptions;
                }
            }
            if (layer instanceof L.Marker) {
                layer.dragging.disable();
                layer.off("dragend", this._onMarkerDragEnd, this);
            } else {
                layer.editing.disable();
            }
        },
        _onMarkerDragEnd: function (e) {
            var layer = e.target;
            layer.edited = true;
        },
        _onMouseMove: function (e) {
            this._tooltip.updatePosition(e.latlng);
        }
    });
    L.EditToolbar.Delete = L.Handler.extend({
        statics: {
            TYPE: "remove"
        },
        includes: L.Mixin.Events,
        initialize: function (map, options) {
            L.Handler.prototype.initialize.call(this, map);
            L.Util.setOptions(this, options);
            this._deletableLayers = this.options.featureGroup;
            //if(this._deletableLayers != null){
            //    if (!(this._featureGroup instanceof L.FeatureGroup)) {
            //        throw new Error("options.featureGroup must be a L.FeatureGroup");
            //    }
            //}
            if (!(this._deletableLayers instanceof L.FeatureGroup)) {
                throw new Error("options.featureGroup must be a L.FeatureGroup");
            }
            this.type = L.EditToolbar.Delete.TYPE;
        },
        enable: function () {
            if (this._enabled) {
                return;
            }
            L.Handler.prototype.enable.call(this);
            this._deletableLayers.on("layeradd", this._enableLayerDelete, this).on("layerremove", this._disableLayerDelete, this);
            this.fire("enabled", {
                handler: this.type
            });
        },
        disable: function () {
            if (!this._enabled) {
                return;
            }
            L.Handler.prototype.disable.call(this);
            this._deletableLayers.off("layeradd", this._enableLayerDelete, this).off("layerremove", this._disableLayerDelete, this);
            this.fire("disabled", {
                handler: this.type
            });
        },
        addHooks: function () {
            if (this._map) {
                this._deletableLayers.eachLayer(this._enableLayerDelete, this);
                this._deletedLayers = new L.layerGroup();
                this._tooltip = new L.Tooltip(this._map);
                this._tooltip.updateContent({
                    text: L.drawLocal.edit.toolbar.remove.tooltip
                });
                this._map.on("mousemove", this._onMouseMove, this);
            }
        },
        removeHooks: function () {
            if (this._map) {
                this._deletableLayers.eachLayer(this._disableLayerDelete, this);
                this._deletedLayers = null;
                this._tooltip.dispose();
                this._tooltip = null;
                this._map.off("mousemove", this._onMouseMove, this);
            }
        },
        revertLayers: function () {
            this._deletedLayers.eachLayer(function (layer) {
                this._deletableLayers.addLayer(layer);
            }, this);
            this._map.fire("draw:delcancle", {
                layer: this
            });
        },
        save: function () {
            this._map.fire("draw:deleted", {
                layers: this._deletedLayers
            });
        },
        _enableLayerDelete: function (e) {
            var layer = e.layer || e.target || e;
            layer.on("click", this._removeLayer, this);
        },
        _disableLayerDelete: function (e) {
            var layer = e.layer || e.target || e;
            layer.off("click", this._removeLayer, this);
            this._deletedLayers.removeLayer(layer);
            this._map.fire("draw:delselected", {
                layer: layer
            });
        },
        _removeLayer: function (e) {
            var layer = e.layer || e.target || e;
            this._deletableLayers.removeLayer(layer);
            this._deletedLayers.addLayer(layer);
        },
        _onMouseMove: function (e) {
            this._tooltip.updatePosition(e.latlng);
        }
    });


    L.StyleForms = L.Class.extend({
        options: {
            currentMarkerStyle: {
                size: 'm',
                color: '48a'
            }
        },

        initialize: function (options) {
            L.setOptions(this, options);
        },

        clearForm: function () {
            this.options.styleEditorUi.innerHTML = '';
        },

        createGeometryForm: function () {
            this.clearForm();

            this.createColor();
            this.createOpacity();
            this.createStroke();

            var t = this.options.currentElement.target;
            if (t instanceof L.Polygon || t instanceof L.LayerGroup) {
                this.createFillColor();
                this.createFillOpacity();
            }
        },

        createMarkerForm: function () {
            this.clearForm();

            this.createIconUrl();
            this.createMarkerColor();
            this.createMarkerSize();
        },

        setNewMarker: function () {
            var markerStyle = this.options.currentMarkerStyle;

            if (markerStyle.size && markerStyle.icon && markerStyle.color) {
                var iconSize;
                switch (markerStyle.size) {
                    case 's':
                        //iconSize = [20, 50];
                        iconSize = [25, 35];
                        break;
                    case 'm':
                        //iconSize = [30, 70];
                        //iconSize = [45, 50];
                        iconSize = [41, 41];
                        break;
                    case 'l':
                        //iconSize = [35, 90];
                        iconSize = [60, 65];
                        break;
                }

                var newIcon = new L.Icon({
                    iconUrl: this.options.markerApi + markerStyle.icon + '.png',
                    //iconUrl: this.options.markerApi + 'pin-' + markerStyle.size + '-' + markerStyle.icon + '+' + markerStyle.color + '.png',
                    iconSize: iconSize
                });
                var currentElement = this.options.currentElement.target;
                currentElement.setIcon(newIcon);
                this.fireChangeEvent(currentElement);
            }
        },

        createIconUrl: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Icon:';

            this.createSelectInput(this.options.styleEditorUi, function (e) {
                var value = e.target.value;
                this.options.currentMarkerStyle.icon = value;
                this.setNewMarker();
            }.bind(this), this.options.markers);
        },

        createMarkerColor: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Color:';

            this.createColorPicker(this.options.styleEditorUi, function (e) {
                var color = this.rgbToHex(e.target.style.backgroundColor);
                this.options.currentMarkerStyle.color = color.replace("#", "");
                this.setNewMarker();
            }.bind(this));
        },

        createMarkerSize: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Size:';

            var s = L.DomUtil.create('div', 'leaflet-styleeditor-sizeicon sizeicon-small', this.options.styleEditorUi);
            var m = L.DomUtil.create('div', 'leaflet-styleeditor-sizeicon sizeicon-medium', this.options.styleEditorUi);
            var l = L.DomUtil.create('div', 'leaflet-styleeditor-sizeicon sizeicon-large', this.options.styleEditorUi);

            L.DomEvent.addListener(s, 'click', function () {
                this.options.currentMarkerStyle.size = 's';
                this.setNewMarker();
            }, this);

            L.DomEvent.addListener(m, 'click', function () {
                this.options.currentMarkerStyle.size = 'm';
                this.setNewMarker();
            }, this);

            L.DomEvent.addListener(l, 'click', function () {
                this.options.currentMarkerStyle.size = 'l';
                this.setNewMarker();
            }, this);
        },

        createColor: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Color:';

            this.createColorPicker(this.options.styleEditorUi, function (e) {
                var color = this.rgbToHex(e.target.style.backgroundColor);
                this.setStyle('color', color);
            }.bind(this));
        },

        createStroke: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Line Stroke:';

            var stroke1 = L.DomUtil.create('div', 'leaflet-styleeditor-stroke', this.options.styleEditorUi);
            stroke1.style.backgroundPosition = "0px -75px";

            var stroke2 = L.DomUtil.create('div', 'leaflet-styleeditor-stroke', this.options.styleEditorUi);
            stroke2.style.backgroundPosition = "0px -95px";

            var stroke3 = L.DomUtil.create('div', 'leaflet-styleeditor-stroke', this.options.styleEditorUi);
            stroke3.style.backgroundPosition = "0px -115px";

            L.DomUtil.create('br', 'bla', this.options.styleEditorUi);

            L.DomEvent.addListener(stroke1, 'click', function (e) {
                this.setStyle('dashArray', '1');
            }, this);
            L.DomEvent.addListener(stroke2, 'click', function (e) {
                this.setStyle('dashArray', '10,10');
            }, this);
            L.DomEvent.addListener(stroke3, 'click', function (e) {
                this.setStyle('dashArray', '15, 10, 1, 10');
            }, this);
        },

        createOpacity: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Opacity:';

            this.createNumberInput(this.options.styleEditorUi, function (e) {
                var value = e.target.value;
                this.setStyle('opacity', value);
            }.bind(this), this.options.currentElement.target.options.opacity, 0, 1, 0.1);
        },

        createFillColor: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Fill Color:';

            this.createColorPicker(this.options.styleEditorUi, function (e) {
                var color = this.rgbToHex(e.target.style.backgroundColor);
                this.setStyle('fillColor', color);
            }.bind(this));
        },

        createFillOpacity: function () {
            var label = L.DomUtil.create('label', 'leaflet-styleeditor-label', this.options.styleEditorUi);
            label.innerHTML = 'Fill Opacity:';

            this.createNumberInput(this.options.styleEditorUi, function (e) {
                var value = e.target.value;
                this.setStyle('fillOpacity', value);
            }.bind(this), this.options.currentElement.target.options.fillOpacity, 0, 1, 0.1);
        },

        createColorPicker: function (parentDiv, callback) {
            var colorPickerDiv = L.DomUtil.create('div', 'leaflet-styleeditor-colorpicker', parentDiv);
            this.options.colorRamp.forEach(function (color) {
                var elem = L.DomUtil.create('div', 'leaflet-styleeditor-color', colorPickerDiv);
                elem.style.backgroundColor = color;

                L.DomEvent.addListener(elem, 'click', function (e) {
                    e.stopPropagation();
                    callback(e);
                });
            }, this);

            L.DomUtil.create('br', '', parentDiv);
            L.DomUtil.create('br', '', parentDiv);

            return colorPickerDiv;
        },

        createNumberInput: function (parentDiv, callback, value, min, max, step) {
            var numberInput = L.DomUtil.create('input', 'leaflet-styleeditor-input', parentDiv);
            numberInput.setAttribute('type', 'number');
            numberInput.setAttribute('value', value);
            numberInput.setAttribute('min', min);
            numberInput.setAttribute('max', max);
            numberInput.setAttribute('step', step);

            L.DomEvent.addListener(numberInput, 'change', function (e) {
                e.stopPropagation();
                callback(e);
            });
            L.DomEvent.addListener(numberInput, 'keyup', function (e) {
                e.stopPropagation();
                callback(e);
            });

            L.DomUtil.create('br', '', parentDiv);
            L.DomUtil.create('br', '', parentDiv);

            return numberInput;
        },

        createSelectInput: function (parentDiv, callback, options) {
            var selectBox = L.DomUtil.create('select', 'leaflet-styleeditor-select', parentDiv);

            options.forEach(function (option) {
                var selectOption = L.DomUtil.create('option', 'leaflet-styleeditor-option', selectBox);
                selectOption.setAttribute('value', option);
                selectOption.innerHTML = option;
            }, this);

            L.DomEvent.addListener(selectBox, 'change', function (e) {
                e.stopPropagation();
                callback(e);
            });

            return selectBox;
        },

        setStyle: function (option, value) {
            var newStyle = {};
            newStyle[option] = value;
            var currentElement = this.options.currentElement.target;
            currentElement.setStyle(newStyle);
            this.fireChangeEvent(currentElement);
        },

        fireChangeEvent: function (element) {
            if (this.options.currentElement.target._map != null) {
                this.options.currentElement.target._map.fireEvent('styleeditor:changed', element);
            } else {
                window.alert('请打开样式编辑器并选择一个编辑对象');
            }
        },

        componentToHex: function (c) {
            var hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        },

        rgbToHex: function (rgb) {
            rgb = rgb.substring(4).replace(")", "").split(",");
            return "#" + this.componentToHex(parseInt(rgb[0], 10)) + this.componentToHex(parseInt(rgb[1], 10)) + this.componentToHex(parseInt(rgb[2], 10));
        }
    });
    L.Control.StyleEditor = L.Control.extend({
        options: {
            position: 'topleft',
            enabled: false,
            colorRamp: ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6', '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'],
            markerApi: 'assets/images/marker/',
            //markers: ['circle-stroked', 'circle', 'square-stroked', 'square', 'triangle-stroked', 'triangle', 'star-stroked', 'star', 'cross', 'marker-stroked', 'marker', 'religious-jewish', 'religious-christian', 'religious-muslim', 'cemetery', 'rocket', 'airport', 'heliport', 'rail', 'rail-metro', 'rail-light', 'bus', 'fuel', 'parking', 'parking-garage', 'airfield', 'roadblock', 'ferry', 'harbor', 'bicycle', 'park', 'park2', 'museum', 'lodging', 'monument', 'zoo', 'garden', 'campsite', 'theatre', 'art-gallery', 'pitch', 'soccer', 'america-football', 'tennis', 'basketball', 'baseball', 'golf', 'swimming', 'cricket', 'skiing', 'school', 'college', 'library', 'post', 'fire-station', 'town-hall', 'police', 'prison', 'embassy', 'beer', 'restaurant', 'cafe', 'shop', 'fast-food', 'bar', 'bank', 'grocery', 'cinema', 'pharmacy', 'hospital', 'danger', 'industrial', 'warehouse', 'commercial', 'building', 'place-of-worship', 'alcohol-shop', 'logging', 'oil-well', 'slaughterhouse', 'dam', 'water', 'wetland', 'disability', 'telephone', 'emergency-telephone', 'toilets', 'waste-basket', 'music', 'land-use', 'city', 'town', 'village', 'farm', 'bakery', 'dog-park', 'lighthouse', 'clothing-store', 'polling-place', 'playground', 'entrance', 'heart', 'london-underground', 'minefield', 'rail-underground', 'rail-above', 'camera', 'laundry', 'car', 'suitcase', 'hairdresser', 'chemist', 'mobilephone', 'scooter'],
            markers: ['默认标记', '宝塔', '公园', '学校', '剧场', '动物园', 'triangle', 'star-stroked', 'star', 'cross', 'marker-stroked', 'marker', 'religious-jewish', 'religious-christian', 'religious-muslim', 'cemetery', 'rocket', 'airport', 'heliport', 'rail', 'rail-metro', 'rail-light', 'bus', 'fuel', 'parking', 'parking-garage', 'airfield', 'roadblock', 'ferry', 'harbor', 'bicycle', 'park', 'park2', 'museum', 'lodging', 'monument', 'zoo', 'garden', 'campsite', 'theatre', 'art-gallery', 'pitch', 'soccer', 'america-football', 'tennis', 'basketball', 'baseball', 'golf', 'swimming', 'cricket', 'skiing', 'school', 'college', 'library', 'post', 'fire-station', 'town-hall', 'police', 'prison', 'embassy', 'beer', 'restaurant', 'cafe', 'shop', 'fast-food', 'bar', 'bank', 'grocery', 'cinema', 'pharmacy', 'hospital', 'danger', 'industrial', 'warehouse', 'commercial', 'building', 'place-of-worship', 'alcohol-shop', 'logging', 'oil-well', 'slaughterhouse', 'dam', 'water', 'wetland', 'disability', 'telephone', 'emergency-telephone', 'toilets', 'waste-basket', 'music', 'land-use', 'city', 'town', 'village', 'farm', 'bakery', 'dog-park', 'lighthouse', 'clothing-store', 'polling-place', 'playground', 'entrance', 'heart', 'london-underground', 'minefield', 'rail-underground', 'rail-above', 'camera', 'laundry', 'car', 'suitcase', 'hairdresser', 'chemist', 'mobilephone', 'scooter'],
            editlayers: [],
            layerGroups: [],
            openOnLeafletDraw: true,
            showTooltip: true,
            strings: {
                tooltip: 'Click on the element you want to style',
                tooltipNext: 'Choose another element you want to style'
            },
            useGrouping: true,
            style: {
                title: L.drawLocal.draw.toolbar.style
            }
        },

        onAdd: function (map) {
            this.options.map = map;
            return this.createUi();
        },

        createUi: function () {
            var controlDiv = this.options.controlDiv = L.DomUtil.create('div', 'leaflet-control-styleeditor');
            var controlUI = this.options.controlUI = L.DomUtil.create('div', 'leaflet-control-styleeditor-interior', controlDiv);
            //controlUI.title = 'Style Editor';
            //controlUI.title = L.drawLocal.draw.toolbar.style;
            //this._tooltip = new L.Tooltip(this._map);
            //this._tooltip.updateContent({
            //    text: L.drawLocal.style.toolbar.style
            //});
            //controlUI.title = L.drawLocal.draw.toolbar.style;
            controlUI.title = this.options.style.title;

            var styleEditorDiv = this.options.styleEditorDiv = L.DomUtil.create('div', 'leaflet-styleeditor', this.options.map._container);
            this.options.styleEditorHeader = L.DomUtil.create('div', 'leaflet-styleeditor-header', styleEditorDiv);
            this.options.styleEditorUi = L.DomUtil.create('div', 'leaflet-styleeditor-interior', styleEditorDiv);

            this.addDomEvents();
            this.addLeafletDrawEvents();
            this.addButtons();

            return controlDiv;
        },

        addDomEvents: function () {
            L.DomEvent.addListener(this.options.controlDiv, 'click', function (e) {
                this.clickHandler(e);
                e.stopPropagation();
            }, this);
            L.DomEvent.addListener(this.options.controlDiv, 'dblclick', function (e) {
                e.stopPropagation();
            }, this);
            L.DomEvent.addListener(this.options.controlDiv, 'mouseover', function (e) {
                //this._tooltip = new L.Tooltip(this._map);
                //this._tooltip.updateContent({
                //    text: L.drawLocal.style.toolbar.style
                //});
            }, this);
            L.DomEvent.addListener(this.options.styleEditorDiv, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.addListener(this.options.styleEditorDiv, 'mouseenter', this.disableLeafletActions, this);
            L.DomEvent.addListener(this.options.styleEditorDiv, 'mouseleave', this.enableLeafletActions, this);
        },

        addLeafletDrawEvents: function () {
            if (!this.options.openOnLeafletDraw) {
                return;
            }
            if (!L.Control.Draw) {
                return;
            }

            this.options.map.on('draw:created', function (layer) {
                this.initChangeStyle({
                    "target": layer.layer
                });
            }, this);

            this.options.map.on('clearSelection', function (layer) {
                this.hideEditor()
            }, this);
        },

        addButtons: function () {
            var nextBtn = L.DomUtil.create('button', 'leaflet-styleeditor-button styleeditor-nextBtn', this.options.styleEditorHeader);
            nextBtn.title = this.options.strings.tooltipNext;

            L.DomEvent.addListener(nextBtn, 'click', function (e) {
                this.hideEditor();
                this.createTooltip();

                e.stopPropagation();
            }, this);
        },

        clickHandler: function (e) {
            this.options.enabled = !this.options.enabled;

            if (this.options.enabled) {
                this.enable();
                this._map.fire("style:editstart", {
                    layer: this._map
                });
            } else {
                L.DomUtil.removeClass(this.options.controlUI, 'enabled');
                this.disable();
                this._map.fire("style:editstop", {
                    layer: this._map
                });
            }
        },

        disableLeafletActions: function () {
            var m = this.options.map;

            m.dragging.disable();
            m.touchZoom.disable();
            m.doubleClickZoom.disable();
            m.scrollWheelZoom.disable();
            m.boxZoom.disable();
            m.keyboard.disable();
        },

        enableLeafletActions: function () {
            var m = this.options.map;

            m.dragging.enable();
            m.touchZoom.enable();
            m.doubleClickZoom.enable();
            m.scrollWheelZoom.enable();
            m.boxZoom.enable();
            m.keyboard.enable();
        },

        enable: function () {
            L.DomUtil.addClass(this.options.controlUI, "enabled");
            this.options.map.eachLayer(this.addEditClickEvents, this);
            this.createTooltip();
        },

        disable: function () {
            this.options.editlayers.forEach(this.removeEditClickEvents, this);
            this.options.editlayers = [];
            this.options.layerGroups = [];
            this.hideEditor();
            this.removeTooltip();
        },

        addEditClickEvents: function (layer) {
            if (this.options.useGrouping && layer instanceof L.LayerGroup) {
                this.options.layerGroups.push(layer);
            } else if (layer instanceof L.Marker || layer instanceof L.Path) {
                var evt = layer.on('click', this.initChangeStyle, this);
                this.options.editlayers.push(evt);
            }
        },

        removeEditClickEvents: function (layer) {
            layer.off('click', this.initChangeStyle, this);
        },

        hideEditor: function () {
            L.DomUtil.removeClass(this.options.styleEditorDiv, 'editor-enabled');
            this._map.fire("style:edithide", {});
        },

        showEditor: function () {
            var editorDiv = this.options.styleEditorDiv;
            if (!L.DomUtil.hasClass(editorDiv, 'editor-enabled')) {
                L.DomUtil.addClass(editorDiv, 'editor-enabled');
            }
        },

        initChangeStyle: function (e) {
            this.options.currentElement = (this.options.useGrouping) ? this.getMatchingElement(e) : e;

            this.showEditor();
            this.removeTooltip();

            var layer = e.target;
            if (layer instanceof L.Marker) {
                // marker
                this.createMarkerForm();
            } else {
                // layer with of type L.GeoJSON or L.Path (polyline, polygon, ...)
                this.createGeometryForm();
            }
        },

        createGeometryForm: function () {
            var styleForms = new L.StyleForms({
                colorRamp: this.options.colorRamp,
                styleEditorUi: this.options.styleEditorUi,
                currentElement: this.options.currentElement
            });

            styleForms.createGeometryForm();
        },

        createMarkerForm: function () {
            var styleForms = new L.StyleForms({
                colorRamp: this.options.colorRamp,
                styleEditorUi: this.options.styleEditorUi,
                currentElement: this.options.currentElement,
                markerApi: this.options.markerApi,
                markers: this.options.markers
            });

            styleForms.createMarkerForm();
        },

        createTooltip: function () {
            if (!this.options.showTooltip) {
                return;
            }

            var tooltipWrapper = L.DomUtil.create('div', 'leaflet-styleeditor-tooltip-wrapper', document.body);
            var tooltip = this.options.tooltip = L.DomUtil.create('div', 'leaflet-styleeditor-tooltip', tooltipWrapper);
            tooltip.innerHTML = this.options.strings.tooltip;
        },

        getMatchingElement: function (e) {
            var group = null,
                layer = e.target;

            for (i = 0; i < this.options.layerGroups.length; ++i) {
                group = this.options.layerGroups[i];
                if (group && layer != group && group.hasLayer(layer)) {
                    // we use the opacity style to check for correct object
                    if (!group.options || !group.options.opacity) {
                        group.options = layer.options;

                        // special handling for layers... we pass the setIcon function
                        if (layer.setIcon) {
                            group.setIcon = function (icon) {
                                group.eachLayer(function (layer) {
                                    if (layer instanceof L.Marker) {
                                        layer.setIcon(icon);
                                    }
                                });
                            };
                        }
                    }

                    return this.getMatchingElement({
                        target: group
                    });
                }
            }

            return e;
        },

        removeTooltip: function () {
            if (this.options.tooltip && this.options.tooltip.parentNode) {
                this.options.tooltip.parentNode.removeChild(this.options.tooltip);
            }
        }
    });
    L.control.styleEditor = function (options) {
        return new L.Control.StyleEditor(options);
    };

    L.labelVersion = '0.2.4';
    L.Label = L.Class.extend({
        includes: L.Mixin.Events,
        options: {
            className: '',
            clickable: false,
            direction: 'right',
            noHide: true,
            offset: [12, -15], // 6 (width of the label triangle) + 6 (padding)
            opacity: 1,
            zoomAnimation: true
        },
        initialize: function (options, source) {
            L.setOptions(this, options);

            this._source = source;
            this._animated = L.Browser.any3d && this.options.zoomAnimation;
            this._isOpen = false;
        },
        onAdd: function (map) {
            this._map = map;
            this._pane = this.options.pane ? map._panes[this.options.pane] :
                this._source instanceof L.Marker ? map._panes.markerPane : map._panes.popupPane;
            if (!this._container) {
                this._initLayout();
            }
            this._pane.appendChild(this._container);
            this._initInteraction();
            this._update();
            this.setOpacity(this.options.opacity);
            map
                .on('moveend', this._onMoveEnd, this)
                .on('viewreset', this._onViewReset, this);
            if (this._animated) {
                map.on('zoomanim', this._zoomAnimation, this);
            }
            if (L.Browser.touch && !this.options.noHide) {
                L.DomEvent.on(this._container, 'click', this.close, this);
                map.on('click', this.close, this);
            }
        },
        onRemove: function (map) {
            this._pane.removeChild(this._container);
            map.off({
                zoomanim: this._zoomAnimation,
                moveend: this._onMoveEnd,
                viewreset: this._onViewReset
            }, this);
            this._removeInteraction();
            this._map = null;
        },
        setLatLng: function (latlng) {
            this._latlng = L.latLng(latlng);
            if (this._map) {
                this._updatePosition();
            }
            return this;
        },
        setContent: function (content) {
            this._previousContent = this._content;
            this._content = content;
            this._updateContent();
            return this;
        },
        close: function () {
            var map = this._map;
            if (map) {
                if (L.Browser.touch && !this.options.noHide) {
                    L.DomEvent.off(this._container, 'click', this.close);
                    map.off('click', this.close, this);
                }
                map.removeLayer(this);
            }
        },
        updateZIndex: function (zIndex) {
            this._zIndex = zIndex;
            if (this._container && this._zIndex) {
                this._container.style.zIndex = zIndex;
            }
        },
        setOpacity: function (opacity) {
            this.options.opacity = opacity;
            if (this._container) {
                L.DomUtil.setOpacity(this._container, opacity);
            }
        },
        _initLayout: function () {
            this._container = L.DomUtil.create('div', 'leaflet-label ' + this.options.className + ' leaflet-zoom-animated');
            this.updateZIndex(this._zIndex);
        },
        _update: function () {
            if (!this._map) {
                return;
            }
            this._container.style.visibility = 'hidden';
            this._updateContent();
            this._updatePosition();
            this._container.style.visibility = '';
        },
        _updateContent: function () {
            if (!this._content || !this._map || this._prevContent === this._content) {
                return;
            }
            if (typeof this._content === 'string') {
                this._container.innerHTML = this._content;
                this._prevContent = this._content;
                this._labelWidth = this._container.offsetWidth;
            }
        },
        _updatePosition: function () {
            var pos = this._map.latLngToLayerPoint(this._latlng);
            this._setPosition(pos);
        },
        _setPosition: function (pos) {
            var map = this._map,
                container = this._container,
                centerPoint = map.latLngToContainerPoint(map.getCenter()),
                labelPoint = map.layerPointToContainerPoint(pos),
                direction = this.options.direction,
                labelWidth = this._labelWidth,
                offset = L.point(this.options.offset);
            // position to the right (right or auto & needs to)
            if (direction === 'right' || direction === 'auto' && labelPoint.x < centerPoint.x) {
                L.DomUtil.addClass(container, 'leaflet-label-right');
                L.DomUtil.removeClass(container, 'leaflet-label-left');
                pos = pos.add(offset);
            } else { // position to the left
                L.DomUtil.addClass(container, 'leaflet-label-left');
                L.DomUtil.removeClass(container, 'leaflet-label-right');
                pos = pos.add(L.point(-offset.x - labelWidth, offset.y));
            }
            L.DomUtil.setPosition(container, pos);
        },
        _zoomAnimation: function (opt) {
            var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
            this._setPosition(pos);
        },
        _onMoveEnd: function () {
            if (!this._animated || this.options.direction === 'auto') {
                this._updatePosition();
            }
        },
        _onViewReset: function (e) {
            /* if map resets hard, we must update the label */
            if (e && e.hard) {
                this._update();
            }
        },
        _initInteraction: function () {
            if (!this.options.clickable) {
                return;
            }
            var container = this._container,
                events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];
            L.DomUtil.addClass(container, 'leaflet-clickable');
            L.DomEvent.on(container, 'click', this._onMouseClick, this);
            for (var i = 0; i < events.length; i++) {
                L.DomEvent.on(container, events[i], this._fireMouseEvent, this);
            }
        },
        _removeInteraction: function () {
            if (!this.options.clickable) {
                return;
            }
            var container = this._container,
                events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];
            L.DomUtil.removeClass(container, 'leaflet-clickable');
            L.DomEvent.off(container, 'click', this._onMouseClick, this);
            for (var i = 0; i < events.length; i++) {
                L.DomEvent.off(container, events[i], this._fireMouseEvent, this);
            }
        },
        _onMouseClick: function (e) {
            if (this.hasEventListeners(e.type)) {
                L.DomEvent.stopPropagation(e);
            }
            this.fire(e.type, {
                originalEvent: e
            });
        },
        _fireMouseEvent: function (e) {
            this.fire(e.type, {
                originalEvent: e
            });
            if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
                L.DomEvent.preventDefault(e);
            }
            if (e.type !== 'mousedown') {
                L.DomEvent.stopPropagation(e);
            } else {
                L.DomEvent.preventDefault(e);
            }
        }
    });
    L.LabelUtil = {
        showLabel: function () {
            if (this.label && this._map) {
                this.label.setLatLng(this._latlng);
                this._map.showLabel(this.label);
            }
            return this;
        },
        hideLabel: function () {
            if (this.label) {
                this.label.close();
            }
            return this;
        },
        setLabelNoHide: function (noHide) {
            if (this._labelNoHide === noHide) {
                return;
            }
            this._labelNoHide = noHide;
            if (noHide) {
                this._removeLabelRevealHandlers();
                this.showLabel();
            } else {
                this._addLabelRevealHandlers();
                this.hideLabel();
            }
        },
        bindLabel: function (content, options) {
            var labelAnchor = this.options.icon ? this.options.icon.options.labelAnchor : this.options.labelAnchor,
                anchor = L.point(labelAnchor) || L.point(0, 0);
            anchor = anchor.add(L.Label.prototype.options.offset);
            if (options && options.offset) {
                anchor = anchor.add(options.offset);
            }
            options = L.Util.extend({offset: anchor}, options);
            this._labelNoHide = options.noHide;
            if (!this.label) {
                if (!this._labelNoHide) {
                    this._addLabelRevealHandlers();
                }
                this
                    .on('remove', this.hideLabel, this)
                    .on('move', this._moveLabel, this)
                    .on('add', this._onMarkerAdd, this);

                this._hasLabelHandlers = true;
            }
            this.label = new L.Label(options, this)
                .setContent(content);
            return this;
        },
        unbindLabel: function () {
            if (this.label) {
                this.hideLabel();
                this.label = null;
                if (this._hasLabelHandlers) {
                    if (!this._labelNoHide) {
                        this._removeLabelRevealHandlers();
                    }
                    this
                        .off('remove', this.hideLabel, this)
                        .off('move', this._moveLabel, this)
                        .off('add', this._onMarkerAdd, this);
                }
                this._hasLabelHandlers = false;
            }
            return this;
        },
        updateLabelContent: function (content) {
            if (this.label) {
                this.label.setContent(content);
            }
        },
        getLabel: function () {
            return this.label;
        },
        _onMarkerAdd: function () {
            if (this._labelNoHide) {
                this.showLabel();
            }
        },
        _addLabelRevealHandlers: function () {
            this
                .on('mouseover', this.showLabel, this)
                .on('mouseout', this.hideLabel, this);

            if (L.Browser.touch) {
                this.on('click', this.showLabel, this);
            }
        },
        _removeLabelRevealHandlers: function () {
            this
                .off('mouseover', this.showLabel, this)
                .off('mouseout', this.hideLabel, this);
            if (L.Browser.touch) {
                this.off('click', this.showLabel, this);
            }
        },
        _moveLabel: function (e) {
            this.label.setLatLng(e.latlng);
        }
    };
    L.Marker.include(L.LabelUtil);
    L.CircleMarker.mergeOptions({
        labelAnchor: new L.Point(0, 0)
    });
    L.CircleMarker.include(L.LabelUtil);
    L.Path.include({
        bindLabel: function (content, options) {
            if (!this.label || this.label.options !== options) {
                this.label = new L.Label(options, this);
            }

            this.label.setContent(content);

            if (!this._showLabelAdded) {
                this
                    .on('mouseover', this._showLabel, this)
                    .on('mousemove', this._moveLabel, this)
                    .on('mouseout remove', this._hideLabel, this);

                if (L.Browser.touch) {
                    this.on('click', this._showLabel, this);
                }
                this._showLabelAdded = true;
            }

            return this;
        },

        unbindLabel: function () {
            if (this.label) {
                this._hideLabel();
                this.label = null;
                this._showLabelAdded = false;
                this
                    .off('mouseover', this._showLabel, this)
                    .off('mousemove', this._moveLabel, this)
                    .off('mouseout remove', this._hideLabel, this);
            }
            return this;
        },

        updateLabelContent: function (content) {
            if (this.label) {
                this.label.setContent(content);
            }
        },

        _showLabel: function (e) {
            this.label.setLatLng(e.latlng);
            this._map.showLabel(this.label);
        },

        _moveLabel: function (e) {
            this.label.setLatLng(e.latlng);
        },

        _hideLabel: function () {
            this.label.close();
        }
    });
    L.Map.include({
        showLabel: function (label) {
            return this.addLayer(label);
        }
    });
    L.FeatureGroup.include({
        clearLayers: function () {
            this.unbindLabel();
            this.eachLayer(this.removeLayer, this);
            return this;
        },
        bindLabel: function (content, options) {
            return this.invoke('bindLabel', content, options);
        },
        unbindLabel: function () {
            return this.invoke('unbindLabel');
        },
        updateLabelContent: function (content) {
            this.invoke('updateLabelContent', content);
        }
    });


    "use strict";
    if (L.Browser.svg) {
        L.Path.include({
            _resetTransform: function () {
                this._container.setAttributeNS(null, 'transform', '');
            },
            _applyTransform: function (matrix) {
                this._container.setAttributeNS(null, "transform",
                    'matrix(' + matrix.join(' ') + ')');
            }
        });
    } else {
        L.Path.include({

            /**
             * Reset transform matrix
             */
            _resetTransform: function () {
                if (this._skew) {
                    // super important! workaround for a 'jumping' glitch:
                    // disable transform before removing it
                    this._skew.on = false;
                    this._container.removeChild(this._skew);
                    this._skew = null;
                }
            },

            /**
             * Applies matrix transformation to VML
             * @param {Array.<Number>} matrix
             */
            _applyTransform: function (matrix) {
                var skew = this._skew;

                if (!skew) {
                    skew = this._createElement('skew');
                    this._container.appendChild(skew);
                    skew.style.behavior = 'url(#default#VML)';
                    this._skew = skew;
                }

                // handle skew/translate separately, cause it's broken
                var mt = matrix[0].toFixed(8) + " " + matrix[1].toFixed(8) + " " +
                    matrix[2].toFixed(8) + " " + matrix[3].toFixed(8) + " 0 0";
                var offset = Math.floor(matrix[4]).toFixed() + ", " +
                    Math.floor(matrix[5]).toFixed() + "";

                var s = this._container.style;
                var l = parseFloat(s.left);
                var t = parseFloat(s.top);
                var w = parseFloat(s.width);
                var h = parseFloat(s.height);

                if (isNaN(l)) l = 0;
                if (isNaN(t)) t = 0;
                if (isNaN(w) || !w) w = 1;
                if (isNaN(h) || !h) h = 1;

                var origin = (-l / w - 0.5).toFixed(8) + " " + (-t / h - 0.5).toFixed(8);

                skew.on = "f";
                skew.matrix = mt;
                skew.origin = origin;
                skew.offset = offset;
                skew.on = true;
            }

        });
    }
    L.Path.include({
        _onMouseClick: function (e) {
            if ((this.dragging && this.dragging.moved()) ||
                (this._map.dragging && this._map.dragging.moved())) {
                return;
            }
            this._fireMouseEvent(e);
        }
    });
    "use strict";
    L.Handler.PathDrag = L.Handler.extend({
        statics: {
            DRAGGABLE_CLS: 'leaflet-path-draggable'
        },
        initialize: function (path) {
            this._path = path;
            this._matrix = null;
            this._startPoint = null;
            this._dragStartPoint = null;
            this._dragInProgress = false;
            this._dragMoved = false;
        },
        addHooks: function () {
            var className = L.Handler.PathDrag.DRAGGABLE_CLS;
            var path = this._path._path;
            this._path.on('mousedown', this._onDragStart, this);
            this._path.options.className =
                (this._path.options.className || '') + ' ' + className;
            if (!L.Path.CANVAS && path) {
                L.DomUtil.addClass(path, className);
            }
        },
        removeHooks: function () {
            var className = L.Handler.PathDrag.DRAGGABLE_CLS;
            var path = this._path._path;
            this._path.off('mousedown', this._onDragStart, this);
            this._path.options.className =
                (this._path.options.className || '').replace(className, '');

            if (!L.Path.CANVAS && path) {
                L.DomUtil.removeClass(path, className);
            }
            this._dragMoved = false;
        },
        moved: function () {
            return this._dragMoved;
        },
        inProgress: function () {
            return this._dragInProgress;
        },
        _onDragStart: function (evt) {
            this._dragInProgress = true;
            this._startPoint = evt.containerPoint.clone();
            this._dragStartPoint = evt.containerPoint.clone();
            this._matrix = [1, 0, 0, 1, 0, 0];
            if (this._path._point) {
                this._point = this._path._point.clone();
            }
            this._path._map
                .on('mousemove', this._onDrag, this)
                .on('mouseup', this._onDragEnd, this)
            this._dragMoved = false;
            this._replaceCoordGetters();
        },
        _onDrag: function (evt) {
            var x = evt.containerPoint.x;
            var y = evt.containerPoint.y;
            var matrix = this._matrix;
            var path = this._path;
            var startPoint = this._startPoint;
            var dx = x - startPoint.x;
            var dy = y - startPoint.y;
            if (!this._dragMoved && (dx || dy)) {
                this._dragMoved = true;
                path.fire('dragstart');

                if (path._popup) {
                    path._popup._close();
                    path.off('click', path._openPopup, path);
                }
            }
            matrix[4] += dx;
            matrix[5] += dy;
            startPoint.x = x;
            startPoint.y = y;
            path._applyTransform(matrix);
            if (path._point) { // L.Circle, L.CircleMarker
                path._point.x = this._point.x + matrix[4];
                path._point.y = this._point.y + matrix[5];
            }
            path.fire('drag');
            L.DomEvent.stop(evt.originalEvent);
        },
        _onDragEnd: function (evt) {
            L.DomEvent.stop(evt);
            L.DomEvent._fakeStop({type: 'click'});
            this._dragInProgress = false;
            this._path._resetTransform();
            this._transformPoints(this._matrix);
            this._path._map
                .off('mousemove', this._onDrag, this)
                .off('mouseup', this._onDragEnd, this);
            this._restoreCoordGetters();
            this._path.fire('dragend', {
                distance: Math.sqrt(
                    L.LineUtil._sqDist(this._dragStartPoint, evt.containerPoint)
                )
            });
            if (this._path._popup) {
                L.Util.requestAnimFrame(function () {
                    this._path.on('click', this._path._openPopup, this._path);
                }, this);
            }
            this._matrix = null;
            this._startPoint = null;
            this._point = null;
            this._dragStartPoint = null;
        },
        _transformPoint: function (point, matrix) {
            var path = this._path;
            var px = L.point(matrix[4], matrix[5]);
            var crs = path._map.options.crs;
            var transformation = crs.transformation;
            var scale = crs.scale(path._map.getZoom());
            var projection = crs.projection;
            var diff = transformation.untransform(px, scale)
                .subtract(transformation.untransform(L.point(0, 0), scale));

            return projection.unproject(projection.project(point)._add(diff));
        },
        _transformPoints: function (matrix) {
            var path = this._path;
            var i, len, latlng;

            var px = L.point(matrix[4], matrix[5]);

            var crs = path._map.options.crs;
            var transformation = crs.transformation;
            var scale = crs.scale(path._map.getZoom());
            var projection = crs.projection;

            var diff = transformation.untransform(px, scale)
                .subtract(transformation.untransform(L.point(0, 0), scale));
            if (path._point) { // L.Circle
                path._latlng = projection.unproject(
                    projection.project(path._latlng)._add(diff));
                path._point = this._point._add(px);
            } else if (path._originalPoints) { // everything else
                for (i = 0, len = path._originalPoints.length; i < len; i++) {
                    latlng = path._latlngs[i];
                    path._latlngs[i] = projection
                        .unproject(projection.project(latlng)._add(diff));
                    path._originalPoints[i]._add(px);
                }
            }
            if (path._holes) {
                for (i = 0, len = path._holes.length; i < len; i++) {
                    for (var j = 0, len2 = path._holes[i].length; j < len2; j++) {
                        latlng = path._holes[i][j];
                        path._holes[i][j] = projection
                            .unproject(projection.project(latlng)._add(diff));
                        path._holePoints[i][j]._add(px);
                    }
                }
            }
            path._updatePath();
        },
        _replaceCoordGetters: function () {
            if (this._path.getLatLng) { // Circle, CircleMarker
                this._path.getLatLng_ = this._path.getLatLng;
                this._path.getLatLng = L.Util.bind(function () {
                    return this.dragging._transformPoint(this._latlng, this.dragging._matrix);
                }, this._path);
            } else if (this._path.getLatLngs) {
                this._path.getLatLngs_ = this._path.getLatLngs;
                this._path.getLatLngs = L.Util.bind(function () {
                    var matrix = this.dragging._matrix;
                    var points = this._latlngs;
                    for (var i = 0, len = points.length; i < len; i++) {
                        points[i] = this.dragging._transformPoint(points[i], matrix);
                    }
                    return points;
                }, this._path);
            }
        },
        _restoreCoordGetters: function () {
            if (this._path.getLatLng_) {
                this._path.getLatLng = this._path.getLatLng_;
                delete this._path.getLatLng_;
            } else if (this._path.getLatLngs_) {
                this._path.getLatLngs = this._path.getLatLngs_;
                delete this._path.getLatLngs_;
            }
        }

    });
    L.Path.addInitHook(function () {
        if (this.options.draggable) {
            if (this.dragging) {
                this.dragging.enable();
            } else {
                this.dragging = new L.Handler.PathDrag(this);
                this.dragging.enable();
            }
        } else if (this.dragging) {
            this.dragging.disable();
        }
    });
    (function () {
        L.FeatureGroup.EVENTS += ' dragstart';
        function wrapMethod(klasses, methodName, method) {
            for (var i = 0, len = klasses.length; i < len; i++) {
                var klass = klasses[i];
                klass.prototype['_' + methodName] = klass.prototype[methodName];
                klass.prototype[methodName] = method;
            }
        }

        function addLayer(layer) {
            if (this.hasLayer(layer)) {
                return this;
            }
            layer
                .on('drag', this._onDrag, this)
                .on('dragend', this._onDragEnd, this);
            return this._addLayer.call(this, layer);
        }

        function removeLayer(layer) {
            if (!this.hasLayer(layer)) {
                return this;
            }
            layer
                .off('drag', this._onDrag, this)
                .off('dragend', this._onDragEnd, this);
            return this._removeLayer.call(this, layer);
        }

        wrapMethod([L.MultiPolygon, L.MultiPolyline], 'addLayer', addLayer);
        wrapMethod([L.MultiPolygon, L.MultiPolyline], 'removeLayer', removeLayer);
        var dragMethods = {
            _onDrag: function (evt) {
                var layer = evt.target;
                this.eachLayer(function (otherLayer) {
                    if (otherLayer !== layer) {
                        otherLayer._applyTransform(layer.dragging._matrix);
                    }
                });
                this._propagateEvent(evt);
            },
            _onDragEnd: function (evt) {
                var layer = evt.target;
                this.eachLayer(function (otherLayer) {
                    if (otherLayer !== layer) {
                        otherLayer._resetTransform();
                        otherLayer.dragging._transformPoints(layer.dragging._matrix);
                    }
                });
                this._propagateEvent(evt);
            }
        };
        L.MultiPolygon.include(dragMethods);
        L.MultiPolyline.include(dragMethods);

    })();
    L.Polygon.include(L.Polygon.prototype.getCenter ? {} : {
        getCenter: function () {
            var i, j, len, p1, p2, f, area, x, y;
            var points = this._originalPoints;
            area = x = y = 0;
            for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
                p1 = points[i];
                p2 = points[j];

                f = p1.y * p2.x - p2.y * p1.x;
                x += (p1.x + p2.x) * f;
                y += (p1.y + p2.y) * f;
                area += f * 3;
            }
            return this._map.layerPointToLatLng([x / area, y / area]);
        }
    });
    L.EditToolbar.Edit.MOVE_MARKERS = false;
    L.EditToolbar.Edit.include({
        initialize: function (map, options) {
            L.EditToolbar.Edit.MOVE_MARKERS = !!options.selectedPathOptions.moveMarkers;
            this._initialize(map, options);
        },
        _initialize: L.EditToolbar.Edit.prototype.initialize

    });
    L.Edit.SimpleShape.include({
        _updateMoveMarker: function () {
            if (this._moveMarker) {
                this._moveMarker.setLatLng(this._getShapeCenter());
            }
        },
        _getShapeCenter: function () {
            return this._shape.getBounds().getCenter();
        },
        _createMoveMarker: function () {
            if (L.EditToolbar.Edit.MOVE_MARKERS) {
                this._moveMarker = this._createMarker(this._getShapeCenter(), this.options.moveIcon);
            }
        }
    });
    L.Edit.SimpleShape.mergeOptions({
        moveMarker: false
    });
    L.Edit.Circle.include({
        addHooks: function () {
            if (this._shape._map) {
                this._map = this._shape._map;
                if (!this._markerGroup) {
                    this._enableDragging();
                    this._initMarkers();
                }
                this._shape._map.addLayer(this._markerGroup);
            }
        },
        removeHooks: function () {
            if (this._shape._map) {
                for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
                    this._unbindMarker(this._resizeMarkers[i]);
                }
                this._disableDragging();
                this._resizeMarkers = null;
                this._map.removeLayer(this._markerGroup);
                delete this._markerGroup;
            }
            this._map = null;
        },
        _createMoveMarker: L.Edit.SimpleShape.prototype._createMoveMarker,
        _resize: function (latlng) {
            var center = this._shape.getLatLng();
            var radius = center.distanceTo(latlng);
            this._shape.setRadius(radius);
            this._updateMoveMarker();
            this._map.fire('draw:editresize', {layer: this._shape});
        },
        _enableDragging: function () {
            if (!this._shape.dragging) {
                this._shape.dragging = new L.Handler.PathDrag(this._shape);
            }
            this._shape.dragging.enable();
            this._shape
                .on('dragstart', this._onStartDragFeature, this)
                .on('dragend', this._onStopDragFeature, this);
        },
        _disableDragging: function () {
            this._shape.dragging.disable();
            this._shape
                .off('dragstart', this._onStartDragFeature, this)
                .off('dragend', this._onStopDragFeature, this);
        },
        _onStartDragFeature: function () {
            this._shape._map.removeLayer(this._markerGroup);
            this._shape.fire('editstart');
        },
        _onStopDragFeature: function () {
            var center = this._shape.getLatLng();
            this._resizeMarkers[0].setLatLng(this._getResizeMarkerPoint(center));
            this._shape._map.addLayer(this._markerGroup);
            this._updateMoveMarker();
            this._fireEdit();
        }
    });
    L.Edit.Poly.include(/** @lends L.Edit.Poly.prototype */ {
        __createMarker: L.Edit.Poly.prototype._createMarker,
        __removeMarker: L.Edit.Poly.prototype._removeMarker,
        addHooks: function () {
            if (this._poly._map) {
                if (!this._markerGroup) {
                    this._enableDragging();
                    this._initMarkers();
                    // Create center marker
                    this._createMoveMarker();
                }
                this._poly._map.addLayer(this._markerGroup);
            }
        },
        _createMoveMarker: function () {
            if (L.EditToolbar.Edit.MOVE_MARKERS && (this._poly instanceof L.Polygon)) {
                this._moveMarker = new L.Marker(this._getShapeCenter(), {
                    icon: this.options.moveIcon
                });
                this._moveMarker.on('mousedown', this._delegateToShape, this);
                this._markerGroup.addLayer(this._moveMarker);
            }
        },
        _delegateToShape: function (evt) {
            var poly = this._shape || this._poly;
            var marker = evt.target;
            poly.fire('mousedown', L.Util.extend(evt, {
                containerPoint: L.DomUtil.getPosition(marker._icon)
                    .add(poly._map._getMapPanePos())
            }));
        },
        _getShapeCenter: function () {
            return this._poly.getCenter();
        },
        removeHooks: function () {
            if (this._poly._map) {
                this._poly._map.removeLayer(this._markerGroup);
                this._disableDragging();
                delete this._markerGroup;
                delete this._markers;
            }
        },
        _enableDragging: function () {
            if (!this._poly.dragging) {
                this._poly.dragging = new L.Handler.PathDrag(this._poly);
            }
            this._poly.dragging.enable();
            this._poly
                .on('dragstart', this._onStartDragFeature, this)
                .on('dragend', this._onStopDragFeature, this);
        },
        _disableDragging: function () {
            this._poly.dragging.disable();
            this._poly
                .off('dragstart', this._onStartDragFeature, this)
                .off('dragend', this._onStopDragFeature, this);
        },
        _onStartDragFeature: function (evt) {
            this._poly._map.removeLayer(this._markerGroup);
            this._poly.fire('editstart');
        },
        _onStopDragFeature: function (evt) {
            var polygon = this._poly;
            for (var i = 0, len = polygon._latlngs.length; i < len; i++) {
                var marker = this._markers[i];
                marker.setLatLng(polygon._latlngs[i]);
                marker._origLatLng = polygon._latlngs[i];
                if (marker._middleLeft) {
                    marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
                }
                if (marker._middleRight) {
                    marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
                }
            }
            this._poly._map.addLayer(this._markerGroup);
            L.Edit.SimpleShape.prototype._updateMoveMarker.call(this);
            this._fireEdit();
        },
        _updateMoveMarker: L.Edit.SimpleShape.prototype._updateMoveMarker,
        _createMarker: function (latlng, index) {
            var marker = this.__createMarker(latlng, index);
            marker
                .on('dragstart', this._hideMoveMarker, this)
                .on('dragend', this._showUpdateMoveMarker, this);
            return marker;
        },
        _removeMarker: function (marker) {
            this.__removeMarker(marker);
            marker
                .off('dragstart', this._hideMoveMarker, this)
                .off('dragend', this._showUpdateMoveMarker, this);
        },
        _hideMoveMarker: function () {
            if (this._moveMarker) {
                this._markerGroup.removeLayer(this._moveMarker);
            }
        },
        _showUpdateMoveMarker: function () {
            if (this._moveMarker) {
                this._markerGroup.addLayer(this._moveMarker);
                this._updateMoveMarker();
            }
        }

    });
    L.Edit.Poly.prototype.options.moveIcon = new L.DivIcon({
        iconSize: new L.Point(8, 8),
        className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
    });
    L.Edit.Poly.mergeOptions({
        moveMarker: false
    });

})(this, document);

L._Higis = L.Map.extend({
    _lastZIndex: 1,
    removeHigisLayer: function (layer) {
        this.higisLayers.removeLayer(layer);
    },
    addGeoJsonLayer: function (geoJson, latlng) {
        return this.higisLayers.addGeoJsonLayer(geoJson, latlng);
    },
    fitBounds: function (bounds, options) {
        options = options || {};
        bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);
        var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]);
        var paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]);
        var zoom = options.zoom;
        if (zoom == null) {
            zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
        }
        var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2);
        var swPoint = this.project(bounds.getSouthWest(), zoom);
        var nePoint = this.project(bounds.getNorthEast(), zoom);
        var center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
        return this.setView(center, zoom, options);
    },
    getLastZIndex: function () {
        this._lastZIndex++;
        return this._lastZIndex;
    },
    addHigisLayer: function (geodata) {
        if (geodata.display == null) {
            geodata.display = true;
        }
        var minx = geodata.domain_minx;
        var miny = geodata.domain_miny;
        var maxx = geodata.domain_maxx;
        var maxy = geodata.domain_maxy;
        if (minx < -180) {
            minx = -180;
        }
        if (miny < -90) {
            miny = -90;
        }
        if (maxx > 180) {
            maxx = 180;
        }
        if (maxy > 90) {
            maxy = 90;
        }
        if (!geodata.isBaseLayer) {
            geodata.isBaseLayer = false;
        }
        if (geodata.app_type == 6) {
            var _hipo = this.options.higis.hipo.baseUrl;
            var options = {
                app_id: geodata.app_id,
                resolution: geodata.resolution,
                steps: geodata.steps,
                animationDuration: geodata.animationDuration,
                xmax: geodata.domain_maxx,
                xmin: geodata.domain_minx,
                ymax: geodata.domain_maxy,
                ymin: geodata.domain_miny,
                start_time: geodata.start_time,
                stop_time: geodata.stop_time,
                max: new Date(geodata.stop_time).getTime(),
                min: new Date(geodata.start_time).getTime(),
                provider: "sql_api",
                user: "na",
                column: "time",
                countby: "count(ogc_fid)",
                maxZoom: this.options.higis.hiart.maxZoom,
                getTileUrl: function (coord, callback) {
                    var params = {
                        cube_unit: "",
                        x: coord.x,
                        y: coord.y,
                        zoom: coord.zoom,
                        starttime: this.start_time,
                        stoptime: this.stop_time,
                        steps: this.steps,
                        resolution: this.resolution,
                        app_id: this.app_id
                    };
                    $.ajax({
                        url: _hipo + "/cube",
                        type: "post",
                        data: params,
                        dataType: "json",
                        success: callback
                    });
                }
            };
            var torqueLayer = new L.TorqueLayer(options);
            torqueLayer.setCartoCSS(geodata.cartocss);
            torqueLayer.geodata = geodata;
            torqueLayer.bounds = new L.LatLngBounds(new L.LatLng(miny, minx), new L.LatLng(maxy, maxx));
            this.higisLayers.addLayer(torqueLayer);
            torqueLayer.play();
            torqueLayer.setZIndex = function (index) {
                this.options.zIndex = index;
            };
            torqueLayer.setZIndex(this.getLastZIndex());
            return torqueLayer;
        } else {
            var uri = "";
            if (geodata.isBaseLayer) {
                if (geodata.app_id == null) {
                    uri = geodata.uri;
                } else {
                    uri = this.options.higis.hiart.baseUrl + geodata.app_id;
                }
            } else {
                if (geodata.app_id == null) {
                    return null;
                } else {
                    uri = this.options.higis.hiart.baseUrl + geodata.app_id;
                }
            }
            var tileLayer = L.higisTileLayer(uri + "/{z}/{x}/{y}.png", {
                maxZoom: this.options.higis.hiart.maxZoom
            });
            tileLayer.setZIndex(this._lastZIndex++);
            tileLayer.uri = uri;
            tileLayer.geodata = geodata;
            tileLayer.bounds = new L.LatLngBounds(new L.LatLng(miny, minx), new L.LatLng(maxy, maxx));
            tileLayer.allBounds = [];
            for (var zoom = 0; zoom <= this.options.higis.hiart.maxZoom; zoom++) {
                var nePoint = this.project(tileLayer.bounds.getNorthEast(), zoom);
                var swPoint = this.project(tileLayer.bounds.getSouthWest(), zoom);
                var tileSize = tileLayer.options.tileSize;
                var nwTilePoint = new L.Point(Math.floor(swPoint.x / tileSize), Math.floor(swPoint.y / tileSize));
                var seTilePoint = new L.Point(Math.floor(nePoint.x / tileSize), Math.floor(nePoint.y / tileSize));
                tileLayer.allBounds[zoom] = new L.Bounds(nwTilePoint, seTilePoint);
            }
            if (geodata.isBaseLayer) {
                if (this.baseLayer) {
                    if (tileLayer.uri !== this.baseLayer.uri) {
                        this.removeLayer(this.baseLayer);
                        L.Util.setOptions(tileLayer, {
                            zIndex: 0
                        });
                        this.baseLayer = tileLayer;
                        this.higisLayers.addLayer(this.baseLayer);
                    } else {
                        return this.baseLayer;
                    }
                } else {
                    L.Util.setOptions(tileLayer, {
                        zIndex: 0
                    });
                    this.baseLayer = tileLayer;
                    this.higisLayers.addLayer(this.baseLayer);
                }
            } else {
                this.higisLayers.addLayer(tileLayer);
            }
            return tileLayer;
        }
    }
});

L.higis = function (id, options) {
    var _options = {
        higis: {
            hipo: {
//                baseUrl: "http://202.197.18.63:80/hipo/"
                baseUrl: "http://202.197.18.63/hipo3/"
            },
            hiart: {
//                baseUrl: "http://202.197.18.63:80/hiart/",
//                baseMap: "http://202.197.18.63:80/hiart/3/",
                baseUrl: "http://202.197.18.63/hiart/",
                baseMap: "http://202.197.18.63/hiart/3/",
                maxZoom: 18
            }
        }
    };
    $.extend(true, _options, options);
    //if (options && options.higis) {
    //    L.Util.extend(_options.higis, options.higis);
    //}
    var map = new L._Higis(id, _options);
    var zoomObj = $('<a href="#" class="zoom" title="Zoom level"></a>');
    zoomObj.on("dblclick", function (e) {
        e.stopPropagation();
    });
    var puss = $(".leaflet-control-zoom.leaflet-bar.leaflet-control", map.getContainer());
    zoomObj.appendTo(puss);
    zoomObj.text(map.getZoom());
    map.on("zoomend", function () {
        zoomObj.text(map.getZoom());
    });
    map.higisLayers = new L.higisLayerGroup();
    map.higisLayers.options = map.options.higis;
    if (map.options.higis.ulControlId && map.options.higis.ulControlId != "") {
        var ul = $("#" + map.options.higis.ulControlId);
        if (ul.length > 0) {
            ul.css("position", "relative");
            ul.addClass("higis-layers");
            map.higisLayers.setUlControl(ul);
        }
    }
    map.higisLayers.onAdd(map);
    return map;
};

L.higisTileLayer = function (url, options) {
    return new L.HigisTileLayer(url, options);
};

L.HigisTileLayer = L.TileLayer.extend({
    redraw: function () {
        if (this._map) {
            this._random = Math.random();
            this._reset({
                hard: true
            });
            this._update();
        }
        return this;
    },
    getTileUrl: function (tilePoint) {
        var url = L.Util.template(this._url, L.extend({
            s: this._getSubdomain(tilePoint),
            z: tilePoint.z,
            x: tilePoint.x,
            y: tilePoint.y
        }, this.options));
        if (!this._random) {
            this._random = Math.random();
        }
        if (url.indexOf("?") > 0) {
            url += "&";
        } else {
            url += "?";
        }
        return url + "random=" + this._random;
    },
    _tileShouldBeLoaded: function (tilePoint) {
        if (tilePoint.x + ":" + tilePoint.y in this._tiles) {
            return false;
        }
        var options = this.options;
        if (!options.continuousWorld) {
            var limit = this._getWrapTileNum();
            if (options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit) || tilePoint.y < 0 || tilePoint.y >= limit) {
                return false;
            }
            if (this.bounds != null) {
                var zoom = this._getZoomForUrl();
                var tileBounds = this.allBounds[zoom];
                if (!tileBounds) {
                    var nePoint = map.project(this.bounds.getNorthEast(), zoom);
                    var swPoint = map.project(this.bounds.getSouthWest(), zoom);
                    var tileSize = this.options.tileSize;
                    var nwTilePoint = new L.Point(Math.floor(swPoint.x / tileSize), Math.floor(swPoint.y / tileSize));
                    var seTilePoint = new L.Point(Math.floor(nePoint.x / tileSize), Math.floor(nePoint.y / tileSize));
                    tileBounds = new L.Bounds(nwTilePoint, seTilePoint);
                    this.allBounds[zoom] = tileBounds;
                }
                if (tileBounds.max.x < tilePoint.x || tileBounds.min.x > tilePoint.x || tileBounds.max.y < tilePoint.y || tileBounds.min.y > tilePoint.y) {
                    return false;
                }
            }
        }
        if (options.bounds) {
            var tileSize = options.tileSize, nwPoint = tilePoint.multiplyBy(tileSize), sePoint = nwPoint.add([tileSize, tileSize]), nw = this._map.unproject(nwPoint), se = this._map.unproject(sePoint);
            if (!options.continuousWorld && !options.noWrap) {
                nw = nw.wrap();
                se = se.wrap();
            }
            if (!options.bounds.intersects([nw, se])) {
                return false;
            }
        }
        return true;
    }
});

if (!L.drawLocal.draw.toolbar.identify) {
    L.drawLocal.draw.toolbar.identify = "Identify";
}

if (!L.drawLocal.draw.identify) {
    L.drawLocal.draw.identify = {
        tooltip: {
            start: "Identify"
        }
    };
}

L.Draw.Identify = L.Handler.extend({
    includes: L.Mixin.Events,
    options: {},
    initialize: function (map, options) {
        this._map = map;
        this._container = map._container;
        this._overlayPane = map._panes.overlayPane;
        this._popupPane = map._panes.popupPane;
        this.type = "identify";
        L.Util.extend(this.options, options);
        var _this = this;
        L.DomEvent.addListener(this._container, "keyup", function (e) {
            if (e.keyCode === 73) {
                this.enable();
            }
        }, _this);
    },
    enable: function () {
        if (this._enabled) {
            return;
        }
        L.Handler.prototype.enable.call(this);
        this.fire("enabled", {
            handler: this.type
        });
        this._map.fire("draw:drawstart", {
            layerType: this.type
        });
    },
    disable: function () {
        if (!this._enabled) {
            return;
        }
        L.Handler.prototype.disable.call(this);
        this.fire("disabled", {
            handler: this.type
        });
        this._map.fire("draw:drawstop", {
            layerType: this.type
        });
    },
    addHooks: function () {
        if (this._map) {
            L.DomUtil.disableTextSelection();
            this._tooltip = new L.Tooltip(this._map);
            L.DomEvent.addListener(this._container, "keyup", this._cancelDrawing, this);
            this._map.on("mousemove", this._onMouseMove, this);
            this._container.style.cursor = "crosshair";
            this._map.on("mousedown", this._onMouseDown, this);
        }
    },
    _getPoint: function (e) {
        var containerPoint = this._map.mouseEventToContainerPoint(e);
        var layerPoint = this._map.containerPointToLayerPoint(containerPoint);
        return this._map.layerPointToLatLng(layerPoint);
    },
    _onMouseDown: function (e) {
        var size = 3;
        var startPoint = {
            pageX: e.originalEvent.pageX - size,
            pageY: e.originalEvent.pageY - size,
            clientX: e.originalEvent.clientX - size,
            clientY: e.originalEvent.clientY - size
        };
        var endPoint = {
            pageX: e.originalEvent.pageX + size,
            pageY: e.originalEvent.pageY + size,
            clientX: e.originalEvent.clientX + size,
            clientY: e.originalEvent.clientY + size
        };
        startPoint = this._getPoint(startPoint);
        endPoint = this._getPoint(endPoint);
        this._map.fire("draw:created", {
            layerType: this.type,
            point: e.latlng,
            start: startPoint,
            end: endPoint,
            identify: this
        });
    },
    _onMouseMove: function (e) {
        var newPos = e.layerPoint, latlng = e.latlng;
        this._currentLatLng = latlng;
        this._updateTooltip(latlng);
        L.DomEvent.preventDefault(e.originalEvent);
    },
    _updateTooltip: function (latLng) {
        var text = L.drawLocal.draw.identify.tooltip.start;
        if (latLng) {
            this._tooltip.updatePosition(latLng);
            text += "<br/>" + latLng.lng + "<br/>" + latLng.lat;
        }
        this._tooltip.updateContent({
            text: text
        });
    },
    removeHooks: function () {
        if (this._map) {
            this._container.style.cursor = "";
            L.DomUtil.enableTextSelection();
            this._tooltip.dispose();
            this._tooltip = null;
            L.DomEvent.removeListener(this._container, "keyup", this._cancelDrawing);
            this._map.off("mousemove", this._onMouseMove, this);
            this._map.off("mousedown", this._onMouseDown, this);
        }
    },
    setOptions: function (options) {
        L.setOptions(this, options);
    },
    _cancelDrawing: function (e) {
        if (e.keyCode === 27) {
            this.disable();
        }
    }
});

//if (!L.drawLocal.draw.toolbar.clearSelection) {
//    L.drawLocal.draw.toolbar.clearSelection = "Clear Selection";
//}

L.Draw.ClearSelection = L.Handler.extend({
    includes: L.Mixin.Events,
    options: {},
    initialize: function (map, options) {
        this._map = map;
        this._container = map._container;
        this._overlayPane = map._panes.overlayPane;
        this._popupPane = map._panes.popupPane;
        this.type = "clearSelection";
        L.Util.extend(this.options, options);
    },
    enable: function () {
        this._map.fire("clearSelection", {
            layerType: this.type
        });
    },
    disable: function () {
    },
    addHooks: function () {
    },
    removeHooks: function () {
    },
    setOptions: function (options) {
    }
});

if (!L.drawLocal.draw.toolbar.fullExtent) {
    L.drawLocal.draw.toolbar.fullExtent = "FullExtent";
}

L.Draw.FullExtent = L.Handler.extend({
    includes: L.Mixin.Events,
    options: {},
    initialize: function (map, options) {
        this._map = map;
        this._container = map._container;
        this._overlayPane = map._panes.overlayPane;
        this._popupPane = map._panes.popupPane;
        this.type = "fullExtent";
        L.Util.extend(this.options, options);
    },
    enable: function () {
        this._map.fire("draw:created", {
            layerType: this.type
        });
    },
    disable: function () {
    },
    addHooks: function () {
    },
    removeHooks: function () {
    },
    setOptions: function (options) {
    }
});

L.Draw.FullExtentToolbar = L.Toolbar.extend({
    options: {
        fullExtent: {
            title: L.drawLocal.draw.toolbar.fullExtent
        }
    },
    initialize: function (options) {
        for (var type in this.options) {
            if (this.options.hasOwnProperty(type)) {
                if (options[type]) {
                    options[type] = L.extend({}, this.options[type], options[type]);
                }
            }
        }
        L.Toolbar.prototype.initialize.call(this, options);
    },
    addToolbar: function (map) {
        var container = L.DomUtil.create("div", "leaflet-draw-section"), buttonIndex = 0, buttonClassPrefix = "leaflet-draw-draw";
        this._toolbarContainer = L.DomUtil.create("div", "leaflet-draw-toolbar leaflet-bar");
        if (this.options.fullExtent) {
            this._initModeHandler(new L.Draw.FullExtent(map, this.options.fullExtent), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
        }
        this._lastButtonIndex = --buttonIndex;
        this._actionsContainer = this._createActions([{
            title: L.drawLocal.draw.toolbar.text,
            text: L.drawLocal.draw.toolbar.text,
            callback: this.disable,
            context: this
        }]);
        container.appendChild(this._toolbarContainer);
        container.appendChild(this._actionsContainer);
        return container;
    },
    setOptions: function (options) {
        L.setOptions(this, options);
        for (var type in this._modes) {
            if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
                this._modes[type].handler.setOptions(options[type]);
            }
        }
    }
});

L.Draw.IdentifyToolbar = L.Toolbar.extend({
    options: {
        selectFeatures: {
            title: L.drawLocal.draw.toolbar.rectangle
        },
        identify: {
            title: L.drawLocal.draw.toolbar.identify
        },
        clearSelection: {
            title: L.drawLocal.draw.toolbar.clearSelection
        }
    },
    initialize: function (options) {
        for (var type in this.options) {
            if (this.options.hasOwnProperty(type)) {
                if (options[type]) {
                    options[type] = L.extend({}, this.options[type], options[type]);
                }
            }
        }
        L.Toolbar.prototype.initialize.call(this, options);
    },
    addToolbar: function (map) {
        var container = L.DomUtil.create("div", "leaflet-draw-section"), buttonIndex = 0, buttonClassPrefix = "leaflet-draw-draw";
        this._toolbarContainer = L.DomUtil.create("div", "leaflet-draw-toolbar leaflet-bar");
        if (this.options.selectFeatures) {
            var rectangle = new L.Draw.Rectangle(map, this.options.selectFeatures);
            rectangle.type = "selectFeatures";
            this._initModeHandler(rectangle, this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            var old_type1 = rectangle.type;
            map.on("selectFeatures.enable", function (e) {
                rectangle.disable();
                rectangle.enable();
                var callback = e.callback;
                if (callback) {
                    var selected = false;
                    var new_type = old_type1 + "_callback_" + Math.random();

                    function selfCallback(e) {
                        if (e.layerType == new_type) {
                            selected = true;
                            rectangle.disable();
                            setTimeout(function () {
                                callback(e);
                            }, 0);
                        }
                    }

                    function selfDisabled() {
                        rectangle.type = old_type1;
                        rectangle.off("disabled", selfDisabled);
                        map.off("draw:created", selfCallback);
                        if (!selected) {
                            callback(null);
                        }
                    }

                    rectangle.type = new_type;
                    rectangle.on("disabled", selfDisabled);
                    map.on("draw:created", selfCallback);
                }
            });
            map.on("selectFeatures.disable", function () {
                rectangle.disable();
            });
        }
        if (this.options.identify) {
            var identify = new L.Draw.Identify(map, this.options.identify);
            this._initModeHandler(identify, this._toolbarContainer, buttonIndex++, buttonClassPrefix);
            var old_type2 = identify.type;
            map.on("identify.enable", function (e) {
                identify.disable();
                identify.enable();
                var callback = e.callback;
                if (callback) {
                    var selected = false;
                    var new_type = old_type2 + "_callback_" + Math.random();

                    function selfCallback(e) {
                        if (e.layerType == new_type) {
                            selected = true;
                            identify.disable();
                            setTimeout(function () {
                                callback(e);
                            }, 0);
                        }
                    }

                    function selfDisabled() {
                        identify.type = old_type2;
                        identify.off("disabled", selfDisabled);
                        map.off("draw:created", selfCallback);
                        if (!selected) {
                            callback(null);
                        }
                    }

                    identify.type = new_type;
                    identify.on("disabled", selfDisabled);
                    map.on("draw:created", selfCallback);
                }
            });
            map.on("identify.disable", function () {
                identify.disable();
            });
        }
        if (this.options.clearSelection) {
            this._initModeHandler(new L.Draw.ClearSelection(map, this.options.clearSelection), this._toolbarContainer, buttonIndex++, buttonClassPrefix);
        }
        this._lastButtonIndex = --buttonIndex;
        this._actionsContainer = this._createActions([{
            title: L.drawLocal.draw.toolbar.text,
            text: L.drawLocal.draw.toolbar.text,
            callback: this.disable,
            context: this
        }]);
        container.appendChild(this._toolbarContainer);
        container.appendChild(this._actionsContainer);
        return container;
    },
    setOptions: function (options) {
        L.setOptions(this, options);
        for (var type in this._modes) {
            if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
                this._modes[type].handler.setOptions(options[type]);
            }
        }
    }
});

L.Draw.clearToolbar = L.Toolbar.extend({

    options: {
        clearSelection: {
            title: L.drawLocal.draw.toolbar.clearSelection
        }
    },

    initialize: function (options) {
        // Ensure that the options are merged correctly since L.extend is only shallow
        for (var type in this.options) {
            if (this.options.hasOwnProperty(type)) {
                if (options[type]) {
                    options[type] = L.extend({}, this.options[type], options[type]);
                }
            }
        }

        L.Toolbar.prototype.initialize.call(this, options);
    },

    addToolbar: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-draw-section'),
            buttonIndex = 0,
            buttonClassPrefix = 'leaflet-draw-draw';

        this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

        if (this.options.clearSelection) {
            this._initModeHandler(
                new L.Draw.ClearSelection(map, this.options.clearSelection),
                this._toolbarContainer,
                buttonIndex++,
                buttonClassPrefix
            );
        }

        // Save button index of the last button, -1 as we would have ++ after the last button
        this._lastButtonIndex = --buttonIndex;

        // Create the actions part of the toolbar
        this._actionsContainer = this._createActions([
            {
                title: L.drawLocal.draw.toolbar.text,
                text: L.drawLocal.draw.toolbar.text,
                callback: this.disable,
                context: this
            }
        ]);

        // Add draw and cancel containers to the control container
        container.appendChild(this._toolbarContainer);
        container.appendChild(this._actionsContainer);

        return container;
    },
    setOptions: function (options) {
        L.setOptions(this, options);

        for (var type in this._modes) {
            if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
                this._modes[type].handler.setOptions(options[type]);
            }
        }
    }
});
L.Control.ClearMap = L.Control.extend({
    options: {
        position: 'topleft'
    },
    initialize: function (options) {
        if (L.version <= "0.5.1") {
            throw new Error('Leaflet.draw 0.2.0+ requires Leaflet 0.6.0+. Download latest from https://github.com/Leaflet/Leaflet/');
        }
        L.Control.prototype.initialize.call(this, options);

        var id, toolbar;
        this._toolbars = {};

        if (L.Draw.clearToolbar) {
            toolbar = new L.Draw.clearToolbar({});
            id = L.stamp(toolbar);
            this._toolbars[id] = toolbar;
            this._toolbars[id].on('enable', this._toolbarEnabled, this);
        }
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-draw'),
            addedTopClass = false,
            topClassName = 'leaflet-draw-toolbar-top',
            toolbarContainer;

        for (var toolbarId in this._toolbars) {
            if (this._toolbars.hasOwnProperty(toolbarId)) {
                toolbarContainer = this._toolbars[toolbarId].addToolbar(map);
                if (!addedTopClass) {
                    if (!L.DomUtil.hasClass(toolbarContainer, topClassName)) {
                        L.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
                    }
                    addedTopClass = true;
                }
                container.appendChild(toolbarContainer);
            }
        }
        return container;
    },
    onRemove: function () {
        for (var toolbarId in this._toolbars) {
            if (this._toolbars.hasOwnProperty(toolbarId)) {
                this._toolbars[toolbarId].removeToolbar();
            }
        }
    },
    setDrawingOptions: function (options) {
        for (var toolbarId in this._toolbars) {
            if (this._toolbars[toolbarId] instanceof L.Toolbar) {
                this._toolbars[toolbarId].setOptions(options);
            }
        }
    },
    _toolbarEnabled: function (e) {
        var id = '' + L.stamp(e.target);
        for (var toolbarId in this._toolbars) {
            if (this._toolbars.hasOwnProperty(toolbarId) && toolbarId !== id) {
                this._toolbars[toolbarId].disable();
            }
        }
    }
});

L.Control.Higis = L.Control.extend({
    options: {
        position: "topleft",
        draw: {},
        higis: false
    },
    initialize: function (options) {
        if (L.version <= "0.5.1") {
            throw new Error("Leaflet.draw 0.2.0+ requires Leaflet 0.6.0+. Download latest from https://github.com/Leaflet/Leaflet/");
        }
        L.Control.prototype.initialize.call(this, options);
        var id, toolbar;
        this._toolbars = {};
        if (L.DrawToolbar && this.options.draw) {
            toolbar = new L.DrawToolbar(this.options.draw);
            id = L.stamp(toolbar);
            this._toolbars[id] = toolbar;
            this._toolbars[id].on("enable", this._toolbarEnabled, this);
        }
        if (L.Draw.IdentifyToolbar && this.options.identify) {
            toolbar = new L.Draw.IdentifyToolbar(this.options.identify);
            id = L.stamp(toolbar);
            this._toolbars[id] = toolbar;
            this._toolbars[id].on("enable", this._toolbarEnabled, this);
        }
        if (L.Draw.FullExtentToolbar && this.options.higis) {
            toolbar = new L.Draw.FullExtentToolbar(this.options.higis);
            id = L.stamp(toolbar);
            this._toolbars[id] = toolbar;
            this._toolbars[id].on("enable", this._toolbarEnabled, this);
        }
        if (L.EditToolbar && this.options.higis) {
            toolbar = new L.EditToolbar(this.options.higis);
            id = L.stamp(toolbar);
            this._toolbars[id] = toolbar;
            this._toolbars[id].on("enable", this._toolbarEnabled, this);
        }
        //if (L.Draw.clearToolbar && this.options.higis) {
        //    toolbar = new L.Draw.clearToolbar(this.options.higis);
        //    id = L.stamp(toolbar);
        //    this._toolbars[id] = toolbar;
        //    this._toolbars[id].on("enable", this._toolbarEnabled, this);
        //}

    },
    onAdd: function (map) {
        var container = L.DomUtil.create("div", "leaflet-draw"), addedTopClass = false, topClassName = "leaflet-draw-toolbar-top", toolbarContainer;
        for (var toolbarId in this._toolbars) {
            if (this._toolbars.hasOwnProperty(toolbarId)) {
                toolbarContainer = this._toolbars[toolbarId].addToolbar(map);
                if (!addedTopClass) {
                    if (!L.DomUtil.hasClass(toolbarContainer, topClassName)) {
                        L.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
                    }
                    addedTopClass = true;
                }
                container.appendChild(toolbarContainer);
            }
        }
        return container;
    },
    onRemove: function () {
        for (var toolbarId in this._toolbars) {
            if (this._toolbars.hasOwnProperty(toolbarId)) {
                this._toolbars[toolbarId].removeToolbar();
            }
        }
    },
    setDrawingOptions: function (options) {
        for (var toolbarId in this._toolbars) {
            if (this._toolbars[toolbarId] instanceof L.Toolbar) {
                this._toolbars[toolbarId].setOptions(options);
            }
        }
    },
    _toolbarEnabled: function (e) {
        var id = "" + L.stamp(e.target);
        for (var toolbarId in this._toolbars) {
            if (this._toolbars.hasOwnProperty(toolbarId) && toolbarId !== id) {
                this._toolbars[toolbarId].disable();
            }
        }
    }
});

L.HigisLayerGroup = L.LayerGroup.extend({
    includes: L.Mixin.Events,
    statics: {
        EVENTS: "click dblclick mouseover mouseout mousemove contextmenu"
    },
    _ul: null,
    initialize: function (options) {
        L.LayerGroup.prototype.initialize.call(this, options);
        this.layers = [];
    },
    setUlControl: function (ul) {
        if (ul) {
            this._ul = ul;
        }
    },
    _getSelectedLayer: function () {
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].geodata.selected) {
                return this.layers[i];
            }
        }
        return null;
    },
    _initSelected: function () {
        var _this = this;
        if (this._ul) {
            this._featureGroup = new L.FeatureGroup();
            this._map.addLayer(this._featureGroup);
            this._map.on("draw:created", function (e) {
                var layer = _this._getSelectedLayer();
                if (layer != null && layer.geodata.app_id != null) {
                    var params = null, inObj = {};
                    inObj.layerType = e.layerType;
                    switch (e.layerType) {
                        case "selectFeatures":
                            if (layer.geodata.app_type == 3) {
                                var latlngs = e.layer.getLatLngs();
                                var southWest = latlngs[0];
                                var northEast = latlngs[2];
                                params = {
                                    app_id: layer.geodata.app_id,
                                    require_feature: true,
                                    minx: southWest.lng,
                                    miny: southWest.lat,
                                    maxx: northEast.lng,
                                    maxy: northEast.lat
                                };
                            }
                            break;

                        case "identify":
                            if (layer.geodata.app_type == 3) {
                                params = {
                                    app_id: layer.geodata.app_id,
                                    require_feature: true,
                                    minx: e.start.lng,
                                    miny: e.start.lat,
                                    maxx: e.end.lng,
                                    maxy: e.end.lat
                                };
                            } else if (layer.geodata.app_type == 4) {
                                params = {
                                    app_id: layer.geodata.app_id,
                                    require_raster: true,
                                    coor: e.point.lng + "," + e.point.lat
                                };
                            }
                            inObj.point = e.point;
                            break;

                        case "clearSelection":
                            _this._featureGroup.clearLayers();
                            break;
                    }
                    if (params != null) {
                        var hipo = _this.options.hipo.baseUrl;
                        if (hipo) {
                            $.ajax({
                                url: hipo + "/apps/" + layer.geodata.app_id,
                                type: "get",
                                data: params,
                                dataType: "json",
                                inObj: inObj,
                                success: function (response) {
                                    if (layer.geodata.app_type == 3) {
                                        _this.addGeoJsonLayer(response, this.inObj.point);
                                    } else {
                                        _this._featureGroup.clearLayers();
                                        _this._showPopupAttributes({
                                            target: {
                                                feature: {
                                                    properties: response
                                                }
                                            },
                                            latlng: this.inObj.point
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
            });
        }
    },
    addGeoJsonLayer: function (geoJson, latlng) {
        this._featureGroup.clearLayers();
        var _this = this;
        if (geoJson.features && geoJson.features.length >= 1e3) {
        }
        var _geoJsonLayer = new L.GeoJSON();
        var featureType = geoJson.type.toUpperCase();
        var _feature = null;
        switch (featureType) {
            case "FEATURECOLLECTION":
                if (geoJson.features.length > 0) {
                    featureType = geoJson.features[0].geometry.type;
                    if (latlng) {
                        _feature = geoJson.features[0];
                        geoJson.features = [_feature];
                    }
                }
                break;

            case "FEATURE":
                featureType = geoJson.geometry.type;
                _feature = geoJson;
                break;
        }
        _geoJsonLayer.options.onEachFeature = function (feature, layer) {
            layer.on({
                mouseover: function (e) {
                    var _layer = e.target;
                    var color = "#6AD3FB";
                    if (_layer.feature.properties) {
                        color = "#eb5b16";
                    }
                    var featureType = _layer.feature.geometry.type.toUpperCase();
                    switch (featureType) {
                        case "POINT":
                        case "MULTIPOINT":
                            _layer.setStyle({
                                radius: 8,
                                fillColor: "#ff0000",
                                fillOpacity: 1,
                                weight: 3,
                                color: "#000000"
                            });
                            break;

                        case "LINESTRING":
                        case "MULTILINESTRING":
                            _layer.setStyle({
                                weight: 6,
                                color: "#000000"
                            });
                            break;

                        case "POLYGON":
                        case "MULTIPOLYGON":
                            _layer.setStyle({
                                color: "#000000",
                                weight: 4,
                                fillColor: color,
                                fillOpacity: .9
                            });
                            break;
                    }
                    if (!L.Browser.ie && !L.Browser.opera) {
                        _layer.bringToFront();
                    }
                },
                mouseout: function (e) {
                    _geoJsonLayer.resetStyle(e.target);
                },
                click: _this._showPopupAttributes
            });
        };
        var fillColor = "#eb5b16", lineColor = "#fb5700";
        switch (featureType.toUpperCase()) {
            case "POINT":
            case "MULTIPOINT":
                _geoJsonLayer.options.pointToLayer = function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: fillColor,
                        fillOpacity: .8,
                        weight: 1,
                        color: "#ffffff"
                    });
                };
                _geoJsonLayer.options.style = function () {
                    return {
                        radius: 7,
                        fillColor: fillColor,
                        fillOpacity: .8,
                        weight: 0,
                        color: "#ffffff"
                    };
                };
                break;

            case "POLYGON":
            case "MULTIPOLYGON":
                _geoJsonLayer.options.style = function () {
                    return {
                        fillColor: fillColor,
                        fillOpacity: .8,
                        weight: 0,
                        color: "#ffffff"
                    };
                };
                break;

            case "LINESTRING":
            case "MULTILINESTRING":
                _geoJsonLayer.options.style = function () {
                    return {
                        weight: 4,
                        color: lineColor
                    };
                };
                break;
        }
        _geoJsonLayer.addData(geoJson);
        this._featureGroup.addLayer(_geoJsonLayer);
        if (latlng && _feature) {
            this._showPopupAttributes({
                target: {
                    feature: _feature
                },
                latlng: latlng
            });
        }
        return _geoJsonLayer;
    },
    _showPopupAttributes: function (e) {
        var content = '<div class="higis-attr-popup">';
        var feature = e.target.feature;
        if (feature) {
            var props = feature.properties;
            for (var key in props) {
                var t = key.toString().toUpperCase();
                if (t === "IMAGE_URI") {
                    content = content + "<h4>" + t + '</h4><div><img style="width:200px; height:200px" src=' + props[key] + "></div>";
                } else if (t === "VIDEO_URI") {
                    content = content + "<h4>" + t + '</h4><video height="200" width="300" loop="loop"><source src=' + props[key] + ' type="video/mp4">您的浏览器不支持video标签</video>';
                } else {
                    content = content + "<h4>" + t + "</h4><p>" + props[key] + "</p>";
                }
            }
        }
        content += "</div>";
        var _featureGroup = this._map.higisLayers._featureGroup;
        var _popupLayer = this._map.higisLayers._popupLayer;
        if (_popupLayer) {
            _featureGroup.removeLayer(_popupLayer);
        }
        _popupLayer = L.popup({
            maxHeight: 200,
            minWidth: 120
        });
        _popupLayer.setLatLng(e.latlng).setContent(content);
        _featureGroup.addLayer(_popupLayer);
        this._map.higisLayers._popupLayer = _popupLayer;
        var video = $("video", _popupLayer._contentNode);
        if (video.length > 0) {
            video = video.first();
            video.on("loadedmetadata", function () {
                this.play();
            });
        }
    },
    onAdd: function (map) {
        this._map = map;
        this.eachLayer(map.addLayer, map);
        this._initSelected();
    },
    addTo: function (map) {
        map.addLayer(this);
        this._initSelected();
        return this;
    },
    getLayers: function () {
        return this.layers;
    },
    addLayer: function (layer) {
        var id = this.getLayerId(layer);
        this._layers[id] = layer;
        if (this._map) {
            this._map.addLayer(layer);
        }
        this.layers.push(layer);
        this.refreshControl();
        return this;
    },
    removeLayer: function (layer) {
        var id = layer in this._layers ? layer : this.getLayerId(layer);
        if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
        }
        var index = this.findLayerIndex(layer);
        this.layers = this.layers.slice(0, index).concat(this.layers.slice(index + 1));
        this.refreshControl();
        delete this._layers[id];
        return this;
    },
    findLayerIndex: function (layer) {
        var index = -1;
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i] == layer) {
                index = i;
                break;
            }
        }
        return index;
    },
    clearLayers: function () {
        var _this = this;
        var _ul = this._ul;
        this._ul = null;
        this.eachLayer(function (layer) {
            if (!layer.geodata.isBaseLayer) {
                _this.removeLayer(layer);
            }
        });
        this._ul = _ul;
        this.refreshControl();
        return this;
    },
    moveLayer: function (from, to) {
        var _layers = this.layers;
        if (from != to && _layers.length > from && _layers.length > to) {
            from = _layers.length - from - 1;
            to = _layers.length - to - 1;
            var i, zIndex, tempIndex;
            var layer = _layers[from];
            if (from > to) {
                zIndex = layer.options.zIndex;
                for (i = from - 1; i >= to; i -= 1) {
                    tempIndex = _layers[i].options.zIndex;
                    _layers[i].setZIndex(zIndex);
                    zIndex = tempIndex;
                }
                layer.setZIndex(zIndex);
            } else {
                zIndex = layer.options.zIndex;
                for (i = from + 1; i <= to; i += 1) {
                    tempIndex = _layers[i].options.zIndex;
                    _layers[i].setZIndex(zIndex);
                    zIndex = tempIndex;
                }
                layer.setZIndex(zIndex);
            }
            _layers = _layers.slice(0, from).concat(_layers.slice(from + 1));
            var new_layers = _layers.slice(0, to);
            new_layers.push(layer);
            new_layers = new_layers.concat(_layers.slice(to));
            this.layers = new_layers;
            this.refreshControl();
        }
    },
    _getTypeClass: function (geometry_type) {
        var typeClass = "null";
        if (geometry_type != null) {
            switch (geometry_type + "") {
                case "0":
                    break;

                case "1":
                case "4":
                    typeClass = "point";
                    break;

                case "2":
                case "5":
                    typeClass = "line";
                    break;

                case "3":
                case "6":
                    typeClass = "polygon";
                    break;
            }
        }
        return "layer-type-" + typeClass;
    },
    refreshControl: function () {
        var _this = this;
        if (this._ul) {
            this._ul.html("");
            for (var i = this.layers.length - 1; i >= 0; i--) {
                var layer = this.layers[i];
                var selectedClass = "";
                if (layer.geodata.selected) {
                    selectedClass = 'class="selected"';
                }
                var li = "<li " + selectedClass + ">" + '<div class="layer-name">';
                if (layer.geodata.app_type == 4) {
                    li += '<i class="layer-type-raster"></i>';
                } else if (layer.geodata.app_type == 5) {
                    li += '<i class="layer-type-map"></i>';
                } else {
                    li += '<i class="' + this._getTypeClass(layer.geodata.geometry_type) + '"></i>';
                }
                li += "<label> " + layer.geodata.name + "</label>" + "</div>" + '<div class="layer-options">';
                if (layer.geodata.display) {
                    li += '<i class="layer-icon-open" title="显示/隐藏"></i>';
                } else {
                    li += '<i class="layer-icon-close" title="显示/隐藏"></i>';
                }
                li += '<i class="layer-icon-fullscreen" title="全屏"></i>';
                if (!layer.geodata.isBaseLayer) {
                    li += '<i class="layer-icon-list" title="属性"></i>';
                    li += '<i class="layer-icon-remove" title="移除"></i>';
                }
                li += "</div>" + "</li>";
                li = $(li);
                if (layer.geodata.app_id != null && layer.geodata.app_type == 3 && layer.geodata.geometry_type == null) {
                    var hipo = _this.options.hipo.baseUrl;
                    if (hipo) {
                        $.ajax({
                            url: hipo + "/apps/" + layer.geodata.app_id + "?keys=geometry_type",
                            type: "get",
                            inObj: {
                                li: li,
                                layer: layer
                            },
                            dataType: "json",
                            success: function (response) {
                                var layer = this.inObj.layer;
                                var li = this.inObj.li;
                                layer.geodata.geometry_type = response.geometry_type;
                                $("i:eq(0)", li).attr("class", _this._getTypeClass(layer.geodata.geometry_type));
                            }
                        });
                    }
                }
                li.click({
                    layer: layer,
                    li: li
                }, function (e) {
                    var layer = e.data.layer;
                    var li = e.data.li;
                    layer.geodata.selected = !layer.geodata.selected;
                    if (layer.geodata.selected) {
                        $(_this.layers).each(function () {
                            this.geodata.selected = false;
                        });
                        layer.geodata.selected = true;
                        $("li", _this._ul).removeClass("selected");
                        li.addClass("selected");
                    } else {
                        li.removeClass("selected");
                    }
                });
                $("i:eq(1)", li).click({
                    layer: layer,
                    li: li
                }, function (e) {
                    e.stopPropagation();
                    var layer = e.data.layer;
                    layer.geodata.display = !layer.geodata.display;
                    var str = "layer-icon-close";
                    if (layer.geodata.display) {
                        str = "layer-icon-open";
                        _this._map.addLayer(layer);
                        if (layer.play && typeof layer.play == "function") {
                            layer.play();
                        }
                    } else {
                        _this._map.removeLayer(layer);
                        if (layer.pause && typeof layer.pause == "function") {
                            layer.pause();
                        }
                    }
                    $(this).attr("class", str);
                });
                $("i:eq(2)", li).click({
                    layer: layer,
                    li: li
                }, function (e) {
                    e.stopPropagation();
                    var layer = e.data.layer;
                    _this._map.fitBounds(layer.bounds);
                });
                $("i:eq(3)", li).click({
                    layer: layer,
                    li: li
                }, function (e) {
                    e.stopPropagation();
                    var layer = e.data.layer;
                    _this._map.fire("layer:property", {
                        layer: layer
                    });
                });
                $("i:eq(4)", li).click({
                    layer: layer,
                    li: li
                }, function (e) {
                    e.stopPropagation();
                    var layer = e.data.layer;
                    _this.removeLayer(layer);
                });
                this._ul.append(li);
                _this._moveLayer(li);
                _this._map.fire("layer:li", {layer: layer, li: li});//属性
            }
        }
    },
    _moveLayer: function (element) {
        var _this = this;
        var _top;
        var parent = element.parent();
        var _li, _num, _lis, _height, _innerHeight, _index, _pageY, _drag;
        element.drag(function (e) {
            element.addClass("drag-selected");
            if (!_drag && Math.abs(_pageY - e.pageY) < 10) {
                return;
            }
            _drag = true;
            var top = e.pageY - _top + parent.scrollTop();
            if (top < 0) {
                top = 0;
            }
            var num = parseInt((top + _innerHeight / 2) / _innerHeight, 0) - 1;
            if (num >= _index) {
                num++;
            }
            if (_lis.length <= num) {
                num = _lis.length - 1;
            }
            if (num !== _num) {
                if (!_li) {
                    _li = $("<li></li>");
                    _li.height(_height);
                }
                if (num === -1) {
                    _li.insertBefore($(_lis[0]));
                } else {
                    _li.insertAfter($(_lis[num]));
                }
                _num = num;
            }
            element.css({
                position: "absolute",
                top: top,
                "z-index": 1e3,
                width: element.width()
            });
        }, function (e) {
            _num = null;
            _index = element.index();
            _height = element.height();
            _innerHeight = element.innerHeight();
            _lis = $("li", parent);
            _pageY = e.pageY;
            _drag = false;
            _top = e.pageY + parent.offset().top - element.offset().top;
        }, function (e) {
            element.removeClass("drag-selected");
            if (_li) {
                var toIndex = _li.index();
                if (toIndex > _index) {
                    toIndex--;
                }
                _li.remove();
                _li = null;
                if (toIndex !== _index) {
                    _this.moveLayer(_index, toIndex);
                }
            }
            element.attr("style", "");
        });
    }
});

L.higisLayerGroup = function (layers) {
    return new L.HigisLayerGroup(layers);
};