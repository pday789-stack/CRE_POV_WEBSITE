import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

import logoSvg from '../CRE POV WEBSITE ASSETS/LOGO.svg';
import leagueSpartanBg from '../CRE POV WEBSITE ASSETS/League Spartan.png';
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

const PIECE_SCALE_MULTIPLIER = 1.3;
const PIECE_BASE_LIFT = 1.18;
const PIECE_BOB_AMPLITUDE = 0.12;

const CHESS_ROAD_WIDTH_TILES = 5;
const CHESS_ROAD_LENGTH_TILES = 24;
const CHESS_ROAD_START_COLUMN = -4;
const CHESS_ROAD_TILE_SIZE = 3.5;
const CHESS_ROAD_BOARD_THICKNESS = 1.5;
const CHESS_ROAD_CENTER_ROW = Math.floor(CHESS_ROAD_WIDTH_TILES / 2);

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (edge0, edge1, value) => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const makeTileCoord = (column, row) => ({ column, row });
const cloneTileCoord = ({ column, row }) => ({ column, row });
const getTileCoordKey = ({ column, row }) => `${column}:${row}`;
const tileCoordToLogicalPosition = (column, row) => ({
  logicalX: column * CHESS_ROAD_TILE_SIZE,
  logicalZ: (row - CHESS_ROAD_CENTER_ROW) * CHESS_ROAD_TILE_SIZE,
});
const getNearestTileCoord = (logicalX, logicalZ) =>
  makeTileCoord(
    Math.round(logicalX / CHESS_ROAD_TILE_SIZE),
    Math.max(
      0,
      Math.min(
        CHESS_ROAD_WIDTH_TILES - 1,
        Math.round(logicalZ / CHESS_ROAD_TILE_SIZE) + CHESS_ROAD_CENTER_ROW,
      ),
    ),
  );

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

const AnimatedSpacebarHint = () => (
  <div className="animated-spacebar" aria-hidden="true">
    <div className="animated-spacebar__base">
      <div className="animated-spacebar__key">Space</div>
    </div>
  </div>
);

const AnimatedTabHint = () => (
  <div className="animated-tab" aria-hidden="true">
    <div className="animated-tab__base">
      <div className="animated-tab__key">Tab</div>
    </div>
  </div>
);

const HEADER_MENUS = [
  {
    key: 'explanation',
    label: 'Explanation',
    align: 'left',
    sections: [
      {
        title: null,
        links: [
          { label: 'What', href: '#what' },
          { label: 'Who', href: '#who' },
          { label: 'Where', href: '#where' },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: 'Resources',
    align: 'left',
    sections: [
      {
        title: 'For Owners',
        links: [
          { label: 'Retail Services', href: '#' },
        ],
      },
      {
        title: 'For Brokers',
        links: [
          { label: 'Spreadsheet Templates', href: '#' },
          { label: 'AI Prompt Templates', href: '#' },
        ],
      },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    align: 'right',
    sections: [
      {
        title: null,
        links: [
          { label: 'Email Us', href: 'mailto:crepovbot@gmail.com' },
        ],
      },
      {
        title: 'Story to tell?',
        links: [
          { label: 'Requirements', href: '#' },
          { label: 'Questionnaire', href: '#' },
        ],
      },
    ],
  },
];

const HeaderMenu = ({ menu, isOpen, onOpen, onToggle, onHoverClose, onClose }) => {
  const panelAlignment = menu.align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpen(menu.key)}
      onMouseLeave={onHoverClose}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(menu.key);
        }}
        className={`flex h-9 items-center gap-2 rounded-full border px-3 md:px-4 text-[11px] md:text-[12px] uppercase tracking-[0.18em] transition-all duration-200 ${
          isOpen
            ? 'border-white/18 bg-white/10 text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
            : 'border-transparent bg-transparent text-white/84 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        <span>{menu.label}</span>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={12} />
        </span>
      </button>

      <div aria-hidden="true" className="absolute inset-x-0 top-full h-3" />

      <div
        className={`absolute top-full ${panelAlignment} z-30 mt-2 w-[min(88vw,248px)] rounded-2xl border border-white/12 bg-[#171a21]/96 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-all duration-200 ${
          isOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
        }`}
      >
        {menu.sections.map((section, sectionIndex) => (
          <div
            key={`${menu.key}-${section.title ?? sectionIndex}`}
            className={sectionIndex === 0 ? '' : 'mt-2 border-t border-white/8 pt-2'}
          >
            {section.title ? (
              <div className="px-3 pb-1 text-[9px] uppercase tracking-[0.28em] text-white/42">
                {section.title}
              </div>
            ) : null}

            <div className="flex flex-col gap-1">
              {section.links.map((link) => (
                <a
                  key={`${menu.key}-${link.label}`}
                  href={link.href}
                  onClick={onClose}
                  className="rounded-xl px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white/88 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
const ChessTreadmill = ({ headerHeight }) => {
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const headerHeightRef = useRef(headerHeight);

  const headingRef = useRef(null);

  const [pieceInfo, setPieceInfo] = useState(() => createEmptyPieceInfo());
  const [isRiskTheme, setIsRiskTheme] = useState(false);
  const [showHintPrompts, setShowHintPrompts] = useState(true);
  const hintVisibilityRef = useRef(true);

  useEffect(() => {
    headerHeightRef.current = headerHeight;
  }, [headerHeight]);

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
    let boardTileLookup = new Map();
    let frameId;
    let disposed = false;
    let isVisible = false;
    let isAnimating = false;

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    const currentMount = mountRef.current;
    currentMount.appendChild(renderer.domElement);

    RectAreaLightUniformsLib.init();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.08);
    scene.environment = environmentTarget.texture;

    const ambientHemisphereLight = new THREE.HemisphereLight(0xfaf1e4, 0x090b11, 0.34);
    scene.add(ambientHemisphereLight);

    const keyShadowLight = new THREE.SpotLight(0xfff1dd, 1.55, 86, Math.PI / 4.9, 0.74, 1.55);
    keyShadowLight.position.set(18, 26, 16);
    keyShadowLight.castShadow = true;
    keyShadowLight.shadow.mapSize.set(3072, 3072);
    keyShadowLight.shadow.bias = -0.00012;
    keyShadowLight.shadow.normalBias = 0.04;
    keyShadowLight.shadow.radius = 4;
    keyShadowLight.target.position.set(3.5, 2.6, 0);
    scene.add(keyShadowLight);
    scene.add(keyShadowLight.target);

    const displayFillLight = new THREE.RectAreaLight(0xfff6ee, 6.4, 20, 10);
    displayFillLight.position.set(2, 15.5, 13.5);
    displayFillLight.lookAt(4, 2.4, 0);
    scene.add(displayFillLight);

    const sideFillLight = new THREE.RectAreaLight(0xd7e4ff, 4.2, 10, 18);
    sideFillLight.position.set(-16, 7, -6.5);
    sideFillLight.lookAt(6, 2, 0);
    scene.add(sideFillLight);

    const warmRimLight = new THREE.SpotLight(0xffd8c6, 0.56, 82, Math.PI / 5.4, 0.88, 1.85);
    warmRimLight.position.set(14, 10, -18);
    warmRimLight.target.position.set(6, 2.2, 0);
    scene.add(warmRimLight);
    scene.add(warmRimLight.target);

    const coolRimLight = new THREE.SpotLight(0xc8dcff, 0.82, 90, Math.PI / 5.1, 0.9, 1.9);
    coolRimLight.position.set(-20, 11.5, -14);
    coolRimLight.target.position.set(2, 2.4, 0);
    scene.add(coolRimLight);
    scene.add(coolRimLight.target);

    const centerSpotLight = new THREE.SpotLight(0xffffff, 1.15, 44, Math.PI / 9.6, 0.84, 1.4);
    centerSpotLight.position.set(4.8, 15.5, 7.2);
    centerSpotLight.castShadow = true;
    centerSpotLight.shadow.mapSize.set(2048, 2048);
    centerSpotLight.shadow.bias = -0.00014;
    centerSpotLight.shadow.normalBias = 0.05;
    centerSpotLight.shadow.radius = 3;
    centerSpotLight.target.position.set(0, 0, 0);
    scene.add(centerSpotLight);
    scene.add(centerSpotLight.target);

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

    function getCenterFocus(currentX, falloff = 8.5) {
      const focus = 1 - Math.min(1, Math.abs(currentX) / falloff);
      return focus * focus * (3 - 2 * focus);
    }

    function getBoardAssemblyProgress(currentX) {
      if (currentX > 10.5) {
        return 1 - smoothstep(12.1, 18.4, currentX);
      }
      if (currentX < -7.5) {
        return 1 - smoothstep(-12.5, -8.2, currentX);
      }
      return 1;
    }

    const centerHighlightWarm = new THREE.Color(0xfff3e3);
    const centerHighlightCool = new THREE.Color(0xdfe9ff);
    const spotlightWorldTarget = new THREE.Vector3();
    const spotlightWorldPosition = new THREE.Vector3();

    function createChessRoad() {
      const boardGroup = new THREE.Group();
      const matLight = new THREE.MeshStandardMaterial({
        color: COLOR_BOARD_LIGHT_WOOD,
        roughness: 0.48,
        metalness: 0.05,
        envMapIntensity: 0.22,
        transparent: true,
      });
      const matDark = new THREE.MeshStandardMaterial({
        color: COLOR_BOARD_DARK_OAK,
        roughness: 0.36,
        metalness: 0.08,
        envMapIntensity: 0.18,
        transparent: true,
      });

      for (let x = CHESS_ROAD_START_COLUMN; x < CHESS_ROAD_LENGTH_TILES; x += 1) {
        for (let z = 0; z < CHESS_ROAD_WIDTH_TILES; z += 1) {
          const isDark = (x + z) % 2 === 0;
          const tileGeo = new THREE.BoxGeometry(CHESS_ROAD_TILE_SIZE, CHESS_ROAD_BOARD_THICKNESS, CHESS_ROAD_TILE_SIZE);
          const tileMat = isDark ? matDark.clone() : matLight.clone();
          const originalX = x * CHESS_ROAD_TILE_SIZE;

          const tile = new THREE.Mesh(tileGeo, tileMat);
          tile.receiveShadow = true;
          tile.castShadow = true;

          const edgeColor = isDark ? COLOR_EDGE_DARK : COLOR_EDGE_LIGHT;
          tile.add(new THREE.LineSegments(new THREE.EdgesGeometry(tileGeo), new THREE.LineBasicMaterial({ color: edgeColor, transparent: true })));

          const originalZ = (z - CHESS_ROAD_CENTER_ROW) * CHESS_ROAD_TILE_SIZE;
          const tileCoord = makeTileCoord(x, z);
          tile.userData = {
            originalX,
            originalZ,
            tileCoord,
            dropDist: Math.random() * 40 + 20,
            isDark,
            assemblyProgress: 0,
            revealProgress: 0,
            emissiveColor: new THREE.Color(isDark ? 0x2d1710 : 0x755a3c),
          };
          boardTiles.push(tile);
          boardTileLookup.set(getTileCoordKey(tileCoord), tile);
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
      const targetHeight = (PIECE_HEIGHTS[pieceType] ?? 4) * PIECE_SCALE_MULTIPLIER;
      const scale = size.y > 0 ? targetHeight / size.y : 1;
      modelRoot.scale.setScalar(scale);
    }

    const ownerSurfaceProfile = {
      roughness: 0.24,
      metalness: 0.04,
      clearcoat: 0.76,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.28,
      specularIntensity: 0.62,
      specularColor: new THREE.Color(0xf6efe6),
    };
    const riskSurfaceProfile = {
      roughness: 0.31,
      metalness: 0.08,
      clearcoat: 0.66,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.18,
      specularIntensity: 0.66,
      specularColor: new THREE.Color(0xf4d4cc),
    };

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
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.computeVertexNormals();
        mesh.geometry.normalizeNormals();

        const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const riskMesh = riskMeshes[index] ?? riskMeshes[0];
        const riskMaterials = riskMesh ? (Array.isArray(riskMesh.material) ? riskMesh.material : [riskMesh.material]) : sourceMaterials;
        const instanceMaterials = sourceMaterials.map((material, materialIndex) => {
          const ownerColor = material.color ? material.color.clone() : new THREE.Color(COLOR_WHITE);
          const riskColor = riskMaterials[materialIndex]?.color ? riskMaterials[materialIndex].color.clone() : ownerColor.clone();

          if (!mesh.userData.themeMaterials) mesh.userData.themeMaterials = [];
          mesh.userData.themeMaterials[materialIndex] = {
            ownerColor,
            riskColor,
            ownerSurface: ownerSurfaceProfile,
            riskSurface: riskSurfaceProfile,
          };

          const initialMix = currentMode === 'risk' ? 1 : 0;
          const blendedColor = ownerColor.clone().lerp(riskColor, initialMix);
          const blendedSpecular = ownerSurfaceProfile.specularColor.clone().lerp(riskSurfaceProfile.specularColor, initialMix);

          const premiumMaterial = new THREE.MeshPhysicalMaterial({
            color: blendedColor,
            map: material.map ?? null,
            normalMap: material.normalMap ?? null,
            aoMap: material.aoMap ?? null,
            alphaMap: material.alphaMap ?? null,
            roughnessMap: material.roughnessMap ?? null,
            metalnessMap: material.metalnessMap ?? null,
            transparent: true,
            opacity: 1,
            side: material.side ?? THREE.FrontSide,
            roughness: THREE.MathUtils.lerp(ownerSurfaceProfile.roughness, riskSurfaceProfile.roughness, initialMix),
            metalness: THREE.MathUtils.lerp(ownerSurfaceProfile.metalness, riskSurfaceProfile.metalness, initialMix),
            clearcoat: THREE.MathUtils.lerp(ownerSurfaceProfile.clearcoat, riskSurfaceProfile.clearcoat, initialMix),
            clearcoatRoughness: THREE.MathUtils.lerp(ownerSurfaceProfile.clearcoatRoughness, riskSurfaceProfile.clearcoatRoughness, initialMix),
            envMapIntensity: THREE.MathUtils.lerp(ownerSurfaceProfile.envMapIntensity, riskSurfaceProfile.envMapIntensity, initialMix),
            specularIntensity: THREE.MathUtils.lerp(ownerSurfaceProfile.specularIntensity, riskSurfaceProfile.specularIntensity, initialMix),
            specularColor: blendedSpecular,
            ior: 1.46,
            reflectivity: 0.7,
            dithering: true,
          });

          return premiumMaterial;
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
        visualHeight: (PIECE_HEIGHTS[pieceType] ?? 4) * PIECE_SCALE_MULTIPLIER,
        themeMix: currentMode === 'risk' ? 1 : 0,
        targetThemeMix: currentMode === 'risk' ? 1 : 0,
      };

      return pieceGroup;
    }

    function placePiece(pieceType, uiData, placementOptions = {}) {
      const meshGroup = createPieceInstance(pieceType);
      if (!meshGroup) return;

      const boardCoord = placementOptions.boardCoord ? cloneTileCoord(placementOptions.boardCoord) : null;
      const basePosition = boardCoord
        ? tileCoordToLogicalPosition(boardCoord.column, boardCoord.row)
        : {
            logicalX: placementOptions.logicalX ?? 0,
            logicalZ: placementOptions.logicalZ ?? 0,
          };
      const resolvedSupportTileCoords = (placementOptions.supportTileCoords ?? [boardCoord ?? getNearestTileCoord(basePosition.logicalX, basePosition.logicalZ)])
        .filter(Boolean)
        .map(cloneTileCoord);

      meshGroup.userData = {
        ...meshGroup.userData,
        logicalX: basePosition.logicalX,
        logicalZ: basePosition.logicalZ,
        boardCoord,
        supportTileCoords: resolvedSupportTileCoords,
        uiData,
        positionOffset: placementOptions.positionOffset ? new THREE.Vector3(...placementOptions.positionOffset) : null,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.001 + Math.random() * 0.0015,
        revealProgress: 0,
        dropDist: 0,
      };

      interactivePieces.push(meshGroup);
      scene.add(meshGroup);
    }

    function getPieceSupportReveal(piece, pathScroll) {
      const supportTileCoords = piece.userData.supportTileCoords;
      if (!supportTileCoords?.length) {
        return getBoardAssemblyProgress(piece.userData.logicalX - pathScroll);
      }

      let revealTotal = 0;
      supportTileCoords.forEach((coord) => {
        const tile = boardTileLookup.get(getTileCoordKey(coord));
        if (tile) {
          revealTotal += tile.userData.assemblyProgress ?? getBoardAssemblyProgress(tile.userData.originalX - pathScroll);
        } else {
          const supportPosition = tileCoordToLogicalPosition(coord.column, coord.row);
          revealTotal += getBoardAssemblyProgress(supportPosition.logicalX - pathScroll);
        }
      });

      return revealTotal / supportTileCoords.length;
    }

    function getPieceRevealProgress(piece, pathScroll) {
      const currentX = piece.userData.logicalX - pathScroll;
      const supportReveal = smoothstep(0.72, 0.96, getPieceSupportReveal(piece, pathScroll));
      return getUnifiedFade(currentX) * introState.p * supportReveal;
    }

    function populatePieces() {
      placePiece('king', buildPieceUiData('king', {
        whiteHeading: 'Owner Proxy',
        redHeading: 'Risk Proxy',
        whiteSub: 'Goal: maximize profit',
        redSub: 'Goal: maximize loss',
      }), {
        logicalX: 4,
        logicalZ: 0,
      });

      placePiece('bishop', buildPieceUiData('bishop', {
        whiteHeading: 'BUREAUCRACY',
        redHeading: 'BUREAUCRACY',
        whiteSub: 'Mitigate liability/ red tape',
        redSub: 'Increase liability/ red tape',
      }), {
        logicalX: 30,
        logicalZ: -5.75,
      });

      placePiece('rook', buildPieceUiData('rook', {
        whiteHeading: 'STRUCTURAL',
        redHeading: 'STRUCTURAL',
        whiteSub: 'Maintain & enhance',
        redSub: 'Deterioration',
      }), {
        logicalX: 30,
        logicalZ: 0,
      });

      placePiece('knight', buildPieceUiData('knight', {
        whiteHeading: 'LEASING',
        redHeading: 'LEASING',
        whiteSub: 'Synergistic occupancy',
        redSub: 'High Vacancy',
      }), {
        logicalX: 30,
        logicalZ: 5.75,
      });

      const queenBoardCoord = makeTileCoord(17, CHESS_ROAD_CENTER_ROW);

      placePiece('queen', buildPieceUiData('queen', {
        whiteHeading: 'ECONOMY',
        redHeading: 'ECONOMY',
        whiteSub: 'STRONG MARKET',
        redSub: '[HARSH MARKET]',
      }), {
        boardCoord: queenBoardCoord,
      });

      const pawnTileOffsets = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      const pawnData = buildPieceUiData('pawn', {
        whiteHeading: 'TIMING',
        redHeading: 'TIMING',
        whiteSub: '[via pawn differential]\nLess pressure to sell',
        redSub: '[via pawn differential]\nMore pressure to sell',
      });

      pawnTileOffsets.forEach(([columnOffset, rowOffset]) => {
        placePiece('pawn', pawnData, {
          boardCoord: makeTileCoord(
            queenBoardCoord.column + columnOffset,
            queenBoardCoord.row + rowOffset,
          ),
        });
      });
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

      const nextHintVisibility = msIndex !== 2;
      if (hintVisibilityRef.current !== nextHintVisibility) {
        hintVisibilityRef.current = nextHintVisibility;
        setShowHintPrompts(nextHintVisibility);
      }
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
        const currentPathScroll = Math.min(scrollPos, 65);

        interactivePieces.forEach((piece) => {
          if (
            piece.userData.uiData &&
            getPieceRevealProgress(piece, currentPathScroll) > 0.2 &&
            !headingsSeen.has(piece.userData.uiData.whiteHeading)
          ) {
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
            const targetY = absoluteTop - getHeaderHeight() + (progress * scrollDist);
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

    const getHeaderHeight = () => headerHeightRef.current || 0;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      let progress = -(rect.top - getHeaderHeight()) / scrollDistance;
      progress = Math.max(0, Math.min(1, progress));
      targetScrollPos = progress * 80;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const startAnimation = () => {
      if (!isAnimating && !disposed) {
        isAnimating = true;
        frameId = requestAnimationFrame(animate);
      }
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          startAnimation();
        } else if (isAnimating) {
          cancelAnimationFrame(frameId);
          isAnimating = false;
        }
      },
      { threshold: 0.05 },
    );

    if (containerRef.current) {
      visibilityObserver.observe(containerRef.current);
      const rect = containerRef.current.getBoundingClientRect();
      isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
    }

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

    const pieceOffsetEuler = new THREE.Euler();
    const pieceOffsetVector = new THREE.Vector3();
    const pieceColorScratch = new THREE.Color();
    const pieceHighlightScratch = new THREE.Color();
    const pieceSpecularScratch = new THREE.Color();

    const animate = () => {
      if (disposed || !isVisible) {
        isAnimating = false;
        return;
      }

      const time = Date.now();

      scrollPos += (targetScrollPos - scrollPos) * 0.08;
      const pathScroll = Math.min(scrollPos, 65);

      updateMilestoneText(pathScroll);

      if (interactionMode === 'hover') {
        raycaster.setFromCamera(mouse2D, camera);
        const hitMeshes = [];

        interactivePieces.forEach((piece) => {
          if (getPieceRevealProgress(piece, pathScroll) > 0.18) {
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
        const assemblyProgress = getBoardAssemblyProgress(currentX);
        const centerFocus = getCenterFocus(currentX, 8.75);
        tile.userData.assemblyProgress = assemblyProgress;
        tile.userData.revealProgress = fade * introState.p;
        tile.material.opacity = fade * introState.p;
        if ('emissive' in tile.material && tile.material.emissive) {
          tile.material.emissive.copy(tile.userData.emissiveColor);
          tile.material.emissiveIntensity = 0.015 + centerFocus * (tile.userData.isDark ? 0.05 : 0.035);
        }
        if (tile.children[0]) tile.children[0].material.opacity = (fade * introState.p) * 0.4;
      });

      let featuredPiece = null;
      let featuredStrength = 0;

      interactivePieces.forEach((piece) => {
        const currentX = piece.userData.logicalX - pathScroll;
        const transform = get4DTransform(currentX, piece.userData.logicalZ);
        const centerFocus = getCenterFocus(currentX, 8.25);
        const pieceReveal = getPieceRevealProgress(piece, pathScroll);
        const bobbing = Math.sin(time * piece.userData.floatSpeed + piece.userData.floatOffset) * PIECE_BOB_AMPLITUDE;
        piece.userData.revealProgress = pieceReveal;

        piece.position.set(transform.x, transform.y + PIECE_BASE_LIFT + bobbing, transform.z);
        piece.rotation.set(transform.rx, transform.ry, transform.rz);
        if (piece.userData.positionOffset) {
          pieceOffsetEuler.set(transform.rx, transform.ry, transform.rz);
          pieceOffsetVector.copy(piece.userData.positionOffset).applyEuler(pieceOffsetEuler);
          piece.position.add(pieceOffsetVector);
        }
        piece.visible = pieceReveal > 0.005;
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

        if (pieceReveal > 0.15 && centerFocus > featuredStrength) {
          featuredStrength = centerFocus;
          featuredPiece = piece;
        }

        piece.traverse((child) => {
          if (child.isMesh && child.userData.themeMaterials) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material, index) => {
              const themeMaterial = child.userData.themeMaterials[index] ?? child.userData.themeMaterials[0];
              if (material.color && themeMaterial) {
                pieceColorScratch.copy(themeMaterial.ownerColor).lerp(themeMaterial.riskColor, piece.userData.themeMix);
                pieceHighlightScratch.copy(centerHighlightWarm).lerp(centerHighlightCool, clamp01((piece.position.z + 7) / 14));
                material.color.copy(pieceColorScratch).lerp(pieceHighlightScratch, centerFocus * 0.048 + (isFocused ? 0.075 : 0));

                const ownerSurface = themeMaterial.ownerSurface;
                const riskSurface = themeMaterial.riskSurface;
                material.roughness = Math.max(
                  0.14,
                  THREE.MathUtils.lerp(ownerSurface.roughness, riskSurface.roughness, piece.userData.themeMix) - centerFocus * 0.06 - (isFocused ? 0.04 : 0),
                );
                material.metalness = Math.min(
                  0.18,
                  THREE.MathUtils.lerp(ownerSurface.metalness, riskSurface.metalness, piece.userData.themeMix) + centerFocus * 0.03,
                );
                material.clearcoat = Math.min(
                  1,
                  THREE.MathUtils.lerp(ownerSurface.clearcoat, riskSurface.clearcoat, piece.userData.themeMix) + centerFocus * 0.12 + (isFocused ? 0.08 : 0),
                );
                material.clearcoatRoughness = Math.max(
                  0.08,
                  THREE.MathUtils.lerp(ownerSurface.clearcoatRoughness, riskSurface.clearcoatRoughness, piece.userData.themeMix) - centerFocus * 0.03,
                );
                material.envMapIntensity = THREE.MathUtils.lerp(ownerSurface.envMapIntensity, riskSurface.envMapIntensity, piece.userData.themeMix)
                  + centerFocus * 0.34
                  + (isFocused ? 0.16 : 0);
                material.specularIntensity = Math.min(
                  1,
                  THREE.MathUtils.lerp(ownerSurface.specularIntensity, riskSurface.specularIntensity, piece.userData.themeMix) + centerFocus * 0.08,
                );
                pieceSpecularScratch.copy(ownerSurface.specularColor).lerp(riskSurface.specularColor, piece.userData.themeMix);
                material.specularColor.copy(pieceSpecularScratch);
              }
              material.opacity = pieceReveal;
              material.depthWrite = pieceReveal > 0.06;
            });
          }
        });
      });

      if (currentHoveredUUID !== null) {
        const activePiece = interactivePieces.find((piece) => piece.uuid === currentHoveredUUID);
        if (!activePiece || activePiece.userData.revealProgress <= 0.05) {
          pushActivePieceToReact(null);
        }
      }

      if (featuredPiece) {
        spotlightWorldTarget.copy(featuredPiece.position);
        spotlightWorldTarget.y += featuredPiece.userData.visualHeight * 0.58;

        spotlightWorldPosition.set(
          featuredPiece.position.x + 3.1,
          spotlightWorldTarget.y + 10.6,
          featuredPiece.position.z + 5.9,
        );

        centerSpotLight.position.lerp(spotlightWorldPosition, 0.12);
        centerSpotLight.target.position.lerp(spotlightWorldTarget, 0.18);
        keyShadowLight.target.position.lerp(spotlightWorldTarget, 0.06);
        warmRimLight.target.position.lerp(spotlightWorldTarget, 0.08);
        coolRimLight.target.position.lerp(spotlightWorldTarget, 0.08);
        displayFillLight.lookAt(spotlightWorldTarget);
        sideFillLight.lookAt(spotlightWorldTarget);
        centerSpotLight.intensity += ((0.76 + featuredStrength * 1.4) - centerSpotLight.intensity) * 0.12;
      } else {
        centerSpotLight.intensity += (0.72 - centerSpotLight.intensity) * 0.12;
      }
      keyShadowLight.target.updateMatrixWorld();
      warmRimLight.target.updateMatrixWorld();
      coolRimLight.target.updateMatrixWorld();
      centerSpotLight.target.updateMatrixWorld();

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    if (isVisible) startAnimation();

    const handleResize = () => {
      const mount = mountRef.current;
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const newAspect = w / h;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      camera.left = -d * newAspect;
      camera.right = d * newAspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      visibilityObserver.disconnect();
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
      environmentTarget.dispose();
      pmremGenerator.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
      scene.clear();
      boardTiles = [];
      boardTileLookup = new Map();
      interactivePieces = [];
    };
  }, []);

  const activePieceHeading = isRiskTheme ? pieceInfo.redHeading : pieceInfo.whiteHeading;
  const activePieceSub = isRiskTheme ? pieceInfo.redSub : pieceInfo.whiteSub;
  const activePieceImage = isRiskTheme ? pieceInfo.redImageSrc : pieceInfo.whiteImageSrc;
  const showPiecePreview = pieceInfo.active && Boolean(activePieceImage);
  const showPieceText = pieceInfo.active && Boolean(activePieceHeading || activePieceSub);
  const showHints = showHintPrompts && !pieceInfo.active;
  const showPieceToggleHint = !pieceInfo.active;

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-[#222327]">
      <div
        className="sticky w-full overflow-hidden"
        style={{
          top: headerHeight,
          height: `calc(100vh - ${headerHeight}px)`,
        }}
      >
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

        {showPiecePreview ? (
          <img
            src={activePieceImage}
            alt={activePieceHeading || 'Focused chess piece'}
            className="absolute bottom-8 left-8 z-20 h-auto w-[220px] md:bottom-10 md:left-10 md:w-[280px] object-contain transition-all duration-500 ease-out"
          />
        ) : null}

        <div
          id="section2-hint"
          className={`pointer-events-none absolute bottom-10 left-10 z-10 transition-opacity duration-300 ${
            showHints ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center gap-3 text-white">
            <AnimatedTabHint />
            <span className="text-[11px] font-bold uppercase tracking-[0.34em] drop-shadow-lg md:text-sm">
              TOGGLE VIEW
            </span>
          </div>
        </div>

        <div
          className={`absolute top-24 right-10 z-20 min-w-[300px] px-8 py-6 rounded-xl transition-all duration-500 ease-out shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${showPieceText ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}
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
          id="section2-hint-pieces"
          className={`pointer-events-none absolute top-10 right-10 z-10 transition-opacity duration-300 ${
            showPieceToggleHint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center gap-3 text-white">
            <AnimatedSpacebarHint />
            <span className="text-[11px] font-bold uppercase tracking-[0.34em] drop-shadow-lg md:text-sm">
              TOGGLE PIECES
            </span>
          </div>
        </div>

        <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-crosshair" />
      </div>
    </div>
  );
};

export default function App() {
  const siteHeaderRef = useRef(null);
  const navMenusRef = useRef(null);
  const closeMenuTimerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [openMenuKey, setOpenMenuKey] = useState(null);

  const clearMenuCloseTimer = () => {
    if (closeMenuTimerRef.current !== null) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
  };

  const openMenu = (menuKey) => {
    clearMenuCloseTimer();
    setOpenMenuKey(menuKey);
  };

  const toggleMenu = (menuKey) => {
    clearMenuCloseTimer();
    setOpenMenuKey((current) => (current === menuKey ? null : menuKey));
  };

  const scheduleMenuClose = () => {
    clearMenuCloseTimer();
    closeMenuTimerRef.current = window.setTimeout(() => {
      setOpenMenuKey(null);
      closeMenuTimerRef.current = null;
    }, 140);
  };

  const closeMenu = () => {
    clearMenuCloseTimer();
    setOpenMenuKey(null);
  };

  useEffect(() => {
    const headerEl = siteHeaderRef.current;
    if (!headerEl) return undefined;

    const syncHeaderHeight = () => {
      const nextHeight = Math.round(headerEl.getBoundingClientRect().height);
      if (nextHeight > 0) setHeaderHeight(nextHeight);
    };

    syncHeaderHeight();

    let resizeObserver;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(syncHeaderHeight);
      resizeObserver.observe(headerEl);
    }

    window.addEventListener('resize', syncHeaderHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (navMenusRef.current && !navMenusRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      clearMenuCloseTimer();
    };
  }, []);

  const heroHeight = `calc(100svh - ${headerHeight}px)`;

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

      <header
        ref={siteHeaderRef}
        className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-white/14 bg-[#151922]/94 px-4 py-2 md:px-7 md:py-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-center text-white shrink-0">
          <img src={logoSvg} alt="CRE POV" className="h-[52px] w-auto max-w-none md:h-[54px]" />
        </div>
        <nav
          ref={navMenusRef}
          className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1.5 md:gap-2"
        >
          {HEADER_MENUS.map((menu) => (
            <HeaderMenu
              key={menu.key}
              menu={menu}
              isOpen={openMenuKey === menu.key}
              onOpen={openMenu}
              onToggle={toggleMenu}
              onHoverClose={scheduleMenuClose}
              onClose={closeMenu}
            />
          ))}
        </nav>
      </header>

      <section
        id="what"
        className="relative flex-none overflow-hidden border-b border-white/20 bg-[#0c1117]"
        style={{ minHeight: heroHeight }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(33,73,114,0.3)_0%,rgba(11,15,21,0.96)_84%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,18,0.18)_0%,rgba(8,12,18,0.05)_34%,rgba(14,16,22,0.58)_100%)]" />
        <div className="absolute inset-0">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#1C1D21]" />
        </div>

        <div
          className="relative flex w-full items-center justify-center px-3 sm:px-5 md:px-8"
          style={{ minHeight: heroHeight, contain: 'paint' }}
        >
          <img
            src={leagueSpartanBg}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            draggable="false"
            className="block h-auto w-full max-w-[2048px] object-contain object-center select-none"
            style={{ maxHeight: heroHeight, transform: 'translateZ(0)' }}
          />
          <div className="sr-only">
            <h1>CRE Stories Gamified</h1>
            <p>Never CRE the same.</p>
          </div>
        </div>
      </section>

      <section id="who" className="w-full border-b border-white/20 relative">
        <ChessTreadmill headerHeight={headerHeight} />
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
