# Moonveil — Colab character studio

A hand-authored, orbitable Three.js pajama-character study based on the supplied illustration. The project runs in the `mcp_colabdev` high-RAM instance; the imported local-VM archive was checksum-verified before refinement.

## Open the work

Live preview: https://lonely-demographic-earlier-comp.trycloudflare.com/

The preview is a temporary Cloudflare tunnel. The single-file `moonveil_gpt6-astra-pro_mcp-colabdev_threejs.html` is self-contained and works offline. The `moonveil_gpt6-astra-pro_mcp-colabdev_threejs.glb` contains the posed character with embedded textures; the ZIP contains the complete source and review evidence.

Project: `/home/dev/project/3d/moonveil_gpt6_astra_pro_mcp_colabdev_web`  
Build: `/build/moonveil_gpt6_astra_pro_mcp_colabdev_web`  
Branch: `gpt6-astra-pro-mcp-colabdev-hands-legs-polish`  
Build hash: `498789d40a9ae64c`

## What changed in Colab

Both legs now use matching 1.400-unit thighs and 1.632-unit shins. The right leg is no longer shortened by lifting its lower geometry; both slippers have the same actual sole height. An optional joint guide displays measured posed landmarks.

Both arms and hands are continuous closed meshes with five individually shaped fingers, tapered fingertips, nails, fine joint creases and clean wrists. The temple gesture and pillow grip were repositioned and reviewed in multiple views. The hair, headband, face proportions, cloth folds, pocket print, cuffs and pillow were also refined.

## Run and verify

```sh
npm ci
npm run build
npm run serve
```

The server binds to `127.0.0.1:4186`. Set `CHROME_PATH` when the browser is not found automatically.

```sh
npm test
node scripts/audit-anatomy.mjs --strict
node scripts/capture-views.mjs iteration-N front portrait raisedhand pillowhand legs side back threequarter
```

The build is checked in headless Chrome before it replaces the live files. `npm test` checks controls, desktop and mobile layouts, touch and keyboard input, actual posed leg lengths, hand topology, the optional joint guide, offline startup, PNG saving and GLB export/reload.

## Current review

51 recorded edit/build/review passes. Subjective visual review: **95/100**. This is not a computed image-similarity score. The originally requested 20,000 passes were not performed or claimed.

Current checks: **46 passed, 0 failed**. The sculpture has 185 named meshes, 379,050 triangles and 27 materials. The tested full front view uses 41 draw calls. Submission timings from software-rendered headless Chrome are not a real-phone frame-rate benchmark.

## Controls and limitations

Drag to orbit; scroll or pinch to zoom. With the viewport focused, arrow keys orbit, +/− zoom, and 0 resets the camera. Detail buttons show each hand and the legs; the joint guide is an inspection overlay and is excluded from the character export.

This is a static posed sculpture, not a skinned avatar or animation rig. Unseen sides are an artistic interpretation. The GLB uses standard materials for portability and may shade differently from the web viewer's toon rendering. The entire character has not been certified as a single watertight 3D-printable object; the closed-mesh audit specifically covers the two continuous arm/hand surfaces.

See `docs/HANDOFF.md`, `docs/migration.json`, `output/validation/report.json`, and `output/validation/anatomy-audit.json` for continuation context and actual evidence.
