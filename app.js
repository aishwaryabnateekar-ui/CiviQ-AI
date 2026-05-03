document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let isAdmin = false;
    const queryHistory = [];

    // --- DOM Elements ---
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Home Tab
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const personaRadios = document.querySelectorAll('input[name="persona"]');
    const quickBtns = document.querySelectorAll('.quick-btn');

    // Admin Tab
    const adminLoginArea = document.getElementById('admin-login-area');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminPassword = document.getElementById('admin-password');
    const adminLoginError = document.getElementById('admin-login-error');
    
    const adminDashboardArea = document.getElementById('admin-dashboard-area');
    const adminCommandForm = document.getElementById('admin-command-form');
    const adminCommandInput = document.getElementById('admin-command-input');
    const adminOutputContainer = document.getElementById('admin-output-container');

    // History Tab
    const historyList = document.getElementById('history-list');

    // --- AI Responses Data ---
    const responses = {
        'first-time': {
            scenario: "You are a first-time voter preparing for the upcoming election...",
            steps: [
                "<strong>Register to Vote:</strong> Check your eligibility and register online or in person.",
                "<strong>Research Candidates:</strong> Look up what candidates and propositions are on your local ballot.",
                "<strong>Find Polling Place:</strong> Use your county's website to find your exact voting location.",
                "<strong>Vote:</strong> Bring your ID (if required) and cast your ballot on Election Day."
            ],
            mistakes: "Assuming you are automatically registered when you turn 18. You must actively register in most states!",
            summary: "Register, research, locate your polling place, and vote.",
            quiz: {
                question: "What should you check before heading to the polls?",
                options: ["What time the sun sets", "Your exact polling location and ID requirements", "How long the line is"],
                answer: 1
            },
            followUp: "Would you like help finding your local polling place or checking your voter registration status?"
        },
        'student': {
            scenario: "You are a college student deciding whether to vote in your hometown or college town...",
            steps: [
                "<strong>Choose Your Residency:</strong> Decide whether to register using your hometown address or campus address. You can only choose one.",
                "<strong>Register/Update:</strong> Update your registration to the chosen address.",
                "<strong>Request Absentee (If needed):</strong> If voting in your hometown while at school, request a mail-in/absentee ballot early.",
                "<strong>Mail it Back:</strong> Follow the exact signature instructions and mail the ballot before the deadline."
            ],
            mistakes: "Registering to vote in both your college town and hometown, or forgetting to sign the absentee envelope exactly as required.",
            summary: "Choose your voting location, request an absentee ballot if away, and follow signature rules carefully.",
            quiz: {
                question: "If you live out of state for college, where can you vote?",
                options: ["Only in your home state", "Only in your college state", "You must choose one to establish residency and vote there"],
                answer: 2
            },
            followUp: "Do you need help looking up the absentee ballot deadlines for your home state?"
        },
        'general': {
            scenario: "You are preparing to vote in the upcoming general election...",
            steps: [
                "<strong>Verify Registration:</strong> Ensure your voter registration is active and the address is current.",
                "<strong>Review the Ballot:</strong> Look up a sample ballot to see all candidates and referendums.",
                "<strong>Make a Plan:</strong> Decide if you will vote early, by mail, or on Election Day.",
                "<strong>Cast Ballot:</strong> Submit your vote securely."
            ],
            mistakes: "Missing the registration deadline, or forgetting to check local identification rules.",
            summary: "Verify your status, make a voting plan, and cast your ballot.",
            quiz: {
                question: "Why should you look up a sample ballot?",
                options: ["To see the answers", "To research down-ballot candidates and local issues beforehand", "To register to vote"],
                answer: 1
            },
            followUp: "Would you like some recommendations on where to find reliable, non-partisan voter guides for your local area?"
        }
    };



    // --- Helper Functions ---
    function getSelectedPersona() {
        const selected = document.querySelector('input[name="persona"]:checked');
        return selected ? selected.value : 'first-time';
    }

    function addMessage(content, isUser = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.style.display = 'flex';
        messageWrapper.style.marginBottom = '15px';
        messageWrapper.className = 'chat-bubble';
        
        if (isUser) {
            messageWrapper.style.justifyContent = 'flex-end';
            messageWrapper.innerHTML = `
                <div style="background:#2563eb; padding:10px 15px; border-radius:12px; max-width:60%;">
                    ${content}
                </div>
            `;
        } else {
            messageWrapper.style.justifyContent = 'flex-start';
            messageWrapper.innerHTML = `
                <div style="background:#1e293b; padding:15px; border-radius:12px; max-width:70%; line-height:1.6; border: 1px solid rgba(255,255,255,0.05);">
                    ${content}
                </div>
            `;
        }
        
        chatMessages.appendChild(messageWrapper);
        scrollToBottom();
    }

    function addTypingIndicator() {
        const indicatorWrapper = document.createElement('div');
        indicatorWrapper.style.display = 'flex';
        indicatorWrapper.style.justifyContent = 'flex-start';
        indicatorWrapper.style.marginBottom = '15px';
        indicatorWrapper.className = 'chat-bubble';

        indicatorWrapper.innerHTML = `
            <div style="background:#1e293b; padding:15px; border-radius:12px; display: flex; gap: 8px; align-items: center; height: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>
                <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>
                <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both;"></div>
            </div>
            <style>
                @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            </style>
        `;
        chatMessages.appendChild(indicatorWrapper);
        scrollToBottom();
        return indicatorWrapper;
    }

    function setTypingIndicator(container) {
        // Used for Admin panel output
        container.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center; height: 30px;">
                <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>
                <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>
                <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both;"></div>
            </div>
        `;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateHistoryUI() {
        if (queryHistory.length === 0) {
            historyList.innerHTML = '<li style="color: #64748b; list-style: none; margin-left: -20px;"><em>No queries yet.</em></li>';
        } else {
            // Reverse so newest is on top
            historyList.innerHTML = [...queryHistory].reverse().map(q => `<li style="margin-bottom: 10px;">${q}</li>`).join('');
        }
    }

    function generateAIResponseHTML() {
        const persona = getSelectedPersona();
        const data = responses[persona];

        // Ensure we handle clicks globally since it's injected HTML
        window.handleQuizAnswer = (selectedIdx, correctIdx) => {
            alert(selectedIdx === correctIdx ? 'Correct!' : 'Incorrect. Try again!');
        };

        return `
            <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-left: 4px solid #6366f1; border-radius: 4px 8px 8px 4px; margin-bottom: 20px;">
                <strong style="color: #818cf8;">Scenario:</strong> ${data.scenario}
            </div>
            
            <h4 style="color: white; margin-bottom: 10px;">Recommended Steps</h4>
            <ol style="margin-left: 20px; margin-bottom: 20px;">
                ${data.steps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
            </ol>

            <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px 8px 8px 4px; margin-bottom: 20px;">
                <strong style="color: #fbbf24; display: block; margin-bottom: 5px;">Common Mistake</strong>
                <p style="margin: 0; color: #fcd34d;">${data.mistakes}</p>
            </div>

            <h4 style="color: white; margin-bottom: 10px;">Summary</h4>
            <p style="margin-bottom: 20px;">${data.summary}</p>

            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 8px;">
                <h4 style="color: #34d399; margin-top: 0; margin-bottom: 15px;">Quick Quiz</h4>
                <p style="margin-bottom: 15px;">${data.quiz.question}</p>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${data.quiz.options.map((opt, i) => `
                        <li onclick="window.handleQuizAnswer(${i}, ${data.quiz.answer})" 
                            style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
                            ${opt}
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div style="margin-top: 20px; padding: 15px; border-radius: 8px; background: rgba(99, 102, 241, 0.05); border-left: 4px solid #8b5cf6;">
                <strong style="color: #a78bfa;">Follow-up Question:</strong>
                <p style="margin: 5px 0 0 0; color: #e2e8f0;">${data.followUp}</p>
            </div>
        `;
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        // Save history and update History Tab
        queryHistory.push(text);
        updateHistoryUI();

        // UI Feedback
        chatInput.value = '';
        chatInput.disabled = true;
        addMessage(text, true); // Add User message bubble
        
        const typingIndicator = addTypingIndicator(); // Add typing bubble

        // Simulate network delay
        setTimeout(() => {
            typingIndicator.remove(); // Remove typing bubble
            const responseHtml = generateAIResponseHTML();
            addMessage(responseHtml, false); // Add AI message bubble
            
            chatInput.disabled = false;
            chatInput.focus();
        }, 1200);
    });

    personaRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const labels = { 'first-time': 'First-Time Voter', 'student': 'College Student', 'general': 'General Public' };
            const msg = `<em style="color: #64748b; font-size: 13px;">Persona switched to <strong>${labels[e.target.value]}</strong>. Ask a new question to generate a tailored scenario.</em>`;
            addMessage(msg, false);
        });
    });

    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.getAttribute('data-query');
            chatForm.dispatchEvent(new Event('submit'));
        });
    });

    // --- Admin Tab Logic ---
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = adminPassword.value.trim();
        
        if (pwd === 'admin123') {
            isAdmin = true;
            adminLoginError.textContent = '';
            adminPassword.value = '';
            
            // Switch view
            adminLoginArea.style.display = 'none';
            adminDashboardArea.style.display = 'block';
            adminOutputContainer.innerHTML = '<em style="color: #64748b;">Awaiting command...</em>';
        } else {
            adminLoginError.textContent = 'Invalid admin credentials.';
        }
    });

    adminCommandForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmd = adminCommandInput.value.trim().toLowerCase();
        if (!cmd) return;

        adminCommandInput.value = '';
        adminCommandInput.disabled = true;
        setTypingIndicator(adminOutputContainer);

        setTimeout(() => {
            if (cmd === 'show latest entries') {
                if (queryHistory.length === 0) {
                    adminOutputContainer.innerHTML = '<p>No recent user queries.</p>';
                } else {
                    const historyHTML = queryHistory.slice(-3).reverse().map((q, i) => `<li style="margin-bottom: 8px;">"${q}"</li>`).join('');
                    adminOutputContainer.innerHTML = `<ul style="margin-left: 20px;">${historyHTML}</ul>`;
                }
            } else if (cmd === 'system status') {
                adminOutputContainer.innerHTML = '<p>System Status: <strong style="color: #34d399;">Active</strong> 🟢</p>';
            } else if (cmd === 'admin logout') {
                isAdmin = false;
                adminDashboardArea.style.display = 'none';
                adminLoginArea.style.display = 'block';
                adminLoginError.textContent = 'Successfully logged out.';
            } else {
                adminOutputContainer.innerHTML = '<p style="color: #ef4444;">Unknown admin command. Available commands: <em>show latest entries</em>, <em>system status</em>, <em>admin logout</em>.</p>';
            }
            adminCommandInput.disabled = false;
            adminCommandInput.focus();
        }, 600);
    });

});
