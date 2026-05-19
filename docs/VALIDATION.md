# Validation

Validation run during repository finalization:

```bash
python -m py_compile backend/main.py backend/crew.py
cd client && npm ci && npm run build
```

Result:

- Backend Python compile: passed.
- Client production build: passed.

Known non-fatal warnings:

- Jotai `use client` directive warning under Vite bundling.
- `three-mesh-bvh` / Three.js `BatchedMesh` export warning.
- Vite large chunk warning due to Three.js / React Three Fiber bundle size.

Recommended future hardening:

- Upgrade and align Three.js / Drei / three-mesh-bvh versions.
- Add dynamic imports for 3D scene code splitting.
- Add automated backend endpoint tests.
- Add Playwright smoke tests for the UI.
