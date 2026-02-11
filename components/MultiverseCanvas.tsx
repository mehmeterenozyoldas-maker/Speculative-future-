
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MultiverseNode, FutureType } from '../types';

interface SceneProps {
  nodes: MultiverseNode[];
  onNodeSelect: (node: MultiverseNode, isMultiSelect: boolean) => void;
  selectedIds: string[];
  backgroundColor: string;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

// Procedural Artifacts: Geometric representations of future types
const ProceduralArtifact: React.FC<{ type: FutureType; color: string }> = ({ type, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
        meshRef.current.rotation.x += delta * 0.5;
        meshRef.current.rotation.y += delta * 0.3;
        
        if (type === FutureType.PREPOSTEROUS) {
            meshRef.current.rotation.z += delta * 0.2;
        }
    }
  });

  const materialProps = {
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.9,
    emissive: color,
    emissiveIntensity: 0.8,
  };

  let geometry;
  switch (type) {
    case FutureType.ROOT:
        geometry = <tetrahedronGeometry args={[0.7, 0]} />;
        break;
    case FutureType.PROBABLE:
        geometry = <boxGeometry args={[0.9, 0.9, 0.9]} />;
        break;
    case FutureType.PLAUSIBLE:
        geometry = <octahedronGeometry args={[0.8, 0]} />;
        break;
    case FutureType.POSSIBLE:
        geometry = <icosahedronGeometry args={[0.8, 0]} />;
        break;
    case FutureType.PREPOSTEROUS:
        geometry = <torusKnotGeometry args={[0.5, 0.15, 100, 16]} />;
        break;
    default:
        geometry = <sphereGeometry args={[0.7, 16, 16]} />;
  }

  return (
    <group position={[0, 1.8, 0]}>
        <Float speed={4} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef}>
                {geometry}
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh scale={0.3}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
        </Float>
    </group>
  );
};

const CameraController: React.FC<{ targetPosition: [number, number, number] | null }> = ({ targetPosition }) => {
    const { controls } = useThree();
    const targetVec = useRef(new THREE.Vector3());
    const defaultTarget = new THREE.Vector3(0, 0, 5);

    useFrame((state, delta) => {
        if (controls) {
            const ctrl = controls as unknown as { target: THREE.Vector3, update: () => void };
            let smoothingSpeed = 2;

            if (targetPosition) {
                targetVec.current.set(...targetPosition);
                smoothingSpeed = 5;
            } else {
                targetVec.current.copy(defaultTarget);
            }
            
            ctrl.target.lerp(targetVec.current, delta * smoothingSpeed);
            ctrl.update();
        }
    });

    return null;
};

const NodeMesh: React.FC<{
  node: MultiverseNode;
  isSelected: boolean;
  onClick: (node: MultiverseNode, isMultiSelect: boolean) => void;
}> = ({ node, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const popScaleRef = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    popScaleRef.current = THREE.MathUtils.lerp(popScaleRef.current, 0, 0.1);

    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;

      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      let targetBaseScale = 1.0;
      
      if (isSelected) {
         targetBaseScale = 1 + Math.sin(t * 3) * 0.1;
         if (material) {
             material.emissiveIntensity = 2.5 + Math.sin(t * 3) * 0.5;
         }
      } else {
        targetBaseScale = hovered ? 1.2 : 1.0;
        if (material) {
            const targetIntensity = hovered ? 1.5 : 0.5;
            material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetIntensity, 0.1);
        }
      }

      const totalTargetScale = targetBaseScale + popScaleRef.current;
      const targetVec = new THREE.Vector3(totalTargetScale, totalTargetScale, totalTargetScale);
      meshRef.current.scale.lerp(targetVec, 0.2);
    }

    if (haloRef.current) {
        haloRef.current.rotation.z -= 0.005;
        haloRef.current.rotation.y -= 0.005;
        const haloScale = 1.0 + Math.sin(t * 2) * 0.05;
        haloRef.current.scale.set(haloScale, haloScale, haloScale);
    }
  });

  return (
    <group position={node.position}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh
                ref={meshRef}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    popScaleRef.current = 0.6;
                    onClick(node, e.shiftKey);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHover(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHover(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <sphereGeometry args={[isSelected ? 0.8 : 0.5, 32, 32]} />
                <meshStandardMaterial
                    color={node.color}
                    emissive={node.color}
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            
            {isSelected && (
                <>
                    <mesh ref={haloRef}>
                        <sphereGeometry args={[1.2, 24, 24]} />
                        <meshBasicMaterial 
                            color={node.color} 
                            wireframe 
                            transparent 
                            opacity={0.3} 
                        />
                    </mesh>
                    <ProceduralArtifact type={node.type} color={node.color} />
                </>
            )}
        </Float>
        {(hovered || isSelected) && (
            <Text
                position={[0, isSelected ? 3.2 : 1.8, 0]}
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {node.title}
            </Text>
        )}
    </group>
  );
};

const TimelineConnection: React.FC<{ start: [number, number, number]; end: [number, number, number]; color: string }> = ({ start, end, color }) => {
  const signalRef = useRef<any>(null);
  const baseRef = useRef<any>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    // Animate signal packet: smooth forward flow
    if (signalRef.current?.material) {
        signalRef.current.material.dashOffset -= delta * 5;
    }
    
    // Animate base path: deeper, organic breathing pulse
    if (baseRef.current?.material) {
        baseRef.current.material.opacity = 0.15 + Math.sin(t * 1.0) * 0.1;
    }
  });

  return (
    <group>
        {/* Base Path - Structure (Thinner) */}
        <Line
            ref={baseRef}
            points={[start, end]}
            color={color}
            lineWidth={0.5} 
            transparent
            opacity={0.2} 
            depthWrite={false}
            toneMapped={false}
        />
        {/* Signal Packet - Distinct data flow */}
        <Line
            ref={signalRef}
            points={[start, end]}
            color={color} 
            lineWidth={1.5}
            transparent
            opacity={0.6}
            dashed
            dashScale={1.5}
            dashSize={0.4} 
            gapSize={5} 
            depthWrite={false}
            toneMapped={false}
        />
    </group>
  );
}

const ManualConnection: React.FC<{ start: [number, number, number]; end: [number, number, number] }> = ({ start, end }) => {
  const coreRef = useRef<any>(null);
  const outerRef = useRef<any>(null);
  const surgeRef = useRef<any>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Core: Solid Gold Beam
    if (coreRef.current?.material) {
        coreRef.current.material.dashOffset -= delta * 2;
        coreRef.current.material.opacity = 0.8 + Math.sin(t * 12) * 0.2; 
    }

    // Outer: Pulsing containment field
    if (outerRef.current?.material) {
        outerRef.current.material.dashOffset += delta * 0.5; 
        outerRef.current.material.opacity = 0.4 + Math.sin(t * 3) * 0.2;
    }

    // Surge: Chaotic electric flicker
    if (surgeRef.current?.material) {
        surgeRef.current.material.dashOffset -= delta * 20;
        surgeRef.current.material.opacity = 0.6 + Math.random() * 0.4; 
    }
  });

  return (
    <group>
        {/* Outer Glow - Wide, pulsing field */}
        <Line
            ref={outerRef}
            points={[start, end]}
            color="#FF4500" // OrangeRed
            lineWidth={20} 
            transparent
            opacity={0.5}
            dashed
            dashScale={1} 
            dashSize={1}
            gapSize={0.5}
            depthWrite={false}
            toneMapped={false}
        />
        {/* Inner Core - Solid Gold Link */}
        <Line
            ref={coreRef}
            points={[start, end]}
            color="#FFD700" // Gold
            lineWidth={6}
            transparent
            opacity={1.0}
            dashed
            dashScale={0.1} 
            dashSize={10} 
            gapSize={0}
            depthWrite={false}
            toneMapped={false}
        />
        {/* Electric Surge - Bright Interference */}
        <Line
            ref={surgeRef}
            points={[start, end]}
            color="#FFFFE0" // Light Yellow
            lineWidth={3}
            transparent
            opacity={0.9}
            dashed
            dashScale={5}
            dashSize={0.5}
            gapSize={3}
            depthWrite={false}
            toneMapped={false}
        />
    </group>
  );
}

const Connections: React.FC<{ nodes: MultiverseNode[] }> = ({ nodes }) => {
    return (
        <group>
            {nodes.map(node => {
                const elements = [];

                if (node.parentId) {
                    const parent = nodes.find(n => n.id === node.parentId);
                    if (parent) {
                        elements.push(
                            <TimelineConnection
                                key={`link-${parent.id}-${node.id}`}
                                start={parent.position}
                                end={node.position}
                                color={node.color}
                            />
                        );
                    }
                }

                if (node.linkedIds) {
                    node.linkedIds.forEach(targetId => {
                        const target = nodes.find(n => n.id === targetId);
                        if (target) {
                             elements.push(
                                <ManualConnection 
                                    key={`manual-link-${node.id}-${target.id}`}
                                    start={node.position}
                                    end={target.position}
                                />
                            );
                        }
                    });
                }

                return elements;
            })}
        </group>
    );
}

export const MultiverseCanvas: React.FC<SceneProps> = ({ nodes, onNodeSelect, selectedIds, backgroundColor, canvasRef }) => {
  const primaryNodeId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const primaryNode = nodes.find(n => n.id === primaryNodeId);

  return (
    <Canvas 
        camera={{ position: [10, 10, 10], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
            if (canvasRef) {
                canvasRef.current = gl.domElement;
            }
        }}
    >
      <color attach="background" args={[backgroundColor]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group>
          {nodes.map((node) => (
            <NodeMesh
              key={node.id}
              node={node}
              isSelected={selectedIds.includes(node.id)}
              onClick={onNodeSelect}
            />
          ))}
          
          <Connections nodes={nodes} />
      </group>

      <OrbitControls 
        makeDefault
        enablePan={true} 
        enableZoom={true} 
        rotateSpeed={0.5} 
        target={[0,0,5]} 
      />
      
      <CameraController targetPosition={primaryNode ? primaryNode.position : null} />
      
      <gridHelper args={[50, 50, 0x222222, 0x111111]} position={[0, -5, 10]} />
    </Canvas>
  );
};
