import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'zu' | 'af';
  setLanguage: (lang: 'en' | 'zu' | 'af') => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLanguage, setLanguage }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-900 rounded-full border border-slate-700 px-2 py-1">
      <Globe className="w-3.5 h-3.5 text-slate-400" />
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'zu' | 'af')}
        className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
      >
        <option value="en">EN</option>
        <option value="zu">ZU</option>
        <option value="af">AF</option>
      </select>
    </div>
  );
};
