import React from 'react';
import { Settings as SettingsType } from '../lib/types';
import { Save, Download, Upload, Moon, Sun, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export default function Settings({ settings, onSave, onExportData, onImportData }: SettingsProps) {
  const handleChange = (key: keyof SettingsType, value: any) => {
    const updated = { ...settings, [key]: value };
    onSave(updated);
    
    // Apply theme toggle on document html tag
    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.8rem' }}>Settings & Configurations</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tailor active recall, strictness gating, and backup options to your study habits.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* LEARNING PARAMETERS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Adaptive Engine Preferences
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Questions per Learning Batch</label>
              <select 
                className="input" 
                value={settings.questionsPerBatch} 
                onChange={(e) => handleChange('questionsPerBatch', parseInt(e.target.value, 10))}
                style={{ marginTop: '0.25rem' }}
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Mastery Strictness Threshold</label>
              <select 
                className="input" 
                value={settings.masteryStrictness} 
                onChange={(e) => handleChange('masteryStrictness', e.target.value)}
                style={{ marginTop: '0.25rem' }}
              >
                <option value="relaxed">Relaxed (Requires 1 correct recall)</option>
                <option value="normal">Normal (Requires 2 correct recall answers)</option>
                <option value="strict">Strict (Requires 3 correct recall answers)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Daily New Target</label>
              <input 
                type="number" 
                className="input" 
                value={settings.dailyNewTarget}
                onChange={(e) => handleChange('dailyNewTarget', parseInt(e.target.value, 10))}
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Daily Review Target</label>
              <input 
                type="number" 
                className="input" 
                value={settings.dailyReviewTarget}
                onChange={(e) => handleChange('dailyReviewTarget', parseInt(e.target.value, 10))}
                style={{ marginTop: '0.25rem' }}
              />
            </div>
          </div>
        </div>

        {/* UI PREFERENCES */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Interface Preferences
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between">
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Dark Theme Mode</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle dark display for low-light studies.</div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleChange('darkMode', !settings.darkMode)}
                style={{ padding: '0.5rem' }}
              >
                {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Ask for Confidence Rating</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Show options: "Guessed", "Not sure", or "Confident" after grading.</div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleChange('showConfidence', !settings.showConfidence)}
                style={{ padding: '0.4rem 0.8rem' }}
              >
                {settings.showConfidence ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Options Shuffling</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Randomize options layout inside multiple/single choices.</div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleChange('shuffleOptions', !settings.shuffleOptions)}
                style={{ padding: '0.4rem 0.8rem' }}
              >
                {settings.shuffleOptions ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Keyboard Shortcuts</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enable [1-4] keys for option selections, [Enter] key for continue.</div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleChange('keyboardShortcuts', !settings.keyboardShortcuts)}
                style={{ padding: '0.4rem 0.8rem' }}
              >
                {settings.keyboardShortcuts ? 'Active' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* DATABASE EXPORTS & BACKUPS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Data Import & Backup Exports
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            All your question banks and active recall history are stored securely in your browser. Download a local backup JSON to safeguard your database progress.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={onExportData} style={{ flex: 1 }}>
              <Download size={16} /> Export Backup JSON
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => document.getElementById('db-import-input')?.click()} 
              style={{ flex: 1 }}
            >
              <Upload size={16} /> Import Backup JSON
            </button>
            <input 
              type="file" 
              id="db-import-input" 
              accept=".json" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
