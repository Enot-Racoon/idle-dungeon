import React from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Skill } from '../types/ecs';

const SKILL_ICONS: Record<string, string> = {
  skl_slash: '🌪️',
  skl_heal: '🩹',
  skl_frenzy: '⚡',
  skl_greed: '🪙'
};

export const SkillsPanel: React.FC = () => {
  const skills = useGameStore(state => state.hero.skills.skills);
  const hero = useGameStore(state => state.hero);
  const castSkill = useGameStore(state => state.castSkill);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      <h3 style={{ fontSize: '1rem', color: '#a855f7', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
        🔮 Активные Заклинания
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }} id="skills-grid">
        {skills.map((skill: Skill) => {
          const icon = SKILL_ICONS[skill.id] || '✨';
          const isLocked = hero.progression.level < skill.unlockedAt;
          const isReady = skill.currentCooldown === 0;
          const isActive = skill.activeDuration > 0;
          
          const cdPct = skill.currentCooldown > 0 
            ? (skill.currentCooldown / skill.cooldown) * 100 
            : 0;

          return (
            <div
              key={skill.id}
              className={`glass-card ${isActive ? 'active-skill-glow' : ''}`}
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                border: isActive ? '1px solid var(--color-essence)' : undefined,
                boxShadow: isActive ? '0 0 15px var(--color-essence-glow)' : undefined,
                opacity: isLocked ? 0.5 : 1
              }}
              id={`skill-card-${skill.id}`}
            >
              {!isLocked && skill.currentCooldown > 0 && (
                <div 
                  className="bar-cooldown" 
                  style={{ 
                    height: `${cdPct}%`,
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.65)',
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    pointerEvents: 'none',
                    zIndex: 2,
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}
                />
              )}

              <div style={{ display: 'flex', gap: '12px', zIndex: 3 }}>
                <span 
                  style={{ 
                    fontSize: '2.2rem', 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '8px', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '50px', width: '50px'
                  }}
                >
                  {icon}
                </span>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#fff', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{skill.name}</span>
                    {isActive && (
                      <span className="rpg-font" style={{ color: 'var(--color-essence)', fontSize: '0.8rem', animation: 'pulse 1s infinite' }}>
                        Активно!
                      </span>
                    )}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                    {skill.description}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '16px', zIndex: 3 }}>
                {isLocked ? (
                  <div 
                    className="rpg-font" 
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '0.8rem', 
                      color: 'var(--color-danger)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    🔒 Разблокируется на {skill.unlockedAt} уровне
                  </div>
                ) : (
                  <button
                    className={`rpg-button ${isActive ? 'rpg-button-magic' : ''}`}
                    onClick={() => castSkill(skill.id)}
                    disabled={!isReady}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    id={`cast-skill-btn-${skill.id}`}
                  >
                    {isActive ? (
                      `Действует (${skill.activeDuration.toFixed(1)} сек)`
                    ) : !isReady ? (
                      `Перезарядка (${skill.currentCooldown.toFixed(1)} сек)`
                    ) : (
                      '✨ Использовать Заклинание'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
