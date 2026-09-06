import{c as e,r as t,s as n,t as r}from"./kr700pa-rig2-BszOf-h4.js";import{a as i,n as a,o,r as s,s as c,t as l}from"./camera-rig-ICu-WTX3.js";import{At as u,F as d,Nn as f,O as p,ar as m,f as h,mt as g,o as _,pt as v,z as y}from"./three.core-DdxcG9Bc.js";import{a as b,i as x,t as ee}from"./materials-CTRVyoox.js";import{r as te}from"./rig-Bh2gL2mz.js";function ne(t,n){let r=new f,i=new u(1,1),a=(e,t,[n,a],o,s)=>{let c=new v(i,new g({color:new h(e).multiplyScalar(t),side:2}));return c.scale.set(n,a,1),c.position.set(...o),s&&c.rotation.set(...s),r.add(c),c};r.background=new h(329482),a(659220,1,[40,40],[0,-6,0],[-Math.PI/2,0,0]),a(461325,1,[40,20],[0,6,-14],[0,0,0]),a(16773856,5.2,[3,22],[-5,11,1],[Math.PI/2,0,0]),a(16773856,1.6,[2,18],[7,11,-2],[Math.PI/2,0,0]),a(2768210,1.1,[16,8],[9,1,6],[0,-Math.PI/2.4,0]);let o=new e(t),s=o.fromScene(r,.02).texture;return o.dispose(),i.dispose(),r.traverse(e=>e.material?.dispose()),n.environment=s,n.environmentIntensity=1,s}async function S(e,{ticker:i,reduced:a=!1,onProgress:o}={}){let s=n(e,{fov:34,near:.2,far:60,exposure:1.15,background:null,ticker:i}),{scene:c,renderer:u,camera:f,mobile:h}=s;ne(u,c),c.fog=new d(658445,14,52);let g=new p(16773340,3.4);if(g.position.set(-5.5,8.5,3.2),g.castShadow=!h,g.castShadow){g.shadow.mapSize.set(2048,2048),g.shadow.bias=-5e-4,g.shadow.normalBias=.02;let e=g.shadow.camera;e.near=1,e.far=26,e.left=e.bottom=-6,e.right=e.top=6,e.updateProjectionMatrix()}let v=new p(9417942,.85);v.position.set(6,-2,5);let S=new p(16765600,1.9);S.position.set(3.5,1.2,-7),c.add(g,v,S);let C=(await t(u,r,{onProgress:o})).scene,w=ee(C);w.length&&console.warn(`[scene] material audit`,w),C.traverse(e=>{if(!e.isMesh)return;e.castShadow=!h,e.receiveShadow=!h;let t=e.material;t&&(t.envMapIntensity=1.25,t.name===`paint`&&(t.roughness=.46,t.metalness=.05),t.name===`steel`&&(t.roughness=.31,t.metalness=.95),t.name===`graphite`&&(t.roughness=.62,t.metalness=.25))});let T=te(C),E=new y;E.name=`spin`,E.add(T.root),c.add(E);let D=h?null:x(c,{size:7,height:.9,resolution:512,blur:3.2,darkness:1.8,opacity:.8});h||b(c,{size:60,opacity:.42});let O=l(f,{lambda:3.2,fovLambda:2.4}),k={dark:{key:[-4.2,6,2.2,.16],fill:[5,-1.5,4,.05],rim:[2.6,1.4,-6.2,1.05],exposure:.72},sculpt:{key:[-4.2,6,2.2,2.1],fill:[5,-1.5,4,.3],rim:[2.6,1.4,-6.2,3.4],exposure:1.12},clean:{key:[-5.5,8.5,4.5,3.2],fill:[6,-1,5,.95],rim:[3,1.6,-6.5,1.5],exposure:1.18},side:{key:[-7.5,3.4,1.2,3.9],fill:[5,-1,4,.45],rim:[4,1.2,-5.5,2.2],exposure:1.1},specular:{key:[-2,3.2,3.4,4.6],fill:[4,.4,3,.22],rim:[2.2,1,-3.4,3],exposure:.98},top:{key:[-1.6,9.5,1.4,3.6],fill:[5,.2,4,.55],rim:[3.2,2.4,-6,1.7],exposure:1.14},hero:{key:[-6,7,3,3],fill:[6.5,-1.2,5,.8],rim:[3.4,1.4,-7,2.6],exposure:1.2}},A={key:[...k.sculpt.key],fill:[...k.sculpt.fill],rim:[...k.sculpt.rim]},j=(e,t,n)=>{let r=k[e]??k.hero,i=k[n]??r,a=Math.max(0,Math.min(1,t));for(let e of[`key`,`fill`,`rim`])for(let t=0;t<4;t++)A[e][t]=i[e][t]+(r[e][t]-i[e][t])*a;g.position.set(A.key[0],A.key[1],A.key[2]),g.intensity=A.key[3],v.position.set(A.fill[0],A.fill[1],A.fill[2]),v.intensity=A.fill[3],S.position.set(A.rim[0],A.rim[1],A.rim[2]),S.intensity=A.rim[3],s.setExposure(i.exposure+(r.exposure-i.exposure)*a)},M=()=>{let e=new _().setFromObject(T.root),t=e.min.clone().project(f),n=e.max.clone().project(f);window.__subject={x:(Math.min(t.x,n.x)+1)/2,y:1-(Math.max(t.y,n.y)+1)/2,w:Math.abs(n.x-t.x)/2,h:Math.abs(n.y-t.y)/2}},N=document.querySelector(`[data-level]`),P=document.querySelector(`[data-level-marks]`),F=document.documentElement,I={setState(e){let t=e!==`off`;N&&(N.hidden=!t),P&&(P.hidden=!t),F.dataset.levelState=t?e:`introduced`},setFade(e){let t=e===null?``:String(e);N&&(N.style.opacity=t),P&&(P.style.opacity=t)}},L=document.querySelector(`[data-readout]`),R=-999,z=()=>{if(!L)return;let e=(Math.atan2(f.position.x,f.position.z)*180/Math.PI+360)%360;if(Math.abs(e-R)<.5)return;R=e;let t=Math.hypot(f.position.x,f.position.z);L.textContent=`AZ ${e.toFixed(0).padStart(3,`0`)}\u00b0 \u00b7 ${t.toFixed(1)} M`},B=new m,V=-1,H=-1,U=()=>{if(!N&&!P)return;T.flangePoint(B).project(f);let e=(1-(B.y+1)/2)*100;Math.abs(e-V)>=.001&&(V=e,F.style.setProperty(`--level-y`,e.toFixed(3)+`%`));let t=Math.min(Math.max((B.x+1)/2*100,-25),125);Math.abs(t-H)>=.001&&(H=t,F.style.setProperty(`--level-x`,t.toFixed(3)+`%`))},W=!0;return s.onFrame(e=>{let t=O.update(e);U(),z(),D&&(!t||W)&&(D.update(u),W=!1),M()}),{stage:s,scene:c,camera:f,model:C,rig:T,rigCam:O,level:I,mobile:h,touch(){W=!0},setSpin(e){E.rotation.y=e*Math.PI/180,W=!0},setLight:j,setExposure:e=>s.setExposure(e),dispose(){D?.dispose(),s.dispose(),delete window.__subject}}}var C=(e,t,n)=>({x:e,y:t,z:n}),w=(e,t,n)=>e+(t-e)*n,T=e=>e<0?0:e>1?1:e,E=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,D=e=>1-(1-e)**3,O=(e,t,n)=>T((e-t)/(n-t)),k=Math.PI/180,A=(e,t,n,r,i)=>({azimuth:e,radius:t,height:n,target:r,fov:i});function j(e){let t=e.azimuth*k;return{position:{x:e.target.x+Math.sin(t)*e.radius,y:e.height,z:e.target.z+Math.cos(t)*e.radius},target:e.target,fov:e.fov}}function M(e,t,n){return j({azimuth:w(e.azimuth,t.azimuth,n),radius:w(e.radius,t.radius,n),height:w(e.height,t.height,n),fov:w(e.fov,t.fov,n),target:{x:w(e.target.x,t.target.x,n),y:w(e.target.y,t.target.y,n),z:w(e.target.z,t.target.z,n)}})}var N=A(66,7.1,2.35,C(.78,1.42,0),34),P={impact:{trigger:`#impact`,from:A(40,3.3,.95,C(.3,1.45,0),46),to:A(18,2.7,.72,C(.42,1.55,0),48),pose:{from:.12,to:.2,at:[.15,.95]},light:`sculpt`,lightAt:[0,.3],level:`off`},scale:{trigger:`#scale`,from:A(18,2.7,.72,C(.42,1.55,0),48),to:A(110,11,3.8,C(.35,1.3,0),34),camEase:D,pose:{from:.2,to:.34,at:[.18,.92]},light:`clean`,lightAt:[.12,.58],level:`off`},rear:{trigger:`#rear`,from:A(110,11,3.8,C(.35,1.3,0),34),to:A(250,4.3,1.55,C(.3,1.8,0),38),pose:{from:.34,to:.6,at:[.05,.88]},light:`side`,lightAt:[.04,.4],level:`proving`},above:{trigger:`#above`,from:A(250,4.3,1.55,C(.3,1.8,0),38),to:A(315,5.2,7.4,C(.95,1.55,0),50),camEase:D,pose:{from:.6,to:.79,at:[.1,.9]},light:`top`,lightAt:[.2,.66],level:`off`},macro:{trigger:`#macro`,from:A(315,5.2,7.4,C(.95,1.55,0),50),to:A(372,1.45,2.3,C(1.78,2.05,0),30),camEase:e=>D(T(e/.52)),pose:{from:.79,to:.87,at:[0,.62]},light:`specular`,lightAt:[0,.34],level:`off`},hero:{trigger:`#hero`,from:A(372,1.45,2.3,C(1.78,2.05,0),30),to:A(545,8.4,1.05,C(1.05,1.24,0),40),camEase:D,pose:{from:.87,to:1,at:[.04,.72]},light:`hero`,lightAt:[.16,.62],level:`proving`}},F={impact:[A(40,4.6,1.05,C(.35,1.5,0),52),A(18,4.1,.85,C(.45,1.6,0),54)],scale:[A(18,4.1,.85,C(.45,1.6,0),54),A(110,15,4.6,C(.35,1.45,0),40)],rear:[A(110,15,4.6,C(.35,1.45,0),40),A(250,5.6,1.7,C(.35,1.75,0),44)],above:[A(250,5.6,1.7,C(.35,1.75,0),44),A(315,6.6,7.8,C(.95,1.55,0),56)],macro:[A(315,6.6,7.8,C(.95,1.55,0),56),A(372,2.05,2.28,C(1.76,2.05,0),36)],hero:[A(372,2.05,2.28,C(1.76,2.05,0),36),A(545,11,1.25,C(1.05,1.24,0),46)]},I=[`impact`,`scale`,`rear`,`above`,`macro`,`hero`];function L(e){return e&&F.impact?F.impact[0]:P.impact.from}function R(e,t){let{rigCam:n,rig:r,level:i}=t,a=t.mobile,s=e=>a&&F[e]?{from:F[e][0],to:F[e][1]}:{from:P[e].from,to:P[e].to},l=e=>{n.set(e),t.touch()},u=e=>i?.setState(e),d=c.context(()=>{I.forEach((e,n)=>{let i=P[e],a=n>0?P[I[n-1]]:null,c=s(e);o.create({trigger:i.trigger,start:`top top`,end:`bottom top`,scrub:!0,invalidateOnRefresh:!0,onUpdate:e=>{let n=e.progress;l(M(c.from,c.to,(i.camEase??E)(n))),r.setPose(w(i.pose.from,i.pose.to,E(O(n,i.pose.at[0],i.pose.at[1]))));let[o,s]=i.lightAt??[0,.45];t.setLight(i.light,E(O(n,o,s)),a?.light??i.light),u(i.level)},onEnterBack:()=>u(i.level)})});let e=a&&F.hero?F.hero[1]:P.hero.to,n=[.5,1],c=0,d=0,f=!1,p=0,m=e,h=()=>{l(M(e,m,E(d)));let r=180*E(O(d,n[0],n[1]));t.setSpin(r+c)},g=document.querySelector(`[data-orbit]`);if(g){let e=e=>{f=!0,p=e.clientX,g.setPointerCapture?.(e.pointerId),g.dataset.grabbing=``},t=e=>{f&&(c+=(e.clientX-p)*.32,p=e.clientX,h())},n=e=>{f=!1,g.releasePointerCapture?.(e.pointerId),delete g.dataset.grabbing};g.addEventListener(`pointerdown`,e),g.addEventListener(`pointermove`,t),g.addEventListener(`pointerup`,n),g.addEventListener(`pointercancel`,n)}o.create({trigger:`#record .record`,start:`top bottom`,end:`top center`,scrub:!0,invalidateOnRefresh:!0,onUpdate:e=>{d=e.progress,h(),t.setExposure(w(1.18,.14,e.progress)),i?.setFade(1-T(e.progress*2))},onLeaveBack:()=>{c=0,d=0,t.setSpin(0),l(e),t.setExposure(1.18),i?.setFade(null)}})},e);return()=>d.revert()}function z(e){let{rigCam:t,rig:n,level:r}=e,i=j(e.mobile&&F.hero?F.hero[1]:P.hero.to);return n.setPose(1),t.cut({position:i.position,target:i.target,fov:i.fov}),e.setLight(`hero`,1),r?.setState(`proving`),e.touch(),()=>{}}Math.PI/180;var B=.1,V=.02,H=.12;function U(e){e.rigCam.cut(j(N)),e.setLight(`dark`,1),e.touch()}function W(e,{onDone:t,revealType:n=!0}={}){let r=document.querySelector(`[data-intro]`),i=j(L(e.mobile)),a=j(N),o=()=>{e.rigCam.set(i),e.setLight(`sculpt`,1),e.rig.setPose(H),e.touch(),r?.setAttribute(`data-intro`,`done`),t?.()};if(!r||window.scrollY>4)return o(),()=>{};r.setAttribute(`data-intro`,`running`),U(e);let s={t:0,pose:B,light:0},l=c.timeline({defaults:{ease:`none`},onUpdate:()=>{e.rigCam.set(oe(a,i,s.t)),e.setLight(`sculpt`,s.light,`dark`),e.rig.setPose(s.pose),e.touch()},onComplete:o});l.to(s,{light:1,duration:1.5,ease:`power2.out`},.3),l.to(s,{t:1,duration:2,ease:`power3.inOut`},.45),l.to(s,{pose:V,duration:1,ease:`power2.inOut`},1.45),l.to(s,{pose:H,duration:1.5,ease:`power1.inOut`},2.2);let u=n?document.querySelector(`[data-flap]`):null;if(u){let e=G(u,`flap`);ie(u,e),ae(l,e,.62)}let d=document.querySelector(`[data-intro-sub]`);if(d){let e=G(d,`step`);l.fromTo(e,{x:-30,opacity:0},{x:0,opacity:1,duration:.62,stagger:.028,ease:`power3.out`},2.15)}l.to(`[data-intro] .intro__type`,{scale:.87,opacity:.34,duration:.95,ease:`power2.inOut`,onStart:()=>r.setAttribute(`data-behind`,``)},1.95),window.__intro=l;let f=e=>{window.__introBail=e?.type??`unknown`,l.progress(1),l.kill(),h()},p=[`wheel`,`touchstart`,`keydown`,`pointerdown`],m=()=>{window.scrollY>4&&f()},h=()=>{for(let e of p)window.removeEventListener(e,f);window.removeEventListener(`scroll`,m)};for(let e of p)window.addEventListener(e,f,{passive:!0,once:!0});return window.addEventListener(`scroll`,m,{passive:!0}),()=>{l.kill(),h()}}var re=`ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;function G(e,t){if(e.dataset.cells!==void 0)return[...e.querySelectorAll(`.`+t)];let n=[],r=document.createDocumentFragment();for(let i of e.textContent){let e=document.createElement(`span`);e.className=t,e.textContent=i,e.dataset.final=i,r.appendChild(e),n.push(e)}return e.replaceChildren(r),e.dataset.cells=``,n}function ie(e,t){let n=parseFloat(getComputedStyle(e).fontSize)||16;for(let e of t){let t=e.getBoundingClientRect().width;t>0&&(e.style.width=(t/n).toFixed(4)+`em`)}}function ae(e,t,n){t.forEach((t,r)=>{let i=t.dataset.final;if(i===` `)return;let a=9+r%4*3,o={t:0};e.to(o,{t:1,duration:.58,ease:`power2.out`,onUpdate:()=>{let e=Math.floor(o.t*a);t.textContent=e>=a?i:re[(e*5+r*11)%36],t.style.transform=`translateY(${(1-o.t)*-16}%)`},onComplete:()=>{t.textContent=i,t.style.transform=``}},n+r*.055)})}function oe(e,t,n){return{position:{x:e.position.x+(t.position.x-e.position.x)*n,y:e.position.y+(t.position.y-e.position.y)*n,z:e.position.z+(t.position.z-e.position.z)*n},target:{x:e.target.x+(t.target.x-e.target.x)*n,y:e.target.y+(t.target.y-e.target.y)*n,z:e.target.z+(t.target.z-e.target.z)*n},fov:e.fov+(t.fov-e.fov)*n}}var se=120,ce=900,K=new URLSearchParams(location.search).get(`preload`),q=K===null?0:Math.min(Math.max(Number(K)||2600,600),15e3);function le({reduced:e=!1}={}){let t=document.querySelector(`[data-preload]`),n=t?.querySelector(`[data-preload-status]`),r=performance.now(),i=0,a=!1,o=!1,s=null,c=``,l=e=>{c===e||!n||(c=e,n.textContent=e)};l(`Fetching`);function u(){let e=document.querySelector(`[data-intro] .intro__title`),n=document.querySelector(`[data-intro] .intro__sub`);if(!e||!t)return!1;let r=e.getBoundingClientRect(),i=n?.getBoundingClientRect()??r,a=Math.max(r.bottom,i.bottom);if(r.width<1)return!1;let o=window.innerHeight,s=o-a;if(s<150){let e=Math.min(r.top,i.top);return e<150?!1:(t.style.setProperty(`--preload-shift`,`${Math.round(e/2-o/2)}px`),!0)}return t.style.setProperty(`--preload-shift`,`${Math.round(a+s/2-o/2)}px`),!0}let d=()=>{a&&!o&&u()},f=t?setTimeout(()=>{o||!u()||(a=!0,i=performance.now(),t.hidden=!1,window.addEventListener(`resize`,d,{passive:!0}),requestAnimationFrame(()=>t.setAttribute(`data-preload`,`on`)))},se):null;return{get visible(){return a},report(e){o||e?.lengthComputable&&e.total>0&&e.loaded>=e.total&&l(`Decoding`)},async close(){if(o)return;let e=q?Math.max(q-(performance.now()-r),0):a?Math.max(ce-(performance.now()-i),0):0;if(e>0&&await new Promise(t=>setTimeout(t,e)),!o){if(o=!0,clearTimeout(f),!a){p();return}t.setAttribute(`data-preload`,`done`),s=setTimeout(p,620)}},destroy:p};function p(){o=!0,window.removeEventListener(`resize`,d),clearTimeout(f),clearTimeout(s),t&&(t.hidden=!0,t.setAttribute(`data-preload`,``))}}var ue=`attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,de=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, OKLab toggle
uniform vec4 u_space;      // offset.xy, pointer.xy
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  vec3 acc = u_colors[0] * 0.15;
  float total = 0.15;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_colorCount) break;
    float fi = float(i);
    vec2 c = vec2(
      sin(t * (0.21 + fi * 0.071) + fi * 2.4 + u_seed),
      cos(t * (0.17 + fi * 0.093) + fi * 1.7)) * (0.45 + u_intensity * 0.35);
    float w = exp(-dot(p - c, p - c) * 6.0);
    acc += u_colors[i] * w;
    total += w;
  }
  return acc / total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,fe=.5,J={colors:[[.02745,.03922,.04706],[.13725,.21961,.29804],[.17255,.24706,.2],[.23137,.32157,.34118],[.23137,.32157,.34118],[.23137,.32157,.34118],[.23137,.32157,.34118],[.23137,.32157,.34118]],colorCount:4,scale:2,intensity:.54,paramA:.47,warp:.042,detail:1.536,contrast:1.158,brightness:0,saturation:1,hue:0,vignette:.21,blur:.002,grain:.101,seed:4012,rotate:5.6549,offsetX:.11,offsetY:-.19,drift:.116,cursorEffect:2,cursorStrength:.65,cursorRadius:.46,oklab:0,timeScale:-.727};function pe(e,{ticker:t,reduced:n=!1}={}){let r=e.getContext(`webgl`,{antialias:!1});if(!r)return null;let i=(e,t)=>{let n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),r.getShaderParameter(n,r.COMPILE_STATUS)||console.warn(`[backdrop] shader did not compile`,r.getShaderInfoLog(n)),n},a=r.createProgram(),o=i(r.VERTEX_SHADER,ue),s=i(r.FRAGMENT_SHADER,de);r.attachShader(a,o),r.attachShader(a,s),r.linkProgram(a),r.deleteShader(o),r.deleteShader(s),r.useProgram(a);let c=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,c),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);let l=r.getAttribLocation(a,`a_position`);r.enableVertexAttribArray(l),r.vertexAttribPointer(l,2,r.FLOAT,!1,0,0);let u={colors:r.getUniformLocation(a,`u_colors`),scene:r.getUniformLocation(a,`u_scene`),shape:r.getUniformLocation(a,`u_shape`),surface:r.getUniformLocation(a,`u_surface`),finish:r.getUniformLocation(a,`u_finish`),transform:r.getUniformLocation(a,`u_transform`),space:r.getUniformLocation(a,`u_space`),cursor:r.getUniformLocation(a,`u_cursor`)};r.uniform3fv(u.colors,new Float32Array(J.colors.flat().map(e=>e*fe))),r.uniform4f(u.shape,J.scale,J.intensity,J.paramA,J.warp),r.uniform4f(u.surface,J.detail,J.contrast,J.brightness,J.saturation),r.uniform4f(u.finish,J.hue,J.vignette,J.blur,J.grain),r.uniform4f(u.transform,J.seed,J.rotate,J.drift,J.oklab),r.uniform4f(u.cursor,0,J.cursorEffect,J.cursorStrength,J.cursorRadius);let d=performance.now(),f=0,p=document.visibilityState===`visible`,m=!0,h=!1,g=()=>{let t=e.getBoundingClientRect(),n=Math.min(window.devicePixelRatio||1,2),i=Math.max(1,Math.round(t.width*n)),a=Math.max(1,Math.round(t.height*n)),o=Math.min(1,Math.sqrt(2e6/Math.max(1,i*a))),s=Math.max(1,Math.round(i*o)),c=Math.max(1,Math.round(a*o));(e.width!==s||e.height!==c)&&(e.width=s,e.height=c,r.viewport(0,0,s,c),h=!1)};g();let _=t=>{g();let i=n?0:(t-d)/1e3*J.timeScale;r.uniform4f(u.scene,e.width,e.height,i,J.colorCount),r.uniform4f(u.space,J.offsetX+f*-.34,J.offsetY+f*1.15,0,0),r.drawArrays(r.TRIANGLES,0,3),h=!0},v=()=>{!p||!m||n&&h||_(performance.now())};t.add(v);let y=new IntersectionObserver(([e])=>{m=e?.isIntersecting??!0,m&&(h=!1)});y.observe(e);let b=new ResizeObserver(()=>{h=!1,g()});b.observe(e);let x=()=>{p=document.visibilityState===`visible`,p&&(h=!1)};return document.addEventListener(`visibilitychange`,x),{setScroll(e){if(n)return;let t=Math.min(Math.max(e,0),1);Math.abs(t-f)<5e-4||(f=t)},dispose(){t.remove(v),y.disconnect(),b.disconnect(),document.removeEventListener(`visibilitychange`,x),r.deleteBuffer(c),r.deleteProgram(a),r.getExtension(`WEBGL_lose_context`)?.loseContext()}}}var me={impact:{in:.02,out:.6,enter:`lateralRight`,exit:`pushRight`},scale:{in:.14,out:.72,enter:`fromOutside`,exit:`cropOut`},rear:{in:.1,out:.76,enter:`lineTravel`,exit:`reverseLift`},above:{in:.17,out:.7,enter:`maskDown`,exit:`liftUp`},macro:{in:.05,out:.56,enter:`lateralLeft`,exit:`trailLeft`},hero:{in:.12,out:.8,enter:`riseBehind`,exit:`clearEarly`}},he={impact:[`.kicker`,`.edge`],scale:[`.stat__fig`,`.stat__unit`,`.stat__cap`],rear:[`@lines`,`.pin__label`],above:[`.edge`,`.stat__fig`,`.stat__unit`,`.stat__cap`,`.pin__label`],macro:[`@lines`,`.pin__label`],hero:[`@lines`]},Y=10,ge={lateralRight:e=>c.timeline({paused:!0}).fromTo(e,{x:74,opacity:0,filter:`blur(${Y}px)`},{x:0,opacity:1,filter:`blur(0px)`,duration:.95,ease:`power3.out`,stagger:.14}),fromOutside:e=>{let[t,...n]=e,r=c.timeline({paused:!0});return r.fromTo(t,{xPercent:-118,opacity:0},{xPercent:0,opacity:1,duration:1.25,ease:`power3.out`},0),n.length&&r.fromTo(n,{x:-46,opacity:0},{x:0,opacity:1,duration:.8,ease:`power2.out`,stagger:.12},.42),r},lineTravel:e=>c.timeline({paused:!0}).fromTo(e,{yPercent:105,opacity:0,clipPath:`inset(0 0 100% 0)`},{yPercent:0,opacity:1,clipPath:`inset(0 0 -18% 0)`,duration:1.05,ease:`power3.out`,stagger:.19,clearProps:`clipPath`}),maskDown:e=>c.timeline({paused:!0}).fromTo(e,{clipPath:`inset(100% 0 0 0)`,y:-34,opacity:0},{clipPath:`inset(-18% 0 0 0)`,y:0,opacity:1,duration:1,ease:`power3.out`,stagger:.16,clearProps:`clipPath`}),lateralLeft:e=>c.timeline({paused:!0}).fromTo(e,{x:-88,opacity:0,filter:`blur(${Y}px)`},{x:0,opacity:1,filter:`blur(0px)`,duration:.85,ease:`power3.out`,stagger:.11}),riseBehind:e=>c.timeline({paused:!0}).fromTo(e,{y:104,opacity:0,filter:`blur(16px)`},{y:0,opacity:1,filter:`blur(0px)`,duration:1.35,ease:`power3.out`,stagger:.22})},_e={pushRight:e=>c.timeline({paused:!0}).to(e,{x:96,opacity:0,filter:`blur(${Y}px)`,duration:.85,ease:`power2.in`,stagger:.09}),cropOut:e=>{let[t,...n]=e,r=c.timeline({paused:!0});return n.length&&r.to(n,{x:-40,opacity:0,duration:.6,ease:`power2.in`,stagger:.08},0),r.to(t,{scale:1.42,opacity:0,transformOrigin:`0% 50%`,duration:.95,ease:`power2.in`},.14),r},reverseLift:e=>c.timeline({paused:!0}).to(e,{yPercent:-78,opacity:0,duration:.9,ease:`power2.in`,stagger:{each:.14,from:`end`}}),liftUp:e=>c.timeline({paused:!0}).to(e,{y:-74,opacity:0,filter:`blur(${Y}px)`,duration:.85,ease:`power2.in`,stagger:.1}),trailLeft:e=>c.timeline({paused:!0}).to(e,{x:-96,opacity:0,duration:.7,ease:`power2.in`,stagger:{each:.08,from:`end`}}),clearEarly:e=>c.timeline({paused:!0}).to(e,{y:-58,opacity:0,filter:`blur(14px)`,duration:1,ease:`power2.in`,stagger:.1})},ve=[`.stat__fig`,`.record .fig`];function X(e){let t=e.trim().match(/^(\d[\d   ]*)(?:([.,])(\d+))?(\s*[^\d]*)$/);if(!t)return null;let[,n,r,i,a]=t,o=/[   ]/.test(n)?n.match(/[   ]/)[0]:``,s=n.replace(/[   ]/g,``),c=Number(s+(i?`.`+i:``));return Number.isFinite(c)?{value:c,places:i?i.length:0,separator:o,decimalMark:r??`.`,tail:a,original:e}:null}function ye(e,t){let[n,r]=t.toFixed(e.places).split(`.`);return(e.separator?n.replace(/\B(?=(\d{3})+(?!\d))/g,e.separator):n)+(e.places?e.decimalMark+r:``)+e.tail}function Z(e){if(e.dataset.split!==void 0)return[...e.querySelectorAll(`.line`)];if(e.dataset.split=``,e.classList.contains(`stat`)){let t=[...e.children];for(let e of t)e.classList.add(`line`);return t}let t=[[]];for(let n of[...e.childNodes])n.nodeName===`BR`?t.push([]):t[t.length-1].push(n);let n=[];for(let e of t){if(!e.length)continue;let t=document.createElement(`span`);t.className=`line`;for(let n of e)t.appendChild(n);n.push(t)}return e.replaceChildren(...n),n}function be(e,t){let n=[];for(let r of t)if(r===`@lines`)for(let t of e.querySelectorAll(`h2`))n.push(...Z(t));else n.push(...e.querySelectorAll(r));return n.filter(Boolean)}function xe(e,{reduced:t=!1,backdrop:n=null}={}){if(t)return()=>{};let r=c.context(()=>{for(let[e,t]of Object.entries(me)){let n=document.getElementById(e);if(!n)continue;let r=be(n,he[e]??[]);if(!r.length)continue;let i=ge[t.enter](r),a=_e[t.exit](r),s={in:!1,out:!1},c=e=>{s.in=e,s.out=e,e?(i.progress(1).pause(),a.progress(1).pause()):(a.progress(0).pause(),i.progress(0).pause())};a.progress(0).pause(),i.progress(0).pause(),o.create({trigger:n,start:`top top`,end:`bottom top`,invalidateOnRefresh:!0,onUpdate:e=>{let n=e.progress;n>=t.in&&!s.in?(s.in=!0,i.play()):n<t.in&&s.in&&(s.in=!1,i.reverse()),n>=t.out&&!s.out?(s.out=!0,a.play()):n<t.out&&s.out&&(s.out=!1,a.reverse())},onLeave:()=>c(!0),onLeaveBack:()=>c(!1)})}let e=document.querySelector(`.record`);if(e){let t=[...e.querySelectorAll(`h2`)].flatMap(Z),n=c.utils.toArray(e.querySelectorAll(`.note-wrap, .provenance`)),r=c.utils.toArray(e.querySelectorAll(`.plate tr`)),i=c.timeline({scrollTrigger:{trigger:e,start:`top 32%`,once:!0,invalidateOnRefresh:!0}});t.length&&i.from(t,{x:-60,opacity:0,duration:.9,ease:`power3.out`,stagger:.12,immediateRender:!0},0),n.length&&i.from(n,{y:24,opacity:0,duration:.8,ease:`power2.out`,stagger:.1,immediateRender:!0},.22),r.length&&i.from(r,{x:-28,opacity:0,duration:.6,ease:`power2.out`,stagger:.045,immediateRender:!0},.3)}for(let e of ve)for(let t of c.utils.toArray(e)){let e=X(t.textContent);if(!e)continue;let n={v:e.value>=10?10**(String(Math.floor(e.value)).length-1):0};c.to(n,{v:e.value,duration:2.6,ease:`power1.out`,onUpdate:()=>{t.textContent=ye(e,n.v)},onComplete:()=>{t.textContent=e.original},scrollTrigger:{trigger:t.closest(`.shot`)??t,start:t.closest(`.shot`)?`top 30%`:`top 80%`,once:!0}})}let t=c.utils.toArray(`[data-intro], [data-intro-sub]`);t.length&&c.to(t,{opacity:0,ease:`none`,scrollTrigger:{trigger:`#impact`,start:`top top`,end:`bottom top`,scrub:!0,invalidateOnRefresh:!0}}),n&&o.create({start:0,end:`max`,scrub:!0,invalidateOnRefresh:!0,onUpdate:e=>n.setScroll(e.progress)})},e);return()=>r.revert()}var Q=new URLSearchParams(location.search).has(`reduced`);`scrollRestoration`in history&&(history.scrollRestoration=`manual`);var $=document.getElementById(`scene`);async function Se(){if(!$)return;let e=s()||Q,t=pe(document.getElementById(`backdrop`),{ticker:c.ticker,reduced:e}),n=le({reduced:e}),r;try{r=await S($,{ticker:c.ticker,reduced:e,onProgress:e=>n.report(e)})}catch(e){console.warn(`[index1] scene unavailable — the page stands without it`,e),n.destroy(),document.querySelector(`.stage`)?.setAttribute(`data-unavailable`,``);return}let l=!Q&&!s();l&&U(r);let u=n.visible;await n.close();let d=()=>{};l?d=W(r,{revealType:!u}):document.querySelector(`[data-intro]`)?.setAttribute(`data-intro`,`done`);let f=Q?(z(r),()=>{}):a(document.documentElement,{desktop:()=>R(document.documentElement,r),mobile:()=>R(document.documentElement,r),reduced:()=>z(r)});Q&&(document.documentElement.dataset.reduced=`forced`);let p=xe(document.documentElement,{reduced:e,backdrop:t}),m=i();document.fonts?.ready.then(()=>o.refresh()),window.addEventListener(`pagehide`,()=>{f?.(),d(),n.destroy(),p(),t?.dispose(),m(),r.dispose()},{once:!0})}Se();