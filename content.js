// Function to create fallback message when video preview is blocked
const createFallbackMessage = () => {
  const messageContainer = document.createElement('div');
  messageContainer.style.display = 'flex';
  messageContainer.style.flexDirection = 'column';
  messageContainer.style.alignItems = 'center';
  messageContainer.style.justifyContent = 'center';
  messageContainer.style.width = '100%';
  messageContainer.style.height = '300px';
  messageContainer.style.maxWidth = '600px';
  messageContainer.style.maxHeight = '600px';
  messageContainer.style.borderRadius = '8px';
  messageContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  messageContainer.style.color = 'white';
  messageContainer.style.textAlign = 'center';
  messageContainer.style.padding = '40px 20px';
  messageContainer.style.boxSizing = 'border-box';

  // Icon
  const icon = document.createElement('div');
  icon.innerHTML = '🚫';
  icon.style.fontSize = '48px';
  icon.style.marginBottom = '20px';

  // Main message
  const title = document.createElement('h3');
  title.textContent = 'Preview Blocked';
  title.style.margin = '0 0 16px 0';
  title.style.fontSize = '24px';
  title.style.fontWeight = 'bold';

  // Subtitle
  const subtitle = document.createElement('p');
  subtitle.textContent = 'This website blocked the video preview, but your recording was successful!';
  subtitle.style.margin = '0 0 8px 0';
  subtitle.style.fontSize = '16px';
  subtitle.style.opacity = '0.9';
  subtitle.style.lineHeight = '1.4';

  // Download instruction
  const instruction = document.createElement('p');
  instruction.textContent = 'You can still download your recording using the button below.';
  instruction.style.margin = '0';
  instruction.style.fontSize = '14px';
  instruction.style.opacity = '0.8';

  messageContainer.appendChild(icon);
  messageContainer.appendChild(title);
  messageContainer.appendChild(subtitle);
  messageContainer.appendChild(instruction);

  return messageContainer;
};

// Wait for the endedRecording message from recording_screen.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.name !== 'endedRecording') {
    return;
  }

  // Create a new video element and show it in an overlay div
  const video = document.createElement('video');
  video.src = request.body.base64;
  video.controls = true;
  video.autoplay = true;
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.maxWidth = '600px';
  video.style.maxHeight = '600px';
  video.style.borderRadius = '8px';

  // Create fallback message element (initially hidden)
  const fallbackMessage = createFallbackMessage();
  fallbackMessage.style.display = 'none';

  // Create container for video and buttons
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.gap = '16px';
  container.style.padding = '20px';
  container.style.background = 'rgba(0, 0, 0, 0.8)';
  container.style.borderRadius = '12px';
  container.style.maxWidth = '640px';
  container.style.width = '90%';

  // Create save button
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Download Recording';
  saveButton.style.padding = '12px 24px';
  saveButton.style.background = '#4285f4';
  saveButton.style.color = 'white';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '6px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.fontSize = '16px';
  saveButton.style.fontWeight = 'bold';
  
  saveButton.onclick = () => {
    // Create download link
    const link = document.createElement('a');
    link.href = request.body.base64;
    link.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.padding = '8px 16px';
  closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
  closeButton.style.color = 'white';
  closeButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
  closeButton.style.borderRadius = '6px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '14px';
  
  closeButton.onclick = () => {
    document.body.removeChild(overlay);
  };

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '12px';
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(closeButton);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backdropFilter = 'blur(5px)';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  // Add hover effects
  saveButton.onmouseover = () => saveButton.style.background = '#3367d6';
  saveButton.onmouseout = () => saveButton.style.background = '#4285f4';
  
  closeButton.onmouseover = () => closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
  closeButton.onmouseout = () => closeButton.style.background = 'rgba(255, 255, 255, 0.2)';

  // Function to show fallback message instead of video
  const showFallbackMessage = () => {
    video.style.display = 'none';
    fallbackMessage.style.display = 'flex';
  };

  // Add video loading detection
  let videoLoadTimeout;
  let hasDetectedVideoLoad = false;

  // Listen for video events
  video.addEventListener('loadeddata', () => {
    hasDetectedVideoLoad = true;
    clearTimeout(videoLoadTimeout);
  });

  video.addEventListener('loadedmetadata', () => {
    // Check if video has valid duration
    if (video.duration && video.duration > 0) {
      hasDetectedVideoLoad = true;
      clearTimeout(videoLoadTimeout);
    }
  });

  video.addEventListener('error', () => {
    console.log('Video loading error detected');
    clearTimeout(videoLoadTimeout);
    showFallbackMessage();
  });

  video.addEventListener('stalled', () => {
    console.log('Video loading stalled');
  });

  // Set timeout to check if video loaded properly
  videoLoadTimeout = setTimeout(() => {
    if (!hasDetectedVideoLoad || !video.duration || video.duration === 0) {
      console.log('Video failed to load properly (no duration or loadeddata event)');
      showFallbackMessage();
    }
  }, 3000); // Wait 3 seconds for video to load

  // Assemble the UI
  container.appendChild(video);
  container.appendChild(fallbackMessage);
  container.appendChild(buttonContainer);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Allow clicking outside to close
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
});