import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WorldSimulation } from './game/simulation';
import { Camera, WorldRenderer } from './game/renderer';
import { PresetType } from './game/generator';
import { TitleScreen } from './components/TitleScreen';
import { HeaderBar } from './components/HeaderBar';
import { Toolbar, ActiveTool } from './components/Toolbar';
import { InspectorModal } from './components/InspectorModal';
import { HistoryModal } from './components/HistoryModal';
import { LawsModal } from './components/LawsModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { sounds } from './game/audio';
import { Plus, Minus, Compass } from 'lucide-react';
import { Entity, GodPowerId, Species, TileType, Village, Kingdom, WorldLaws, BuildingType } from './game/types';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');

  // Simulation instance in a ref to decouple high-speed physics from re-renders
  const simRef = useRef<WorldSimulation | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera state
  const cameraRef = useRef<Camera>({ x: 40, y: 30, zoom: 20 });
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    camStartX: number;
    camStartY: number;
    hasMoved: boolean;
    isPanning: boolean;
    isPainting: boolean;
    touchDist: number;
    touchMidX: number;
    touchMidY: number;
    startZoom: number;
  }>({
    startX: 0,
    startY: 0,
    camStartX: 40,
    camStartY: 30,
    hasMoved: false,
    isPanning: false,
    isPainting: false,
    touchDist: 0,
    touchMidX: 0,
    touchMidY: 0,
    startZoom: 20,
  });

  // Active Tool & Brush
  const [activeTool, setActiveTool] = useState<ActiveTool>({ category: 'inspect', subType: '' });
  const [brushSize, setBrushSize] = useState<number>(1);
  const hoveredTileRef = useRef<{ x: number; y: number } | null>(null);

  // HUD stats throttled state
  const [worldName, setWorldName] = useState<string>('Nova Terra');
  const [year, setYear] = useState<number>(1);
  const [totalPop, setTotalPop] = useState<number>(0);
  const [kingdomCount, setKingdomCount] = useState<number>(0);
  const [villageCount, setVillageCount] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const simSpeedRef = useRef<number>(1);
  simSpeedRef.current = simSpeed;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showLaws, setShowLaws] = useState<boolean>(false);
  const [showSaveLoad, setShowSaveLoad] = useState<boolean>(false);

  // Selection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedTileInfo, setSelectedTileInfo] = useState<{ x: number; y: number; type: TileType } | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(20);

  // Initialize simulation (default width = 200, height = 150 -> 4x area)
  const initWorld = useCallback((name: string, preset: PresetType, seed: number, width = 200, height = 150) => {
    const newSim = new WorldSimulation({ width, height, seed, name }, preset);
    simRef.current = newSim;
    setWorldName(newSim.name);
    setYear(newSim.year);
    setTotalPop(newSim.entities.filter(e => e.alive).length);
    setKingdomCount(newSim.kingdoms.length);
    setVillageCount(newSim.villages.length);

    cameraRef.current = {
      x: width / 2,
      y: height / 2,
      zoom: 20,
    };
    setZoomLevel(20);

    setGameState('playing');
    document.body.dataset.state = 'playing';
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(64, Math.round(cameraRef.current.zoom * 1.25));
    cameraRef.current.zoom = newZoom;
    setZoomLevel(newZoom);
    sounds.playClick();
  }, []);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(6, Math.round(cameraRef.current.zoom / 1.25));
    cameraRef.current.zoom = newZoom;
    setZoomLevel(newZoom);
    sounds.playClick();
  }, []);

  const handleCenterMap = useCallback(() => {
    if (simRef.current) {
      cameraRef.current.x = simRef.current.width / 2;
      cameraRef.current.y = simRef.current.height / 2;
      cameraRef.current.zoom = 20;
      setZoomLevel(20);
      sounds.playClick();
    }
  }, []);

  // Check ?autostart=1
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      initWorld('Nova Terra', 'continents', 123456, 200, 150);
    } else {
      document.body.dataset.state = 'title';
    }
  }, [initWorld]);

  // Handle Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main Simulation & Rendering Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!rendererRef.current) {
      rendererRef.current = new WorldRenderer(canvas);
    }

    let animationId: number;
    let lastSimTick = performance.now();
    let lastHudSync = performance.now();
    let lastRender = performance.now();

    const loop = (now: number) => {
      const sim = simRef.current;
      const renderer = rendererRef.current;

      // Throttle render to ~30 FPS (~33ms) to save CPU and maintain silky smooth performance
      if (now - lastRender >= 33) {
        lastRender = now;

        if (sim && renderer) {
          const speed = simSpeedRef.current;
          if (speed > 0) {
            const interval = 100 / speed;
            if (now - lastSimTick >= interval) {
              sim.update();
              lastSimTick = now;
            }
          }

          // Render at display rate
          renderer.render(
            sim,
            cameraRef.current,
            hoveredTileRef.current,
            brushSize,
            selectedEntityId,
            selectedVillageId
          );

          // Throttled HUD and Minimap update (every 300ms)
          if (now - lastHudSync >= 300) {
            lastHudSync = now;
            setYear(sim.year);
            setTotalPop(sim.entities.filter(e => e.alive).length);
            setKingdomCount(sim.kingdoms.length);
            setVillageCount(sim.villages.length);

            if (minimapCanvasRef.current) {
              renderer.renderMinimap(sim, cameraRef.current, minimapCanvasRef.current);
            }
          }
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, brushSize, selectedEntityId, selectedVillageId]);

  // Pointer & Interaction logic
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cw = canvas.width;
    const ch = canvas.height;
    const tileSize = cameraRef.current.zoom;

    const wx = cameraRef.current.x + (sx - cw / 2) / tileSize;
    const wy = cameraRef.current.y + (sy - ch / 2) / tileSize;
    return { x: wx, y: wy };
  }, []);

  const applyCurrentTool = useCallback((wx: number, wy: number) => {
    const sim = simRef.current;
    if (!sim) return;

    const rx = Math.round(wx);
    const ry = Math.round(wy);

    if (rx < 0 || rx >= sim.width || ry < 0 || ry >= sim.height) return;

    if (activeTool.category === 'inspect') {
      // Find closest entity (increase detection radius for fast moving units)
      const clickedEntity = sim.entities.find(e => e.alive && Math.hypot(e.x - wx, e.y - wy) < 2.5);
      if (clickedEntity) {
        setSelectedEntityId(clickedEntity.id);
        setSelectedVillageId(clickedEntity.ownerVillageId || null);
        setSelectedTileInfo(null);
        sounds.playClick();
        return;
      }

      // Check village
      const village = sim.getVillageAt(rx, ry);
      if (village) {
        setSelectedVillageId(village.id);
        setSelectedEntityId(null);
        setSelectedTileInfo(null);
        sounds.playClick();
        return;
      }

      // Tile info
      const tile = sim.tiles[ry]?.[rx];
      if (tile) {
        setSelectedTileInfo({ x: rx, y: ry, type: tile });
        setSelectedEntityId(null);
        setSelectedVillageId(null);
        sounds.playClick();
      }
    } else if (activeTool.category === 'terrain') {
      const tileType = activeTool.subType as TileType;
      sim.applyTerrainBrush(wx, wy, tileType, brushSize);
      sounds.playBrush();
    } else if (activeTool.category === 'creatures') {
      const species = activeTool.subType as Species;
      const entity = sim.spawnEntity(species, wx, wy);
      if (entity.recruitedAtSpawn) {
        sounds.playRecruit();
      } else {
        sounds.playSpawn();
      }
    } else if (activeTool.category === 'powers') {
      const powerId = activeTool.subType as GodPowerId;
      sim.triggerGodPower(powerId, wx, wy, brushSize + 1);

      if (powerId === 'lightning') sounds.playLightning();
      else if (powerId === 'meteor' || powerId === 'nuke' || powerId === 'earthquake') sounds.playExplosion();
      else if (powerId === 'healing_rain') sounds.playHeal();
      else sounds.playBrush();
    } else if (activeTool.category === 'civilization') {
      if (activeTool.subType === 'civ_found') {
        // Spawn human and found village
        const founder = sim.spawnEntity('human', wx, wy, ['Genius']);
        sim.foundKingdomAndVillage(founder);
        sounds.playWarHorn();
      } else if (
        activeTool.subType === 'civ_house' ||
        activeTool.subType === 'civ_windmill' ||
        activeTool.subType === 'civ_farm' ||
        activeTool.subType === 'civ_watchtower' ||
        activeTool.subType === 'civ_mine' ||
        activeTool.subType === 'civ_docks'
      ) {
        const bType = activeTool.subType.replace('civ_', '') as BuildingType;
        sim.placeBuildingAt(bType, rx, ry);
        sounds.playSpawn();
      } else if (activeTool.subType === 'civ_war') {
        if (sim.kingdoms.length >= 2) {
          const k1 = sim.kingdoms[0];
          const k2 = sim.kingdoms[1];
          if (!k1.enemyKingdomIds.includes(k2.id)) {
            k1.enemyKingdomIds.push(k2.id);
            k2.enemyKingdomIds.push(k1.id);
            sim.addHistoryEvent('Chiến tranh bùng nổ theo ý trời', `Thần linh đã gieo mầm hận thù giữa ${k1.name} và ${k2.name}!`, 'war', '#ef4444');
            sounds.playWarHorn();
          }
        }
      } else if (activeTool.subType === 'civ_peace') {
        for (const k of sim.kingdoms) {
          k.enemyKingdomIds = [];
        }
        sim.addHistoryEvent('Ân điển hòa bình', 'Thần linh ban hòa ước vĩnh cửu cho tất cả các vương quốc.', 'kingdom', '#10b981');
        sounds.playHeal();
      } else if (activeTool.subType === 'civ_resources') {
        const v = sim.villages.find(vl => Math.hypot(vl.x - wx, vl.y - wy) < 15);
        if (v) {
          v.resources.wood += 50;
          v.resources.stone += 50;
          v.resources.food += 50;
          v.resources.gold += 50;
          sim.createSparks(wx, wy, '#facc15', 12);
          sounds.playHeal();
        }
      }
    }
  }, [activeTool, brushSize]);

  // Mouse input handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const isPanButton = e.button === 1 || e.button === 2;
    const isInspectMode = activeTool.category === 'inspect';
    const isTerrainMode = activeTool.category === 'terrain';

    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      camStartX: cameraRef.current.x,
      camStartY: cameraRef.current.y,
      hasMoved: false,
      isPanning: isPanButton || isInspectMode || activeTool.category === 'creatures' || activeTool.category === 'civilization' || activeTool.category === 'powers',
      isPainting: e.button === 0 && isTerrainMode,
      touchDist: 0,
      touchMidX: 0,
      touchMidY: 0,
      startZoom: cameraRef.current.zoom,
    };

    if (e.button === 0 && isTerrainMode) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      applyCurrentTool(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    hoveredTileRef.current = { x: Math.round(x), y: Math.round(y) };

    const info = dragInfoRef.current;
    if (e.buttons !== 0) {
      const dist = Math.hypot(e.clientX - info.startX, e.clientY - info.startY);
      if (dist > 5) {
        info.hasMoved = true;
      }

      if (info.isPanning && (e.buttons === 1 || e.buttons === 2 || e.buttons === 4)) {
        const dx = (e.clientX - info.startX) / cameraRef.current.zoom;
        const dy = (e.clientY - info.startY) / cameraRef.current.zoom;
        cameraRef.current.x = info.camStartX - dx;
        cameraRef.current.y = info.camStartY - dy;
      } else if (info.isPainting && e.buttons === 1) {
        applyCurrentTool(x, y);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const info = dragInfoRef.current;
    if (e.button === 0 && !info.hasMoved) {
      // Direct click without dragging -> apply current tool!
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      applyCurrentTool(x, y);
    }
    info.isPanning = false;
    info.isPainting = false;
  };

  // Touch & Swipe gestures for mobile / touch devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const isInspectMode = activeTool.category === 'inspect';
      const isTerrainMode = activeTool.category === 'terrain';

      dragInfoRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        camStartX: cameraRef.current.x,
        camStartY: cameraRef.current.y,
        hasMoved: false,
        isPanning: isInspectMode || !isTerrainMode, // Drag/swipe pans the map to explore!
        isPainting: isTerrainMode,
        touchDist: 0,
        touchMidX: touch.clientX,
        touchMidY: touch.clientY,
        startZoom: cameraRef.current.zoom,
      };

      const { x, y } = screenToWorld(touch.clientX, touch.clientY);
      hoveredTileRef.current = { x: Math.round(x), y: Math.round(y) };

      if (isTerrainMode) {
        applyCurrentTool(x, y);
      }
    } else if (e.touches.length >= 2) {
      // Two-finger pinch to zoom + 2-finger pan
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      dragInfoRef.current = {
        startX: midX,
        startY: midY,
        camStartX: cameraRef.current.x,
        camStartY: cameraRef.current.y,
        hasMoved: true,
        isPanning: true,
        isPainting: false,
        touchDist: dist,
        touchMidX: midX,
        touchMidY: midY,
        startZoom: cameraRef.current.zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const maxW = sim ? sim.width : 200;
    const maxH = sim ? sim.height : 150;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const info = dragInfoRef.current;
      const dist = Math.hypot(touch.clientX - info.startX, touch.clientY - info.startY);
      if (dist > 5) {
        info.hasMoved = true;
      }

      const { x, y } = screenToWorld(touch.clientX, touch.clientY);
      hoveredTileRef.current = { x: Math.round(x), y: Math.round(y) };

      if (info.isPanning) {
        const dx = (touch.clientX - info.startX) / cameraRef.current.zoom;
        const dy = (touch.clientY - info.startY) / cameraRef.current.zoom;
        cameraRef.current.x = Math.max(0, Math.min(maxW, info.camStartX - dx));
        cameraRef.current.y = Math.max(0, Math.min(maxH, info.camStartY - dy));
      } else if (info.isPainting) {
        applyCurrentTool(x, y);
      }
    } else if (e.touches.length >= 2) {
      // Two-finger pinch to zoom AND 2-finger pan
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;
      const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);

      const info = dragInfoRef.current;
      if (info.touchDist > 0) {
        const ratio = currentDist / info.touchDist;
        const newZoom = Math.max(6, Math.min(64, Math.round(info.startZoom * ratio)));
        cameraRef.current.zoom = newZoom;
        setZoomLevel(newZoom);

        const dx = (midX - info.touchMidX) / newZoom;
        const dy = (midY - info.touchMidY) / newZoom;
        cameraRef.current.x = Math.max(0, Math.min(maxW, info.camStartX - dx));
        cameraRef.current.y = Math.max(0, Math.min(maxH, info.camStartY - dy));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const info = dragInfoRef.current;
    if (!info.hasMoved && e.changedTouches.length > 0) {
      // Tap without moving -> inspect or apply tool!
      const touch = e.changedTouches[0];
      const { x, y } = screenToWorld(touch.clientX, touch.clientY);
      applyCurrentTool(x, y);
    }
    info.isPanning = false;
    info.isPainting = false;
    info.touchDist = 0;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.85 : 1.15;
    const newZoom = Math.max(6, Math.min(64, Math.round(cameraRef.current.zoom * zoomDelta)));
    cameraRef.current.zoom = newZoom;
    setZoomLevel(newZoom);
  };

  // Keyboard Shortcuts (Space, 1-5 speed, WASD, +/- Zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setSimSpeed(prev => (prev === 0 ? 1 : 0));
        sounds.playClick();
      } else if (e.code === 'Digit1') {
        setSimSpeed(1);
      } else if (e.code === 'Digit2') {
        setSimSpeed(2);
      } else if (e.code === 'Digit5') {
        setSimSpeed(5);
      } else if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        handleZoomOut();
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        cameraRef.current.y -= 3;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        cameraRef.current.y += 3;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        cameraRef.current.x -= 3;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        cameraRef.current.x += 3;
      } else if (e.code === 'Escape') {
        setSelectedEntityId(null);
        setSelectedVillageId(null);
        setSelectedTileInfo(null);
        setShowHistory(false);
        setShowLaws(false);
        setShowSaveLoad(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut]);

  // Minimap click to teleport camera
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim || !minimapCanvasRef.current) return;
    const rect = minimapCanvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    cameraRef.current.x = mx * sim.width;
    cameraRef.current.y = my * sim.height;
  };

  // Selected object getters
  const selectedEntity = simRef.current?.entities.find(e => e.id === selectedEntityId);
  const selectedVillage = selectedEntity?.ownerVillageId
    ? simRef.current?.getVillage(selectedEntity.ownerVillageId)
    : simRef.current?.villages.find(v => v.id === selectedVillageId);
  const selectedKingdom = selectedEntity?.ownerKingdomId
    ? simRef.current?.getKingdom(selectedEntity.ownerKingdomId)
    : selectedVillage?.kingdomId
    ? simRef.current?.getKingdom(selectedVillage.kingdomId)
    : undefined;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen onStart={initWorld} />
      )}

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
        style={{ touchAction: 'none' }}
        className="absolute inset-0 w-full h-full cursor-crosshair block"
      />

      {/* In-Game HUD (Visible only when playing) */}
      {gameState === 'playing' && (
        <>
          {/* Header Bar */}
          <HeaderBar
            worldName={worldName}
            year={year}
            totalPopulation={totalPop}
            kingdomCount={kingdomCount}
            villageCount={villageCount}
            simSpeed={simSpeed}
            onSetSpeed={speed => {
              setSimSpeed(speed);
              sounds.playClick();
            }}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sounds.enabled = next;
            }}
            onOpenHistory={() => {
              setShowHistory(true);
              sounds.playClick();
            }}
            onOpenLaws={() => {
              setShowLaws(true);
              sounds.playClick();
            }}
            onOpenSaveLoad={() => {
              setShowSaveLoad(true);
              sounds.playClick();
            }}
            onResetWorld={() => {
              setGameState('title');
              document.body.dataset.state = 'title';
            }}
          />

          {/* Floating Zoom Bar (Top-Left under Header, always accessible) */}
          <div className="fixed top-16 left-3 z-30 flex items-center bg-stone-900/95 border border-stone-800 rounded-xl p-1 shadow-lg backdrop-blur-md gap-1">
            <button
              type="button"
              aria-label="Thu nhỏ (-)"
              onClick={handleZoomOut}
              title="Thu nhỏ (-) hoặc phím [-]"
              className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-200 hover:text-amber-400 flex items-center justify-center font-bold transition-all active:scale-95"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              aria-label="Căn giữa bản đồ"
              onClick={handleCenterMap}
              title="Căn giữa bản đồ"
              className="px-2 h-8 rounded-lg bg-stone-950/60 hover:bg-stone-800 text-xs font-mono text-stone-300 font-semibold select-none flex items-center gap-1 transition-colors"
            >
              <span>{Math.round((zoomLevel / 20) * 100)}%</span>
            </button>
            <button
              type="button"
              aria-label="Phóng to (+)"
              onClick={handleZoomIn}
              title="Phóng to (+) hoặc phím [+]"
              className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-200 hover:text-amber-400 flex items-center justify-center font-bold transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Minimap & Zoom in bottom-left */}
          <div className="fixed bottom-28 sm:bottom-24 left-3 z-30 hidden sm:flex flex-col bg-stone-900/95 border border-stone-800 rounded-xl p-2 shadow-xl backdrop-blur-md gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono px-0.5">
              <span>Bản đồ thế giới (200×150)</span>
              <span className="text-amber-400 font-bold">{Math.round((zoomLevel / 20) * 100)}%</span>
            </div>
            <canvas
              ref={minimapCanvasRef}
              width={160}
              height={120}
              onClick={handleMinimapClick}
              className="rounded-lg border border-stone-800 cursor-pointer block hover:border-amber-500/50 transition-colors"
            />
            {/* Quick zoom buttons on minimap */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-stone-800/80">
              <button
                type="button"
                aria-label="Thu nhỏ bản đồ (-)"
                onClick={handleZoomOut}
                title="Thu nhỏ bản đồ (-)"
                className="flex-1 py-1 px-1.5 rounded-lg bg-stone-950 border border-stone-800 hover:bg-stone-800 active:scale-95 text-stone-300 hover:text-amber-400 flex items-center justify-center text-xs font-bold transition-all"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Căn giữa"
                onClick={handleCenterMap}
                title="Căn giữa thế giới"
                className="py-1 px-2 rounded-lg bg-stone-950 border border-stone-800 hover:bg-stone-800 active:scale-95 text-stone-400 hover:text-white flex items-center justify-center text-[10px] font-mono transition-all"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Phóng to bản đồ (+)"
                onClick={handleZoomIn}
                title="Phóng to bản đồ (+)"
                className="flex-1 py-1 px-1.5 rounded-lg bg-stone-950 border border-stone-800 hover:bg-stone-800 active:scale-95 text-stone-300 hover:text-amber-400 flex items-center justify-center text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Bottom Dock Toolbar */}
          <Toolbar
            activeTool={activeTool}
            onSelectTool={tool => {
              setActiveTool(tool);
              sounds.playClick();
            }}
            brushSize={brushSize}
            onSetBrushSize={size => {
              setBrushSize(size);
              sounds.playClick();
            }}
          />

          {/* Inspector Panel */}
          {(selectedEntity || selectedVillage || selectedTileInfo) && (
            <InspectorModal
              entity={selectedEntity}
              village={selectedVillage}
              kingdom={selectedKingdom}
              tileInfo={selectedTileInfo || undefined}
              onClose={() => {
                setSelectedEntityId(null);
                setSelectedVillageId(null);
                setSelectedTileInfo(null);
              }}
              onBlessEntity={id => {
                if (simRef.current) {
                  const ent = simRef.current.entities.find(e => e.id === id);
                  if (ent && !ent.traits.includes('Blessed')) {
                    ent.traits.push('Blessed');
                    ent.health = ent.maxHealth;
                    sounds.playHeal();
                  }
                }
              }}
              onStrikeEntity={id => {
                if (simRef.current) {
                  const ent = simRef.current.entities.find(e => e.id === id);
                  if (ent) {
                    ent.health -= 150;
                    if (ent.health <= 0) ent.alive = false;
                    simRef.current.createSparks(ent.x, ent.y, '#38bdf8', 20);
                    sounds.playLightning();
                  }
                }
              }}
              onHealEntity={id => {
                if (simRef.current) {
                  const ent = simRef.current.entities.find(e => e.id === id);
                  if (ent) {
                    ent.health = ent.maxHealth;
                    ent.hunger = 100;
                    sounds.playHeal();
                  }
                }
              }}
            />
          )}

          {/* History Chronicles Modal */}
          {showHistory && simRef.current && (
            <HistoryModal
              events={simRef.current.historyEvents}
              onClose={() => setShowHistory(false)}
            />
          )}

          {/* World Laws Modal */}
          {showLaws && simRef.current && (
            <LawsModal
              laws={simRef.current.worldLaws}
              onUpdateLaws={updated => {
                if (simRef.current) {
                  simRef.current.worldLaws = updated;
                }
              }}
              onClose={() => setShowLaws(false)}
            />
          )}

          {/* Save & Load Modal */}
          {showSaveLoad && simRef.current && (
            <SaveLoadModal
              sim={simRef.current}
              onLoadWorldData={loaded => {
                const sim = simRef.current;
                if (!sim) return;
                const d = loaded as {
                  name?: string;
                  year?: number;
                  tiles?: TileType[][];
                  entities?: Entity[];
                  villages?: Village[];
                  kingdoms?: Kingdom[];
                  worldLaws?: WorldLaws;
                };
                if (d.tiles && d.entities) {
                  sim.name = d.name || sim.name;
                  sim.year = d.year || sim.year;
                  sim.tiles = d.tiles;
                  sim.entities = d.entities;
                  sim.villages = d.villages || [];
                  sim.kingdoms = d.kingdoms || [];
                  if (d.worldLaws) sim.worldLaws = d.worldLaws;
                  setWorldName(sim.name);
                  setYear(sim.year);
                }
              }}
              onClose={() => setShowSaveLoad(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
