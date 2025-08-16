import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Bounds, useBounds } from '@react-three/drei';
import * as THREE from 'three';

function useResizeObserver() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.max(0, Math.floor(width)), height: Math.max(0, Math.floor(height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

function FitOnResize() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);
  return null;
}

function Lab() {
  const group = useRef();
  const { scene } = useGLTF('/models/chemistry_lab.gltf');
  const bounds = useBounds();

  // gentle idle rotation
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime() * 0.2;
      group.current.rotation.y = Math.sin(t) * 0.3;
    }
  });

  // Frame the content ONCE when loaded, not every frame.
  useEffect(() => {
    if (!scene) return;
    // defer a tick so the primitive is in the tree
    requestAnimationFrame(() => {
      bounds.refresh().clip().fit(); // one-time fit; no observe, so no jitter
    });
  }, [scene, bounds]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function ChemistryLab3D() {
  const [containerRef, { width, height }] = useResizeObserver();

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 300, maxHeight: 400, background: 'transparent' }}
    >
      {width > 0 && height > 0 && (
        <Canvas
          camera={{ position: [-4, 3, -4], fov: 48, near: 0.1, far: 1000 }}
          style={{ width, height, background: 'transparent' }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <FitOnResize />

          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          <Environment preset="city" />

          <Suspense fallback={null}>
            {/* No `observe` here to avoid re-fitting on rotation */}
            <Bounds fit clip margin={1}>
              <Lab />
            </Bounds>
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate
            // small damping helps polish interaction without affecting idle stability
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>
      )}
    </div>
  );
}

useGLTF.preload('/models/chemistry_lab.gltf');