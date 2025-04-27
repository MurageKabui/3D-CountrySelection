const config = {
  scaleFactor: 0.75,
  angles: { x: -100, y: -20, z: 0 },
  colors: {
      water: '#0a1a3a', // Deep blue ocean
      land: '#1a3a5a', // Dark blue land
      hover: '#00c3ff', // Bright cyan for hover
      borders: 'rgba(0, 195, 255, 0.5)', // Cyan borders
      grid: 'rgba(0, 195, 255, 0.1)', // Subtle grid lines
      glow: 'rgba(0, 195, 255, 0.3)' // Glow effect
  },
  // Performance settings
  renderQuality: {
    high: 1.0,    // Full quality
    medium: 0.75,  // 75% resolution
    low: 0.5      // Half resolution
  },
  currentQuality: 'medium',
  throttleDelay: 16, // ~60fps
  debounceDelay: 250,
  // Sound settings
  soundEnabled: false,
  soundVolume: 0.5,
  // Performance optimization settings
  useOffscreenCanvas: true,
  enablePathCaching: true,
  enableThrottling: true,
  enableRAF: true,
  enableGPUAcceleration: true,
  rotationSpeed: 0.5
};

// Global state for tracking user interactions and rendering
const state = {
  currentCountry: null,
  isDragging: false,
  startX: 0,
  startY: 0,
  lastRenderTime: 0,
  isScrolling: false,
  scrollTimeout: null,
  renderRequested: false,
  pulseIntensity: 0,
  pulseDirection: 1,
  flightPath: {
    start: null,
    end: null,
    progress: 0,
    direction: 1
  }
};

// DOM elements used throughout the application
const elements = {
  countryLabel: d3.select('#countryLabel'),
  canvas: d3.select('#globe'),
  context: d3.select('#globe').node().getContext('2d')
};

// Enable antialiasing
elements.context.imageSmoothingEnabled = true;
elements.context.imageSmoothingQuality = 'high';

// Use requestAnimationFrame for rendering
let animationFrameId = null;

// D3.js projection and path generator
const projection = d3.geoOrthographic().precision(0.1);
const path = d3.geoPath(projection).context(elements.context);
let land, countries, countryList;

// Cache for country paths to avoid recalculating
const countryPathCache = new Map();

// Country code mapping (ISO 3166-1 alpha-2)
const countryCodeMap = {
  'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Andorra': 'ad', 'Angola': 'ao',
  'Argentina': 'ar', 'Armenia': 'am', 'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az',
  'Bahamas': 'bs', 'Bahrain': 'bh', 'Bangladesh': 'bd', 'Barbados': 'bb', 'Belarus': 'by',
  'Belgium': 'be', 'Belize': 'bz', 'Benin': 'bj', 'Bhutan': 'bt', 'Bolivia': 'bo',
  'Bosnia and Herzegovina': 'ba', 'Botswana': 'bw', 'Brazil': 'br', 'Brunei': 'bn', 'Bulgaria': 'bg',
  'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cambodia': 'kh', 'Cameroon': 'cm', 'Canada': 'ca',
  'Cape Verde': 'cv', 'Central African Republic': 'cf', 'Chad': 'td', 'Chile': 'cl', 'China': 'cn',
  'Colombia': 'co', 'Comoros': 'km', 'Congo': 'cg', 'Costa Rica': 'cr', 'Croatia': 'hr',
  'Cuba': 'cu', 'Cyprus': 'cy', 'Czech Republic': 'cz', 'Denmark': 'dk', 'Djibouti': 'dj',
  'Dominica': 'dm', 'Dominican Republic': 'do', 'East Timor': 'tl', 'Ecuador': 'ec', 'Egypt': 'eg',
  'El Salvador': 'sv', 'Equatorial Guinea': 'gq', 'Eritrea': 'er', 'Estonia': 'ee', 'Ethiopia': 'et',
  'Fiji': 'fj', 'Finland': 'fi', 'France': 'fr', 'Gabon': 'ga', 'Gambia': 'gm',
  'Georgia': 'ge', 'Germany': 'de', 'Ghana': 'gh', 'Greece': 'gr', 'Grenada': 'gd',
  'Guatemala': 'gt', 'Guinea': 'gn', 'Guinea-Bissau': 'gw', 'Guyana': 'gy', 'Haiti': 'ht',
  'Honduras': 'hn', 'Hungary': 'hu', 'Iceland': 'is', 'India': 'in', 'Indonesia': 'id',
  'Iran': 'ir', 'Iraq': 'iq', 'Ireland': 'ie', 'Israel': 'il', 'Italy': 'it',
  'Jamaica': 'jm', 'Japan': 'jp', 'Jordan': 'jo', 'Kazakhstan': 'kz', 'Kenya': 'ke',
  'Kiribati': 'ki', 'Korea, North': 'kp', 'Korea, South': 'kr', 'Kuwait': 'kw', 'Kyrgyzstan': 'kg',
  'Laos': 'la', 'Latvia': 'lv', 'Lebanon': 'lb', 'Lesotho': 'ls', 'Liberia': 'lr',
  'Libya': 'ly', 'Liechtenstein': 'li', 'Lithuania': 'lt', 'Luxembourg': 'lu', 'Madagascar': 'mg',
  'Malawi': 'mw', 'Malaysia': 'my', 'Maldives': 'mv', 'Mali': 'ml', 'Malta': 'mt',
  'Marshall Islands': 'mh', 'Mauritania': 'mr', 'Mauritius': 'mu', 'Mexico': 'mx', 'Micronesia': 'fm',
  'Moldova': 'md', 'Monaco': 'mc', 'Mongolia': 'mn', 'Montenegro': 'me', 'Morocco': 'ma',
  'Mozambique': 'mz', 'Myanmar': 'mm', 'Namibia': 'na', 'Nauru': 'nr', 'Nepal': 'np',
  'Netherlands': 'nl', 'New Zealand': 'nz', 'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng',
  'Norway': 'no', 'Oman': 'om', 'Pakistan': 'pk', 'Palau': 'pw', 'Panama': 'pa',
  'Papua New Guinea': 'pg', 'Paraguay': 'py', 'Peru': 'pe', 'Philippines': 'ph', 'Poland': 'pl',
  'Portugal': 'pt', 'Qatar': 'qa', 'Romania': 'ro', 'Russia': 'ru', 'Rwanda': 'rw',
  'Saint Kitts and Nevis': 'kn', 'Saint Lucia': 'lc', 'Saint Vincent': 'vc', 'Samoa': 'ws', 'San Marino': 'sm',
  'Sao Tome and Principe': 'st', 'Saudi Arabia': 'sa', 'Senegal': 'sn', 'Serbia': 'rs', 'Seychelles': 'sc',
  'Sierra Leone': 'sl', 'Singapore': 'sg', 'Slovakia': 'sk', 'Slovenia': 'si', 'Solomon Islands': 'sb',
  'Somalia': 'so', 'South Africa': 'za', 'South Sudan': 'ss', 'Spain': 'es', 'Sri Lanka': 'lk',
  'Sudan': 'sd', 'Suriname': 'sr', 'Swaziland': 'sz', 'Sweden': 'se', 'Switzerland': 'ch',
  'Syria': 'sy', 'Taiwan': 'tw', 'Tajikistan': 'tj', 'Tanzania': 'tz', 'Thailand': 'th',
  'Togo': 'tg', 'Tonga': 'to', 'Trinidad and Tobago': 'tt', 'Tunisia': 'tn', 'Turkey': 'tr',
  'Turkmenistan': 'tm', 'Tuvalu': 'tv', 'Uganda': 'ug', 'Ukraine': 'ua', 'United Arab Emirates': 'ae',
  'United Kingdom': 'gb', 'United States': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz', 'Vanuatu': 'vu',
  'Vatican City': 'va', 'Venezuela': 've', 'Vietnam': 'vn', 'Yemen': 'ye', 'Zambia': 'zm',
  'Zimbabwe': 'zw', 'Palestine': 'ps'
};

// Sets the initial rotation angles for the globe
const setAngles = () => {
  const rotation = projection.rotate();
  rotation[0] = config.angles.x;
  rotation[1] = config.angles.y;
  rotation[2] = config.angles.z;
  projection.rotate(rotation);
};

// Adjusts the globe size based on window dimensions
const scale = () => {
  const width = document.documentElement.clientWidth * config.scaleFactor;
  const height = document.documentElement.clientHeight * config.scaleFactor;
  
  // Set canvas dimensions with device pixel ratio for sharper rendering
  const dpr = window.devicePixelRatio || 1;
  const canvas = elements.canvas.node();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Update context scale
  elements.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  
  projection
    .scale((Math.min(width, height) / 2))
    .translate([width / 2, height / 2]);
  
  // Clear the path cache when projection changes
  countryPathCache.clear();
  
  requestRender();
};

// Handles the start of a drag interaction
const dragstarted = (event) => {
  state.isDragging = true;
  state.startX = event.x;
  state.startY = event.y;
  
  // Set to low quality during drag for better performance
  config.currentQuality = 'low';
};

// Handles the drag interaction to rotate the globe
const dragged = (event) => {
  if (!state.isDragging) { return } ;

  const sensitivity = 0.25; // Adjust the sensitivity of rotation

  const dx = (event.x - state.startX) * sensitivity;
  const dy = (event.y - state.startY) * sensitivity;

  state.startX = event.x;
  state.startY = event.y;

  const rotation = projection.rotate();
  rotation[0] += dx;
  rotation[1] -= dy;
  projection.rotate(rotation);

  // Clear the path cache when rotation changes
  countryPathCache.clear();
  
  requestRender();
};

// Handles the end of a drag interaction
const dragended = () => {
  state.isDragging = false;
  
  // Return to medium quality after drag
  config.currentQuality = 'medium';
  
  requestRender();
};

// Optimized render function using requestAnimationFrame
const requestRender = () => {
  if (!state.renderRequested) {
    state.renderRequested = true;
    animationFrameId = requestAnimationFrame(render);
  }
};

// Add path caching
const pathCache = new Map();
const getCachedPath = (feature) => {
  const key = feature.id;
  if (pathCache.has(key)) {
    return pathCache.get(key);
  }
  const pathData = path(feature);
  pathCache.set(key, pathData);
  return pathData;
};

// Add offscreen canvas for better performance
let offscreenCanvas;
let offscreenContext;

const initOffscreenCanvas = () => {
  offscreenCanvas = document.createElement('canvas');
  offscreenContext = offscreenCanvas.getContext('2d', {
    alpha: true,
    willReadFrequently: true
  });
  
  // Enable hardware acceleration
  if (config.enableGPUAcceleration) {
    offscreenContext.imageSmoothingEnabled = true;
    offscreenContext.imageSmoothingQuality = 'high';
  }
};

// Main rendering function for the globe
const render = () => {
  state.renderRequested = false;
  
  const now = performance.now();
  const elapsed = now - state.lastRenderTime;
  
  if (elapsed < config.throttleDelay && !state.isDragging) {
    animationFrameId = requestAnimationFrame(render);
    return;
  }
  
  state.lastRenderTime = now;
  
  const { context } = elements;
  const width = document.documentElement.clientWidth * config.scaleFactor;
  const height = document.documentElement.clientHeight * config.scaleFactor;
  
  context.clearRect(0, 0, width, height);
  drawGrid(context, width, height);
  
  // Draw water background
  context.beginPath();
  path({ type: 'Sphere' });
  context.fillStyle = config.colors.water;
  context.fill();
  
  context.shadowColor = config.colors.glow;
  context.shadowBlur = 15;
  context.fill();
  context.shadowBlur = 0;
  
  // Draw land
  context.beginPath();
  path(land);
  context.fillStyle = config.colors.land;
  context.shadowColor = config.colors.glow;
  context.shadowBlur = 10;
  context.fill();
  context.shadowBlur = 0;
  
  // Draw country borders
  if (countries) {
    context.beginPath();
    context.strokeStyle = config.colors.borders;
    context.lineWidth = 0.75;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    
    context.shadowColor = config.colors.glow;
    context.shadowBlur = 5;
    
    countries.features.forEach(country => {
      path(country);
    });
    
    context.stroke();
    context.shadowBlur = 0;
  }
  
  // Draw highlighted country with pulse effect
  if (state.currentCountry) {
    // Update pulse animation
    state.pulseIntensity += 0.05 * state.pulseDirection;
    if (state.pulseIntensity >= 1) {
      state.pulseDirection = -1;
    } else if (state.pulseIntensity <= 0) {
      state.pulseDirection = 1;
    }

    // Draw outer glow (pulse)
    context.beginPath();
    path(state.currentCountry);
    context.fillStyle = `rgba(0, 195, 255, ${0.3 * state.pulseIntensity})`;
    context.shadowColor = config.colors.hover;
    context.shadowBlur = 20 + (10 * state.pulseIntensity);
    context.fill();
    context.shadowBlur = 0;

    // Draw inner highlight
    context.beginPath();
    path(state.currentCountry);
    context.fillStyle = config.colors.hover;
    context.shadowColor = config.colors.hover;
    context.shadowBlur = 15;
    context.fill();
    context.shadowBlur = 0;
  }

  // Request next frame for animation
  if (state.currentCountry) {
    requestAnimationFrame(render);
  }
};

// Draws the background grid for visual effect
const drawGrid = (context, width, height) => {
  const gridSize = 30;
  const gridColor = config.colors.grid;
  
  context.strokeStyle = gridColor;
  context.lineWidth = 0.5;
  
  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
};

// Loads geographic data from external sources
const loadData = async (cb) => {
  const world = await d3.json('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
  let countryNames = await d3.tsv('https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv');
  countryNames[110].name = "Palestine"

  cb(world, countryNames);
};

// Determines which country is under the cursor
const getCountry = (event) => {
    // Check if the event is within the globe canvas
    const canvas = elements.canvas.node();
    const rect = canvas.getBoundingClientRect();
    
    // If the event is outside the canvas, return null
    if (event.clientX < rect.left || event.clientX > rect.right || 
        event.clientY < rect.top || event.clientY > rect.bottom) {
        return null;
    }
    
    // Get the position relative to the canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to projection coordinates
    const pos = projection.invert([x, y]);
    
    // If the position is invalid (outside the globe), return null
    if (!pos) return null;
    
    // Find the country at this position
    return countries.features.find((f) => {
        // Check if the point is inside any of the country's polygons
        return f.geometry.coordinates.some((coords) => {
            // Handle different geometry types
            if (f.geometry.type === 'Polygon') {
                return d3.polygonContains(coords, pos);
            } else if (f.geometry.type === 'MultiPolygon') {
                // For MultiPolygon, check each polygon
                return coords.some(polygon => d3.polygonContains(polygon, pos));
            }
            return false;
        });
    });
};

// Audio elements for sound effects
const audioElements = {
  hover: new Audio('fx/hover.ogg'),
  click: new Audio('fx/click.ogg'),
  openModal: new Audio('fx/openmodal.ogg'),
  background: new Audio('fx/background.ogg')
};

// Set background audio to loop
audioElements.background.loop = true;

// Plays a sound effect if sound is enabled
const playSound = (soundName) => {
  if (config.soundEnabled && audioElements[soundName]) {
    // Reset the audio to the beginning if it's already playing
    audioElements[soundName].currentTime = 0;
    audioElements[soundName].volume = config.soundVolume;
    audioElements[soundName].play().catch(e => console.log('Audio play error:', e));
  }
};

// Toggles background music on/off
const toggleBackgroundMusic = (enabled) => {
  if (enabled) {
    audioElements.background.volume = config.soundVolume * 0.3; // Lower volume for background
    audioElements.background.play().catch(e => console.log('Background audio play error:', e));
  } else {
    audioElements.background.pause();
  }
};

// Handles mouse movement over the globe
const mousemove = (event) => {
    // Only process if we're not dragging
    if (state.isDragging) return;
    
    const country = getCountry(event);
    
    // If no country is found and we were highlighting one, clear the highlight
    if (!country) {
        if (state.currentCountry) {
            leave(state.currentCountry);
            state.currentCountry = null;
            render();
        }
        return;
    }
    
    // If we're already highlighting this country, do nothing
    if (country === state.currentCountry) {
        return;
    }
    
    // Otherwise, highlight the new country
    state.currentCountry = country;
    render();
    enter(country);
    
    // Play hover sound
    playSound('hover');
};

// Displays country name when hovering
const enter = (country) => {
  const name = countryList.find((c) => parseInt(c.id) === parseInt(country.id))?.name || '';
  elements.countryLabel.text(name);
};

// Clears country name when not hovering
const leave = (country) => {
  elements.countryLabel.text('');
};

// DOM elements for the modal and chat interface
const modalElements = {
  modal: d3.select('#countryModal'),
  selectedCountry: d3.select('#selectedCountry'),
  countryFlag: d3.select('#countryFlag'),
  closeBtn: d3.select('#closeBtn'),
  fullscreenBtn: d3.select('#fullscreenBtn'),
  chatMessages: d3.select('#chatMessages'),
  messageInput: d3.select('#messageInput'),
  sendButton: d3.select('#sendButton')
};

// State for the chat interface
const chatState = {
  currentCountry: null,
  messages: [],
  isFullscreen: false,
  isTyping: false
};

// Handles click events on the globe
const click = (event) => {
  const country = getCountry(event);
  if (country) {
    const name = countryList.find((c) => parseInt(c.id) === parseInt(country.id))?.name || '';
    openChatModal(name, country);
    
    // Play click sound
    playSound('click');
  }
};

// Opens the chat modal for a selected country
const openChatModal = (countryName, country) => {
  chatState.currentCountry = country;
  chatState.messages = [];
  chatState.isFullscreen = false;
  
  // Update modal title
  modalElements.selectedCountry.text(countryName);
  
  // Set country flag (using ISO country code)
  const countryCode = countryCodeMap[countryName] || '';
  if (countryCode) {
    modalElements.countryFlag.html(`<img src="https://flagcdn.com/w40/${countryCode}.png" alt="${countryName} flag">`);
  } else {
    modalElements.countryFlag.html('');
  }
  
  // Clear previous messages
  modalElements.chatMessages.html('');
  
  // Show modal with animation
  modalElements.modal.style('display', 'flex');
  
  // Trigger reflow to ensure transition works
  modalElements.modal.node().offsetHeight;
  
  // Add active class for animation
  modalElements.modal.classed('active', true);
  
  // Play modal open sound
  playSound('openModal');
  
  // Add welcome message
  setTimeout(() => {
    addMessage(`Hello! You've selected ${countryName}. How can I help you today?`, 'bot');
  }, 300);
  
  // Focus on input after animation
  setTimeout(() => {
    modalElements.messageInput.node().focus();
  }, 500);
};

const closeChatModal = () => {
  // Remove active class for animation
  modalElements.modal.classed('active', false);
  
  // Hide modal after animation completes
  setTimeout(() => {
    modalElements.modal.style('display', 'none');
    chatState.currentCountry = null;
    chatState.isFullscreen = false;
    modalElements.modal.classed('fullscreen', false);
    modalElements.fullscreenBtn.select('i').attr('class', 'fas fa-expand');
  }, 300);
};

const toggleFullscreen = () => {
  chatState.isFullscreen = !chatState.isFullscreen;
  
  if (chatState.isFullscreen) {
    modalElements.modal.classed('fullscreen', true);
    modalElements.fullscreenBtn.select('i').attr('class', 'fas fa-compress');
  } else {
    modalElements.modal.classed('fullscreen', false);
    modalElements.fullscreenBtn.select('i').attr('class', 'fas fa-expand');
  }
};

const addMessage = (text, sender) => {
  const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
  const messageHtml = `<div class="message ${messageClass}">${text}</div>`;
  
  modalElements.chatMessages.html(modalElements.chatMessages.html() + messageHtml);
  
  // Scroll to bottom
  const chatMessages = modalElements.chatMessages.node();
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Store message in state
  chatState.messages.push({ text, sender });
};

const showTypingIndicator = () => {
  if (chatState.isTyping) return;
  
  chatState.isTyping = true;
  const typingHtml = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  modalElements.chatMessages.html(modalElements.chatMessages.html() + typingHtml);
  
  // Scroll to bottom
  const chatMessages = modalElements.chatMessages.node();
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

const removeTypingIndicator = () => {
  chatState.isTyping = false;
  const typingIndicator = modalElements.chatMessages.select('.typing-indicator');
  if (!typingIndicator.empty()) {
    typingIndicator.remove();
  }
};

const sendMessage = () => {
  const messageText = modalElements.messageInput.property('value').trim();
  
  if (messageText) {
    // Add user message
    addMessage(messageText, 'user');
    
    // Clear input
    modalElements.messageInput.property('value', '');
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate bot response
    setTimeout(() => {
      removeTypingIndicator();
      
      const countryName = chatState.currentCountry ? 
        countryList.find((c) => parseInt(c.id) === parseInt(chatState.currentCountry.id))?.name : 'Country';
      
      let response = `Thank you for your message about ${countryName}. `;
      
      // Simple response logic based on keywords
      if (messageText.toLowerCase().includes('hello') || messageText.toLowerCase().includes('hi')) {
        response = `Hello! I'm glad you're interested in ${countryName}. What would you like to know?`;
      } else if (messageText.toLowerCase().includes('capital')) {
        response = `I don't have specific information about ${countryName}'s capital in this demo, but you can ask me other questions!`;
      } else if (messageText.toLowerCase().includes('population')) {
        response = `I don't have specific population data for ${countryName} in this demo, but you can ask me other questions!`;
      } else if (messageText.toLowerCase().includes('thank')) {
        response = `You're welcome! Is there anything else you'd like to know about ${countryName}?`;
      }
      
      addMessage(response, 'bot');
    }, 1500);
  }
};

// Rotation Speed Controls
const speedDecreaseBtn = document.getElementById('speedDecreaseBtn');
const speedIncreaseBtn = document.getElementById('speedIncreaseBtn');
const speedSlider = document.getElementById('speedSlider');

// Rotation speed parameters
let rotationSpeed = 0.5; // degrees per frame
const minSpeed = 0.1;
const maxSpeed = 2.0;
const speedStep = 0.1;
let rotationInterval = null;
let autoRotate = false;

// Initialize speed slider
speedSlider.value = 0; // Changed from 50 to 0 to reflect disabled state

// Function to update rotation speed
function updateRotationSpeed(newSpeed) {
    // Clamp speed value
    newSpeed = Math.max(minSpeed, Math.min(maxSpeed, newSpeed));
    
    // Update rotation speed
    rotationSpeed = newSpeed;
    
    // Update slider value
    const sliderValue = ((rotationSpeed - minSpeed) / (maxSpeed - minSpeed)) * 90 + 10;
    speedSlider.value = sliderValue;
}

// Function to start auto-rotation
function startAutoRotation() {
    if (rotationInterval) return;
    
    rotationInterval = setInterval(() => {
        if (autoRotate) {
            const rotation = projection.rotate();
            rotation[0] += rotationSpeed;
            projection.rotate(rotation);
            requestRender();
        }
    }, 16); // ~60fps
}

// Function to stop auto-rotation
function stopAutoRotation() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}

// Event listeners for rotation speed controls
speedDecreaseBtn.addEventListener('click', () => {
    updateRotationSpeed(rotationSpeed - speedStep);
});

speedIncreaseBtn.addEventListener('click', () => {
    updateRotationSpeed(rotationSpeed + speedStep);
});

speedSlider.addEventListener('input', (e) => {
    const sliderValue = parseInt(e.target.value);
    // Convert slider value (10-100) to rotation speed (0.1-2.0)
    const newSpeed = minSpeed + ((sliderValue - 10) / 90) * (maxSpeed - minSpeed);
    updateRotationSpeed(newSpeed);
});

// Event listener for rotation toggle
const rotationToggle = document.getElementById('rotationToggle');
rotationToggle.checked = false; // Set initial state to unchecked
rotationToggle.addEventListener('change', (e) => {
    autoRotate = e.target.checked;
    
    if (autoRotate) {
        startAutoRotation();
    } else {
        stopAutoRotation();
    }
});

// Add pulsing effect to the globe
let pulseIntensity = 0;
let pulseDirection = 1;

const pulseGlobe = () => {
  if (!state.isDragging) {
    pulseIntensity += 0.01 * pulseDirection;
    
    if (pulseIntensity >= 1) {
      pulseDirection = -1;
    } else if (pulseIntensity <= 0) {
      pulseDirection = 1;
    }
    
    const globeElement = document.getElementById('globe');
    const glowIntensity = 10 + pulseIntensity * 5;
    globeElement.style.filter = `drop-shadow(0 0 ${glowIntensity}px rgba(0, 195, 255, 0.5))`;
    
    requestAnimationFrame(pulseGlobe);
  }
};

// Start the pulse animation
pulseGlobe();

// Sound toggle functionality
const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.querySelector('.sound-icon');

soundToggle.checked = false; // Set initial state to unchecked
soundIcon.className = 'fas fa-volume-mute sound-icon'; // Set initial icon state
soundToggle.addEventListener('change', (e) => {
  config.soundEnabled = e.target.checked;
  
  // Update icon based on state
  if (config.soundEnabled) {
    soundIcon.className = 'fas fa-volume-up sound-icon';
    toggleBackgroundMusic(true);
  } else {
    soundIcon.className = 'fas fa-volume-mute sound-icon';
    toggleBackgroundMusic(false);
  }
});

// Mobile menu toggle functionality
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navControls = document.querySelector('.nav-controls');

mobileMenuToggle.addEventListener('click', () => {
  navControls.classList.toggle('active');
  
  // Change icon based on menu state
  const icon = mobileMenuToggle.querySelector('i');
  if (navControls.classList.contains('active')) {
    icon.className = 'fas fa-times';
  } else {
    icon.className = 'fas fa-bars';
  }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (event) => {
  if (navControls.classList.contains('active') && 
      !event.target.closest('.nav-controls') && 
      !event.target.closest('.mobile-menu-toggle')) {
    navControls.classList.remove('active');
    const icon = mobileMenuToggle.querySelector('i');
    icon.className = 'fas fa-bars';
  }
});

// Add function to set flight path
const setFlightPath = (startCountry, endCountry) => {
  state.flightPath.start = startCountry;
  state.flightPath.end = endCountry;
  state.flightPath.progress = 0;
  state.flightPath.direction = 1;
  requestRender();
};

export const init = () => {
  setAngles();
  loadData((world, cList) => {
    land = topojson.feature(world, world.objects.land);
    countries = topojson.feature(world, world.objects.countries);
    countryList = cList;

    // Debounce resize event
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scale, config.debounceDelay);
    });
    
    // Initial scale
    scale();
    
    // Don't start auto-rotation by default
    // startAutoRotation(); // Removed this line
    
    // Don't start background music by default
    // if (config.soundEnabled) {
    //   toggleBackgroundMusic(true);
    // }
    
    // Handle scroll events for performance
    window.addEventListener('scroll', () => {
      if (!state.isScrolling) {
        state.isScrolling = true;
        config.currentQuality = 'low';
      }
      
      clearTimeout(state.scrollTimeout);
      state.scrollTimeout = setTimeout(() => {
        state.isScrolling = false;
        config.currentQuality = 'medium';
        requestRender();
      }, 150);
    });

    // Attach event handlers after data is loaded
    elements.canvas.call(
      d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    ).on('mousemove', mousemove)
      .on('touchmove', mousemove)
      .on('click', click);
      
    // Modal event handlers
    modalElements.closeBtn.on('click', closeChatModal);
    modalElements.fullscreenBtn.on('click', toggleFullscreen);
    modalElements.sendButton.on('click', sendMessage);
    modalElements.messageInput.on('keypress', (event) => {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Close modal when clicking outside
    modalElements.modal.on('click', (event) => {
      if (event.target === modalElements.modal.node()) {
        closeChatModal();
      }
    });
  });
};

init()