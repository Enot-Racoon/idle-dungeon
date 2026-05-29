import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import {
  Camera,
  StandardMaterial,
  Color,
} from "pixi3d/pixi7";
import { useGameStore } from "../../store/useGameStore";
import { initScene } from "./Scene";
import { updateAnimations, type AnimationState } from "./systems/AnimationSystem";

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  type: "hero_hit" | "hero_crit" | "monster_hit" | "heal" | "info";
}

export const PixiCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);

  const { monster, hero, combatEvents } = useGameStore();

  const processedEventsRef = useRef<Set<string>>(new Set());
  const animStateRef = useRef<AnimationState>({
    heroAttackTime: 0, heroHitTime: 0, monsterAttackTime: 0,
    monsterHitTime: 0, monsterDeathTime: 0, monsterSpawnTime: 0,
  });

  const createFloaty = (x: number, y: number, text: string, type: FloatingText["type"], duration = 800) => {
    const id = `f_${Date.now()}_${Math.random()}`;
    const offsetLeft = Math.random() * 80 - 40;
    const offsetTop = Math.random() * 60 - 30;
    setFloatingTexts(prev => [...prev, { id, x: x + offsetLeft, y: y + offsetTop, text, type }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), duration);
  };

  // Track monster ID for spawn animations
  const prevMonsterId = useRef<string>("");

  useEffect(() => {
    if (!monster) return;
    if (prevMonsterId.current && prevMonsterId.current !== monster.id) {
      animStateRef.current.monsterDeathTime = 0;
      animStateRef.current.monsterSpawnTime = 0.6;
    }
    prevMonsterId.current = monster.id;
  }, [monster]);

  // Handle combat events (Floaties, Shakes, Level-up flash)
  useEffect(() => {
    const newEvents = combatEvents.filter(e => !processedEventsRef.current.has(e.id));
    if (newEvents.length === 0) return;

    newEvents.forEach(event => {
      processedEventsRef.current.add(event.id);
      const canvasWidth = containerRef.current?.clientWidth || 500;
      const canvasHeight = containerRef.current?.clientHeight || 400;

      if (event.type === "hero_attack" || event.type === "hero_crit") {
        createFloaty(canvasWidth * 0.65, canvasHeight * 0.45, `${event.value}`, event.type === "hero_crit" ? "hero_crit" : "hero_hit");
        animStateRef.current.heroAttackTime = 0.4;
      } else if (event.type === "monster_attack") {
        createFloaty(canvasWidth * 0.35, canvasHeight * 0.5, `${event.value}`, "monster_hit");
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 300);
        animStateRef.current.heroHitTime = 0.3;
        animStateRef.current.monsterAttackTime = 0.4;
      } else if (event.type === "hero_heal") {
        createFloaty(canvasWidth * 0.35, canvasHeight * 0.45, `${event.value}`, "heal");
      } else if (event.type === "level_up") {
        setLevelUpFlash(true);
        setTimeout(() => setLevelUpFlash(false), 1000);
        createFloaty(canvasWidth * 0.5, canvasHeight * 0.3, "✨ LEVEL UP! ✨", "info", 1500);
      } else if (event.type === "boss_spawn") {
        createFloaty(canvasWidth * 0.5, canvasHeight * 0.25, "💀 BOSS SPAWNED! 💀", "info", 1800);
      }
    });
  }, [combatEvents]);

  // Main PIXI Initialization
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const app = new PIXI.Application({
      view: canvasRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      antialias: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    Camera.main.position.set(0, 2.5, 6);
    Camera.main.rotationQuaternion.setEulerAngles(18, 180, 0);

    const scene = initScene(app);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        app.renderer.resize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    resizeObserver.observe(containerRef.current);

    let timeAccumulator = 0;
    app.ticker.add((delta) => {
      const dt = delta / 60;
      timeAccumulator += dt;

      // 1. Update Lights
      const flicker = Math.sin(timeAccumulator * 8) * 0.4 + Math.cos(timeAccumulator * 15) * 0.2;
      scene.torchL.intensity = 3.5 + flicker;
      scene.torchR.intensity = 3.5 - flicker;

      // 2. Update Equipment Visuals
      const heroState = useGameStore.getState().hero;
      [scene.heroShield, scene.heroSword].forEach((mesh, idx) => {
        const isShield = idx === 0;
        const lvl = isShield ? heroState.equipment.armorLvl : heroState.equipment.weaponLvl;
        const mat = mesh.material as StandardMaterial;
        if (lvl >= 10) {
          mat.baseColor = Color.fromHex(isShield ? "#a855f7" : "#ef4444");
          mesh.scale.set(isShield ? 0.16 : 0.12, isShield ? 0.95 : 1.2, isShield ? 0.55 : 0.12);
        } else if (lvl >= 5) {
          mat.baseColor = Color.fromHex(isShield ? "#ffd700" : "#06b6d4");
          mesh.scale.set(isShield ? 0.14 : 0.1, isShield ? 0.88 : 1.05, isShield ? 0.5 : 0.1);
        }
      });

      // 3. Update Monster Visuals
      const currentMonster = useGameStore.getState().monster;
      if (currentMonster) {
        const mat = scene.monsterBody.material as StandardMaterial;
        const scales: Record<string, [number, number, number]> = {
          goblin: [0.45, 0.45, 0.45], skeleton: [0.35, 0.8, 0.35], orc: [0.75, 0.75, 0.75],
          demon: [0.65, 0.65, 0.65], dragon: [1.1, 1.1, 1.1]
        };
        const colors: Record<string, string> = {
          goblin: "#15803d", skeleton: "#e2e8f0", orc: "#b45309", demon: "#dc2626", dragon: "#78350f"
        };
        mat.baseColor = Color.fromHex(currentMonster.isBoss ? "#ea580c" : colors[currentMonster.type]);
        const baseScale = scales[currentMonster.type];
        const mult = currentMonster.isBoss ? 1.3 : 1;
        scene.monsterBody.scale.set(baseScale[0] * mult, baseScale[1] * mult, baseScale[2] * mult);
      }

      // 4. Update Animations
      updateAnimations(dt, animStateRef.current, scene, timeAccumulator);
    });

    return () => {
      resizeObserver.disconnect();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };
  }, []);

  return (
    <div ref={containerRef} className={`view-section glass-panel ${shakeScreen ? "screen-shake" : ""}`} style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden" }}>
        {floatingTexts.map(t => (
          <span key={t.id} className={`combat-text combat-text-${t.type === 'info' ? 'info' : t.type}`} style={{ position: "absolute", left: `${t.x}px`, top: `${t.y}px`, transform: "translate(-50%, -50%)", color: t.type === "info" ? "#f59e0b" : undefined, fontSize: t.type === "info" ? "1.8rem" : undefined }}>
            {t.text}
          </span>
        ))}
      </div>
      {hero.health.currentHp < hero.health.maxHp * 0.25 && <div className="danger-overlay" />}
      {levelUpFlash && <div className="level-up-flash" />}
    </div>
  );
};
