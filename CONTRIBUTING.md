# Contributing to SimOffice

Thank you for helping make agent interfaces more practical, inspectable, and human-manageable.

## Good first contribution areas

- Improve UI clarity and layout.
- Add furniture-to-skill mappings.
- Add new office presets.
- Improve backend runtime reliability.
- Add tests.
- Add docs and examples.
- Add GLB assets with clear licensing.
- Improve accessibility.

## Development setup

```bash
cd client
npm install
npm run dev
```

In a second terminal:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

## Pull request expectations

Before opening a pull request, run:

```bash
npm --prefix client run build
python -m py_compile backend/main.py backend/crew.py
```

## Design rules

- Do not add fake agent output.
- Do not hide backend failures.
- Do not put production secrets in client code.
- Furniture should have operational purpose.
- UI should protect the 3D workspace from unnecessary overlays.
- Risky external actions should require human approval.

## Commit style

Use short, explicit commit messages:

```text
feat(ui): add command palette shell
fix(backend): prevent paused agents from running tasks
docs: add launch checklist
```
