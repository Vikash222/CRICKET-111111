import React, { useState } from 'react';
import { Globe2, X, Check } from 'lucide-react';
import { Language, languageNames, useLanguage } from '../i18n';

interface Props { onClose: () => void; }

export const LanguageSettingsModal: React.FC<Props> = ({ onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<Language>(language);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await setLanguage(selected);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl p-5 text-slate-900">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold">{t('settings')}</h2>
              <p className="text-xs text-slate-500">{t('accountLanguage')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2">
          {(Object.keys(languageNames) as Language[]).map((item) => (
            <button key={item} onClick={() => setSelected(item)} className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${selected === item ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <span className="font-medium">{languageNames[item]}</span>
              {selected === item && <Check className="w-4 h-4 text-emerald-600" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm">{t('cancel')}</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm disabled:opacity-60">{saving ? '...' : t('save')}</button>
        </div>
      </div>
    </div>
  );
};
