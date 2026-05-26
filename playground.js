(function () {
  const params = new URLSearchParams(window.location.search);
  const difficulty = (params.get("difficulty") || "easy").toLowerCase();
  const number = params.get("number") || "00";
  const title = params.get("title") || "Exercise";
  const descriptionParam = params.get("description") || "";

  const languageSelect = document.getElementById("language");
  const codeEditorEl = document.getElementById("codeEditor");
  const codeEl = document.getElementById("code");
  const outputEl = document.getElementById("output");
  const statusEl = document.getElementById("status");
  const runBtn = document.getElementById("runBtn");
  const saveBtn = document.getElementById("saveBtn");
  const saveAsBtn = document.getElementById("saveAsBtn");
  const finalizeBtn = document.getElementById("finalizeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const titleEl = document.getElementById("exerciseTitle");
  const metaEl = document.getElementById("exerciseMeta");
  const descriptionEl = document.getElementById("exerciseDescription");
  const avgTimeEl = document.getElementById("avgTime");
  const backLink = document.getElementById("backLink");

  const languageExt = {
    javascript: "js",
    python: "py",
    csharp: "cs",
  };

  const languageFolder = {
    javascript: "js",
    python: "py",
    csharp: "cs",
  };

  const judge0Lang = {
    javascript: 63,
    python: 71,
    csharp: 51,
  };

  const descriptionByTitle = {
    "Two Sum Variant":
      "Given an integer array and target, return indices of the first pair that sums to target in O(n).",
    "Group Transactions by Category":
      "Aggregate transaction amounts by category, ignoring invalid amounts and handling category case-insensitively.",
    "Validate Parentheses":
      "Use a stack to validate strings containing (), [], and {}.",
    "Design a Notification System":
      "Design extensible email/SMS/push notifications with retries, queueing, and failure handling.",
  };

  const starters = {
    javascript:
      "function solve(input) {\n  // Write your solution here\n  return input;\n}\n\nconst input = '';\nconsole.log(solve(input));\n",
    python:
      "def solve(input_value):\n    # Write your solution here\n    return input_value\n\ninput_value = ''\nprint(solve(input_value))\n",
    csharp:
      'using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        // Write your solution here\n        Console.WriteLine("Hello from C#");\n    }\n}\n',
  };

  const handleDbName = "logical-exercises-fs-handles";
  const handleStoreName = "handles";
  const handleRepoKey = "repo-root";

  let workspaceDirHandle = null;
  let lastExecutionSeconds = null;
  let monacoEditor = null;
  let editorLoadToken = 0;

  function exerciseBaseName() {
    return difficulty + "-" + number;
  }

  function storageKey(lang) {
    return "exercise-code-" + exerciseBaseName() + "-" + lang;
  }

  function getMonacoLanguage(lang) {
    if (lang === "python") {
      return "python";
    }

    if (lang === "csharp") {
      return "csharp";
    }

    return "javascript";
  }

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

  function enableTextareaTabFallback() {
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

  function initMonacoEditor() {
    if (!window.require || !codeEditorEl) {
      enableTextareaTabFallback();
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
              saveCurrentCode();
            },
          );

          monacoInitialized = true;
          codeEditorEl.style.display = "block";
          codeEl.style.display = "none";
          resolve(true);
        },
        function () {
          enableTextareaTabFallback();
          resolve(false);
        },
      );
    });
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", !!isError);
  }

  function setOutput(text) {
    outputEl.textContent = text || "";
  }

  function getExerciseDescription() {
    return (
      descriptionParam ||
      descriptionByTitle[title] ||
      "Open this exercise from the challenge list to load the full description."
    );
  }

  function renderAverageTime(avgSeconds) {
    if (!avgTimeEl) {
      return;
    }

    if (avgSeconds == null || !Number.isFinite(avgSeconds)) {
      avgTimeEl.textContent = "tempo medio: - s";
      return;
    }

    avgTimeEl.textContent = "tempo medio: " + avgSeconds.toFixed(3) + " s";
  }

  function computeAverageForCurrentExercise(logs) {
    const currentId = exerciseBaseName();
    const relevantLogs = logs.filter(function (entry) {
      return (
        entry &&
        entry.exerciseId === currentId &&
        typeof entry.executionSeconds === "number" &&
        Number.isFinite(entry.executionSeconds)
      );
    });

    if (relevantLogs.length === 0) {
      return null;
    }

    const total = relevantLogs.reduce(function (acc, entry) {
      return acc + entry.executionSeconds;
    }, 0);

    return total / relevantLogs.length;
  }

  function updateHeader() {
    const prettyDifficulty =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    titleEl.textContent = title;
    metaEl.textContent =
      "Exercise: " +
      prettyDifficulty +
      " #" +
      number +
      " | Save name: " +
      exerciseBaseName();
    descriptionEl.textContent = "Description: " + getExerciseDescription();

    if (["easy", "medium", "hard"].indexOf(difficulty) >= 0) {
      backLink.href = difficulty + "/" + difficulty + ".html";
    } else {
      backLink.href = "index.html";
    }
  }

  function buildExerciseRelativePath(lang) {
    const ext = languageExt[lang] || "txt";
    const folderName = languageFolder[lang] || "misc";
    const fileName = exerciseBaseName() + "." + ext;
    return difficulty + "/" + folderName + "/" + fileName;
  }

  async function fetchSavedCodeFromProject(lang) {
    const relativePath = buildExerciseRelativePath(lang);

    try {
      const response = await fetch("/" + relativePath, { cache: "no-store" });
      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch (_) {
      return null;
    }
  }

  async function loadEditorForLanguage(lang) {
    const loadToken = ++editorLoadToken;
    setEditorLanguage(lang);

    const fileCode = await fetchSavedCodeFromProject(lang);
    if (loadToken !== editorLoadToken) {
      return;
    }

    if (fileCode !== null) {
      setCodeValue(fileCode);
      return;
    }

    const saved = localStorage.getItem(storageKey(lang));
    if (saved !== null) {
      setCodeValue(saved);
      return;
    }

    setCodeValue(starters[lang] || "");
  }

  function openHandleDb() {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(handleDbName, 1);

      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(handleStoreName)) {
          db.createObjectStore(handleStoreName);
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  async function getStoredRepoHandle() {
    try {
      const db = await openHandleDb();
      return await new Promise(function (resolve, reject) {
        const tx = db.transaction(handleStoreName, "readonly");
        const store = tx.objectStore(handleStoreName);
        const request = store.get(handleRepoKey);

        request.onsuccess = function () {
          resolve(request.result || null);
        };

        request.onerror = function () {
          reject(request.error);
        };
      });
    } catch (error) {
      return null;
    }
  }

  async function setStoredRepoHandle(handle) {
    try {
      const db = await openHandleDb();
      await new Promise(function (resolve, reject) {
        const tx = db.transaction(handleStoreName, "readwrite");
        const store = tx.objectStore(handleStoreName);
        const request = store.put(handle, handleRepoKey);

        request.onsuccess = function () {
          resolve();
        };

        request.onerror = function () {
          reject(request.error);
        };
      });
    } catch (error) {
      // Ignore storage failures; Save As still works as fallback.
    }
  }

  async function ensureRepoDirHandle(interactive) {
    if (!window.showDirectoryPicker) {
      return null;
    }

    if (workspaceDirHandle) {
      return workspaceDirHandle;
    }

    const storedHandle = await getStoredRepoHandle();

    if (storedHandle) {
      let permission = "prompt";
      if (storedHandle.queryPermission) {
        permission = await storedHandle.queryPermission({ mode: "readwrite" });
      }

      if (permission === "granted") {
        workspaceDirHandle = storedHandle;
        return workspaceDirHandle;
      }

      if (interactive && storedHandle.requestPermission) {
        const requested = await storedHandle.requestPermission({
          mode: "readwrite",
        });
        if (requested === "granted") {
          workspaceDirHandle = storedHandle;
          return workspaceDirHandle;
        }
      }
    }

    if (!interactive) {
      return null;
    }

    workspaceDirHandle = await window.showDirectoryPicker({
      id: "logical-exercises-root",
      mode: "readwrite",
    });

    await setStoredRepoHandle(workspaceDirHandle);
    return workspaceDirHandle;
  }

  async function saveUsingFileSystemAccess(
    folderParts,
    fileName,
    code,
    interactive,
  ) {
    const rootHandle = await ensureRepoDirHandle(!!interactive);

    if (!rootHandle) {
      return null;
    }

    const segments = Array.isArray(folderParts) ? folderParts : [folderParts];
    let folderHandle = rootHandle;
    for (let i = 0; i < segments.length; i++) {
      folderHandle = await folderHandle.getDirectoryHandle(segments[i], {
        create: true,
      });
    }

    const fileHandle = await folderHandle.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(code);
    await writable.close();

    return "/" + segments.join("/") + "/" + fileName;
  }

  async function fetchLogs() {
    try {
      const response = await fetch("/api/logs");
      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (_) {
      return [];
    }
  }

  async function saveLogs(logs) {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "logs/logs.json", content: JSON.stringify(logs, null, 2) }),
    });

    if (!response.ok) {
      throw new Error("logs save endpoint returned status " + response.status);
    }

    const result = await response.json();
    if (!result || !result.ok) {
      throw new Error("Could not write logs/logs.json");
    }
  }

  function downloadFallback(folderParts, fileName, code) {
    const segments = Array.isArray(folderParts) ? folderParts : [folderParts];
    const suggestedName = segments.join("-") + "-" + fileName;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return suggestedName;
  }

  async function saveCurrentCode() {
    const lang = languageSelect.value;
    const ext = languageExt[lang] || "txt";
    const folderName = languageFolder[lang] || "misc";
    const fileName = exerciseBaseName() + "." + ext;
    const code = getCodeValue();
    const relativePath = difficulty + "/" + folderName + "/" + fileName;

    localStorage.setItem(storageKey(lang), code);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: relativePath,
          content: code,
        }),
      });

      if (!response.ok) {
        throw new Error("save endpoint returned status " + response.status);
      }

      const result = await response.json();

      if (result && result.ok) {
        setStatus("Saved in project: /" + relativePath, false);
        return;
      }

      setStatus("Could not save in project path.", true);
    } catch (error) {
      setStatus(
        "Could not save in project automatically. Start the local server and open via http://localhost.",
        true,
      );
    }
  }

  async function saveAsCurrentCode() {
    const lang = languageSelect.value;
    const ext = languageExt[lang] || "txt";
    const folderParts = [difficulty, languageFolder[lang] || "misc"];
    const fileName = number + "." + ext;
    const code = getCodeValue();

    try {
      const savedPath = await saveUsingFileSystemAccess(
        folderParts,
        fileName,
        code,
        true,
      );
      if (savedPath) {
        setStatus("Saved As in repository: " + savedPath, false);
        return;
      }

      const downloadedName = downloadFallback(folderParts, fileName, code);
      setStatus("Saved As download: " + downloadedName, false);
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Save As cancelled.", true);
        return;
      }

      const downloadedName = downloadFallback(folderParts, fileName, code);
      setStatus(
        "Saved As download: " + downloadedName + " (repository unavailable)",
        false,
      );
    }
  }

  async function loadAverageTime() {
    try {
      const logs = await fetchLogs();
      renderAverageTime(computeAverageForCurrentExercise(logs));
    } catch (_) {
      renderAverageTime(null);
    }
  }

  async function finalizeExercise() {
    if (lastExecutionSeconds == null) {
      setStatus(
        "Execute o codigo antes de finalizar para registrar o tempo.",
        true,
      );
      return;
    }

    const logEntry = {
      exerciseId: exerciseBaseName(),
      difficulty: difficulty,
      number: number,
      date: new Date().toISOString(),
      executionSeconds: lastExecutionSeconds,
      code: getCodeValue(),
    };

    try {
      const logs = await fetchLogs();
      logs.push(logEntry);
      await saveLogs(logs);
      renderAverageTime(computeAverageForCurrentExercise(logs));
      setStatus(
        "Finalizado e gravado em logs/logs.json (" + logEntry.exerciseId + ").",
        false,
      );
    } catch (error) {
      setStatus(
        "Falha ao gravar logs/logs.json. Certifique-se de estar rodando via servidor local.",
        true,
      );
    }
  }

  async function runWithJudge0(lang, sourceCode) {
    const languageId = judge0Lang[lang];
    if (!languageId) {
      throw new Error("Unsupported language for Judge0 execution.");
    }

    const response = await fetch(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: sourceCode,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Judge0 request failed with status " + response.status);
    }

    return response.json();
  }

  async function runCode() {
    const lang = languageSelect.value;
    const sourceCode = getCodeValue();

    setStatus("Running...", false);
    setOutput("");
    lastExecutionSeconds = null;

    try {
      const result = await runWithJudge0(lang, sourceCode);
      const output =
        result.stdout ||
        result.stderr ||
        result.compile_output ||
        result.message ||
        (result.status && result.status.description) ||
        "(no output)";
      setOutput(output);

      if (typeof result.time === "number" && Number.isFinite(result.time)) {
        lastExecutionSeconds = result.time;
      } else if (typeof result.time === "string") {
        const parsedTime = parseFloat(result.time);
        lastExecutionSeconds = Number.isFinite(parsedTime) ? parsedTime : null;
      }

      setStatus(
        "Execution finished via Judge0. (" + (result.time || "unknown") + "s)",
        false,
      );
    } catch (error) {
      setOutput(String(error));
      setStatus(
        "Execution failed. Check network/API availability and try again.",
        true,
      );
    }
  }

  languageSelect.addEventListener("change", function () {
    loadEditorForLanguage(languageSelect.value);
  });

  runBtn.addEventListener("click", runCode);
  saveBtn.addEventListener("click", saveCurrentCode);
  saveAsBtn.addEventListener("click", saveAsCurrentCode);
  finalizeBtn.addEventListener("click", finalizeExercise);
  clearBtn.addEventListener("click", function () {
    setOutput("");
    setStatus("Output cleared.", false);
  });

  document.addEventListener("keydown", function (event) {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") {
      return;
    }

    event.preventDefault();
    saveCurrentCode();
  });

  updateHeader();
  initMonacoEditor().finally(function () {
    loadEditorForLanguage(languageSelect.value);
    loadAverageTime();
  });
})();
