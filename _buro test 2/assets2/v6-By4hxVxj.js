const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./compound3d-Bueq1gZH.js","./preload-helper-DtWiEIvH.js","./three.module-Dl3cTCkI.js"])))=>i.map(i=>d[i]);
import{n as e,r as t,t as n}from"./preload-helper-DtWiEIvH.js";var r=`
<div class="stage" data-stage>
  <div class="mount" data-mount></div>

  <!-- The two tags. One names a building, one names a door, and only ever one is up. -->
  <div class="tag tag--b" data-tag-b hidden></div>
  <div class="tag tag--d" data-tag-d hidden></div>

  <div class="mark" data-mark>
    <b>Luxe&nbsp;Corsa</b>
    <span>Lake Zurich, Illinois</span>
  </div>

  <!-- ONE WAY HOME, AND IT NEVER MOVES.
       ← Overview lived in the top-right cluster beside Site plan, in the same weight,
       and a visitor deep in a suite had to decide which of Overview, Site plan, Escape
       and the chevrons meant "show me everything again". It is its own control now,
       in its own reserved place on the left, at one fixed coordinate in both the
       building state and the suite state, saying what it does in words. -->
  <button class="home" type="button" data-overview hidden>
    <span class="home__a" aria-hidden="true">←</span><span class="home__t">All buildings</span>
  </button>

  <!-- ONLY WHERE THE ARCHITECTURE HAS TWO. Buildings 02 and 10 are two runs back to
       back; nine of the eleven are one run and never show this. It is a camera move,
       not a navigation layer: same building, same state, the other elevation. -->
  <button class="flip" type="button" data-flip hidden>
    <span class="flip__a" aria-hidden="true">⟳</span><span class="flip__t" data-flip-t>Other row</span>
  </button>

  <div class="topright">
    <button class="quiet" type="button" data-plan-open>Site plan</button>
  </div>

  <!-- THE ONE INSTRUCTION, and it retires the moment it has been obeyed. -->
  <div class="say" data-say>
    <p class="say__n" data-say-n>121</p>
    <p class="say__s" data-say-s>private suites · 98 available</p>
    <p class="say__t" data-say-t>Choose a building.</p>
  </div>

  <!-- THE STEPS SAY WHERE THEY GO. Two unlabelled chevrons scored 2/10 and deserved it:
       an arrow at the edge of a compound of eleven buildings could mean the next
       building, the next suite, or the next page. The number is the label. -->
  <button class="step step--prev" type="button" data-step="-1" hidden>
    <span class="step__a" aria-hidden="true">←</span><span class="step__n" data-step-prev></span>
  </button>
  <button class="step step--next" type="button" data-step="1" hidden>
    <span class="step__n" data-step-next></span><span class="step__a" aria-hidden="true">→</span>
  </button>

  <!-- Secondary: reaching a door that is off screen. Never the way the idea is learnt. -->
  <div class="v6-rail" data-v6-rail hidden>
    <div class="v6-rail__bays" data-bays role="group" aria-label="Suites in this building"></div>
  </div>

  <!-- ================================================================================
       THE PRODUCT PLATE, BUILT ONCE.

       It used to be written with innerHTML on every paint, so every value that changed
       length changed the layout: 03 · 01 to 03 · 11 moved the price, Standard to Premium
       moved the button, $549,000 to $699,000 re-centred the row. The plate has fixed
       geometry now — a fixed width, fixed rows, one slot per fact — and changing suite
       writes TEXT into slots that do not move. Nothing here is ever rebuilt.
       ============================================================================== -->
  <div class="prod" data-prod hidden>
    <p class="prod__k" data-p-k>Suite</p>
    <p class="prod__n" data-p-n>&nbsp;</p>
    <p class="prod__t"><em data-p-kind>&nbsp;</em><span data-p-sq>&nbsp;</span></p>
    <p class="prod__p" data-p-price>&nbsp;</p>
    <button class="go" type="button" data-enter><span data-p-cta>Enter suite</span><i aria-hidden="true" data-p-arrow>→</i></button>
    <button class="specs" type="button" data-specs>Full specs →</button>
  </div>
</div>`,i=`
<div class="v6 plan" data-plan hidden>
  <div class="plan__bar">
    <button class="plan__exit" type="button" data-plan-exit><span aria-hidden="true">←</span> Back to 3D <kbd>Esc</kbd></button>
    <div class="plan__t"><b>Site plan</b><span data-plan-where>Whole compound</span></div>
    <div class="plan__key">
      <span><i style="background:var(--sand)"></i>Premium</span>
      <span><i style="background:var(--steel-55)"></i>Standard</span>
      <span><i style="background:var(--ink-10)"></i>Sold</span>
    </div>
  </div>
  <div class="plan__grid"><div class="plan__map" data-plan-map></div></div>
</div>`;function a(a,o={}){a.classList.add(`v6`),a.innerHTML=r;let s=document.createElement(`div`);s.innerHTML=i;let c=s.firstElementChild;document.body.appendChild(c);let l=(e,t=a)=>t.querySelector(e),u=l(`[data-stage]`),d=l(`[data-mount]`),f=l(`[data-tag-b]`),p=l(`[data-tag-d]`),m=l(`[data-say]`),h=l(`[data-say-n]`),g=l(`[data-say-s]`),_=l(`[data-say-t]`),v=l(`[data-overview]`),ee=l(`[data-plan-open]`),te=l(`[data-v6-rail]`),y=l(`[data-bays]`),b=l(`[data-prod]`),x=[...a.querySelectorAll(`[data-step]`)],ne=l(`[data-step-prev]`),re=l(`[data-step-next]`),S=l(`[data-flip]`),ie=l(`[data-flip-t]`),C={k:l(`[data-p-k]`),n:l(`[data-p-n]`),kind:l(`[data-p-kind]`),sq:l(`[data-p-sq]`),price:l(`[data-p-price]`),cta:l(`[data-p-cta]`),arrow:l(`[data-p-arrow]`),enter:l(`[data-enter]`),specs:l(`[data-specs]`)},w=(e,t)=>{e&&e.textContent!==t&&(e.textContent=t)},ae=l(`[data-plan-map]`,c),T=t(d),E=null,D=null,O={level:`compound`,building:null,suite:null,hover:null,hoverSuite:null,preview:null,plan:!1,entered:!1},oe=T.suites.length,k=T.suites.filter(e=>!e.sold).length,A=e=>e===`A`?`Premium`:`Standard`,j=t=>e[t].total.replace(/SQ FT/i,`sq ft`),M=t=>e[t].price.replace(/^FROM\s*/i,``),se=e=>`$`+Math.round(Number(M(e).replace(/[^0-9]/g,``))/1e3)+`K`;function N(e){O.hover!==e&&(O.hover=e,E?.setHoverBuilding(e?e.num:null),u.dataset.hot=e&&!O.building?`true`:`false`,W())}function P(e){O.preview!==e&&(O.preview=e,E?.setPreviewBuilding(e?e.num:null),W())}function F(e){O.hoverSuite!==e&&(O.hoverSuite=e,E?.setHoverSuite(e||null),W())}function I(e){e&&(Object.assign(O,{building:e,suite:null,hover:null,hoverSuite:null,preview:null,level:`building`,entered:!1}),u.dataset.hot=`false`,E?.setLevel(`building`,e.num),W(),le(),W(),o.onLevel?.(O.level,O))}function L(e){e&&!e.sold&&(Object.assign(O,{suite:e,building:e.bldg,hoverSuite:null,preview:null,level:`suite`,entered:!1}),E?.setLevel(`suite`,e.bldg.num,e.index),W(),o.onLevel?.(O.level,O),o.onSuite?.(e))}function R(){Object.assign(O,{level:`compound`,building:null,suite:null,hover:null,hoverSuite:null,preview:null,entered:!1}),u.dataset.hot=`false`,E?.setLevel(`compound`),W(),o.onLevel?.(O.level,O)}function z(){if(O.level!==`suite`||!O.building)return R();let e=O.building;Object.assign(O,{suite:null,level:`building`,preview:null,entered:!1}),E?.setLevel(`building`,e.num),W(),o.onLevel?.(O.level,O)}function B(e){let t=T.buildings;if(!O.building)return;let n=t[(t.indexOf(O.building)+e+t.length)%t.length];n&&n!==O.building&&I(n)}function V(){O.suite&&(O.entered=!0,E?.enterSuite(O.suite.index),W(),o.onEnter?.(O.suite))}let H=new Map;function ce(){for(let e of T.buildings){let t=new Map;for(let n of e.suites){let e=n.ang.toFixed(2);t.has(e)||t.set(e,[]),t.get(e).push(n)}let n=[];for(let e of t.values()){let t=-(e[0].ang*Math.PI)/180,r=Math.cos(t),i=-Math.sin(t),a=e.map(e=>({s:e,u:e.cx*r+e.cy*i})).sort((e,t)=>e.u-t.u),o=a[0].s,s=a[a.length-1].s,c=(o.slot??o.w)/2,l=(s.slot??s.w)/2,u=(o.depth??o.dep)/2,d=o.faceNormal[0],f=o.faceNormal[1],p=o.cx-r*c,m=o.cy-i*c,h=s.cx+r*l,g=s.cy+i*l;n.push([p+d*u,m+f*u],[h+d*u,g+f*u],[h-d*u,g-f*u],[p-d*u,m-f*u])}H.set(e.num,n)}}function U(){if(!E||!D||O.plan){f.hidden=!0,p.hidden=!0;return}let t=u.getBoundingClientRect(),n=t.width,r=t.height,i=o.topSafe??56,a=O.hoverSuite;if(a&&O.level!==`compound`){let t=E.doorPoint(a.index,n,r);if(t){e[a.type],p.dataset.s=a.sold?`sold`:O.suite===a?`on`:`hover`,p.style.left=Math.max(120,Math.min(n-130,t[0]))+`px`,p.style.top=Math.max(i,t[1]-96)+`px`,p.innerHTML=a.sold?`<span class="tag__n">${a.ref}</span><span class="tag__m">Sold</span>`:`<span class="tag__n">${a.ref}</span><span class="tag__m">${A(a.type)} · ${j(a.type)}</span><span class="tag__p">${se(a.type)}</span>`,p.hidden=!1,f.hidden=!0;return}}p.hidden=!0;let s=O.suite?null:O.preview||O.hover;if(!s){f.hidden=!0;return}let c=H.get(s.num);if(!c){f.hidden=!0;return}let l=E.roofY??0,d=new D.Vector3,m=1e9,h=0,g=!1;for(let[e,t]of c){if(d.set(e,l,t),E.site.localToWorld(d),d.project(E.camera),d.z>1){g=!0;break}let i=(d.x*.5+.5)*n,a=(-d.y*.5+.5)*r;a<m&&(m=a,h=i)}if(g){f.hidden=!0;return}f.dataset.s=O.preview?`preview`:`hover`,f.style.left=Math.max(110,Math.min(n-120,h))+`px`,f.style.top=Math.max(i,m-78)+`px`;let _=E.rowCount?E.rowCount(s.num):1;f.innerHTML=`<span class="tag__n">${s.num}</span><span class="tag__m">${s.open} of ${s.suites.length} available${_>1?` · two rows`:``}</span><span class="tag__go">${O.preview?`Switch →`:`View →`}</span>`,f.hidden=!1}function le(){y.replaceChildren();let e=O.building?.suites||[];if(!e.length)return;let t=e.reduce((e,t)=>e+(t.slot??t.w),0)||1,n=Math.max(200,Math.min(520,a.clientWidth*.4)),r=Math.min(1.05,Math.max(.34,(n-2*(e.length-1))/t));for(let t of e){let e=document.createElement(`button`);e.type=`button`,e.className=`v6-bay`,e.dataset.bay=``,e.dataset.sold=t.sold?`true`:`false`,e.dataset.type=t.type,e.style.width=Math.max(7,Math.round((t.slot??t.w)*r))+`px`,e.disabled=t.sold,e.setAttribute(`aria-label`,`Suite ${t.ref}, ${A(t.type)}${t.sold?`, sold`:`, available`}`),e.addEventListener(`pointerenter`,()=>F(t)),e.addEventListener(`pointerleave`,()=>F(null)),e.addEventListener(`focus`,()=>F(t)),e.addEventListener(`blur`,()=>F(null)),e.addEventListener(`click`,()=>L(t)),e._s=t,y.appendChild(e)}}function W(){let e=O.building,t=O.suite;u.dataset.level=O.level,v.hidden=O.level===`compound`,m.hidden=O.level!==`compound`,te.hidden=O.level===`compound`;for(let e of x)e.hidden=O.level===`compound`;if(O.level===`compound`){let e=O.hover;h.textContent=e?e.num:String(oe),g.textContent=e?`${e.suites.length} suites · ${e.open} available`:`private suites · ${k} available`,_.textContent=e?`Click to go in.`:`Choose a building.`}if(b.hidden=!t,t?b.removeAttribute(`inert`):b.setAttribute(`inert`,``),!t){for(let e of[C.n,C.kind,C.sq,C.price])w(e,`\xA0`);C.enter.dataset.mode=`enter`}t&&(w(C.k,O.entered?`You are in`:`Suite`),w(C.n,t.ref),w(C.kind,A(t.type)),C.kind.dataset.type=t.type,w(C.sq,` · `+j(t.type)),w(C.price,M(t.type)),w(C.cta,O.entered?`Continue to the suite`:`Enter suite`),w(C.arrow,O.entered?`↓`:`→`),C.enter.dataset.mode=O.entered?`go`:`enter`,C.specs.hidden=O.entered);{let t=e&&E?E.rowCount(e.num):1;if(S.hidden=!(e&&t>1),!S.hidden){let t=E.rowIndex(e.num);w(ie,t===0?`Second row`:`First row`)}}if(O.building){let e=T.buildings,t=e.indexOf(O.building);w(ne,e[(t-1+e.length)%e.length].num),w(re,e[(t+1)%e.length].num)}for(let e of y.children)e.setAttribute(`aria-pressed`,e._s===t?`true`:`false`),e._s===O.hoverSuite&&e._s!==t?e.setAttribute(`data-hot`,`true`):e.removeAttribute(`data-hot`);U()}v.addEventListener(`click`,R),S.addEventListener(`click`,()=>{E?.flipRow()&&W()});for(let e of x)e.addEventListener(`click`,()=>B(Number(e.dataset.step)));b.addEventListener(`click`,e=>{e.target.closest(`[data-enter]`)?C.enter.dataset.mode===`go`?o.onContinue?.(O.suite):V():e.target.closest(`[data-specs]`)&&o.onSpecs?.(O.suite)});let G=e=>{if(e.key===`Escape`){if(O.plan){X();return}if(O.level===`suite`){z();return}if(O.level===`building`){R();return}}};addEventListener(`keydown`,G);let K=!1,q=null;function J(){if(q)try{let e=q.getBBox();if(!e.width||!e.height)return;let t=Math.max(e.width,e.height)*.05;q.setAttribute(`viewBox`,`${e.x-t} ${e.y-t} ${e.width+t*2} ${e.height+t*2}`)}catch{}}function ue(){if(K)return;K=!0,q=T.svg.cloneNode(!0),q.style.width=`100%`,q.style.height=`100%`,q.style.visibility=`visible`,q.setAttribute(`preserveAspectRatio`,`xMidYMid meet`),ae.appendChild(q);let e=`http://www.w3.org/2000/svg`;for(let t of T.buildings){let n=t.box,r=q.querySelector(`g[data-building="${t.num}"]`);if(n&&n.width){let i=document.createElementNS(e,`text`);if(i.textContent=t.num,i.setAttribute(`x`,n.x+n.width/2),i.setAttribute(`y`,n.y+n.height/2),i.setAttribute(`text-anchor`,`middle`),i.setAttribute(`dominant-baseline`,`middle`),i.setAttribute(`class`,`pnum`),q.appendChild(i),r){let i=document.createElementNS(e,`rect`);i.setAttribute(`x`,n.x),i.setAttribute(`y`,n.y),i.setAttribute(`width`,n.width),i.setAttribute(`height`,n.height),i.setAttribute(`fill`,`transparent`),i.setAttribute(`class`,`phit`),i.setAttribute(`role`,`button`),i.setAttribute(`tabindex`,`0`),i.setAttribute(`aria-label`,`Building ${t.num}, ${t.open} of ${t.suites.length} available`);let a=()=>{X(),I(t)};i.addEventListener(`click`,a),i.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),a())}),i.addEventListener(`pointerenter`,()=>r.setAttribute(`data-hot`,`true`)),i.addEventListener(`pointerleave`,()=>r.removeAttribute(`data-hot`)),r.appendChild(i),t._planGroup=r}}}}function Y(){ue(),O.plan=!0,c.hidden=!1,U();for(let e of T.buildings)e._planGroup?.toggleAttribute(`data-current`,e===O.building);q&&(q.querySelectorAll(`[data-here]`).forEach(e=>e.removeAttribute(`data-here`)),O.suite&&q.querySelector(`[data-ref="${CSS.escape(O.suite.ref)}"]`)?.setAttribute(`data-here`,`true`));let e=l(`[data-plan-where]`,c);e&&(e.textContent=O.suite?`Suite ${O.suite.ref}`:O.building?`Building ${O.building.num}`:`Whole compound`),requestAnimationFrame(()=>requestAnimationFrame(J))}function X(){O.plan=!1,c.hidden=!0,W()}ee.addEventListener(`click`,Y),l(`[data-plan-exit]`,c).addEventListener(`click`,X);let Z=()=>{O.plan&&J()};addEventListener(`resize`,Z);let Q=0,$={S:O,compound:T,host:a,stage:u,selectBuilding:I,selectSuite:L,hoverBuilding:N,hoverSuite:F,previewBuilding:P,overview:R,backToBuilding:z,stepBuilding:B,enterSuite:V,openPlan:Y,closePlan:X,get gl(){return E},get THREE(){return D},destroy(){cancelAnimationFrame(Q),removeEventListener(`keydown`,G),removeEventListener(`resize`,Z),c.remove()}};return n(async()=>{let{initCompound3D:e}=await import(`./compound3d-Bueq1gZH.js`);return{initCompound3D:e}},__vite__mapDeps([0,1,2]),import.meta.url).then(async({initCompound3D:e})=>{if(E=e(d,T),!E)throw Error(`no webgl`);u.setAttribute(`data-gl`,`on`),D=await n(()=>import(`./three.module-Dl3cTCkI.js`),[],import.meta.url);let t=e=>T.byNum.get(e);E.onHoverBuilding=e=>N(e?t(e):null),E.onPreviewBuilding=e=>P(e?t(e):null),E.onHoverSuite=e=>F(e==null?null:T.suites[e]),E.onPickBuilding=e=>{let n=t(e);n&&I(n)},E.onPickSuite=e=>{let t=T.suites[e];t&&L(t)},ce(),E.roofY=E.roofTopLocal??0;let r=()=>{Q=requestAnimationFrame(r),U()};requestAnimationFrame(()=>{E.setLevel(`compound`),W(),r()}),o.onReady?.($)}).catch(e=>console.warn(`[v6] the model did not stand`,e)),W(),$}export{a as t};