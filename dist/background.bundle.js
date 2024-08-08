/*! For license information please see background.bundle.js.LICENSE.txt */
(()=>{"use strict";function t(e){return t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},t(e)}function e(){e=function(){return n};var r,n={},o=Object.prototype,a=o.hasOwnProperty,i=Object.defineProperty||function(t,e,r){t[e]=r.value},c="function"==typeof Symbol?Symbol:{},s=c.iterator||"@@iterator",u=c.asyncIterator||"@@asyncIterator",l=c.toStringTag||"@@toStringTag";function h(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{h({},"")}catch(r){h=function(t,e,r){return t[e]=r}}function f(t,e,r,n){var o=e&&e.prototype instanceof w?e:w,a=Object.create(o.prototype),c=new j(n||[]);return i(a,"_invoke",{value:N(t,r,c)}),a}function p(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}n.wrap=f;var d="suspendedStart",y="suspendedYield",g="executing",v="completed",m={};function w(){}function L(){}function A(){}var b={};h(b,s,(function(){return this}));var x=Object.getPrototypeOf,E=x&&x(x(P([])));E&&E!==o&&a.call(E,s)&&(b=E);var C=A.prototype=w.prototype=Object.create(b);function _(t){["next","throw","return"].forEach((function(e){h(t,e,(function(t){return this._invoke(e,t)}))}))}function O(e,r){function n(o,i,c,s){var u=p(e[o],e,i);if("throw"!==u.type){var l=u.arg,h=l.value;return h&&"object"==t(h)&&a.call(h,"__await")?r.resolve(h.__await).then((function(t){n("next",t,c,s)}),(function(t){n("throw",t,c,s)})):r.resolve(h).then((function(t){l.value=t,c(l)}),(function(t){return n("throw",t,c,s)}))}s(u.arg)}var o;i(this,"_invoke",{value:function(t,e){function a(){return new r((function(r,o){n(t,e,r,o)}))}return o=o?o.then(a,a):a()}})}function N(t,e,n){var o=d;return function(a,i){if(o===g)throw Error("Generator is already running");if(o===v){if("throw"===a)throw i;return{value:r,done:!0}}for(n.method=a,n.arg=i;;){var c=n.delegate;if(c){var s=S(c,n);if(s){if(s===m)continue;return s}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===d)throw o=v,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=g;var u=p(t,e,n);if("normal"===u.type){if(o=n.done?v:y,u.arg===m)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=v,n.method="throw",n.arg=u.arg)}}}function S(t,e){var n=e.method,o=t.iterator[n];if(o===r)return e.delegate=null,"throw"===n&&t.iterator.return&&(e.method="return",e.arg=r,S(t,e),"throw"===e.method)||"return"!==n&&(e.method="throw",e.arg=new TypeError("The iterator does not provide a '"+n+"' method")),m;var a=p(o,t.iterator,e.arg);if("throw"===a.type)return e.method="throw",e.arg=a.arg,e.delegate=null,m;var i=a.arg;return i?i.done?(e[t.resultName]=i.value,e.next=t.nextLoc,"return"!==e.method&&(e.method="next",e.arg=r),e.delegate=null,m):i:(e.method="throw",e.arg=new TypeError("iterator result is not an object"),e.delegate=null,m)}function R(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function I(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function j(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(R,this),this.reset(!0)}function P(e){if(e||""===e){var n=e[s];if(n)return n.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function t(){for(;++o<e.length;)if(a.call(e,o))return t.value=e[o],t.done=!1,t;return t.value=r,t.done=!0,t};return i.next=i}}throw new TypeError(t(e)+" is not iterable")}return L.prototype=A,i(C,"constructor",{value:A,configurable:!0}),i(A,"constructor",{value:L,configurable:!0}),L.displayName=h(A,l,"GeneratorFunction"),n.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===L||"GeneratorFunction"===(e.displayName||e.name))},n.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,A):(t.__proto__=A,h(t,l,"GeneratorFunction")),t.prototype=Object.create(C),t},n.awrap=function(t){return{__await:t}},_(O.prototype),h(O.prototype,u,(function(){return this})),n.AsyncIterator=O,n.async=function(t,e,r,o,a){void 0===a&&(a=Promise);var i=new O(f(t,e,r,o),a);return n.isGeneratorFunction(e)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},_(C),h(C,l,"Generator"),h(C,s,(function(){return this})),h(C,"toString",(function(){return"[object Generator]"})),n.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},n.values=P,j.prototype={constructor:j,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=r,this.done=!1,this.delegate=null,this.method="next",this.arg=r,this.tryEntries.forEach(I),!t)for(var e in this)"t"===e.charAt(0)&&a.call(this,e)&&!isNaN(+e.slice(1))&&(this[e]=r)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var e=this;function n(n,o){return c.type="throw",c.arg=t,e.next=n,o&&(e.method="next",e.arg=r),!!o}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],c=i.completion;if("root"===i.tryLoc)return n("end");if(i.tryLoc<=this.prev){var s=a.call(i,"catchLoc"),u=a.call(i,"finallyLoc");if(s&&u){if(this.prev<i.catchLoc)return n(i.catchLoc,!0);if(this.prev<i.finallyLoc)return n(i.finallyLoc)}else if(s){if(this.prev<i.catchLoc)return n(i.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return n(i.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&a.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var o=n;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=t,i.arg=e,o?(this.method="next",this.next=o.finallyLoc,m):this.complete(i)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),m},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),I(r),m}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;I(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(t,e,n){return this.delegate={iterator:P(t),resultName:e,nextLoc:n},"next"===this.method&&(this.arg=r),m}},n}function r(t,e,r,n,o,a,i){try{var c=t[a](i),s=c.value}catch(t){return void r(t)}c.done?e(s):Promise.resolve(s).then(n,o)}function n(t){return function(){var e=this,n=arguments;return new Promise((function(o,a){var i=t.apply(e,n);function c(t){r(i,o,a,c,s,"next",t)}function s(t){r(i,o,a,c,s,"throw",t)}c(void 0)}))}}var o=!0;function a(t,e,r){return i.apply(this,arguments)}function i(){return(i=n(e().mark((function t(r,n,a){var i,c,s,u;return e().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,fetch("https://www.googleapis.com/calendar/v3/calendars",{method:"POST",headers:{Authorization:"Bearer "+r,"Content-Type":"application/json"},body:JSON.stringify({summary:n,description:"imported from g-canvas"})});case 3:return i=t.sent,t.next=6,i.json();case 6:return c=t.sent,o&&console.log("Calendar Created:",c),t.next=10,fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?colorRgbFormat=true",{method:"POST",headers:{Authorization:"Bearer "+r,"Content-Type":"application/json"},body:JSON.stringify({id:c.id,backgroundColor:a,foregroundColor:"#000000",selected:!0})});case 10:return s=t.sent,t.next=13,s.json();case 13:return u=t.sent,o&&console.log("Calendar list object:",u),t.abrupt("return",c);case 18:t.prev=18,t.t0=t.catch(0),console.error("Error creating calendar:",t.t0);case 21:case"end":return t.stop()}}),t,null,[[0,18]])})))).apply(this,arguments)}function c(){return(c=n(e().mark((function t(r){var n,i,c,s,u,l,h,f,p,d;return e().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,o&&console.log("In getOrCreateCalendar"),n="g-canvas",i="#40E0D0",t.next=6,chrome.storage.sync.get(["CALENDAR_ID"]);case 6:if(c=t.sent,s=c.CALENDAR_ID,o&&console.log(c.CALENDAR_ID),null!=c.CALENDAR_ID){t.next=21;break}return t.next=12,a(r,n,i);case 12:return u=t.sent,o&&console.log(u),t.next=16,chrome.storage.sync.set({CALENDAR_ID:u.id});case 16:return t.next=18,chrome.storage.sync.set({CALENDAR_COLOR:i});case 18:return t.abrupt("return",u);case 21:return t.next=23,fetch("https://www.googleapis.com/calendar/v3/calendars/".concat(s),{method:"GET",headers:{Authorization:"Bearer "+r}});case 23:return l=t.sent,t.next=26,l.json();case 26:if(!(h=t.sent).error){t.next=40;break}return o&&console.log("Calendar not found"),t.next=31,a(r,n,i);case 31:return f=t.sent,o&&console.log(f),t.next=35,chrome.storage.sync.set({CALENDAR_ID:f.id});case 35:return t.next=37,chrome.storage.sync.set({CALENDAR_COLOR:i});case 37:return t.abrupt("return",f);case 40:return o&&console.log("Calendar Info:",h),t.next=43,fetch("https://www.googleapis.com/calendar/v3/calendars/".concat(s),{method:"GET",headers:{Authorization:"Bearer "+r}});case 43:return p=t.sent,t.next=46,p.json();case 46:return d=t.sent,t.next=49,chrome.storage.sync.set({CALENDAR_COLOR:d.backgroundColor});case 49:return t.abrupt("return",h);case 50:t.next=55;break;case 52:t.prev=52,t.t0=t.catch(0),console.error("Error handling calendar",t.t0);case 55:case"end":return t.stop()}}),t,null,[[0,52]])})))).apply(this,arguments)}var s=!0;function u(t){var e=t.responseHeaders||[];return e.push({name:"Access-Control-Allow-Origin",value:"*"}),e.push({name:"Access-Control-Allow-Methods",value:"GET, POST, PUT, DELETE, OPTIONS"}),e.push({name:"Access-Control-Allow-Headers",value:"Content-Type, Authorization"}),s&&console.log("handleHeadersReceived executed"),{responseHeaders:e}}function l(t){var e="".concat(t,"/*");chrome.webRequest.onHeadersReceived.removeListener(u),s&&console.log("listener removed"),chrome.webRequest.onHeadersReceived.addListener(u,{urls:[e]},["responseHeaders"]),s&&console.log("added listener")}chrome.runtime.onInstalled.addListener((function(t){"install"===t.reason&&chrome.tabs.create({url:"../startup.html"}),chrome.identity.getAuthToken({interactive:!0},(function(t){chrome.runtime.lastError?console.error(chrome.runtime.lastError):(function(t){fetch("https://www.googleapis.com/oauth2/v3/userinfo",{method:"GET",headers:{Authorization:"Bearer "+t}}).then((function(t){return t.json()})).then((function(t){console.log("User Info:",t)})).catch((function(t){return console.error("Error fetching user info:",t)}))}(t),function(t){c.apply(this,arguments)}(t))}))})),chrome.runtime.onMessage.addListener((function(t,e,r){if("fetchICS"===t.action)return fetchICS(t.url).then((function(t){var e=parseICS(t);r({events:e})})).catch((function(t){r({error:t.message})})),!0})),s&&console.log("listener initialized"),chrome.storage.sync.get(["CANVAS_API_URL"],(function(t){t.CANVAS_API_URL?l(t.CANVAS_API_URL):console.warn("CANVAS_API_URL is not set in storage")})),chrome.storage.onChanged.addListener((function(t,e){if(s&&console.log("URL pattern changed"),"sync"===e&&t.CANVAS_API_URL){var r=t.CANVAS_API_URL.newValue;r&&l(r)}}))})();