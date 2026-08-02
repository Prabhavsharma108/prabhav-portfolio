import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';

import { FONT_MONO } from '../../../config/fonts';

/**
 * ScaleFigure
 *
 * The human figure that appears on architectural drawings to give the viewer a
 * sense of size — here it stands at the centre of the corridor as the thing you
 * walk toward, with its height dimensioned beside it.
 *
 * Drawn entirely from line segments, so it costs no texture and reads as part
 * of the drawing rather than as a character in it. Like the walls, it steps
 * aside as the camera closes in.
 */

const FIGURE_HEIGHT = 1.78; // metres, matching the dimension label

// Outline of a standing figure, as a set of polylines in metres.
const FIGURE_PATHS = [
    // torso and legs
    [[0, 1.42], [0, 0.86]],
    [[-0.16, 0.86], [0.16, 0.86]],
    [[-0.15, 0.86], [-0.13, 0.02]],
    [[0.15, 0.86], [0.13, 0.02]],
    // feet
    [[-0.13, 0.02], [-0.22, 0.02]],
    [[0.13, 0.02], [0.22, 0.02]],
    // shoulders and arms
    [[-0.21, 1.40], [0.21, 1.40]],
    [[-0.21, 1.40], [-0.27, 0.94]],
    [[0.21, 1.40], [0.27, 0.94]],
    // neck
    [[0, 1.50], [0, 1.42]],
];

const HEAD = { cx: 0, cy: 1.61, r: 0.11 };

const ScaleFigure = ({ position = [0, -0.61, -0.3] }) => {
    const groupRef = useRef();
    const { camera } = useThree();

    const dodgeX = useRef(0);
    const targetDodgeX = useRef(0);
    const worldPos = useRef(new THREE.Vector3());

    // Fluid scale so the figure never overwhelms a narrow viewport.
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const update = () => {
            const t = Math.max(0, Math.min(1, (window.innerWidth - 320) / 880));
            setScale(0.78 + t * 0.22);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const headPoints = useMemo(() => {
        const pts = [];
        const SEGMENTS = 28;
        for (let i = 0; i <= SEGMENTS; i++) {
            const a = (i / SEGMENTS) * Math.PI * 2;
            pts.push([HEAD.cx + Math.cos(a) * HEAD.r, HEAD.cy + Math.sin(a) * HEAD.r, 0]);
        }
        return pts;
    }, []);

    const bodyPaths = useMemo(
        () => FIGURE_PATHS.map((path) => path.map(([x, y]) => [x, y, 0])),
        []
    );

    // The dimension line: an extension line at each end, a stem between them.
    const dimension = useMemo(() => {
        const x = 0.52;
        return {
            stem: [[x, 0.02, 0], [x, FIGURE_HEIGHT, 0]],
            lower: [[0.24, 0.02, 0], [x + 0.07, 0.02, 0]],
            upper: [[0.14, FIGURE_HEIGHT, 0], [x + 0.07, FIGURE_HEIGHT, 0]],
        };
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;

        groupRef.current.getWorldPosition(worldPos.current);
        const distance = camera.position.z - worldPos.current.z;

        // Step aside over the last few units of approach, then return.
        const DODGE_START = 4.5;
        const DODGE_AMOUNT = 1.15;
        if (distance > 0 && distance < DODGE_START) {
            const t = 1 - distance / DODGE_START;
            targetDodgeX.current = DODGE_AMOUNT * (t * t);
        } else {
            targetDodgeX.current = 0;
        }
        dodgeX.current = THREE.MathUtils.lerp(dodgeX.current, targetDodgeX.current, 0.07);

        groupRef.current.position.x = position[0] - dodgeX.current;
        // A slow breathing drift so it doesn't read as a static decal.
        groupRef.current.position.y =
            position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.012;
    });

    const line = { color: '#7fd2f2', lineWidth: 1.1, transparent: true, opacity: 0.9 };
    const thin = { color: '#4d9bc4', lineWidth: 1, transparent: true, opacity: 0.55 };

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <Line points={headPoints} {...line} />
            {bodyPaths.map((points, i) => (
                <Line key={`seg-${i}`} points={points} {...line} />
            ))}

            <Line points={dimension.stem} {...thin} />
            <Line points={dimension.lower} {...thin} />
            <Line points={dimension.upper} {...thin} />

            <Text
                position={[0.68, FIGURE_HEIGHT / 2, 0]}
                fontSize={0.1}
                font={FONT_MONO}
                color="#5f8ba6"
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.08}
            >
                1780
            </Text>
        </group>
    );
};

export default ScaleFigure;
