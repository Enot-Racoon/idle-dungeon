import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import {
  Camera,
  Light,
  LightType,
  Mesh3D,
  Container3D,
  StandardMaterial,
  Color,
  LightingEnvironment,
} from "pixi3d/pixi7";
import type { GameState, Monster } from "../types/game";

interface PixiCanvasProps {
  gameState: GameState;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  type: "hero_hit" | "hero_crit" | "monster_hit" | "heal" | "info";
}

export const PixiCanvas: React.FC<PixiCanvasProps> = ({ gameState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);

  // Refs for tracking 3D meshes to animate
  const sceneRef = useRef<{
    heroContainer: Container3D;
    heroBody: Mesh3D;
    heroSword: Mesh3D;
    heroShield: Mesh3D;
    monsterContainer: Container3D;
    monsterBody: Mesh3D;
    floor: Mesh3D;
    directionalLight: Light;
    torchL: Light;
    torchR: Light;
  } | null>(null);

  // Track state in refs for tick loop to avoid stale closure issues
  const currentMonsterRef = useRef<Monster | null>(null);
  const heroLevelRef = useRef(1);
  const weaponLvlRef = useRef(1);
  const armorLvlRef = useRef(1);
  const processedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    currentMonsterRef.current = gameState.monster;
    heroLevelRef.current = gameState.hero.level;
    weaponLvlRef.current = gameState.hero.weaponLvl;
    armorLvlRef.current = gameState.hero.armorLvl;
  }, [gameState.monster, gameState.hero]);

  // Clean event logs on mount
  useEffect(() => {
    // Populate existing event ids so we only animate NEW ones
    gameState.combatEvents.forEach((e) => processedEventsRef.current.add(e.id));
  }, [gameState.combatEvents]);

  // Visual cues animations
  const animStateRef = useRef({
    heroAttackTime: 0,
    heroHitTime: 0,
    monsterAttackTime: 0,
    monsterHitTime: 0,
    monsterDeathTime: 0,
    monsterSpawnTime: 0,
  });

  const animateHeroAttack = () => {
    animStateRef.current.heroAttackTime = 0.4; // 0.4 seconds animation
  };

  const animateHeroHit = () => {
    animStateRef.current.heroHitTime = 0.3;
  };

  const animateMonsterAttack = () => {
    animStateRef.current.monsterAttackTime = 0.4;
  };

  // Watch for new combat events to trigger animations & floaties
  useEffect(() => {
    const newEvents = gameState.combatEvents.filter(
      (e) => !processedEventsRef.current.has(e.id),
    );
    if (newEvents.length === 0) return;

    newEvents.forEach((event) => {
      processedEventsRef.current.add(event.id);

      const canvasWidth = containerRef.current?.clientWidth || 500;
      const canvasHeight = containerRef.current?.clientHeight || 400;

      // Hero attacks -> Damage shown on monster side (right, approx 65% width)
      if (event.type === "hero_attack" || event.type === "hero_crit") {
        const id = `dmg_${event.id}_${Math.random()}`;
        const offsetLeft = Math.random() * 80 - 40;
        const offsetTop = Math.random() * 60 - 30;

        setFloatingTexts((prev) => [
          ...prev,
          {
            id,
            x: canvasWidth * 0.65 + offsetLeft,
            y: canvasHeight * 0.45 + offsetTop,
            text: `${event.value}`,
            type: event.type === "hero_crit" ? "hero_crit" : "hero_hit",
          },
        ]);

        // Clean up floaty after 800ms
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 800);

        // Trigger sword slash slash animation!
        animateHeroAttack();
      }

      // Monster attacks -> Damage shown on hero side (left, approx 35% width)
      if (event.type === "monster_attack") {
        const id = `dmg_${event.id}_${Math.random()}`;
        const offsetLeft = Math.random() * 60 - 30;
        const offsetTop = Math.random() * 40 - 20;

        setFloatingTexts((prev) => [
          ...prev,
          {
            id,
            x: canvasWidth * 0.35 + offsetLeft,
            y: canvasHeight * 0.5 + offsetTop,
            text: `${event.value}`,
            type: "monster_hit",
          },
        ]);

        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 800);

        // Screen shake + hero hit reaction
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 300);
        animateHeroHit();
        animateMonsterAttack();
      }

      // Healing -> Green text over Hero
      if (event.type === "hero_heal") {
        const id = `heal_${event.id}_${Math.random()}`;
        setFloatingTexts((prev) => [
          ...prev,
          {
            id,
            x: canvasWidth * 0.35 + (Math.random() * 40 - 20),
            y: canvasHeight * 0.45,
            text: `${event.value}`,
            type: "heal",
          },
        ]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 800);
      }

      // Level up flash
      if (event.type === "level_up") {
        setLevelUpFlash(true);
        setTimeout(() => setLevelUpFlash(false), 1000);

        const id = `lvl_${event.id}`;
        setFloatingTexts((prev) => [
          ...prev,
          {
            id,
            x: canvasWidth * 0.5,
            y: canvasHeight * 0.3,
            text: "✨ LEVEL UP! ✨",
            type: "info",
          },
        ]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 1500);
      }

      // Boss notification
      if (event.type === "boss_spawn") {
        const id = `boss_${event.id}`;
        setFloatingTexts((prev) => [
          ...prev,
          {
            id,
            x: canvasWidth * 0.5,
            y: canvasHeight * 0.25,
            text: "💀 BOSS SPAWNED! 💀",
            type: "info",
          },
        ]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 1800);
      }
    });
  }, [gameState.combatEvents]);

  // Detect monster changes for spawn/death animations
  const prevMonsterId = useRef<string>("");
  useEffect(() => {
    if (!gameState.monster) return;

    if (
      prevMonsterId.current &&
      prevMonsterId.current !== gameState.monster.id
    ) {
      // Monster has changed! It means the previous died and this one is spawning.
      animStateRef.current.monsterDeathTime = 0; // stop death
      animStateRef.current.monsterSpawnTime = 0.6; // spawn for 0.6s

      // Rise monster from ground
      if (sceneRef.current) {
        sceneRef.current.monsterContainer.position.y = -3;
        sceneRef.current.monsterContainer.rotationQuaternion.setEulerAngles(
          0,
          0,
          0,
        );
      }
    }
    prevMonsterId.current = gameState.monster.id;
  }, [gameState.monster]);

  // Main Canvas & 3D Initialization
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Create Pixi Application
    const app = new PIXI.Application({
      view: canvasRef.current,
      width,
      height,
      antialias: true,
      backgroundAlpha: 0, // transparent so CSS background shines through
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    appRef.current = app;

    // Clear lights when initializing
    LightingEnvironment.main.lights = [];

    // 2. Setup Camera
    Camera.main.position.set(0, 2.5, 6);
    Camera.main.rotationQuaternion.setEulerAngles(18, 180, 0); // tilted down looking slightly right

    // 3. Setup Lights (Ambient soft blue + Directional key light + Warm torches)
    const directionalLight = new Light();
    directionalLight.type = LightType.directional;
    directionalLight.color = Color.fromHex("#2b3d63"); // cold dark blue gothic light
    directionalLight.intensity = 1.8;
    directionalLight.position.set(-3, 6, 3);

    const torchL = new Light();
    torchL.type = LightType.point;
    torchL.color = Color.fromHex("#ff6a00"); // fiery orange
    torchL.intensity = 3.5;
    torchL.range = 7;
    torchL.position.set(-3.2, 1.8, -2.5);

    const torchR = new Light();
    torchR.type = LightType.point;
    torchR.color = Color.fromHex("#ff6a00");
    torchR.intensity = 3.5;
    torchR.range = 7;
    torchR.position.set(3.2, 1.8, -2.5);

    LightingEnvironment.main.lights.push(directionalLight, torchL, torchR);

    // 4. Create Dungeon Floor (Dark Stone)
    const floor = Mesh3D.createCube();
    app.stage.addChild(floor);
    floor.scale.set(12, 0.2, 12);
    floor.position.set(0, -0.6, 0);
    const floorMat = floor.material as StandardMaterial;
    if (floorMat) {
      floorMat.baseColor = Color.fromHex("#13131d");
      floorMat.roughness = 0.8;
      floorMat.metallic = 0.2;
    }

    // 5. Build Back Dungeon Wall
    const backWall = Mesh3D.createCube();
    app.stage.addChild(backWall);
    backWall.scale.set(12, 4, 0.5);
    backWall.position.set(0, 1.5, -4);
    const wallMat = backWall.material as StandardMaterial;
    if (wallMat) {
      wallMat.baseColor = Color.fromHex("#0c0c14");
      wallMat.roughness = 0.95;
    }

    // 6. Build Left & Right Pillars for Torches
    const pillarL = Mesh3D.createCube();
    app.stage.addChild(pillarL);
    pillarL.scale.set(0.6, 4, 0.6);
    pillarL.position.set(-3.5, 1.4, -3);
    const pillarLMat = pillarL.material as StandardMaterial;
    if (pillarLMat) {
      pillarLMat.baseColor = Color.fromHex("#181827");
      pillarLMat.roughness = 0.7;
    }

    const pillarR = Mesh3D.createCube();
    app.stage.addChild(pillarR);
    pillarR.scale.set(0.6, 4, 0.6);
    pillarR.position.set(3.5, 1.4, -3);
    const pillarRMat = pillarR.material as StandardMaterial;
    if (pillarRMat) {
      pillarRMat.baseColor = Color.fromHex("#181827");
      pillarRMat.roughness = 0.7;
    }

    // 7. Create Hero 3D Container
    const heroContainer = new Container3D();
    app.stage.addChild(heroContainer);
    heroContainer.position.set(-2, 0, 0);

    const heroBody = Mesh3D.createSphere();
    heroContainer.addChild(heroBody);
    heroBody.scale.set(0.65, 0.65, 0.65);
    const bodyMat = heroBody.material as StandardMaterial;
    if (bodyMat) {
      bodyMat.baseColor = Color.fromHex("#3b82f6"); // bright hero blue
      bodyMat.roughness = 0.3;
      bodyMat.metallic = 0.7;
    }

    // Shield (Armor)
    const heroShield = Mesh3D.createCube();
    heroContainer.addChild(heroShield);
    heroShield.scale.set(0.12, 0.8, 0.45);
    heroShield.position.set(-0.7, 0, 0);
    const shieldMat = heroShield.material as StandardMaterial;
    if (shieldMat) {
      shieldMat.baseColor = Color.fromHex("#4b5563"); // steel grey shield
      shieldMat.roughness = 0.4;
      shieldMat.metallic = 0.85;
    }

    // Sword (Weapon Container for rotational slashes)
    const swordSwingContainer = new Container3D();
    heroContainer.addChild(swordSwingContainer);
    swordSwingContainer.position.set(0.7, 0, 0);

    const heroSword = Mesh3D.createCube();
    swordSwingContainer.addChild(heroSword);
    heroSword.scale.set(0.08, 0.95, 0.08);
    heroSword.position.set(0, 0.45, 0); // offset so it pivots from hand
    const swordMat = heroSword.material as StandardMaterial;
    if (swordMat) {
      swordMat.baseColor = Color.fromHex("#fbbf24"); // gold/silver
      swordMat.roughness = 0.1;
      swordMat.metallic = 0.9;
    }

    // 8. Create Monster 3D Container
    const monsterContainer = new Container3D();
    app.stage.addChild(monsterContainer);
    monsterContainer.position.set(2, 0, 0);

    // Initial dummy body (will be mutated inside tick loop according to monster type)
    const monsterBody = Mesh3D.createCube();
    monsterContainer.addChild(monsterBody);
    monsterBody.scale.set(0.6, 0.6, 0.6);
    const mbMat = monsterBody.material as StandardMaterial;
    if (mbMat) {
      mbMat.baseColor = Color.fromHex("#10b981"); // initial green goblin
    }

    // Save refs
    sceneRef.current = {
      heroContainer,
      heroBody,
      heroSword,
      heroShield,
      monsterContainer,
      monsterBody,
      floor,
      directionalLight,
      torchL,
      torchR,
    };

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        app.renderer.resize(width, height);
      }
    });
    resizeObserver.observe(containerRef.current);

    // 10. Frame Tick & Animation Loop
    let timeAccumulator = 0;
    app.ticker.add((delta) => {
      const dt = delta / 60; // elapsed time in seconds
      timeAccumulator += dt;

      // Torch Flicker
      if (torchL && torchR) {
        const flicker =
          Math.sin(timeAccumulator * 8) * 0.4 +
          Math.cos(timeAccumulator * 15) * 0.2;
        torchL.intensity = 3.5 + flicker;
        torchR.intensity = 3.5 - flicker;
      }

      if (!sceneRef.current) return;

      const {
        heroContainer: hc,
        heroSword: hs,
        heroShield: hsd,
        heroBody: hb,
        monsterContainer: mc,
        monsterBody: mb,
      } = sceneRef.current;

      // Update character meshes based on gear levels in game state
      if (hsd) {
        const mat = hsd.material as StandardMaterial;
        if (mat) {
          // Upgrade shield visual based on Armor Level
          const armorLvl = armorLvlRef.current;
          if (armorLvl >= 10) {
            mat.baseColor = Color.fromHex("#a855f7"); // magical purple shield
            hsd.scale.set(0.16, 0.95, 0.55);
          } else if (armorLvl >= 5) {
            mat.baseColor = Color.fromHex("#ffd700"); // gold trimmed shield
            hsd.scale.set(0.14, 0.88, 0.5);
          } else {
            mat.baseColor = Color.fromHex("#4b5563"); // steel shield
            hsd.scale.set(0.12, 0.8, 0.45);
          }
        }
      }

      if (hs) {
        const mat = hs.material as StandardMaterial;
        if (mat) {
          // Upgrade sword visual based on Weapon Level
          const wpnLvl = weaponLvlRef.current;
          if (wpnLvl >= 10) {
            mat.baseColor = Color.fromHex("#ef4444"); // lava/crimson sword
            hs.scale.set(0.12, 1.2, 0.12);
          } else if (wpnLvl >= 5) {
            mat.baseColor = Color.fromHex("#06b6d4"); // ice/cyan sword
            hs.scale.set(0.1, 1.05, 0.1);
          } else {
            mat.baseColor = Color.fromHex("#fbbf24"); // golden sword
            hs.scale.set(0.08, 0.95, 0.08);
          }
        }
      }

      // Mutate monster appearance dynamically based on current monster type
      const currentMonster = currentMonsterRef.current;
      if (currentMonster && mb) {
        const mat = mb.material as StandardMaterial;
        if (mat) {
          // Mutate scale & shape & color based on monster type
          if (currentMonster.type === "goblin") {
            mat.baseColor = Color.fromHex("#15803d"); // dark green
            mb.scale.set(0.45, 0.45, 0.45);
          } else if (currentMonster.type === "skeleton") {
            mat.baseColor = Color.fromHex("#e2e8f0"); // bone white
            mb.scale.set(0.35, 0.8, 0.35); // tall skeletal box
          } else if (currentMonster.type === "orc") {
            mat.baseColor = Color.fromHex("#b45309"); // brown-orange bulky orc
            mb.scale.set(0.75, 0.75, 0.75); // huge bulky block
          } else if (currentMonster.type === "demon") {
            mat.baseColor = Color.fromHex("#dc2626"); // fiery red demon
            mb.scale.set(0.65, 0.65, 0.65);
          } else if (currentMonster.type === "dragon") {
            mat.baseColor = Color.fromHex("#78350f"); // heavy dark gold dragon scale
            mb.scale.set(1.1, 1.1, 1.1); // huge dragon block
          }

          // Make Boss glow crimson!
          if (currentMonster.isBoss) {
            mat.baseColor = Color.fromHex("#ea580c"); // intense orange-red
            mat.roughness = 0.1;
            mb.scale.set(mb.scale.x * 1.3, mb.scale.y * 1.3, mb.scale.z * 1.3); // bigger
          } else {
            mat.roughness = 0.5;
          }
        }
      }

      // --- ANIMATION Ticks ---

      // Hero Attack Animation (lunge forward + sword rotation)
      if (animStateRef.current.heroAttackTime > 0) {
        animStateRef.current.heroAttackTime -= dt;
        const progress = 1 - animStateRef.current.heroAttackTime / 0.4;

        // Sine wave for clean swing forward and back
        const xOffset = Math.sin(progress * Math.PI) * 1.5;
        const swordRotation = progress * Math.PI * 1.6; // fast rotation swing

        hc.position.x = -2 + xOffset;
        if (hs.parent) {
          // Swing the sword swing container!
          const parent = hs.parent as Container3D;
          parent.rotationQuaternion.setEulerAngles(-swordRotation * 25, 0, 0);
        }

        // Tilt body forward slightly
        hb.rotationQuaternion.setEulerAngles(
          0,
          0,
          Math.sin(progress * Math.PI) * 10,
        );
      } else {
        // Return to idle position
        hc.position.x = -2;
        if (hs.parent) {
          const parent = hs.parent as Container3D;
          parent.rotationQuaternion.setEulerAngles(0, 0, 0);
        }
        hb.rotationQuaternion.setEulerAngles(0, 0, 0);
      }

      // Hero Hit Reaction (knock back left)
      if (animStateRef.current.heroHitTime > 0) {
        animStateRef.current.heroHitTime -= dt;
        const progress = 1 - animStateRef.current.heroHitTime / 0.3;
        const shiftX = Math.sin(progress * Math.PI) * -0.5;

        hc.position.x = -2 + shiftX;
        hb.rotationQuaternion.setEulerAngles(
          0,
          0,
          Math.sin(progress * Math.PI) * 15,
        ); // tilt left
      }

      // Monster Attack Animation (jump forward to attack hero)
      if (animStateRef.current.monsterAttackTime > 0) {
        animStateRef.current.monsterAttackTime -= dt;
        const progress = 1 - animStateRef.current.monsterAttackTime / 0.4;
        const xOffset = Math.sin(progress * Math.PI) * -1.5;
        const yOffset = Math.sin(progress * Math.PI) * 0.6; // mini jump

        mc.position.x = 2 + xOffset;
        mc.position.y = yOffset;
        mb.rotationQuaternion.setEulerAngles(
          0,
          0,
          -Math.sin(progress * Math.PI) * 20,
        ); // forward tilt
      } else {
        // If monster is NOT dying or spawning, keep at standard position
        if (
          animStateRef.current.monsterDeathTime <= 0 &&
          animStateRef.current.monsterSpawnTime <= 0
        ) {
          mc.position.x = 2;
          mc.position.y = 0;
          mb.rotationQuaternion.setEulerAngles(0, 0, 0);
        }
      }

      // Monster Spawn Animation (rises up from the ground)
      if (animStateRef.current.monsterSpawnTime > 0) {
        animStateRef.current.monsterSpawnTime -= dt;
        const progress = 1 - animStateRef.current.monsterSpawnTime / 0.6;

        mc.position.y = -3 + progress * 3; // rise from y=-3 to 0
        mc.position.x = 2;
        // spin a bit as it spawns!
        mb.rotationQuaternion.setEulerAngles(0, (1 - progress) * 360, 0);
      }

      // Standard Idle Animations (breath/pulse)
      if (
        animStateRef.current.heroAttackTime <= 0 &&
        animStateRef.current.heroHitTime <= 0
      ) {
        hc.position.y = Math.sin(timeAccumulator * 3.5) * 0.05; // tiny breathing bob
      }

      if (
        animStateRef.current.monsterAttackTime <= 0 &&
        animStateRef.current.monsterSpawnTime <= 0
      ) {
        mc.position.y = Math.cos(timeAccumulator * 3) * 0.05; // opposite bob
      }
    });

    return () => {
      resizeObserver.disconnect();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      LightingEnvironment.main.lights = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`view-section glass-panel ${shakeScreen ? "screen-shake" : ""}`}
      style={{ width: "100%", height: "100%", position: "relative" }}
      id="3d-dungeon-view"
    >
      {/* 3D Canvas element */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* HTML floating damage and heals layer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {floatingTexts.map((t) => (
          <span
            key={t.id}
            className={`combat-text ${
              t.type === "hero_crit"
                ? "combat-text-dmg-crit"
                : t.type === "hero_hit"
                  ? "combat-text-dmg-hero"
                  : t.type === "monster_hit"
                    ? "combat-text-dmg-monster"
                    : t.type === "heal"
                      ? "combat-text-heal"
                      : "rpg-font"
            }`}
            style={{
              position: "absolute",
              left: `${t.x}px`,
              top: `${t.y}px`,
              transform: "translate(-50%, -50%)",
              color: t.type === "info" ? "#f59e0b" : undefined,
              fontSize: t.type === "info" ? "1.8rem" : undefined,
            }}
          >
            {t.text}
          </span>
        ))}
      </div>

      {/* Critical damage warning border overlay */}
      {gameState.hero.currentHp < gameState.hero.maxHp * 0.25 && (
        <div className="danger-overlay" />
      )}

      {/* Level up flash effect */}
      {levelUpFlash && <div className="level-up-flash" />}
    </div>
  );
};
