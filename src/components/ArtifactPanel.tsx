import React from 'react';
import { useGameStore } from '../store/useGameStore';

const ARTIFACT_ICONS: Record<string, string> = {
  art_sigil: '🔱',
  art_coin: '🏺',
  art_tome: '📖',
  art_slayer: '⚔️'
};

export const ArtifactPanel: React.FC = () => {
  const artifacts = useGameStore(state => state.artifacts);
  const essence = useGameStore(state => state.essence);
  const buyArtifact = useGameStore(state => state.buyArtifact);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      <h3 style={{ fontSize: '1rem', color: 'var(--color-essence)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
        💎 Реликтовый Алтарь (Улучшается за Эссенцию Монстров)
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
        Убивая монстров и боссов, вы собираете их магическую <strong>Эссенцию</strong>. Наполняйте ей древние реликвии, чтобы получать колоссальные постоянные прибавки к силе, золоту и опыту!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }} id="artifacts-grid">
        {artifacts.map(art => {
          const icon = ARTIFACT_ICONS[art.id] || '🔮';
          const canBuy = essence >= art.cost;
          const currentBonus = art.level * art.effectValue * 100;
          const nextBonus = (art.level + 1) * art.effectValue * 100;

          return (
            <div
              key={art.id}
              className="glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative'
              }}
              id={`artifact-card-${art.id}`}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <span 
                  style={{ 
                    fontSize: '2.2rem', 
                    background: 'rgba(168, 85, 247, 0.1)', 
                    padding: '8px', 
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
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
                    <span>{art.name}</span>
                    <span className="rpg-font" style={{ color: 'var(--color-essence)', fontSize: '0.85rem' }}>
                      Lvl {art.level}
                    </span>
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                    {art.description}
                  </p>
                </div>
              </div>

              <div 
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.03)'
                }}
              >
                <div>Текущий бонус: <strong style={{ color: '#2cdb7f' }}>+{currentBonus.toFixed(0)}%</strong></div>
                <div style={{ opacity: 0.7 }}>Следующий уровень: <strong style={{ color: 'var(--color-gold)' }}>+{nextBonus.toFixed(0)}%</strong></div>
              </div>

              <button
                className="rpg-button rpg-button-magic"
                onClick={() => buyArtifact(art.id)}
                disabled={!canBuy}
                style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                id={`buy-artifact-${art.id}`}
              >
                💜 {art.cost.toLocaleString()} Эссенции
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
