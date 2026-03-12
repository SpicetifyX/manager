import React, { useMemo, useState, useEffect, useRef } from 'react';

// --- Color Conversion Math ---

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function oklabToRgb(l: number, a: number, b: number): [number, number, number] {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  const r = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

  const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

  return [gamma(r), gamma(g), gamma(bl)];
}

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const h_rad = (h * Math.PI) / 180;
  const a = c * Math.cos(h_rad);
  const b = c * Math.sin(h_rad);
  return oklabToRgb(l, a, b);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => {
    const val = Math.round(clamp(x, 0, 1) * 255);
    return val.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const invGamma = (x: number) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const lr = invGamma(r);
  const lg = invGamma(g);
  const lb = invGamma(b);

  const L = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const M = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073970566 * lb;
  const S = 0.0883024641 * lr + 0.2817188376 * lg + 0.6299787033 * lb;

  const l_ = Math.cbrt(L);
  const m_ = Math.cbrt(M);
  const s_ = Math.cbrt(S);

  const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bl = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  return [l, a, bl];
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const [l, a, bl] = rgbToOklab(r, g, b);
  const c = Math.sqrt(a * a + bl * bl);
  let h = (Math.atan2(bl, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [l, c, h];
}

function isInGamut(l: number, c: number, h: number): boolean {
  const [r, g, b] = oklchToRgb(l, c, h);
  const eps = 0.0001;
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
}

function getMaxChroma(l: number, h: number): number {
  let min = 0;
  let max = 0.4;
  for (let i = 0; i < 15; i++) {
    const mid = (min + max) / 2;
    if (isInGamut(l, mid, h)) {
      min = mid;
    } else {
      max = mid;
    }
  }
  return min;
}

// --- Components ---

interface SliderProps {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  gradient: string;
  graphData?: string;
}

const DiamondSlider: React.FC<SliderProps> = ({ label, symbol, value, min, max, step, onChange, gradient, graphData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newVal = clamp(min + pos * (max - min), min, max);
    onChange(Number(newVal.toFixed(3)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    handleMouseMove(e);
    const onMove = (me: MouseEvent) => handleMouseMove(me);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-wider text-[#a0a0a0]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-input text-[10px] font-bold text-text-input-symbol">{symbol}</span>
          <input
            type="number"
            value={value}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 rounded bg-input px-2 py-1 text-right font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d63c6a]"
          />
        </div>
      </div>

      <div className="relative h-24 w-full overflow-hidden">
        {graphData && (
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d={graphData} fill="#d63c6a" fillOpacity="0.15" />
             <path d={graphData} fill="none" stroke="#d63c6a" strokeWidth="0.5" strokeOpacity="0.5" />
          </svg>
        )}
        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          className="absolute bottom-0 h-8 w-full cursor-pointer rounded-lg"
          style={{ background: gradient }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${percentage}%` }}
          >
            <div className="h-6 w-6 rotate-45 border-2 border-white bg-transparent shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OklchPicker({ hex, onChange }: { hex: string; onChange: (hex: string) => void }) {
  const [[l, c, h], setLch] = useState<[number, number, number]>(() => {
    const [r, g, b] = hexToRgb(hex);
    return rgbToOklch(r, g, b);
  });

  useEffect(() => {
    const [r, g, b] = hexToRgb(hex);
    const [nl, nc, nh] = rgbToOklch(r, g, b);
    const currentHex = rgbToHex(...oklchToRgb(l, c, h)).toLowerCase();
    if (currentHex !== hex.toLowerCase()) {
      setLch([nl, nc, nh]);
    }
  }, [hex]);

  const currentColor = useMemo(() => {
    const [r, g, b] = oklchToRgb(l, c, h);
    return rgbToHex(r, g, b);
  }, [l, c, h]);

  const updateLch = (nl: number, nc: number, nh: number) => {
    setLch([nl, nc, nh]);
    const [r, g, b] = oklchToRgb(nl, nc, nh);
    onChange(rgbToHex(r, g, b));
  };

  // --- Graph Generators ---

  const lightnessGraph = useMemo(() => {
    let d = "M 0 100";
    for (let x = 0; x <= 100; x += 1) {
      const curL = x / 100;
      const maxC = getMaxChroma(curL, h);
      const y = 100 - (maxC / 0.4) * 100;
      d += ` L ${x} ${y}`;
    }
    d += " L 100 100 Z";
    return d;
  }, [h]);

  const chromaGraph = useMemo(() => {
    let d = "M 0 100";
    for (let x = 0; x <= 100; x += 1) {
      const curH = (x / 100) * 360;
      const maxC = getMaxChroma(l, curH);
      const y = 100 - (maxC / 0.4) * 100;
      d += ` L ${x} ${y}`;
    }
    d += " L 100 100 Z";
    return d;
  }, [l]);

  const hueGraph = useMemo(() => {
     let d = "M 0 100";
     const pointsTop: string[] = [];
     const pointsBottom: string[] = [];

     for (let x = 0; x <= 100; x += 1) {
        const curH = (x / 100) * 360;
        let minL = -1, maxL = -1;
        // Search for L bounds
        for(let tl = 0; tl <= 1; tl += 0.01) {
            if(isInGamut(tl, c, curH)) {
                if(minL === -1) minL = tl;
                maxL = tl;
            }
        }
        if(minL !== -1) {
            pointsTop.push(`${x} ${100 - maxL * 100}`);
            pointsBottom.push(`${x} ${100 - minL * 100}`);
        } else {
            pointsTop.push(`${x} 100`);
            pointsBottom.push(`${x} 100`);
        }
     }
     d = `M ${pointsTop[0]} ` + pointsTop.slice(1).map(p => `L ${p}`).join(' ') + 
         ' ' + pointsBottom.reverse().map(p => `L ${p}`).join(' ') + ' Z';
     return d;
  }, [c]);

  // --- Gradients ---

  const lightnessGradient = useMemo(() => {
    const steps = 20;
    const colors = [];
    for (let i = 0; i <= steps; i++) {
      const curL = i / steps;
      colors.push(rgbToHex(...oklchToRgb(curL, c, h)));
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [c, h]);

  const chromaGradient = useMemo(() => {
    const steps = 20;
    const colors = [];
    for (let i = 0; i <= steps; i++) {
      const curC = (i / steps) * 0.4;
      colors.push(rgbToHex(...oklchToRgb(l, curC, h)));
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [l, h]);

  const hueGradient = useMemo(() => {
    const steps = 36;
    const colors = [];
    for (let i = 0; i <= steps; i++) {
      const curH = (i / steps) * 360;
      colors.push(rgbToHex(...oklchToRgb(l, c, curH)));
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [l, c]);

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {/* Left Column: Preview */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-1 flex-col rounded-xl bg-card p-3 shadow-md">
          <div
            className="h-32 w-full rounded-lg shadow-inner border border-white/5"
            style={{ backgroundColor: currentColor }}
          />
          <div className="mt-2 text-center text-[8px] font-bold leading-relaxed tracking-widest text-text-input-label uppercase">
             Color Preview
          </div>
        </div>
      </div>

      {/* Right Column: Sliders and Inputs */}
      <div className="grid grid-cols-1 gap-2">
        <DiamondSlider
          label="Lightness"
          symbol="L"
          value={l}
          min={0}
          max={1}
          step={0.001}
          onChange={(val) => updateLch(val, c, h)}
          gradient={lightnessGradient}
          graphData={lightnessGraph}
        />
        <DiamondSlider
          label="Chroma"
          symbol="C"
          value={c}
          min={0}
          max={0.4}
          step={0.001}
          onChange={(val) => updateLch(l, val, h)}
          gradient={chromaGradient}
          graphData={chromaGraph}
        />
         <DiamondSlider
          label="Hue"
          symbol="H"
          value={h}
          min={0}
          max={360}
          step={0.1}
          onChange={(val) => updateLch(l, c, val)}
          gradient={hueGradient}
          graphData={hueGraph}
        />

        <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="group relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-text-input-symbol">O</span>
              <input
                type="text"
                readOnly
                value={`oklch(${l.toFixed(2)} ${c.toFixed(2)} ${Math.round(h)})`}
                className="w-full rounded-md bg-card py-2 pl-7 pr-2 font-mono text-[9px] text-white focus:outline-none transition-all group-hover:bg-input shadow-sm border border-transparent"
              />
            </div>
            
            <div className="group relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-text-input-symbol">R</span>
              <input
                type="text"
                value={hex.toUpperCase()}
                onChange={(e) => {
                    const val = e.target.value;
                    if(/^#?([0-9A-F]{3}){1,2}$/i.test(val)) {
                        onChange(val.startsWith('#') ? val : `#${val}`);
                    }
                }}
                className="w-full rounded-md bg-card py-2 pl-7 pr-2 font-mono text-[9px] text-white focus:outline-none transition-all group-hover:bg-input focus:ring-1 focus:ring-[#d63c6a] shadow-sm border border-transparent"
              />
            </div>
        </div>
      </div>
    </div>
  );
}
