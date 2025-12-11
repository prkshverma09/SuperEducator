// Permission request page for microphone access
// This page runs as a full tab where getUserMedia permission prompts can be displayed

const grantBtn = document.getElementById('grant-btn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const closeNote = document.getElementById('close-note') as HTMLParagraphElement;

async function requestMicrophonePermission(): Promise<void> {
  grantBtn.disabled = true;
  grantBtn.textContent = 'Requesting permission...';

  try {
    console.log('[Permissions] Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop the stream immediately - we just needed to trigger and get the permission
    stream.getTracks().forEach((track) => track.stop());
    console.log('[Permissions] Microphone access granted!');

    // Show success message
    statusDiv.className = 'success';
    statusDiv.textContent = 'Microphone access granted! You can now talk to the AI agent.';
    closeNote.style.display = 'block';

    // Notify the background script
    chrome.runtime.sendMessage({ action: 'permissionGranted' });

    // Close this tab after a short delay
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error('[Permissions] Failed to get microphone access:', error);

    grantBtn.disabled = false;
    grantBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      Try Again
    `;

    // Show error message with helpful instructions
    statusDiv.className = 'error';

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('denied') || errorMessage.includes('NotAllowedError')) {
      statusDiv.innerHTML = `
        <strong>Permission Denied</strong><br><br>
        You denied microphone access. To use the voice agent, please:<br>
        1. Click the camera icon in your browser's address bar<br>
        2. Allow microphone access for this extension<br>
        3. Click "Try Again"
      `;
    } else {
      statusDiv.textContent = `Error: ${errorMessage}`;
    }
  }
}

// Set up click handler
grantBtn.addEventListener('click', requestMicrophonePermission);

// Check if we already have permission on page load
async function checkExistingPermission(): Promise<void> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    console.log('[Permissions] Current microphone permission state:', result.state);

    if (result.state === 'granted') {
      // Already have permission, notify and close
      statusDiv.className = 'success';
      statusDiv.textContent = 'Microphone access already granted!';
      closeNote.style.display = 'block';
      grantBtn.style.display = 'none';

      chrome.runtime.sendMessage({ action: 'permissionGranted' });

      setTimeout(() => {
        window.close();
      }, 1500);
    }
  } catch (error) {
    // Permissions API might not be available, that's okay
    console.log('[Permissions] Could not query permission state:', error);
  }
}

// Check permission state on load
checkExistingPermission();
