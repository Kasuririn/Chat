import { UserProfile } from '../types';

export interface ThemeStyles {
  appBg: string;
  sidebarBg: string;
  chatBg: string;
  cardBg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  accentHover: string;
  bubbleSelf: string;
  bubblePeer: string;
  inputBg: string;
}

export function getThemeStyles(theme: UserProfile['theme']): ThemeStyles {
  switch (theme) {
    case 'emerald-stealth':
      return {
        appBg: 'bg-[#06110c]',
        sidebarBg: 'bg-[#081811]',
        chatBg: 'bg-[#040c08]',
        cardBg: 'bg-[#0d2218]',
        border: 'border-emerald-900/40',
        textPrimary: 'text-emerald-50',
        textSecondary: 'text-emerald-400/70',
        accent: 'bg-emerald-500',
        accentText: 'text-emerald-400',
        accentHover: 'hover:bg-emerald-400',
        bubbleSelf: 'bg-emerald-600 text-white',
        bubblePeer: 'bg-[#0e271c] text-emerald-100 border border-emerald-800/40',
        inputBg: 'bg-[#091b13]',
      };
    case 'midnight-violet':
      return {
        appBg: 'bg-[#0a0717]',
        sidebarBg: 'bg-[#0f0c24]',
        chatBg: 'bg-[#080513]',
        cardBg: 'bg-[#161233]',
        border: 'border-violet-900/40',
        textPrimary: 'text-violet-50',
        textSecondary: 'text-violet-300/70',
        accent: 'bg-violet-600',
        accentText: 'text-violet-400',
        accentHover: 'hover:bg-violet-500',
        bubbleSelf: 'bg-violet-600 text-white',
        bubblePeer: 'bg-[#18133b] text-violet-100 border border-violet-800/40',
        inputBg: 'bg-[#120e2a]',
      };
    case 'amber-terminal':
      return {
        appBg: 'bg-[#0d0c0a]',
        sidebarBg: 'bg-[#14120f]',
        chatBg: 'bg-[#080705]',
        cardBg: 'bg-[#1d1a15]',
        border: 'border-amber-900/40',
        textPrimary: 'text-amber-100',
        textSecondary: 'text-amber-400/70',
        accent: 'bg-amber-500',
        accentText: 'text-amber-400',
        accentHover: 'hover:bg-amber-400',
        bubbleSelf: 'bg-amber-600 text-black font-medium',
        bubblePeer: 'bg-[#1a1712] text-amber-100 border border-amber-800/40',
        inputBg: 'bg-[#13110d]',
      };
    case 'clean-light':
      return {
        appBg: 'bg-slate-100',
        sidebarBg: 'bg-white',
        chatBg: 'bg-slate-50',
        cardBg: 'bg-white',
        border: 'border-slate-200',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-500',
        accent: 'bg-blue-600',
        accentText: 'text-blue-600',
        accentHover: 'hover:bg-blue-700',
        bubbleSelf: 'bg-blue-600 text-white',
        bubblePeer: 'bg-white text-slate-800 border border-slate-200 shadow-xs',
        inputBg: 'bg-white',
      };
    case 'cyber-dark':
    default:
      return {
        appBg: 'bg-neutral-950',
        sidebarBg: 'bg-neutral-900',
        chatBg: 'bg-[#0a0a0a]',
        cardBg: 'bg-neutral-800/60',
        border: 'border-neutral-800',
        textPrimary: 'text-neutral-100',
        textSecondary: 'text-neutral-400',
        accent: 'bg-emerald-500',
        accentText: 'text-emerald-400',
        accentHover: 'hover:bg-emerald-400',
        bubbleSelf: 'bg-emerald-600 text-white',
        bubblePeer: 'bg-neutral-800/90 text-neutral-100 border border-neutral-700/50',
        inputBg: 'bg-neutral-900',
      };
  }
}
