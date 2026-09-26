/* Dynamic Domain Workspace Panel */
.domain-view {
  width: 100%;
  max-width: 800px;
  animation: fadeIn 0.3s ease-in-out;
}

.domain-view.hidden {
  display: none;
}

.workspace-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border-purple);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 25px var(--purple-glow);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.active-tag {
  color: var(--theme-purple);
  font-weight: bold;
  letter-spacing: 1px;
}

.back-btn {
  background: rgba(183, 139, 233, 0.1);
  border: 1px solid var(--border-purple);
  color: var(--text-bright);
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.back-btn:hover {
  background: var(--theme-purple);
  color: #0c0a14;
}

.workspace-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visual-display-panel {
  width: 100%;
  height: 180px;
  background: rgba(12, 10, 20, 0.6);
  border: 1px dashed var(--border-purple);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted);
}

.input-console {
  display: flex;
  gap: 10px;
}

.input-console textarea {
  flex-grow: 1;
  height: 60px;
  background: rgba(12, 10, 20, 0.8);
  border: 1px solid var(--border-purple);
  border-radius: 8px;
  color: var(--text-bright);
  padding: 10px;
  font-family: var(--font-serif);
  resize: none;
  outline: none;
}

.input-console textarea:focus {
  border-color: var(--theme-purple);
  box-shadow: 0 0 10px var(--purple-glow);
}

.execute-btn {
  background: var(--theme-purple);
  color: #0c0a14;
  font-weight: bold;
  border: none;
  padding: 0 20px;
  border-radius: 8px;
  cursor: pointer;
}

.execute-btn:hover {
  box-shadow: 0 0 15px var(--purple-glow);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
