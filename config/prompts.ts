import { GenerationMode } from "../types";

export const STYLES: Record<string, string> = {
  realistic: "High-End Digital Art. Photorealistic 3D render aesthetics. Volumetric lighting, ambient occlusion, deep shadows, high contrast, rich vibrant colors. Sharp 4K textures. Cinematic atmosphere. NOT flat, NOT washed out.",
  oldschool: "Old School Revival (OSR) style. Sepia parchment paper background, black ink line art, hand-drawn aesthetic, cross-hatching shading. Vintage feel.",
  grimdark: "Grimdark Dark Fantasy style. Low saturation, high contrast, gritty textures, deep shadows, dramatic lighting, moody and oppressive atmosphere.",
  blueprint: "Architectural/Technical Blueprint style. High contrast schematic. Clean lines, technical drawing aesthetic. Minimalist details.",
  watercolor: "Artistic Watercolor Painting style. Soft brush strokes, paper texture visible, paint bleeding effects, dreamy and atmospheric, soft edges.",
  oilpainting: "Classic 1980s Fantasy Oil Painting. Thick visible brushstrokes, rich texture, dramatic lighting. Frank Frazetta or Boris Vallejo aesthetic. Epic, heroic, muscle definition, dynamic poses, golden age of fantasy illustration.",
  comic: "American Comic Book / Graphic Novel style. Bold black ink outlines, heavy shadows, high contrast. Cel-shaded coloring with halftone patterns. Dynamic composition, expressive lines. Vibrant colors but gritty atmosphere.",
  anime: "High-Quality Modern Anime style. Clean thin lines, flat distinct colors with soft cel-shading. Detailed eyes and expressions. Cinematic lighting reminiscent of Studio Ghibli or Makoto Shinkai. Lush backgrounds.",
  pixelart: "16-bit Pixel Art aesthetic. Retro video game graphics. Distinct blocky pixels, limited color palette, dithering shading. Isometric view for maps, side view for characters. SNES era RPG style.",
  cyberpunk: "Cyberpunk / Synthwave aesthetic. Neon lights (pink, cyan, purple), dark rainy atmosphere, glossy reflections. High tech details, chrome surfaces, futuristic urban environment. Glitch effects.",
  modern: "Modern High-Fantasy RPG Art style (5th Edition compatible). Digital painting, highly detailed, dynamic lighting, magic effects, polished finish. Resembles official rulebook cover art or Magic: The Gathering card art. Heroic proportions.",
  gothic: "Gothic Dark Fantasy Art style. Heavy black ink shadows, rough hand-drawn thick lines, muted desaturated colors. Stressful, gritty, Lovecraftian atmosphere. Angular character designs, harsh lighting. Mike Mignola meets medieval woodcuts.",
  isometric: "Classic Isometric CRPG Pre-rendered Background style. 2.5D perspective, rich detailed textures, pre-baked lighting. Infinity Engine (Baldur's Gate, Icewind Dale) aesthetic. Nostalgic, detailed environments.",
  sketch: "Hand-drawn Graphite Pencil Sketch on textured paper. loose lines, shading with hatching, rough concept art feel. Monochrome (graphite gray). Looks like an adventurer's field journal entry.",
  noir: "Film Noir / Sin City aesthetic. High contrast black and white with occasional splashes of color (red/blue). Deep shadows, dramatic lighting, rain-slicked streets, moody atmosphere. Comic book ink style.",
  claymation: "Stop-motion Claymation / Aardman Animation style. Physical textures (fingerprints on clay), soft studio lighting, rounded shapes, depth of field looking like a miniature set. Whimsical and tactile.",
};

export const MODE_CONFIG = {
  [GenerationMode.BATTLEMAP]: {
    role: "Expert Battlemap Designer for Tabletop RPGs.",
    viewpoint: "STRICTLY ORTHOGRAPHIC TOP-DOWN (90-degree bird's eye view). Flat projection. NO isometric, NO perspective slant.",
    sketchInterpretation: "The sketch is a schematic layout guide (walls/obstacles).",
    negative: "Do NOT describe horizons, skies, vertical sides of walls, or isometric angles.",
    focus: "Focus on floor textures, ground details, and obstacles seen from above."
  },
  [GenerationMode.LOCATION]: {
    role: "Concept Artist and Environment Designer for Fantasy RPGs.",
    viewpoint: "Cinematic Perspective. Rule of thirds. Eye-level or establishing shot. Depth of field.",
    sketchInterpretation: "The sketch is a composition guide. Lines indicate horizon, main structures, or foreground elements.",
    negative: "Do NOT make it a top-down map.",
    focus: "Focus on atmosphere, lighting, scale, background details, and mood."
  },
  [GenerationMode.CHARACTER]: {
    role: "Senior Character Concept Artist for RPGs.",
    viewpoint: "Character Portrait or Full Body Pose. Focus on anatomy and design.",
    sketchInterpretation: "The sketch is a POSE REFERENCE (stick figure or silhouette). The lines represent the character's limbs and posture.",
    negative: "Do NOT draw a map or a building. Do NOT leave the stick figure visible.",
    focus: "Focus on face details, clothing, armor texture, dynamic lighting on the figure."
  }
};