# Moonveil — character atelier

A full-volume, static 3D reconstruction of the user-provided pajama character reference. JavaScript and Three.js generate the sculpture, hand-authored fabric and eye textures, lighting, and interactive studio. The reference was viewed directly; it was not processed into a mesh, traced with image-analysis code, or used as a billboard. No image-generation service was used.

## Open the deliverables

Open `build/moonveil_gpt6-astra-pro_mcp-alagent_threejs.html` in a WebGL-capable browser for the self-contained studio. The character works without a network connection. The live build journal's images are intentionally omitted in single-file offline mode; the source archive includes the preview images separately.

Import `build/moonveil_gpt6-astra-pro_mcp-alagent_threejs.glb` into a glTF 2.0 viewer or 3D editor. It contains 194 named mesh parts, 25 materials, and embedded textures. It is a posed sculpture, not a rigged or animated production character. The web studio's fine outline treatment is not included in the portable PBR GLB.

Drag to orbit, scroll or pinch to zoom, and use Front, ¾, Side, Back, or Portrait presets. The toolbar provides turntable rotation, wireframe, a night backdrop, a viewport PNG, and a front-view reset. Export GLB rebuilds the portable file locally in the browser.

## Build and test

Use Node.js 22 or a compatible modern release:

```sh
npm ci
npm run build
npm run serve
```

The development server listens on `127.0.0.1:4186`. In another terminal:

```sh
npm test
node scripts/capture.mjs iteration-22 front
```

The checks use headless Chrome. Set `CHROME_PATH` to an installed Chrome/Chromium executable, or install the matching browser with `npx playwright-core install chromium`. The existing VM's browser is discovered automatically.

`npm test` validates finite geometry, camera controls, wireframe, turntable, snapshots, GLB export and reload, 24 camera directions, desktop/mobile layout, toolbar clearance, and offline startup. The actual results are in `output/validation/report.json`.

## Source map

`src/geometry.js` provides lofts, sweeps, curved beveled volumes and outline helpers. `body.js`, `face.js`, `hair.js`, `costume.js`, and `accessories.js` author the sculpture. `pose.js` applies the shared posture. `materials.js` and `textures.js` create the toon materials and original vector motifs. `optimize.js` preserves the editable sculpture while making a separate material-batched draw tree. `main.js`, `index.html`, and `style.css` implement the responsive studio.

The optimized front view uses 33 draw calls on the tested configuration, down from 276, without reducing the sculpture's 282,572 triangles. This is not an FPS guarantee for an untested phone or GPU.

## Review status and limitations

This is a refinement checkpoint, not a certified 95/100 or AAA-quality completion. The journal records actual reviewed edit/render or test passes and their subjective scores, including rejected regressions. The requested 20,000 visual iterations have not been completed. The unseen rear and side details are artistic interpretations of one reference, and the face, hair transitions, hands and cloth still have room for more detailed sculpting.

See `docs/HANDOFF.md` for environment recovery, paths, the current branch, and the next refinement work. The reference character's ownership is not changed by this reconstruction.
