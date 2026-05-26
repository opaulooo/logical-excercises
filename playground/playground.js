import {
  languageExt,
  languageFolder,
  judge0Lang,
  descriptionByTitle,
  starters,
} from "./constants.js";
import {
  exerciseBaseName,
  storageKey,
  getExerciseDescription,
  renderAverageTime,
  computeAverageForCurrentExercise,
  parseExecutionSeconds,
  resultOutputText,
} from "./utils.js";
import {
  buildExerciseRelativePath,
  fetchSavedCodeFromProject,
  saveCodeToProject,
  fetchLogs,
  saveLogs,
  runWithJudge0,
} from "./api.js";
import { createEditorController } from "./editor.js";
import { saveUsingFileSystemAccess } from "./filesystem.js";

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

  let lastExecutionSeconds = null;
  let editorLoadToken = 0;

  const editor = createEditorController(
    codeEditorEl,
    codeEl,
    languageSelect,
    saveCurrentCode,
  );

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", !!isError);
  }

  function setOutput(text) {
    outputEl.textContent = text || "";
  }

  function currentExerciseId() {
    return exerciseBaseName(difficulty, number);
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
      currentExerciseId();
    descriptionEl.textContent =
      "Description: " +
      getExerciseDescription(descriptionParam, title, descriptionByTitle);

    if (["easy", "medium", "hard"].indexOf(difficulty) >= 0) {
      backLink.href = "../" + difficulty + "/" + difficulty + ".html";
    } else {
      backLink.href = "../index.html";
    }
  }

  async function loadEditorForLanguage(lang) {
    const loadToken = ++editorLoadToken;
    editor.setEditorLanguage(lang);

    const fileCode = await fetchSavedCodeFromProject(
      difficulty,
      number,
      lang,
      languageExt,
      languageFolder,
    );

    if (loadToken !== editorLoadToken) {
      return;
    }

    if (fileCode !== null) {
      editor.setCodeValue(fileCode);
      return;
    }

    const saved = localStorage.getItem(storageKey(difficulty, number, lang));
    if (saved !== null) {
      editor.setCodeValue(saved);
      return;
    }

    editor.setCodeValue(starters[lang] || "");
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
    const relativePath = buildExerciseRelativePath(
      difficulty,
      number,
      lang,
      languageExt,
      languageFolder,
    );
    const code = editor.getCodeValue();

    localStorage.setItem(storageKey(difficulty, number, lang), code);

    try {
      const result = await saveCodeToProject(relativePath, code);

      if (result && result.ok) {
        setStatus("Saved in project: /" + relativePath, false);
        return;
      }

      setStatus("Could not save in project path.", true);
    } catch (_) {
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
    const code = editor.getCodeValue();

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
      const avg = computeAverageForCurrentExercise(logs, currentExerciseId());
      renderAverageTime(avgTimeEl, avg);
    } catch (_) {
      renderAverageTime(avgTimeEl, null);
    }
  }

  async function finalizeExercise() {
    if (lastExecutionSeconds == null) {
      setStatus("Execute o codigo antes de finalizar para registrar o tempo.", true);
      return;
    }

    const logEntry = {
      exerciseId: currentExerciseId(),
      difficulty: difficulty,
      number: number,
      date: new Date().toISOString(),
      executionSeconds: lastExecutionSeconds,
      code: editor.getCodeValue(),
    };

    try {
      const logs = await fetchLogs();
      logs.push(logEntry);
      await saveLogs(logs);
      renderAverageTime(
        avgTimeEl,
        computeAverageForCurrentExercise(logs, currentExerciseId()),
      );
      setStatus(
        "Finalizado e gravado em logs/logs.json (" + logEntry.exerciseId + ").",
        false,
      );
    } catch (_) {
      setStatus(
        "Falha ao gravar logs/logs.json. Certifique-se de estar rodando via servidor local.",
        true,
      );
    }
  }

  async function runCode() {
    const lang = languageSelect.value;
    const sourceCode = editor.getCodeValue();

    setStatus("Running...", false);
    setOutput("");
    lastExecutionSeconds = null;

    try {
      const result = await runWithJudge0(lang, sourceCode, judge0Lang);
      setOutput(resultOutputText(result));
      lastExecutionSeconds = parseExecutionSeconds(result);
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
  editor.init().finally(function () {
    loadEditorForLanguage(languageSelect.value);
    loadAverageTime();
  });
})();
