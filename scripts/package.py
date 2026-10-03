#!/usr/bin/env python3
"""Package a validated checkpoint, optionally retaining a home-directory copy."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from datetime import datetime, timezone
import zipfile

ROOT = Path(__file__).resolve().parent.parent
BASE = 'moonveil_gpt6-astra-pro_mcp-alagent_threejs'

def digest(file: Path) -> str:
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--persist', action='store_true')
    args = parser.parse_args()
    build = ROOT / 'build'
    output = ROOT / 'output'
    report = json.loads((output / 'validation/report.json').read_text())
    if report['failed']:
        raise RuntimeError('Validation failures remain; refusing to package a release.')
    for extension in ('html', 'glb'):
        file = build / f'{BASE}.{extension}'
        if not file.is_file():
            raise FileNotFoundError(file)
        shutil.copy2(file, output / file.name)
    archive = output / f'{BASE}.zip'
    entries: list[tuple[Path, str]] = []
    for name in ('README.md', 'package.json', 'package-lock.json', '.gitignore'):
        entries.append((ROOT / name, name))
    for folder in ('src', 'scripts', 'docs'):
        entries.extend((f, str(f.relative_to(ROOT))) for f in (ROOT / folder).rglob('*') if f.is_file() and '__pycache__' not in str(f))
    entries.extend((f, str(f.relative_to(ROOT))) for f in (output / 'iterations').glob('*.json'))
    entries.extend((f, str(f.relative_to(ROOT))) for f in (output / 'validation').glob('*') if f.suffix in ('.json', '.png'))
    for file in build.rglob('*'):
        if not file.is_file() or file.suffix in ('.zip', '.tmp') or file.name in {'validation-loader.js','release.json'}:
            continue
        entries.append((file, 'build/' + str(file.relative_to(build))))
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for file, name in sorted(entries, key=lambda item: item[1]):
            bundle.write(file, name)
    with zipfile.ZipFile(archive) as bundle:
        failure = bundle.testzip()
        if failure:
            raise RuntimeError(f'Archive integrity error: {failure}')
        entry_count = len(bundle.infolist())
    shutil.copy2(archive, build / archive.name)
    retained = None
    if args.persist:
        destination = Path.home() / 'Library' / 'project' / ROOT.name
        destination.mkdir(parents=True, exist_ok=True)
        retained = destination / archive.name
        if retained.exists() and digest(retained) != digest(archive):
            stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
            retained.rename(destination / f'{BASE}-previous-{stamp}.zip')
        shutil.copy2(archive, retained)
        shutil.copy2(ROOT / 'docs/HANDOFF.md', destination / 'HANDOFF.md')
        if digest(retained) != digest(archive):
            raise RuntimeError('Persistent archive checksum did not match.')
    release = {
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'project': str(ROOT), 'build': str(build.resolve()),
        'validation': {'passed': report['passed'], 'failed': report['failed']},
        'archiveEntries': entry_count, 'archiveIntegrity': 'verified',
        'persistentArchive': str(retained) if retained else None,
        'files': [{'name': f'{BASE}.{ext}', 'bytes': (build / f'{BASE}.{ext}').stat().st_size,
                   'sha256': digest(build / f'{BASE}.{ext}')} for ext in ('html', 'glb', 'zip')],
    }
    for target in (output / 'release.json', build / 'release.json'):
        target.write_text(json.dumps(release, indent=2) + '\n')
    print(json.dumps(release))

if __name__ == '__main__':
    main()
