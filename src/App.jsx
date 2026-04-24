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
const PIECE_MATERIAL_PROFILES = {
  owner: {
    color: '#F3F2EE',
    transmission: 0.72,
    roughness: 0.025,
    metalness: 0,
    ior: 1.53,
    thickness: 0.34,
    attenuationColor: '#FFFFFF',
    attenuationDistance: 1.65,
    clearcoat: 1,
    clearcoatRoughness: 0.045,
    reflectivity: 0.72,
    envMapIntensity: 1.18,
    specularIntensity: 0.86,
    specularColor: '#FFF9EF',
  },
  risk: {
    color: '#97182E',
    transmission: 1,
    roughness: 0.02,
    metalness: 0,
    ior: 1.53,
    thickness: 0.5,
    attenuationColor: '#1A1A1D',
    attenuationDistance: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    reflectivity: 0.76,
    envMapIntensity: 1.35,
    specularIntensity: 0.82,
    specularColor: '#F0BEC7',
  },
};

const CHESS_ROAD_WIDTH_TILES = 5;
const CHESS_ROAD_LENGTH_TILES = 24;
const CHESS_ROAD_START_COLUMN = -4;
const CHESS_ROAD_TILE_SIZE = 3.5;
const CHESS_ROAD_BOARD_THICKNESS = 1.5;
const CHESS_ROAD_CENTER_ROW = Math.floor(CHESS_ROAD_WIDTH_TILES / 2);
const TERMINAL_SECTION_START_COLUMN = 16;
const TERMINAL_TILE_ASSEMBLY_STAGGER = CHESS_ROAD_TILE_SIZE * 0.42;
const MAX_PATH_SCROLL = 65;
const IS_DEVELOPMENT = import.meta.env.DEV;
const QUEEN_PAWN_FORMATION_DEBUG = false;
const QUEEN_PAWN_FORMATION_VALIDATION_INTERVAL_MS = 1000;
const QUEEN_PAWN_FORMATION_SPACING = CHESS_ROAD_TILE_SIZE * 1.18;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (edge0, edge1, value) => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const formatVectorForDebug = (vector) => ({
  x: Number(vector.x.toFixed(3)),
  y: Number(vector.y.toFixed(3)),
  z: Number(vector.z.toFixed(3)),
});

const createPolishedResinPieceMaterial = (sourceMaterial, initialMix = 0) => {
  const material = new THREE.MeshPhysicalMaterial({
    color: PIECE_MATERIAL_PROFILES.owner.color,
    transmission: PIECE_MATERIAL_PROFILES.owner.transmission,
    roughness: PIECE_MATERIAL_PROFILES.owner.roughness,
    metalness: PIECE_MATERIAL_PROFILES.owner.metalness,
    ior: PIECE_MATERIAL_PROFILES.owner.ior,
    thickness: PIECE_MATERIAL_PROFILES.owner.thickness,
    attenuationColor: PIECE_MATERIAL_PROFILES.owner.attenuationColor,
    attenuationDistance: PIECE_MATERIAL_PROFILES.owner.attenuationDistance,
    clearcoat: PIECE_MATERIAL_PROFILES.owner.clearcoat,
    clearcoatRoughness: PIECE_MATERIAL_PROFILES.owner.clearcoatRoughness,
    reflectivity: PIECE_MATERIAL_PROFILES.owner.reflectivity,
    envMapIntensity: PIECE_MATERIAL_PROFILES.owner.envMapIntensity,
    specularIntensity: PIECE_MATERIAL_PROFILES.owner.specularIntensity,
    specularColor: PIECE_MATERIAL_PROFILES.owner.specularColor,
    transparent: true,
    opacity: 1,
    side: sourceMaterial?.side ?? THREE.FrontSide,
    dithering: true,
  });
  material.userData.ownerProfile = {
    ...PIECE_MATERIAL_PROFILES.owner,
    color: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.color),
    attenuationColor: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.attenuationColor),
    specularColor: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.specularColor),
  };
  material.userData.riskProfile = {
    ...PIECE_MATERIAL_PROFILES.risk,
    color: new THREE.Color(PIECE_MATERIAL_PROFILES.risk.color),
    attenuationColor: new THREE.Color(PIECE_MATERIAL_PROFILES.risk.attenuationColor),
    specularColor: new THREE.Color(PIECE_MATERIAL_PROFILES.risk.specularColor),
  };
  syncPolishedResinPieceMaterial(material, initialMix, 1);
  material.needsUpdate = true;
  return material;
};

function syncPolishedResinPieceMaterial(material, themeMix, opacity) {
  const ownerProfile = material.userData.ownerProfile;
  const riskProfile = material.userData.riskProfile;
  if (!ownerProfile || !riskProfile) return;

  material.color.copy(ownerProfile.color).lerp(riskProfile.color, themeMix);
  material.attenuationColor.copy(ownerProfile.attenuationColor).lerp(riskProfile.attenuationColor, themeMix);
  material.specularColor.copy(ownerProfile.specularColor).lerp(riskProfile.specularColor, themeMix);
  material.transmission = THREE.MathUtils.lerp(ownerProfile.transmission, riskProfile.transmission, themeMix);
  material.roughness = THREE.MathUtils.lerp(ownerProfile.roughness, riskProfile.roughness, themeMix);
  material.metalness = THREE.MathUtils.lerp(ownerProfile.metalness, riskProfile.metalness, themeMix);
  material.ior = THREE.MathUtils.lerp(ownerProfile.ior, riskProfile.ior, themeMix);
  material.thickness = THREE.MathUtils.lerp(ownerProfile.thickness, riskProfile.thickness, themeMix);
  material.attenuationDistance = THREE.MathUtils.lerp(ownerProfile.attenuationDistance, riskProfile.attenuationDistance, themeMix);
  material.clearcoat = THREE.MathUtils.lerp(ownerProfile.clearcoat, riskProfile.clearcoat, themeMix);
  material.clearcoatRoughness = THREE.MathUtils.lerp(ownerProfile.clearcoatRoughness, riskProfile.clearcoatRoughness, themeMix);
  material.reflectivity = THREE.MathUtils.lerp(ownerProfile.reflectivity, riskProfile.reflectivity, themeMix);
  material.envMapIntensity = THREE.MathUtils.lerp(ownerProfile.envMapIntensity, riskProfile.envMapIntensity, themeMix);
  material.specularIntensity = THREE.MathUtils.lerp(ownerProfile.specularIntensity, riskProfile.specularIntensity, themeMix);
  material.opacity = opacity;
  material.depthWrite = opacity > 0.72;
}

const createSubtleMarbleTexture = ({ baseColor, veinColor, highlightColor, veinOpacity }) => {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let index = 0; index < 7; index += 1) {
    const y = -44 + index * 48;
    const drift = Math.sin(index * 1.7) * 16;
    ctx.globalAlpha = veinOpacity * (index % 3 === 0 ? 1.25 : 0.72);
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = index % 3 === 0 ? 1.15 : 0.62;
    ctx.beginPath();
    ctx.moveTo(-24, y + drift);
    ctx.bezierCurveTo(
      58,
      y + 12 + Math.cos(index * 0.9) * 20,
      152,
      y - 18 + Math.sin(index * 1.2) * 22,
      286,
      y + 34 + Math.cos(index * 1.4) * 18,
    );
    ctx.stroke();

    ctx.globalAlpha = veinOpacity * 0.28;
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-18, y + drift + 5);
    ctx.bezierCurveTo(72, y + 18, 148, y - 10, 278, y + 38);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const makeTileCoord = (column, row) => ({ column, row });
const cloneTileCoord = ({ column, row }) => ({ column, row });
const getTileCoordKey = ({ column, row }) => `${column}:${row}`;
const isTerminalTileCoord = (coord) => Boolean(coord && coord.column >= TERMINAL_SECTION_START_COLUMN);
const tileCoordToLogicalPosition = (column, row) => ({
  logicalX: column * CHESS_ROAD_TILE_SIZE,
  logicalZ: (row - CHESS_ROAD_CENTER_ROW) * CHESS_ROAD_TILE_SIZE,
});
const getTileCoordDelta = (coord, anchorCoord) => ({
  column: coord.column - anchorCoord.column,
  row: coord.row - anchorCoord.row,
});
const buildSquareTileCoords = (anchorCoord, radius) => {
  const coords = [];
  for (let column = anchorCoord.column - radius; column <= anchorCoord.column + radius; column += 1) {
    for (let row = anchorCoord.row - radius; row <= anchorCoord.row + radius; row += 1) {
      coords.push(makeTileCoord(column, row));
    }
  }
  return coords;
};
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
    key: 'cre-pov',
    label: 'CRE POV',
    align: 'left',
    sections: [
      {
        title: null,
        links: [
          { label: 'What is it?', href: '#what' },
          { label: 'Chess=CRE', href: '#who' },
          { label: 'Follow us', href: '#where' },
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
          { label: 'Retail Services', href: 'https://www.quine.com' },
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

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
    let accumulatedTime = 0;
    let lastTime = Date.now();
    let isVisible = false;
    let isAnimating = false;
    let disposed = false;
    let needsRaycast = true;
    let lastRaycastTime = 0;
    let frameId;

    const onPointerMove = (e) => {
      const mount = mountRef.current;
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      needsRaycast = true;
    };

    const onPointerLeave = () => {
      mouse2D.set(-1000, -1000);
      isHovering = false;
      needsRaycast = true;
    };

    currentMount.addEventListener('pointermove', onPointerMove, { passive: true });
    currentMount.addEventListener('pointerleave', onPointerLeave);

    const startAnimation = () => {
      if (!isAnimating && !disposed) {
        isAnimating = true;
        frameId = requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        accumulatedTime = 0;
        lastTime = Date.now();
        isVisible = true;
        startAnimation();
      } else {
        isVisible = false;
        if (isAnimating) {
          cancelAnimationFrame(frameId);
          isAnimating = false;
        }
      }
    }, { threshold: 0.1 });

    observer.observe(currentMount);
    const initialRect = currentMount.getBoundingClientRect();
    isVisible = initialRect.bottom > 0 && initialRect.top < window.innerHeight;

    const handleWheel = (e) => {
      if (isHovering) {
        e.preventDefault();
        targetScrollRotationRef.current += e.deltaY * 0.003;
      }
    };

    currentMount.addEventListener('wheel', handleWheel, { passive: false });

    const animate = () => {
      if (disposed || !isVisible) {
        isAnimating = false;
        return;
      }

      const now = Date.now();
      if (isVisible) {
        const delta = (now - lastTime) * 0.001;
        accumulatedTime += delta;
      }
      lastTime = now;

      if (needsRaycast || now - lastRaycastTime > 120) {
        needsRaycast = false;
        lastRaycastTime = now;
        raycaster.setFromCamera(mouse2D, camera);
        const intersects = raycaster.intersectObject(group, true);
        isHovering = intersects.length > 0;
      }

      scrollRotationRef.current += (targetScrollRotationRef.current - scrollRotationRef.current) * 0.08;

      group.position.y = Math.sin(accumulatedTime * 1.05) * 0.2;
      octahedron.rotation.y = (-5 * Math.PI / 4) - (accumulatedTime * 0.245) - scrollRotationRef.current;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    if (isVisible) startAnimation();

    const handleResize = () => {
      const mount = mountRef.current;
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('pointermove', onPointerMove);
      currentMount.removeEventListener('pointerleave', onPointerLeave);
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
    let currentMilestoneLabel = '';
    let currentMilestoneMode = '';
    let interactionMode = 'hover';
    let needsRaycast = true;
    let lastRaycastTime = 0;
    let lastRaycastScroll = -Infinity;
    let scrollRafId = 0;
    let lastBoardPathScroll = Infinity;
    let lastBoardIntroProgress = Infinity;
    let ownerPieceNodes = {};
    let riskPieceNodes = {};
    let boardTileLookup = new Map();
    let queenPawnFormation = null;
    let lastQueenPawnFormationValidation = 0;
    let frameId;
    let disposed = false;
    let isVisible = false;
    let isAnimating = false;

    const COLOR_BOARD_IVORY = '#F3F2EE';
    const COLOR_BOARD_CHARCOAL = '#1A1A1D';
    const COLOR_BOARD_EDGE_LIGHT = 0xc9c7be;
    const COLOR_BOARD_EDGE_DARK = 0x07070a;

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;

    const currentMount = mountRef.current;
    currentMount.appendChild(renderer.domElement);

    RectAreaLightUniformsLib.init();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 1.18;

    const ambientHemisphereLight = new THREE.HemisphereLight(0xfff7ed, 0x07080d, 0.15);
    scene.add(ambientHemisphereLight);

    const keyShadowLight = new THREE.SpotLight(0xfff3e6, 1.72, 92, Math.PI / 5.8, 0.84, 1.72);
    keyShadowLight.position.set(17, 27, 14);
    keyShadowLight.castShadow = true;
    keyShadowLight.shadow.mapSize.set(1024, 1024);
    keyShadowLight.shadow.bias = -0.00008;
    keyShadowLight.shadow.normalBias = 0.055;
    keyShadowLight.shadow.radius = 3;
    keyShadowLight.target.position.set(3.5, 2.6, 0);
    scene.add(keyShadowLight);
    scene.add(keyShadowLight.target);

    const displayFillLight = new THREE.RectAreaLight(0xffffff, 2.55, 18, 7);
    displayFillLight.position.set(1.5, 16.5, 12.5);
    displayFillLight.lookAt(4, 2.4, 0);
    scene.add(displayFillLight);

    const sideFillLight = new THREE.RectAreaLight(0xcbd8ff, 1.45, 9, 17);
    sideFillLight.position.set(-17, 7.6, -6.5);
    sideFillLight.lookAt(6, 2, 0);
    scene.add(sideFillLight);

    const resinBounceLight = new THREE.RectAreaLight(0x97182e, 1.85, 10, 5.5);
    resinBounceLight.position.set(-4.5, 5.8, 8.5);
    resinBounceLight.lookAt(5, 1.1, 0);
    scene.add(resinBounceLight);

    const warmRimLight = new THREE.SpotLight(0xffb9a5, 0.78, 86, Math.PI / 6.2, 0.91, 1.92);
    warmRimLight.position.set(15, 10.8, -18);
    warmRimLight.target.position.set(6, 2.2, 0);
    scene.add(warmRimLight);
    scene.add(warmRimLight.target);

    const coolRimLight = new THREE.SpotLight(0xc2d7ff, 0.72, 90, Math.PI / 5.8, 0.92, 1.96);
    coolRimLight.position.set(-20, 11.5, -14);
    coolRimLight.target.position.set(2, 2.4, 0);
    scene.add(coolRimLight);
    scene.add(coolRimLight.target);

    const centerSpotLight = new THREE.SpotLight(0xffffff, 1.08, 42, Math.PI / 11.5, 0.9, 1.52);
    centerSpotLight.position.set(4.4, 15.8, 6.8);
    centerSpotLight.castShadow = false;
    centerSpotLight.target.position.set(0, 0, 0);
    scene.add(centerSpotLight);
    scene.add(centerSpotLight.target);

    const loader = new GLTFLoader();

    const loadGLTF = (url) =>
      new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

    const terminalSectionStartLogicalX = TERMINAL_SECTION_START_COLUMN * CHESS_ROAD_TILE_SIZE;
    const rigidSectionEuler = new THREE.Euler();
    const rigidSectionOffsetVector = new THREE.Vector3();

    function getPathTransform(baseX, baseZ) {
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

    function getRigidSectionTransform(anchorBaseX, localOffsetX, localOffsetZ) {
      const anchorTransform = getPathTransform(anchorBaseX, 0);
      rigidSectionEuler.set(anchorTransform.rx, anchorTransform.ry, anchorTransform.rz);
      rigidSectionOffsetVector.set(localOffsetX, 0, localOffsetZ).applyEuler(rigidSectionEuler);

      return {
        x: anchorTransform.x + rigidSectionOffsetVector.x,
        y: anchorTransform.y + rigidSectionOffsetVector.y,
        z: anchorTransform.z + rigidSectionOffsetVector.z,
        rx: anchorTransform.rx,
        ry: anchorTransform.ry,
        rz: anchorTransform.rz,
      };
    }

    function getBoardTransformForTileCoord(tileCoord, pathScroll) {
      if (isTerminalTileCoord(tileCoord)) {
        const tileDelta = getTileCoordDelta(tileCoord, makeTileCoord(TERMINAL_SECTION_START_COLUMN, CHESS_ROAD_CENTER_ROW));
        return getRigidSectionTransform(
          terminalSectionStartLogicalX - pathScroll,
          tileDelta.column * CHESS_ROAD_TILE_SIZE,
          tileDelta.row * CHESS_ROAD_TILE_SIZE,
        );
      }

      const tilePosition = tileCoordToLogicalPosition(tileCoord.column, tileCoord.row);
      return getPathTransform(tilePosition.logicalX - pathScroll, tilePosition.logicalZ);
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
      if (currentX > 7.5) {
        return 1 - smoothstep(7.5, 18.25, currentX);
      }
      return 1;
    }

    function getTileAssemblyProgress(tileCoord, pathScroll) {
      if (isTerminalTileCoord(tileCoord)) {
        const terminalColumnStagger = (tileCoord.column - TERMINAL_SECTION_START_COLUMN) * TERMINAL_TILE_ASSEMBLY_STAGGER;
        const terminalRowStagger = Math.abs(tileCoord.row - CHESS_ROAD_CENTER_ROW) * 0.18;
        return getBoardAssemblyProgress(terminalSectionStartLogicalX + terminalColumnStagger + terminalRowStagger - pathScroll);
      }

      const tilePosition = tileCoordToLogicalPosition(tileCoord.column, tileCoord.row);
      return getBoardAssemblyProgress(tilePosition.logicalX - pathScroll);
    }

    const spotlightWorldTarget = new THREE.Vector3();
    const spotlightWorldPosition = new THREE.Vector3();

    function createChessRoad() {
      const boardGroup = new THREE.Group();
      const tileGeo = new THREE.BoxGeometry(CHESS_ROAD_TILE_SIZE, CHESS_ROAD_BOARD_THICKNESS, CHESS_ROAD_TILE_SIZE);
      const tileEdgeGeo = new THREE.EdgesGeometry(tileGeo);
      const createMarbleMaterial = (isDark) => {
        const map = createSubtleMarbleTexture({
          baseColor: isDark ? COLOR_BOARD_CHARCOAL : COLOR_BOARD_IVORY,
          veinColor: isDark ? '#303037' : '#C9C6BC',
          highlightColor: isDark ? '#4A222B' : '#FFFFFF',
          veinOpacity: isDark ? 0.14 : 0.16,
        });

        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          map,
          roughness: isDark ? 0.13 : 0.11,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: isDark ? 0.055 : 0.045,
          reflectivity: 0.78,
          envMapIntensity: isDark ? 1.34 : 1.16,
          specularIntensity: isDark ? 0.72 : 0.82,
          specularColor: isDark ? 0x7a2534 : 0xffe2e6,
          emissive: isDark ? 0x050305 : 0x0a0405,
          emissiveIntensity: 0.01,
          transparent: true,
          opacity: 1,
          dithering: true,
        });
        material.needsUpdate = true;
        return material;
      };

      const matLight = createMarbleMaterial(false);
      const matDark = createMarbleMaterial(true);

      for (let x = CHESS_ROAD_START_COLUMN; x < CHESS_ROAD_LENGTH_TILES; x += 1) {
        for (let z = 0; z < CHESS_ROAD_WIDTH_TILES; z += 1) {
          const isDark = (x + z) % 2 === 0;
          const tileMat = isDark ? matDark.clone() : matLight.clone();
          const originalX = x * CHESS_ROAD_TILE_SIZE;

          const tile = new THREE.Mesh(tileGeo, tileMat);
          tile.receiveShadow = true;
          tile.castShadow = false;

          const edgeColor = isDark ? COLOR_BOARD_EDGE_DARK : COLOR_BOARD_EDGE_LIGHT;
          tile.add(new THREE.LineSegments(
            tileEdgeGeo,
            new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.32 }),
          ));

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
            emissiveColor: new THREE.Color(isDark ? 0x15070b : 0x2a1016),
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
      const size = initialBox.getSize(new THREE.Vector3());
      const targetHeight = (PIECE_HEIGHTS[pieceType] ?? 4) * PIECE_SCALE_MULTIPLIER;
      const scale = size.y > 0 ? targetHeight / size.y : 1;
      modelRoot.scale.multiplyScalar(scale);
      modelRoot.updateMatrixWorld(true);

      const scaledBox = new THREE.Box3().setFromObject(modelRoot);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      modelRoot.position.x -= scaledCenter.x;
      modelRoot.position.y -= scaledBox.min.y;
      modelRoot.position.z -= scaledCenter.z;
      modelRoot.updateMatrixWorld(true);
    }

    function createPieceInstance(pieceType) {
      const source = ownerPieceNodes[pieceType] ?? riskPieceNodes[pieceType];
      if (!source) return null;

      const pieceClone = source.clone(true);
      const pieceMeshes = [];
      const initialMix = currentMode === 'risk' ? 1 : 0;

      pieceClone.traverse((child) => {
        if (child.isMesh) pieceMeshes.push(child);
      });

      pieceMeshes.forEach((mesh) => {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.computeVertexNormals();
        mesh.geometry.normalizeNormals();

        const sourceMaterials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material].filter(Boolean);
        const instanceMaterials = (sourceMaterials.length ? sourceMaterials : [null])
          .map((material) => createPolishedResinPieceMaterial(material, initialMix));

        mesh.material = Array.isArray(mesh.material) ? instanceMaterials : instanceMaterials[0];
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });

      normalizePieceModel(pieceClone, pieceType);

      const pieceGroup = new THREE.Group();
      pieceGroup.add(pieceClone);
      pieceGroup.userData = {
        ...pieceGroup.userData,
        pieceType,
        visualHeight: (PIECE_HEIGHTS[pieceType] ?? 4) * PIECE_SCALE_MULTIPLIER,
        renderMeshes: pieceMeshes,
        themeMix: initialMix,
        targetThemeMix: initialMix,
      };

      return pieceGroup;
    }

    function placePiece(pieceType, uiData, placementOptions = {}) {
      const meshGroup = createPieceInstance(pieceType);
      if (!meshGroup) return;

      const boardCoord = placementOptions.boardCoord ? cloneTileCoord(placementOptions.boardCoord) : null;
      const anchorBoardCoord = placementOptions.anchorBoardCoord
        ? cloneTileCoord(placementOptions.anchorBoardCoord)
        : boardCoord;
      const formationAnchorBoardCoord = placementOptions.formationAnchorBoardCoord
        ? cloneTileCoord(placementOptions.formationAnchorBoardCoord)
        : null;
      const formationLocalOffset = placementOptions.formationLocalOffset
        ? new THREE.Vector3(...placementOptions.formationLocalOffset)
        : null;
      const logicalReferenceCoord = placementOptions.lockToAnchorProgress && anchorBoardCoord ? anchorBoardCoord : boardCoord;
      const formationAnchorPosition = formationAnchorBoardCoord
        ? tileCoordToLogicalPosition(formationAnchorBoardCoord.column, formationAnchorBoardCoord.row)
        : null;
      const basePosition = formationAnchorPosition && formationLocalOffset
        ? {
            logicalX: formationAnchorPosition.logicalX + formationLocalOffset.x,
            logicalZ: formationAnchorPosition.logicalZ + formationLocalOffset.z,
          }
        : logicalReferenceCoord
        ? tileCoordToLogicalPosition(logicalReferenceCoord.column, logicalReferenceCoord.row)
        : boardCoord
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
        anchorBoardCoord,
        formationId: placementOptions.formationId ?? null,
        formationRole: placementOptions.formationRole ?? null,
        formationAnchorBoardCoord,
        formationLocalOffset,
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
      return meshGroup;
    }

    const queenPawnFormationOffsets = [
      { key: 'front-left', columnOffset: -1, rowOffset: -1, position: [-QUEEN_PAWN_FORMATION_SPACING, 0, -QUEEN_PAWN_FORMATION_SPACING] },
      { key: 'front-right', columnOffset: 1, rowOffset: -1, position: [QUEEN_PAWN_FORMATION_SPACING, 0, -QUEEN_PAWN_FORMATION_SPACING] },
      { key: 'back-left', columnOffset: -1, rowOffset: 1, position: [-QUEEN_PAWN_FORMATION_SPACING, 0, QUEEN_PAWN_FORMATION_SPACING] },
      { key: 'back-right', columnOffset: 1, rowOffset: 1, position: [QUEEN_PAWN_FORMATION_SPACING, 0, QUEEN_PAWN_FORMATION_SPACING] },
    ];
    const formationAnchorEuler = new THREE.Euler();
    const formationOffsetVector = new THREE.Vector3();
    const pieceAnchorEuler = new THREE.Euler();
    const pieceAnchorOffsetVector = new THREE.Vector3();

    function resolveFormationTransform(anchorBoardCoord, localOffset, pathScroll) {
      const anchorTransform = getBoardTransformForTileCoord(anchorBoardCoord, pathScroll);
      formationAnchorEuler.set(anchorTransform.rx, anchorTransform.ry, anchorTransform.rz);
      formationOffsetVector.copy(localOffset).applyEuler(formationAnchorEuler);

      return {
        x: anchorTransform.x + formationOffsetVector.x,
        y: anchorTransform.y + formationOffsetVector.y,
        z: anchorTransform.z + formationOffsetVector.z,
        rx: anchorTransform.rx,
        ry: anchorTransform.ry,
        rz: anchorTransform.rz,
      };
    }

    function createQueenPawnFormationDebugMarkers(formation) {
      if (!IS_DEVELOPMENT || !QUEEN_PAWN_FORMATION_DEBUG) return [];

      const markerGeometry = new THREE.SphereGeometry(0.16, 16, 10);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x63f4ff,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      });

      return formation.expectedLocalOffsets.map(({ key, position }) => {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.name = `QueenPawnFormation_expected_${key}`;
        marker.userData.formationLocalOffset = position.clone();
        marker.renderOrder = 100;
        scene.add(marker);
        return marker;
      });
    }

    function updateQueenPawnFormationDebugMarkers(pathScroll) {
      if (!queenPawnFormation?.markerRefs?.length) return;

      queenPawnFormation.markerRefs.forEach((marker) => {
        const transform = resolveFormationTransform(
          queenPawnFormation.anchorBoardCoord,
          marker.userData.formationLocalOffset,
          pathScroll,
        );
        marker.position.set(transform.x, transform.y + PIECE_BASE_LIFT + 0.1, transform.z);
        marker.rotation.set(transform.rx, transform.ry, transform.rz);
        marker.visible = queenPawnFormation.queenRef?.visible ?? false;
      });
    }

    function createQueenPawnFormation({ queenBoardCoord, queenUiData, pawnUiData, supportTileCoords }) {
      const formationId = 'queen-pawn-ending';
      const queenLocalOffset = new THREE.Vector3(0, 0, 0);
      const queenPiece = placePiece('queen', queenUiData, {
        boardCoord: queenBoardCoord,
        formationId,
        formationRole: 'queen-anchor',
        formationAnchorBoardCoord: queenBoardCoord,
        formationLocalOffset: queenLocalOffset.toArray(),
        lockToAnchorProgress: true,
        supportTileCoords: supportTileCoords ?? [queenBoardCoord],
      });
      const pawnPieces = queenPawnFormationOffsets.map(({ key, columnOffset, rowOffset, position }) => placePiece('pawn', pawnUiData, {
        boardCoord: makeTileCoord(queenBoardCoord.column + columnOffset, queenBoardCoord.row + rowOffset),
        formationId,
        formationRole: `pawn-${key}`,
        formationAnchorBoardCoord: queenBoardCoord,
        formationLocalOffset: position,
        lockToAnchorProgress: true,
        supportTileCoords: [makeTileCoord(queenBoardCoord.column + columnOffset, queenBoardCoord.row + rowOffset)],
      }));

      if (!queenPiece || pawnPieces.some((piece) => !piece)) {
        if (IS_DEVELOPMENT) {
          console.warn('QueenPawnFormation could not be created because a queen or pawn GLB node was missing.', {
            hasQueen: Boolean(queenPiece),
            pawnCount: pawnPieces.filter(Boolean).length,
          });
        }
        return null;
      }

      queenPiece.userData = {
        ...queenPiece.userData,
        formationExpectedLocalOffset: queenLocalOffset.clone(),
      };

      pawnPieces.forEach((pawnPiece, index) => {
        const { key, position } = queenPawnFormationOffsets[index];
        pawnPiece.name = `QueenPawnFormation_pawn_${key}`;
        pawnPiece.userData = {
          ...pawnPiece.userData,
          formationExpectedLocalOffset: new THREE.Vector3(...position),
        };
      });

      queenPawnFormation = {
        id: formationId,
        anchorBoardCoord: cloneTileCoord(queenBoardCoord),
        queenRef: queenPiece,
        pawnRefs: pawnPieces,
        expectedLocalOffsets: queenPawnFormationOffsets.map(({ key, position }) => ({
          key,
          position: new THREE.Vector3(...position),
        })),
        supportTileCoords: (supportTileCoords ?? buildSquareTileCoords(queenBoardCoord, 1)).map(cloneTileCoord),
        tileSize: CHESS_ROAD_TILE_SIZE,
        spacing: QUEEN_PAWN_FORMATION_SPACING,
        pieceYOffset: PIECE_BASE_LIFT,
      };
      queenPawnFormation.markerRefs = createQueenPawnFormationDebugMarkers(queenPawnFormation);

      return queenPawnFormation;
    }

    function getPieceTransform(piece, pathScroll) {
      if (piece.userData.formationAnchorBoardCoord && piece.userData.formationLocalOffset) {
        return resolveFormationTransform(
          piece.userData.formationAnchorBoardCoord,
          piece.userData.formationLocalOffset,
          pathScroll,
        );
      }

      const anchorBoardCoord = piece.userData.anchorBoardCoord;
      const boardCoord = piece.userData.boardCoord;

      if (anchorBoardCoord && boardCoord) {
        const anchorTransform = getBoardTransformForTileCoord(anchorBoardCoord, pathScroll);
        const tileDelta = getTileCoordDelta(boardCoord, anchorBoardCoord);
        pieceAnchorEuler.set(anchorTransform.rx, anchorTransform.ry, anchorTransform.rz);
        pieceAnchorOffsetVector.set(
          tileDelta.column * CHESS_ROAD_TILE_SIZE,
          0,
          tileDelta.row * CHESS_ROAD_TILE_SIZE,
        ).applyEuler(pieceAnchorEuler);

        return {
          x: anchorTransform.x + pieceAnchorOffsetVector.x,
          y: anchorTransform.y + pieceAnchorOffsetVector.y,
          z: anchorTransform.z + pieceAnchorOffsetVector.z,
          rx: anchorTransform.rx,
          ry: anchorTransform.ry,
          rz: anchorTransform.rz,
        };
      }

      return getPathTransform(piece.userData.logicalX - pathScroll, piece.userData.logicalZ);
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
          revealTotal += tile.userData.assemblyProgress ?? getTileAssemblyProgress(coord, pathScroll);
        } else {
          revealTotal += getTileAssemblyProgress(coord, pathScroll);
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
      const queenClusterSupportCoords = buildSquareTileCoords(queenBoardCoord, 1);

      const queenData = buildPieceUiData('queen', {
        whiteHeading: 'ECONOMY',
        redHeading: 'ECONOMY',
        whiteSub: 'STRONG MARKET',
        redSub: '[HARSH MARKET]',
      });
      const pawnData = buildPieceUiData('pawn', {
        whiteHeading: 'TIMING',
        redHeading: 'TIMING',
        whiteSub: '[via pawn differential]\nLess pressure to sell',
        redSub: '[via pawn differential]\nMore pressure to sell',
      });

      createQueenPawnFormation({
        queenBoardCoord,
        queenUiData: queenData,
        pawnUiData: pawnData,
        supportTileCoords: queenClusterSupportCoords,
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

      updateMilestoneText(Math.min(scrollPos, MAX_PATH_SCROLL));
    }

    function updateMilestoneText(currentPathScroll) {
      let msIndex = 0;
      if (currentPathScroll < 15) msIndex = 0;
      else if (currentPathScroll < 45) msIndex = 1;
      else msIndex = 2;

      const allLabels = ['PROXY', 'OPERATIONS', 'ENTROPY'];
      const activeLabel = allLabels[msIndex];

      if (headingRef.current) {
        if (currentMilestoneLabel !== activeLabel) {
          headingRef.current.innerText = activeLabel;
          currentMilestoneLabel = activeLabel;
        }
        if (currentMilestoneMode !== currentMode) {
          headingRef.current.style.color = currentMode === 'owner' ? '#F3F2EE' : '#97182E';
          currentMilestoneMode = currentMode;
        }
      }
    }

    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2(-1000, -1000);
    const raycastHitMeshes = [];

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

    const onPointerMove = (e) => {
      interactionMode = 'hover';
      needsRaycast = true;
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerLeave = () => {
      if (interactionMode === 'hover') {
        mouse2D.set(-1000, -1000);
        needsRaycast = true;
      }
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
        const currentPathScroll = Math.min(scrollPos, MAX_PATH_SCROLL);

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

    renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', handleKeyDown);

    const activeHeaderEl = headerRef.current;
    if (activeHeaderEl) activeHeaderEl.addEventListener('click', toggleMode);

    updateMilestoneText(0);

    const getHeaderHeight = () => headerHeightRef.current || 0;

    const syncScrollTarget = () => {
      scrollRafId = 0;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      let progress = -(rect.top - getHeaderHeight()) / scrollDistance;
      progress = Math.max(0, Math.min(1, progress));
      targetScrollPos = progress * 80;
    };

    const handleScroll = () => {
      if (scrollRafId !== 0) return;
      scrollRafId = requestAnimationFrame(syncScrollTarget);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    syncScrollTarget();

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
    const targetScaleVector = new THREE.Vector3(1, 1, 1);
    const queenWorldPosition = new THREE.Vector3();
    const pawnWorldPosition = new THREE.Vector3();

    function getPieceRenderMeshes(piece) {
      if (piece.userData.renderMeshes?.length) return piece.userData.renderMeshes;
      const meshes = [];
      piece.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
      piece.userData.renderMeshes = meshes;
      return meshes;
    }

    function applyPieceMaterialState(piece, opacity, themeMix) {
      getPieceRenderMeshes(piece).forEach((mesh) => {
        if (!mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if (
            Math.abs((material.userData.lastThemeMix ?? -1) - themeMix) < 0.001
            && Math.abs((material.userData.lastOpacity ?? -1) - opacity) < 0.002
          ) {
            return;
          }
          syncPolishedResinPieceMaterial(material, themeMix, opacity);
          material.userData.lastThemeMix = themeMix;
          material.userData.lastOpacity = opacity;
        });
      });
    }

    function validateQueenPawnFormation(pathScroll) {
      if (!IS_DEVELOPMENT || !queenPawnFormation) return;

      const now = performance.now();
      if (now - lastQueenPawnFormationValidation < QUEEN_PAWN_FORMATION_VALIDATION_INTERVAL_MS) return;
      lastQueenPawnFormationValidation = now;

      const formation = queenPawnFormation;
      const {
        queenRef,
        pawnRefs = [],
        expectedLocalOffsets = [],
        spacing,
        pieceYOffset,
      } = formation;
      const failures = [];
      const expectedDistance = Math.sqrt(2) * spacing;
      const allRefs = [queenRef, ...pawnRefs].filter(Boolean);
      const uniqueRefs = new Set(allRefs);

      if (!queenRef) failures.push('missing-queen-ref');
      if (pawnRefs.length !== 4 || pawnRefs.some((pawn) => !pawn)) failures.push('missing-pawn-ref');
      if (uniqueRefs.size !== allRefs.length) failures.push('formation-pieces-are-not-unique-objects');
      if (queenRef && !interactivePieces.includes(queenRef)) failures.push('queen-is-not-independently-interactive');
      if (pawnRefs.some((pawn) => pawn && !interactivePieces.includes(pawn))) {
        failures.push('pawn-is-not-independently-interactive');
      }
      if (queenRef?.parent !== scene) failures.push('queen-has-unexpected-parent-transform');
      if (pawnRefs.some((pawn) => pawn?.parent !== scene)) failures.push('pawn-has-unexpected-parent-transform');
      if (pawnRefs.some((pawn) => pawn && (pawn.parent === queenRef || queenRef?.children.includes(pawn)))) {
        failures.push('pawn-is-merged-under-queen');
      }

      scene.updateMatrixWorld(true);

      const inverseQueenRotation = new THREE.Quaternion();
      const localOffset = new THREE.Vector3();
      if (queenRef) {
        queenRef.getWorldPosition(queenWorldPosition);
        inverseQueenRotation.setFromEuler(queenRef.rotation).invert();
      }

      const pawnPositions = [];
      const localOffsets = [];
      const offsetSum = new THREE.Vector3();

      pawnRefs.forEach((pawn, index) => {
        if (!pawn) return;
        const expected = expectedLocalOffsets[index]?.position;
        pawn.getWorldPosition(pawnWorldPosition);
        const pawnWorld = pawnWorldPosition.clone();
        localOffset.copy(pawnWorldPosition).sub(queenWorldPosition).applyQuaternion(inverseQueenRotation);
        const planarDistance = Math.hypot(localOffset.x, localOffset.z);

        pawnPositions.push(formatVectorForDebug(pawnWorld));
        localOffsets.push(formatVectorForDebug(localOffset));
        offsetSum.add(localOffset);

        if (!expected || localOffset.distanceTo(expected) > 0.1) {
          failures.push(`pawn-${index}-local-offset-mismatch`);
        }
        if (Math.abs(planarDistance - expectedDistance) > 0.1) {
          failures.push(`pawn-${index}-distance-mismatch`);
        }
        if (planarDistance < CHESS_ROAD_TILE_SIZE * 1.08) {
          failures.push(`pawn-${index}-spacing-too-tight`);
        }
        if (Math.abs(localOffset.y) > 0.04) {
          failures.push(`pawn-${index}-y-offset-mismatch`);
        }
      });

      if (Math.abs(offsetSum.x) > 0.08 || Math.abs(offsetSum.z) > 0.08) {
        failures.push('pawn-box-is-not-symmetric-around-queen');
      }

      if (failures.length > 0) {
        console.warn('QueenPawnFormation validation failed.', {
          failures,
          queenPosition: queenRef ? formatVectorForDebug(queenWorldPosition) : null,
          pawnPositions,
          localOffsets,
          tileSize: CHESS_ROAD_TILE_SIZE,
          spacing,
          expectedDistance: Number(expectedDistance.toFixed(3)),
          pieceYOffset,
          pieceTransforms: allRefs.map((piece) => ({
            name: piece.name,
            position: formatVectorForDebug(piece.position),
            rotation: {
              x: Number(piece.rotation.x.toFixed(3)),
              y: Number(piece.rotation.y.toFixed(3)),
              z: Number(piece.rotation.z.toFixed(3)),
            },
            scale: formatVectorForDebug(piece.scale),
            parentType: piece.parent?.type ?? null,
          })),
          animationState: {
            pathScroll: Number(pathScroll.toFixed(3)),
            scrollPos: Number(scrollPos.toFixed(3)),
            targetScrollPos: Number(targetScrollPos.toFixed(3)),
            queenCurrentX: Number(((queenRef?.userData.logicalX ?? 0) - pathScroll).toFixed(3)),
            queenRevealProgress: Number((queenRef?.userData.revealProgress ?? 0).toFixed(3)),
            currentMode,
            currentHoveredUUID,
          },
        });
      }
    }

    const animate = () => {
      if (disposed || !isVisible) {
        isAnimating = false;
        return;
      }

      const time = Date.now();

      scrollPos += (targetScrollPos - scrollPos) * 0.08;
      const pathScroll = Math.min(scrollPos, MAX_PATH_SCROLL);
      const hasSelectedPiece = currentHoveredUUID !== null;

      updateMilestoneText(pathScroll);

      if (
        interactionMode === 'hover'
        && (
          needsRaycast
          || time - lastRaycastTime > 90
          || Math.abs(pathScroll - lastRaycastScroll) > 0.12
        )
      ) {
        needsRaycast = false;
        lastRaycastTime = time;
        lastRaycastScroll = pathScroll;
        raycaster.setFromCamera(mouse2D, camera);
        raycastHitMeshes.length = 0;

        interactivePieces.forEach((piece) => {
          if (getPieceRevealProgress(piece, pathScroll) > 0.18) {
            raycastHitMeshes.push(...getPieceRenderMeshes(piece));
          }
        });

        const intersects = raycaster.intersectObjects(raycastHitMeshes, false);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj.parent && !interactivePieces.includes(obj)) obj = obj.parent;
          if (interactivePieces.includes(obj)) pushActivePieceToReact(obj);
        } else {
          pushActivePieceToReact(null);
        }
      }

      const shouldUpdateBoard = (
        Math.abs(pathScroll - lastBoardPathScroll) > 0.001
        || Math.abs(introState.p - lastBoardIntroProgress) > 0.001
      );

      if (shouldUpdateBoard) {
        boardTiles.forEach((tile) => {
          const currentX = tile.userData.originalX - pathScroll;
          const transform = getBoardTransformForTileCoord(tile.userData.tileCoord, pathScroll);
          tile.position.set(transform.x, transform.y + (1 - introState.p) * tile.userData.dropDist, transform.z);
          tile.rotation.set(transform.rx, transform.ry, transform.rz);

          const fade = getUnifiedFade(currentX);
          const assemblyProgress = getTileAssemblyProgress(tile.userData.tileCoord, pathScroll);
          const centerFocus = getCenterFocus(currentX, 8.75);
          tile.userData.assemblyProgress = assemblyProgress;
          tile.userData.revealProgress = fade * introState.p;
          tile.material.opacity = fade * introState.p;
          if ('emissive' in tile.material && tile.material.emissive) {
            tile.material.emissive.copy(tile.userData.emissiveColor);
            tile.material.emissiveIntensity = 0.006 + centerFocus * (tile.userData.isDark ? 0.026 : 0.018);
          }
          if (tile.children[0]) tile.children[0].material.opacity = (fade * introState.p) * 0.4;
        });
        lastBoardPathScroll = pathScroll;
        lastBoardIntroProgress = introState.p;
      }

      let featuredPiece = null;
      let featuredStrength = 0;

      interactivePieces.forEach((piece) => {
        const currentX = piece.userData.logicalX - pathScroll;
        const transform = getPieceTransform(piece, pathScroll);
        const centerFocus = getCenterFocus(currentX, 8.25);
        const pieceReveal = getPieceRevealProgress(piece, pathScroll);
        const bobbing = Math.sin(time * piece.userData.floatSpeed + piece.userData.floatOffset) * PIECE_BOB_AMPLITUDE;
        piece.userData.revealProgress = pieceReveal;

        let isFocused = currentHoveredUUID === piece.uuid;
        if (interactionMode === 'space' && currentHoveredUUID && piece.userData.uiData) {
          const activePieceObj = interactivePieces.find((candidate) => candidate.uuid === currentHoveredUUID);
          if (activePieceObj && activePieceObj.userData.uiData.whiteHeading === piece.userData.uiData.whiteHeading) {
            isFocused = true;
          }
        }

        const selectionLift = hasSelectedPiece && isFocused ? 0.26 : 0;
        const nonSelectedOpacity = hasSelectedPiece && !isFocused ? 0.66 : 1;

        piece.position.set(transform.x, transform.y + PIECE_BASE_LIFT + bobbing + selectionLift, transform.z);
        piece.rotation.set(transform.rx, transform.ry, transform.rz);
        if (piece.userData.positionOffset) {
          pieceOffsetEuler.set(transform.rx, transform.ry, transform.rz);
          pieceOffsetVector.copy(piece.userData.positionOffset).applyEuler(pieceOffsetEuler);
          piece.position.add(pieceOffsetVector);
        }
        piece.visible = pieceReveal > 0.005;
        piece.userData.themeMix += (piece.userData.targetThemeMix - piece.userData.themeMix) * 0.08;

        const targetScale = hasSelectedPiece ? (isFocused ? 1.12 : 0.985) : 1.0;
        targetScaleVector.setScalar(targetScale);
        piece.scale.lerp(targetScaleVector, 0.15);

        if (pieceReveal > 0.15 && centerFocus > featuredStrength) {
          featuredStrength = centerFocus;
          featuredPiece = piece;
        }

        applyPieceMaterialState(piece, pieceReveal * nonSelectedOpacity, piece.userData.themeMix);
      });

      if (hasSelectedPiece) {
        const selectedPiece = interactivePieces.find((piece) => piece.uuid === currentHoveredUUID);
        if (selectedPiece && selectedPiece.userData.revealProgress > 0.15) {
          featuredPiece = selectedPiece;
          featuredStrength = Math.max(featuredStrength, 0.88);
        }
      }

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
        resinBounceLight.lookAt(spotlightWorldTarget);
        centerSpotLight.intensity += ((0.62 + featuredStrength * 0.96) - centerSpotLight.intensity) * 0.12;
      } else {
        centerSpotLight.intensity += (0.48 - centerSpotLight.intensity) * 0.12;
      }
      keyShadowLight.target.updateMatrixWorld();
      warmRimLight.target.updateMatrixWorld();
      coolRimLight.target.updateMatrixWorld();
      centerSpotLight.target.updateMatrixWorld();

      if (IS_DEVELOPMENT) updateQueenPawnFormationDebugMarkers(pathScroll);
      renderer.render(scene, camera);
      if (IS_DEVELOPMENT) validateQueenPawnFormation(pathScroll);
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
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
      if (scrollRafId !== 0) cancelAnimationFrame(scrollRafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', handleKeyDown);
      if (activeHeaderEl) activeHeaderEl.removeEventListener('click', toggleMode);
      cancelAnimationFrame(frameId);
      const disposedTextures = new Set();
      const disposedGeometries = new Set();
      const disposeTexture = (texture) => {
        if (!texture || disposedTextures.has(texture.uuid)) return;
        disposedTextures.add(texture.uuid);
        texture.dispose();
      };
      scene.traverse((object) => {
        if (object.geometry && !disposedGeometries.has(object.geometry.uuid)) {
          disposedGeometries.add(object.geometry.uuid);
          object.geometry.dispose();
        }
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            disposeTexture(material.map);
            disposeTexture(material.normalMap);
            disposeTexture(material.roughnessMap);
            disposeTexture(material.metalnessMap);
            disposeTexture(material.aoMap);
            disposeTexture(material.alphaMap);
            material.dispose();
          });
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
  const showPieceDetail = pieceInfo.active && Boolean(activePieceImage || activePieceHeading || activePieceSub);
  const showHints = !showPieceDetail;
  const showPieceToggleHint = !showPieceDetail;

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

        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.012)_0%,rgba(27,29,35,0.05)_36%,rgba(10,11,16,0.26)_70%,rgba(4,5,8,0.58)_100%)]" />

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
          className={`pointer-events-none absolute inset-x-0 top-0 bottom-0 z-20 flex items-center justify-between px-8 md:px-10 lg:px-14 transition-all duration-500 ease-out ${
            showPieceDetail ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="max-w-[min(40vw,440px)]">
            {activePieceHeading ? (
              <h3
                className="text-[1.6rem] font-bold uppercase tracking-[0.18em] leading-[1.05] drop-shadow-[0_10px_28px_rgba(0,0,0,0.38)] md:text-[2.55rem]"
                style={{ color: isRiskTheme ? '#BB364F' : '#F3F2EE' }}
              >
                {activePieceHeading}
              </h3>
            ) : null}
            {activePieceSub ? (
              <p className="mt-4 whitespace-pre-line text-[0.98rem] font-medium leading-[1.7] tracking-[0.03em] text-white/78 md:text-[1.12rem]">
                {activePieceSub}
              </p>
            ) : null}
          </div>

          {activePieceImage ? (
            <img
              src={activePieceImage}
              alt={activePieceHeading || 'Focused chess piece'}
              className="h-auto w-[220px] object-contain drop-shadow-[0_22px_44px_rgba(0,0,0,0.44)] transition-all duration-500 ease-out md:w-[300px] lg:w-[350px]"
            />
          ) : <div className="w-[220px] md:w-[300px] lg:w-[350px]" />}
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
      if (nextHeight > 0) {
        setHeaderHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight));
      }
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
