declare module 'canvas-sketch-util/color' {
  interface ColorObject {
    rgb: [number, number, number];
    hsl: [number, number, number];
    hex: string;
  }

  function parse(color: string): ColorObject;
  function rgbToHsl(rgb: [number, number, number]): [number, number, number];
  function hslToRgb(hsl: [number, number, number]): [number, number, number];
  function contrastRatio(inputA: string | ColorObject | [number, number, number], inputB: string | ColorObject | [number, number, number]): number;
  function relativeLuminance(input: string | ColorObject | [number, number, number]): number;
  function offsetHSL(color: string, h?: number, s?: number, l?: number): ColorObject;

  const Color: {
    parse: typeof parse;
    rgbToHsl: typeof rgbToHsl;
    hslToRgb: typeof hslToRgb;
    contrastRatio: typeof contrastRatio;
    relativeLuminance: typeof relativeLuminance;
    offsetHSL: typeof offsetHSL;
  };

  export = Color;
} 