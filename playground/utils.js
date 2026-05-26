export function exerciseBaseName(difficulty, number) {
  return difficulty + "-" + number;
}

export function storageKey(difficulty, number, lang) {
  return "exercise-code-" + exerciseBaseName(difficulty, number) + "-" + lang;
}

export function getExerciseDescription(descriptionParam, title, descriptionByTitle) {
  return (
    descriptionParam ||
    descriptionByTitle[title] ||
    "Open this exercise from the challenge list to load the full description."
  );
}

export function renderAverageTime(avgTimeEl, avgSeconds) {
  if (!avgTimeEl) {
    return;
  }

  if (avgSeconds == null || !Number.isFinite(avgSeconds)) {
    avgTimeEl.textContent = "tempo medio: - s";
    return;
  }

  avgTimeEl.textContent = "tempo medio: " + avgSeconds.toFixed(3) + " s";
}

export function computeAverageForCurrentExercise(logs, currentExerciseId) {
  const relevantLogs = logs.filter(function (entry) {
    return (
      entry &&
      entry.exerciseId === currentExerciseId &&
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

export function parseExecutionSeconds(result) {
  if (typeof result.time === "number" && Number.isFinite(result.time)) {
    return result.time;
  }

  if (typeof result.time === "string") {
    const parsedTime = parseFloat(result.time);
    return Number.isFinite(parsedTime) ? parsedTime : null;
  }

  return null;
}

export function resultOutputText(result) {
  return (
    result.stdout ||
    result.stderr ||
    result.compile_output ||
    result.message ||
    (result.status && result.status.description) ||
    "(no output)"
  );
}
