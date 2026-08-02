import { useMemo } from 'react';

import { shellMaterial, datumMaterial } from '../shaders/blueprintShell';

// Must stay in sync with CorridorSegment and DoorSection.
const WALL_X_OUTER = 3.5;
const WALL_X_INNER = 1.7;

/**
 * CorridorWalls
 *
 * Draws the shell of one corridor segment: floor, ceiling, and the sawtooth
 * side walls that step inward to form each door recess.
 *
 * Surfaces are drawn by a single shared procedural material (see
 * shaders/blueprintShell). Because the grid is derived from world position,
 * the floor and ceiling need only one plane each rather than a row of tiles,
 * and nothing has to be re-tiled when a segment is recycled.
 *
 * @param {Array} doorPositions - door descriptors: { relativeZ, side, ... }
 * @param {number} zClip - hide anything with Z above this (used during entrance)
 */
const CorridorWalls = ({ zStart = 10, length = 80, doorPositions = [], zClip = 100000 }) => {
    const corridorHeight = 3.5;
    const corridorWidth = 7;

    // Clip the segment against zClip; the entrance sequence uses this to hide
    // the corridor until the doors have opened.
    const effectiveStart = Math.min(zStart, zClip);
    const effectiveLength = effectiveStart - (zStart - length);
    const zCenter = effectiveStart - effectiveLength / 2;

    // How far the datum line stops short of each door recess.
    const DATUM_DOOR_MARGIN = 0.5;

    // Build the wall run for one side, stepping in and out around each door.
    // Walks from the high-Z end of the segment towards the low-Z end.
    const generateWallSegments = (side) => {
        const segments = [];
        const isLeft = side === 'left';
        const baseX = isLeft ? -WALL_X_OUTER : WALL_X_OUTER;
        const innerX = isLeft ? -WALL_X_INNER : WALL_X_INNER;

        let currentZ = effectiveStart;
        const endZ = effectiveStart - effectiveLength;

        // relativeZ values are negative; sort so the nearest door comes first.
        const sideDoors = doorPositions
            .filter((d) => d.side === side)
            .sort((a, b) => b.relativeZ - a.relativeZ);

        sideDoors.forEach((door) => {
            const doorZ = zStart + door.relativeZ; // world Z, from the unclipped start
            const doorStartZ = doorZ + 2.0;
            const doorEndZ = doorZ - 2.0;

            if (doorStartZ > currentZ) return; // already clipped away
            if (doorEndZ < endZ) return;       // beyond this segment

            // Straight run up to the recess.
            if (currentZ > doorStartZ) {
                const segLength = currentZ - doorStartZ;
                segments.push({
                    type: 'filler',
                    position: [baseX, 0, currentZ - segLength / 2],
                    rotation: [0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0],
                    width: segLength,
                    isLeft,
                    trimLowZ: true, // butts against the recess
                });
            }

            // The angled cheek of the recess, running from outer X to inner X.
            const dx = innerX - baseX;
            const dz = doorEndZ - doorStartZ;
            const baseRotation = -Math.atan2(dz, dx);

            segments.push({
                type: 'door',
                position: [(baseX + innerX) / 2, 0, (doorStartZ + doorEndZ) / 2],
                // The right wall's plane faces away by default; flipping it by PI
                // turns the normal back into the corridor.
                rotationY: isLeft ? baseRotation : baseRotation + Math.PI,
                width: Math.sqrt(dx * dx + dz * dz),
                side,
            });

            // The return face that brings the wall back out to its base X.
            segments.push({
                type: 'connector',
                position: [(innerX + baseX) / 2, 0, doorEndZ],
                rotationY: Math.PI,
                width: Math.abs(baseX - innerX),
            });

            currentZ = doorEndZ;
        });

        // Remainder of the run past the last door.
        if (currentZ > endZ) {
            const segLength = currentZ - endZ;
            segments.push({
                type: 'filler',
                position: [baseX, 0, currentZ - segLength / 2],
                rotation: [0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0],
                width: segLength,
                isLeft,
                trimHighZ: currentZ !== effectiveStart,
            });
        }

        return segments;
    };

    const leftSegments = useMemo(
        () => generateWallSegments('left'),
        [effectiveStart, effectiveLength, doorPositions]
    );
    const rightSegments = useMemo(
        () => generateWallSegments('right'),
        [effectiveStart, effectiveLength, doorPositions]
    );

    // Fully clipped — nothing to draw. Checked after the hooks so hook order
    // stays stable across renders.
    if (effectiveLength <= 0) return null;

    return (
        <group>
            {/* Floor and ceiling: one plane each. The world-space grid keeps
                them continuous with neighbouring segments. */}
            <mesh
                position={[0, -corridorHeight / 2, zCenter]}
                rotation={[-Math.PI / 2, 0, 0]}
                material={shellMaterial}
            >
                <planeGeometry args={[corridorWidth, effectiveLength]} />
            </mesh>

            <mesh
                position={[0, corridorHeight / 2, zCenter]}
                rotation={[Math.PI / 2, 0, 0]}
                material={shellMaterial}
            >
                <planeGeometry args={[corridorWidth, effectiveLength]} />
            </mesh>

            {/* Straight wall runs only. The angled door cheeks and their
                connectors are drawn by DoorSection, which owns them along with
                the door and its label — rendering them here too would z-fight. */}
            {[...leftSegments, ...rightSegments].filter((seg) => seg.type === 'filler').map((seg, i) => {
                // The datum line is inset from any adjoining recess so it reads
                // as stopping at the doorway rather than running through it.
                const marginHighZ = seg.trimHighZ ? DATUM_DOOR_MARGIN : 0;
                const marginLowZ = seg.trimLowZ ? DATUM_DOOR_MARGIN : 0;
                const datumWidth = seg.width - marginHighZ - marginLowZ;

                // Local +X maps to world -Z on the left wall and +Z on the
                // right, so the recentring offset flips between sides.
                const datumOffsetX = seg.isLeft
                    ? (marginLowZ - marginHighZ) / 2
                    : (marginHighZ - marginLowZ) / 2;

                return (
                    <group key={`fill-${i}`} position={seg.position} rotation={seg.rotation}>
                        <mesh material={shellMaterial}>
                            <planeGeometry args={[seg.width, corridorHeight]} />
                        </mesh>

                        {datumWidth > 0 && (
                            <mesh
                                position={[datumOffsetX, -corridorHeight / 2 + 0.03, 0.01]}
                                material={datumMaterial}
                            >
                                <planeGeometry args={[datumWidth, 0.02]} />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
};

export default CorridorWalls;
