import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import logoSvg from '../4.27 ASSETS/BRAND NEW LOGO.svg';
import heroImage from '../4.27 ASSETS/BRAND NEW HERO.png';
import sunglassesCursorPng from '../CRE POV WEBSITE ASSETS/sunglasses-cursor.png';
import comparisonWhitePawnSvg from '../4.27 ASSETS/WHITE PAWN.svg';
import comparisonRedPawnSvg from '../4.27 ASSETS/RED PAWN.svg';
import whiteChessPiecesGlb from '../CRE POV WEBSITE ASSETS/White_Chess_Pieces.glb';
import redChessPiecesGlb from '../CRE POV WEBSITE ASSETS/Red_Chess_Pieces.glb';
import puwWhiteKing from '../Brand New PUW/PUW_WHITE_KING.svg';
import puwWhiteQueen from '../Brand New PUW/PUW_WHITE_QUEEN.svg';
import puwWhiteBishop from '../Brand New PUW/PUW_WHITE_BISHOP.svg';
import puwWhiteKnight from '../Brand New PUW/PUW_WHITE_KNIGHT.svg';
import puwWhiteRook from '../Brand New PUW/PUW_WHITE_ROOK.svg';
import puwWhitePawn from '../Brand New PUW/PUW_WHITE_PAWN.svg';
import puwRedKing from '../Brand New PUW/PUW_RED_KING.svg';
import puwRedQueen from '../Brand New PUW/PUW_RED_QUEEN.svg';
import puwRedBishop from '../Brand New PUW/PUW_RED_BISHOP.svg';
import puwRedKnight from '../Brand New PUW/PUW_RED_KNIGHT.svg';
import puwRedRook from '../Brand New PUW/PUW_RED_ROOK.svg';
import puwRedPawn from '../Brand New PUW/PUW_RED_PAWN.svg';

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
const MAX_RENDER_DPR = 1.15;
const BOARD_UPDATE_SCROLL_EPSILON = 0.018;
const SCROLL_SETTLE_EPSILON = 0.004;
const PIECE_MATERIAL_PROFILES = {
  owner: {
    color: '#F3F2EE',
    fillColor: '#CFE7FF',
    rimColor: '#FFFFFF',
    lineColor: '#F4FAFF',
    coreOpacity: 0.86,
    rimOpacity: 0.5,
    lineOpacity: 0.18,
    rimStrength: 1.74,
    lineStrength: 0.52,
    verticalStrength: 0.06,
    ringDensity: 2.15,
    verticalDensity: 5.5,
  },
  risk: {
    color: '#97182E',
    fillColor: '#C82742',
    rimColor: '#FF7C8A',
    lineColor: '#FF5268',
    coreOpacity: 0.83,
    rimOpacity: 0.52,
    lineOpacity: 0.2,
    rimStrength: 1.78,
    lineStrength: 0.56,
    verticalStrength: 0.07,
    ringDensity: 2.15,
    verticalDensity: 5.5,
  },
};

const CHESS_ROAD_WIDTH_TILES = 5;
const CHESS_ROAD_LENGTH_TILES = 21;
const TREADMILL_LOOP_TRANSITION_ROWS = 5;
const CHESS_ROAD_START_COLUMN = -TREADMILL_LOOP_TRANSITION_ROWS;
const CHESS_ROAD_END_COLUMN = CHESS_ROAD_LENGTH_TILES;
const CHESS_ROAD_TOTAL_COLUMNS = CHESS_ROAD_END_COLUMN - CHESS_ROAD_START_COLUMN;
const CHESS_ROAD_TILE_SIZE = 3.5;
const CHESS_ROAD_BOARD_THICKNESS = 1.5;
const CHESS_ROAD_CENTER_ROW = Math.floor(CHESS_ROAD_WIDTH_TILES / 2);
const MAX_PATH_SCROLL = 65 - (3 * CHESS_ROAD_TILE_SIZE);
const TREADMILL_LOOP_ENTRY_SCROLL = 43.5;
const TREADMILL_LOOP_RESET_SCROLL = 4;
const TREADMILL_LOOP_LENGTH = CHESS_ROAD_TOTAL_COLUMNS * CHESS_ROAD_TILE_SIZE;
const TREADMILL_LOOP_WRAP_MIN_X = (CHESS_ROAD_START_COLUMN - 0.5) * CHESS_ROAD_TILE_SIZE;
const TREADMILL_WHEEL_SCROLL_SCALE = 0.034;
const TREADMILL_CURSOR_STYLE = `url("${sunglassesCursorPng}") 32 12, pointer`;
const IS_DEVELOPMENT = import.meta.env.DEV;
const QUEEN_PAWN_ROW_DEBUG = false;
const QUEEN_PAWN_ROW_VALIDATION_INTERVAL_MS = 1000;
const QUEEN_PAWN_ROW_COLUMN_OFFSET = 1;
const QUEEN_PAWN_ROW_EXTRA_GAP = 0.65;
const SELECTED_TEXT_SIGN_WIDTH = CHESS_ROAD_TILE_SIZE * 5.2;
const SELECTED_TEXT_SIGN_DEPTH = CHESS_ROAD_TILE_SIZE * 1.08;
const SELECTED_TEXT_SIGN_FRONT_EDGE_Z = (CHESS_ROAD_WIDTH_TILES * CHESS_ROAD_TILE_SIZE) / 2;
const SELECTED_TEXT_SIGN_FORWARD_OFFSET_Z = CHESS_ROAD_TILE_SIZE * 0.74;
const SELECTED_TEXT_SIGN_UNDERBOARD_Y = -(CHESS_ROAD_BOARD_THICKNESS * 0.5 + 0.62);
const SELECTED_TEXT_SIGN_SURFACE_LIFT_Y = 0.035;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const positiveModulo = (value, modulus) => ((value % modulus) + modulus) % modulus;
const getLoopedTreadmillX = (logicalX, pathScroll, shouldLoop) => {
  const currentX = logicalX - pathScroll;
  if (!shouldLoop) return currentX;

  return positiveModulo(currentX - TREADMILL_LOOP_WRAP_MIN_X, TREADMILL_LOOP_LENGTH)
    + TREADMILL_LOOP_WRAP_MIN_X;
};

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

const getRenderPixelRatio = () => Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);

const createProfileColors = (profile) => ({
  color: new THREE.Color(profile.color),
  fillColor: new THREE.Color(profile.fillColor),
  rimColor: new THREE.Color(profile.rimColor),
  lineColor: new THREE.Color(profile.lineColor),
});

const HOLOGRAPHIC_VERTEX_SHADER = `
  varying vec3 vPiecePosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPiecePosition = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const HOLOGRAPHIC_SHADER_UTILS = `
  float lineFromCoord(float coord, float width, float softness) {
    float centered = abs(fract(coord) - 0.5);
    return 1.0 - smoothstep(width, width + softness, centered);
  }

  float hologramRings(vec3 piecePosition, float ringDensity) {
    return lineFromCoord(piecePosition.y * ringDensity, 0.008, 0.035);
  }

  float hologramVerticals(vec3 piecePosition, float verticalDensity) {
    float radius = length(piecePosition.xz);
    float angular = (atan(piecePosition.z, piecePosition.x) + 3.14159265) / 6.2831853;
    float verticalLine = lineFromCoord(angular * verticalDensity, 0.006, 0.045);
    return verticalLine * smoothstep(0.28, 0.88, radius);
  }
`;

const HOLOGRAPHIC_CORE_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform vec3 uFillColor;
  uniform vec3 uRimColor;
  uniform vec3 uLineColor;
  uniform float uOpacity;
  uniform float uRimStrength;
  uniform float uLineStrength;
  uniform float uRingDensity;
  uniform float uVerticalDensity;
  uniform float uVerticalStrength;
  varying vec3 vPiecePosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  ${HOLOGRAPHIC_SHADER_UTILS}

  void main() {
    vec3 normalDirection = normalize(vWorldNormal);
    vec3 viewDirection = normalize(vViewDirection);
    float facing = abs(dot(normalDirection, viewDirection));
    float fresnel = pow(1.0 - clamp(facing, 0.0, 1.0), 2.65);
    float rim = smoothstep(0.12, 0.86, fresnel);
    float surface = pow(clamp(facing, 0.0, 1.0), 0.78);
    float rings = hologramRings(vPiecePosition, uRingDensity);
    float verticals = hologramVerticals(vPiecePosition, uVerticalDensity) * uVerticalStrength;
    float lineMask = max(rings * 0.22, verticals * 0.05);

    float frostedBody = pow(surface, 0.48);
    float innerBody = smoothstep(0.08, 0.72, facing);
    float surfaceSheen = smoothstep(0.18, 0.96, surface);
    vec3 acrylicCore = mix(uFillColor * 0.42, uColor, 0.5 + surface * 0.18);
    vec3 finalColor = acrylicCore * (0.45 + surface * 0.32);
    finalColor += uFillColor * frostedBody * (0.11 + innerBody * 0.08);
    finalColor += uRimColor * rim * uRimStrength * 0.9;
    finalColor += uRimColor * fresnel * uRimStrength * 0.34;
    finalColor += uLineColor * lineMask * uLineStrength * (0.28 + rim * 0.14 + surfaceSheen * 0.08);

    float alpha = uOpacity * (0.74 + surface * 0.22);
    alpha += innerBody * uOpacity * 0.08;
    alpha += rim * uOpacity * uRimStrength * 0.34;
    alpha += lineMask * uOpacity * uLineStrength * 0.035;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.98));
  }
`;

const HOLOGRAPHIC_RIM_FRAGMENT_SHADER = `
  uniform vec3 uRimColor;
  uniform float uOpacity;
  uniform float uRimPower;
  uniform float uRimStrength;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    float facing = abs(dot(normalize(vWorldNormal), normalize(vViewDirection)));
    float fresnel = pow(1.0 - clamp(facing, 0.0, 1.0), uRimPower);
    float crispRim = smoothstep(0.28, 0.9, fresnel);
    float softHalo = smoothstep(0.06, 0.74, fresnel) * 0.32;
    float rim = clamp(crispRim + softHalo, 0.0, 1.0);
    float alpha = rim * uOpacity * uRimStrength;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uRimColor * (1.0 + crispRim * 0.72), clamp(alpha, 0.0, 0.86));
  }
`;

const HOLOGRAPHIC_LINE_FRAGMENT_SHADER = `
  uniform vec3 uLineColor;
  uniform float uOpacity;
  uniform float uLineStrength;
  uniform float uRingDensity;
  uniform float uVerticalDensity;
  uniform float uVerticalStrength;
  varying vec3 vPiecePosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  ${HOLOGRAPHIC_SHADER_UTILS}

  void main() {
    float facing = abs(dot(normalize(vWorldNormal), normalize(vViewDirection)));
    float fresnel = pow(1.0 - clamp(facing, 0.0, 1.0), 1.65);
    float rings = hologramRings(vPiecePosition, uRingDensity);
    float verticals = hologramVerticals(vPiecePosition, uVerticalDensity) * uVerticalStrength;
    float lineMask = rings * 0.38 + verticals * 0.08;
    lineMask *= 0.26 + fresnel * 0.34;

    float alpha = lineMask * uOpacity * uLineStrength;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uLineColor * (0.82 + fresnel * 0.42), clamp(alpha, 0.0, 0.22));
  }
`;

const SURFACE_GLOW_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SURFACE_GLOW_FRAGMENT_SHADER = `
  uniform vec3 uGlowColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 centeredUv = vUv - vec2(0.5);
    float radialDistance = length(centeredUv * 2.0);
    float contactFalloff = 1.0 - smoothstep(0.0, 0.58, radialDistance);
    float haloFalloff = 1.0 - smoothstep(0.28, 1.04, radialDistance);
    float satinCore = pow(clamp(contactFalloff, 0.0, 1.0), 1.42);
    float radialBloom = pow(clamp(haloFalloff, 0.0, 1.0), 2.15) * 0.42;
    float glow = clamp(satinCore + radialBloom, 0.0, 1.0);
    float alpha = glow * uOpacity;

    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uGlowColor * (0.42 + glow * 0.48), alpha);
  }
`;

const attachHologramProfiles = (material, layer) => {
  material.userData.hologramLayer = layer;
  material.userData.ownerProfile = {
    ...PIECE_MATERIAL_PROFILES.owner,
    ...createProfileColors(PIECE_MATERIAL_PROFILES.owner),
  };
  material.userData.riskProfile = {
    ...PIECE_MATERIAL_PROFILES.risk,
    ...createProfileColors(PIECE_MATERIAL_PROFILES.risk),
  };
};

const lerpProfileValue = (ownerProfile, riskProfile, key, themeMix) =>
  THREE.MathUtils.lerp(ownerProfile[key], riskProfile[key], themeMix);

const createHolographicPieceMaterial = (sourceMaterial, initialMix = 0) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.color) },
      uFillColor: { value: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.fillColor) },
      uRimColor: { value: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.rimColor) },
      uLineColor: { value: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.lineColor) },
      uOpacity: { value: PIECE_MATERIAL_PROFILES.owner.coreOpacity },
      uRimStrength: { value: PIECE_MATERIAL_PROFILES.owner.rimStrength },
      uLineStrength: { value: PIECE_MATERIAL_PROFILES.owner.lineStrength },
      uRingDensity: { value: PIECE_MATERIAL_PROFILES.owner.ringDensity },
      uVerticalDensity: { value: PIECE_MATERIAL_PROFILES.owner.verticalDensity },
      uVerticalStrength: { value: PIECE_MATERIAL_PROFILES.owner.verticalStrength },
    },
    vertexShader: HOLOGRAPHIC_VERTEX_SHADER,
    fragmentShader: HOLOGRAPHIC_CORE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    toneMapped: false,
  });
  attachHologramProfiles(material, 'core');
  syncHolographicPieceMaterial(material, initialMix, 1, 0);
  material.needsUpdate = true;
  return material;
};

const createHolographicRimMaterial = (initialMix = 0) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.rimColor) },
      uOpacity: { value: PIECE_MATERIAL_PROFILES.owner.rimOpacity },
      uRimPower: { value: 2.05 },
      uRimStrength: { value: PIECE_MATERIAL_PROFILES.owner.rimStrength },
    },
    vertexShader: HOLOGRAPHIC_VERTEX_SHADER,
    fragmentShader: HOLOGRAPHIC_RIM_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    toneMapped: false,
  });
  attachHologramProfiles(material, 'rim');
  syncHolographicOverlayMaterial(material, initialMix, 1, 0, 'rim');
  return material;
};

const createHolographicLineMaterial = (initialMix = 0) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLineColor: { value: new THREE.Color(PIECE_MATERIAL_PROFILES.owner.lineColor) },
      uOpacity: { value: PIECE_MATERIAL_PROFILES.owner.lineOpacity },
      uLineStrength: { value: PIECE_MATERIAL_PROFILES.owner.lineStrength },
      uRingDensity: { value: PIECE_MATERIAL_PROFILES.owner.ringDensity },
      uVerticalDensity: { value: PIECE_MATERIAL_PROFILES.owner.verticalDensity },
      uVerticalStrength: { value: PIECE_MATERIAL_PROFILES.owner.verticalStrength },
    },
    vertexShader: HOLOGRAPHIC_VERTEX_SHADER,
    fragmentShader: HOLOGRAPHIC_LINE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  attachHologramProfiles(material, 'line');
  syncHolographicOverlayMaterial(material, initialMix, 1, 0, 'line');
  return material;
};

function syncHolographicPieceMaterial(material, themeMix, opacity, focusBoost = 0) {
  const ownerProfile = material.userData.ownerProfile;
  const riskProfile = material.userData.riskProfile;
  if (!ownerProfile || !riskProfile) return;

  const positiveFocus = Math.max(0, focusBoost);
  const negativeFocus = Math.min(0, focusBoost);
  const visibility = clamp01(opacity);
  const strengthScale = Math.max(0.68, 1 + positiveFocus * 0.32 + negativeFocus * 0.28);

  material.uniforms.uColor.value.copy(ownerProfile.color).lerp(riskProfile.color, themeMix);
  material.uniforms.uFillColor.value.copy(ownerProfile.fillColor).lerp(riskProfile.fillColor, themeMix);
  material.uniforms.uRimColor.value.copy(ownerProfile.rimColor).lerp(riskProfile.rimColor, themeMix);
  material.uniforms.uLineColor.value.copy(ownerProfile.lineColor).lerp(riskProfile.lineColor, themeMix);
  material.uniforms.uOpacity.value = lerpProfileValue(ownerProfile, riskProfile, 'coreOpacity', themeMix)
    * visibility
    * Math.max(0.62, 1 + positiveFocus * 0.12 + negativeFocus * 0.14);
  material.uniforms.uRimStrength.value = lerpProfileValue(ownerProfile, riskProfile, 'rimStrength', themeMix)
    * strengthScale;
  material.uniforms.uLineStrength.value = lerpProfileValue(ownerProfile, riskProfile, 'lineStrength', themeMix)
    * Math.max(0.7, 1 + positiveFocus * 0.3 + negativeFocus * 0.24);
  material.uniforms.uRingDensity.value = lerpProfileValue(ownerProfile, riskProfile, 'ringDensity', themeMix);
  material.uniforms.uVerticalDensity.value = lerpProfileValue(ownerProfile, riskProfile, 'verticalDensity', themeMix);
  material.uniforms.uVerticalStrength.value = lerpProfileValue(ownerProfile, riskProfile, 'verticalStrength', themeMix)
    * Math.max(0.68, 1 + positiveFocus * 0.24 + negativeFocus * 0.22);
  material.visible = visibility > 0.01;
}

function syncHolographicOverlayMaterial(material, themeMix, opacity, focusBoost = 0, overlayType = 'rim') {
  const ownerProfile = material.userData.ownerProfile;
  const riskProfile = material.userData.riskProfile;
  if (!ownerProfile || !riskProfile) return;

  const positiveFocus = Math.max(0, focusBoost);
  const negativeFocus = Math.min(0, focusBoost);
  const visibility = clamp01(opacity);
  const isLineLayer = overlayType === 'line';
  const profileOpacityKey = isLineLayer ? 'lineOpacity' : 'rimOpacity';
  const overlayOpacity = lerpProfileValue(ownerProfile, riskProfile, profileOpacityKey, themeMix)
    * visibility
    * Math.max(0.52, 1 + positiveFocus * (isLineLayer ? 0.6 : 0.74) + negativeFocus * (isLineLayer ? 0.3 : 0.36));

  if (overlayType === 'rim') {
    material.uniforms.uRimColor.value.copy(ownerProfile.rimColor).lerp(riskProfile.rimColor, themeMix);
    material.uniforms.uOpacity.value = overlayOpacity;
    material.uniforms.uRimPower.value = THREE.MathUtils.lerp(2.55, 2.02, clamp01(positiveFocus));
    material.uniforms.uRimStrength.value = lerpProfileValue(ownerProfile, riskProfile, 'rimStrength', themeMix)
      * Math.max(0.7, 1 + positiveFocus * 0.42 + negativeFocus * 0.26);
  } else {
    material.uniforms.uLineColor.value.copy(ownerProfile.lineColor).lerp(riskProfile.lineColor, themeMix);
    material.uniforms.uOpacity.value = overlayOpacity;
    material.uniforms.uLineStrength.value = lerpProfileValue(ownerProfile, riskProfile, 'lineStrength', themeMix)
      * Math.max(0.7, 1 + positiveFocus * 0.44 + negativeFocus * 0.24);
    material.uniforms.uRingDensity.value = lerpProfileValue(ownerProfile, riskProfile, 'ringDensity', themeMix);
    material.uniforms.uVerticalDensity.value = lerpProfileValue(ownerProfile, riskProfile, 'verticalDensity', themeMix);
    material.uniforms.uVerticalStrength.value = lerpProfileValue(ownerProfile, riskProfile, 'verticalStrength', themeMix)
      * Math.max(0.68, 1 + positiveFocus * 0.26 + negativeFocus * 0.22);
  }
  material.visible = visibility > 0.01;
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
  comparisonType: '',
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

const HeaderLogo = () => (
  <span className="relative block h-[30px] w-[100px] overflow-hidden md:h-[32px] md:w-[107px]">
    <img
      src={logoSvg}
      alt="CRE POV"
      className="absolute left-0 top-0 h-[322.6%] w-auto max-w-none select-none"
      style={{ transform: 'translateY(-34.6%)' }}
      draggable="false"
    />
  </span>
);

const PawnComparisonIcon = ({ src, label }) => (
  <img
    src={src}
    alt={label}
    className="h-12 w-12 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.34)] sm:h-14 sm:w-14 md:h-16 md:w-16"
    draggable="false"
  />
);

const PawnDifferentialComparison = ({ isRiskTheme }) => {
  const selectedPawnState = isRiskTheme
    ? { copy: 'More sale pressure', operator: '<' }
    : { copy: 'Less sale pressure', operator: '>' };

  return (
    <div className="mt-4 grid gap-2.5 text-white/88 sm:mt-5">
      <p className="text-[0.82rem] font-bold tracking-[0.18em] text-white/82 sm:text-[0.9rem] md:text-[1rem]">
        {selectedPawnState.copy}
      </p>
      <div className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
        <PawnComparisonIcon src={comparisonWhitePawnSvg} label="White pawn" />
        <span aria-hidden="true">{selectedPawnState.operator}</span>
        <PawnComparisonIcon src={comparisonRedPawnSvg} label="Red pawn" />
      </div>
    </div>
  );
};

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
    renderer.setPixelRatio(getRenderPixelRatio());

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

      ctx.fillStyle = '#000000';
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
      renderer.setPixelRatio(getRenderPixelRatio());
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
  const treadmillHitAreaRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const tabHintRef = useRef(null);

  const headingRef = useRef(null);

  const [pieceInfo, setPieceInfo] = useState(() => createEmptyPieceInfo());
  const [isRiskTheme, setIsRiskTheme] = useState(false);

  useEffect(() => {
    if (!mountRef.current || !treadmillHitAreaRef.current) return undefined;

    let boardTiles = [];
    let interactivePieces = [];
    let scrollPos = 0;
    let targetScrollPos = 0;
    let introState = { p: 1 };
    let currentMode = 'owner';
    let currentHoveredUUID = null;
    let currentShadowPieceUUID = null;
    let currentMilestoneLabel = '';
    let currentMilestoneMode = '';
    let interactionMode = 'hover';
    let needsRaycast = true;
    let lastRaycastTime = 0;
    let lastRaycastScroll = -Infinity;
    let lastBoardPathScroll = Infinity;
    let lastBoardIntroProgress = Infinity;
    let lastBoardMode = '';
    let lastBoardHoveredUUID = null;
    let ownerPieceNodes = {};
    let riskPieceNodes = {};
    let normalizedPiecePrototypes = {};
    let boardTileLookup = new Map();
    let queenPawnSequence = null;
    let lastQueenPawnRowValidation = 0;
    let frameId;
    let disposed = false;
    let isVisible = false;
    let isAnimating = false;
    let isBoardHovered = false;
    let loopScrollUnlocked = false;
    let pieceSequenceCounter = 0;
    let selectedSequenceIndex = -1;

    const COLOR_BOARD_IVORY = '#777A77';
    const COLOR_BOARD_CHARCOAL = '#08090D';
    const COLOR_BOARD_EDGE_LIGHT = 0x626663;
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
    renderer.setPixelRatio(getRenderPixelRatio());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.66;

    const currentMount = mountRef.current;
    const interactionHitArea = treadmillHitAreaRef.current;
    currentMount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.5;

    const softFillLight = new THREE.HemisphereLight(0xdce9ff, 0x05060a, 0.1);
    scene.add(softFillLight);

    const keyShadowLight = new THREE.SpotLight(0xfff1df, 0.32, 86, Math.PI / 6.2, 0.88, 1.82);
    keyShadowLight.position.set(15, 23, 13);
    keyShadowLight.castShadow = false;
    keyShadowLight.target.position.set(3.5, 2.6, 0);
    scene.add(keyShadowLight);
    scene.add(keyShadowLight.target);

    const rimLight = new THREE.SpotLight(0xd7e8ff, 0.64, 82, Math.PI / 5.8, 0.9, 1.9);
    rimLight.position.set(-17, 11.5, -14);
    rimLight.castShadow = false;
    rimLight.target.position.set(2, 2.4, 0);
    scene.add(rimLight);
    scene.add(rimLight.target);
    const ownerRimLightColor = new THREE.Color(0xe6f7ff);
    const riskRimLightColor = new THREE.Color(0xff7482);
    const ownerSurfaceGlowColor = new THREE.Color(0xf3f2ee);
    const riskSurfaceGlowColor = new THREE.Color(0x97182e);
    const surfaceGlowAccumulator = new THREE.Color();
    const surfaceGlowPieceColor = new THREE.Color();
    const selectedSurfaceGlowColor = new THREE.Color();
    const selectedSurfaceGlowEuler = new THREE.Euler();
    const selectedSurfaceGlowLift = new THREE.Vector3();
    const selectedSurfaceGlowPosition = new THREE.Vector3();
    const selectedSurfaceGlowGeometry = new THREE.PlaneGeometry(
      CHESS_ROAD_TILE_SIZE * 3.25,
      CHESS_ROAD_TILE_SIZE * 3.25,
      1,
      1,
    );
    selectedSurfaceGlowGeometry.rotateX(-Math.PI / 2);
    const selectedSurfaceGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uGlowColor: { value: ownerSurfaceGlowColor.clone() },
        uOpacity: { value: 0 },
      },
      vertexShader: SURFACE_GLOW_VERTEX_SHADER,
      fragmentShader: SURFACE_GLOW_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const selectedSurfaceGlow = new THREE.Mesh(selectedSurfaceGlowGeometry, selectedSurfaceGlowMaterial);
    selectedSurfaceGlow.name = 'selected_piece_surface_glow';
    selectedSurfaceGlow.renderOrder = 2;
    selectedSurfaceGlow.visible = false;
    scene.add(selectedSurfaceGlow);

    const selectedHeaderCanvas = document.createElement('canvas');
    selectedHeaderCanvas.width = 1280;
    selectedHeaderCanvas.height = 320;
    const selectedHeaderContext = selectedHeaderCanvas.getContext('2d');
    const selectedHeaderTexture = new THREE.CanvasTexture(selectedHeaderCanvas);
    selectedHeaderTexture.colorSpace = THREE.SRGBColorSpace;
    selectedHeaderTexture.anisotropy = 4;
    const selectedHeaderGeometry = new THREE.PlaneGeometry(
      SELECTED_TEXT_SIGN_WIDTH,
      SELECTED_TEXT_SIGN_DEPTH,
      1,
      1,
    );
    selectedHeaderGeometry.rotateX(-Math.PI / 2);
    const selectedHeaderMaterial = new THREE.MeshBasicMaterial({
      map: selectedHeaderTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const selectedHeader = new THREE.Mesh(selectedHeaderGeometry, selectedHeaderMaterial);
    selectedHeader.name = 'selected_piece_scene_header';
    selectedHeader.renderOrder = 5;
    selectedHeader.visible = false;
    scene.add(selectedHeader);
    const selectedHeaderEuler = new THREE.Euler();
    const selectedHeaderLocalOffset = new THREE.Vector3();
    let selectedHeaderLabel = '';
    let selectedHeaderSubLabel = '';
    let selectedHeaderThemeKey = '';

    function drawSelectedHeaderTexture(label, subLabel, themeMix) {
      if (!selectedHeaderContext || !label) return;

      const nextLabel = label.toUpperCase();
      const nextSubLabel = subLabel || '';
      const nextThemeKey = themeMix > 0.5 ? 'risk' : 'owner';
      if (
        selectedHeaderLabel === nextLabel
        && selectedHeaderSubLabel === nextSubLabel
        && selectedHeaderThemeKey === nextThemeKey
      ) return;

      selectedHeaderLabel = nextLabel;
      selectedHeaderSubLabel = nextSubLabel;
      selectedHeaderThemeKey = nextThemeKey;

      const ctx = selectedHeaderContext;
      const accent = nextThemeKey === 'risk' ? '#FF5268' : '#F3F2EE';
      const secondary = nextThemeKey === 'risk' ? 'rgba(255,196,203,0.86)' : 'rgba(232,243,255,0.84)';
      const glow = nextThemeKey === 'risk' ? 'rgba(255,82,104,0.46)' : 'rgba(207,231,255,0.46)';
      ctx.clearRect(0, 0, selectedHeaderCanvas.width, selectedHeaderCanvas.height);

      ctx.save();
      ctx.fillStyle = 'rgba(7, 8, 12, 0.42)';
      ctx.strokeStyle = nextThemeKey === 'risk' ? 'rgba(255,82,104,0.46)' : 'rgba(243,242,238,0.38)';
      ctx.lineWidth = 5;
      ctx.fillRect(72, 68, 1136, 162);
      ctx.strokeRect(72, 68, 1136, 162);

      ctx.shadowColor = glow;
      ctx.shadowBlur = 24;
      ctx.fillStyle = accent;
      ctx.font = '700 88px "Space Grotesk", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '10px';
      ctx.fillText(nextLabel, 640, nextSubLabel ? 128 : 150, 1000);

      if (nextSubLabel) {
        ctx.shadowBlur = 16;
        ctx.fillStyle = secondary;
        ctx.font = '500 40px "Space Grotesk", Arial, sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText(nextSubLabel, 640, 190, 980);
      }

      ctx.shadowBlur = 14;
      ctx.strokeStyle = nextThemeKey === 'risk' ? 'rgba(255,124,138,0.58)' : 'rgba(255,255,255,0.48)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(164, 234);
      ctx.lineTo(1116, 234);
      ctx.stroke();
      ctx.restore();

      selectedHeaderTexture.needsUpdate = true;
    }

    let lastInteractionCenteringTime = 0;

    const loader = new GLTFLoader();

    const loadGLTF = (url) =>
      new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

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

    function isTreadmillLooping(pathScroll) {
      return loopScrollUnlocked && pathScroll >= TREADMILL_LOOP_ENTRY_SCROLL;
    }

    function getTreadmillCurrentX(logicalX, pathScroll) {
      return getLoopedTreadmillX(logicalX, pathScroll, isTreadmillLooping(pathScroll));
    }

    function getBoardTransformForTileCoord(tileCoord, pathScroll) {
      const tilePosition = tileCoordToLogicalPosition(tileCoord.column, tileCoord.row);
      return getPathTransform(getTreadmillCurrentX(tilePosition.logicalX, pathScroll), tilePosition.logicalZ);
    }

    function getSelectedHeaderTransform() {
      const treadmillCenterTransform = getPathTransform(0, 0);
      selectedHeaderEuler.set(
        treadmillCenterTransform.rx,
        treadmillCenterTransform.ry,
        treadmillCenterTransform.rz,
      );
      selectedHeaderLocalOffset
        .set(
          0,
          SELECTED_TEXT_SIGN_UNDERBOARD_Y + SELECTED_TEXT_SIGN_SURFACE_LIFT_Y,
          SELECTED_TEXT_SIGN_FRONT_EDGE_Z + SELECTED_TEXT_SIGN_FORWARD_OFFSET_Z,
        )
        .applyEuler(selectedHeaderEuler);

      return {
        x: treadmillCenterTransform.x + selectedHeaderLocalOffset.x,
        y: treadmillCenterTransform.y + selectedHeaderLocalOffset.y,
        z: treadmillCenterTransform.z + selectedHeaderLocalOffset.z,
        rx: treadmillCenterTransform.rx,
        ry: treadmillCenterTransform.ry,
        rz: treadmillCenterTransform.rz,
      };
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
      const tilePosition = tileCoordToLogicalPosition(tileCoord.column, tileCoord.row);
      return getBoardAssemblyProgress(getTreadmillCurrentX(tilePosition.logicalX, pathScroll));
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
          roughness: isDark ? 0.26 : 0.22,
          metalness: 0,
          clearcoat: 0.78,
          clearcoatRoughness: isDark ? 0.14 : 0.11,
          reflectivity: 0.46,
          envMapIntensity: isDark ? 0.58 : 0.46,
          specularIntensity: isDark ? 0.38 : 0.42,
          specularColor: isDark ? 0x8c2a39 : 0xf4ece6,
          emissive: isDark ? 0x030204 : 0x080506,
          emissiveIntensity: 0.0025,
          transparent: true,
          opacity: 1,
          dithering: true,
        });
        material.needsUpdate = true;
        return material;
      };

      const matLight = createMarbleMaterial(false);
      const matDark = createMarbleMaterial(true);

      for (let x = CHESS_ROAD_START_COLUMN; x < CHESS_ROAD_END_COLUMN; x += 1) {
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
            emissiveColor: new THREE.Color(isDark ? 0x100508 : 0x1b0d10),
            baseSpecularColor: tileMat.specularColor?.clone?.() ?? new THREE.Color(isDark ? 0x8c2a39 : 0xf4ece6),
          };
          boardTiles.push(tile);
          boardTileLookup.set(getTileCoordKey(tileCoord), tile);
          boardGroup.add(tile);
        }
      }

      scene.add(boardGroup);
    }
    createChessRoad();

    function centerTreadmillForWheelIntent() {
      const container = containerRef.current;
      if (!container) return;

      const now = performance.now();
      if (now - lastInteractionCenteringTime < 180) return;

      const rect = container.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.5;
      const treadmillCenter = rect.top + rect.height * 0.5;
      const centerDelta = treadmillCenter - viewportCenter;
      const threshold = Math.max(32, window.innerHeight * 0.045);
      if (Math.abs(centerDelta) <= threshold) return;

      lastInteractionCenteringTime = now;
      window.scrollTo({
        top: window.scrollY + centerDelta * 0.78,
        left: 0,
        behavior: 'smooth',
      });
    }

    function createNormalizedPiecePrototype(sourceRoot, pieceType) {
      if (!sourceRoot) return null;

      sourceRoot.updateWorldMatrix(true, true);
      const rootWorldInverse = sourceRoot.matrixWorld.clone().invert();
      const meshEntries = [];
      const prototypeBox = new THREE.Box3();
      prototypeBox.makeEmpty();

      sourceRoot.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;

        child.updateWorldMatrix(true, false);
        const relativeMatrix = rootWorldInverse.clone().multiply(child.matrixWorld);
        const geometry = child.geometry.clone();
        geometry.applyMatrix4(relativeMatrix);
        geometry.computeVertexNormals();
        geometry.normalizeNormals();
        geometry.computeBoundingBox();

        if (geometry.boundingBox) prototypeBox.union(geometry.boundingBox);

        const sourceMaterials = Array.isArray(child.material)
          ? child.material
          : [child.material].filter(Boolean);
        const highestGroupMaterialIndex = geometry.groups.reduce(
          (highest, group) => Math.max(highest, group.materialIndex ?? 0),
          0,
        );

        meshEntries.push({
          name: child.name,
          geometry,
          materialCount: Math.max(1, sourceMaterials.length, highestGroupMaterialIndex + 1),
        });
      });

      if (meshEntries.length === 0 || prototypeBox.isEmpty()) return null;

      const size = prototypeBox.getSize(new THREE.Vector3());
      const targetHeight = (PIECE_HEIGHTS[pieceType] ?? 4) * PIECE_SCALE_MULTIPLIER;
      const scale = size.y > 0 ? targetHeight / size.y : 1;
      const center = prototypeBox.getCenter(new THREE.Vector3());
      const normalizationMatrix = new THREE.Matrix4()
        .makeScale(scale, scale, scale)
        .multiply(new THREE.Matrix4().makeTranslation(-center.x, -prototypeBox.min.y, -center.z));

      meshEntries.forEach((entry) => {
        entry.geometry.applyMatrix4(normalizationMatrix);
        entry.geometry.computeVertexNormals();
        entry.geometry.normalizeNormals();
        entry.geometry.computeBoundingBox();
        entry.geometry.computeBoundingSphere();
      });

      return {
        pieceType,
        sourceName: sourceRoot.name,
        visualHeight: targetHeight,
        meshes: meshEntries,
      };
    }

    function createPieceInstance(pieceType) {
      const prototype = normalizedPiecePrototypes[pieceType];
      if (!prototype) return null;

      const pieceRoot = new THREE.Group();
      pieceRoot.name = `${prototype.sourceName || pieceType}_hologram`;
      const pieceMeshes = [];
      const hologramOverlays = [];
      const initialMix = currentMode === 'risk' ? 1 : 0;

      prototype.meshes.forEach((entry, meshIndex) => {
        const materials = Array.from({ length: entry.materialCount }, () =>
          createHolographicPieceMaterial(null, initialMix));
        const mesh = new THREE.Mesh(entry.geometry, entry.materialCount > 1 ? materials : materials[0]);
        mesh.name = entry.name || `${pieceType}_mesh_${meshIndex}`;
        mesh.renderOrder = 1;
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        const rimShell = new THREE.Mesh(mesh.geometry, createHolographicRimMaterial(initialMix));
        rimShell.name = `${mesh.name || pieceType}_holographic_rim`;
        rimShell.scale.setScalar(1.016);
        rimShell.renderOrder = 3;
        rimShell.castShadow = false;
        rimShell.receiveShadow = false;
        rimShell.raycast = () => {};
        mesh.add(rimShell);
        hologramOverlays.push({ material: rimShell.material, type: 'rim' });

        pieceMeshes.push(mesh);
        pieceRoot.add(mesh);
      });

      const pieceGroup = new THREE.Group();
      pieceGroup.name = prototype.sourceName || pieceType;
      pieceGroup.add(pieceRoot);
      pieceGroup.userData = {
        ...pieceGroup.userData,
        pieceType,
        visualHeight: prototype.visualHeight,
        renderMeshes: pieceMeshes,
        hologramOverlays,
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
      const logicalReferenceCoord = placementOptions.lockToAnchorProgress && anchorBoardCoord ? anchorBoardCoord : boardCoord;
      const basePosition = logicalReferenceCoord
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
        navigationLogicalX: placementOptions.navigationLogicalX ?? basePosition.logicalX,
        boardCoord,
        anchorBoardCoord,
        formationId: placementOptions.formationId ?? null,
        formationRole: placementOptions.formationRole ?? null,
        supportTileCoords: resolvedSupportTileCoords,
        uiData,
        sequenceIndex: pieceSequenceCounter,
        positionOffset: placementOptions.positionOffset ? new THREE.Vector3(...placementOptions.positionOffset) : null,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.001 + Math.random() * 0.0015,
        revealProgress: 0,
        dropDist: 0,
      };
      pieceSequenceCounter += 1;

      interactivePieces.push(meshGroup);
      scene.add(meshGroup);
      return meshGroup;
    }

    const queenPawnRowOffsets = [-1, 0, 1];
    const pieceAnchorEuler = new THREE.Euler();
    const pieceAnchorOffsetVector = new THREE.Vector3();
    const piecePositionOffsetEuler = new THREE.Euler();
    const piecePositionOffsetVector = new THREE.Vector3();

    function createQueenPawnRowDebugMarkers(sequence) {
      if (!IS_DEVELOPMENT || !QUEEN_PAWN_ROW_DEBUG) return [];

      const markerGeometry = new THREE.SphereGeometry(0.16, 16, 10);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x63f4ff,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      });

      return sequence.pawnBoardCoords.map((coord, index) => {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.name = `QueenPawnRow_expected_${index + 1}`;
        marker.userData.boardCoord = cloneTileCoord(coord);
        marker.renderOrder = 100;
        scene.add(marker);
        return marker;
      });
    }

    function updateQueenPawnRowDebugMarkers(pathScroll) {
      if (!queenPawnSequence?.markerRefs?.length) return;

      queenPawnSequence.markerRefs.forEach((marker) => {
        const transform = getBoardTransformForTileCoord(marker.userData.boardCoord, pathScroll);
        marker.position.set(transform.x, transform.y + PIECE_BASE_LIFT + 0.1, transform.z);
        marker.rotation.set(transform.rx, transform.ry, transform.rz);
        marker.visible = queenPawnSequence.queenRef?.visible ?? false;
      });
    }

    function createQueenPawnSequence({ queenBoardCoord, queenUiData, pawnUiData }) {
      const sequenceId = 'queen-pawn-ending';
      const pawnColumn = queenBoardCoord.column + QUEEN_PAWN_ROW_COLUMN_OFFSET;
      const pawnBoardCoords = queenPawnRowOffsets.map((rowOffset) => (
        makeTileCoord(pawnColumn, queenBoardCoord.row + rowOffset)
      ));
      const pawnNavigationLogicalX = tileCoordToLogicalPosition(pawnColumn, queenBoardCoord.row).logicalX
        + QUEEN_PAWN_ROW_EXTRA_GAP;
      const queenPiece = placePiece('queen', queenUiData, {
        boardCoord: queenBoardCoord,
        formationId: sequenceId,
        formationRole: 'queen-anchor',
        supportTileCoords: [queenBoardCoord],
      });
      const pawnPieces = pawnBoardCoords.map((pawnBoardCoord, index) => placePiece('pawn', pawnUiData, {
        boardCoord: pawnBoardCoord,
        formationId: sequenceId,
        formationRole: `pawn-row-${index + 1}`,
        navigationLogicalX: pawnNavigationLogicalX,
        positionOffset: [QUEEN_PAWN_ROW_EXTRA_GAP, 0, 0],
        supportTileCoords: [pawnBoardCoord],
      }));

      if (!queenPiece || pawnPieces.some((piece) => !piece)) {
        if (IS_DEVELOPMENT) {
          console.warn('QueenPawnSequence could not be created because a queen or pawn GLB node was missing.', {
            hasQueen: Boolean(queenPiece),
            pawnCount: pawnPieces.filter(Boolean).length,
          });
        }
        return null;
      }

      queenPiece.userData = {
        ...queenPiece.userData,
        expectedBoardCoord: cloneTileCoord(queenBoardCoord),
      };

      pawnPieces.forEach((pawnPiece, index) => {
        pawnPiece.name = `QueenPawnRow_pawn_${index + 1}`;
        pawnPiece.userData = {
          ...pawnPiece.userData,
          expectedBoardCoord: cloneTileCoord(pawnBoardCoords[index]),
        };
      });

      queenPawnSequence = {
        id: sequenceId,
        queenBoardCoord: cloneTileCoord(queenBoardCoord),
        pawnColumn,
        pawnBoardCoords: pawnBoardCoords.map(cloneTileCoord),
        queenRef: queenPiece,
        pawnRefs: pawnPieces,
        tileSize: CHESS_ROAD_TILE_SIZE,
        pieceYOffset: PIECE_BASE_LIFT,
      };
      queenPawnSequence.markerRefs = createQueenPawnRowDebugMarkers(queenPawnSequence);

      return queenPawnSequence;
    }

    function getPieceTransform(piece, pathScroll) {
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

        const transform = {
          x: anchorTransform.x + pieceAnchorOffsetVector.x,
          y: anchorTransform.y + pieceAnchorOffsetVector.y,
          z: anchorTransform.z + pieceAnchorOffsetVector.z,
          rx: anchorTransform.rx,
          ry: anchorTransform.ry,
          rz: anchorTransform.rz,
        };

        if (piece.userData.positionOffset) {
          piecePositionOffsetEuler.set(transform.rx, transform.ry, transform.rz);
          piecePositionOffsetVector.copy(piece.userData.positionOffset).applyEuler(piecePositionOffsetEuler);
          transform.x += piecePositionOffsetVector.x;
          transform.y += piecePositionOffsetVector.y;
          transform.z += piecePositionOffsetVector.z;
        }

        return transform;
      }

      const transform = getPathTransform(getTreadmillCurrentX(piece.userData.logicalX, pathScroll), piece.userData.logicalZ);
      if (piece.userData.positionOffset) {
        piecePositionOffsetEuler.set(transform.rx, transform.ry, transform.rz);
        piecePositionOffsetVector.copy(piece.userData.positionOffset).applyEuler(piecePositionOffsetEuler);
        transform.x += piecePositionOffsetVector.x;
        transform.y += piecePositionOffsetVector.y;
        transform.z += piecePositionOffsetVector.z;
      }
      return transform;
    }

    function getPieceSupportReveal(piece, pathScroll) {
      const supportTileCoords = piece.userData.supportTileCoords;
      if (!supportTileCoords?.length) {
        return getBoardAssemblyProgress(getTreadmillCurrentX(piece.userData.logicalX, pathScroll));
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
      const currentX = getTreadmillCurrentX(piece.userData.logicalX, pathScroll);
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
      const queenData = buildPieceUiData('queen', {
        whiteHeading: 'ECONOMY',
        redHeading: 'ECONOMY',
        whiteSub: 'STRONG MARKET',
        redSub: 'Tough Market',
      });
      const pawnData = buildPieceUiData('pawn', {
        whiteHeading: 'TIMING',
        redHeading: 'TIMING',
        comparisonType: 'pawnDifferential',
      });

      createQueenPawnSequence({
        queenBoardCoord,
        queenUiData: queenData,
        pawnUiData: pawnData,
      });
    }

    function toggleMode() {
      currentMode = currentMode === 'owner' ? 'risk' : 'owner';
      const isRisk = currentMode === 'risk';
      setIsRiskTheme(isRisk);

      interactivePieces.forEach((piece) => {
        piece.userData.targetThemeMix = isRisk ? 1 : 0;
      });

      updateMilestoneText(getMilestonePathScroll(scrollPos));
    }

    function getMilestonePathScroll(pathScroll) {
      const safePathScroll = Math.max(0, pathScroll);
      if (!loopScrollUnlocked) return Math.min(safePathScroll, MAX_PATH_SCROLL);
      return getLoopRelativePathScroll(safePathScroll);
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

    function clearTreadmillHoverState() {
      isBoardHovered = false;
      if (interactionMode === 'hover') {
        mouse2D.set(-1000, -1000);
        needsRaycast = true;
      }
    }

    const onPointerEnter = () => {
      isBoardHovered = true;
      needsRaycast = true;
      startAnimation();
    };

    const onPointerMove = (e) => {
      isBoardHovered = true;
      interactionMode = 'hover';
      needsRaycast = true;
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerLeave = () => {
      clearTreadmillHoverState();
    };

    const handleHitAreaClick = (event) => {
      event.stopPropagation();
      isBoardHovered = true;
      interactionMode = 'hover';
      toggleMode();
      needsRaycast = true;
      startAnimation();
    };

    function getFullPieceSequence() {
      const headingsSeen = new Set();
      return interactivePieces
        .filter((piece) => {
          const heading = piece.userData.uiData?.whiteHeading;
          if (!heading || headingsSeen.has(heading)) return false;
          headingsSeen.add(heading);
          return true;
        })
        .sort((a, b) => (a.userData.sequenceIndex ?? 0) - (b.userData.sequenceIndex ?? 0));
    }

    function getSequenceIndexForPiece(sequence, pieceUUID) {
      if (!pieceUUID) return -1;

      let currentIndex = sequence.findIndex((piece) => piece.uuid === pieceUUID);
      if (currentIndex !== -1) return currentIndex;

      const piece = interactivePieces.find((candidate) => candidate.uuid === pieceUUID);
      const heading = piece?.userData.uiData?.whiteHeading;
      if (!heading) return -1;

      return sequence.findIndex((candidate) => candidate.userData.uiData?.whiteHeading === heading);
    }

    function getPieceNavigationLogicalX(piece) {
      return piece.userData.navigationLogicalX ?? piece.userData.logicalX ?? 0;
    }

    function getLoopRelativePathScroll(pathScroll) {
      if (pathScroll < TREADMILL_LOOP_LENGTH) return pathScroll;
      return positiveModulo(pathScroll, TREADMILL_LOOP_LENGTH);
    }

    function getForwardSequenceIndexFromScroll(sequence) {
      const baseline = getLoopRelativePathScroll(Math.max(scrollPos, targetScrollPos));
      const nextPieceEntry = sequence
        .map((piece, index) => ({
          index,
          navigationX: positiveModulo(getPieceNavigationLogicalX(piece), TREADMILL_LOOP_LENGTH),
        }))
        .find(({ navigationX }) => navigationX >= baseline - 0.35);

      return nextPieceEntry?.index ?? 0;
    }

    function getFocusedPathScrollForPiece(piece) {
      const pieceLogicalX = getPieceNavigationLogicalX(piece);
      const forwardBaseline = Math.max(scrollPos, targetScrollPos);

      if (!loopScrollUnlocked && pieceLogicalX >= forwardBaseline - 0.35) {
        return Math.max(forwardBaseline, Math.max(0, Math.min(MAX_PATH_SCROLL, pieceLogicalX)));
      }

      let targetPathScroll = pieceLogicalX;
      while (targetPathScroll < forwardBaseline - 0.35) {
        targetPathScroll += TREADMILL_LOOP_LENGTH;
      }
      targetPathScroll = Math.max(targetPathScroll, forwardBaseline);
      return Math.max(TREADMILL_LOOP_ENTRY_SCROLL, targetPathScroll);
    }

    function advanceToNextPiece({ syncFromCurrent = false } = {}) {
      const sortedPieces = getFullPieceSequence();
      if (sortedPieces.length === 0) return;

      let nextIndex;
      if (syncFromCurrent || selectedSequenceIndex === -1) {
        const currentSequenceIndex = getSequenceIndexForPiece(sortedPieces, currentHoveredUUID);
        if (currentSequenceIndex !== -1) {
          selectedSequenceIndex = currentSequenceIndex;
          nextIndex = (selectedSequenceIndex + 1) % sortedPieces.length;
        } else {
          nextIndex = getForwardSequenceIndexFromScroll(sortedPieces);
        }
      } else {
        nextIndex = (selectedSequenceIndex + 1) % sortedPieces.length;
      }

      selectedSequenceIndex = nextIndex;

      const nextPiece = sortedPieces[nextIndex];
      pushActivePieceToReact(nextPiece);

      const pathScrollTarget = getFocusedPathScrollForPiece(nextPiece);
      targetScrollPos = pathScrollTarget;
      loopScrollUnlocked = loopScrollUnlocked || pathScrollTarget >= TREADMILL_LOOP_ENTRY_SCROLL;
      needsRaycast = true;
      startAnimation();
    }

    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName;
      const isEditableTarget = e.target?.isContentEditable
        || targetTag === 'INPUT'
        || targetTag === 'TEXTAREA'
        || targetTag === 'SELECT';

      if (!isVisible || isEditableTarget) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        toggleMode();
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const shouldSyncFromCurrent = interactionMode !== 'space';
        interactionMode = 'space';
        advanceToNextPiece({ syncFromCurrent: shouldSyncFromCurrent });
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      isBoardHovered = true;
      interactionMode = 'hover';
      centerTreadmillForWheelIntent();
      const wheelDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const nextTargetScroll = targetScrollPos + (wheelDelta * TREADMILL_WHEEL_SCROLL_SCALE);

      if (loopScrollUnlocked) {
        targetScrollPos = Math.max(0, nextTargetScroll);
        if (targetScrollPos <= TREADMILL_LOOP_RESET_SCROLL) {
          loopScrollUnlocked = false;
          targetScrollPos = Math.max(0, Math.min(MAX_PATH_SCROLL, targetScrollPos));
        }
      } else {
        targetScrollPos = Math.max(0, Math.min(MAX_PATH_SCROLL, nextTargetScroll));
        loopScrollUnlocked = targetScrollPos >= TREADMILL_LOOP_ENTRY_SCROLL;
      }

      needsRaycast = true;
      startAnimation();
    };

    interactionHitArea.addEventListener('pointermove', onPointerMove, { passive: true });
    interactionHitArea.addEventListener('pointerenter', onPointerEnter, { passive: true });
    interactionHitArea.addEventListener('pointerleave', onPointerLeave);
    interactionHitArea.addEventListener('wheel', handleWheel, { passive: false });
    interactionHitArea.addEventListener('click', handleHitAreaClick);
    window.addEventListener('keydown', handleKeyDown);

    const activeHeaderEl = headerRef.current;
    if (activeHeaderEl) activeHeaderEl.addEventListener('click', toggleMode);
    const activeTabHintEl = tabHintRef.current;
    if (activeTabHintEl) activeTabHintEl.addEventListener('click', toggleMode);

    updateMilestoneText(0);

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

        normalizedPiecePrototypes = Object.keys(PIECE_NODE_NAMES.owner).reduce((acc, pieceType) => {
          const sourceNode = ownerPieceNodes[pieceType] ?? riskPieceNodes[pieceType];
          const prototype = createNormalizedPiecePrototype(sourceNode, pieceType);
          if (prototype) acc[pieceType] = prototype;
          return acc;
        }, {});

        populatePieces();
      })
      .catch((error) => {
        console.error('Failed to load chess piece GLBs.', error);
      });

    const targetScaleVector = new THREE.Vector3(1, 1, 1);
    function getPieceRenderMeshes(piece) {
      if (piece.userData.renderMeshes?.length) return piece.userData.renderMeshes;
      const meshes = [];
      piece.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
      piece.userData.renderMeshes = meshes;
      return meshes;
    }

    function applyPieceMaterialState(piece, opacity, themeMix, focusBoost = 0) {
      getPieceRenderMeshes(piece).forEach((mesh) => {
        if (!mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if (
            Math.abs((material.userData.lastThemeMix ?? -1) - themeMix) < 0.001
            && Math.abs((material.userData.lastOpacity ?? -1) - opacity) < 0.002
            && Math.abs((material.userData.lastFocusBoost ?? -1) - focusBoost) < 0.02
          ) {
            return;
          }
          syncHolographicPieceMaterial(material, themeMix, opacity, focusBoost);
          material.userData.lastThemeMix = themeMix;
          material.userData.lastOpacity = opacity;
          material.userData.lastFocusBoost = focusBoost;
        });
      });

      piece.userData.hologramOverlays?.forEach(({ material, type }) => {
        if (
          Math.abs((material.userData.lastThemeMix ?? -1) - themeMix) < 0.001
          && Math.abs((material.userData.lastOpacity ?? -1) - opacity) < 0.002
          && Math.abs((material.userData.lastFocusBoost ?? -1) - focusBoost) < 0.02
        ) {
          return;
        }
        syncHolographicOverlayMaterial(material, themeMix, opacity, focusBoost, type);
        material.userData.lastThemeMix = themeMix;
        material.userData.lastOpacity = opacity;
        material.userData.lastFocusBoost = focusBoost;
      });
    }

    function setPremiumShadowPiece(featuredPiece) {
      const nextShadowPieceUUID = featuredPiece?.uuid ?? null;
      if (currentShadowPieceUUID === nextShadowPieceUUID) return;

      currentShadowPieceUUID = nextShadowPieceUUID;
      interactivePieces.forEach((piece) => {
        getPieceRenderMeshes(piece).forEach((mesh) => {
          if (mesh.castShadow) {
            mesh.castShadow = false;
          }
        });
      });
    }

    function validateQueenPawnRow(pathScroll) {
      if (!IS_DEVELOPMENT || !queenPawnSequence) return;

      const now = performance.now();
      if (now - lastQueenPawnRowValidation < QUEEN_PAWN_ROW_VALIDATION_INTERVAL_MS) return;
      lastQueenPawnRowValidation = now;

      const sequence = queenPawnSequence;
      const {
        queenRef,
        pawnRefs = [],
        queenBoardCoord,
        pawnBoardCoords = [],
        pawnColumn,
        pieceYOffset,
      } = sequence;
      const failures = [];
      const allRefs = [queenRef, ...pawnRefs].filter(Boolean);
      const uniqueRefs = new Set(allRefs);

      if (!queenRef) failures.push('missing-queen-ref');
      if (pawnRefs.length !== 3 || pawnRefs.some((pawn) => !pawn)) failures.push('missing-pawn-ref');
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
      if (pawnBoardCoords.length !== 3) failures.push('missing-pawn-board-coords');
      if (queenBoardCoord && pawnColumn <= queenBoardCoord.column) failures.push('pawn-row-is-not-after-queen');

      const expectedRows = queenPawnRowOffsets
        .map((rowOffset) => queenBoardCoord.row + rowOffset)
        .sort((a, b) => a - b);
      const actualRows = pawnBoardCoords
        .map((coord) => coord.row)
        .sort((a, b) => a - b);

      if (actualRows.length !== expectedRows.length || actualRows.some((row, index) => row !== expectedRows[index])) {
        failures.push('pawn-row-uses-unexpected-rows');
      }
      if (pawnBoardCoords.some((coord) => coord.column !== pawnColumn)) {
        failures.push('pawn-row-column-is-not-aligned');
      }
      if (pawnRefs.some((pawn, index) => {
        const expectedCoord = pawnBoardCoords[index];
        return !expectedCoord
          || pawn.userData.boardCoord?.column !== expectedCoord.column
          || pawn.userData.boardCoord?.row !== expectedCoord.row;
      })) {
        failures.push('pawn-piece-board-coord-mismatch');
      }

      const queenLogicalX = queenBoardCoord
        ? tileCoordToLogicalPosition(queenBoardCoord.column, queenBoardCoord.row).logicalX
        : 0;
      if (pawnRefs.some((pawn) => (pawn?.userData.logicalX ?? 0) <= queenLogicalX)) {
        failures.push('pawn-logical-x-is-not-after-queen');
      }
      if (pawnRefs.some((pawn) => (pawn?.userData.navigationLogicalX ?? 0) <= queenLogicalX)) {
        failures.push('pawn-navigation-x-is-not-after-queen');
      }

      if (failures.length > 0) {
        console.warn('QueenPawnRow validation failed.', {
          failures,
          queenBoardCoord,
          pawnBoardCoords,
          tileSize: CHESS_ROAD_TILE_SIZE,
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
            queenCurrentX: Number((queenRef ? getTreadmillCurrentX(queenRef.userData.logicalX ?? 0, pathScroll) : 0).toFixed(3)),
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

      const scrollDelta = targetScrollPos - scrollPos;
      scrollPos = Math.abs(scrollDelta) < SCROLL_SETTLE_EPSILON
        ? targetScrollPos
        : scrollPos + scrollDelta * 0.08;
      loopScrollUnlocked = loopScrollUnlocked || scrollPos >= TREADMILL_LOOP_ENTRY_SCROLL;
      const pathScroll = loopScrollUnlocked
        ? Math.max(0, scrollPos)
        : Math.min(scrollPos, MAX_PATH_SCROLL);
      const hasSelectedPiece = currentHoveredUUID !== null;
      const selectedPieceForGlow = hasSelectedPiece
        ? interactivePieces.find((piece) => piece.uuid === currentHoveredUUID)
        : null;
      const selectedGlowHeading = selectedPieceForGlow?.userData.uiData?.whiteHeading ?? null;

      updateMilestoneText(getMilestonePathScroll(pathScroll));

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
        Math.abs(pathScroll - lastBoardPathScroll) > BOARD_UPDATE_SCROLL_EPSILON
        || Math.abs(introState.p - lastBoardIntroProgress) > 0.001
        || currentMode !== lastBoardMode
        || currentHoveredUUID !== lastBoardHoveredUUID
      );

      if (shouldUpdateBoard) {
        boardTiles.forEach((tile) => {
          const currentX = getTreadmillCurrentX(tile.userData.originalX, pathScroll);
          const transform = getBoardTransformForTileCoord(tile.userData.tileCoord, pathScroll);
          tile.position.set(transform.x, transform.y + (1 - introState.p) * tile.userData.dropDist, transform.z);
          tile.rotation.set(transform.rx, transform.ry, transform.rz);

          const fade = getUnifiedFade(currentX);
          const assemblyProgress = getTileAssemblyProgress(tile.userData.tileCoord, pathScroll);
          const centerFocus = getCenterFocus(currentX, 8.75);
          const currentZ = tile.userData.originalZ;
          let surfaceGlowStrength = 0;
          surfaceGlowAccumulator.setRGB(0, 0, 0);

          if (hasSelectedPiece) {
            interactivePieces.forEach((piece) => {
              const reveal = piece.userData.revealProgress ?? getPieceRevealProgress(piece, pathScroll);
              if (reveal <= 0.02) return;

              const pieceCurrentX = getTreadmillCurrentX(piece.userData.logicalX, pathScroll);
              const distance = Math.hypot(pieceCurrentX - currentX, (piece.userData.logicalZ ?? 0) - currentZ);
              const falloff = Math.pow(clamp01(1 - (distance / (CHESS_ROAD_TILE_SIZE * 2.35))), 2.05);
              if (falloff <= 0.001) return;

              const isSelectedGlow = (
                currentHoveredUUID === piece.uuid
                || (
                  interactionMode === 'space'
                  && selectedGlowHeading
                  && piece.userData.uiData
                  && selectedGlowHeading === piece.userData.uiData.whiteHeading
                )
              );
              if (!isSelectedGlow) return;

              const contribution = falloff * reveal * 1.34;
              surfaceGlowStrength += contribution;
              surfaceGlowPieceColor.copy(ownerSurfaceGlowColor).lerp(riskSurfaceGlowColor, piece.userData.themeMix ?? (currentMode === 'risk' ? 1 : 0));
              surfaceGlowPieceColor.multiplyScalar(contribution);
              surfaceGlowAccumulator.add(surfaceGlowPieceColor);
            });
          }

          tile.userData.assemblyProgress = assemblyProgress;
          tile.userData.revealProgress = fade * introState.p;
          tile.material.opacity = fade * introState.p;
          if ('emissive' in tile.material && tile.material.emissive) {
            tile.material.emissive.copy(tile.userData.emissiveColor);
            if (surfaceGlowStrength > 0.001) {
              surfaceGlowAccumulator.multiplyScalar(1 / surfaceGlowStrength);
              const surfaceGlowMix = clamp01(surfaceGlowStrength * 0.84);
              tile.material.emissive.lerp(surfaceGlowAccumulator, surfaceGlowMix);
              if (tile.material.specularColor) {
                tile.material.specularColor.copy(tile.userData.baseSpecularColor).lerp(surfaceGlowAccumulator, surfaceGlowMix * 0.72);
              }
            } else if (tile.material.specularColor) {
              tile.material.specularColor.copy(tile.userData.baseSpecularColor);
            }
            tile.material.emissiveIntensity = 0.003
              + centerFocus * (tile.userData.isDark ? 0.014 : 0.01)
              + clamp01(surfaceGlowStrength) * (tile.userData.isDark ? 0.22 : 0.17);
          }
          if (tile.children[0]) tile.children[0].material.opacity = (fade * introState.p) * 0.4;
        });
        lastBoardPathScroll = pathScroll;
        lastBoardIntroProgress = introState.p;
        lastBoardMode = currentMode;
        lastBoardHoveredUUID = currentHoveredUUID;
      }

      let featuredPiece = null;
      let featuredStrength = 0;

      interactivePieces.forEach((piece) => {
        const currentX = getTreadmillCurrentX(piece.userData.logicalX, pathScroll);
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

        const selectionLift = hasSelectedPiece && isFocused ? 0.18 : 0;
        const nonSelectedOpacity = hasSelectedPiece && !isFocused ? 0.72 : 1;
        const hologramFocusBoost = hasSelectedPiece ? (isFocused ? 0.82 : -0.22) : centerFocus * 0.18;

        piece.position.set(transform.x, transform.y + PIECE_BASE_LIFT + bobbing + selectionLift, transform.z);
        piece.rotation.set(transform.rx, transform.ry, transform.rz);
        piece.visible = pieceReveal > 0.005;
        piece.userData.themeMix += (piece.userData.targetThemeMix - piece.userData.themeMix) * 0.08;

        const targetScale = hasSelectedPiece ? (isFocused ? 1.06 : 0.99) : 1.0;
        targetScaleVector.setScalar(targetScale);
        piece.scale.lerp(targetScaleVector, 0.15);

        if (pieceReveal > 0.15 && centerFocus > featuredStrength) {
          featuredStrength = centerFocus;
          featuredPiece = piece;
        }

        applyPieceMaterialState(piece, pieceReveal * nonSelectedOpacity, piece.userData.themeMix, hologramFocusBoost);
      });

      if (hasSelectedPiece) {
        const selectedPiece = interactivePieces.find((piece) => piece.uuid === currentHoveredUUID);
        if (selectedPiece && selectedPiece.userData.revealProgress > 0.15) {
          featuredPiece = selectedPiece;
          featuredStrength = Math.max(featuredStrength, 0.88);
        }
      }

      let targetSurfaceGlowOpacity = 0;
      let targetHeaderOpacity = 0;
      if (selectedPieceForGlow && selectedPieceForGlow.userData.revealProgress > 0.08) {
        const selectedGlowPieces = interactionMode === 'space' && selectedGlowHeading
          ? interactivePieces.filter((piece) => (
              piece.userData.uiData?.whiteHeading === selectedGlowHeading
              && (piece.userData.revealProgress ?? 0) > 0.04
            ))
          : [selectedPieceForGlow];
        const glowAnchorTransform = getPieceTransform(selectedPieceForGlow, pathScroll);
        let glowReveal = 0;
        let glowThemeMix = 0;
        selectedSurfaceGlowPosition.set(0, 0, 0);

        selectedGlowPieces.forEach((piece) => {
          const pieceGlowTransform = getPieceTransform(piece, pathScroll);
          const reveal = piece.userData.revealProgress ?? 0;
          selectedSurfaceGlowPosition.x += pieceGlowTransform.x;
          selectedSurfaceGlowPosition.y += pieceGlowTransform.y;
          selectedSurfaceGlowPosition.z += pieceGlowTransform.z;
          glowReveal = Math.max(glowReveal, reveal);
          glowThemeMix += piece.userData.themeMix ?? (currentMode === 'risk' ? 1 : 0);
        });

        const glowPieceCount = Math.max(1, selectedGlowPieces.length);
        selectedSurfaceGlowPosition.multiplyScalar(1 / glowPieceCount);
        glowThemeMix /= glowPieceCount;
        selectedSurfaceGlowEuler.set(glowAnchorTransform.rx, glowAnchorTransform.ry, glowAnchorTransform.rz);
        selectedSurfaceGlowLift
          .set(0, CHESS_ROAD_BOARD_THICKNESS * 0.5 + 0.035, 0)
          .applyEuler(selectedSurfaceGlowEuler);
        selectedSurfaceGlow.position.copy(selectedSurfaceGlowPosition).add(selectedSurfaceGlowLift);
        selectedSurfaceGlow.rotation.copy(selectedSurfaceGlowEuler);
        selectedSurfaceGlow.scale.set(
          glowPieceCount > 1 ? 1.18 : 0.96,
          1,
          glowPieceCount > 1 ? 1.18 : 0.96,
        );
        selectedSurfaceGlowColor
          .copy(ownerSurfaceGlowColor)
          .lerp(riskSurfaceGlowColor, glowThemeMix);
        selectedSurfaceGlowMaterial.uniforms.uGlowColor.value.copy(selectedSurfaceGlowColor);
        targetSurfaceGlowOpacity = glowReveal * THREE.MathUtils.lerp(0.42, 0.5, glowThemeMix);
        selectedSurfaceGlow.visible = true;

        const selectedUiData = selectedPieceForGlow.userData.uiData;
        const headerLabel = currentMode === 'risk'
          ? selectedUiData?.redHeading
          : selectedUiData?.whiteHeading;
        const headerSubLabel = selectedUiData?.comparisonType === 'pawnDifferential'
          ? (currentMode === 'risk' ? 'More sale pressure' : 'Less sale pressure')
          : (currentMode === 'risk'
              ? selectedUiData?.redSub
              : selectedUiData?.whiteSub);
        if (headerLabel) {
          const selectedHeaderTransform = getSelectedHeaderTransform();
          const headerThemeMix = currentMode === 'risk' ? 1 : 0;
          drawSelectedHeaderTexture(headerLabel, headerSubLabel, headerThemeMix);
          selectedHeaderEuler.set(
            selectedHeaderTransform.rx,
            selectedHeaderTransform.ry,
            selectedHeaderTransform.rz,
          );
          selectedHeader.position.set(
            selectedHeaderTransform.x,
            selectedHeaderTransform.y,
            selectedHeaderTransform.z,
          );
          selectedHeader.rotation.copy(selectedHeaderEuler);
          selectedHeader.scale.setScalar(1);
          selectedHeader.visible = true;
          targetHeaderOpacity = glowReveal * 0.92;
        }
      }

      selectedSurfaceGlowMaterial.uniforms.uOpacity.value += (
        targetSurfaceGlowOpacity - selectedSurfaceGlowMaterial.uniforms.uOpacity.value
      ) * 0.16;
      if (targetSurfaceGlowOpacity <= 0 && selectedSurfaceGlowMaterial.uniforms.uOpacity.value < 0.004) {
        selectedSurfaceGlow.visible = false;
      }

      selectedHeaderMaterial.opacity += (targetHeaderOpacity - selectedHeaderMaterial.opacity) * 0.18;
      if (targetHeaderOpacity <= 0 && selectedHeaderMaterial.opacity < 0.01) {
        selectedHeader.visible = false;
      }

      if (currentHoveredUUID !== null) {
        const activePiece = interactivePieces.find((piece) => piece.uuid === currentHoveredUUID);
        if (!activePiece || (interactionMode !== 'space' && activePiece.userData.revealProgress <= 0.05)) {
          pushActivePieceToReact(null);
        }
      }

      rimLight.color.copy(ownerRimLightColor).lerp(riskRimLightColor, currentMode === 'risk' ? 1 : 0);

      if (featuredPiece) {
        spotlightWorldTarget.copy(featuredPiece.position);
        spotlightWorldTarget.y += featuredPiece.userData.visualHeight * 0.58;

        spotlightWorldPosition.set(
          featuredPiece.position.x - 5.8,
          spotlightWorldTarget.y + 8.2,
          featuredPiece.position.z - 6.2,
        );

        keyShadowLight.target.position.lerp(spotlightWorldTarget, 0.06);
        rimLight.position.lerp(spotlightWorldPosition, 0.1);
        rimLight.target.position.lerp(spotlightWorldTarget, 0.14);
        keyShadowLight.intensity += ((0.28 + featuredStrength * 0.09) - keyShadowLight.intensity) * 0.1;
        rimLight.intensity += ((0.58 + featuredStrength * 0.44) - rimLight.intensity) * 0.12;
      } else {
        keyShadowLight.intensity += (0.28 - keyShadowLight.intensity) * 0.1;
        rimLight.intensity += (0.54 - rimLight.intensity) * 0.12;
      }
      setPremiumShadowPiece(featuredPiece);
      keyShadowLight.target.updateMatrixWorld();
      rimLight.target.updateMatrixWorld();

      if (IS_DEVELOPMENT) updateQueenPawnRowDebugMarkers(pathScroll);
      renderer.render(scene, camera);
      if (IS_DEVELOPMENT) validateQueenPawnRow(pathScroll);
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
      renderer.setPixelRatio(getRenderPixelRatio());
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
      window.removeEventListener('resize', handleResize);
      interactionHitArea.removeEventListener('pointermove', onPointerMove);
      interactionHitArea.removeEventListener('pointerenter', onPointerEnter);
      interactionHitArea.removeEventListener('pointerleave', onPointerLeave);
      interactionHitArea.removeEventListener('wheel', handleWheel);
      interactionHitArea.removeEventListener('click', handleHitAreaClick);
      window.removeEventListener('keydown', handleKeyDown);
      if (activeHeaderEl) activeHeaderEl.removeEventListener('click', toggleMode);
      if (activeTabHintEl) activeTabHintEl.removeEventListener('click', toggleMode);
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
  const showPawnDifferentialComparison = pieceInfo.comparisonType === 'pawnDifferential';
  const activePieceImage = isRiskTheme ? pieceInfo.redImageSrc : pieceInfo.whiteImageSrc;
  const showPieceDetail = pieceInfo.active && Boolean(
    activePieceImage
    || activePieceHeading
    || activePieceSub
    || showPawnDifferentialComparison
  );
  const showHints = !showPieceDetail;
  const showPieceToggleHint = !showPieceDetail;

  return (
    <div ref={containerRef} className="relative w-full bg-[#222327]">
      <div
        className="relative w-full overflow-hidden"
        style={{
          minHeight: `calc(100vh - ${headerHeight}px)`,
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
          ref={tabHintRef}
          id="section2-hint"
          className={`absolute bottom-10 left-10 z-10 cursor-pointer transition-opacity duration-300 ${
            showHints ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          role="button"
          tabIndex={showHints ? 0 : -1}
          aria-label="Toggle proxy"
        >
          <div className="flex flex-col items-center gap-3 text-white">
            <AnimatedTabHint />
            <span className="text-[11px] font-bold uppercase tracking-[0.34em] drop-shadow-lg md:text-sm">
              TOGGLE PROXY
            </span>
          </div>
        </div>

        <div
          className={`pointer-events-none absolute inset-0 z-20 transition-all duration-500 ease-out ${
            showPieceDetail ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {activePieceImage ? (
            <img
              src={activePieceImage}
              alt={activePieceHeading || 'Focused chess piece'}
              className="absolute right-7 top-[6.25rem] h-auto w-[150px] object-contain drop-shadow-[0_22px_44px_rgba(0,0,0,0.44)] transition-all duration-500 ease-out sm:right-12 sm:top-[6.5rem] sm:w-[190px] md:right-24 md:top-[4.75rem] md:w-[285px] lg:right-28 lg:top-[4.75rem] lg:w-[330px]"
            />
          ) : null}
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

        <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />
        <div
          ref={treadmillHitAreaRef}
          aria-hidden="true"
          className="absolute left-[18%] right-[18%] top-[14%] bottom-[33%] z-[6] pointer-events-auto md:left-[22%] md:right-[22%] md:top-[16%] md:bottom-[18%] lg:left-[24%] lg:right-[24%] lg:top-[15%] lg:bottom-[15%]"
          style={{ cursor: TREADMILL_CURSOR_STYLE }}
        />
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
          <HeaderLogo />
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
            src={heroImage}
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
