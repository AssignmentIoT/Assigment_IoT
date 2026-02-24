// =====================================================
// ESP32 IoT Dashboard - Enhanced JavaScript
// =====================================================

// WebSocket Configuration
const gateway = `ws://${window.location.hostname}/ws`;
let websocket;
let reconnectInterval;

// Data Storage
let sensorData = {
    temperature: [],
    humidity: [],
    timestamps: []
};

let systemInfo = {
    uptime: 0,
    freeHeap: 0,
    activeDevices: 0
};

// Charts
let tempChart, humidityChart;

// Gauges
let gaugeTemp, gaugeHumidity;

// =====================================================
// INITIALIZATION
// =====================================================

window.addEventListener('load', () => {
    initWebSocket();
    initGauges();
    initCharts();
    startUptimeCounter();
    
    // Set first nav item as active
    document.querySelector('.nav-item').classList.add('active');
});

// =====================================================
// WEBSOCKET FUNCTIONS
// =====================================================

function initWebSocket() {
    console.log('🔌 Attempting WebSocket connection...');
    websocket = new WebSocket(gateway);
    
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
    websocket.onerror = onError;
}

function onOpen(event) {
    console.log('✅ WebSocket Connected');
    updateConnectionStatus(true);
    showToast('success', 'Connected', 'WebSocket connection established');
    
    // Clear reconnect interval
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
    
    // Request initial data
    sendData({ action: 'getStatus' });
}

function onClose(event) {
    console.log('❌ WebSocket Disconnected');
    updateConnectionStatus(false);
    showToast('error', 'Disconnected', 'WebSocket connection lost. Reconnecting...');
    
    // Attempt reconnection
    if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
            console.log('🔄 Reconnecting...');
            initWebSocket();
        }, 3000);
    }
}

function onError(event) {
    console.error('⚠️ WebSocket Error:', event);
}

function onMessage(event) {
    console.log('📩 Received:', event.data);
    
    try {
        const data = JSON.parse(event.data);
        handleIncomingData(data);
    } catch (e) {
        console.warn('⚠️ Invalid JSON:', event.data);
    }
}

function sendData(data) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        const jsonData = JSON.stringify(data);
        websocket.send(jsonData);
        console.log('📤 Sent:', jsonData);
        return true;
    } else {
        console.warn('⚠️ WebSocket not ready');
        showToast('warning', 'Warning', 'WebSocket not connected');
        return false;
    }
}

function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('wsStatus');
    const statusText = document.getElementById('wsStatusText');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusDot.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

// =====================================================
// DATA HANDLING
// =====================================================

function handleIncomingData(data) {
    switch(data.type) {
        case 'sensor':
            updateSensorData(data);
            break;
        case 'led':
            updateLEDStatus(data);
            break;
        case 'neopixel':
            updateNeoPixel(data);
            break;
        case 'tinyml':
            updateTinyML(data);
            break;
        case 'system':
            updateSystemInfo(data);
            break;
        case 'i2c':
            updateI2CResults(data);
            break;
        case 'network':
            updateNetworkStatus(data);
            break;
        default:
            console.log('Unknown data type:', data.type);
    }
}

function updateSensorData(data) {
    const temp = data.temperature || 0;
    const humidity = data.humidity || 0;
    
    // Update gauges
    if (gaugeTemp) gaugeTemp.refresh(temp);
    if (gaugeHumidity) gaugeHumidity.refresh(humidity);
    
    // Update quick stats
    document.getElementById('quickTemp').textContent = `${temp.toFixed(1)}°C`;
    document.getElementById('quickHumidity').textContent = `${humidity.toFixed(1)}%`;
    
    // Update status badges
    updateTempStatus(temp);
    updateHumidityStatus(humidity);
    
    // Update LCD display
    document.getElementById('lcdLine1').textContent = `Temp: ${temp.toFixed(1)} C`;
    document.getElementById('lcdLine2').textContent = `Humidity: ${humidity.toFixed(1)} %`;
    
    // Store data for charts
    const now = new Date();
    sensorData.timestamps.push(now.toLocaleTimeString());
    sensorData.temperature.push(temp);
    sensorData.humidity.push(humidity);
    
    // Keep last 20 data points
    if (sensorData.timestamps.length > 20) {
        sensorData.timestamps.shift();
        sensorData.temperature.shift();
        sensorData.humidity.shift();
    }
    
    // Update charts
    updateCharts();
}

function updateTempStatus(temp) {
    const badge = document.getElementById('tempStatus');
    if (!badge) return;
    
    badge.className = 'status-badge';
    
    if (temp < 20) {
        badge.classList.add('normal');
        badge.textContent = 'Cold';
    } else if (temp >= 20 && temp < 30) {
        badge.classList.add('normal');
        badge.textContent = 'Normal';
    } else if (temp >= 30 && temp < 35) {
        badge.classList.add('warning');
        badge.textContent = 'Warning';
    } else {
        badge.classList.add('critical');
        badge.textContent = 'Critical';
    }
}

function updateHumidityStatus(humidity) {
    const badge = document.getElementById('humidityStatus');
    if (!badge) return;
    
    badge.className = 'status-badge';
    
    if (humidity < 40) {
        badge.classList.add('normal');
        badge.textContent = 'Low';
    } else if (humidity >= 40 && humidity < 70) {
        badge.classList.add('normal');
        badge.textContent = 'Normal';
    } else if (humidity >= 70 && humidity < 85) {
        badge.classList.add('warning');
        badge.textContent = 'High';
    } else {
        badge.classList.add('critical');
        badge.textContent = 'Critical';
    }
}

function updateLEDStatus(data) {
    const ledNum = data.led || 1;
    const state = data.state || false;
    const mode = data.mode || 'auto';
    
    const indicator = document.getElementById(`led${ledNum}Indicator`);
    const text = document.getElementById(`led${ledNum}Text`);
    const modeText = document.getElementById(`led${ledNum}ModeText`);
    
    if (indicator) {
        if (state) {
            indicator.classList.add('on');
        } else {
            indicator.classList.remove('on');
        }
    }
    
    if (text) {
        text.textContent = state ? 'ON' : 'OFF';
    }
    
    if (modeText) {
        modeText.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
}

function updateNeoPixel(data) {
    const color = data.color || '#0066ff';
    const level = data.level || 'Normal';
    const humidity = data.humidity || 0;
    
    const led = document.getElementById('neopixelLed');
    const colorText = document.getElementById('neopixelColor');
    const humidityText = document.getElementById('neopixelHumidity');
    
    if (led) {
        led.style.background = color;
        led.style.boxShadow = `0 0 30px ${color}, 0 0 60px ${color}`;
    }
    
    if (colorText) {
        const colorNames = {
            '#0000ff': 'Blue',
            '#00ff00': 'Green',
            '#ffff00': 'Yellow',
            '#ff0000': 'Red'
        };
        colorText.textContent = colorNames[color.toLowerCase()] || 'Unknown';
    }
    
    if (humidityText) {
        humidityText.textContent = level;
    }
}

function updateTinyML(data) {
    const prediction = data.prediction || 'Comfortable';
    const confidence = data.confidence || 87;
    const probabilities = data.probabilities || {
        comfortable: 87,
        hot: 8,
        cold: 3,
        humid: 2
    };
    
    // Update prediction display
    document.getElementById('predictionClass').textContent = prediction;
    document.getElementById('predictionConfidence').textContent = `${confidence}%`;
    
    // Update icon based on prediction
    const icon = document.querySelector('.prediction-result i');
    const iconMap = {
        'Comfortable': 'fa-smile',
        'Hot': 'fa-fire',
        'Cold': 'fa-snowflake',
        'Humid': 'fa-tint'
    };
    icon.className = `fas ${iconMap[prediction] || 'fa-smile'}`;
    
    // Update probability bars
    updateProbabilityBar('probComfort', probabilities.comfortable);
    updateProbabilityBar('probHot', probabilities.hot);
    updateProbabilityBar('probCold', probabilities.cold);
    updateProbabilityBar('probHumid', probabilities.humid);
}

function updateProbabilityBar(id, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(id + 'Text');
    
    if (bar) {
        bar.style.width = `${value}%`;
    }
    
    if (text) {
        text.textContent = `${value}%`;
    }
}

function updateSystemInfo(data) {
    systemInfo = { ...systemInfo, ...data };
    
    if (data.freeHeap) {
        document.getElementById('freeHeap').textContent = `${(data.freeHeap / 1024).toFixed(1)} KB`;
    }
    
    if (data.chipModel) {
        document.getElementById('chipModel').textContent = data.chipModel;
    }
    
    if (data.cpuFreq) {
        document.getElementById('cpuFreq').textContent = `${data.cpuFreq} MHz`;
    }
    
    if (data.flashSize) {
        document.getElementById('flashSize').textContent = `${data.flashSize} MB`;
    }
    
    if (data.activeDevices !== undefined) {
        systemInfo.activeDevices = data.activeDevices;
        document.getElementById('quickDevices').textContent = data.activeDevices;
    }
}

function updateI2CResults(data) {
    const results = document.getElementById('i2cResults');
    if (!results) return;
    
    if (data.devices && data.devices.length > 0) {
        let html = '<div style="display: grid; gap: 10px;">';
        data.devices.forEach(device => {
            html += `
                <div style="padding: 15px; background: white; border-radius: 8px; border-left: 4px solid var(--secondary);">
                    <strong>Address: 0x${device.address.toString(16).toUpperCase()}</strong>
                    <p style="margin-top: 5px; color: var(--gray); font-size: 14px;">${device.name || 'Unknown Device'}</p>
                </div>
            `;
        });
        html += '</div>';
        results.innerHTML = html;
    } else {
        results.innerHTML = '<p class="placeholder">No I2C devices found</p>';
    }
}

function updateNetworkStatus(data) {
    if (data.mode) {
        document.getElementById('wifiMode').textContent = data.mode === 'AP' ? 'Access Point Mode' : 'Station Mode';
    }
    
    if (data.ssid) {
        document.getElementById('wifiSSID').textContent = `SSID: ${data.ssid}`;
    }
    
    if (data.ip) {
        document.getElementById('wifiIP').textContent = `IP: ${data.ip}`;
    }
    
    if (data.cloudStatus) {
        document.getElementById('cloudStatus').textContent = data.cloudStatus;
    }
    
    if (data.lastPublish) {
        document.getElementById('lastPublish').textContent = `Last Publish: ${data.lastPublish}`;
    }
}

// =====================================================
// GAUGES
// =====================================================

function initGauges() {
    gaugeTemp = new JustGage({
        id: "gauge_temp",
        value: 25,
        min: -10,
        max: 50,
        title: "",
        label: "°C",
        donut: true,
        pointer: false,
        gaugeWidthScale: 0.6,
        customSectors: [
            { color: "#2563eb", lo: -10, hi: 20 },
            { color: "#10b981", lo: 20, hi: 30 },
            { color: "#f59e0b", lo: 30, hi: 35 },
            { color: "#ef4444", lo: 35, hi: 50 }
        ],
        counter: true,
        decimals: 1
    });
    
    gaugeHumidity = new JustGage({
        id: "gauge_humidity",
        value: 60,
        min: 0,
        max: 100,
        title: "",
        label: "%",
        donut: true,
        pointer: false,
        gaugeWidthScale: 0.6,
        customSectors: [
            { color: "#2563eb", lo: 0, hi: 40 },
            { color: "#10b981", lo: 40, hi: 70 },
            { color: "#f59e0b", lo: 70, hi: 85 },
            { color: "#ef4444", lo: 85, hi: 100 }
        ],
        counter: true,
        decimals: 1
    });
}

// =====================================================
// CHARTS
// =====================================================

function initCharts() {
    const chartConfig = {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    // Temperature Chart
    const tempCtx = document.getElementById('tempChart');
    if (tempCtx) {
        tempChart = new Chart(tempCtx, {
            ...chartConfig,
            data: {
                labels: sensorData.timestamps,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: sensorData.temperature,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            }
        });
    }
    
    // Humidity Chart
    const humidityCtx = document.getElementById('humidityChart');
    if (humidityCtx) {
        humidityChart = new Chart(humidityCtx, {
            ...chartConfig,
            data: {
                labels: sensorData.timestamps,
                datasets: [{
                    label: 'Humidity (%)',
                    data: sensorData.humidity,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            }
        });
    }
}

function updateCharts() {
    if (tempChart) {
        tempChart.data.labels = sensorData.timestamps;
        tempChart.data.datasets[0].data = sensorData.temperature;
        tempChart.update('none');
    }
    
    if (humidityChart) {
        humidityChart.data.labels = sensorData.timestamps;
        humidityChart.data.datasets[0].data = sensorData.humidity;
        humidityChart.update('none');
    }
}

// =====================================================
// NAVIGATION
// =====================================================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// =====================================================
// DEVICE CONTROLS
// =====================================================

function toggleLED(ledNum) {
    const indicator = document.getElementById(`led${ledNum}Indicator`);
    const isOn = indicator.classList.contains('on');
    
    sendData({
        type: 'led',
        led: ledNum,
        action: 'toggle',
        state: !isOn
    });
    
    showToast('info', 'Command Sent', `LED ${ledNum} toggle command sent`);
}

function setLEDMode(ledNum) {
    const select = document.getElementById(`led${ledNum}Mode`);
    const mode = select.value;
    
    sendData({
        type: 'led',
        led: ledNum,
        action: 'setMode',
        mode: mode
    });
    
    showToast('success', 'Mode Changed', `LED ${ledNum} mode set to ${mode}`);
}

// =====================================================
// THRESHOLD CONTROLS
// =====================================================

function updateThresholds() {
    const tempWarning = document.getElementById('tempWarning').value;
    const tempCritical = document.getElementById('tempCritical').value;
    const humidityWarning = document.getElementById('humidityWarning').value;
    const humidityCritical = document.getElementById('humidityCritical').value;
    
    sendData({
        type: 'thresholds',
        temperature: {
            warning: parseInt(tempWarning),
            critical: parseInt(tempCritical)
        },
        humidity: {
            warning: parseInt(humidityWarning),
            critical: parseInt(humidityCritical)
        }
    });
    
    showToast('success', 'Updated', 'Sensor thresholds updated successfully');
}

// =====================================================
// NETWORK FUNCTIONS
// =====================================================

function toggleWiFiMode() {
    const currentMode = document.getElementById('wifiMode').textContent;
    const newMode = currentMode.includes('Access Point') ? 'Station' : 'Access Point';
    
    if (confirm(`Switch to ${newMode} mode? This will restart the device.`)) {
        sendData({
            type: 'network',
            action: 'switchMode',
            mode: newMode === 'Access Point' ? 'AP' : 'STA'
        });
        
        showToast('info', 'Switching Mode', `Switching to ${newMode} mode...`);
    }
}

function testCloudConnection() {
    showLoading(true);
    
    sendData({
        type: 'network',
        action: 'testCloud'
    });
    
    setTimeout(() => {
        showLoading(false);
        showToast('success', 'Test Complete', 'Cloud connection test completed');
    }, 2000);
}

function saveNetworkConfig(event) {
    event.preventDefault();
    
    const config = {
        ssid: document.getElementById('wifiSSID').value,
        password: document.getElementById('wifiPassword').value,
        coreiotToken: document.getElementById('coreiotToken').value,
        coreiotServer: document.getElementById('coreiotServer').value,
        coreiotPort: document.getElementById('coreiotPort').value,
        publishInterval: document.getElementById('publishInterval').value
    };
    
    sendData({
        type: 'network',
        action: 'saveConfig',
        config: config
    });
    
    showToast('success', 'Saved', 'Network configuration saved successfully');
}

function scanI2CDevices() {
    showLoading(true);
    
    sendData({
        type: 'i2c',
        action: 'scan'
    });
    
    setTimeout(() => {
        showLoading(false);
    }, 2000);
}

// =====================================================
// SETTINGS FUNCTIONS
// =====================================================

function saveSettings() {
    const settings = {
        deviceName: document.getElementById('deviceName').value,
        timezone: document.getElementById('timezone').value,
        language: document.getElementById('language').value,
        tempAlerts: document.getElementById('tempAlerts').checked,
        humidityAlerts: document.getElementById('humidityAlerts').checked,
        cloudAlerts: document.getElementById('cloudAlerts').checked,
        enableLogging: document.getElementById('enableLogging').checked,
        logInterval: document.getElementById('logInterval').value
    };
    
    sendData({
        type: 'settings',
        action: 'save',
        settings: settings
    });
    
    showToast('success', 'Saved', 'Settings saved successfully');
}

function restartSystem() {
    if (confirm('Are you sure you want to restart the system?')) {
        sendData({
            type: 'system',
            action: 'restart'
        });
        
        showToast('info', 'Restarting', 'System is restarting...');
        
        setTimeout(() => {
            location.reload();
        }, 5000);
    }
}

function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
        sendData({
            type: 'settings',
            action: 'reset'
        });
        
        showToast('success', 'Reset', 'Settings reset to defaults');
    }
}

function factoryReset() {
    if (confirm('WARNING: This will erase all data and settings. Continue?')) {
        if (confirm('Are you absolutely sure? This cannot be undone.')) {
            sendData({
                type: 'system',
                action: 'factoryReset'
            });
            
            showToast('warning', 'Factory Reset', 'Performing factory reset...');
        }
    }
}

function downloadLogs() {
    showToast('info', 'Downloading', 'Preparing log file...');
    
    sendData({
        type: 'system',
        action: 'downloadLogs'
    });
}

// =====================================================
// UI HELPERS
// =====================================================

function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${iconMap[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// =====================================================
// UPTIME COUNTER
// =====================================================

function startUptimeCounter() {
    setInterval(() => {
        systemInfo.uptime++;
        const hours = Math.floor(systemInfo.uptime / 3600);
        const minutes = Math.floor((systemInfo.uptime % 3600) / 60);
        const seconds = systemInfo.uptime % 60;
        
        const uptimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('quickUptime').textContent = uptimeStr;
    }, 1000);
}

// =====================================================
// SIMULATION (For testing without ESP32)
// =====================================================

function startSimulation() {
    console.log('🔧 Starting simulation mode...');
    
    setInterval(() => {
        const temp = 20 + Math.random() * 15;
        const humidity = 40 + Math.random() * 40;
        
        updateSensorData({
            temperature: temp,
            humidity: humidity
        });
        
        // Simulate TinyML prediction
        let prediction = 'Comfortable';
        let probabilities = { comfortable: 70, hot: 15, cold: 10, humid: 5 };
        
        if (temp > 30) {
            prediction = 'Hot';
            probabilities = { comfortable: 10, hot: 75, cold: 5, humid: 10 };
        } else if (temp < 20) {
            prediction = 'Cold';
            probabilities = { comfortable: 15, hot: 5, cold: 70, humid: 10 };
        } else if (humidity > 70) {
            prediction = 'Humid';
            probabilities = { comfortable: 10, hot: 10, cold: 10, humid: 70 };
        }
        
        updateTinyML({
            prediction: prediction,
            confidence: probabilities[prediction.toLowerCase()],
            probabilities: probabilities
        });
        
        // Simulate NeoPixel
        let color = '#00ff00';
        let level = 'Normal';
        if (humidity < 40) {
            color = '#0000ff';
            level = 'Low';
        } else if (humidity > 70) {
            color = '#ffff00';
            level = 'High';
        } else if (humidity > 85) {
            color = '#ff0000';
            level = 'Critical';
        }
        
        updateNeoPixel({
            color: color,
            level: level,
            humidity: humidity
        });
        
    }, 3000);
    
    // Simulate system info
    updateSystemInfo({
        freeHeap: 150000 + Math.random() * 50000,
        chipModel: 'ESP32-S3',
        cpuFreq: 240,
        flashSize: 8,
        activeDevices: 2
    });
}

// Uncomment the line below to test without ESP32
// startSimulation();