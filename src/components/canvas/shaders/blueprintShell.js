import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import BlueprintMaterial from './BlueprintMaterial';

/**
 * A single shared BlueprintMaterial instance drives every surface of the
 * corridor shell.
 *
 * This matters more than it looks: the corridor recycles segments as the
 * camera travels, so a per-mesh material would mean the renderer compiling
 * and re-binding a program for each of them. One shared instance means one
 * shader program, one uniform upload per frame, and no state changes between
 * the walls, floor and ceiling draw calls.
 */
export const shellMaterial = new BlueprintMaterial();
shellMaterial.side = THREE.DoubleSide;
shellMaterial.toneMapped = false;

/**
 * The datum line — the bright accent stroke where wall meets floor. On a real
 * drawing this is the reference edge everything else is measured from, and it
 * gives the corridor a readable silhouette without any extra geometry detail.
 */
export const datumMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#35c8f5'),
    toneMapped: false,
    transparent: true,
    opacity: 0.55,
});

/** Advances the shell's clock. Mounted exactly once, by the corridor manager. */
export const useShellClock = (enabled = true) => {
    useFrame((_, delta) => {
        if (!enabled) return;
        shellMaterial.uniforms.uTime.value += delta;
    });
};

/** Lower-tier devices drop the sweep pass, which is the only per-pixel extra. */
export const setShellQuality = (isLowTier) => {
    shellMaterial.uniforms.uSweep.value = isLowTier ? 0.0 : 1.0;
};
