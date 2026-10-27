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

    // 2. Three.js Scene Setup (Dark Obsidian Arena)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070B0D, 0.05);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);

    // 3. Dynamic Restrained Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0x101719, 1.8);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0xA8C66C, 1.2, 24);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rimLight = new THREE.DirectionalLight(0xC6A45A, 0.8);
    rimLight.position.set(10, 15, 10);
    scene.add(rimLight);

    const amberLight = new THREE.PointLight(0x151D1D, 0, 20);
    amberLight.position.set(0, -5, 5);
    scene.add(amberLight);

    // 4. Central Mind Core (Obsidian Polyhedron with Engraved Gold Armature)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(2.2, 0);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0x0D1017,
      emissive: 0x8C6D34,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: true
    });
    const innerCore = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(innerCore);

    // Rotating Concentric Antique Gold Rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: true
    });
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xC5A059,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: true
    });
    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0x8C6D34,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: true
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.04, 16, 64), ringMat1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.04, 16, 64), ringMat2);
    ring2.rotation.x = Math.PI / 3;
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.04, 16, 64), ringMat3);
    ring3.rotation.y = Math.PI / 4;

    coreGroup.add(ring1);
    coreGroup.add(ring2);
    coreGroup.add(ring3);

    // 5. Floating Number Cubes (Obsidian Stone with Inscribed Antique Gold Numerals)
    const createNumberTexture = (numStr: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#101719';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = 'rgba(168, 198, 108, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, 240, 240);

        ctx.strokeStyle = 'rgba(41, 49, 48, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, 224, 224);

        ctx.font = 'bold 112px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#F1EBDD';
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
        metalness: 0.8,
        emissive: 0x8C6D34,
        emissiveIntensity: 0.18
      });
      const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const mesh = new THREE.Mesh(cubeGeo, cubeMat);

      // Distribute in a balanced spherical orbit
      const angle = (index / decorativeNumbers.length) * Math.PI * 2;
      const radius = 7 + (index % 3) * 2;
      const x = Math.cos(angle) * radius;
      const y = (Math.sin(angle * 2) * 2.2) + (index % 2 === 0 ? 1 : -1);
      const z = Math.sin(angle) * (radius * 0.7) - 2;

      mesh.position.set(x, y, z);
      cubeGroup.add(mesh);

      cubes.push({
        mesh,
        rotSpeed: { x: (Math.random() - 0.5) * 0.012, y: (Math.random() - 0.5) * 0.016 },
        floatSpeed: 0.8 + Math.random() * 0.6,
        baseY: y
      });
    });

    // 6. Particle Field (Subtle Warm Antique Gold Starlight & Arena Dust)
    const particleCount = 550;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = (Math.random() - 0.5) * 25;
      positions[i + 2] = (Math.random() - 0.5) * 25;

      // Antique Gold (0.83, 0.69, 0.22) & Bronze/Amber (0.90, 0.66, 0.23)
      const isGold = Math.random() > 0.35;
      colors[i] = isGold ? 0.83 : 0.90;
      colors[i + 1] = isGold ? 0.69 : 0.66;
      colors[i + 2] = isGold ? 0.22 : 0.23;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
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
      targetCameraX = mouseX * 1.2;
      targetCameraY = mouseY * 0.8;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. Coordinated Animation Loop
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
      const speedMultiplier = phase === 'RESULTS' ? 1.6 : isUrgent ? 1.4 : 1.0;
      coreGroup.rotation.y += 0.004 * speedMultiplier;
      innerCore.rotation.x += 0.008 * speedMultiplier;
      innerCore.rotation.y += 0.01 * speedMultiplier;

      ring1.rotation.z += 0.007 * speedMultiplier;
      ring2.rotation.x += 0.005 * speedMultiplier;
      ring3.rotation.y -= 0.006 * speedMultiplier;

      // Pulse inner core scale subtly
      const pulse = 1 + Math.sin(elapsed * 2) * 0.04;
      innerCore.scale.set(pulse, pulse, pulse);

      // Urgency / State light transition
      if (isUrgent) {
        amberLight.intensity = Math.abs(Math.sin(elapsed * 6)) * 4;
        coreLight.color.setHex(0xE5A83B);
      } else if (phase === 'RESULTS') {
        coreLight.color.setHex(0xD4AF37);
        amberLight.intensity = 1.8;
      } else {
        coreLight.color.setHex(0xD4AF37);
        amberLight.intensity = 0.4;
      }

      // Animate floating cubes
      cubes.forEach((cube, i) => {
        cube.mesh.rotation.x += cube.rotSpeed.x;
        cube.mesh.rotation.y += cube.rotSpeed.y;
        cube.mesh.position.y = cube.baseY + Math.sin(elapsed * cube.floatSpeed + i) * 0.35;
      });

      // Ambient particle drift
      particles.rotation.y = elapsed * 0.015;

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
      ringMat3.dispose();
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
