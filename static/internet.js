function checkInternetConnection() {
    function showOfflineMessageBox(message) {
      const existingMessageBox = document.getElementById('connectionMessageBox');
      if (existingMessageBox) {
        existingMessageBox.remove();
      }
  
      const messageBox = document.createElement('div');
      messageBox.id = 'connectionMessageBox'; // Assign an ID for easy removal
      messageBox.style.cssText = `
        position: fixed;
        top: 15px;
        right: 20px;
        background-color: rgb(250 250 250); /* Light gray for offline */
        color: #404040; /* Dark gray for offline */
        padding: 7px 18px;
        border-radius: 11px;
        z-index: 1001;
        box-shadow: 0 0 3px 0px rgb(0 0 0 / 51%);
        font-size: 12px;
        font-family: Inter, monospace;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.3s ease-in-out;
        opacity: 1;
      `;
  
      // SVG Icon for offline state
      const svgIcon = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="System / Wifi_Problem">
<path id="Vector" d="M8.34277 14.5898C8.80861 14.0902 9.37187 13.6914 9.9978 13.418C10.6237 13.1445 11.2995 13.0024 11.9826 13C12.6656 12.9976 13.3419 13.1353 13.9697 13.4044C14.5975 13.6734 15.1637 14.0682 15.633 14.5645M6.14941 11.5439C6.89312 10.7464 7.79203 10.1093 8.79091 9.67188C9.7898 9.23441 10.8678 9.00575 11.9583 9M3.22363 8.81649C4.34177 7.61743 5.69376 6.66021 7.19618 6.00391C8.69859 5.3476 10.3198 5.00558 11.9593 5M16 8.99997L18 6.99998M18 6.99998L20 5M18 6.99998L16 5M18 6.99998L20 8.99997M12 19C11.4477 19 11 18.5523 11 18C11 17.4477 11.4477 17 12 17C12.5523 17 13 17.4477 13 18C13 18.5523 12.5523 19 12 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>
      `;
  
      messageBox.innerHTML = `
        ${svgIcon}
        <span>${message}</span>
      `;
  
      document.body.appendChild(messageBox);
  
      // Automatically remove the message box after 2 seconds
      setTimeout(() => {
        messageBox.style.opacity = '0'; // Fade out
        messageBox.addEventListener('transitionend', () => messageBox.remove());
      }, 2000);
    }
  
    // Event listener for when the browser goes offline
    window.addEventListener('offline', () => {
      console.log('Internet connection lost! Displaying warning.');
      showOfflineMessageBox('Check Your Connection');
    });
  
    // Event listener for when the browser comes online
    // We don't display a message here as per the request.
    window.addEventListener('online', () => {
      console.log('Internet connection restored.');
      // Any existing offline message will be removed by the showOfflineMessageBox logic
      // if it were called, but since it's not, we ensure it's removed if still present.
      const existingMessageBox = document.getElementById('connectionMessageBox');
      if (existingMessageBox) {
        existingMessageBox.remove();
      }
    });
  
    // Initial check: if already offline on load, show the message
    if (!navigator.onLine) {
      showOfflineMessageBox('Check Your Connection');
    }
  }
  
  // Call the function to set up the listeners
  document.addEventListener('DOMContentLoaded', checkInternetConnection);
