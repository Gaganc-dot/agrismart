import { useState, useRef, useEffect } from "react";
import { Globe, Check, Search } from "lucide-react";

export const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English',  abbr: 'A',  color: '#3b82f6', bg: '#eff6ff' },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी',   abbr: 'अ',  color: '#f97316', bg: '#fff7ed' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी',    abbr: 'म',  color: '#a855f7', bg: '#faf5ff' },
];

/**
 * Premium language selector dropdown.
 *
 * Props:
 *   value       – current language code (e.g. 'en')
 *   onChange    – (code: string) => void
 *   dark        – use white-on-dark trigger style (for sidebar)
 *   align       – 'left' | 'right'  — which side of trigger to anchor the panel
 *   dropUp      – open panel above the trigger instead of below
 *   fullWidth   – trigger button fills container width
 */
export default function LanguageSelector({
  value = 'en',
  onChange,
  dark = false,
  align = 'right',
  dropUp = false,
  fullWidth = false,
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref                 = useRef(null);

  const current  = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];
  const filtered = search
    ? LANGUAGES.filter(l =>
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.native.includes(search)
      )
    : LANGUAGES;

  /* close on outside click */
  useEffect(() => {
    const down = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  const handleSelect = (code) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  /* ── Trigger button ── */
  const triggerBase = `flex items-center gap-2 rounded-xl transition-all duration-150 select-none ${fullWidth ? 'w-full' : ''}`;
  const triggerStyle = dark
    ? `${triggerBase} bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2.5`
    : `${triggerBase} bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-2`;

  /* ── Dropdown panel position ── */
  const panelPos = [
    dropUp  ? 'bottom-full mb-2' : 'top-full mt-2',
    align === 'left' ? 'left-0' : 'right-0',
  ].join(' ');

  return (
    <>
      {/* inject keyframe once */}
      <style>{`
        @keyframes langIn {
          from { opacity:0; transform:scale(.94) translateY(${dropUp ? '6px' : '-6px'}); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
        .lang-panel { animation: langIn .17s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div className="relative" ref={ref}>

        {/* ── Trigger ── */}
        <button onClick={() => setOpen(o => !o)} className={triggerStyle}>
          {/* colored script badge */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
            style={{ backgroundColor: current.color, fontSize: '11px' }}
          >
            {current.abbr}
          </div>

          <span className={`text-sm font-bold leading-none ${dark ? 'text-white' : 'text-gray-700'} flex-1 text-left`}>
            {current.native}
          </span>

          {/* chevron */}
          <svg
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${dark ? 'text-white/60' : 'text-gray-400'} ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* ── Dropdown panel ── */}
        {open && (
          <div
            className={`lang-panel absolute ${panelPos} w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[300]`}
          >
            {/* panel header */}
            <div className="px-3 pt-3 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Globe className="w-3.5 h-3.5 text-primary-600" />
                <p className="text-xs font-bold text-gray-800">Select Language</p>
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
                  {LANGUAGES.length} languages
                </span>
              </div>
              {/* search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs font-medium text-gray-700 placeholder-gray-400 outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* language grid */}
            <div className="p-2 grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="col-span-2 text-center py-4 text-xs text-gray-400">No languages found</p>
              ) : filtered.map(l => {
                const active = l.code === value;
                return (
                  <button
                    key={l.code}
                    onClick={() => handleSelect(l.code)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all duration-150 relative ${
                      active ? 'ring-1' : 'hover:bg-gray-50'
                    }`}
                    style={active ? { backgroundColor: l.bg, outlineColor: l.color } : {}}
                  >
                    {/* script badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: l.color, fontSize: '11px' }}
                    >
                      {l.abbr}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate leading-tight">{l.native}</p>
                      <p className="text-[9px] text-gray-400 truncate">{l.label}</p>
                    </div>

                    {active && (
                      <div
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: l.color }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* footer */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-md flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: current.color, fontSize: '8px' }}
              >
                {current.abbr}
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                Currently: <span className="font-bold text-gray-700">{current.native}</span>
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
