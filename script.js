// ==================== DOM Elements ====================
const btn = document.querySelector("#btn");
const content = document.querySelector("#content");
const voiceContainer = document.querySelector("#voiceContainer");
const chatMessages = document.querySelector("#chatMessages");
const textInput = document.querySelector("#textInput");
const sendBtn = document.querySelector("#sendBtn");
const clearChat = document.querySelector("#clearChat");
const settingsToggle = document.querySelector("#settingsToggle");
const settingsPanel = document.querySelector("#settingsPanel");
const apiKeyInput = document.querySelector("#apiKey");
const voiceSelect = document.querySelector("#voiceSelect");
const voiceSpeed = document.querySelector("#voiceSpeed");
const speedValue = document.querySelector("#speedValue");
const saveSettings = document.querySelector("#saveSettings");
const typingIndicator = document.querySelector("#typingIndicator");
const quickBtns = document.querySelectorAll(".quick-btn");

// ==================== Configuration ====================
let config = {
    apiKey: localStorage.getItem('openrouter_api_key') || '',
    voiceIndex: parseInt(localStorage.getItem('voice_index')) || 0,
    voiceSpeed: parseFloat(localStorage.getItem('voice_speed')) || 1
};

// Chat history for context
let chatHistory = [];

// ==================== Speech Synthesis ====================
let voices = [];

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (index === config.voiceIndex) option.selected = true;
        voiceSelect.appendChild(option);
    });
}

// Load voices when available
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}
loadVoices();

function speak(text, callback) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.voiceSpeed;
    utterance.pitch = 0.9;
    utterance.volume = 1;
    
    if (voices.length > 0 && voices[config.voiceIndex]) {
        utterance.voice = voices[config.voiceIndex];
    }
    
    utterance.onend = () => {
        if (callback) callback();
    };
    
    window.speechSynthesis.speak(utterance);
}

// ==================== Greeting ====================
function wishMe() {
    const hours = new Date().getHours();
    let greeting;
    
    if (hours >= 0 && hours < 12) {
        greeting = "Good Morning Adil Ijaz! Welcome back.";
    } else if (hours >= 12 && hours < 16) {
        greeting = "Good Afternoon Adil Ijaz! How can I assist you?";
    } else {
        greeting = "Good Evening Adil Ijaz! Ready to help you.";
    }
    
    speak(greeting);
    addMessage(greeting, 'ai');
}

window.addEventListener('load', () => {
    // Load saved settings
    apiKeyInput.value = config.apiKey;
    voiceSpeed.value = config.voiceSpeed;
    speedValue.textContent = `${config.voiceSpeed}x`;
    
    setTimeout(wishMe, 1000);
});

// ==================== Speech Recognition ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        voiceContainer.classList.add('active');
        btn.classList.add('listening');
        content.innerText = "Listening...";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        content.innerText = transcript;
        processMessage(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceContainer.classList.remove('active');
        btn.classList.remove('listening');
        content.innerText = "Click to speak";
        showToast("Couldn't hear you. Please try again.");
    };
    
    recognition.onend = () => {
        voiceContainer.classList.remove('active');
        btn.classList.remove('listening');
        content.innerText = "Click to speak";
    };
}

// ==================== Message Handling ====================
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        ${text}
        <span class="message-time">${time}</span>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add to chat history for context
    chatHistory.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: text
    });
    
    // Keep only last 10 messages for context
    if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(-10);
    }
}

function showTyping() {
    typingIndicator.classList.add('active');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    typingIndicator.classList.remove('active');
}

// ==================== OpenRouter API ====================
async function getAIResponse(message) {
    if (!config.apiKey) {
        return "Please set your OpenRouter API key in settings to enable AI responses. Click the gear icon in the top right corner.";
    }
    
    showTyping();
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Aiora Virtual Assistant',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are Aiora, a helpful and friendly virtual assistant developed by Adil Ijaz. 
                        You are speaking with Adil Ijaz. Keep responses concise, helpful, and conversational.
                        You can help with questions, tasks, and general conversation.
                        When asked about yourself, mention you were created by Adil Ijaz.`
                    },
                    ...chatHistory.slice(-6),
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        hideTyping();
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', errorData);
            if (response.status === 401) {
                return "Invalid API key. Please check your OpenRouter API key in settings.";
            }
            return "I'm having trouble connecting to my AI brain. Please try again.";
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        hideTyping();
        console.error('Error:', error);
        return "I'm having trouble connecting. Please check your internet connection.";
    }
}

// ==================== Command Processing ====================
async function processMessage(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Check for built-in commands first
    const commandResponse = handleBuiltInCommands(lowerMessage);
    
    if (commandResponse) {
        if (commandResponse.action) {
            speak(commandResponse.text, commandResponse.action);
        } else {
            speak(commandResponse.text);
        }
        addMessage(commandResponse.text, 'ai');
    } else {
        // Use AI for general queries
        const aiResponse = await getAIResponse(message);
        addMessage(aiResponse, 'ai');
        speak(aiResponse);
    }
}

function handleBuiltInCommands(message) {
    // Greeting commands
    if (message.includes("hello") || message.includes("hey") || message.includes("hi")) {
        return { text: "Hello Adil Ijaz! What can I help you with today?" };
    }
    
    // Identity commands
    if (message.includes("who are you")) {
        return { text: "I am Aiora, your virtual assistant. I was developed by Adil Ijaz to help you with various tasks and answer your questions." };
    }
    
    if (message.includes("who developed you") || message.includes("who made you") || message.includes("who created you")) {
        return { text: "I was developed by Adil Ijaz, a talented Front-end Developer and Computer Science student." };
    }
    
    // Time and date
    if (message.includes("time")) {
        const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
        return { text: `The current time is ${time}` };
    }
    
    if (message.includes("date")) {
        const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return { text: `Today is ${date}` };
    }
    
    // Website commands
    const websites = {
        "open youtube": { url: "https://youtube.com/", name: "YouTube" },
        "open google": { url: "https://google.com/", name: "Google" },
        "open facebook": { url: "https://facebook.com/", name: "Facebook" },
        "open instagram": { url: "https://instagram.com/", name: "Instagram" },
        "open spotify": { url: "https://open.spotify.com/", name: "Spotify" },
        "open whatsapp": { url: "https://web.whatsapp.com/", name: "WhatsApp" },
        "open linkedin": { url: "https://www.linkedin.com/", name: "LinkedIn" },
        "open github": { url: "https://github.com/", name: "GitHub" },
        "open twitter": { url: "https://twitter.com/", name: "Twitter" },
        "open chatgpt": { url: "https://chat.openai.com/", name: "ChatGPT" },
        "open chat gpt": { url: "https://chat.openai.com/", name: "ChatGPT" }
    };
    
    for (const [command, site] of Object.entries(websites)) {
        if (message.includes(command)) {
            return {
                text: `Opening ${site.name} for you...`,
                action: () => window.open(site.url, "_blank")
            };
        }
    }
    
    // Play music on Spotify
    if (message.includes("play")) {
        const song = message.replace("play", "").trim();
        if (song) {
            return {
                text: `Playing ${song} on Spotify...`,
                action: () => window.open(`https://open.spotify.com/search/${encodeURIComponent(song)}`, "_blank")
            };
        }
        return { text: "What would you like me to play?" };
    }
    
    // Search commands
    if (message.includes("search for") || message.includes("google")) {
        const query = message.replace("search for", "").replace("google", "").trim();
        if (query) {
            return {
                text: `Searching for ${query}...`,
                action: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank")
            };
        }
    }
    
    // No built-in command found, return null to use AI
    return null;
}

// ==================== Event Listeners ====================

// Voice button
btn.addEventListener("click", () => {
    if (recognition) {
        recognition.start();
    } else {
        showToast("Speech recognition is not supported in your browser.");
    }
});

// Text input
textInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && textInput.value.trim()) {
        processMessage(textInput.value.trim());
        textInput.value = "";
    }
});

sendBtn.addEventListener("click", () => {
    if (textInput.value.trim()) {
        processMessage(textInput.value.trim());
        textInput.value = "";
    }
});

// Clear chat
clearChat.addEventListener("click", () => {
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-robot"></i>
            <p>Hello! I'm Aiora, your AI assistant. How can I help you today?</p>
        </div>
    `;
    chatHistory = [];
    showToast("Chat cleared!");
});

// Settings
settingsToggle.addEventListener("click", () => {
    settingsPanel.classList.toggle("active");
});

// Close settings when clicking outside
document.addEventListener("click", (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove("active");
    }
});

// Voice speed slider
voiceSpeed.addEventListener("input", () => {
    speedValue.textContent = `${voiceSpeed.value}x`;
});

// Save settings
saveSettings.addEventListener("click", () => {
    config.apiKey = apiKeyInput.value.trim();
    config.voiceIndex = parseInt(voiceSelect.value);
    config.voiceSpeed = parseFloat(voiceSpeed.value);
    
    localStorage.setItem('openrouter_api_key', config.apiKey);
    localStorage.setItem('voice_index', config.voiceIndex);
    localStorage.setItem('voice_speed', config.voiceSpeed);
    
    settingsPanel.classList.remove("active");
    showToast("Settings saved successfully!");
});

// Quick action buttons
quickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const command = btn.dataset.command;
        processMessage(command);
    });
});

// ==================== Toast Notification ====================
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==================== Initialize ====================
console.log("🤖 Aiora Virtual Assistant initialized successfully!");
console.log("📝 Developed by Adil Ijaz");