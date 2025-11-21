
import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MultiverseNode } from '../types';

interface SceneProps {
  nodes: MultiverseNode[];
  onNodeSelect: (node: MultiverseNode, isMultiSelect: boolean) => void;
  selectedIds: string[];
  backgroundColor: string;
}

// CameraController smoothly moves the OrbitControls target to the selected node or resets to default
const CameraController: React.FC<{ targetPosition: [number, number, number] | null }> = ({ targetPosition }) => {
    const { controls } = useThree();
    const targetVec = useRef(new THREE.Vector3());
    // Default target matches the initial OrbitControls target or the center of the scene
    const defaultTarget = new THREE.Vector3(0, 0, 5);

    useFrame((state, delta) => {
        if (controls) {
            // We cast controls to any because OrbitControls (from drei/three) has a target property
            const ctrl = controls as unknown as { target: THREE.Vector3, update: () => void };
            
            if (targetPosition) {
                targetVec.current.set(...targetPosition);
            } else {
                // If no node is selected, return to the default orbit target
                targetVec.current.copy(defaultTarget);
            }
            
            // Smoothly interpolate the controls target to the node position or default
            // delta * speed determines how fast it tracks
            ctrl.target.lerp(targetVec.current, delta * 4);
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

  // Gentle animation for the nodes
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;

      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      
      if (isSelected) {
         // Pulse scale for main node
         const scale = 1 + Math.sin(t * 3) * 0.1;
         meshRef.current.scale.set(scale, scale, scale);

         // Stronger, brighter pulse for selected state
         if (material) {
             // Base 2.5, varies by +/- 0.5
             material.emissiveIntensity = 2.5 + Math.sin(t * 3) * 0.5;
         }

      } else {
        // Smoothly interpolate scale based on hover state
        // Target scale is 1.3 when hovered, 1.0 normally
        const targetScale = hovered ? 1.3 : 1.0;
        const currentScale = meshRef.current.scale;
        const targetVec = new THREE.Vector3(targetScale, targetScale, targetScale);
        
        currentScale.lerp(targetVec, 0.1);
        
        // Smoothly transition emissive based on hover
        if (material) {
            const targetIntensity = hovered ? 1.5 : 0.5;
            material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetIntensity, 0.1);
        }
      }
    }

    // Halo animation (Rotate opposite to node, slight pulse)
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
                    // Initial value, updated in useFrame
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            
            {/* Distinct Visual Indicator for Selection: Rotating Wireframe Halo */}
            {isSelected && (
                <mesh ref={haloRef}>
                    <sphereGeometry args={[1.2, 24, 24]} />
                    <meshBasicMaterial 
                        color={node.color} 
                        wireframe 
                        transparent 
                        opacity={0.3} 
                    />
                </mesh>
            )}
        </Float>
        {/* Label appears on hover or selection */}
        {(hovered || isSelected) && (
            <Text
                position={[0, 1.8, 0]} // Moved up slightly to clear the halo
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

const ManualConnection: React.FC<{ start: [number, number, number]; end: [number, number, number] }> = ({ start, end }) => {
  const lineRef = useRef<any>(null);

  useFrame((state, delta) => {
    if (lineRef.current && lineRef.current.material) {
        // Animate the dash offset to create a flowing effect
        // We move the offset negatively to make it flow from start to end
        lineRef.current.material.dashOffset -= delta * 2;
    }
  });

  return (
    <Line
        ref={lineRef}
        points={[start, end]}
        color="#FFD700" // Gold for manual connections
        lineWidth={3} // Slightly thicker to indicate importance/difference
        transparent
        opacity={0.9}
        dashed
        dashScale={5} 
        dashSize={0.5}
        gapSize={0.3}
        depthWrite={false}
        toneMapped={false} // Make it appear glowing/unaffected by tone mapping
    />
  );
}

// Connection Lines between nodes (Parent -> Child and Manual Links)
const Connections: React.FC<{ nodes: MultiverseNode[] }> = ({ nodes }) => {
    return (
        <group>
            {nodes.map(node => {
                const elements = [];

                // 1. Parent-Child Timeline Links
                if (node.parentId) {
                    const parent = nodes.find(n => n.id === node.parentId);
                    if (parent) {
                        elements.push(
                            <Line
                                key={`link-${parent.id}-${node.id}`}
                                points={[parent.position, node.position]}
                                color={node.color}
                                lineWidth={1} // Thin line for standard history
                                transparent
                                opacity={0.3} // Very subtle/ghostly
                                depthWrite={false}
                            />
                        );
                    }
                }

                // 2. Manual "Wormhole" Links
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

export const MultiverseCanvas: React.FC<SceneProps> = ({ nodes, onNodeSelect, selectedIds, backgroundColor }) => {
  // Find the primary selected node (last one) for camera tracking
  const primaryNodeId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const primaryNode = nodes.find(n => n.id === primaryNodeId);

  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
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

      {/* makeDefault ensures this control instance is accessible via useThree().controls */}
      <OrbitControls 
        makeDefault
        enablePan={true} 
        enableZoom={true} 
        rotateSpeed={0.5} 
        target={[0,0,5]} 
      />
      
      {/* Helper to smooth track selected nodes */}
      <CameraController targetPosition={primaryNode ? primaryNode.position : null} />
      
      <gridHelper args={[50, 50, 0x222222, 0x111111]} position={[0, -5, 10]} />
    </Canvas>
  );
};
