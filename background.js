// Background service worker
let recordingTabId = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Google Meet Recorder extension installed");

  // Initialize storage
  chrome.storage.local.set({
    isRecording: false,
    startTime: null,
    recordingTabId: null,
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab is a Google Meet page
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("meet.google.com")
  ) {
    console.log("Google Meet tab detected:", tabId);
  }
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRecording") {
    startRecording(request.tabId, request.includeMic)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else if (request.action === "stopRecording") {
    stopRecording()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === "recordingStarted") {
    // Update badge to show recording status
    chrome.action.setBadgeText({ text: "REC" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    // Update storage to reflect recording state
    chrome.storage.local.set({
      isRecording: true,
      startTime: Date.now(),
      recordingTabId: recordingTabId,
    });
    console.log("Recording started notification received");
  } else if (request.action === "recordingStopped") {
    // Clear badge
    chrome.action.setBadgeText({ text: "" });
    // Update storage
    chrome.storage.local.set({
      isRecording: false,
      startTime: null,
      recordingTabId: null,
    });
    recordingTabId = null;
    console.log("Recording stopped notification received");
  } else if (request.action === "recordingCanceled") {
    // User canceled the screen share dialog
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.set({
      isRecording: false,
      startTime: null,
      recordingTabId: null,
    });
    recordingTabId = null;
    console.log("Recording canceled by user");
  }

  return true;
});

// Start recording using tabCapture API
async function startRecording(tabId, includeMic = true) {
  try {
    console.log("Starting recording for tab:", tabId);
    recordingTabId = tabId;

    // Send message to content script to start recording with getDisplayMedia
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: "startRecordingWithStreamId", includeMic },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (!response || !response.success) {
      const errorMsg = response?.error || "Failed to start recording";
      console.error("Content script error:", errorMsg);
      recordingTabId = null;
      throw new Error(errorMsg);
    }

    // Don't update badge here - wait for recordingStarted message from content script
    // This allows user to cancel the screen share dialog
    console.log("Screen share dialog shown to user");
  } catch (error) {
    console.error("Error starting recording:", error);
    console.error("Error details:", error.message);
    recordingTabId = null;
    throw error;
  }
}

// Stop recording
async function stopRecording() {
  try {
    if (!recordingTabId) {
      throw new Error("No active recording");
    }

    console.log("Stopping recording...");

    // Send message to content script to stop
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        recordingTabId,
        { action: "stopRecording" },
        (response) => {
          if (chrome.runtime.lastError) {
            // Tab might be closed, that's ok
            resolve({ success: true });
          } else {
            resolve(response);
          }
        }
      );
    });

    // Clear badge
    chrome.action.setBadgeText({ text: "" });
    recordingTabId = null;

    console.log("Recording stopped");
  } catch (error) {
    console.error("Error stopping recording:", error);
    throw error;
  }
}

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Reset recording state if the recording tab is closed
  if (tabId === recordingTabId) {
    console.log("Recording tab closed, stopping recording");
    chrome.storage.local.set({
      isRecording: false,
      startTime: null,
      recordingTabId: null,
    });
    chrome.action.setBadgeText({ text: "" });
    recordingTabId = null;
  }
});

console.log("Background service worker loaded");
