// src/components/3d/CinematicBackground.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CanvasFallback } from './CanvasFallback';

interface Props {
  phase?: string;
  isUrgent?: boolean;
}

export const CinematicBackground: React.FC<Props> = ({ phase = 'LOBBY', isUrgent = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    // 1. Detect WebGL capability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // 2. Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06080F, 0.04);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x0B0F19, 2.5);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x38BDF8, 3, 25);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rimLight = new THREE.DirectionalLight(0x818CF8, 1.8);
    rimLight.position.set(10, 15, 10);
    scene.add(rimLight);

    const amberLight = new THREE.PointLight(0xF59E0B, 0, 20);
    amberLight.position.set(0, -5, 5);
    scene.add(amberLight);

    // 4. Central Mind Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(2.2, 0);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0x0B1224,
      emissive: 0x06B6D4,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true
    });
    const innerCore = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(innerCore);

    // Rotating Concentric Rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: true
    });
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x818CF8,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: true
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.04, 16, 64), ringMat1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.04, 16, 64), ringMat2);
    ring2.rotation.x = Math.PI / 3;
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.04, 16, 64), ringMat1);
    ring3.rotation.y = Math.PI / 4;

    coreGroup.add(ring1);
    coreGroup.add(ring2);
    coreGroup.add(ring3);

    // 5. Floating Number Cubes
    // Generate canvas texture with numbers for the cube faces
    const createNumberTexture = (numStr: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 248);

        ctx.font = 'bold 110px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(numStr, 128, 128);
      }
      return new THREE.CanvasTexture(c);
    };

    const decorativeNumbers = ['7', '42', '89', '?', '13', '99', '21', '64'];
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const cubes: { mesh: THREE.Mesh; rotSpeed: { x: number; y: number }; floatSpeed: number; baseY: number }[] = [];

    decorativeNumbers.forEach((numStr, index) => {
      const texture = createNumberTexture(numStr);
      const cubeMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.25,
        metalness: 0.75,
        emissive: 0x06B6D4,
        emissiveIntensity: 0.15
      });
      const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const mesh = new THREE.Mesh(cubeGeo, cubeMat);

      // Distribute in a spherical orbit
      const angle = (index / decorativeNumbers.length) * Math.PI * 2;
      const radius = 7 + (index % 3) * 2;
      const x = Math.cos(angle) * radius;
      const y = (Math.sin(angle * 2) * 2.5) + (index % 2 === 0 ? 1 : -1);
      const z = Math.sin(angle) * (radius * 0.7) - 2;

      mesh.position.set(x, y, z);
      cubeGroup.add(mesh);

      cubes.push({
        mesh,
        rotSpeed: { x: (Math.random() - 0.5) * 0.015, y: (Math.random() - 0.5) * 0.02 },
        floatSpeed: 0.8 + Math.random() * 0.8,
        baseY: y
      });
    });

    // 6. Particle Field (Neural Dust)
    const particleCount = 700;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = (Math.random() - 0.5) * 25;
      positions[i + 2] = (Math.random() - 0.5) * 25;

      const isCyan = Math.random() > 0.4;
      colors[i] = isCyan ? 0.22 : 0.5;
      colors[i + 1] = isCyan ? 0.74 : 0.55;
      colors[i + 2] = 0.97;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Pointer Responsive Camera Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetCameraX = mouseX * 1.5;
      targetCameraY = mouseY * 1.0;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera lerp
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Core rotation
      const speedMultiplier = phase === 'RESULTS' ? 1.8 : isUrgent ? 1.4 : 1.0;
      coreGroup.rotation.y += 0.005 * speedMultiplier;
      innerCore.rotation.x += 0.01 * speedMultiplier;
      innerCore.rotation.y += 0.012 * speedMultiplier;

      ring1.rotation.z += 0.008 * speedMultiplier;
      ring2.rotation.x += 0.006 * speedMultiplier;
      ring3.rotation.y -= 0.007 * speedMultiplier;

      // Pulse inner core scale slightly
      const pulse = 1 + Math.sin(elapsed * 2.5) * 0.05;
      innerCore.scale.set(pulse, pulse, pulse);

      // Urgency / State light transition
      if (isUrgent) {
        amberLight.intensity = Math.abs(Math.sin(elapsed * 6)) * 4;
        coreLight.color.setHex(0xF59E0B);
      } else if (phase === 'RESULTS') {
        coreLight.color.setHex(0x10B981);
        amberLight.intensity = 1.5;
      } else {
        coreLight.color.setHex(0x38BDF8);
        amberLight.intensity = 0;
      }

      // Animate floating cubes
      cubes.forEach((cube, i) => {
        cube.mesh.rotation.x += cube.rotSpeed.x;
        cube.mesh.rotation.y += cube.rotSpeed.y;
        cube.mesh.position.y = cube.baseY + Math.sin(elapsed * cube.floatSpeed + i) * 0.4;
      });

      // Ambient particle slow drift
      particles.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // 10. Memory and GPU Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      icoGeo.dispose();
      icoMat.dispose();
      ring1.geometry.dispose();
      ring2.geometry.dispose();
      ring3.geometry.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      cubes.forEach(c => {
        c.mesh.geometry.dispose();
        if (Array.isArray(c.mesh.material)) {
          c.mesh.material.forEach(m => m.dispose());
        } else {
          c.mesh.material.dispose();
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phase, isUrgent]);

  if (!hasWebGL) {
    return <CanvasFallback isUrgent={isUrgent} />;
  }

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden"
      aria-hidden="true"
    />
  );
};

