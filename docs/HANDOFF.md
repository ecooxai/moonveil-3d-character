# Moonveil continuation handoff — GPT-6 Astra Pro / mcp_colabdev / Three.js

Prepared 2026-10-03T08:33:45.653539+00:00.

## State to recover

- Active project: `/home/dev/project/3d/moonveil_gpt6_astra_pro_mcp_colabdev_web`.
- Build symlink target: `/build/moonveil_gpt6_astra_pro_mcp_colabdev_web`.
- Current source hash: `498789d40a9ae64c`.
- Branch: `gpt6-astra-pro-mcp-colabdev-hands-legs-polish`. The final commit is recorded in `release.json`; the archive also carries a Git bundle for the imported Colab history.
- Preview: https://lonely-demographic-earlier-comp.trycloudflare.com/ (temporary tunnel, not permanent Pages hosting).
- Studio server: port 4186, process ID in `.cache/colab-server.pid`; tunnel process in `.cache/colab-tunnel.pid`.
- 51 real recorded review passes, 95/100 subjective review, 46 current tests passed. No 20,000-iteration or objective 95%-similarity claim.

The initial local archive (`dffd51c` checkpoint) was transferred in the interrupted prior attempt. `docs/migration.json` records SHA-256 `13f7c00b6c01bd9c2849b0dd8cf1aa97b1e2ab0b4073f40329a93281bba3e3e1` and successful verification. Do not overwrite newer Colab edits with that older snapshot.

## Anatomy invariants

`src/anatomy.js` constructs both knees from equal segment lengths: thigh 1.400, shin 1.632 model units. Both ankles are at height 0.165 and both slipper assemblies use base 0.014. `src/proportion-guide.js` measures the already-posed landmarks and actual sole vertices. Preserve these checks; do not reintroduce the old right-leg shortening or raised-heel geometry shortcut.

`src/hand-shapes.js` contains authored finger, palm and arm paths. `scripts/bake-hands.mjs` builds a continuous signed-distance surface, smooths it and simplifies it with a bounded geometric error. `cleanFaces` cancels opposite duplicate faces after simplification; omitting it reintroduces a zero-volume flap and a nonmanifold edge at the left wrist. Both arm/hand meshes currently have one connected component, five authored digits, Euler characteristic 2, and zero open or nonmanifold edges.

`src/hand-meshes.json` contains large encoded numeric arrays. **Do not print or cat it into tool output.** Read it programmatically and print only summaries. It is a build cache, not an image billboard. `src/hands.js` reconstructs the meshes and adds restrained nail and crease details.

`src/pose.js` applies a shared posture to contacting surfaces. Legs are exempt from the upper-body deformation. The current head mapping restores the earlier over-compressed face: `headShift(y) = .10 - .014 * (y - 5.20)`.

## Visual and viewer structure

`face.js`, `hair.js`, `costume.js`, `accessories.js`, `materials.js` and `textures.js` are hand-authored geometric and material definitions. The original illustration was inspected visually; no automated image analysis or image-to-mesh inference was used.

The scalp, bangs and rear locks are real volumes. The temple ribbon has a continuous root-to-tip contour. The cloth uses controlled fold displacement and coherent fabric-scale UVs; the breast pocket shares shirt coordinates. Skin has restrained cel steps while cotton remains bright. The pillow is a closed filled surface with tension folds and a sewn edge.

`optimize.js` keeps the original named sculpture and creates a separate material-batched draw tree. Exports use the original named meshes. Avoid changing one geometry's attribute layout without accounting for material batching.

The studio polls its manifest and reloads a new verified build while preserving the camera. Icons are embedded SVGs, not font glyphs. Detail buttons scroll back to the viewport; mobile regression tests verify actual viewport visibility rather than merely testing offscreen controls. Keyboard shortcuts and emulated touch are covered.

## Safe next edit loop

Read current Git status and preserve unrelated work. Use the connected Colab runtime and project above. No `Agents.md` or `AGENTS.md` existed in the checked project roots. Headless Chrome is selected through `scripts/browser.mjs`; `/home/dev/.local/bin/chromium` works in this runtime.

1. Edit the relevant source; build with `npm run build`.
2. Capture named views with `scripts/capture-views.mjs`; inspect them with `mcp_colabdev.get_image`.
3. Record only actual reviewed passes using `scripts/record.mjs N SCORE VIEW TITLE NOTE`. Never fabricate iterations or similarity scores.
4. Run `npm test` and `node scripts/audit-anatomy.mjs --strict`.
5. Run `python3 scripts/prepare-release.py`, rebuild the manifest/standalone HTML, commit, create the Git bundle, and run `python3 scripts/package.py --persist`.
6. Request `mcp_colabdev.colab` with `cmd: backup`; verify completion using `details backup`. Stopping does not back up.

Webterm output is truncated by default. Use `webterm read ID --full` instead of rerunning commands. Completed command shells can still occupy the 32-session runtime limit: stop only completed task terminals. Never stop the preview services or the MCP backend indiscriminately.

## Recovery and persistence

The current source and release ZIP are under `/home/dev`. The build target is under `/build`, which may not survive a home-only restore. The ZIP includes the complete built site. After a restore, create the build target, then restore the ZIP's `build/` members into the project or rebuild and restore the previews from the ZIP. Keep the project build symlink pointing to the target above when using this Colab layout. A separately extracted ZIP has a normal portable `build/` directory.

The retained archive path is `/home/dev/Library/project/moonveil_gpt6_astra_pro_mcp_colabdev_web/moonveil_gpt6-astra-pro_mcp-colabdev_threejs.zip`. This is a runtime folder, not a ChatGPT Library upload. Successful cloud persistence must be verified through the Colab backup result, not inferred from the existence of that folder.

## Remaining limitations

The visual score is an estimate, not an independent image-similarity measurement or an AAA production certificate. Static pose only: no skeleton, animation clips, facial rig or game LOD chain. The portable GLB converts toon materials to standard materials, so use the offline HTML for the original illustration-style shading. No physical-phone GPU FPS was measured. Unseen angles are interpreted from a single reference; the web model is not an exact reproduction of every detail in the illustration.
