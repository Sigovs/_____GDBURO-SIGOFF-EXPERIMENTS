// Contact shadow, always (DNA59). An object with no contact shadow floats and
// reads as a render — it is the most reliable of the 3D tells (DNA83).
//
// This is a soft ground shadow rendered from below into a blurred texture, not a
// shadow-map: it gives the tight darkening where the object meets the ground,
// which a directional shadow map at web resolutions never does. The key light's
// own shadow map still handles the long cast shadow; the two are different jobs.
//
// Method after three's webgl_shadow_contact example, wrapped so a scene gets it
// in one call and disposes it in one call.

import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

export function createContactShadow(scene, {
  size = 4,            // ground extent, in scene units — set it to the subject's footprint
  height = 0.5,        // how far above the ground still contributes; small = tight contact
  resolution = 512,
  blur = 3.5,
  darkness = 1.4,
  opacity = 0.85,
  y = 0,
} = {}) {
  const group = new THREE.Group();
  group.name = 'contact-shadow';
  group.position.y = y;
  scene.add(group);

  const target = new THREE.WebGLRenderTarget(resolution, resolution);
  target.texture.generateMipmaps = false;
  const blurTarget = new THREE.WebGLRenderTarget(resolution, resolution);
  blurTarget.texture.generateMipmaps = false;

  const geometry = new THREE.PlaneGeometry(size, size).rotateX(Math.PI / 2);

  const plane = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      map: target.texture,
      opacity,
      transparent: true,
      depthWrite: false,
    }),
  );
  plane.renderOrder = 1;
  plane.scale.y = -1; // the render target's y is flipped
  group.add(plane);

  const blurPlane = new THREE.Mesh(geometry);
  blurPlane.visible = false;
  group.add(blurPlane);

  const shadowCamera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, height);
  shadowCamera.rotation.x = Math.PI / 2; // looks up, from the ground
  group.add(shadowCamera);

  const depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.userData.darkness = { value: darkness };
  depthMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.darkness = depthMaterial.userData.darkness;
    const from = 'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );';
    const to = 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );';
    if (!shader.fragmentShader.includes(from)) {
      console.warn('[contact-shadow] depth shader shape changed in this three version — shadow will be inverted');
    }
    shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader}`.replace(from, to);
  };
  depthMaterial.depthTest = false;
  depthMaterial.depthWrite = false;

  const horizontal = new THREE.ShaderMaterial(HorizontalBlurShader);
  horizontal.depthTest = false;
  const vertical = new THREE.ShaderMaterial(VerticalBlurShader);
  vertical.depthTest = false;

  const blurShadow = (renderer, amount) => {
    blurPlane.visible = true;

    blurPlane.material = horizontal;
    horizontal.uniforms.tDiffuse.value = target.texture;
    horizontal.uniforms.h.value = (amount * 1) / 256;
    renderer.setRenderTarget(blurTarget);
    renderer.render(blurPlane, shadowCamera);

    blurPlane.material = vertical;
    vertical.uniforms.tDiffuse.value = blurTarget.texture;
    vertical.uniforms.v.value = (amount * 1) / 256;
    renderer.setRenderTarget(target);
    renderer.render(blurPlane, shadowCamera);

    blurPlane.visible = false;
  };

  /**
   * Call once per frame, before the main render. For a scene whose subject does
   * not move, call it once and then stop — it is a full extra scene pass.
   */
  const update = (renderer) => {
    const background = scene.background;
    const clearAlpha = renderer.getClearAlpha();
    scene.background = null;
    scene.overrideMaterial = depthMaterial;
    renderer.setClearAlpha(0);

    renderer.setRenderTarget(target);
    renderer.render(scene, shadowCamera);

    scene.overrideMaterial = null;
    blurShadow(renderer, blur);
    blurShadow(renderer, blur * 0.4);

    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clearAlpha);
    scene.background = background;
  };

  return {
    group,
    plane,
    update,
    set opacity(v) {
      plane.material.opacity = v;
    },
    dispose() {
      target.dispose();
      blurTarget.dispose();
      geometry.dispose();
      plane.material.dispose();
      depthMaterial.dispose();
      horizontal.dispose();
      vertical.dispose();
      scene.remove(group);
    },
  };
}

/**
 * A plain shadow-catcher for the long cast shadow from the key light. Invisible
 * except where a shadow lands, so it never becomes a visible floor unless the
 * art direction asked for one.
 */
export function createShadowCatcher(scene, { size = 40, opacity = 0.35, y = 0 } = {}) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShadowMaterial({ opacity }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  mesh.name = 'shadow-catcher';
  scene.add(mesh);
  return mesh;
}
