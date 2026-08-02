import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAudio } from '../../context/AudioManager';

/**
 * Preloader
 *
 * The drawing sheet. While assets load, the title block fills in and a
 * dimension line measures out progress; when the scene is ready the sheet is
 * cut down its centreline and the two halves are drawn off the table.
 *
 * Progress is driven entirely through refs and GSAP, writing to the DOM
 * directly. Re-rendering React 60 times a second here would compete with the
 * very asset decoding this screen exists to cover.
 */

/** ISO section cut — a dash-dot centreline with ticks at each end. */
const CutLine = ({ pathRef }) => (
    <svg
        className="preloader__cut"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
    >
        <path
            ref={pathRef}
            d="M 50 0 L 50 100"
            fill="none"
            stroke="#35c8f5"
            strokeWidth="0.22"
            strokeDasharray="4 1.4 0.6 1.4"
            vectorEffect="non-scaling-stroke"
        />
    </svg>
);

const Preloader = ({ onComplete, ready }) => {
    const [isDone, setIsDone] = useState(false);
    const [realProgress, setRealProgress] = useState(0);
    const [active, setActive] = useState(true);
    const [targetProgress, setTargetProgress] = useState(0);

    const { play } = useAudio();

    const containerRef = useRef(null);
    const leftHalfRef = useRef(null);
    const rightHalfRef = useRef(null);
    const cutLeftRef = useRef(null);
    const cutRightRef = useRef(null);
    const readoutLeftRef = useRef(null);
    const readoutRightRef = useRef(null);
    const barLeftRef = useRef(null);
    const barRightRef = useRef(null);

    const displayProgressRef = useRef(0);
    const trackerRef = useRef({ val: 0 });
    const readyRef = useRef(ready);
    const exitStarted = useRef(false);

    useEffect(() => {
        readyRef.current = ready;
    }, [ready]);

    // --- Track three.js asset loading -------------------------------------
    useEffect(() => {
        let raf = 0;
        const manager = THREE.DefaultLoadingManager;
        const origOnStart = manager.onStart;
        const origOnProgress = manager.onProgress;
        const origOnLoad = manager.onLoad;

        manager.onStart = (url, loaded, total) => {
            setActive(true);
            origOnStart?.(url, loaded, total);
        };

        // Coalesce to one state write per frame — the loader fires this per
        // asset and can otherwise overflow React's update depth.
        manager.onProgress = (url, loaded, total) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setRealProgress((loaded / total) * 100));
            origOnProgress?.(url, loaded, total);
        };

        manager.onLoad = () => {
            cancelAnimationFrame(raf);
            setRealProgress(100);
            setActive(false);
            origOnLoad?.();
        };

        return () => {
            cancelAnimationFrame(raf);
            manager.onStart = origOnStart;
            manager.onProgress = origOnProgress;
            manager.onLoad = origOnLoad;
        };
    }, []);

    // Assets only account for 85% of the bar; the rest is shader compilation,
    // which reports nothing. Holding at 90 until `ready` avoids the bar sitting
    // at 100% while the scene is visibly still warming up.
    useEffect(() => {
        const next = active ? (realProgress / 100) * 85 : ready ? 100 : 90;
        setTargetProgress((prev) => Math.max(prev, next));
    }, [realProgress, active, ready]);

    useEffect(() => {
        const distance = targetProgress - displayProgressRef.current;
        const duration = distance > 60 ? 1.5 : distance > 30 ? 1.0 : distance > 10 ? 0.6 : 0.4;

        gsap.to(trackerRef.current, {
            val: targetProgress,
            duration,
            ease: 'power2.out',
            overwrite: true,
            onUpdate: () => {
                const val = Math.min(100, Math.max(0, trackerRef.current.val));
                displayProgressRef.current = val;

                const text = `${Math.round(val).toString().padStart(3, '0')}`;
                if (readoutLeftRef.current) readoutLeftRef.current.innerText = text;
                if (readoutRightRef.current) readoutRightRef.current.innerText = text;
                if (barLeftRef.current) barLeftRef.current.style.transform = `scaleX(${val / 100})`;
                if (barRightRef.current) barRightRef.current.style.transform = `scaleX(${val / 100})`;

                if (val >= 99.5 && readyRef.current && !exitStarted.current) startExit();
            },
        });
    }, [targetProgress]);

    // Covers the case where `ready` flips true after the bar already hit 100.
    useEffect(() => {
        if (displayProgressRef.current >= 99.5 && ready && !exitStarted.current) startExit();
    }, [ready]);

    const startExit = () => {
        exitStarted.current = true;
        play('ui-sheet', { volume: 0.5 });

        const tl = gsap.timeline({
            onComplete: () => {
                setIsDone(true);
                onComplete?.();
            },
        });

        // The cut is made first, then the halves are drawn off the table.
        tl.to([cutLeftRef.current, cutRightRef.current], {
            opacity: 1,
            duration: 0.25,
            ease: 'none',
        });

        tl.to(leftHalfRef.current, { xPercent: -100, duration: 1.5, ease: 'power3.inOut' }, 'cut');
        tl.to(rightHalfRef.current, { xPercent: 100, duration: 1.5, ease: 'power3.inOut' }, 'cut');
        tl.to(containerRef.current, { opacity: 0, duration: 0.45 }, '-=0.45');
    };

    if (isDone) return null;

    const initial = `${Math.round(displayProgressRef.current).toString().padStart(3, '0')}`;

    // Each half carries a full copy of the title block, clipped to its side of
    // the cut. When they separate, the block splits cleanly down the middle.
    const titleBlock = (readoutRef, barRef) => (
        <div className="preloader__block">
            <div className="preloader__id">
                <span className="preloader__name">PRABHAV SHARMA</span>
                <span className="preloader__role">Frontend &amp; AI Engineer</span>
            </div>

            <div className="preloader__meter">
                <div className="preloader__track">
                    <div className="preloader__fill" ref={barRef} />
                </div>
                <div className="preloader__readout">
                    <span ref={readoutRef}>{initial}</span>
                    <span className="preloader__unit">%</span>
                </div>
            </div>

            <div className="preloader__meta">
                <span>DWG. PS-2026</span>
                <span>SCALE 1:1</span>
                <span>REV. 02</span>
            </div>
        </div>
    );

    return (
        <div
            className="preloader"
            ref={containerRef}
            role="progressbar"
            aria-label="Loading portfolio"
        >
            <div
                className="preloader__half preloader__half--left"
                ref={leftHalfRef}
                style={{ clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)' }}
            >
                {titleBlock(readoutLeftRef, barLeftRef)}
                <CutLine pathRef={cutLeftRef} />
            </div>

            <div
                className="preloader__half preloader__half--right"
                ref={rightHalfRef}
                style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}
            >
                {titleBlock(readoutRightRef, barRightRef)}
                <CutLine pathRef={cutRightRef} />
            </div>
        </div>
    );
};

export default Preloader;
