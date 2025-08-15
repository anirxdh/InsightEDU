import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
			const scale = 1.8 / maxDim; // Original scale
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
	const controlsRef = useRef();
	const cameraRef = useRef();

	// Fixed initial camera state
	const INITIAL_CAMERA = useRef({
		position: new THREE.Vector3(-6, 4, -6),
		target: new THREE.Vector3(0, 0, 0),
		fov: 48,
		distance: Math.sqrt(6 * 6 + 4 * 4 + 6 * 6),
	});

	useEffect(() => {
		// Initialize camera and controls to fixed state once on mount
		const init = () => {
			if (!controlsRef.current || !cameraRef.current) return false;
			const cam = cameraRef.current;
			cam.position.copy(INITIAL_CAMERA.current.position);
			cam.fov = INITIAL_CAMERA.current.fov;
			cam.updateProjectionMatrix();
			controlsRef.current.target.copy(INITIAL_CAMERA.current.target);
			controlsRef.current.update();
			// Save as the canonical reset state
			controlsRef.current.saveState();
			return true;
		};
		// Try immediately, then retry shortly until ready
		if (!init()) {
			const id = setInterval(() => {
				if (init()) clearInterval(id);
			}, 50);
			return () => clearInterval(id);
		}
	}, []);

	// Additional effect to ensure camera is set correctly on component mount
	useEffect(() => {
		const timer = setTimeout(() => {
			if (controlsRef.current && cameraRef.current) {
				controlsRef.current.reset();
			}
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div style={{ width: '100%', height: '100%', background: 'transparent' }}>
			<Canvas
				key="chemistry-lab-canvas"
				camera={{ 
					position: [-6, 4, -6], // Original camera position
					fov: 48, // Original FOV
					near: 0.1,
					far: 1000
				}}
				style={{ background: 'transparent' }}
				gl={{ 
					antialias: true,
					alpha: true,
					preserveDrawingBuffer: true
				}}
				onCreated={({ camera }) => {
					cameraRef.current = camera;
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
					ref={controlsRef}
					enablePan={false}
					enableZoom={false} // Never allow zooming (prevents zooming out)
					enableRotate={true}
					minDistance={INITIAL_CAMERA.current.distance}
					maxDistance={INITIAL_CAMERA.current.distance}
					autoRotate={false}
					onStart={() => setIsInteracting(true)}
					onEnd={() => {
						// On interaction end, snap back to the saved state to ensure angle/zoom are identical
						if (controlsRef.current) {
							controlsRef.current.reset();
						}
						setTimeout(() => setIsInteracting(false), 2000);
					}}
				/>
			</Canvas>
		</div>
	);
}

// Preload the model
useGLTF.preload('/models/chemistry_lab.gltf');
