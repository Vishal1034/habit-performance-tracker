
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  FLUSH_INTERVAL_MS: 12000,           // Flush every 12 seconds
  HABIT_REFRESH_INTERVAL_MS: 30000,   // Refresh habits every 30 seconds
  MIN_DURATION_SECONDS: 3,             // Min 3 seconds to log
  SESSION_TIMEOUT_MS: 300000,          // 5 minute session timeout
};


let extensionState = {
  userEmail: '',
  trackedDomains: new Map(), // domain -> { name, type, urls }
  activeSession: {
    tabId: null,
    domain: null,
    startTime: null,
    habit: null,
  },
  isBrowserFocused: true,
  lastFlush: 0,
  lastRefresh: 0,
};


const log = (message, data = '') => {
  console.log(`[HabitAnalyzer] ${message}`, data);
};

const logError = (message, error = '') => {
  console.error(`[HabitAnalyzer ERROR] ${message}`, error);
};

const normalizeDomain = (input) => {
  if (!input || typeof input !== 'string') return null;
  try {
    const hostname = new URL(input).hostname.toLowerCase();
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
};


const storage = {
  async getEmail() {
    const result = await chrome.storage.local.get(['userEmail']);
    return String(result.userEmail || '').trim().toLowerCase();
  },

  async setEmail(email) {
    await chrome.storage.local.set({ userEmail: email });
    extensionState.userEmail = email;
  },

  async getTrackedHabits() {
    const result = await chrome.storage.local.get(['trackedHabits']);
    return result.trackedHabits || [];
  },

  async setTrackedHabits(habits) {
    await chrome.storage.local.set({ trackedHabits: habits });
  },
};


async function fetchHabitsFromServer() {
  try {
    const email = await storage.getEmail();
    if (!email) {
      log('No email set, skipping habit fetch');
      return [];
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/habits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': email,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(`Invalid response: ${data.message}`);
    }

    log(`Fetched ${data.data.length} habits from server`);
    return data.data;
  } catch (error) {
    logError('Failed to fetch habits', error.message);
    return [];
  }
}


async function sendLogToServer(domain, durationSeconds) {
  try {
    const email = await storage.getEmail();
    
    if (!email) {
      logError('Cannot send log: no email set');
      return false;
    }

    if (!domain || durationSeconds < CONFIG.MIN_DURATION_SECONDS) {
      log(`Skipping log: domain=${domain}, duration=${durationSeconds}s`);
      return false;
    }

    log(`Sending log: ${domain} for ${durationSeconds}s`);

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': email,
      },
      body: JSON.stringify({
        url: domain,
        duration: durationSeconds,
        email: email,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Unknown error');
    }

    log(`Log saved successfully for ${domain}`);
    return true;
  } catch (error) {
    logError('Failed to send log', error.message);
    return false;
  }
}


function updateTrackedDomains(habits) {
  extensionState.trackedDomains.clear();

  habits.forEach((habit) => {
    if (!habit.urls || !Array.isArray(habit.urls)) return;

    habit.urls.forEach((urlValue) => {
      const rawValue = String(urlValue || '').trim();
      if (!rawValue) return;

      const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawValue);
      const normalized = normalizeDomain(
        hasScheme ? rawValue : `https://${rawValue}`
      );

      if (normalized) {
        extensionState.trackedDomains.set(normalized, {
          habitId: habit._id,
          habitName: habit.name,
          habitType: habit.type,
        });
        log(`Tracking domain: ${normalized} (${habit.name})`);
      }
    });
  });

  log(`Total tracked domains: ${extensionState.trackedDomains.size}`);
}

function shouldTrackDomain(domain) {
  if (!domain) return false;
  if (extensionState.trackedDomains.size === 0) return false;

  for (const [trackedDomain] of extensionState.trackedDomains) {
    if (domain === trackedDomain || domain.endsWith(`.${trackedDomain}`)) {
      return true;
    }
  }

  return false;
}


async function flushCurrentSession() {
  const session = extensionState.activeSession;

  if (!session.domain || !session.startTime || !extensionState.isBrowserFocused) {
    return;
  }

  const elapsedSeconds = Math.round((Date.now() - session.startTime) / 1000);

  if (elapsedSeconds >= CONFIG.MIN_DURATION_SECONDS) {
    const success = await sendLogToServer(session.domain, elapsedSeconds);
    if (success) {
      log(`Flushed session: ${session.domain} (${elapsedSeconds}s)`);
      session.startTime = Date.now(); // Reset timer
    }
  }
}

function startSession(tabId, domain) {
  if (extensionState.activeSession.domain === domain) {
    return; // Already tracking this domain
  }

  extensionState.activeSession = {
    tabId,
    domain,
    startTime: Date.now(),
    habit: extensionState.trackedDomains.get(domain),
  };

  log(`Started session: ${domain} on tab ${tabId}`);
}

function endSession() {
  extensionState.activeSession = {
    tabId: null,
    domain: null,
    startTime: null,
    habit: null,
  };
}

async function setActiveTabFromChromeTab(tab) {
  if (!tab || typeof tab.id !== 'number') {
    endSession();
    return;
  }

  const domain = normalizeDomain(tab.url);

  if (domain && shouldTrackDomain(domain)) {
    startSession(tab.id, domain);
  } else {
    await flushCurrentSession();
    endSession();
  }
}


async function refreshHabitsTask() {
  try {
    log('Refreshing habits...');
    const habits = await fetchHabitsFromServer();
    updateTrackedDomains(habits);

    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab) {
      await setActiveTabFromChromeTab(activeTab);
    }

    extensionState.lastRefresh = Date.now();
  } catch (error) {
    logError('Habit refresh failed', error.message);
  }
}

async function flushTask() {
  try {
    await flushCurrentSession();
    extensionState.lastFlush = Date.now();
  } catch (error) {
    logError('Flush failed', error.message);
  }
}


chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    await flushCurrentSession();

    const tab = await chrome.tabs.get(activeInfo.tabId);
    await setActiveTabFromChromeTab(tab);
  } catch (error) {
    logError('Tab activation handler error', error.message);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.url && tabId === extensionState.activeSession.tabId) {
      await flushCurrentSession();
      await setActiveTabFromChromeTab(tab);
    }
  } catch (error) {
    logError('Tab update handler error', error.message);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    extensionState.isBrowserFocused =
      windowId !== chrome.windows.WINDOW_ID_NONE;

    if (!extensionState.isBrowserFocused) {
      await flushCurrentSession();
      endSession();
    } else {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (activeTab) {
        await setActiveTabFromChromeTab(activeTab);
      }
    }
  } catch (error) {
    logError('Window focus handler error', error.message);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    if (tabId === extensionState.activeSession.tabId) {
      await flushCurrentSession();
      endSession();
    }
  } catch (error) {
    logError('Tab removal handler error', error.message);
  }
});


chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message) {
    return false;
  }

  if (message.type === 'SET_EMAIL') {
    (async () => {
      try {
        const email = String(message.email || '').trim().toLowerCase();
        await storage.setEmail(email);
        await refreshHabitsTask(); // Refresh habits with new email
        sendResponse({ success: true, message: 'Email set and habits refreshed' });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message,
        });
      }
    })();
    return true;
  }

  if (message.type === 'REFRESH_HABITS') {
    (async () => {
      try {
        await refreshHabitsTask();
        sendResponse({ success: true, message: 'Habits refreshed' });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message,
        });
      }
    })();
    return true;
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({
      success: true,
      data: {
        userEmail: extensionState.userEmail,
        trackedDomainsCount: extensionState.trackedDomains.size,
        activeSession: extensionState.activeSession.domain,
        isBrowserFocused: extensionState.isBrowserFocused,
      },
    });
    return true;
  }

  return false;
});


async function initialize() {
  try {
    log('Extension initializing...');

    const email = await storage.getEmail();
    extensionState.userEmail = email;

    if (email) {
      await refreshHabitsTask();
    } else {
      log('No email configured');
    }

    setInterval(refreshHabitsTask, CONFIG.HABIT_REFRESH_INTERVAL_MS);

    setInterval(flushTask, CONFIG.FLUSH_INTERVAL_MS);

    log('Extension initialized successfully');
  } catch (error) {
    logError('Initialization failed', error.message);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed/updated');
  initialize();
});

initialize();
