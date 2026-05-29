import React from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Upgrade } from '../types/game';

const UPGRADE_ICONS: Record<string, string> = {
  upg_att: '💪',
  upg_hp: '❤️',
  upg_regen: '🩹',
  upg_crit: '🎯',
  upg_speed: '⚡',
  upg_wpn: '🗡️',
  upg_arm: '🛡️',
  upg_bts: '🥾'
};

export const UpgradePanel: React.FC = () => {
  const upgrades = useGameStore(state => state.upgrades);
  const gold = useGameStore(state => state.gold);
  const buyUpgrade = useGameStore(state => state.buyUpgrade);

  const statUpgrades = upgrades.filter(u => !['weapon', 'armor', 'boots'].includes(u.type));
  const gearUpgrades = upgrades.filter(u => ['weapon', 'armor', 'boots'].includes(u.type));

  const varColor = (type: string) => {
    switch(type) {
      case 'attack':
      case 'weapon': return 'var(--color-gold)';
      case 'hp':
      case 'armor': return '#93c5fd';
      case 'regen': return 'var(--color-heal)';
      default: return 'var(--color-shard)';
    }
  };

  const renderUpgradeCard = (upgrade: Upgrade) => {
    const icon = UPGRADE_ICONS[upgrade.id] || '⚙️';
    const canBuy = gold >= upgrade.cost;
    const isEquipment = ['weapon', 'armor', 'boots'].includes(upgrade.type);

    return (
      <div 
        key={upgrade.id} 
        className="glass-card" 
        style={{ 
          padding: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden'
        }}
        id={`upgrade-card-${upgrade.id}`}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{upgrade.name}</span>
              <span className="rpg-font" style={{ color: varColor(upgrade.type), fontSize: '0.85rem' }}>
                Lvl {upgrade.currentLevel}
              </span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.25' }}>
              {upgrade.description}
            </p>
          </div>
        </div>

        <button
          className={`rpg-button ${isEquipment ? 'rpg-button-primary' : ''}`}
          onClick={() => buyUpgrade(upgrade.id)}
          disabled={!canBuy}
          style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem', padding: '8px' }}
          id={`buy-upgrade-${upgrade.id}`}
        >
          🪙 {upgrade.cost.toLocaleString()} Золота
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      <div>
        <h3 style={{ fontSize: '1rem', color: '#ffb03a', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
          ⚙️ Характеристики Героя
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {statUpgrades.map(renderUpgradeCard)}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', color: '#ffb03a', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
          ⚒️ Кузница Снаряжения (Влияет на 3D вид)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {gearUpgrades.map(renderUpgradeCard)}
        </div>
      </div>
    </div>
  );
};
