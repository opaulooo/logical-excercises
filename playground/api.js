export function buildExerciseRelativePath(difficulty, number, lang, languageExt, languageFolder) {
  const ext = languageExt[lang] || "txt";
  const folderName = languageFolder[lang] || "misc";
  const fileName = difficulty + "-" + number + "." + ext;
  return difficulty + "/" + folderName + "/" + fileName;
}

export async function fetchSavedCodeFromProject(difficulty, number, lang, languageExt, languageFolder) {
  const relativePath = buildExerciseRelativePath(
    difficulty,
    number,
    lang,
    languageExt,
    languageFolder,
  );

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

export async function saveCodeToProject(relativePath, code) {
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

  return response.json();
}

export async function fetchLogs() {
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

export async function saveLogs(logs) {
  const response = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "logs/logs.json",
      content: JSON.stringify(logs, null, 2),
    }),
  });

  if (!response.ok) {
    throw new Error("logs save endpoint returned status " + response.status);
  }

  const result = await response.json();
  if (!result || !result.ok) {
    throw new Error("Could not write logs/logs.json");
  }
}

export async function runWithJudge0(lang, sourceCode, judge0Lang) {
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
