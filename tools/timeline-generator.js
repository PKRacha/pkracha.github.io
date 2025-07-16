// Timeline Generator JavaScript
class TimelineGenerator {
    constructor() {
        this.chart = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateTimeline());
        }

        // Settings modal functionality
        const settingsBtn = document.getElementById('settings-btn');
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.querySelector('.close');
        const saveBtn = document.getElementById('save-settings');
        const testBtn = document.getElementById('test-api');
        const apiKeyInput = document.getElementById('api-key-input');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSettingsModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => this.testAPI());
        }

        // Debug functionality
        const clearDebugBtn = document.getElementById('clear-debug');
        if (clearDebugBtn) {
            clearDebugBtn.addEventListener('click', () => this.clearDebugInfo());
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSettingsModal();
                }
            });
        }

        // Initialize settings
        this.initializeSettings();
    }

    async generateTimeline() {
        const subject = document.getElementById('timeline-subject').value.trim();
        const type = document.getElementById('timeline-type').value;
        const period = document.getElementById('timeline-period').value;
        const detail = document.getElementById('timeline-detail').value;

        if (!subject) {
            alert('Please enter a subject for the timeline');
            return;
        }

        // Show loading
        this.showLoading();

        try {
            // Generate timeline using AI
            const timeline = await this.generateAITimeline(subject, type, period, detail);
            
            console.log('Generated timeline:', timeline); // Debug log
            
            if (timeline && timeline.events && timeline.events.length > 0) {
                this.displayTimeline(timeline);
                this.updateChart(timeline);
                this.generateAISummary(timeline);
            } else {
                console.error('Invalid timeline data:', timeline);
                this.showError('Unable to generate timeline. Please try again.');
            }
        } catch (error) {
            console.error('Timeline generation error:', error);
            this.showError('Error generating timeline. Please try again.');
        }
    }

    async generateAITimeline(subject, type, period, detail) {
        const apiKey = this.getGoogleAIKey();
        
        if (!apiKey) {
            console.log('No Google AI API key configured, using local timeline data');
            return this.generateLocalTimeline(subject, type, period, detail);
        }
        
        try {
            // Try AI API first, fallback to local if it fails
            console.log('Attempting AI timeline generation for:', subject);
            
            const timeline = await this.callAITimelineAPI(subject, type, period, detail);
            if (timeline && timeline.events && timeline.events.length > 0) {
                console.log('AI timeline generated successfully');
                return timeline;
            } else {
                console.log('AI failed, using local timeline');
                return this.generateLocalTimeline(subject, type, period, detail);
            }
        } catch (error) {
            console.error('AI timeline generation error:', error);
            return this.generateLocalTimeline(subject, type, period, detail);
        }
    }

    async callAITimelineAPI(subject, type, period, detail) {
        // Google AI API configuration
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        
        // Get API key from environment
        let apiKey = this.getGoogleAIKey();
        if (!apiKey) {
            throw new Error('No Google AI API key configured');
        }
        
        const detailCount = detail === 'high' ? 10 : detail === 'medium' ? 7 : 5;
        
        const systemPrompt = `You are a helpful assistant that generates accurate historical timelines in JSON format. 
        Always return valid JSON with the exact structure requested. 
        Include real, factual information and ensure events are chronologically ordered.`;
        
        const userPrompt = `Generate a detailed timeline for ${subject} (${type}) with ${detailCount} key events.
        
        Focus on the ${period} period. Include significant milestones, achievements, and important dates.
        
        Return ONLY a valid JSON object in this exact format:
        {
            "events": [
                {"year": "YYYY", "title": "Event Title", "description": "Detailed description of the event"}
            ]
        }
        
        Make sure the events are chronologically ordered and include real, factual information.`;

        try {
            console.log('Making Google AI API call for:', subject);
            
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${systemPrompt}\n\n${userPrompt}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1500,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.candidates[0].content.parts[0].text;
                console.log('Google AI response:', content);
                return this.parseAIResponse(content);
            } else {
                const errorData = await response.json();
                console.error('Google AI API error:', errorData);
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('AI API call failed:', error);
            throw error;
        }
    }

    getGoogleAIKey() {
        // First try to get API key from localStorage (for user's own key)
        let apiKey = localStorage.getItem('google_ai_api_key');
        
        // If no user key, use the default API key
        if (!apiKey) {
            apiKey = this.getDefaultAPIKey();
        }
        
        return apiKey;
    }

    getDefaultAPIKey() {
        // Your Google AI API key - replace with your actual key
        return 'AIzaSyBYJ7X4uEBHXviRChjSPxF7IGKlhlbXiKg';
    }

    initializeSettings() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiStatus = document.getElementById('api-status');
        
        if (apiKeyInput) {
            const savedKey = localStorage.getItem('google_ai_api_key');
            if (savedKey) {
                // User has their own key
                apiKeyInput.value = savedKey;
                this.updateAPIStatus('configured');
            } else {
                // Use default key
                apiKeyInput.value = '';
                this.updateAPIStatus('using-default');
            }
        }
        
        // Update debug information
        this.updateDebugInfo();
    }

    showAISetupNotification() {
        // Check if user has seen the notification before
        if (localStorage.getItem('ai_notification_shown')) {
            return;
        }
        
        // Don't show notification if using default key
        const userKey = localStorage.getItem('google_ai_api_key');
        if (!userKey) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = 'ai-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>🤖 AI-Powered Timeline Generation</h4>
                <p>Configure your Google AI API key to enable AI-powered timeline generation for any subject!</p>
                <div class="notification-actions">
                    <button class="setup-btn" onclick="timelineGenerator.openSettingsModal()">Setup AI</button>
                    <button class="dismiss-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Dismiss</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mark as shown
        setTimeout(() => {
            localStorage.setItem('ai_notification_shown', 'true');
        }, 5000);
    }

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveSettings() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiKey = apiKeyInput.value.trim();
        
        if (apiKey) {
            // User provided their own key
            localStorage.setItem('google_ai_api_key', apiKey);
            this.updateAPIStatus('configured');
            this.closeSettingsModal();
            alert('Settings saved successfully! Your API key will be used.');
        } else {
            // User wants to use default key
            localStorage.removeItem('google_ai_api_key');
            this.updateAPIStatus('using-default');
            this.closeSettingsModal();
            alert('Settings saved! Using default API key.');
        }
    }

    async testAPI() {
        const apiKeyInput = document.getElementById('api-key-input');
        let apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            // Use default key for testing
            apiKey = this.getDefaultAPIKey();
            if (!apiKey || apiKey === 'YOUR_GOOGLE_AI_API_KEY_HERE') {
                alert('No API key available. Please enter your own Google AI API key or configure the default key.');
                return;
            }
        }

        // Validate API key format (Google AI keys are typically longer and don't have a specific prefix)
        if (apiKey.length < 20) {
            alert('Invalid API key format. Google AI API keys are typically longer. Please check your key and try again.');
            return;
        }

        const testBtn = document.getElementById('test-api');
        const originalText = testBtn.textContent;
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        try {
            console.log('Testing Google AI API with key:', apiKey.substring(0, 10) + '...');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: 'Hello! This is a test message.'
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 10
                    }
                })
            });

            console.log('API Response Status:', response.status);
            console.log('API Response Headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('API test successful:', data);
                const successMessage = 'API test successful! Your Google AI API key is working.';
                alert(successMessage);
                this.updateAPIStatus('configured');
                localStorage.setItem('last_api_test_result', successMessage);
            } else {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);
                
                let errorMessage = 'API test failed: ';
                
                if (errorData.error) {
                    switch (errorData.error.status) {
                        case 'INVALID_ARGUMENT':
                            errorMessage += 'Invalid request. Please check your API key format.';
                            break;
                        case 'UNAUTHENTICATED':
                            errorMessage += 'Authentication failed. Please check your API key.';
                            break;
                        case 'RESOURCE_EXHAUSTED':
                            errorMessage += 'Quota exceeded. Please check your Google AI account usage.';
                            break;
                        case 'PERMISSION_DENIED':
                            errorMessage += 'Permission denied. Please check your API key permissions.';
                            break;
                        default:
                            errorMessage += errorData.error.message || 'Unknown error occurred.';
                    }
                } else {
                    errorMessage += `HTTP ${response.status}: ${response.statusText}`;
                }
                
                alert(errorMessage);
                localStorage.setItem('last_api_test_result', errorMessage);
            }
        } catch (error) {
            console.error('Network or other error:', error);
            
            let errorMessage = 'API test failed: ';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Network error. Please check your internet connection.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            localStorage.setItem('last_api_test_result', errorMessage);
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    updateAPIStatus(status) {
        const apiStatus = document.getElementById('api-status');
        if (apiStatus) {
            switch (status) {
                case 'configured':
                    apiStatus.textContent = 'Configured (User Key)';
                    break;
                case 'using-default':
                    apiStatus.textContent = 'Using Default Key';
                    break;
                default:
                    apiStatus.textContent = 'Not configured';
            }
            apiStatus.className = `status-indicator ${status}`;
        }
        
        // Update debug information
        this.updateDebugInfo();
    }

    updateDebugInfo() {
        const debugKey = document.getElementById('debug-key');
        const debugFormat = document.getElementById('debug-format');
        const debugResult = document.getElementById('debug-result');
        
        const userKey = localStorage.getItem('google_ai_api_key');
        const apiKey = this.getGoogleAIKey();
        
        if (debugKey) {
            if (apiKey) {
                const keySource = userKey ? 'User Key' : 'Default Key';
                debugKey.textContent = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)} (${keySource})`;
            } else {
                debugKey.textContent = 'Not set';
            }
        }
        
        if (debugFormat) {
            if (apiKey && apiKey.length >= 20) {
                const keySource = userKey ? 'User Key' : 'Default Key';
                debugFormat.textContent = `Valid (${keySource})`;
                debugFormat.style.color = '#28a745';
            } else if (apiKey) {
                debugFormat.textContent = 'Invalid (too short)';
                debugFormat.style.color = '#dc3545';
            } else {
                debugFormat.textContent = 'No key set';
                debugFormat.style.color = '#6c757d';
            }
        }
        
        if (debugResult) {
            const lastResult = localStorage.getItem('last_api_test_result');
            if (lastResult) {
                debugResult.textContent = lastResult;
                debugResult.style.color = lastResult.includes('successful') ? '#28a745' : '#dc3545';
            } else {
                debugResult.textContent = 'None';
                debugResult.style.color = '#6c757d';
            }
        }
    }

    clearDebugInfo() {
        localStorage.removeItem('last_api_test_result');
        this.updateDebugInfo();
        alert('Debug information cleared.');
    }

    mockAIResponse(subject, type, period, detail) {
        // Mock AI responses for demonstration
        const mockResponses = {
            'elon musk': {
                events: [
                    { year: '1971', title: 'Birth', description: 'Born in Pretoria, South Africa to Maye and Errol Musk' },
                    { year: '1983', title: 'First Computer Game', description: 'Created and sold his first video game "Blastar" at age 12' },
                    { year: '1989', title: 'Moved to Canada', description: 'Emigrated to Canada to attend Queen\'s University' },
                    { year: '1995', title: 'Zip2 Founded', description: 'Co-founded Zip2 with his brother Kimbal, an online city guide software company' },
                    { year: '1999', title: 'X.com Founded', description: 'Founded X.com, an online financial services company' },
                    { year: '2000', title: 'PayPal Merger', description: 'X.com merged with Confinity to form PayPal' },
                    { year: '2002', title: 'SpaceX Founded', description: 'Founded Space Exploration Technologies (SpaceX) with the goal of reducing space transportation costs' },
                    { year: '2004', title: 'Tesla Investment', description: 'Joined Tesla Motors as chairman and lead investor, investing $6.5 million' },
                    { year: '2008', title: 'Tesla CEO', description: 'Became CEO of Tesla Motors after the financial crisis' },
                    { year: '2012', title: 'SpaceX Dragon Success', description: 'SpaceX Dragon becomes the first commercial spacecraft to dock with the International Space Station' },
                    { year: '2015', title: 'Tesla Model S Success', description: 'Tesla Model S becomes the best-selling electric car globally' },
                    { year: '2020', title: 'SpaceX Crew Dragon', description: 'SpaceX successfully launches first crewed commercial spaceflight to ISS' },
                    { year: '2022', title: 'Twitter Acquisition', description: 'Acquired Twitter for $44 billion and became CEO' },
                    { year: '2023', title: 'Tesla Cybertruck', description: 'Tesla begins production of the highly anticipated Cybertruck' }
                ]
            },
            'steve jobs': {
                events: [
                    { year: '1955', title: 'Birth', description: 'Born in San Francisco, California to Abdulfattah Jandali and Joanne Schieble' },
                    { year: '1972', title: 'Reed College', description: 'Attended Reed College but dropped out after one semester' },
                    { year: '1974', title: 'Atari Work', description: 'Worked at Atari as a technician, saving money for a spiritual trip to India' },
                    { year: '1976', title: 'Apple Founded', description: 'Co-founded Apple Computer with Steve Wozniak in his parents\' garage' },
                    { year: '1984', title: 'Macintosh Launch', description: 'Introduced the revolutionary Macintosh computer with the famous "1984" Super Bowl commercial' },
                    { year: '1985', title: 'Left Apple', description: 'Resigned from Apple after losing a power struggle with John Sculley' },
                    { year: '1986', title: 'Pixar Acquisition', description: 'Acquired Pixar from George Lucas for $10 million' },
                    { year: '1997', title: 'Return to Apple', description: 'Returned to Apple as CEO after Apple acquired NeXT' },
                    { year: '2001', title: 'iPod Launch', description: 'Introduced the iPod, revolutionizing the music industry' },
                    { year: '2007', title: 'iPhone Launch', description: 'Introduced the iPhone, changing mobile computing forever' },
                    { year: '2010', title: 'iPad Launch', description: 'Introduced the iPad, creating a new tablet category' },
                    { year: '2011', title: 'Death', description: 'Passed away from pancreatic cancer at age 56' }
                ]
            }
        };

        const key = subject.toLowerCase().trim();
        
        // Check for exact or partial matches
        for (const [mockKey, mockData] of Object.entries(mockResponses)) {
            if (key.includes(mockKey) || mockKey.includes(key)) {
                return mockData;
            }
        }

        // Generate dynamic timeline for unknown subjects
        return this.generateDynamicTimeline(subject, type, period, detail);
    }

    generateDynamicTimeline(subject, type, period, detail) {
        const currentYear = new Date().getFullYear();
        const detailCount = detail === 'high' ? 10 : detail === 'medium' ? 7 : 5;
        
        let events = [];
        
        switch (type) {
            case 'person':
                events = [
                    { year: '1950', title: 'Birth', description: `Birth of ${subject} - beginning of an influential life` },
                    { year: '1970', title: 'Early Education', description: `Educational achievements and formative experiences` },
                    { year: '1985', title: 'Career Beginnings', description: `Early professional work and initial successes` },
                    { year: '2000', title: 'Major Achievements', description: `Significant accomplishments and recognition` },
                    { year: '2015', title: 'Peak Influence', description: `Period of greatest impact and influence` },
                    { year: currentYear.toString(), title: 'Current Era', description: `Ongoing work and current activities` }
                ];
                break;
            case 'company':
                events = [
                    { year: '1980', title: 'Foundation', description: `Early establishment and founding of ${subject}` },
                    { year: '1990', title: 'Initial Growth', description: `Early expansion and market development` },
                    { year: '2000', title: 'Innovation Phase', description: `Key innovations and technological breakthroughs` },
                    { year: '2010', title: 'Market Leadership', description: `Achieving significant market position` },
                    { year: '2020', title: 'Digital Transformation', description: `Adaptation to modern digital landscape` },
                    { year: currentYear.toString(), title: 'Current Operations', description: `Current business activities and future direction` }
                ];
                break;
            case 'technology':
                events = [
                    { year: '1960', title: 'Early Research', description: `Initial research and development of ${subject}` },
                    { year: '1980', title: 'Breakthrough', description: `Major technological breakthrough and innovation` },
                    { year: '2000', title: 'Commercialization', description: `Widespread adoption and commercial applications` },
                    { year: '2010', title: 'Mass Adoption', description: `Became mainstream technology` },
                    { year: '2020', title: 'Modern Era', description: `Current state and future potential` }
                ];
                break;
            default:
                events = [
                    { year: '1900', title: 'Early Period', description: `Early developments and origins of ${subject}` },
                    { year: '1950', title: 'Growth Period', description: `Significant growth and development phase` },
                    { year: '2000', title: 'Modern Era', description: `Recent developments and current status` }
                ];
        }
        
        // Adjust number of events based on detail level
        if (events.length > detailCount) {
            events = events.slice(0, detailCount);
        }
        
        return { events: events };
    }

    buildPrompt(subject, type, period, detail) {
        const detailCount = detail === 'high' ? 10 : detail === 'medium' ? 7 : 5;
        
        return `Generate a timeline for ${subject} (${type}) with ${detailCount} key events. 
        Format as JSON: {"events": [{"year": "YYYY", "title": "Event Title", "description": "Event Description"}]}
        Focus on ${period} period. Include significant milestones, achievements, and important dates.`;
    }

    generateLocalTimeline(subject, type, period, detail) {
        // Local fallback timelines for common subjects
        const timelines = {
            'albert einstein': {
                events: [
                    { year: '1879', title: 'Birth', description: 'Born in Ulm, Germany' },
                    { year: '1896', title: 'Education', description: 'Enrolled at ETH Zurich' },
                    { year: '1905', title: 'Annus Mirabilis', description: 'Published four groundbreaking papers including Special Relativity' },
                    { year: '1921', title: 'Nobel Prize', description: 'Awarded Nobel Prize in Physics' },
                    { year: '1933', title: 'Emigration', description: 'Left Germany due to Nazi persecution' },
                    { year: '1955', title: 'Death', description: 'Passed away in Princeton, New Jersey' }
                ]
            },
            'apple inc': {
                events: [
                    { year: '1976', title: 'Founded', description: 'Founded by Steve Jobs and Steve Wozniak' },
                    { year: '1984', title: 'Macintosh', description: 'Released the first Macintosh computer' },
                    { year: '1997', title: 'Jobs Returns', description: 'Steve Jobs returns as CEO' },
                    { year: '2001', title: 'iPod', description: 'Released the first iPod' },
                    { year: '2007', title: 'iPhone', description: 'Revolutionary iPhone launched' },
                    { year: '2010', title: 'iPad', description: 'iPad tablet introduced' },
                    { year: '2011', title: 'Jobs Death', description: 'Steve Jobs passed away' }
                ]
            },
            'world war ii': {
                events: [
                    { year: '1939', title: 'War Begins', description: 'Germany invades Poland' },
                    { year: '1941', title: 'Pearl Harbor', description: 'Japan attacks Pearl Harbor' },
                    { year: '1944', title: 'D-Day', description: 'Allied invasion of Normandy' },
                    { year: '1945', title: 'Victory in Europe', description: 'Germany surrenders' },
                    { year: '1945', title: 'Atomic Bombs', description: 'Japan surrenders after atomic bombs' }
                ]
            },
            'steve jobs': {
                events: [
                    { year: '1955', title: 'Birth', description: 'Born in San Francisco, California' },
                    { year: '1976', title: 'Apple Founded', description: 'Co-founded Apple Computer with Steve Wozniak' },
                    { year: '1984', title: 'Macintosh Launch', description: 'Introduced the revolutionary Macintosh computer' },
                    { year: '1985', title: 'Left Apple', description: 'Resigned from Apple after power struggle' },
                    { year: '1986', title: 'Pixar Founded', description: 'Acquired Pixar from George Lucas' },
                    { year: '1997', title: 'Return to Apple', description: 'Returned to Apple as CEO' },
                    { year: '2001', title: 'iPod Launch', description: 'Introduced the iPod, revolutionizing music' },
                    { year: '2007', title: 'iPhone Launch', description: 'Introduced the iPhone, changing mobile computing' },
                    { year: '2011', title: 'Death', description: 'Passed away from pancreatic cancer' }
                ]
            },
            'microsoft': {
                events: [
                    { year: '1975', title: 'Founded', description: 'Founded by Bill Gates and Paul Allen' },
                    { year: '1981', title: 'MS-DOS', description: 'Released MS-DOS for IBM PCs' },
                    { year: '1985', title: 'Windows 1.0', description: 'Released first version of Windows' },
                    { year: '1995', title: 'Windows 95', description: 'Revolutionary Windows 95 launch' },
                    { year: '2001', title: 'Xbox Launch', description: 'Entered gaming market with Xbox' },
                    { year: '2008', title: 'Azure Cloud', description: 'Launched cloud computing platform' },
                    { year: '2014', title: 'Satya Nadella', description: 'Satya Nadella becomes CEO' }
                ]
            },
            'google': {
                events: [
                    { year: '1998', title: 'Founded', description: 'Founded by Larry Page and Sergey Brin' },
                    { year: '2000', title: 'AdWords', description: 'Launched advertising platform' },
                    { year: '2004', title: 'IPO', description: 'Went public on NASDAQ' },
                    { year: '2006', title: 'YouTube Acquisition', description: 'Acquired YouTube for $1.65 billion' },
                    { year: '2008', title: 'Chrome Browser', description: 'Launched Chrome web browser' },
                    { year: '2015', title: 'Alphabet Restructure', description: 'Restructured into Alphabet Inc.' }
                ]
            },
            'elon musk': {
                events: [
                    { year: '1971', title: 'Birth', description: 'Born in Pretoria, South Africa' },
                    { year: '1995', title: 'Zip2 Founded', description: 'Co-founded Zip2, his first tech company' },
                    { year: '1999', title: 'X.com (PayPal)', description: 'Founded X.com, which later became PayPal' },
                    { year: '2002', title: 'PayPal Sale', description: 'eBay acquired PayPal for $1.5 billion' },
                    { year: '2002', title: 'SpaceX Founded', description: 'Founded Space Exploration Technologies (SpaceX)' },
                    { year: '2004', title: 'Tesla Investment', description: 'Joined Tesla Motors as chairman and lead investor' },
                    { year: '2008', title: 'Tesla CEO', description: 'Became CEO of Tesla Motors' },
                    { year: '2012', title: 'SpaceX Success', description: 'SpaceX Dragon becomes first commercial spacecraft to dock with ISS' },
                    { year: '2015', title: 'Tesla Model S', description: 'Tesla Model S becomes best-selling electric car' },
                    { year: '2020', title: 'SpaceX Crew Dragon', description: 'First crewed commercial spaceflight to ISS' },
                    { year: '2022', title: 'Twitter Acquisition', description: 'Acquired Twitter for $44 billion' },
                    { year: '2023', title: 'Tesla Cybertruck', description: 'Tesla Cybertruck production begins' }
                ]
            }
        };

        const key = subject.toLowerCase().trim();
        
        // Try exact match first
        if (timelines[key]) {
            return { events: timelines[key].events };
        }
        
        // Try partial matches for better user experience
        for (const [timelineKey, timelineData] of Object.entries(timelines)) {
            if (key.includes(timelineKey) || timelineKey.includes(key)) {
                return { events: timelineData.events };
            }
        }

        // Generate a more intelligent generic timeline based on type
        return this.generateGenericTimeline(subject, type, period, detail);
    }

    generateGenericTimeline(subject, type, period, detail) {
        const currentYear = new Date().getFullYear();
        let events = [];
        
        switch (type) {
            case 'person':
                events = [
                    { year: '1950', title: 'Birth', description: `Birth of ${subject}` },
                    { year: '1970', title: 'Education', description: `Educational achievements and early career` },
                    { year: '1990', title: 'Career Peak', description: `Major professional accomplishments` },
                    { year: '2010', title: 'Recognition', description: `Awards and recognition for contributions` },
                    { year: currentYear.toString(), title: 'Current Status', description: `Current activities and ongoing work` }
                ];
                break;
            case 'company':
                events = [
                    { year: '1980', title: 'Foundation', description: `Early establishment of ${subject}` },
                    { year: '1995', title: 'Growth Phase', description: `Expansion and market development` },
                    { year: '2005', title: 'Innovation', description: `Key innovations and breakthroughs` },
                    { year: '2015', title: 'Market Leadership', description: `Achieving market position and success` },
                    { year: currentYear.toString(), title: 'Current Era', description: `Current operations and future direction` }
                ];
                break;
            case 'technology':
                events = [
                    { year: '1960', title: 'Early Development', description: `Initial research and development of ${subject}` },
                    { year: '1980', title: 'Breakthrough', description: `Major technological breakthrough` },
                    { year: '2000', title: 'Commercialization', description: `Widespread adoption and commercial use` },
                    { year: '2020', title: 'Modern Era', description: `Current state and future potential` }
                ];
                break;
            default:
                events = [
                    { year: '1900', title: 'Early Period', description: `Early developments in ${subject}` },
                    { year: '1950', title: 'Growth Period', description: `Significant growth and development` },
                    { year: '2000', title: 'Modern Era', description: `Recent developments and current status` }
                ];
        }
        
        return { events: events };
    }

    parseAIResponse(content) {
        try {
            // Try to extract JSON from the AI response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.events && Array.isArray(parsed.events)) {
                    return parsed;
                }
            }
            
            // If no valid JSON found, try to parse the content as plain JSON
            const parsed = JSON.parse(content);
            if (parsed.events && Array.isArray(parsed.events)) {
                return parsed;
            }
        } catch (error) {
            console.error('Failed to parse AI response:', error);
        }
        
        return null;
    }

    displayTimeline(timeline) {
        const container = document.getElementById('timeline-container');
        
        const timelineHTML = `
            <div class="timeline">
                ${timeline.events.map((event, index) => `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-year">${event.year}</div>
                            <h3 class="timeline-title">${event.title}</h3>
                            <p class="timeline-description">${event.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = timelineHTML;
    }

    updateChart(timeline) {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Sort events by year
        const sortedEvents = timeline.events.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        
        const labels = sortedEvents.map(event => event.year);
        const data = sortedEvents.map((event, index) => index + 1); // Sequential numbering for visualization

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Timeline Events',
                    data: data,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ff6b35',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Timeline Visualization'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: false
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                }
            }
        });
    }

    async generateAISummary(timeline) {
        const summaryDiv = document.getElementById('ai-summary');
        const summaryContent = summaryDiv.querySelector('.summary-content');
        
        // Show loading
        summaryContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating AI summary...</p>';

        try {
            // Try AI summary first, fallback to local
            const aiSummary = await this.generateAISummaryContent(timeline);
            if (aiSummary) {
                summaryContent.innerHTML = aiSummary;
            } else {
                summaryContent.innerHTML = this.getLocalSummary(timeline);
            }
        } catch (error) {
            console.error('AI summary error:', error);
            summaryContent.innerHTML = this.getLocalSummary(timeline);
        }
    }

    async generateAISummaryContent(timeline) {
        // Try Google AI API for summary generation
        let apiKey = this.getGoogleAIKey();
        if (!apiKey) {
            // Fallback to local summary generation
            return this.generateLocalSummaryContent(timeline);
        }

        try {
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
            const events = timeline.events;
            const subject = this.extractSubjectFromTimeline(timeline);
            
            const systemPrompt = `You are a helpful assistant that generates insightful timeline summaries. 
            Provide analysis that highlights key themes, significant events, and the overall impact of the timeline. 
            Format your response in HTML with proper tags for structure.`;
            
            const userPrompt = `Analyze this timeline for ${subject} and provide a comprehensive summary:
            
            ${JSON.stringify(events, null, 2)}
            
            Please provide:
            1. A brief overview of the timeline span and significance
            2. Key themes and patterns you identify
            3. The most significant events and their impact
            4. Overall analysis of the subject's influence and achievements
            
            Format your response in HTML with <p>, <strong>, <ul>, <li> tags for proper structure.`;

            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${systemPrompt}\n\n${userPrompt}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.candidates[0].content.parts[0].text;
                console.log('Google AI summary response:', content);
                return content;
            } else {
                const errorData = await response.json();
                console.error('Google AI summary API error:', errorData);
                return this.generateLocalSummaryContent(timeline);
            }
        } catch (error) {
            console.error('AI summary generation failed:', error);
            return this.generateLocalSummaryContent(timeline);
        }
    }

    generateLocalSummaryContent(timeline) {
        // Local fallback summary generation
        const subject = this.extractSubjectFromTimeline(timeline);
        const events = timeline.events;
        const startYear = events[0].year;
        const endYear = events[events.length - 1].year;
        const span = parseInt(endYear) - parseInt(startYear);
        
        // Generate a more sophisticated summary
        let summary = `<p><strong>Timeline Analysis:</strong></p>`;
        summary += `<p>This comprehensive timeline spans <strong>${span} years</strong> (${startYear} - ${endYear}) and captures ${events.length} pivotal moments in the journey of <strong>${subject}</strong>.</p>`;
        
        // Identify key themes
        const themes = this.identifyTimelineThemes(events);
        if (themes.length > 0) {
            summary += `<p><strong>Key Themes:</strong></p><ul>`;
            themes.forEach(theme => {
                summary += `<li>${theme}</li>`;
            });
            summary += `</ul>`;
        }
        
        // Highlight most significant events
        const significantEvents = this.getSignificantEvents(events);
        summary += `<p><strong>Most Significant Events:</strong></p><ul>`;
        significantEvents.forEach(event => {
            summary += `<li><strong>${event.year}</strong> - ${event.title}: ${event.description}</li>`;
        });
        summary += `</ul>`;
        
        summary += `<p><em>This timeline demonstrates the remarkable progression and impact of ${subject} across multiple decades, showing how individual achievements can shape entire industries and influence global change.</em></p>`;
        
        return summary;
    }

    extractSubjectFromTimeline(timeline) {
        // Try to extract subject from timeline events
        const firstEvent = timeline.events[0];
        if (firstEvent.description.includes('Born') || firstEvent.description.includes('Birth')) {
            // Extract name from birth description
            const match = firstEvent.description.match(/Born in.*?,\s*(.+?)$/);
            if (match) return match[1];
        }
        return 'this subject';
    }

    identifyTimelineThemes(events) {
        const themes = [];
        const descriptions = events.map(e => e.description.toLowerCase());
        
        if (descriptions.some(d => d.includes('found') || d.includes('co-found'))) {
            themes.push('Entrepreneurship and Innovation');
        }
        if (descriptions.some(d => d.includes('launch') || d.includes('introduce'))) {
            themes.push('Product Development and Launch');
        }
        if (descriptions.some(d => d.includes('acquire') || d.includes('sale'))) {
            themes.push('Business Acquisitions and Exits');
        }
        if (descriptions.some(d => d.includes('space') || d.includes('rocket'))) {
            themes.push('Space Exploration and Technology');
        }
        if (descriptions.some(d => d.includes('electric') || d.includes('tesla'))) {
            themes.push('Sustainable Energy and Transportation');
        }
        
        return themes.length > 0 ? themes : ['Innovation and Leadership', 'Technology Advancement'];
    }

    getSignificantEvents(events) {
        // Return the most significant events (first, middle, last, and any with key words)
        const significant = [events[0]]; // First event
        
        // Add middle event if there are more than 3 events
        if (events.length > 3) {
            const middleIndex = Math.floor(events.length / 2);
            significant.push(events[middleIndex]);
        }
        
        // Add last event
        if (events.length > 1) {
            significant.push(events[events.length - 1]);
        }
        
        // Add any events with significant keywords
        const keywords = ['founded', 'launch', 'acquire', 'ceo', 'success', 'revolutionary'];
        events.forEach(event => {
            if (keywords.some(keyword => event.description.toLowerCase().includes(keyword))) {
                if (!significant.includes(event)) {
                    significant.push(event);
                }
            }
        });
        
        return significant.slice(0, 4); // Limit to 4 most significant
    }

    getLocalSummary(timeline) {
        const events = timeline.events;
        const startYear = events[0].year;
        const endYear = events[events.length - 1].year;
        const span = parseInt(endYear) - parseInt(startYear);
        
        let summary = `<p><strong>Timeline Overview:</strong> This timeline spans ${span} years (${startYear} - ${endYear}) and covers ${events.length} significant events.</p>`;
        
        // Add key highlights
        if (events.length >= 3) {
            summary += `<p><strong>Key Highlights:</strong></p><ul>`;
            summary += `<li>${events[0].title} (${events[0].year}): ${events[0].description}</li>`;
            
            // Add middle event if there are more than 3 events
            if (events.length > 3) {
                const middleIndex = Math.floor(events.length / 2);
                summary += `<li>${events[middleIndex].title} (${events[middleIndex].year}): ${events[middleIndex].description}</li>`;
            }
            
            summary += `<li>${events[events.length - 1].title} (${events[events.length - 1].year}): ${events[events.length - 1].description}</li>`;
            summary += `</ul>`;
        }
        
        summary += `<p>The timeline demonstrates a progression of important milestones and developments that have shaped the subject's history and impact.</p>`;
        
        return summary;
    }

    parseSummaryResponse(data) {
        if (data && data[0] && data[0].generated_text) {
            return data[0].generated_text;
        }
        return "AI summary is currently unavailable. Please try again later.";
    }

    showLoading() {
        const container = document.getElementById('timeline-container');
        container.innerHTML = `
            <div class="timeline-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Generating timeline with AI...</p>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('timeline-container');
        container.innerHTML = `
            <div class="timeline-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize generator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new TimelineGenerator();
}); 