// The camera rig. DNA49 — move the camera and its target; do not spin the model.
// DNA53 — scroll drives a target value, damping drives the camera. The camera
// transform is never bound to scroll position directly, which is what makes a
// stopped scroll settle on a composed frame instead of freezing mid-jitter.

import * as THREE from 'three';

/** Frame-rate independent exponential damping. lambda is "how fast", not "how much". */
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

export function createCameraRig(camera, {
  lambda = 4,          // position/target damping. 2 = heavy, 8 = tight
  fovLambda = 3,
  epsilon = 0.0005,    // below this the rig reports settled, so the loop can idle
} = {}) {
  const desired = {
    position: camera.position.clone(),
    target: new THREE.Vector3(0, 0, 0),
    fov: camera.fov,
  };
  const current = {
    position: camera.position.clone(),
    target: desired.target.clone(),
    fov: camera.fov,
  };

  let settled = false;

  return {
    desired,
    current,

    /** Set where the camera *wants* to be. Called from scroll, never from the frame loop's own state. */
    set({ position, target, fov } = {}) {
      if (position) desired.position.copy(position);
      if (target) desired.target.copy(target);
      if (typeof fov === 'number') desired.fov = fov;
      settled = false;
    },

    /** Jump with no damping — for an `interruption` shot, where the seam is the event (DNA50). */
    cut({ position, target, fov } = {}) {
      this.set({ position, target, fov });
      current.position.copy(desired.position);
      current.target.copy(desired.target);
      current.fov = desired.fov;
      this.apply();
    },

    update(dt) {
      if (settled) return true;

      current.position.set(
        damp(current.position.x, desired.position.x, lambda, dt),
        damp(current.position.y, desired.position.y, lambda, dt),
        damp(current.position.z, desired.position.z, lambda, dt),
      );
      current.target.set(
        damp(current.target.x, desired.target.x, lambda, dt),
        damp(current.target.y, desired.target.y, lambda, dt),
        damp(current.target.z, desired.target.z, lambda, dt),
      );
      current.fov = damp(current.fov, desired.fov, fovLambda, dt);

      this.apply();

      settled =
        current.position.distanceToSquared(desired.position) < epsilon * epsilon &&
        current.target.distanceToSquared(desired.target) < epsilon * epsilon &&
        Math.abs(current.fov - desired.fov) < 0.01;

      return settled;
    },

    apply() {
      camera.position.copy(current.position);
      camera.lookAt(current.target);
      if (Math.abs(camera.fov - current.fov) > 0.001) {
        camera.fov = current.fov;
        camera.updateProjectionMatrix();
      }
    },

    get settled() {
      return settled;
    },
  };
}
