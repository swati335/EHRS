export const showNotification = (message, type) => {
  const notification = document.createElement("div");
  notification.innerText = message;
  notification.style.position = "fixed";
  notification.style.top = "10px";
  notification.style.left = "10px";
  notification.style.padding = "10px";
  notification.style.borderRadius = "5px";
  notification.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
  notification.style.zIndex = "1000";

  // Set background color based on message type
  switch (type) {
    case "success":
      notification.style.background = "#4CAF50";
      notification.style.color = "white";
      break;
    case "error":
      notification.style.background = "#f44336";
      notification.style.color = "white";
      break;
    case "warning":
      notification.style.background = "#ff9800";
      notification.style.color = "white";
      break;
    case "info":
      notification.style.background = "#2196F3";
      notification.style.color = "white";
      break;
    default:
      notification.style.background = "#333";
      notification.style.color = "white";
  }
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 7000);
};