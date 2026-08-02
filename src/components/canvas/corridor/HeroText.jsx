import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { FONT_DISPLAY, FONT_MONO } from '../../../config/fonts';

/**
 * HeroText
 *
 * The name and role, standing in the corridor at eye level. As the camera
 * approaches, the letters dodge outward so you pass *through* the name rather
 * than into it, then close again behind you.
 *
 * Scales fluidly with viewport width rather than at breakpoints, so the name
 * never clips on narrow screens.
 */
const HeroText = ({ position = [0, 0.3, 0] }) => {
    const groupRef = useRef();
    const letterRefs = useRef([]);
    const taglineRefs = useRef([]);
    const { camera } = useThree();

    // Responsive scale based on screen width - FLUID (no breakpoints)
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            const minWidth = 320;
            const maxWidth = 1200;
            const minScale = 0.65;
            const maxScale = 1.0;

            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
            const t = (clampedWidth - minWidth) / (maxWidth - minWidth);
            setScale(minScale + t * (maxScale - minScale));
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Split and dodge state
    const splitAmount = useRef(0);
    const targetSplit = useRef(0);
    const floatY = useRef(0);
    // Pre-allocate Vector3 to avoid per-frame garbage collection
    const worldPosVec = useRef(new THREE.Vector3());

    // The name, laid out letter by letter so each can be dodged aside as the
    // camera passes through. splitDir grows outward from the centre so the
    // letters open like a pair of doors rather than sliding as a block.
    const letters = useMemo(() => {
        const name = 'PRABHAV';
        const spacing = 0.55;
        const mid = (name.length - 1) / 2;
        return name.split('').map((char, i) => ({
            char,
            baseX: (i - mid) * spacing,
            // Outermost letters travel furthest.
            splitDir: ((i - mid) / mid) * 2.0,
        }));
    }, []);

    // Tagline tokens, positioned by measuring the string so spacing stays even
    // if the wording changes.
    const taglineWords = useMemo(() => {
        const words = ['<', 'Frontend', '&', 'AI', 'Engineer', '/>'];
        const gap = 0.09;
        const perChar = 0.085;
        const widths = words.map((w) => w.length * perChar);
        const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);

        let cursor = -total / 2;
        const mid = (words.length - 1) / 2;

        return words.map((text, i) => {
            const baseX = cursor + widths[i] / 2;
            cursor += widths[i] + gap;
            return { text, baseX, splitDir: ((i - mid) / mid) * 2.0 };
        });
    }, []);

    // Animation loop
    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // === SPLIT LOGIC based on camera distance ===
        groupRef.current.getWorldPosition(worldPosVec.current);
        const distance = camera.position.z - worldPosVec.current.z;

        const SPLIT_START = 3;
        const SPLIT_PEAK = 0;
        const SPLIT_END = -2;
        const SPLIT_AMOUNT = 0.9;

        if (distance > SPLIT_PEAK && distance < SPLIT_START) {
            const t = (SPLIT_START - distance) / (SPLIT_START - SPLIT_PEAK);
            targetSplit.current = SPLIT_AMOUNT * easeOutQuad(t);
        } else if (distance <= SPLIT_PEAK && distance > SPLIT_END) {
            const t = (distance - SPLIT_END) / (SPLIT_PEAK - SPLIT_END);
            targetSplit.current = SPLIT_AMOUNT * easeOutQuad(t);
        } else {
            targetSplit.current = 0;
        }

        splitAmount.current = THREE.MathUtils.lerp(splitAmount.current, targetSplit.current, 0.08);

        // Apply split to each letter of the name
        letterRefs.current.forEach((ref, i) => {
            if (ref) {
                // Ensure opacity is 1
                if (ref.material) ref.material.opacity = 1;
                ref.scale.setScalar(1); // Ensure scale is 1, no lingering pop effect

                const letter = letters[i];
                ref.position.x = letter.baseX + letter.splitDir * splitAmount.current;
                ref.position.y = 0.2 + Math.sin(time * 0.7 + i * 0.5) * 0.015;
                ref.rotation.z = Math.sin(time * 0.5 + i) * 0.02 * (1 + splitAmount.current);
            }
        });

        // Apply split to tagline words
        taglineRefs.current.forEach((ref, i) => {
            if (ref) {
                // Ensure opacity is 1
                if (ref.material) ref.material.opacity = 1;

                const word = taglineWords[i];
                ref.position.x = word.baseX + word.splitDir * splitAmount.current * 0.6;
                ref.position.y = -0.45 + Math.sin(time * 0.6 + i * 0.3) * 0.008;
            }
        });

        // === FLOATING ANIMATION ===
        floatY.current = Math.sin(time * 0.5) * 0.02;
        // Don't override Y position entirely, add to base
        groupRef.current.position.y = position[1] + floatY.current;
    });

    return (
        <group ref={groupRef} position={position} scale={[scale, scale, 1]}>
            {/* The name. Keyed by index, not by character — "PRABHAV" repeats
                the letter A, and a character key would collide. */}
            {letters.map((letter, i) => (
                <Text
                    key={`ltr-${i}`}
                    ref={(el) => (letterRefs.current[i] = el)}
                    position={[letter.baseX, 0.2, 0]}
                    fontSize={0.9}
                    font={FONT_DISPLAY}
                    color="#eaf6ff"
                    outlineWidth={0.014}
                    outlineColor="#35c8f5"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.02}
                >
                    {letter.char}
                </Text>
            ))}

            {/* Tagline, set in the blueprint's annotation voice. */}
            {taglineWords.map((word, i) => (
                <Text
                    key={`tag-${i}`}
                    ref={(el) => (taglineRefs.current[i] = el)}
                    position={[word.baseX, -0.55, 0.3]}
                    fontSize={0.16}
                    font={FONT_MONO}
                    color="#7fb4d0"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.06}
                >
                    {word.text}
                </Text>
            ))}

            {/* Small decorative doodles around title */}
            <SmallStar position={[-1.2, 0.55, 0]} scale={0.07} />
            <SmallStar position={[1.25, 0.45, 0]} scale={0.05} />
            <SmallStar position={[-1.0, -0.6, 0]} scale={0.04} />
            <SmallStar position={[1.1, -0.55, 0]} scale={0.035} />
        </group>
    );
};

// Easing function
const easeOutQuad = (t) => t * (2 - t);

/**
 * Small decorative star - STATIC to avoid useFrame overhead
 * Parent HeroText already handles all animations
 */
const SmallStar = ({ position, scale = 0.1 }) => {
    return (
        <group position={position} scale={scale}>
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
                    <planeGeometry args={[1, 0.12]} />
                    <meshBasicMaterial color="#333" transparent opacity={0.6} side={2} />
                </mesh>
            ))}
        </group>
    );
};

export default HeroText;
