const handleDbName = "logical-exercises-fs-handles";
const handleStoreName = "handles";
const handleRepoKey = "repo-root";

let workspaceDirHandle = null;

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
  } catch (_) {
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
  } catch (_) {
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
      const requested = await storedHandle.requestPermission({ mode: "readwrite" });
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

export async function saveUsingFileSystemAccess(folderParts, fileName, code, interactive) {
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
