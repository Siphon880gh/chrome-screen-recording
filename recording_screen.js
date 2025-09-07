const fetchBlob = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const base64 = await convertBlobToBase64(blob);

  return base64;
};

const convertBlobToBase64 = (blob) => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;

      resolve(base64data);
    };
  });
};

const updateStatus = (message) => {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    statusDiv.textContent = message;
  }
  console.log('Status:', message);
};

let mediaRecorder = null;

chrome.runtime.onMessage.addListener(async (message) => {
  console.log('Received message:', message);
  
  if (message.name !== 'startRecordingOnBackground') {
    return;
  }

  updateStatus('Starting screen capture...');

  try {
    let stream;
    
    // Try getDisplayMedia first (works for tabs, screens, and windows in modern Chrome)
    try {
      updateStatus('Starting screen capture...');
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: message.body.recordAudio || false
      });
      updateStatus('Screen capture successful, starting recording...');
    } catch (displayMediaError) {
      console.log('getDisplayMedia failed, falling back to desktopCapture:', displayMediaError);
      
      // Fallback to the older desktop capture method for screen/window recording
      updateStatus('Trying alternative capture method...');
      
      stream = await new Promise((resolve, reject) => {
        chrome.desktopCapture.chooseDesktopMedia(
          ['screen', 'window'],
          function (streamId) {
            if (streamId == null) {
              reject(new Error('User cancelled screen selection'));
              return;
            }

            // Create stream from desktop capture
            navigator.mediaDevices.getUserMedia({
              audio: message.body.recordAudio || false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: streamId,
                }
              }
            }).then(resolve).catch(reject);
          }
        );
      });
      
      updateStatus('Screen capture successful, starting recording...');
    }

    // Start recording the tab stream
    mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = async function(e) {
      updateStatus('Processing recording...');
      
      const blobFile = new Blob(chunks, { type: "video/webm" });
      const base64 = await fetchBlob(URL.createObjectURL(blobFile));

      // Check if media was refused to load
      if (chunks.length === 0) {
        updateStatus('Website blocked preview recording, but you can still download the video.');
        // Optionally, you can add logic here to show a download link/button
      } else {
        updateStatus('Sending recording to original tab...');

        // When recording is finished, send message to the original tab content script with the base64 video
        chrome.tabs.sendMessage(message.body.currentTab.id, {
          name: 'endedRecording',
          body: {
            base64,
          }
        });
      }

      // Stop all tracks of stream
      stream.getTracks().forEach(track => track.stop());
      
      updateStatus('Recording complete!');
      setTimeout(() => window.close(), 1000);
    }

    mediaRecorder.onerror = function(e) {
      console.error('MediaRecorder error:', e);
      updateStatus('Recording error: ' + e.error);

      // Check for CSP error
      if (e.error && e.error.message.includes('Content Security Policy')) {
        updateStatus('Preview blocked due to Content Security Policy, but you can still download the video.');
        // Optionally, you can add logic here to show a download link/button
      }
    };

    try {
      mediaRecorder.start();
      updateStatus('Recording in progress... Click stop when done.');
      
      // Show stop button
      const stopButton = document.getElementById('stopRecording');
      if (stopButton) {
        stopButton.style.display = 'block';
        stopButton.onclick = () => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        };
      }
      
      // After all setup, focus back on the tab that was being recorded
      chrome.tabs.update(message.body.currentTab.id, { active: true, selected: true });
    } catch (error) {
      console.error('Error starting recording:', error);
      updateStatus('Error starting recording: ' + error.message);
    }
  } catch (error) {
    console.error('Error with screen capture:', error);
    updateStatus('Error with screen capture: ' + error.message);
  }
});