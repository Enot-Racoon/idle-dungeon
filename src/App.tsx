import { useGameState } from './hooks/useGameState';
import { PixiCanvas } from './components/PixiCanvas';
import { Tabs } from './components/Tabs';
import { UpgradePanel } from './components/UpgradePanel';
import { SkillsPanel } from './components/SkillsPanel';
import { ArtifactPanel } from './components/ArtifactPanel';
import { PrestigePanel } from './components/PrestigePanel';

function App() {
  const {
    state,
    castSkill,
    buyUpgrade,
    buyArtifact,
    setActiveTab,
    setAutoFightBoss,
    prestige
  } = useGameState();

  const {
    hero,
    monster,
    gold,
    essence,
    shards,
    currentFloor,
    monstersDefeatedOnFloor,
    monstersRequiredForFloor,
    isBossFloor,
    activeTab,
    combatEvents,
    dps,
    autoFightBoss
  } = state;

  // Manual reset of local storage save to start fresh
  const handleResetSave = () => {
    if (window.confirm('Вы действительно хотите полностью сбросить весь игровой процесс? Реликвии и осколки также будут стерты.')) {
      localStorage.removeItem('idle_dungeon_save_v1');
      window.location.reload();
    }
  };

  // Helper to format combat log dates
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper for combat log text colors
  const getLogStyle = (type: string) => {
    switch (type) {
      case 'hero_crit': return { color: 'var(--color-gold)', fontWeight: 700 };
      case 'hero_heal': return { color: 'var(--color-heal)' };
      case 'monster_attack': return { color: '#ef4444' };
      case 'level_up': return { color: '#06b6d4', fontWeight: 700 };
      case 'boss_spawn': return { color: '#a855f7', fontWeight: 700 };
      default: return { color: '#cbd5e1' };
    }
  };

  return (
    <div className="app-container" id="idle-dungeon-app">
      {/* 1. Main 3D View and HUD Section */}
      <section className="view-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Top Header Panel (RPG Brand + Resource Counters) */}
        <header 
          className="glass-panel" 
          style={{ 
            padding: '10px 16px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏰</span>
            <h1 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, textShadow: '0 0 10px rgba(243, 169, 50, 0.3)' }}>
              IDLE DUNGEON <span style={{ color: 'var(--color-gold)', fontSize: '0.8rem', verticalAlign: 'middle' }}>3D RPG</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="resource-badge resource-gold" title="Золото (добывается с монстров)">
              🪙 <span>{gold.toLocaleString()}</span>
            </div>
            <div className="resource-badge resource-essence" title="Эссенция Монстров (выпадает с боссов и монстров)">
              💜 <span>{essence.toLocaleString()}</span>
            </div>
            {shards > 0 && (
              <div className="resource-badge resource-shard" title="Осколки Перерождения">
                ✨ <span>{shards.toLocaleString()}</span>
              </div>
            )}
          </div>
        </header>

        {/* The 3D Render Canvas + Floaties Viewport */}
        <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <PixiCanvas gameState={state} />

          {/* Combat HUD Overlay - absolutely positioned over the canvas */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '12px', 
              left: '12px', 
              right: '12px', 
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 4
            }}
          >
            {/* Top Row: Hero and Monster Health Bars */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              
              {/* Hero Status HUD */}
              <div 
                className="glass-panel" 
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  pointerEvents: 'auto', 
                  maxWidth: '240px',
                  background: 'rgba(11, 11, 20, 0.85)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: '#fff' }}>🛡️ Герой (Lvl {hero.level})</span>
                  <span style={{ color: 'var(--color-heal)' }}>+{hero.regen}/s</span>
                </div>
                <div className="bar-container">
                  <div className="bar-fill bar-hp" style={{ width: `${(hero.currentHp / hero.maxHp) * 100}%` }} />
                  <div className="bar-label">{Math.round(hero.currentHp)} / {hero.maxHp} HP</div>
                </div>
                
                {/* Exp bar */}
                <div className="bar-container" style={{ height: '6px', marginTop: '6px', borderRadius: '3px' }}>
                  <div className="bar-fill bar-xp" style={{ width: `${(hero.exp / hero.nextLevelExp) * 100}%` }} />
                </div>
              </div>

              {/* Monster Status HUD */}
              {monster && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    pointerEvents: 'auto', 
                    maxWidth: '240px',
                    textAlign: 'right',
                    background: 'rgba(11, 11, 20, 0.85)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: '#fff', width: '100%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {monster.name}
                    </span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className={`bar-fill ${monster.isBoss ? 'bar-boss' : 'bar-hp'}`} 
                      style={{ 
                        width: `${(monster.currentHp / monster.maxHp) * 100}%`,
                        backgroundColor: monster.isBoss ? undefined : '#e11d48'
                      }} 
                    />
                    <div className="bar-label">{monster.currentHp} / {monster.maxHp} HP</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Сила: ⚔️ {monster.attack} | Уровень: {monster.level}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Row: Floor Progression Indicator */}
            <div style={{ alignSelf: 'center', textAlign: 'center' }}>
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '6px 16px', 
                  display: 'inline-block',
                  background: 'rgba(11, 11, 20, 0.85)',
                  pointerEvents: 'auto',
                  border: isBossFloor ? '1px solid var(--color-danger)' : undefined
                }}
              >
                <div className="rpg-font" style={{ fontSize: '1rem', color: isBossFloor ? 'var(--color-danger)' : 'var(--color-gold)' }}>
                  {isBossFloor ? '💀 КОМНАТА БОССА 💀' : `🗝️ ЭТАЖ ${currentFloor}`}
                </div>
                
                {!isBossFloor && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Убито монстров: {monstersDefeatedOnFloor} / {monstersRequiredForFloor}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Utilities HUD (DPS & Autofight Boss settings) */}
            <div 
              style={{ 
                position: 'absolute',
                bottom: '12px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 12px'
              }}
            >
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '4px 10px', 
                  fontSize: '0.75rem', 
                  color: 'var(--color-gold)',
                  background: 'rgba(11, 11, 20, 0.85)',
                  fontWeight: 700
                }}
              >
                Урон/сек: ⚔️ {dps} DPS
              </div>

              <div 
                className="glass-panel" 
                style={{ 
                  padding: '4px 10px', 
                  fontSize: '0.75rem', 
                  color: '#fff',
                  background: 'rgba(11, 11, 20, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  pointerEvents: 'auto',
                  cursor: 'pointer'
                }}
                onClick={() => setAutoFightBoss(!autoFightBoss)}
              >
                <input 
                  type="checkbox" 
                  checked={autoFightBoss}
                  onChange={(e) => setAutoFightBoss(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                  id="autofight-boss-check"
                />
                <label htmlFor="autofight-boss-check" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Авто-вызов Босса
                </label>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 2. Control dashboard panel section */}
      <section className="control-section glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation tabs switching panel views */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} heroLevel={hero.level} />

        {/* Tab pages containers */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 0' }}>
          {activeTab === 'upgrades' && (
            <UpgradePanel gameState={state} buyUpgrade={buyUpgrade} />
          )}
          {activeTab === 'skills' && (
            <SkillsPanel gameState={state} castSkill={castSkill} />
          )}
          {activeTab === 'artifacts' && (
            <ArtifactPanel gameState={state} buyArtifact={buyArtifact} />
          )}
          {activeTab === 'prestige' && (
            <PrestigePanel gameState={state} prestige={prestige} />
          )}
        </div>

        {/* Bottom Combat Console Logs (Real-time updates) */}
        <div 
          style={{ 
            height: '110px', 
            marginTop: '12px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflow: 'hidden'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            💬 ЖУРНАЛ СРАЖЕНИЙ:
          </div>
          
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              fontSize: '0.75rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '2px' 
            }}
            id="combat-logs-console"
          >
            {combatEvents.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Сражение начинается...</span>
            ) : (
              combatEvents.map(event => {
                let text = '';
                if (event.type === 'hero_attack') text = `🗡️ Вы нанесли ${event.value} урона монстру.`;
                else if (event.type === 'hero_crit') text = `💥 КРИТИЧЕСКИЙ УДАР! Нанесено ${event.value} урона!`;
                else if (event.type === 'monster_attack') text = `🩸 Монстр ударил вас на ${event.value} урона.`;
                else if (event.type === 'hero_heal') text = `💖 Восстановлено ${event.value} здоровья.`;
                else if (event.type === 'monster_dead' || event.type === 'level_up' || event.type === 'boss_spawn') {
                  text = `${event.value}`;
                }

                return (
                  <div key={event.id} style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>[{formatTime(event.timestamp)}]</span>
                    <span style={getLogStyle(event.type)}>{text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Debug settings link */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>Версия Альфа v1.0.0</span>
          <button 
            onClick={handleResetSave} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-danger)', 
              cursor: 'pointer', 
              fontSize: '0.7rem', 
              textDecoration: 'underline',
              opacity: 0.7 
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            Сбросить сохранение Fresh Reset
          </button>
        </footer>

      </section>
    </div>
  );
}

export default App;
