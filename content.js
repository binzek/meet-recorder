// Content script for Google Meet pages
let mediaRecorder = null;
let recordedChunks = [];
let stream = null; // final combined recording stream
let tabStreamRef = null; // raw tab capture stream
let micStreamRef = null; // raw microphone stream (optional)
let audioContextRef = null; // AudioContext used for mixing

console.log("Google Meet Recorder content script loaded");

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkMeetPage") {
    // Verify we're on a valid Meet page
    const isMeetPage = window.location.hostname === "meet.google.com";
    sendResponse({ isMeetPage: isMeetPage });
    return true;
  }

  if (request.action === "startRecordingWithStreamId") {
    startRecording(request.includeMic !== false)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === "stopRecording") {
    stopRecording()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return true;
});

// Start recording: capture tab (display+audio) and optionally merge with microphone
async function startRecording(includeMic = true) {
  try {
    console.log(
      "Starting recording with getDisplayMedia + mic merge, includeMic=",
      includeMic
    );

    // 1. Capture the tab (includes remote participants + Meet UI + tab audio if user checked box)
    const tabStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      systemAudio: "include",
    });

    console.log("Tab stream captured", {
      audioTracks: tabStream.getAudioTracks().length,
      videoTracks: tabStream.getVideoTracks().length,
    });

    // 2. Try to capture microphone (will prompt user). If denied, proceed without it.
    let micStream = null;
    if (includeMic) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        console.log("Microphone stream captured", {
          audioTracks: micStream.getAudioTracks().length,
        });
      } catch (micErr) {
        console.warn(
          "Microphone capture failed or denied:",
          micErr.name,
          micErr.message
        );
        chrome.runtime.sendMessage({ action: "micDenied" });
      }
    }

    // 3. Merge audio: create AudioContext, route tab audio + mic audio into single destination
    const audioContext = new AudioContext();
    audioContextRef = audioContext;
    const destination = audioContext.createMediaStreamDestination();

    // Helper to safely connect a stream's audio tracks
    const connectAudioTracks = (srcStream, label) => {
      if (!srcStream) return;
      const tracks = srcStream.getAudioTracks();
      if (tracks.length === 0) {
        console.warn(label + " has no audio tracks");
        return;
      }
      const sourceNode = audioContext.createMediaStreamSource(srcStream);
      sourceNode.connect(destination);
      console.log(label + " audio connected to mix");
    };

    connectAudioTracks(tabStream, "Tab stream");
    if (includeMic) {
      connectAudioTracks(micStream, "Mic stream");
    }

    // 4. Build final combined stream: use tab video track + mixed audio track
    const finalTracks = [];
    const tabVideoTracks = tabStream.getVideoTracks();
    if (tabVideoTracks.length > 0) {
      finalTracks.push(tabVideoTracks[0]);
    } else {
      console.warn(
        "No video track in tab stream; recording will be audio-only"
      );
    }

    // Destination holds the mixed audio
    const mixedAudioTracks = destination.stream.getAudioTracks();
    if (mixedAudioTracks.length > 0) {
      finalTracks.push(mixedAudioTracks[0]);
    } else {
      console.warn(
        "No mixed audio tracks available; recording will be video-only"
      );
    }

    // Keep references for cleanup
    tabStreamRef = tabStream;
    micStreamRef = micStream;
    stream = new MediaStream(finalTracks);

    // Mute mic source locally to avoid echo (only if micStream exists)
    if (micStream && micStream.getAudioTracks()[0]) {
      micStream.getAudioTracks()[0].enabled = true; // ensure recorded
      // We don't play mic audio out, so no need to attach to DOM
    }

    // Diagnostics
    console.log("Final recording stream", {
      audioTracks: stream
        .getAudioTracks()
        .map((t) => ({ label: t.label, id: t.id })),
      videoTracks: stream
        .getVideoTracks()
        .map((t) => ({ label: t.label, id: t.id })),
    });

    // 5. Prepare MediaRecorder
    const options = {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 192000,
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm;codecs=vp8,opus";
      console.log("Using fallback codec vp8");
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm";
      console.log("Using generic video/webm");
      delete options.videoBitsPerSecond;
      delete options.audioBitsPerSecond;
    }

    mediaRecorder = new MediaRecorder(stream, options);
    recordedChunks = [];

    // Handle data available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log("Data chunk recorded:", event.data.size, "bytes");
      }
    };

    // Handle recording stop
    mediaRecorder.onstop = () => {
      console.log("MediaRecorder stopped");
      saveRecording();
      // Notify background that recording stopped
      chrome.runtime.sendMessage({ action: "recordingStopped" });
      // Cleanup sources
      try {
        if (tabStreamRef) {
          tabStreamRef.getTracks().forEach((t) => t.stop());
          tabStreamRef = null;
        }
        if (micStreamRef) {
          micStreamRef.getTracks().forEach((t) => t.stop());
          micStreamRef = null;
        }
        if (audioContextRef) {
          audioContextRef.close().catch(() => {});
          audioContextRef = null;
        }
      } catch (e) {
        console.warn("Error during cleanup:", e);
      }
    };

    // Handle errors
    mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
    };

    // Listen for when user stops sharing the tab video (tabStream's video track ends)
    if (tabVideoTracks.length > 0) {
      tabVideoTracks[0].addEventListener("ended", () => {
        console.log(
          "Tab video track ended (user stopped sharing) -> stopping recorder"
        );
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      });
    }

    // Start recording
    mediaRecorder.start(1000); // Collect data every second

    console.log("MediaRecorder started");
    console.log("MediaRecorder state:", mediaRecorder.state);
    console.log("MediaRecorder mimeType:", mediaRecorder.mimeType);
    console.log("Recording stream tracks:", {
      audio: stream.getAudioTracks().length,
      video: stream.getVideoTracks().length,
    });

    // Notify background script that recording started successfully
    chrome.runtime.sendMessage({ action: "recordingStarted" });

    console.log("Recording started successfully");
  } catch (error) {
    console.error("Error starting recording:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // If user canceled, notify background to reset state
    if (error.name === "NotAllowedError" || error.name === "AbortError") {
      console.log("User canceled screen share");
      chrome.runtime.sendMessage({ action: "recordingCanceled" });
    }

    throw error;
  }
}

// Stop recording
async function stopRecording() {
  return new Promise((resolve, reject) => {
    try {
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        reject(new Error("No active recording"));
        return;
      }

      console.log("Stopping recording...");

      // Set up one-time stop handler
      mediaRecorder.addEventListener(
        "stop",
        () => {
          // Stop all tracks
          try {
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
              stream = null;
            }
          } catch (e) {
            console.warn("Error stopping recording tracks:", e);
          }
          resolve();
        },
        { once: true }
      );

      // Stop recording
      mediaRecorder.stop();
    } catch (error) {
      console.error("Error stopping recording:", error);
      reject(error);
    }
  });
}

// Save the recording
function saveRecording() {
  try {
    console.log("Saving recording, chunks:", recordedChunks.length);

    if (recordedChunks.length === 0) {
      console.error("No recorded data available");
      return;
    }

    // Create blob from recorded chunks
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    console.log("Blob created, size:", blob.size, "bytes");

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    a.download = `google-meet-recording-${timestamp}.webm`;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // Clear recorded chunks
    recordedChunks = [];

    console.log("Recording saved successfully");
  } catch (error) {
    console.error("Error saving recording:", error);
  }
}

// Optional: Add visual indicator when recording is active
chrome.storage.local.get(["isRecording"], (result) => {
  if (result.isRecording) {
    addRecordingIndicator();
  }
});

// Listen for storage changes to update indicator
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.isRecording) {
    if (changes.isRecording.newValue) {
      addRecordingIndicator();
    } else {
      removeRecordingIndicator();
    }
  }
});

function addRecordingIndicator() {
  // Remove existing indicator if present
  removeRecordingIndicator();

  // Create recording indicator (liquid glass style)
  const indicator = document.createElement("div");
  indicator.id = "meet-recorder-indicator";
  indicator.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 100000;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    color: #e6e6e6;
    font-family: ui-rounded, system-ui, -apple-system, 'SF Pro Text', Inter, Segoe UI, Roboto, 'Helvetica Neue', Arial;
    font-size: 11px;
    letter-spacing: .14em;
    font-weight: 700;
    text-transform: uppercase;
    background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 6px 20px rgba(0,0,0,0.35);
    backdrop-filter: blur(10px) saturate(1.1);
    -webkit-backdrop-filter: blur(10px) saturate(1.1);
    animation: fadeIn 0.18s ease;
  `;

  // Gloss overlay
  const gloss = document.createElement("div");
  gloss.style.cssText = `
    position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
    background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%);
    mask-image: radial-gradient(100% 60% at 50% 0%, rgba(0,0,0,1), rgba(0,0,0,0.4));
  `;

  // Breathing red dot
  const dot = document.createElement("div");
  dot.style.cssText = `
    width: 8px; height: 8px; border-radius: 50%;
    background: #ff2d55;
    box-shadow: 0 0 0 4px rgba(255,45,85,0.22), 0 0 12px rgba(255,45,85,0.55);
    animation: breathe 1.8s ease-in-out infinite;
  `;

  // Animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes breathe { 0%,100%{ transform: scale(1); box-shadow: 0 0 0 4px rgba(255,45,85,0.22), 0 0 12px rgba(255,45,85,0.55);} 50%{ transform: scale(.82); box-shadow: 0 0 0 7px rgba(255,45,85,0.28), 0 0 16px rgba(255,45,85,0.7);} }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }
  `;
  document.head.appendChild(style);

  const label = document.createElement("span");
  label.textContent = "REC";

  indicator.appendChild(dot);
  indicator.appendChild(label);
  indicator.appendChild(gloss);
  document.body.appendChild(indicator);

  console.log("Recording indicator added");
}

function removeRecordingIndicator() {
  const indicator = document.getElementById("meet-recorder-indicator");
  if (indicator) {
    indicator.remove();
    console.log("Recording indicator removed");
  }
}
