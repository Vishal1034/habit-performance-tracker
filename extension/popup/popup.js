
document.addEventListener('DOMContentLoaded', async () => {
  const scoreEl = document.getElementById('stability-score');
  const focusEl = document.getElementById('focus-time');
  const distractionEl = document.getElementById('distraction-time');
  const syncBtn = document.getElementById('sync-btn');
  const statusEl = document.getElementById('status-msg');
  const emailInput = document.getElementById('email-input');
  const saveEmailBtn = document.getElementById('save-email-btn');

  const API_BASE_URL = 'http://localhost:5000';

  const setStatus = (message, isError = false) => {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#fda4af' : '#94a3b8';
  };

  const getStoredEmail = async () => {
    const result = await chrome.storage.local.get(['userEmail']);
    const email = String(result.userEmail || '').trim().toLowerCase();
    return email;
  };

  const sendMessageToBackground = (message) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response || !response.success) {
          reject(new Error((response && response.error) || 'Request failed'));
          return;
        }

        resolve(response);
      });
    });
  };

  const fetchAnalytics = async () => {
    const userEmail = await getStoredEmail();

    if (!userEmail) {
      scoreEl.textContent = '--';
      focusEl.textContent = '0m';
      distractionEl.textContent = '0m';
      setStatus('Set email to enable tracking');
      return;
    }

    try {
      setStatus('Syncing...');

      const response = await fetch(`${API_BASE_URL}/api/analytics/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }

      const analytics = data.data;

      scoreEl.textContent = analytics.hasCategorizedData
        ? `${analytics.stabilityScore}%`
        : '--';
      focusEl.textContent = `${Math.round((analytics.totalFocusTime || 0) / 60)}m`;
      distractionEl.textContent = `${Math.round((analytics.totalDistractionTime || 0) / 60)}m`;

      if (analytics.hasAnyTrackedData) {
        setStatus(`Synced (${analytics.totalFocusTime + analytics.totalDistractionTime}s tracked)`);
      } else {
        setStatus('No activity tracked yet');
      }
    } catch (error) {
      setStatus(error.message || 'Failed to sync', true);
      console.error('Analytics fetch error:', error);
    }
  };

  saveEmailBtn.addEventListener('click', async () => {
    const nextEmail = emailInput.value.trim().toLowerCase();

    if (!nextEmail) {
      setStatus('Email is required', true);
      return;
    }

    try {
      setStatus('Saving email...');

      const result = await sendMessageToBackground({
        type: 'SET_EMAIL',
        email: nextEmail,
      });

      await fetchAnalytics();
      setStatus(`Email saved: ${nextEmail}`);

      console.log('Email saved and habits refreshed');
    } catch (error) {
      setStatus(error.message || 'Failed to save email', true);
      console.error('Email save error:', error);
    }
  });

  syncBtn.addEventListener('click', async () => {
    try {
      setStatus('Refreshing habits...');

      await sendMessageToBackground({
        type: 'REFRESH_HABITS',
      });

      await fetchAnalytics();
    } catch (error) {
      console.error('Sync error:', error);
      setStatus('Sync failed', true);
      
      await fetchAnalytics();
    }
  });

  const initializePopup = async () => {
    try {
      const storedEmail = await getStoredEmail();
      if (storedEmail) {
        emailInput.value = storedEmail;
      }

      try {
        await sendMessageToBackground({
          type: 'REFRESH_HABITS',
        });
        console.log('[Popup] Habits auto-refreshed on open');
      } catch (error) {
        console.log('[Popup] Habit refresh skipped:', error.message);
      }

      await fetchAnalytics();
    } catch (error) {
      console.error('Popup initialization error:', error);
      setStatus('Initialization failed', true);
    }
  };

  initializePopup();
});
