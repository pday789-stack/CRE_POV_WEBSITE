import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import logoSvg from '../CRE POV WEBSITE ASSETS/LOGO.svg';
import whiteChessPiecesGlb from '../CRE POV WEBSITE ASSETS/White_Chess_Pieces.glb';
import redChessPiecesGlb from '../CRE POV WEBSITE ASSETS/Red_Chess_Pieces.glb';
import puwWhiteKing from '../CRE POV WEBSITE ASSETS/PUW_WHITE_KING.svg';
import puwWhiteQueen from '../CRE POV WEBSITE ASSETS/PUW_WHITE_QUEEN.svg';
import puwWhiteBishop from '../CRE POV WEBSITE ASSETS/PUW_WHITE_BISHOP.svg';
import puwWhiteKnight from '../CRE POV WEBSITE ASSETS/PUW_WHITE_KNIGHT.svg';
import puwWhiteRook from '../CRE POV WEBSITE ASSETS/PUW_WHITE_ROOK.svg';
import puwWhitePawn from '../CRE POV WEBSITE ASSETS/PUW_WHITE_PAWN.svg';
import puwRedKing from '../CRE POV WEBSITE ASSETS/PUW_RED_KING.svg';
import puwRedQueen from '../CRE POV WEBSITE ASSETS/PUW_RED_QUEEN.svg';
import puwRedBishop from '../CRE POV WEBSITE ASSETS/PUW_RED_BISHOP.svg';
import puwRedKnight from '../CRE POV WEBSITE ASSETS/PUW_RED_KNIGHT.svg';
import puwRedRook from '../CRE POV WEBSITE ASSETS/PUW_RED_ROOK.svg';
import puwRedPawn from '../CRE POV WEBSITE ASSETS/PUW_RED_PAWN.svg';

const PIECE_NODE_NAMES = {
  owner: {
    king: 'White_King',
    queen: 'White_Queen',
    bishop: 'White_Bishop',
    knight: 'White_Knight',
    rook: 'White_Rook',
    pawn: 'White_Pawn',
  },
  risk: {
    king: 'Red_King',
    queen: 'Red_Queen',
    bishop: 'Red_Bishop',
    knight: 'Red_Knight',
    rook: 'Red_Rook',
    pawn: 'Red_Pawn',
  },
};

const PIECE_HEIGHTS = {
  king: 5.8,
  queen: 5.3,
  bishop: 4.8,
  knight: 4.4,
  rook: 3.9,
  pawn: 3.1,
};

const PIECE_IMAGES = {
  owner: {
    king: puwWhiteKing,
    queen: puwWhiteQueen,
    bishop: puwWhiteBishop,
    knight: puwWhiteKnight,
    rook: puwWhiteRook,
    pawn: puwWhitePawn,
  },
  risk: {
    king: puwRedKing,
    queen: puwRedQueen,
    bishop: puwRedBishop,
    knight: puwRedKnight,
    rook: puwRedRook,
    pawn: puwRedPawn,
  },
};

const createEmptyPieceInfo = () => ({
  pieceType: '',
  whiteHeading: '',
  redHeading: '',
  whiteSub: '',
  redSub: '',
  whiteImageSrc: '',
  redImageSrc: '',
  active: false,
});

const buildPieceUiData = (pieceType, config) => ({
  pieceType,
  whiteImageSrc: PIECE_IMAGES.owner[pieceType],
  redImageSrc: PIECE_IMAGES.risk[pieceType],
  ...config,
});

// --- ICON COMPONENTS ---
const ChevronDownIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const MicIcon = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="22"></line>
    <line x1="8" y1="22" x2="16" y2="22"></line>
  </svg>
);

const BrainIcon = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const KnightIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 4C14.5 4 12 2.5 10 3.5C8 4.5 7.5 7 8 8.5C8 8.5 6 9.5 6.5 11.5C7 13.5 8.5 14 8.5 14L8 19H16V14C16 14 17.5 13 18 11.5C18.5 10 16 7.5 16 7.5L14.5 4Z" />
    <path d="M6 20H18V22H6V20Z" />
  </svg>
);

// --- SOCIAL ICONS ---
const LinkedinIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const YoutubeIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const InstagramIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const XIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.267l-11.733-16z"></path>
    <path d="M4 20l6.768-6.768m2.46-2.46l6.772-6.772"></path>
  </svg>
);

const SpotifyIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.08 8.52-.66 11.64 1.32.36.18.48.66.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.38 9.72-.72 13.44 1.56.42.24.54.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.24.54-.96.72-1.56.42z" />
  </svg>
);

const SpacebarIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="10" width="20" height="4" rx="1" />
  </svg>
);

// --- OCTAHEDRON SCENE COMPONENT (SECTION 3) ---
const OctahedronScene = () => {
  const mountRef = useRef(null);
  const scrollRotationRef = useRef(0);
  const targetScrollRotationRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return undefined;

    const scene = new THREE.Scene();
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    camera.position.set(0, 0, 8.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    const currentMount = mountRef.current;
    currentMount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 10);
    scene.add(pointLight);

    const group = new THREE.Group();
    group.scale.set(1.5, 1.5, 1.5);
    scene.add(group);

    const octGeo = new THREE.OctahedronGeometry(2, 0);
    const octMat = new THREE.MeshBasicMaterial({ color: 0xf3f2ee, transparent: true, opacity: 0.95 });
    const octahedron = new THREE.Mesh(octGeo, octMat);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(octGeo),
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }),
    );
    octahedron.add(edges);
    group.add(octahedron);

    const createFaceDecal = (lines) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1A1A1D';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (lines.length === 1) {
        ctx.font = 'bold 70px "Space Grotesk", sans-serif';
        ctx.fillText(lines[0], 256, 256);
      } else {
        ctx.font = 'bold 60px "Space Grotesk", sans-serif';
        ctx.fillText(lines[0], 256, 210);
        ctx.fillText(lines[1], 256, 300);
      }

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: true });
      return new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), mat);
    };

    const topLabels = [['OPERATION'], ['ACQUISITION'], ['SALE'], ['CRE']];
    const bottomLabels = [['MID', 'GAME'], ['OPENING', 'GAME'], ['END', 'GAME'], ['CHESS']];

    const normals = [
      [1, 1, 1],
      [-1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1],
      [1, -1, 1],
      [-1, -1, 1],
      [1, -1, -1],
      [-1, -1, -1],
    ];

    const dist = 2 / Math.sqrt(3) + 0.02;
    normals.forEach((n, i) => {
      const normal = new THREE.Vector3(...n).normalize();
      const pos = normal.clone().multiplyScalar(dist);
      const lines = n[1] > 0 ? topLabels[i] : bottomLabels[i - 4];
      const label = createFaceDecal(lines);
      label.position.copy(pos);
      label.lookAt(pos.clone().add(normal));
      octahedron.add(label);
    });

    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2(-1000, -1000);
    let isHovering = false;

    const onMouseMove = (e) => {
      const mount = mountRef.current;
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let accumulatedTime = 0;
    let lastTime = Date.now();
    let isVisible = false;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        accumulatedTime = 0;
        lastTime = Date.now();
        isVisible = true;
      } else {
        isVisible = false;
      }
    }, { threshold: 0.1 });

    observer.observe(currentMount);

    const handleWheel = (e) => {
      if (isHovering) {
        e.preventDefault();
        targetScrollRotationRef.current += e.deltaY * 0.003;
      }
    };

    currentMount.addEventListener('wheel', handleWheel, { passive: false });

    let frameId;
    const animate = () => {
      const now = Date.now();
      if (isVisible) {
        const delta = (now - lastTime) * 0.001;
        accumulatedTime += delta;
      }
      lastTime = now;

      raycaster.setFromCamera(mouse2D, camera);
      const intersects = raycaster.intersectObject(group, true);
      isHovering = intersects.length > 0;

      scrollRotationRef.current += (targetScrollRotationRef.current - scrollRotationRef.current) * 0.08;

      group.position.y = Math.sin(accumulatedTime * 1.05) * 0.2;
      octahedron.rotation.y = (-5 * Math.PI / 4) - (accumulatedTime * 0.245) - scrollRotationRef.current;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const mount = mountRef.current;
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      currentMount.removeEventListener('wheel', handleWheel);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

// --- CHESS TREADMILL COMPONENT (SECTION 2) ---
const ChessTreadmill = () => {
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);

  const headingRef = useRef(null);
  const hintRef = useRef(null);
  const hintPiecesRef = useRef(null);

  const [pieceInfo, setPieceInfo] = useState(() => createEmptyPieceInfo());
  const [isRiskTheme, setIsRiskTheme] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return undefined;

    let boardTiles = [];
    let interactivePieces = [];
    let scrollPos = 0;
    let targetScrollPos = 0;
    let introState = { p: 1 };
    let currentMode = 'owner';
    let currentHoveredUUID = null;
    let interactionMode = 'hover';
    let ownerPieceNodes = {};
    let riskPieceNodes = {};
    let frameId;
    let disposed = false;

    const COLOR_WHITE = 0xf3f2ee;
    const COLOR_BURGUNDY = 0x97182e;
    const COLOR_BOARD_LIGHT_WOOD = 0xd9c2a0;
    const COLOR_BOARD_DARK_OAK = 0x4e3426;
    const COLOR_EDGE_LIGHT = 0x8c6b4a;
    const COLOR_EDGE_DARK = 0x1a0f0a;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const aspect = width / height;

    const scene = new THREE.Scene();
    const d = 16;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    const currentMount = mountRef.current;
    currentMount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    const loader = new GLTFLoader();

    const loadGLTF = (url) =>
      new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

    function get4DTransform(baseX, baseZ) {
      let rx = 0;
      let ry = 0;
      let rz = 0;
      let pathX = baseX;
      let pathY = 0;
      let pathZ = baseZ;

      if (baseX > 10.5) {
        const t = baseX - 10.5;
        const radius = 12;
        const angle = t * 0.12;
        pathX = 10.5 + Math.sin(angle) * radius;
        pathY = -radius + radius * Math.cos(angle) - t * 0.15;
        const twist = t * 0.08;
        pathZ = baseZ * Math.cos(twist);
        pathY += baseZ * Math.sin(twist);
        rx = twist;
        rz = -angle;
      } else if (baseX < -10.5) {
        const t = -10.5 - baseX;
        pathY = -Math.pow(t, 1.4) * 0.4;
        rz = t * 0.08;
      }

      return { x: pathX, y: pathY, z: pathZ, rx, ry, rz };
    }

    function getUnifiedFade(currentX) {
      let fade = currentX > 20 ? 1.0 - (currentX - 20) / 16 : currentX < -10 ? 1.0 - (-10 - currentX) / 10 : 1.0;
      fade = Math.max(0, Math.min(1, fade));
      return fade * fade * (3 - 2 * fade);
    }

    function createChessRoad() {
      const widthTiles = 5;
      const lengthTiles = 24;
      const tileSize = 3.5;
      const boardThickness = 1.5;
      const boardGroup = new THREE.Group();
      const matLight = new THREE.MeshStandardMaterial({ color: COLOR_BOARD_LIGHT_WOOD, roughness: 0.2, metalness: 0.1, transparent: true });
      const matDark = new THREE.MeshStandardMaterial({ color: COLOR_BOARD_DARK_OAK, roughness: 0.15, metalness: 0.2, transparent: true });

      for (let x = -4; x < lengthTiles; x += 1) {
        for (let z = 0; z < widthTiles; z += 1) {
          const isDark = (x + z) % 2 === 0;
          const tileGeo = new THREE.BoxGeometry(tileSize, boardThickness, tileSize);
          const tileMat = isDark ? matDark.clone() : matLight.clone();
          const originalX = x * tileSize;

          const tile = new THREE.Mesh(tileGeo, tileMat);
          tile.receiveShadow = true;
          tile.castShadow = true;

          const edgeColor = isDark ? COLOR_EDGE_DARK : COLOR_EDGE_LIGHT;
          tile.add(new THREE.LineSegments(new THREE.EdgesGeometry(tileGeo), new THREE.LineBasicMaterial({ color: edgeColor, transparent: true })));

          const originalZ = (z - Math.floor(widthTiles / 2)) * tileSize;
          tile.userData = { originalX, originalZ, dropDist: Math.random() * 40 + 20, isDark };
          boardTiles.push(tile);
          boardGroup.add(tile);
        }
      }

      scene.add(boardGroup);
    }
    createChessRoad();

    function normalizePieceModel(modelRoot, pieceType) {
      const initialBox = new THREE.Box3().setFromObject(modelRoot);
      const center = initialBox.getCenter(new THREE.Vector3());

      modelRoot.position.x -= center.x;
      modelRoot.position.y -= initialBox.min.y;
      modelRoot.position.z -= center.z;

      const adjustedBox = new THREE.Box3().setFromObject(modelRoot);
      const size = adjustedBox.getSize(new THREE.Vector3());
      const targetHeight = PIECE_HEIGHTS[pieceType] ?? 4;
      const scale = size.y > 0 ? targetHeight / size.y : 1;
      modelRoot.scale.setScalar(scale);
    }

    function createPieceInstance(pieceType) {
      const ownerSource = ownerPieceNodes[pieceType];
      const riskSource = riskPieceNodes[pieceType];
      if (!ownerSource || !riskSource) return null;

      const ownerClone = ownerSource.clone(true);
      const riskClone = riskSource.clone(true);
      const ownerMeshes = [];
      const riskMeshes = [];

      ownerClone.traverse((child) => {
        if (child.isMesh) ownerMeshes.push(child);
      });
      riskClone.traverse((child) => {
        if (child.isMesh) riskMeshes.push(child);
      });

      ownerMeshes.forEach((mesh, index) => {
        const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const riskMesh = riskMeshes[index] ?? riskMeshes[0];
        const riskMaterials = riskMesh ? (Array.isArray(riskMesh.material) ? riskMesh.material : [riskMesh.material]) : sourceMaterials;
        const instanceMaterials = sourceMaterials.map((material, materialIndex) => {
          const clonedMaterial = material.clone();
          clonedMaterial.transparent = true;
          clonedMaterial.depthWrite = true;

          const ownerColor = material.color ? material.color.clone() : new THREE.Color(COLOR_WHITE);
          const riskColor = riskMaterials[materialIndex]?.color ? riskMaterials[materialIndex].color.clone() : ownerColor.clone();

          if (!mesh.userData.themeMaterials) mesh.userData.themeMaterials = [];
          mesh.userData.themeMaterials[materialIndex] = { ownerColor, riskColor };

          const initialMix = currentMode === 'risk' ? 1 : 0;
          if (clonedMaterial.color) {
            clonedMaterial.color.copy(ownerColor).lerp(riskColor, initialMix);
          }

          return clonedMaterial;
        });

        mesh.material = Array.isArray(mesh.material) ? instanceMaterials : instanceMaterials[0];
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });

      normalizePieceModel(ownerClone, pieceType);

      const pieceGroup = new THREE.Group();
      pieceGroup.add(ownerClone);
      pieceGroup.userData = {
        ...pieceGroup.userData,
        pieceType,
        themeMix: currentMode === 'risk' ? 1 : 0,
        targetThemeMix: currentMode === 'risk' ? 1 : 0,
      };

      return pieceGroup;
    }

    function placePiece(pieceType, logicalX, logicalZ, uiData) {
      const meshGroup = createPieceInstance(pieceType);
      if (!meshGroup) return;

      meshGroup.userData = {
        ...meshGroup.userData,
        logicalX,
        logicalZ,
        uiData,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.001 + Math.random() * 0.0015,
        dropDist: 0,
      };

      interactivePieces.push(meshGroup);
      scene.add(meshGroup);
    }

    function populatePieces() {
      placePiece('king', 4, 0, buildPieceUiData('king', {
        whiteHeading: 'Owner Proxy',
        redHeading: 'Risk Proxy',
        whiteSub: 'Goal: maximize profit',
        redSub: 'Goal: maximize loss',
      }));

      placePiece('bishop', 30, -4.5, buildPieceUiData('bishop', {
        whiteHeading: 'BUREAUCRACY',
        redHeading: 'BUREAUCRACY',
        whiteSub: 'Mitigate liability/ red tape',
        redSub: 'Increase liability/ red tape',
      }));

      placePiece('rook', 30, 0, buildPieceUiData('rook', {
        whiteHeading: 'STRUCTURAL',
        redHeading: 'STRUCTURAL',
        whiteSub: 'Maintain & enhance',
        redSub: 'Deterioration',
      }));

      placePiece('knight', 30, 4.5, buildPieceUiData('knight', {
        whiteHeading: 'LEASING',
        redHeading: 'LEASING',
        whiteSub: 'Synergistic occupancy',
        redSub: 'High Vacancy',
      }));

      placePiece('queen', 60, 0, buildPieceUiData('queen', {
        whiteHeading: 'ECONOMY',
        redHeading: 'ECONOMY',
        whiteSub: 'STRONG MARKET',
        redSub: '[HARSH MARKET]',
      }));

      const numPawns = 4;
      const pawnRadius = 4.5;
      const pawnData = buildPieceUiData('pawn', {
        whiteHeading: 'TIMING',
        redHeading: 'TIMING',
        whiteSub: '[via pawn differential]\nLess pressure to sell',
        redSub: '[via pawn differential]\nMore pressure to sell',
      });

      for (let i = 0; i < numPawns; i += 1) {
        const angle = (i / numPawns) * Math.PI * 2;
        const px = 60 + Math.cos(angle) * pawnRadius;
        const pz = Math.sin(angle) * pawnRadius;
        placePiece('pawn', px, pz, pawnData);
      }
    }

    function toggleMode() {
      if (targetScrollPos >= 100) return;

      currentMode = currentMode === 'owner' ? 'risk' : 'owner';
      const isRisk = currentMode === 'risk';
      setIsRiskTheme(isRisk);

      interactivePieces.forEach((piece) => {
        piece.userData.targetThemeMix = isRisk ? 1 : 0;
      });

      updateMilestoneText(Math.min(scrollPos, 65));
    }

    function updateMilestoneText(currentPathScroll) {
      let msIndex = 0;
      if (currentPathScroll < 15) msIndex = 0;
      else if (currentPathScroll < 45) msIndex = 1;
      else msIndex = 2;

      const allLabels = ['PROXY', 'OPERATIONS', 'ENTROPY'];
      const activeLabel = allLabels[msIndex];

      if (headingRef.current) {
        if (headingRef.current.innerText !== activeLabel) {
          headingRef.current.innerText = activeLabel;
        }
        headingRef.current.style.color = currentMode === 'owner' ? '#F3F2EE' : '#97182E';
      }

      if (hintRef.current) hintRef.current.style.opacity = msIndex === 2 ? '0' : '0.8';
      if (hintPiecesRef.current) hintPiecesRef.current.style.opacity = msIndex === 2 ? '0' : '0.8';
    }

    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2(-1000, -1000);

    function pushActivePieceToReact(piece) {
      if (!piece) {
        if (currentHoveredUUID !== null) {
          currentHoveredUUID = null;
          setPieceInfo(createEmptyPieceInfo());
        }
        return;
      }

      if (currentHoveredUUID !== piece.uuid) {
        currentHoveredUUID = piece.uuid;
        if (piece.userData.uiData) {
          setPieceInfo({
            ...piece.userData.uiData,
            active: true,
          });
        }
      }
    }

    const onMouseMove = (e) => {
      interactionMode = 'hover';
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      if (currentHoveredUUID) {
        toggleMode();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleMode();
      }

      if (e.code === 'Space') {
        e.preventDefault();
        interactionMode = 'space';

        const uniquePieces = [];
        const headingsSeen = new Set();

        interactivePieces.forEach((piece) => {
          if (piece.userData.uiData && !headingsSeen.has(piece.userData.uiData.whiteHeading)) {
            headingsSeen.add(piece.userData.uiData.whiteHeading);
            uniquePieces.push(piece);
          }
        });

        const sortedPieces = uniquePieces.sort((a, b) => a.userData.logicalX - b.userData.logicalX);

        if (sortedPieces.length > 0) {
          let nextIndex = 0;

          if (currentHoveredUUID !== null) {
            let currentIndex = sortedPieces.findIndex((piece) => piece.uuid === currentHoveredUUID);

            if (currentIndex === -1) {
              const hoveredPieceObj = interactivePieces.find((piece) => piece.uuid === currentHoveredUUID);
              if (hoveredPieceObj && hoveredPieceObj.userData.uiData) {
                currentIndex = sortedPieces.findIndex(
                  (piece) => piece.userData.uiData.whiteHeading === hoveredPieceObj.userData.uiData.whiteHeading,
                );
              }
            }

            if (currentIndex !== -1) {
              nextIndex = (currentIndex + 1) % sortedPieces.length;
            }
          }

          const nextPiece = sortedPieces[nextIndex];
          pushActivePieceToReact(nextPiece);

          const targetLogicalX = nextPiece.userData.logicalX;
          const progress = targetLogicalX / 80;

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const absoluteTop = window.scrollY + rect.top;
            const scrollDist = rect.height - window.innerHeight;
            const headerHeight = 82;
            const targetY = absoluteTop - headerHeight + (progress * scrollDist);
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          }
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', handleKeyDown);

    const activeHeaderEl = headerRef.current;
    if (activeHeaderEl) activeHeaderEl.addEventListener('click', toggleMode);

    updateMilestoneText(0);

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const headerHeight = 82;
      const scrollDistance = rect.height - window.innerHeight;
      let progress = -(rect.top - headerHeight) / scrollDistance;
      progress = Math.max(0, Math.min(1, progress));
      targetScrollPos = progress * 80;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    Promise.all([loadGLTF(whiteChessPiecesGlb), loadGLTF(redChessPiecesGlb)])
      .then(([ownerGltf, riskGltf]) => {
        if (disposed) return;

        ownerPieceNodes = Object.keys(PIECE_NODE_NAMES.owner).reduce((acc, pieceType) => {
          acc[pieceType] = ownerGltf.scene.getObjectByName(PIECE_NODE_NAMES.owner[pieceType]);
          return acc;
        }, {});

        riskPieceNodes = Object.keys(PIECE_NODE_NAMES.risk).reduce((acc, pieceType) => {
          acc[pieceType] = riskGltf.scene.getObjectByName(PIECE_NODE_NAMES.risk[pieceType]);
          return acc;
        }, {});

        populatePieces();
      })
      .catch((error) => {
        console.error('Failed to load chess piece GLBs.', error);
      });

    const animate = () => {
      const time = Date.now();

      scrollPos += (targetScrollPos - scrollPos) * 0.08;
      const pathScroll = Math.min(scrollPos, 65);

      updateMilestoneText(pathScroll);

      if (interactionMode === 'hover') {
        raycaster.setFromCamera(mouse2D, camera);
        const hitMeshes = [];

        interactivePieces.forEach((piece) => {
          const currentX = piece.userData.logicalX - pathScroll;
          if (getUnifiedFade(currentX) > 0.1) {
            piece.traverse((child) => {
              if (child.isMesh) hitMeshes.push(child);
            });
          }
        });

        const intersects = raycaster.intersectObjects(hitMeshes, false);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj.parent && !interactivePieces.includes(obj)) obj = obj.parent;
          if (interactivePieces.includes(obj)) pushActivePieceToReact(obj);
        } else {
          pushActivePieceToReact(null);
        }
      }

      boardTiles.forEach((tile) => {
        const currentX = tile.userData.originalX - pathScroll;
        const transform = get4DTransform(currentX, tile.userData.originalZ);
        tile.position.set(transform.x, transform.y + (1 - introState.p) * tile.userData.dropDist, transform.z);
        tile.rotation.set(transform.rx, transform.ry, transform.rz);

        const fade = getUnifiedFade(currentX);
        tile.material.opacity = fade * introState.p;
        if (tile.children[0]) tile.children[0].material.opacity = (fade * introState.p) * 0.4;
      });

      interactivePieces.forEach((piece) => {
        const currentX = piece.userData.logicalX - pathScroll;
        const transform = get4DTransform(currentX, piece.userData.logicalZ);
        const bobbing = Math.sin(time * piece.userData.floatSpeed + piece.userData.floatOffset) * 0.4;

        piece.position.set(transform.x, transform.y + 0.75 + bobbing, transform.z);
        piece.rotation.set(transform.rx, transform.ry, transform.rz);
        piece.userData.themeMix += (piece.userData.targetThemeMix - piece.userData.themeMix) * 0.08;

        let isFocused = currentHoveredUUID === piece.uuid;

        if (interactionMode === 'space' && currentHoveredUUID && piece.userData.uiData) {
          const activePieceObj = interactivePieces.find((candidate) => candidate.uuid === currentHoveredUUID);
          if (activePieceObj && activePieceObj.userData.uiData.whiteHeading === piece.userData.uiData.whiteHeading) {
            isFocused = true;
          }
        }

        const targetScale = isFocused ? 1.2 : 1.0;
        piece.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

        const fade = getUnifiedFade(currentX);
        piece.traverse((child) => {
          if (child.isMesh && child.userData.themeMaterials) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material, index) => {
              const themeMaterial = child.userData.themeMaterials[index] ?? child.userData.themeMaterials[0];
              if (material.color && themeMaterial) {
                material.color.copy(themeMaterial.ownerColor).lerp(themeMaterial.riskColor, piece.userData.themeMix);
              }
              material.opacity = fade * introState.p;
            });
          }
        });
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const mount = mountRef.current;
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const newAspect = w / h;
      renderer.setSize(w, h);
      camera.left = -d * newAspect;
      camera.right = d * newAspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', handleKeyDown);
      if (activeHeaderEl) activeHeaderEl.removeEventListener('click', toggleMode);
      cancelAnimationFrame(frameId);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
      scene.clear();
      boardTiles = [];
      interactivePieces = [];
    };
  }, []);

  const activePieceHeading = isRiskTheme ? pieceInfo.redHeading : pieceInfo.whiteHeading;
  const activePieceSub = isRiskTheme ? pieceInfo.redSub : pieceInfo.whiteSub;
  const activePieceImage = isRiskTheme ? pieceInfo.redImageSrc : pieceInfo.whiteImageSrc;

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-[#222327]">
      <div className="sticky top-[82px] w-full h-[calc(100vh-82px)] overflow-hidden">
        <div
          ref={headerRef}
          id="section2-header-container"
          className="absolute top-10 left-10 z-10 pointer-events-auto cursor-pointer group hover:-translate-y-0.5 transition-transform duration-300"
        >
          <h2
            ref={headingRef}
            id="section2-main-heading"
            className="text-white text-[2rem] md:text-[42px] leading-[1.1] font-bold tracking-tight transition-colors duration-400 uppercase"
          >
            {/* Populated via ref to preserve the current DOM mutation flow. */}
          </h2>
        </div>

        <div className={`absolute bottom-20 left-10 z-20 transition-all duration-500 ease-out ${pieceInfo.active ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
          <div className="relative w-[260px] aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#222327]/85 backdrop-blur-md drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            {activePieceImage ? (
              <img
                src={activePieceImage}
                alt={`${activePieceHeading} pop-up window`}
                className="h-full w-full object-contain bg-[#1a1b1f] transition-opacity duration-500 ease-out"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-gray-500/50">
                <span className="text-gray-400 font-medium tracking-widest uppercase text-xs mb-1">Image Upload Zone</span>
                <span className="text-gray-500 text-[9px] uppercase tracking-widest">[ Awaiting Piece Focus ]</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#111216] via-[#111216]/85 to-transparent px-4 py-3">
              <span className="block text-[9px] uppercase tracking-[0.35em] text-white/65">PUW Preview</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                {activePieceHeading || 'Standby'}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={hintRef}
          id="section2-hint"
          className="absolute bottom-10 left-10 text-white text-sm uppercase tracking-[0.2em] font-bold flex items-center transition-opacity duration-300 opacity-100 z-10 pointer-events-none drop-shadow-lg"
        >
          <span className="inline-flex items-center border-2 border-white rounded px-2.5 py-1.5 mr-3 bg-white/20 text-white font-extrabold drop-shadow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="2" y1="12" x2="22" y2="12"></line><polyline points="15 5 22 12 15 19"></polyline><line x1="2" y1="5" x2="2" y2="19"></line></svg>
            TAB
          </span>
          TOGGLE VIEW
        </div>

        <div
          className={`absolute top-24 right-10 z-20 min-w-[300px] px-8 py-6 rounded-xl transition-all duration-500 ease-out shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${pieceInfo.active ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}
          style={{
            backgroundColor: isRiskTheme ? '#97182E' : '#F3F2EE',
            color: '#1A1A1D',
          }}
        >
          <div className="w-full flex flex-col items-center justify-center text-center">
            <h3 className="font-bold tracking-[0.15em] text-lg uppercase underline underline-offset-4 decoration-2 mb-3">
              {activePieceHeading}
            </h3>
            <p className="text-sm font-semibold tracking-wide opacity-90 uppercase whitespace-pre-line leading-relaxed">
              {activePieceSub}
            </p>
          </div>
        </div>

        <div
          ref={hintPiecesRef}
          id="section2-hint-pieces"
          className="absolute top-10 right-10 text-white text-sm uppercase tracking-[0.2em] font-bold flex items-center transition-opacity duration-300 opacity-100 z-10 pointer-events-none drop-shadow-lg"
        >
          <span className="inline-flex items-center border-2 border-white rounded px-2.5 py-1.5 mr-3 bg-white/20 text-white font-extrabold drop-shadow">
            <SpacebarIcon size={14} className="mr-2" />
            SPACE
          </span>
          TOGGLE PIECES
        </div>

        <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-crosshair" />
      </div>
    </div>
  );
};

export default function App() {
  const [activeButton, setActiveButton] = useState('brain');

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-[#97182E] selection:text-white scroll-smooth"
      style={{
        backgroundColor: '#2A2B30',
        backgroundImage: 'radial-gradient(circle at 70% 30%, #3a3c42 0%, #2A2B30 60%, #1e1f24 100%)',
        fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap');
        html { scroll-behavior: smooth; }
      `}</style>

      <header className="sticky top-0 z-50 flex justify-between items-center px-12 py-5 border-b border-white/20 bg-[#2A2B30]/90 backdrop-blur-md">
        <div className="flex items-center text-white shrink-0">
          <img src={logoSvg} alt="CRE POV" className="h-[42px] w-auto max-w-none" />
        </div>
        <nav className="flex gap-6 md:gap-8 text-[14px] text-white font-medium tracking-wide items-center">
          <div className="relative group">
            <button className="flex items-center gap-1.5 hover:text-gray-300 transition-colors py-2">
              Explanation <ChevronDownIcon />
            </button>
            <div className="absolute top-full left-0 mt-0 w-32 bg-[#222327] border border-white/10 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50 overflow-hidden">
              <a href="#what" className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 uppercase text-xs tracking-wider">What</a>
              <a href="#who" className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 uppercase text-xs tracking-wider">Who</a>
              <a href="#where" className="px-4 py-3 hover:bg-white/10 text-left transition-colors uppercase text-xs tracking-wider">Where</a>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1.5 hover:text-gray-300 transition-colors py-2">
              Resources <ChevronDownIcon />
            </button>
            <div className="absolute top-full left-0 mt-0 w-64 bg-[#222327] border border-white/10 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50 overflow-hidden">
              <div className="px-4 py-2 bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest border-b border-white/5">For Owners</div>
              <a href="#" className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 text-xs uppercase tracking-wider pl-6">Retail Services</a>

              <div className="px-4 py-2 bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest border-b border-white/5">For Brokers</div>
              <a href="#" className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 text-xs uppercase tracking-wider pl-6">Spreadsheet Templates</a>
              <a href="#" className="px-4 py-3 hover:bg-white/10 text-left transition-colors text-xs uppercase tracking-wider pl-6">AI Prompt Templates</a>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1.5 hover:text-gray-300 transition-colors py-2">
              Contact <ChevronDownIcon />
            </button>
            <div className="absolute top-full right-0 mt-0 w-56 bg-[#222327] border border-white/10 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50 overflow-hidden">
              <a href="mailto:crepovbot@gmail.com" className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 text-xs uppercase tracking-wider">Email Us</a>

              <div className="px-4 py-2 bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest border-b border-white/5">Story to tell?</div>
              <a href="#" className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 text-xs uppercase tracking-wider pl-6">Requirements</a>
              <a href="#" className="px-4 py-3 hover:bg-white/10 text-left transition-colors text-xs uppercase tracking-wider pl-6">Questionnaire</a>
            </div>
          </div>
        </nav>
      </header>

      <section id="what" className="relative flex-none min-h-[500px] border-b border-white/20 flex flex-col md:flex-row overflow-hidden pt-8 pb-8 md:pb-0">
        <div className="w-full md:w-[55%] flex flex-col justify-center px-12 z-20">
          <h1 className="text-white text-4xl md:text-[42px] leading-[1.2] font-bold tracking-tight mb-4 drop-shadow-lg">CRE content as never seen.</h1>
          <p className="text-gray-300 text-xl font-light mb-10 drop-shadow-sm">Never CRE the same.</p>
          <div className="flex gap-4">
            <button onClick={() => setActiveButton('mic')} className={`flex justify-center items-center w-24 h-14 rounded-md transition-all duration-300 shadow-xl ${activeButton === 'mic' ? 'bg-[#5c101a] border border-pink-300/40 ring-[3px] ring-pink-300/60 shadow-[0_0_20px_rgba(255,192,203,0.3)]' : 'bg-[#731221] border border-black/50 hover:bg-[#8A1628]'}`}><MicIcon color="white" /></button>
            <button onClick={() => setActiveButton('brain')} className={`flex justify-center items-center w-24 h-14 rounded-md transition-all duration-300 shadow-xl ${activeButton === 'brain' ? 'bg-[#5c101a] border border-pink-300/40 ring-[3px] ring-pink-300/60 shadow-[0_0_20px_rgba(255,192,203,0.3)]' : 'bg-[#731221] border border-black/50 hover:bg-[#8A1628]'}`}><BrainIcon color="white" /></button>
            <button onClick={() => setActiveButton('knight')} className={`flex justify-center items-center w-24 h-14 rounded-md transition-all duration-300 shadow-xl ${activeButton === 'knight' ? 'bg-[#5c101a] border border-pink-300/40 ring-[3px] ring-pink-300/60 shadow-[0_0_20px_rgba(255,192,203,0.3)]' : 'bg-[#731221] border border-black/50 hover:bg-[#8A1628]'}`}><KnightIcon className="text-white" /></button>
          </div>
        </div>
        <div className="relative md:absolute right-0 top-0 w-full md:w-[60%] h-full z-10 flex items-center justify-center pointer-events-none md:pr-12 mt-10 md:mt-0 px-6">
          <div className="w-full max-w-[500px] aspect-[4/3] rounded-xl border-2 border-dashed border-gray-500/50 bg-[#222327]/60 flex flex-col items-center justify-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-transform duration-500 ease-out cursor-pointer pointer-events-auto">
            <span className="text-gray-400 font-medium tracking-widest uppercase text-sm">Image Upload Zone</span>
            <span className="text-gray-600 mt-2 text-[10px] uppercase tracking-widest">[ White Sunglasses ]</span>
          </div>
        </div>
      </section>

      <section id="who" className="w-full border-b border-white/20 relative">
        <ChessTreadmill />
      </section>

      <section id="where" className="w-full min-h-[600px] bg-[#1C1D21] flex flex-col items-center justify-start px-12 py-20 relative overflow-hidden">
        <div className="z-10 text-center pointer-events-none mb-6">
          <h3 className="text-white text-4xl md:text-6xl font-bold tracking-[0.1em] uppercase opacity-90 drop-shadow-md">
            FOLLOW US
          </h3>
        </div>

        <div className="w-full max-w-4xl h-[400px] relative z-0">
          <OctahedronScene />
        </div>

        <div className="flex gap-8 mt-12 z-10 relative">
          <a href="https://linkedin.com/company/crepov" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-transform hover:-translate-y-1 duration-300">
            <LinkedinIcon size={32} />
          </a>
          <a href="https://open.spotify.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-transform hover:-translate-y-1 duration-300">
            <SpotifyIcon size={32} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-transform hover:-translate-y-1 duration-300">
            <YoutubeIcon size={32} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-transform hover:-translate-y-1 duration-300">
            <InstagramIcon size={32} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-transform hover:-translate-y-1 duration-300">
            <XIcon size={32} />
          </a>
        </div>
      </section>
    </div>
  );
}
