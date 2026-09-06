// The hall — INDEX1 · KR 700 PA
//
// WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT.
//
// A floor, a pool of light on it, and a horizon. Enough architecture to give the
// machine scale, depth, grounding, shadow and atmosphere — and not one element
// more. There is no wall, no gantry, no pallet, no crate, no railing and no light
// fitting anywhere in this file. A machine study is not a diorama, and the moment
// the room has props in it the subject has to compete with them.
//
// WHY IT HAS TO EXIST AT ALL. Before this the machine floated. `scene.fog` had no
// geometry to act on, `createContactShadow` rendered black onto black, and the
// shadow catcher was a ShadowMaterial — a surface invisible except where a shadow
// lands, which over a #0a0c0d page is a shadow drawn in black on black. The key's
// cast shadow, the strongest depth cue available, was in every frame and visible
// in none of them.
//
// THERE ARE NO BAY JOINTS, AND THAT IS A REVERSAL WORTH RECORDING.
//
// The plan specified expansion joints on a 1 m pitch to make 2 744 mm countable
// off the floor. They were built and the argument did not survive the render: a
// regular orthogonal grid receding to a horizon is the single most recognisable
// signature of a 3D viewport, and it read as one immediately — not as concrete,
// as graph paper. The scale job belongs to a dimension line with a figure on it,
// which is measured rather than decorative. The slab is plain.
//
// THE FLOOR IS LIT, NOT PAINTED. No emissive, no baked value. It responds to the
// key, the fill and the environment exactly as the castings do, so the hall gets
// darker in the opening setup and brighter under the specular one without
// anything here knowing which shot is running.

import * as THREE from 'three';

/**
 * ONE DIRECTION FOR THE LIGHT LINE.
 *
 * The environment's bright strip is built along this vector and every key setup
 * in scene.js is a deviation around it. Before, the key sat at (-5.5, 8.5, 3.2)
 * and the strip it was meant to be at (-5, 11, 1): close enough to pass a glance,
 * far enough apart that the highlight running down a casting traced a source the
 * room did not contain. A reflection is a photograph of the room and it has to
 * agree with the lamp.
 *
 * LOWERED for the final hall. At the old elevation (52 degrees) the cast shadow
 * was a short blot under the base. At 30 degrees it is a long raking shape that
 * states where the light is and how far the machine stands from the lens — the
 * strongest compositional element the hall gained.
 */
export const KEY_ANCHOR = new THREE.Vector3(-8.0, 4.9, 2.2).normalize();

/** Where the strip hangs, in metres along the anchor. */
export const KEY_DISTANCE = 14;

export const HALL = {
  /*
    PROVED against the render under ACES at the exposures this page uses.
    One-sided and specific: at the machine's feet the floor must sit clearly
    above --ground (#0a0c0d) so a shadow has somewhere to be dark AGAINST, while
    staying far enough down that the frame is still the near-black hall the whole
    palette was derived for. Measured result at shot 02 — floor 26 at the feet,
    21 toward the horizon, page ground 12.
  */
  colour: 0x2c363c,
  roughness: 0.985,
  metalness: 0.0,

  /*
    THE POOL — the difference between a floor and a room.

    A directional light is infinite, so it lights a flat plane to one even value
    from the machine's feet to the horizon. That is what a sun does, and
    compositionally it is what a backdrop does: the first hall was technically
    correct and read as "the same black composition, now with a grey plane in
    it". Nothing in the frame said the machine was IN anywhere.

    A hall is lit by a line of fittings over the bay the machine stands in, and
    everything outside that bay falls away. This is that falloff and nothing
    else. It is what gives the frame a middle distance to have depth in.

    Applied to the albedo rather than the outgoing radiance because this material
    has no specular lobe left (see below), so for a purely diffuse surface the
    two are the same operation and this one costs a single multiply.

    ANISOTROPIC on purpose: stretched along the light line, so it reads as a
    strip overhead rather than a spotlight aimed at the floor.
  */
  poolRadius: new THREE.Vector2(3.4, 13.0),   // full value within x, gone by y
  poolFloor: 0.045,                           // albedo retained beyond the pool
  poolAniso: new THREE.Vector2(0.60, 1.0),    // stretch along the light line

  /* Big enough that the fog closes before the edge does. Nothing in the frame
     may ever show where the floor stops. */
  size: 170,
};

/**
 * The floor, the pool on it, and the horizon it makes with the fog.
 *
 * @returns {{ floor: THREE.Mesh, material: THREE.Material, pool: object, dispose(): void }}
 */
export function createHall(scene, {
  colour = HALL.colour,
  roughness = HALL.roughness,
  metalness = HALL.metalness,
  poolRadius = HALL.poolRadius,
  poolFloor = HALL.poolFloor,
  poolAniso = HALL.poolAniso,
  size = HALL.size,
  receiveShadow = true,
} = {}) {
  /*
    PHYSICAL, AND SPECULAR-FREE, AND THAT IS WHY IT IS NOT MeshStandard.

    The first cut was MeshStandardMaterial and the floor came out at luma 39
    against a page ground of 12 no matter what was done to it — halving the
    albedo moved it four units, zeroing the environment moved it none. The value
    was not the surface: it was the dielectric specular floor. Every non-metal in
    a PBR renderer carries F0 = 0.04, and at r ~= 0.98 the GGX lobe is so wide it
    lays an even sheen of roughly 0.04 x key x NdotL across the whole slab, which
    no albedo can undo.

    Real cast concrete has that reflectance but its microfacets scatter it into
    the hemisphere; the analytic lobe keeps it coherent and pointed back at the
    lens, which is why CG floors read wet. Zeroing specularIntensity corrects a
    model artefact rather than cheating, and hands the floor's value back to its
    albedo where it can be art-directed.
  */
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colour),
    roughness,
    metalness,
    specularIntensity: 0,
  });

  const pool = {
    uPoolCentre: { value: new THREE.Vector2(0, 0) },
    uPoolRadius: { value: poolRadius.clone() },
    uPoolFloor: { value: poolFloor },
    uPoolAniso: { value: poolAniso.clone() },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, pool);
    shader.vertexShader = `varying vec3 vHallPos;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vHallPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    );
    shader.fragmentShader = `
      varying vec3 vHallPos;
      uniform vec2  uPoolCentre;
      uniform vec2  uPoolRadius;
      uniform float uPoolFloor;
      uniform vec2  uPoolAniso;
      ${shader.fragmentShader}`.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       {
         vec2 q = (vHallPos.xz - uPoolCentre) * uPoolAniso;
         float lit = 1.0 - smoothstep(uPoolRadius.x, uPoolRadius.y, length(q));
         diffuseColor.rgb *= mix(uPoolFloor, 1.0, lit);
       }`,
    );
    material.userData.shader = shader;
  };
  // A distinct key, or three reuses a program compiled from different source.
  material.customProgramCacheKey = () => 'hall-floor-pool-v1';

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = receiveShadow;
  /*
    It never casts. A ground plane in the shadow map buys nothing — there is
    nothing under it — and at this extent it would eat most of the shadow
    camera's depth precision and stipple the machine's own shadow.
  */
  floor.castShadow = false;
  floor.name = 'hall-floor';
  /* Drawn first, so the contact shadow lands on top of it rather than fighting
     it for the same depth. */
  floor.renderOrder = -1;
  scene.add(floor);

  return {
    floor,
    material,
    pool,
    /** Per-shot pool shaping. The bay follows the shot, not the other way round. */
    setPool({ radius, floor: f, aniso } = {}) {
      if (radius) pool.uPoolRadius.value.set(radius[0], radius[1]);
      if (f !== undefined) pool.uPoolFloor.value = f;
      if (aniso) pool.uPoolAniso.value.set(aniso[0], aniso[1]);
    },
    dispose() {
      scene.remove(floor);
      floor.geometry.dispose();
      material.dispose();
    },
  };
}
