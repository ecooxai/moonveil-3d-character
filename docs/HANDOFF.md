# Moonveil — continuation handoff

## Checkpoint status

This is a reviewable reconstruction checkpoint, not completion of the user's 95/100 or 20,000-iteration target. There are **21 recorded edit/render-or-test/review passes** with a **subjective 85/100 likeness estimate**. Rejected regressions are retained in the journal with lower scores. Automated camera checks are not counted as visual iterations.

All **28 browser/geometry/export checks passed**, with zero reported JavaScript exceptions or invalid coordinates. The latest named previews, original render evidence, JSON reports, source code, and build journal are preserved. The source hash of the validated web build is `80987b2667ddd715`.

## Locations and services

Project: `/home/admin/project/3d/moonveil_gpt6_astra_pro_mcp_alagent_web`

Build: `/build/moonveil_gpt6_astra_pro_mcp_alagent_web` (the project's `build` entry is a symlink).

Branch: `gpt6-astra-pro-mcp-alagent-moonveil-refinement-web`

Public preview: `https://amount-wells-omissions-relation.trycloudflare.com/`

The public URL is a temporary cloudflared Quick Tunnel, not a permanent Pages deployment. The task's Node server listens on `127.0.0.1:4186`; `/health` is a read-only health endpoint. Tunnel logs are `output/cloudflared.log`. Do not stop unrelated projects or the active MCP backend. If the task's tunnel is gone, run its `.cache/cloudflared` with `tunnel --url http://127.0.0.1:4186 --no-autoupdate --protocol http2` and read the new URL from its output.

Export basename: `moonveil_gpt6-astra-pro_mcp-alagent_threejs`

The `.html`, `.glb`, and `.zip` artifacts are served from the build root. Important deliverables are also copied into project `output/`. The packaging command retains the archive in `/home/admin/Library/project/moonveil_gpt6_astra_pro_mcp_alagent_web/`; that is a folder on the local VM, **not an upload to ChatGPT's personal Library**. Confirm the checksum and exact retained path in `output/release.json` after packaging.

## Environment recovery

Colab failed to restore the home directory because the `gdrive` OAuth token is expired/revoked (`invalid_grant`). The recovered journal records 20 retries separated by 30 seconds. A fresh Colab start in this continuation failed for the same reason. Do not overwrite backups or edit credentials. The active fallback is the `mcp_alagent` Linux VM, with roughly 1.64 GiB RAM, two logical CPUs, and swap.

Read `lessagent://server/instruction.md` before using the agent. Neither `Agents.md` nor `AGENTS.md` was present in the project or `/home/admin/project/3d` at recovery. Preserve unrelated work.

Node is not on the default command PATH:

```sh
export PATH=/home/admin/.nvm/versions/node/v22.23.2/bin:$PATH
npm run build
npm run serve
```

The existing task server is already running; do not start another on the same port unnecessarily. Dependencies are pinned in `package-lock.json`: Three.js 0.180.0, esbuild 0.25.10, and playwright-core 1.56.1.

## Model and source architecture

The supplied illustration shows long violet hair, an asymmetric forehead curl, a white headband and bow, a charcoal/cyan halo, pale cyan cat-print pajamas, scalloped hems, a raised hand, a held white pillow, and rose-bow slippers. The reference was inspected by vision, not processed by image-analysis code. No generated image or reference billboard is used. The original image remains in the conversation; it is not bundled in the VM archive.

`src/geometry.js` supplies lofts, sweeps, closed curved/beveled contour volumes, outlines, and seam-normal smoothing. `body.js`, `face.js`, `hair.js`, `costume.js`, and `accessories.js` author the named sculpture. `materials.js` and `textures.js` create the toon materials and procedural vector cat/eye/blush textures. `pose.js` applies the shared posture before rendering. `main.js`, `index.html`, and `style.css` implement the studio.

`src/optimize.js` builds a separate material-batched draw tree while preserving the original named sculpture for export. It bakes outline extrusion in the original local coordinates before nonuniform transforms. The original `character.root` remains editable; do not sculpt the derived `character.drawRoot` directly.

The current sculpture has **194 named meshes, 219,934 editable vertices, and 282,572 triangles**. The validated GLB has 203 nodes, 25 materials, three embedded images, no external URIs, and is 8,961,480 bytes. It reloads with the same triangle count and no invalid coordinates. It is static, not rigged or animated. The portable GLB uses PBR materials and omits the web-only outline shells; it is not certified watertight or print-ready.

The draw tree has 30 meshes including its outline batch. The tested front view uses 33 draw calls rather than 276 without changing the sculpture's triangle count. These are draw-call observations, not a claim of measured FPS on real phones. Headless timing uses SwiftShader on this low-memory VM.

## Visual refinement notes

The broad forehead curl and parted cheek lock now use curved, beveled volumes rather than intersecting tubular bangs. Fine surface contours replaced unstable expanded outline shells. The raised elbow/forearm and far ankle were rebuilt after failed contour experiments; their rejected passes remain documented. The shirt is longer and has shallow drape, curved lapels, matching pocket print, and scalloped cuffs. The pillow is wider, filled, and turned behind the legs. The headband and slippers were enlarged, and the overly tall head was compressed with a small relaxed tilt.

`pose.js` handles head, hair, bow/headband, body, and halo differently. The halo is independent of the head tilt. Lower body vertical offsets ramp smoothly so the hem and held pillow do not rise too far. All affected surfaces, seams, and attached details receive the same posture. Normals are recomputed and duplicate-position seam normals smoothed afterward.

The major remaining art work is closer face/eye/fringe likeness, more natural fine hand/finger anatomy, richer but controlled cloth folds, and less uniform rear hair. Unseen side and rear details remain an artistic interpretation of one illustration. Do not inflate the visual score because the engineering checks pass.

## Reproduce validation and record real progress

```sh
export PATH=/home/admin/.nvm/versions/node/v22.23.2/bin:$PATH
npm run build
npm test
node scripts/capture.mjs iteration-22 front
node scripts/capture.mjs iteration-22 portrait
# Inspect the saved renders with the agent's native get_image tool, then:
node scripts/record.mjs 22 SCORE front 'Reviewed title' 'What changed and what the actual review found'
npm run build
python3 scripts/package.py --persist
```

Do not run the example record command until the edit/build and review actually happened. Use an honest score and record regressions. The record helper requires existing screenshot and JSON evidence. The journal refreshes every five seconds; the model itself is not hot-reloaded, so refresh the browser after a new source build.

`scripts/browser.mjs` discovers `CHROME_PATH`, a matching Playwright browser, common installed Chrome locations, or the VM's existing executable at `/home/admin/.cache/ms-playwright/chromium_headless_shell-1193/chrome-linux/headless_shell`. On another machine, set `CHROME_PATH` or run `npx playwright-core install chromium`.

`scripts/validate.mjs` checks geometry, batching, named parts, all five camera presets, wireframe, night mode, actual turntable motion, mouse orbit/zoom, PNG saving, GLB export and reload, 24 camera directions, desktop/mobile overflow and toolbar clearance, offline HTML startup, exceptions, and health. It writes `output/validation/report.json` plus desktop/mobile/offline screenshots. The 24 automated directions are **not** 24 visually reviewed sculpt iterations.

Important regressions already fixed: the standalone build must use callback replacement functions when embedding bundled JavaScript, because `$&` in minified code otherwise corrupts the HTML. Geometric UI checks must render a frame before projecting vertices through the camera; a stale matrix produced a false failure. The turntable check polls actual motion instead of relying on a short fixed delay. The desktop test page is closed before opening the mobile page to reduce VM memory pressure.

The model-only previews are in `output/iterations/iteration-21-{front,portrait,side,back}.png`. Named current copies are in `build/preview/`; each history image referenced by the manifest is retained. Other historical view angles remain in `output/iterations/` but were removed from the published preview directory to avoid clutter. The Files section and latest views precede the long journal. Every displayed artifact carries its real absolute path.

## Git and delivery

Use the existing model/tool-named branch. The checkpoint commits include `fc05c51` (recovered source/evidence) and `54b8229` (sculpted fringe, limbs, drape and pillow). Later rendering/UI/validation work is committed separately. Read `git log` for the final checkpoint identity rather than assuming a build deploys another service.

Git identity is not globally configured. Use a per-command identity when needed:

```sh
git -c user.name='GPT-6 Astra Pro' -c user.email='gpt6-astra-pro@local.invalid' commit -m 'Describe the actual change'
```

The packaging script verifies validation success, ZIP integrity and the retained archive's SHA-256. It does not include node_modules, cached browser binaries, credentials, or unrelated project files. The local Library folder is retained storage on this VM, not an off-machine backup. The temporary tunnel may stop; the self-contained HTML and source archive do not depend on it.

No permanent GitHub Pages or Cloudflare Pages deployment was performed. The available GitHub integration was discovered but not connected; the existing public Quick Tunnel was used. Do not claim a permanent deployment or a ChatGPT Library upload.
