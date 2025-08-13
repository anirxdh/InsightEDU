import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function ChemistryLabModel() {
  const gltf = useGLTF('/models/chemistry_lab.gltf');
  const modelRef = useRef();

  useFrame((state) => {
    // Gentle anti-clockwise rotation animation with limited range
    if (modelRef.current) {
      const time = state.clock.elapsedTime * 0.2; // Slower rotation
      const rotationRange = 0.3; // Limited rotation range (about 17 degrees each way)
      modelRef.current.rotation.y = Math.sin(time) * rotationRange;
    }
  });

  useEffect(() => {
    if (gltf.scene) {
      // Center the model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);
      
      // Scale the model to fit nicely
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.8 / maxDim; // Balanced scale - not too small, not too large
      gltf.scene.scale.setScalar(scale);
    }
  }, [gltf]);

  return (
    <primitive 
      ref={modelRef}
      object={gltf.scene} 
      position={[0, -1, 0]}
    />
  );
}

export default function ChemistryLab3D() {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas
        camera={{ 
          position: [-6, 4, -6], // Camera positioned on the opposite side (180 degrees)
          fov: 48, // Slightly reduced FOV for better balance
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Environment for better reflections */}
        <Environment preset="city" />
        
        {/* 3D Model */}
        <ChemistryLabModel />
        
        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={12}
          autoRotate={false}
          onStart={() => setIsInteracting(true)}
          onEnd={() => {
            // Delay before resuming auto-rotation
            setTimeout(() => setIsInteracting(false), 2000);
          }}
        />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/models/chemistry_lab.gltf');
