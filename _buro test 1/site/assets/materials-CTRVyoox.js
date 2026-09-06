import{At as e,Dt as t,Fn as n,Pn as r,bt as i,ht as a,lr as o,mt as s,pt as c,yt as l,z as u}from"./three.core-DdxcG9Bc.js";var d={name:`HorizontalBlurShader`,uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform float h;

		varying vec2 vUv;

		void main() {

			vec4 sum = vec4( 0.0 );

			sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
			sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
			sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
			sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
			sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
			sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
			sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
			sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

			gl_FragColor = sum;

		}`},f={name:`VerticalBlurShader`,uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform float v;

		varying vec2 vUv;

		void main() {

			vec4 sum = vec4( 0.0 );

			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
			sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

			gl_FragColor = sum;

		}`};function p(n,{size:i=4,height:l=.5,resolution:p=512,blur:m=3.5,darkness:h=1.4,opacity:g=.85,y:_=0}={}){let v=new u;v.name=`contact-shadow`,v.position.y=_,n.add(v);let y=new o(p,p);y.texture.generateMipmaps=!1;let b=new o(p,p);b.texture.generateMipmaps=!1;let x=new e(i,i).rotateX(Math.PI/2),S=new c(x,new s({map:y.texture,opacity:g,transparent:!0,depthWrite:!1}));S.renderOrder=1,S.scale.y=-1,v.add(S);let C=new c(x);C.visible=!1,v.add(C);let w=new t(-i/2,i/2,i/2,-i/2,0,l);w.rotation.x=Math.PI/2,v.add(w);let T=new a;T.userData.darkness={value:h},T.onBeforeCompile=e=>{e.uniforms.darkness=T.userData.darkness;let t=`gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );`;e.fragmentShader.includes(t)||console.warn(`[contact-shadow] depth shader shape changed in this three version — shadow will be inverted`),e.fragmentShader=`uniform float darkness;\n${e.fragmentShader}`.replace(t,`gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );`)},T.depthTest=!1,T.depthWrite=!1;let E=new r(d);E.depthTest=!1;let D=new r(f);D.depthTest=!1;let O=(e,t)=>{C.visible=!0,C.material=E,E.uniforms.tDiffuse.value=y.texture,E.uniforms.h.value=t*1/256,e.setRenderTarget(b),e.render(C,w),C.material=D,D.uniforms.tDiffuse.value=b.texture,D.uniforms.v.value=t*1/256,e.setRenderTarget(y),e.render(C,w),C.visible=!1};return{group:v,plane:S,update:e=>{let t=n.background,r=e.getClearAlpha();n.background=null,n.overrideMaterial=T,e.setClearAlpha(0),e.setRenderTarget(y),e.render(n,w),n.overrideMaterial=null,O(e,m),O(e,m*.4),e.setRenderTarget(null),e.setClearAlpha(r),n.background=t},set opacity(e){S.material.opacity=e},dispose(){y.dispose(),b.dispose(),x.dispose(),S.material.dispose(),T.dispose(),E.dispose(),D.dispose(),n.remove(v)}}}function m(t,{size:r=40,opacity:i=.35,y:a=0}={}){let o=new c(new e(r,r),new n({opacity:i}));return o.rotation.x=-Math.PI/2,o.position.y=a,o.receiveShadow=!0,o.name=`shadow-catcher`,t.add(o),o}function h({color:e=1053720,metalness:t=.8,roughness:n=.35,clearcoat:r=1,clearcoatRoughness:i=.05,envMapIntensity:a=1.4}={}){return new l({color:e,metalness:t,roughness:n,clearcoat:r,clearcoatRoughness:i,envMapIntensity:a})}function g({color:e=1184274,roughness:t=.9,metalness:n=0}={}){return new i({color:e,roughness:t,metalness:n})}function _(e){let t=[],n=new Set;return e.traverse(e=>{let r=Array.isArray(e.material)?e.material:e.material?[e.material]:[];for(let e of r){if(n.has(e.uuid))continue;n.add(e.uuid);let r={name:e.name||`(unnamed)`,type:e.type,issues:[]};e.isMeshBasicMaterial&&r.issues.push(`unlit — MeshBasicMaterial cannot carry a lit subject`),(e.isMeshLambertMaterial||e.isMeshPhongMaterial)&&r.issues.push(`legacy shading — no env response worth the name`),e.map&&e.map.colorSpace!==`srgb`&&r.issues.push(`colour map not tagged sRGB (DNA56)`);for(let t of[`normalMap`,`roughnessMap`,`metalnessMap`,`aoMap`])e[t]&&e[t].colorSpace===`srgb`&&r.issues.push(`${t} tagged sRGB — data maps are linear (DNA56)`);r.issues.length&&t.push(r)}}),t}export{m as a,p as i,h as n,g as r,_ as t};