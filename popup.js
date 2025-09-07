const startRecording = () => {
  // Get audio recording preference
  const recordAudio = document.getElementById('recordAudio').checked;
  
  // Send message to background script to start the recording process
  chrome.runtime.sendMessage({ 
    name: 'startRecording',
    recordAudio: recordAudio
  });
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startRecordingButton').addEventListener('click', startRecording);
});
