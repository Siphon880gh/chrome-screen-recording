const startRecording = () => {
  // Send message to background script to start the recording process
  chrome.runtime.sendMessage({ name: 'startRecording' });
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startRecordingButton').addEventListener('click', startRecording);
});
