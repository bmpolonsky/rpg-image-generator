
import { GenerationMode } from "../types";

export const STYLES: Record<string, string> = {
  realistic: "High-End Digital Art. Photorealistic 3D render aesthetics. Volumetric lighting, ambient occlusion, deep shadows, high contrast, rich vibrant colors. Sharp 4K textures. Cinematic atmosphere. NOT flat, NOT washed out.",
  oldschool: "Old School Revival (OSR) style. Sepia parchment paper background, black ink line art, hand-drawn aesthetic, cross-hatching shading. Vintage feel.",
  grimdark: "Grimdark Dark Fantasy style. Low saturation, high contrast, gritty textures, deep shadows, dramatic lighting, moody and oppressive atmosphere.",
  blueprint: "Architectural/Technical Blueprint style. High contrast schematic. Clean lines, technical drawing aesthetic. Minimalist details.",
  watercolor: "Artistic Watercolor Painting style. Soft brush strokes, paper texture visible, paint bleeding effects, dreamy and atmospheric, soft edges."
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
