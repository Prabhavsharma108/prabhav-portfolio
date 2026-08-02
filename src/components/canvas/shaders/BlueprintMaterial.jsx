import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * BlueprintMaterial
 *
 * The single surface material for the corridor shell — walls, floor, ceiling.
 * Everything is drawn procedurally so no texture is fetched, decoded or
 * uploaded for any of it.
 *
 * Three things are happening in the fragment shader:
 *
 *  1. A two-density drafting grid (minor lines, heavier majors every 5th),
 *     antialiased analytically with fwidth so it stays crisp at grazing
 *     angles instead of shimmering the way a tiled bitmap would.
 *
 *  2. The grid is derived from *world* position rather than UVs, projected
 *     onto whichever plane the surface faces. That means the grid runs
 *     continuously across every corridor segment with no seams, which the
 *     infinite-corridor recycling would otherwise make very obvious.
 *
 *  3. A slow plotter sweep — a soft band travelling down -Z, as if the sheet
 *     were still being drawn. It's the one piece of motion in the shell.
 */

const BlueprintMaterial = shaderMaterial(
    {
        uSheet: new THREE.Color('#0c1e30'),
        uMinor: new THREE.Color('#7ecaf2'),
        uMajor: new THREE.Color('#a4d8f2'),
        uAccent: new THREE.Color('#35c8f5'),
        uFog: new THREE.Color('#08131f'),
        uCell: 0.5,          // minor grid pitch, world units
        uMinorAlpha: 0.1,
        uMajorAlpha: 0.26,
        uTime: 0,
        uFadeNear: 14.0,     // where distance fade begins
        uFadeFar: 46.0,      // fully fogged out
        uSweep: 1.0,         // 0 disables the plotter sweep (low-perf tier)
        uOpacity: 1.0,
    },
    /* glsl */ `
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `,
    /* glsl */ `
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        uniform vec3  uSheet;
        uniform vec3  uMinor;
        uniform vec3  uMajor;
        uniform vec3  uAccent;
        uniform vec3  uFog;
        uniform float uCell;
        uniform float uMinorAlpha;
        uniform float uMajorAlpha;
        uniform float uTime;
        uniform float uFadeNear;
        uniform float uFadeFar;
        uniform float uSweep;
        uniform float uOpacity;

        // Antialiased grid coverage. Returns ~1 on a line, 0 between lines.
        // Dividing by fwidth keeps the line one pixel wide no matter how
        // oblique the surface is to the camera.
        float gridMask(vec2 coord, float pitch, float thickness) {
            vec2 c = coord / pitch;
            vec2 d = fwidth(c);
            vec2 g = abs(fract(c - 0.5) - 0.5) / max(d, vec2(1e-5));
            float line = min(g.x, g.y);
            return 1.0 - clamp(line / thickness, 0.0, 1.0);
        }

        void main() {
            // Project world position onto the plane this surface faces, so the
            // grid is continuous across segment boundaries.
            vec3 n = abs(vWorldNormal);
            vec2 coord;
            if (n.y > n.x && n.y > n.z) {
                coord = vWorldPos.xz;            // floor / ceiling
            } else if (n.x > n.z) {
                coord = vec2(vWorldPos.z, vWorldPos.y); // side walls
            } else {
                coord = vWorldPos.xy;            // end caps
            }

            float minor = gridMask(coord, uCell, 1.0);
            float major = gridMask(coord, uCell * 5.0, 1.35);

            vec3 col = uSheet;
            col = mix(col, uMinor, minor * uMinorAlpha);
            col = mix(col, uMajor, major * uMajorAlpha);

            // Plotter sweep: a soft band running away from the camera along -Z.
            // Wrapped over a long period so it reads as occasional, not strobing.
            if (uSweep > 0.5) {
                float head = -mod(uTime * 6.0, 90.0) + 30.0;
                float band = exp(-pow((vWorldPos.z - head) * 0.28, 2.0));
                col += uAccent * band * 0.16;
                col = mix(col, uAccent, major * band * 0.30);
            }

            // Distance fade into the fog colour so segment ends are never visible.
            float dist = length(vWorldPos - cameraPosition);
            float fade = smoothstep(uFadeNear, uFadeFar, dist);
            col = mix(col, uFog, fade);

            gl_FragColor = vec4(col, uOpacity);
            #include <colorspace_fragment>
        }
    `
);

extend({ BlueprintMaterial });

export default BlueprintMaterial;
