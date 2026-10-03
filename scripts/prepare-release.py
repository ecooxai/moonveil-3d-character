#!/usr/bin/env python3
"""Prepare documented, verified artifacts without changing the character source."""
from pathlib import Path
from datetime import datetime, timezone
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent.parent
BUILD = (ROOT / 'build').resolve()
BASE = 'moonveil_gpt6-astra-pro_mcp-colabdev_threejs'
manifest_path = ROOT / 'docs/manifest.json'
manifest = json.loads(manifest_path.read_text())
report = json.loads((ROOT / 'output/validation/report.json').read_text())
smoke = json.loads((ROOT / 'output/validation/build-smoke.json').read_text())
anatomy = json.loads((ROOT / 'output/validation/anatomy-audit.json').read_text())
if report['failed'] or not anatomy['passed'] or report['stats']['buildHash'] != smoke['sourceHash']:
    raise SystemExit('A current passing validation and anatomy audit are required.')
last = manifest['iterations'][-1]['iteration']
views = [('front', 'Full character'), ('raisedhand', 'Right hand / temple gesture'),
         ('pillowhand', 'Left hand / pillow grip'), ('legs', 'Matched legs and grounded slippers'),
         ('portrait', 'Portrait / face, bow and halo'), ('threequarter', 'Three-quarter volume'),
         ('side', 'Side profile'), ('back', 'Back / flowing hair and pillow')]
latest = []
for view, label in views:
    src = ROOT / f'output/iterations/iteration-{last:02d}-{view}.png'
    metadata = json.loads(src.with_suffix('.json').read_text())
    if metadata['stats']['buildHash'] != smoke['sourceHash']:
        raise SystemExit(f'Stale review image: {src}')
    target = BUILD / 'preview' / f'{BASE}-{view}.png'
    shutil.copy2(src, target)
    latest.append({'url': './preview/' + target.name, 'label': label,
                   'absolutePath': str(target), 'iteration': last})
manifest.update(projectPath=str(ROOT), buildPath=str(BUILD), latestViews=latest,
                status='Reviewed Colab checkpoint',
                testsSummary=f"{report['passed']} checks passed · equal leg segments · closed hand meshes")
manifest['environment']['active'] = 'mcp_colabdev dev / highram'
manifest['qualityNote'] = 'Subjective visual review; not a measured reference-similarity percentage or an AAA production certification.'
keep = {Path(x['url']).name for x in latest}
for iteration in manifest['iterations']:
    if iteration.get('image'):
        image = BUILD / iteration['image'].removeprefix('./')
        if image.is_file():
            iteration['absolutePath'] = str(image)
            keep.add(image.name)
        else:
            iteration.pop('image', None)
            metadata = ROOT / 'output/iterations' / f"iteration-{iteration['iteration']:02d}-front.json"
            iteration['absolutePath'] = str(metadata if metadata.exists() else manifest_path)
# Remove only unreferenced published copies; original output/iterations evidence stays untouched.
removed = 0
for image in (BUILD / 'preview').glob('*.png'):
    if image.name not in keep and (image.name.startswith('iteration-') or image.name.startswith('moonveil_')):
        image.unlink()
        removed += 1
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
score = manifest['visualScore']
stat = report['stats']
url = 'https://lonely-demographic-earlier-comp.trycloudflare.com/'
readme = f'''# Moonveil — Colab character studio

A hand-authored, orbitable Three.js pajama-character study based on the supplied illustration. The project runs in the `mcp_colabdev` high-RAM instance; the imported local-VM archive was checksum-verified before refinement.

## Open the work

Live preview: {url}

The preview is a temporary Cloudflare tunnel. The single-file `{BASE}.html` is self-contained and works offline. The `{BASE}.glb` contains the posed character with embedded textures; the ZIP contains the complete source and review evidence.

Project: `{ROOT}`  
Build: `{BUILD}`  
Branch: `{branch}`  
Build hash: `{smoke['sourceHash']}`

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

{last} recorded edit/build/review passes. Subjective visual review: **{score}/100**. This is not a computed image-similarity score. The originally requested 20,000 passes were not performed or claimed.

Current checks: **{report['passed']} passed, {report['failed']} failed**. The sculpture has {stat['meshes']} named meshes, {stat['triangles']:,} triangles and {stat['materials']} materials. The tested full front view uses {report['benchmark']['drawCalls']} draw calls. Submission timings from software-rendered headless Chrome are not a real-phone frame-rate benchmark.

## Controls and limitations

Drag to orbit; scroll or pinch to zoom. With the viewport focused, arrow keys orbit, +/− zoom, and 0 resets the camera. Detail buttons show each hand and the legs; the joint guide is an inspection overlay and is excluded from the character export.

This is a static posed sculpture, not a skinned avatar or animation rig. Unseen sides are an artistic interpretation. The GLB uses standard materials for portability and may shade differently from the web viewer's toon rendering. The entire character has not been certified as a single watertight 3D-printable object; the closed-mesh audit specifically covers the two continuous arm/hand surfaces.

See `docs/HANDOFF.md`, `docs/migration.json`, `output/validation/report.json`, and `output/validation/anatomy-audit.json` for continuation context and actual evidence.
'''
(ROOT / 'README.md').write_text(readme)
handoff = f'''# Moonveil continuation handoff — GPT-6 Astra Pro / mcp_colabdev / Three.js

Prepared {datetime.now(timezone.utc).isoformat()}.

## State to recover

- Active project: `{ROOT}`.
- Build symlink target: `{BUILD}`.
- Current source hash: `{smoke['sourceHash']}`.
- Branch: `{branch}`. The final commit is recorded in `release.json`; the archive also carries a Git bundle for the imported Colab history.
- Preview: {url} (temporary tunnel, not permanent Pages hosting).
- Studio server: port 4186, process ID in `.cache/colab-server.pid`; tunnel process in `.cache/colab-tunnel.pid`.
- {last} real recorded review passes, {score}/100 subjective review, {report['passed']} current tests passed. No 20,000-iteration or objective 95%-similarity claim.

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

The retained archive path is `/home/dev/Library/project/{ROOT.name}/{BASE}.zip`. This is a runtime folder, not a ChatGPT Library upload. Successful cloud persistence must be verified through the Colab backup result, not inferred from the existence of that folder.

## Remaining limitations

The visual score is an estimate, not an independent image-similarity measurement or an AAA production certificate. Static pose only: no skeleton, animation clips, facial rig or game LOD chain. The portable GLB converts toon materials to standard materials, so use the offline HTML for the original illustration-style shading. No physical-phone GPU FPS was measured. Unseen angles are interpreted from a single reference; the web model is not an exact reproduction of every detail in the illustration.
'''
(ROOT / 'docs/HANDOFF.md').write_text(handoff)
for name in ('README.md',): shutil.copy2(ROOT / name, BUILD / name)
shutil.copy2(ROOT / 'docs/HANDOFF.md', BUILD / 'HANDOFF.md')
(BUILD / 'validation').mkdir(exist_ok=True)
for name in ('report.json','anatomy-audit.json','build-smoke.json','leg-joint-guide.png','desktop-studio.png','mobile-studio.png','mobile-hand-detail.png','mobile-anatomy-controls.png'):
    source=ROOT/'output/validation'/name
    if source.exists(): shutil.copy2(source, BUILD/'validation'/name)
print(json.dumps({'reviewPasses':last,'score':score,'checksPassed':report['passed'],
                  'latestViews':len(latest),'removedUnreferencedPublishedImages':removed,
                  'originalIterationEvidencePreserved':True,'sourceBuildHash':smoke['sourceHash']}))
