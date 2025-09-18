"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo } from "react";

interface PlanetData {
  name: string;
  texture: string;
  distance: number;
  speed: number;
  axialTilt: number;
  ring?: { inner: number; outer: number; color: string; opacity: number };
}

const PLANET_SIZE = 2;

const planets: PlanetData[] = [
  { name: "Mercury", texture: "https://upload.wikimedia.org/wikipedia/commons/2/27/Solarsystemscope_texture_8k_mercury.jpg", distance: 8, speed: 1.59, axialTilt: 0.01 },
  { name: "Venus", texture: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Solarsystemscope_texture_8k_venus_surface.jpg", distance: 12, speed: 1.18, axialTilt: 177.4 },
  { name: "Earth", texture: "https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg", distance: 16, speed: 1, axialTilt: 23.5 },
  { name: "Mars", texture: "https://upload.wikimedia.org/wikipedia/commons/7/70/Solarsystemscope_texture_8k_mars.jpg", distance: 20, speed: 0.81, axialTilt: 25 },
  { name: "Jupiter", texture: "https://upload.wikimedia.org/wikipedia/commons/b/be/Solarsystemscope_texture_2k_jupiter.jpg", distance: 28, speed: 0.43, axialTilt: 3.1 },
  { name: "Saturn", texture: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Solarsystemscope_texture_2k_saturn.jpg", distance: 36, speed: 0.32, axialTilt: 26.7,
    ring: { inner: 1.2, outer: 1.8, color: "gray", opacity: 0.3 } 
  },
  { name: "Uranus", texture: "https://upload.wikimedia.org/wikipedia/commons/9/95/Solarsystemscope_texture_2k_uranus.jpg", distance: 44, speed: 0.23, axialTilt: 97.8,
    ring: { inner: 1.2, outer: 1.8, color: "gray", opacity: 0.3 }
  },
  { name: "Neptune", texture: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_2k_neptune.jpg", distance: 52, speed: 0.18, axialTilt: 28.3 },
];

function Planet({ planet }: { planet: PlanetData }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useLoader(THREE.TextureLoader, planet.texture);
  const orbitRef = useRef(0);

  const orbitGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      points.push(new THREE.Vector3(Math.sin(theta) * planet.distance, 0, Math.cos(theta) * planet.distance));
    }
    geometry.setFromPoints(points);
    return geometry;
  }, [planet.distance]);

  const orbitColor = useMemo(() => {
    const colors = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff6600", "#ff0000", "#66ccff", "#0066ff"];
    const index = planets.findIndex(p => p.name === planet.name);
    return colors[index % colors.length];
  }, [planet.name]);

  useFrame((_, delta) => {
    orbitRef.current += delta * planet.speed;
    const x = Math.sin(orbitRef.current) * planet.distance * (1 + 0.05 * Math.sin(orbitRef.current * 2));
    const z = Math.cos(orbitRef.current) * planet.distance * (1 + 0.05 * Math.cos(orbitRef.current * 1.5));
    meshRef.current.position.set(x, 0, z);
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.rotation.z = THREE.MathUtils.degToRad(planet.axialTilt);
  });

  return (
    <>
      <line>
        <primitive object={orbitGeometry} />
        <lineBasicMaterial color={orbitColor} transparent opacity={0.4} linewidth={2} />
      </line>
      <mesh ref={meshRef}>
        <sphereGeometry args={[PLANET_SIZE, 64, 64]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
        {planet.ring && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[PLANET_SIZE * planet.ring.inner, PLANET_SIZE * planet.ring.outer, 128]} />
            <meshBasicMaterial
              color={planet.ring.color}
              side={THREE.DoubleSide}
              transparent
              opacity={planet.ring.opacity}
            />
          </mesh>
        )}
      </mesh>
    </>
  );
}

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const sunTexture = "https://upload.wikimedia.org/wikipedia/commons/a/a4/Solarsystemscope_texture_8k_sun.jpg";

  useFrame(() => {
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[5, 64, 64]} />
      <meshBasicMaterial map={useLoader(THREE.TextureLoader, sunTexture)} toneMapped={false} />
    </mesh>
  );
}

function GalaxyParticles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const geometry = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const count = 6000;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1200;
  }

  geometry.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  useFrame(() => {
    pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef} geometry={geometry.current}>
      <pointsMaterial color="white" size={0.3} sizeAttenuation />
    </points>
  );
}

// ستاره‌های دنبال‌دار (Shooting Stars)
function ShootingStars() {
  const groupRef = useRef<THREE.Group>(null!);
  const count = 20;
  const stars = useMemo(() => {
    const arr: { position: THREE.Vector3; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        position: new THREE.Vector3(
          Math.random() * 400 - 200,
          Math.random() * 200 + 50,
          Math.random() * 400 - 200
        ),
        speed: Math.random() * 0.5 + 0.5
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    groupRef.current.children.forEach((star, i) => {
      const s = stars[i];
      star.position.add(new THREE.Vector3(s.speed, -s.speed * 0.5, 0));
      if (star.position.x > 200 || star.position.y < 0) {
        star.position.set(Math.random() * -400, Math.random() * 200 + 50, Math.random() * -400);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {stars.map((s, i) => (
        <mesh key={i} position={s.position}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
}

export default function Home() {
  return (
    <main className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 30, 100], fov: 60 }}>
        <Sun />
        {planets.map((p) => (
          <Planet key={p.name} planet={p} />
        ))}
        <GalaxyParticles />
        <ShootingStars />
        <Stars radius={500} depth={200} count={20000} factor={4} saturation={0} fade />
        <OrbitControls enableZoom enableRotate autoRotate={false} />
      </Canvas>
    </main>
  );
}
