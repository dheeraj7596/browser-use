# B.AI

This README consists of instructions to launch your own UI.

## UI server launch:

- Install node js
```bash
brew install node
```
- If you are in the project home, move to the current folder
```bash
cd ui/browser-agent
```
- Install node modules 
```bash
npm install
```
- Launch the server
```bash
npm run dev
```

## Backend Launch

- Open a new terminal tab
- Install uvicorn via pip
```bash
pip install uvicorn
```
- Launch the server
```bash
uvicorn api.main:app --reload
```
- The UI will be up and serving at http://localhost:5173/