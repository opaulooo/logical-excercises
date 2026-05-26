function getMonacoLanguage(lang) {
  if (lang === "python") {
    return "python";
  }

  if (lang === "csharp") {
    return "csharp";
  }

  return "javascript";
}

function enableTextareaTabFallback(codeEl) {
  codeEl.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const start = codeEl.selectionStart;
    const end = codeEl.selectionEnd;
    const value = codeEl.value;
    codeEl.value = value.substring(0, start) + "  " + value.substring(end);
    codeEl.selectionStart = codeEl.selectionEnd = start + 2;
  });
}

export function createEditorController(codeEditorEl, codeEl, languageSelect, onSaveShortcut) {
  let monacoEditor = null;

  function getCodeValue() {
    if (monacoEditor) {
      return monacoEditor.getValue();
    }

    return codeEl.value;
  }

  function setCodeValue(value) {
    if (monacoEditor) {
      monacoEditor.setValue(value || "");
      return;
    }

    codeEl.value = value || "";
  }

  function setEditorLanguage(lang) {
    if (!monacoEditor || !window.monaco) {
      return;
    }

    const model = monacoEditor.getModel();
    if (!model) {
      return;
    }

    window.monaco.editor.setModelLanguage(model, getMonacoLanguage(lang));
  }

  function init() {
    if (!window.require || !codeEditorEl) {
      enableTextareaTabFallback(codeEl);
      return Promise.resolve(false);
    }

    return new Promise(function (resolve) {
      window.require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
        },
      });

      window.require(
        ["vs/editor/editor.main"],
        function () {
          window.monaco.editor.defineTheme("dracula", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "", foreground: "f8f8f2", background: "282a36" },
              { token: "comment", foreground: "6272a4" },
              { token: "keyword", foreground: "ff79c6" },
              { token: "number", foreground: "bd93f9" },
              { token: "string", foreground: "f1fa8c" },
              { token: "type.identifier", foreground: "8be9fd" },
              { token: "delimiter", foreground: "f8f8f2" },
            ],
            colors: {
              "editor.background": "#282a36",
              "editor.foreground": "#f8f8f2",
              "editorLineNumber.foreground": "#6272a4",
              "editorLineNumber.activeForeground": "#f8f8f2",
              "editorCursor.foreground": "#f8f8f2",
              "editor.selectionBackground": "#44475a",
              "editor.inactiveSelectionBackground": "#3a3d4a",
              "editorIndentGuide.background1": "#3b3d4a",
              "editorIndentGuide.activeBackground1": "#6272a4",
            },
          });

          monacoEditor = window.monaco.editor.create(codeEditorEl, {
            value: "",
            language: getMonacoLanguage(languageSelect.value),
            theme: "dracula",
            automaticLayout: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: false,
            fontSize: 15,
            fontLigatures: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          });

          monacoEditor.addCommand(
            window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyS,
            function () {
              onSaveShortcut();
            },
          );

          codeEditorEl.style.display = "block";
          codeEl.style.display = "none";
          resolve(true);
        },
        function () {
          enableTextareaTabFallback(codeEl);
          resolve(false);
        },
      );
    });
  }

  return {
    init,
    getCodeValue,
    setCodeValue,
    setEditorLanguage,
  };
}
