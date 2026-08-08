import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

export type Language = 'english' | 'hindi' | 'punjabi';

const dictionaries = {
  english: {
    home: 'Home', live: 'Live', tournaments: 'Tournaments', rankings: 'Rankings', profile: 'Profile',
    admin: 'Admin', rooms: 'Rooms', team: 'Team', scorer: 'Scorer', match: 'Match',
    settings: 'Settings', language: 'Language', save: 'Save', cancel: 'Cancel', share: 'Share',
    liveMatches: 'Live Matches', viewAll: 'View All', createRoom: 'Create Match Room',
    player: 'Player', captain: 'Captain', umpire: 'Umpire', organizer: 'Organizer', superAdmin: 'Super Admin',
    logout: 'Logout', search: 'Search', online: 'Online', publicMatch: 'Public Match',
    accountLanguage: 'Choose your app language', languageSaved: 'Language updated',
  },
  hindi: {
    home: 'होम', live: 'लाइव', tournaments: 'टूर्नामेंट', rankings: 'रैंकिंग', profile: 'प्रोफ़ाइल',
    admin: 'एडमिन', rooms: 'रूम', team: 'टीम', scorer: 'स्कोरर', match: 'मैच',
    settings: 'सेटिंग्स', language: 'भाषा', save: 'सेव', cancel: 'रद्द', share: 'शेयर',
    liveMatches: 'लाइव मैच', viewAll: 'सभी देखें', createRoom: 'मैच रूम बनाएं',
    player: 'खिलाड़ी', captain: 'कप्तान', umpire: 'अंपायर', organizer: 'ऑर्गनाइज़र', superAdmin: 'सुपर एडमिन',
    logout: 'लॉग आउट', search: 'खोजें', online: 'ऑनलाइन', publicMatch: 'पब्लिक मैच',
    accountLanguage: 'ऐप की भाषा चुनें', languageSaved: 'भाषा अपडेट हो गई',
  },
  punjabi: {
    home: 'ਹੋਮ', live: 'ਲਾਈਵ', tournaments: 'ਟੂਰਨਾਮੈਂਟ', rankings: 'ਰੈਂਕਿੰਗ', profile: 'ਪ੍ਰੋਫ਼ਾਈਲ',
    admin: 'ਐਡਮਿਨ', rooms: 'ਰੂਮ', team: 'ਟੀਮ', scorer: 'ਸਕੋਰਰ', match: 'ਮੈਚ',
    settings: 'ਸੈਟਿੰਗਾਂ', language: 'ਭਾਸ਼ਾ', save: 'ਸੇਵ', cancel: 'ਰੱਦ', share: 'ਸ਼ੇਅਰ',
    liveMatches: 'ਲਾਈਵ ਮੈਚ', viewAll: 'ਸਭ ਵੇਖੋ', createRoom: 'ਮੈਚ ਰੂਮ ਬਣਾਓ',
    player: 'ਖਿਡਾਰੀ', captain: 'ਕਪਤਾਨ', umpire: 'ਅੰਪਾਇਰ', organizer: 'ਆਰਗੇਨਾਈਜ਼ਰ', superAdmin: 'ਸੁਪਰ ਐਡਮਿਨ',
    logout: 'ਲੌਗ ਆਊਟ', search: 'ਖੋਜ', online: 'ਆਨਲਾਈਨ', publicMatch: 'ਪਬਲਿਕ ਮੈਚ',
    accountLanguage: 'ਐਪ ਦੀ ਭਾਸ਼ਾ ਚੁਣੋ', languageSaved: 'ਭਾਸ਼ਾ ਅਪਡੇਟ ਹੋ ਗਈ',
  },
} as const;

type TranslationKey = keyof typeof dictionaries.english;
interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ initialLanguage?: Language; children: React.ReactNode }> = ({ initialLanguage = 'english', children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('ccl-language') as Language | null;
    return stored && stored in dictionaries ? stored : initialLanguage;
  });

  useEffect(() => {
    if (initialLanguage && !localStorage.getItem('ccl-language')) setLanguageState(initialLanguage);
  }, [initialLanguage]);

  const setLanguage = async (next: Language) => {
    setLanguageState(next);
    localStorage.setItem('ccl-language', next);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ language: next }).eq('id', user.id);
  };

  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => dictionaries[language][key] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};

export const languageNames: Record<Language, string> = {
  english: 'English',
  hindi: 'हिन्दी',
  punjabi: 'ਪੰਜਾਬੀ',
};
