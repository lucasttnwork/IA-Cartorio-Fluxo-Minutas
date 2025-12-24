import{r as b,g as $}from"./vendor-DI5uVZmF.js";var x={exports:{}},S={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var I=b,D=Symbol.for("react.element"),V=Symbol.for("react.fragment"),k=Object.prototype.hasOwnProperty,C=I.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,L={key:!0,ref:!0,__self:!0,__source:!0};function h(t,e,n){var o,r={},u=null,i=null;n!==void 0&&(u=""+n),e.key!==void 0&&(u=""+e.key),e.ref!==void 0&&(i=e.ref);for(o in e)k.call(e,o)&&!L.hasOwnProperty(o)&&(r[o]=e[o]);if(t&&t.defaultProps)for(o in e=t.defaultProps,e)r[o]===void 0&&(r[o]=e[o]);return{$$typeof:D,type:t,key:u,ref:i,props:r,_owner:C.current}}S.Fragment=V;S.jsx=h;S.jsxs=h;x.exports=S;var re=x.exports;const P={},w=t=>{let e;const n=new Set,o=(s,l)=>{const a=typeof s=="function"?s(e):s;if(!Object.is(a,e)){const c=e;e=l??(typeof a!="object"||a===null)?a:Object.assign({},e,a),n.forEach(f=>f(e,c))}},r=()=>e,p={setState:o,getState:r,getInitialState:()=>m,subscribe:s=>(n.add(s),()=>n.delete(s)),destroy:()=>{(P?"production":void 0)!=="production"&&console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."),n.clear()}},m=e=t(o,r,p);return p},oe=t=>t?w(t):w;var j={exports:{}},g={},O={exports:{}},R={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var v=b;function T(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var z=typeof Object.is=="function"?Object.is:T,F=v.useState,M=v.useEffect,N=v.useLayoutEffect,U=v.useDebugValue;function A(t,e){var n=e(),o=F({inst:{value:n,getSnapshot:e}}),r=o[0].inst,u=o[1];return N(function(){r.value=n,r.getSnapshot=e,E(r)&&u({inst:r})},[t,n,e]),M(function(){return E(r)&&u({inst:r}),t(function(){E(r)&&u({inst:r})})},[t]),U(n),n}function E(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!z(t,n)}catch{return!0}}function G(t,e){return e()}var W=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?G:A;R.useSyncExternalStore=v.useSyncExternalStore!==void 0?v.useSyncExternalStore:W;O.exports=R;var B=O.exports;/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var y=b,J=B;function Y(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var H=typeof Object.is=="function"?Object.is:Y,K=J.useSyncExternalStore,Q=y.useRef,X=y.useEffect,Z=y.useMemo,q=y.useDebugValue;g.useSyncExternalStoreWithSelector=function(t,e,n,o,r){var u=Q(null);if(u.current===null){var i={hasValue:!1,value:null};u.current=i}else i=u.current;u=Z(function(){function p(c){if(!m){if(m=!0,s=c,c=o(c),r!==void 0&&i.hasValue){var f=i.value;if(r(f,c))return l=f}return l=c}if(f=l,H(s,c))return f;var _=o(c);return r!==void 0&&r(f,_)?(s=c,f):(s=c,l=_)}var m=!1,s,l,a=n===void 0?null:n;return[function(){return p(e())},a===null?void 0:function(){return p(a())}]},[e,n,o,r]);var d=K(t,u[0],u[1]);return X(function(){i.hasValue=!0,i.value=d},[d]),q(d),d};j.exports=g;var ee=j.exports;const ne=$(ee);export{oe as c,re as j,ne as u};
//# sourceMappingURL=canvas-CyV05iTF.js.map
