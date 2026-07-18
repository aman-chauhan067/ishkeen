import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, createPortal, useThree } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  Environment, 
  ScrollControls,
  useScroll,
  Text,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

// --------------------------------------------------------
// Inner Universe (Rendered strictly inside the Lens)
// --------------------------------------------------------
const InnerUniverse = () => {
  const scroll = useScroll();
  
  // Layers
  const pigmentRef = useRef<THREE.Group>(null);
  const organicRef = useRef<THREE.Group>(null);
  const collagenRef = useRef<THREE.Group>(null);
  const poresRef = useRef<THREE.Group>(null);
  const layersRef = useRef<THREE.Group>(null);
  const clinicalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const offset = scroll.offset; // 0 to 1

    // 1. WATERCOLORS (Base layer, diffuses away smoothly by offset 0.3)
    if (pigmentRef.current) {
      pigmentRef.current.position.y = Math.sin(t * 0.05) * 1.5;
      pigmentRef.current.position.x = Math.cos(t * 0.04) * 1.5;
      
      const opacity = Math.max(0, 1 - (offset * 3));
      pigmentRef.current.children.forEach((mesh: any) => {
        if (mesh.material) {
          mesh.material.opacity = mesh.userData.baseOpacity * opacity;
          mesh.scale.x = 1 + Math.sin(t * mesh.userData.speedX) * 0.2;
          mesh.scale.y = 1 + Math.cos(t * mesh.userData.speedY) * 0.2;
        }
      });
    }

    // 2. ORGANIC SKIN STRUCTURES (0.1 to 0.4)
    if (organicRef.current) {
      const v = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (offset - 0.1) * 3.33))));
      organicRef.current.position.z = -10 + (v * 5);
      organicRef.current.children.forEach((c: any) => {
        if (c.material) c.material.opacity = v * 0.6;
      });
    }

    // 3. MICROSCOPIC COLLAGEN (0.3 to 0.6)
    if (collagenRef.current) {
      const v = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (offset - 0.3) * 3.33))));
      collagenRef.current.rotation.x = t * 0.05;
      collagenRef.current.children.forEach((c: any) => {
        if (c.material) c.material.opacity = v * 0.5;
      });
    }

    // 4. PORES (0.5 to 0.8)
    if (poresRef.current) {
      const v = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (offset - 0.5) * 3.33))));
      poresRef.current.scale.setScalar(1 + (v * 0.5));
      poresRef.current.children.forEach((c: any) => {
        if (c.material) c.material.opacity = v * 0.4;
      });
    }

    // 5. SKIN LAYERS TYPOGRAPHY (0.6 to 0.9)
    if (layersRef.current) {
      const v = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (offset - 0.6) * 3.33))));
      layersRef.current.position.y = -5 + (v * 5);
      layersRef.current.children.forEach((c: any) => {
        if (c.material) c.material.opacity = v * 0.8;
      });
    }

    // 6. CLINICAL PHOTOGRAPHY & AI (0.8 to 1.0)
    if (clinicalRef.current) {
      const v = Math.max(0, Math.min(1, (offset - 0.8) * 5));
      clinicalRef.current.position.z = -5 + (v * 3);
      clinicalRef.current.children.forEach((c: any) => {
        if (c.material) c.material.opacity = v;
      });
    }
  });

  return (
    <>
      <ambientLight intensity={2} color="#FCFBF8" />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#FCFBF8" />

      {/* Layer 1: Massive Watercolors (45% pigment coverage) */}
      <group ref={pigmentRef} position={[0, 0, -8]}>
        {/* Soft Sage */}
        <mesh position={[-6, 4, 0]} userData={{ baseOpacity: 0.8, speedX: 0.1, speedY: 0.15 }}>
          <planeGeometry args={[15, 15]} />
          <meshPhysicalMaterial color="#A8B5A2" transparent opacity={0.8} roughness={1} />
        </mesh>
        {/* Ocean Blue / Deep Ocean */}
        <mesh position={[5, -5, -2]} userData={{ baseOpacity: 0.9, speedX: 0.12, speedY: 0.11 }}>
          <planeGeometry args={[18, 18]} />
          <meshPhysicalMaterial color="#253A4A" transparent opacity={0.9} roughness={1} />
        </mesh>
        {/* Peach & Coral */}
        <mesh position={[-4, -6, 1]} userData={{ baseOpacity: 0.75, speedX: 0.08, speedY: 0.14 }}>
          <planeGeometry args={[12, 12]} />
          <meshPhysicalMaterial color="#E89B87" transparent opacity={0.75} roughness={1} />
        </mesh>
        {/* Lavender */}
        <mesh position={[7, 5, -1]} userData={{ baseOpacity: 0.85, speedX: 0.09, speedY: 0.1 }}>
          <planeGeometry args={[14, 14]} />
          <meshPhysicalMaterial color="#C8C4D8" transparent opacity={0.85} roughness={1} />
        </mesh>
        {/* Rose / Mist Blue */}
        <mesh position={[0, 0, -3]} userData={{ baseOpacity: 0.6, speedX: 0.11, speedY: 0.13 }}>
          <planeGeometry args={[20, 20]} />
          <meshPhysicalMaterial color="#8B9EA8" transparent opacity={0.6} roughness={1} />
        </mesh>
      </group>

      {/* Layer 2: Organic Skin Structures */}
      <group ref={organicRef} position={[0, 0, -10]}>
        <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
          <mesh>
            <torusKnotGeometry args={[3, 0.8, 128, 32]} />
            <meshPhysicalMaterial color="#E89B87" wireframe transparent opacity={0} roughness={0.2} transmission={0.9} />
          </mesh>
        </Float>
      </group>

      {/* Layer 3: Microscopic Collagen */}
      <group ref={collagenRef} position={[0, 0, -5]}>
        <mesh position={[-2, 1, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 10, 16]} />
          <meshStandardMaterial color="#F4D3C4" transparent opacity={0} />
        </mesh>
        <mesh position={[2, -1, -2]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.05, 0.05, 8, 16]} />
          <meshStandardMaterial color="#A8B5A2" transparent opacity={0} />
        </mesh>
        <mesh position={[0, 2, 1]} rotation={[0, 0, -Math.PI / 6]}>
          <cylinderGeometry args={[0.15, 0.15, 12, 16]} />
          <meshStandardMaterial color="#C8C4D8" transparent opacity={0} />
        </mesh>
      </group>
      
      {/* Layer 4: Pores */}
      <group ref={poresRef} position={[0, 0, -6]}>
        <mesh position={[1, 2, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#E89B87" transparent opacity={0} />
        </mesh>
        <mesh position={[-2, -1, 1]}>
          <ringGeometry args={[0.8, 0.9, 32]} />
          <meshBasicMaterial color="#5C7E9A" transparent opacity={0} />
        </mesh>
      </group>

      {/* Layer 5: Skin Layers Typography */}
      <group ref={layersRef} position={[0, -5, -4]}>
        <Text fontSize={1.2} color="#253A4A" font="/fonts/Helvetica-Bold.ttf" anchorX="center" letterSpacing={-0.05}>
          EPIDERMIS
        </Text>
        <Text position={[0, -1.5, 0]} fontSize={0.4} color="#5C7E9A" letterSpacing={0.1}>
          0.1mm - 1.5mm
        </Text>
      </group>

      {/* Layer 6: Clinical / AI */}
      <group ref={clinicalRef} position={[0, 0, -6]}>
        <Text fontSize={0.8} color="#253A4A" font="/fonts/Helvetica-Bold.ttf">
          AI CLINICAL ANALYSIS
        </Text>
        <mesh position={[0, -2, 0]}>
          <planeGeometry args={[8, 4]} />
          <meshBasicMaterial color="#5C7E9A" wireframe transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
};

// --------------------------------------------------------
// The Lens Mesh & Pipeline
// --------------------------------------------------------
const LensPipeline = () => {
  const { viewport, size } = useThree();
  const [hovered, setHovered] = useState(false);
  
  // Separate scene for FBO
  const [innerScene] = useState(() => new THREE.Scene());
  const [innerCamera] = useState(() => new THREE.PerspectiveCamera(45, 1, 0.1, 100));

  // High res FBO for the premium glass
  const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(size.width, size.height, {
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    samples: 8,
  }), [size]);

  useFrame((state) => {
    innerCamera.aspect = state.size.width / state.size.height;
    innerCamera.position.copy(state.camera.position);
    innerCamera.rotation.copy(state.camera.rotation);
    innerCamera.updateProjectionMatrix();
    
    // Render the hidden scene
    const oldTarget = state.gl.getRenderTarget();
    state.gl.setRenderTarget(renderTarget);
    state.gl.clear();
    state.gl.render(innerScene, innerCamera);
    state.gl.setRenderTarget(oldTarget);
  });

  // Spring physics for lens tracking (Heavy mass)
  const [springProps, api] = useSpring(() => ({
    position: [0, 0, 0],
    glassIor: 1.45,
    glassAberration: 0.08,
    glassRoughness: 0.02,
    config: { mass: 10, tension: 80, friction: 50 } // Very heavy and slow
  }));

  useFrame((state) => {
    // 20px max travel roughly equals 0.5 world units
    const targetX = (state.pointer.x * viewport.width) / 20;
    const targetY = (state.pointer.y * viewport.height) / 20;
    
    api.start({ 
      position: [targetX, targetY, 0],
      glassIor: hovered ? 1.6 : 1.45,
      glassAberration: hovered ? 0.15 : 0.08,
      glassRoughness: hovered ? 0.05 : 0.02
    });
  });

  // 600-750px is roughly 5 to 7 units in standard FOV depending on camera distance.
  const lensSize = Math.min(viewport.width / 2.5, 6.5);

  return (
    <>
      {createPortal(<InnerUniverse />, innerScene)}

      <animated.mesh 
        position={springProps.position as any}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[lensSize, lensSize, 0.5, 128]} />
        <animated.meshPhysicalMaterial
          roughness={springProps.glassRoughness as any}
          transmission={1}
          thickness={1.5}
          ior={springProps.glassIor as any}
          clearcoat={1}
          clearcoatRoughness={0.1}
          attenuationDistance={5}
          attenuationColor="#FCFBF8"
          color="#ffffff"
        />
        <MeshTransmissionMaterial
          buffer={renderTarget.texture}
          thickness={1.5}
          roughness={0.02}
          transmission={1}
          ior={1.45}
          chromaticAberration={0.08}
          anisotropy={0.3}
          color="#FCFBF8"
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </animated.mesh>
    </>
  );
};

// --------------------------------------------------------
// Main Canvas Wrapper
// --------------------------------------------------------
export const OpticalLens = () => {
  return (
    <div className="absolute right-[5vw] top-1/2 -translate-y-1/2 w-[60vw] h-[100vh] z-0 pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <Environment preset="city" />

          <ScrollControls pages={10} damping={0.1}>
            <LensPipeline />
          </ScrollControls>
        </Canvas>
      </div>
    </div>
  );
};

export default OpticalLens;
