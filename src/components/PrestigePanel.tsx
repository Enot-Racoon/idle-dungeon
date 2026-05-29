import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const PrestigePanel: React.FC = () => {
  const currentFloor = useGameStore(state => state.currentFloor);
  const shards = useGameStore(state => state.shards);
  const prestigeCount = useGameStore(state => state.prestigeCount);
  const prestige = useGameStore(state => state.prestige);

  const shardsEarned = Math.max(0, Math.floor(Math.pow(currentFloor, 1.4) / 5));
  const canPrestige = shardsEarned > 0 || currentFloor >= 10;
  
  const currentStatMultiplier = (shards * 5);
  const currentGoldMultiplier = (shards * 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      <h3 style={{ fontSize: '1rem', color: 'var(--color-shard)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
        ⌛ Храм Перерождения (Престиж)
      </h3>

      <div 
        className="glass-card" 
        style={{ 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.2)'
        }}
      >
        <h4 className="rpg-font" style={{ color: 'var(--color-shard)', fontSize: '1.1rem', textAlign: 'center' }}>
          ⌛ Ритуал Реинкарнации
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
          «Пожертвуйте накопленным золотом и спуститесь в самое начало подземелья, чтобы высвободить силу древних звездных Осколков.»
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Совершено перерождений</span>
            <strong style={{ fontSize: '1.4rem', color: '#fff' }}>{prestigeCount}</strong>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Кристальные Осколки</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--color-shard)' }}>✨ {shards}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>🛡️ Постоянные Благословения</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px' }}>
            <span>💪 Множитель всех Характеристик (+5% за осколок):</span>
            <strong style={{ color: 'var(--color-heal)' }}>+{currentStatMultiplier}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px' }}>
            <span>🪙 Множитель получаемого Золота (+2% за осколок):</span>
            <strong style={{ color: 'var(--color-gold)' }}>+{currentGoldMultiplier}%</strong>
          </div>
        </div>
      </div>

      <div 
        className="glass-card" 
        style={{ 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          alignItems: 'center',
          border: '1px solid rgba(243, 169, 50, 0.15)',
          marginTop: 'auto'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Текущий прогресс (Этаж {currentFloor})</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Будет получено при перерождении:</span>
          <strong style={{ fontSize: '1.8rem', color: 'var(--color-shard)', display: 'block', margin: '4px 0' }}>
            ✨ {shardsEarned} Осколков
          </strong>
        </div>

        <button
          className="rpg-button rpg-button-primary"
          onClick={prestige}
          disabled={!canPrestige}
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem', background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', borderColor: '#0d9488' }}
          id="prestige-trigger-btn"
        >
          ⌛ Совершить Перерождение ⌛
        </button>

        {currentFloor < 10 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', textAlign: 'center' }}>
            ⚠️ Для перерождения необходимо подняться хотя бы до 10-го этажа подземелья.
          </span>
        )}
      </div>
    </div>
  );
};
