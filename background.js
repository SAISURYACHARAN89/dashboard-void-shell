let dashboardWindowId = null;
const fixedPos = { left: 100, top: 100, width: 400, height: 520 };

chrome.action.onClicked.addListener(async () => {
  if (dashboardWindowId) {
    try {
      await chrome.windows.update(dashboardWindowId, { focused: true });
      return;
    } catch {
      dashboardWindowId = null; // Window closed manually
    }
  }

  chrome.windows.create(
    {
      url: "index.html",
      type: "popup",
      left: fixedPos.left,
      top: fixedPos.top,
      width: fixedPos.width,
      height: fixedPos.height,
      focused: true
    },
    (win) => {
      dashboardWindowId = win.id;
    }
  );
});

// Snap back if user tries to resize
chrome.windows.onBoundsChanged.addListener((win) => {
  if (win.id === dashboardWindowId) {
    chrome.windows.update(dashboardWindowId, {
      left: fixedPos.left,
      top: fixedPos.top,
      width: fixedPos.width,
      height: fixedPos.height
    });
  }
});

// Reset when closed
chrome.windows.onRemoved.addListener((id) => {
  if (id === dashboardWindowId) dashboardWindowId = null;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("React Dashboard Extension installed 🚀");
});
