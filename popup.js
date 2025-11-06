// Popup script for controlling the recording (single toggle)
let isRecording = false;
let startTime = null;
let durationInterval = null;

const recordToggle = document.getElementById("recordToggle");
const statusText = document.getElementById("statusText");
const durationEl = document.getElementById("duration");
const messageEl = document.getElementById("message");
const includeMicEl = document.getElementById("includeMic");

// Initialize popup state
chrome.storage.local.get(["isRecording", "startTime"], (result) => {
  if (result.isRecording) {
    isRecording = true;
    startTime = result.startTime;
    updateUI(true);
    startDurationTimer();
  }
});

// Listen for storage changes to update UI in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.isRecording) {
      isRecording = changes.isRecording.newValue;
      if (isRecording) {
        // Recording started
        if (changes.startTime) {
          startTime = changes.startTime.newValue;
        }
        updateUI(true);
        startDurationTimer();
        showMessage("Recording started!", "success");
      } else {
        // Recording stopped
        updateUI(false);
        stopDurationTimer();
        startTime = null;
      }
    }
  }
});

// Toggle button handler
recordToggle.addEventListener("click", async () => {
  try {
    if (!isRecording) {
      // Start recording
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.url || !tab.url.includes("meet.google.com")) {
        showMessage("Please open a Google Meet tab first", "error");
        return;
      }
      chrome.runtime.sendMessage(
        {
          action: "startRecording",
          tabId: tab.id,
          includeMic: includeMicEl ? includeMicEl.checked : true,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            showMessage("Error: " + chrome.runtime.lastError.message, "error");
            return;
          }
          if (response && response.success) {
            showMessage("Waiting for screen share approval...", "info");
          } else {
            showMessage(
              response?.error || "Failed to start recording",
              "error"
            );
          }
        }
      );
    } else {
      // Stop recording
      chrome.runtime.sendMessage({ action: "stopRecording" }, (response) => {
        if (chrome.runtime.lastError) {
          showMessage("Error: " + chrome.runtime.lastError.message, "error");
          return;
        }
        if (response && response.success) {
          showMessage("Stopping recording...", "info");
        } else {
          showMessage(response?.error || "Failed to stop recording", "error");
        }
      });
    }
  } catch (error) {
    showMessage("Error: " + error.message, "error");
  }
});

// Stop recording button
stopBtn.addEventListener("click", async () => {
  try {
    // Send message to background script to stop recording
    chrome.runtime.sendMessage({ action: "stopRecording" }, (response) => {
      if (chrome.runtime.lastError) {
        showMessage("Error: " + chrome.runtime.lastError.message, "error");
        return;
      }

      if (response && response.success) {
        // UI will update via storage change listener
        showMessage("Stopping recording...", "info");
      } else {
        showMessage(response?.error || "Failed to stop recording", "error");
      }
    });
  } catch (error) {
    showMessage("Error: " + error.message, "error");
  }
});

// Update UI based on recording state
function updateUI(recording) {
  const container = document.querySelector(".container");
  if (recording) {
    container.classList.add("recording");
    recordToggle.setAttribute("aria-pressed", "true");
    statusText.textContent = "Recording";
  } else {
    container.classList.remove("recording");
    recordToggle.setAttribute("aria-pressed", "false");
    statusText.textContent = "Ready";
    durationEl.textContent = "00:00:00";
  }
}

// Start duration timer
function startDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
  }

  updateDuration();
  durationInterval = setInterval(updateDuration, 1000);
}

// Stop duration timer
function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}

// Update duration display
function updateDuration() {
  if (!startTime) return;

  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const displaySeconds = String(seconds % 60).padStart(2, "0");
  const displayMinutes = String(minutes % 60).padStart(2, "0");
  const displayHours = String(hours).padStart(2, "0");

  durationEl.textContent = `${displayHours}:${displayMinutes}:${displaySeconds}`;
}

// Show message to user
function showMessage(message, type = "info") {
  messageEl.textContent = message;
  messageEl.className = type;

  setTimeout(() => {
    messageEl.textContent = "";
    messageEl.className = "";
  }, 5000);
}

// Cleanup on popup close
window.addEventListener("beforeunload", () => {
  stopDurationTimer();
});
