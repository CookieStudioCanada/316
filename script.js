// Advanced Nutrition Tracker with Chat and Data Management
class NutritionTracker {
  constructor() {
    this.foodItems = this.loadFromStorage('nutritionTracker') || [];
    this.savedData = this.loadFromStorage('savedData') || [];
    this.chatHistory = this.loadFromStorage('chatHistory') || [];
    this.coachInstructions = this.loadFromStorage('coachInstructions') || {};
    this.initializeEventListeners();
    this.updateDisplay();
    this.loadChatHistory();
    this.loadInstructions();
    this.createDummyDataIfEmpty();
  }

  // Storage methods
  saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadFromStorage(key) {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  }

  // Initialize all event listeners
  initializeEventListeners() {

    // Food analysis form
    document.getElementById('foodForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.target.checkValidity()) {
        this.analyzeFoodIntake();
      }
      e.target.classList.add('was-validated');
    });

    // Manual add form
    document.getElementById('manualAddForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.target.checkValidity()) {
        this.addManualItem();
      }
      e.target.classList.add('was-validated');
    });

    // Calorie deficit form
    document.getElementById('deficitForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.target.checkValidity()) {
        this.calculateDeficit();
      }
      e.target.classList.add('was-validated');
    });

    // Chat form
    document.getElementById('chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendChatMessage();
    });

    // Save day form
    document.getElementById('saveDayForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.confirmSaveDay();
    });

    // Setup tab buttons
    this.setupTabs();
  }

  // Setup simple tab system
  setupTabs() {
    // Find all tab buttons by custom data-target attribute
    const tabButtons = document.querySelectorAll('[data-target]');
    
    tabButtons.forEach((button) => {
      // Add click listener for manual tab switching
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Manual tab switching
        this.switchTab(button.getAttribute('data-target'), button);
        
        // Close mobile menu using native Bootstrap
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
          const bsCollapse = new bootstrap.Collapse(navbarCollapse);
          bsCollapse.hide();
        }
      });
    });
  }

  // Simple tab switching function
  switchTab(targetSelector, clickedButton) {
    // Hide all tab panes
    const allTabPanes = document.querySelectorAll('.tab-pane');
    allTabPanes.forEach(pane => {
      pane.classList.remove('show', 'active');
    });
    
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('[data-target]');
    allButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show target tab pane
    const targetPane = document.querySelector(targetSelector);
    if (targetPane) {
      targetPane.classList.add('show', 'active');
    }
    
    // Set clicked button as active
    if (clickedButton) {
      clickedButton.classList.add('active');
    }
  }

  // FOOD TRACKING METHODS

  // Add item manually
  addManualItem() {
    const item = {
      id: Date.now(),
      item: document.getElementById('itemName').value,
      quantity: '1 serving',
      calories: parseFloat(document.getElementById('itemCalories').value) || 0,
      protein: parseFloat(document.getElementById('itemProtein').value) || 0,
      carbs: parseFloat(document.getElementById('itemCarbs').value) || 0,
      fat: parseFloat(document.getElementById('itemFat').value) || 0,
      fiber: parseFloat(document.getElementById('itemFiber')?.value) || 0,
      sugar: parseFloat(document.getElementById('itemSugar')?.value) || 0,
      saturatedFat: parseFloat(document.getElementById('itemSaturatedFat')?.value) || 0,
      sodium: parseFloat(document.getElementById('itemSodium')?.value) || 0,
      source: 'manual',
      timestamp: new Date().toISOString()
    };

    this.foodItems.push(item);
    this.saveToStorage('nutritionTracker', this.foodItems);
    this.updateDisplay();
    this.clearManualForm();
    this.showSuccessMessage('Item added successfully!');
  }

  // Submit manual form from modal
  submitManualForm() {
    const form = document.getElementById('manualAddForm');
    if (form.checkValidity()) {
      this.addManualItem();
      const modal = bootstrap.Modal.getInstance(document.getElementById('manualAddModal'));
      modal.hide();
    } else {
      form.classList.add('was-validated');
    }
  }

  // Clear manual form
  clearManualForm() {
    document.getElementById('manualAddForm').reset();
    document.getElementById('manualAddForm').classList.remove('was-validated');
  }

  // AI Analysis
  async analyzeFoodIntake() {
    const foodInput = document.getElementById('foodInput').value.trim();
    
    if (!foodInput) {
      this.showError('Please enter what you ate today.');
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch('https://analyzenutrition-ik32xiclqq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: foodInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze food intake');
      }

      const result = await response.json();
      this.processAIResults(result);
      document.getElementById('foodInput').value = '';
      document.getElementById('foodForm').classList.remove('was-validated');
      
    } catch (error) {
      this.showError('Failed to analyze food intake. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  // Process AI results and add items
  processAIResults(response) {
    const data = response.data;
    let addedCount = 0;

    if (data.itemizedList && data.itemizedList.length > 0) {
      data.itemizedList.forEach(aiItem => {
        const item = {
          id: Date.now() + Math.random(),
          item: aiItem.item,
          quantity: '1 serving',
          calories: Number(aiItem.calories) || 0,
          protein: Number(aiItem.protein) || 0,
          carbs: Number(aiItem.carbs) || 0,
          fat: Number(aiItem.fat) || 0,
          fiber: Number(aiItem.fiber) || 0,
          sugar: Number(aiItem.sugar) || 0,
          saturatedFat: Number(aiItem.saturatedFat) || 0,
          sodium: Number(aiItem.sodium) || 0,
          source: 'ai',
          timestamp: new Date().toISOString()
        };
        
        this.foodItems.push(item);
        addedCount++;
      });

      this.saveToStorage('nutritionTracker', this.foodItems);
      this.updateDisplay();
      
      this.showSuccessMessage(`Successfully added ${addedCount} food items with complete nutrition data!`);
      
    } else {
      this.showError('No food items were identified in your description. Try being more specific.');
    }
  }

  // Edit item
  editItem(id) {
    const item = this.foodItems.find(item => item.id === id);
    if (!item) {
      this.showError('Item not found');
      return;
    }

    const form = document.getElementById('editItemForm');
    form.classList.remove('was-validated');

    // Populate the edit form
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.item || '';
    document.getElementById('editItemCalories').value = item.calories || 0;
    document.getElementById('editItemProtein').value = item.protein || 0;
    document.getElementById('editItemCarbs').value = item.carbs || 0;
    document.getElementById('editItemFat').value = item.fat || 0;
    document.getElementById('editItemFiber').value = item.fiber || '';
    document.getElementById('editItemSugar').value = item.sugar || '';
    document.getElementById('editItemSaturatedFat').value = item.saturatedFat || '';
    document.getElementById('editItemSodium').value = item.sodium || '';

    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    modal.show();
  }

  // Submit edit form
  submitEditForm() {
    const form = document.getElementById('editItemForm');
    const id = parseFloat(document.getElementById('editItemId').value);
    
    const item = this.foodItems.find(item => item.id === id);
    if (!item) {
      this.showError('Item not found');
      return;
    }
    
    const formData = {
      item: document.getElementById('editItemName').value.trim(),
      quantity: '1 serving',
      calories: parseFloat(document.getElementById('editItemCalories').value) || 0,
      protein: parseFloat(document.getElementById('editItemProtein').value) || 0,
      carbs: parseFloat(document.getElementById('editItemCarbs').value) || 0,
      fat: parseFloat(document.getElementById('editItemFat').value) || 0,
      fiber: parseFloat(document.getElementById('editItemFiber').value) || 0,
      sugar: parseFloat(document.getElementById('editItemSugar').value) || 0,
      saturatedFat: parseFloat(document.getElementById('editItemSaturatedFat').value) || 0,
      sodium: parseFloat(document.getElementById('editItemSodium').value) || 0
    };
    
    if (!formData.item || formData.calories < 0) {
      form.classList.add('was-validated');
      this.showError('Please fill in all required fields correctly');
      return;
    }
    
    Object.assign(item, formData);
    
    this.saveToStorage('nutritionTracker', this.foodItems);
    this.updateDisplay();
    this.showSuccessMessage('Item updated successfully!');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
    if (modal) modal.hide();
    
    form.classList.remove('was-validated');
  }

  // Delete item
  deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.foodItems = this.foodItems.filter(item => item.id !== id);
      this.saveToStorage('nutritionTracker', this.foodItems);
      this.updateDisplay();
      this.showSuccessMessage('Item deleted successfully!');
    }
  }

  // Clear all items
  clearAllItems() {
    if (confirm('Are you sure you want to clear all items? This cannot be undone.')) {
      this.foodItems = [];
      this.saveToStorage('nutritionTracker', this.foodItems);
      this.updateDisplay();
      this.showSuccessMessage('All items cleared!');
    }
  }

  // CHAT FUNCTIONALITY

  // Send chat message
  async sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    this.addChatMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    const typingDiv = this.addTypingIndicator();

    try {
      // Get AI response from endpoint
      const response = await this.callNutritionChatAPI(message);
      
      // Remove typing indicator
      typingDiv.remove();
      
      // Add AI response to chat
      this.addChatMessage(response, 'bot');

      // Save chat history
      this.saveToStorage('chatHistory', this.chatHistory);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator
      typingDiv.remove();
      
      // Add error message
      this.addChatMessage('Sorry, I had trouble processing your message. Please try again.', 'bot');
    }
  }

  // Call nutrition chat API
  async callNutritionChatAPI(message) {
    const currentTotals = this.calculateCurrentTotals();
    const recentItems = this.foodItems.slice(-5);
    
    // Prepare nutrition data with custom instructions
    const nutritionData = {
      currentTotals,
      recentItems,
      totalItems: this.foodItems.length,
      savedDataCount: this.savedData.length,
      customInstructions: this.formatInstructionsForAPI()
    };

    // Prepare chat history for API (last 10 messages to avoid token limits)
    const history = this.chatHistory
      .slice(-10)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

    console.log('🚀 Calling nutrition chat API with:', {
      message,
      historyLength: history.length,
      nutritionData
    });

    const response = await fetch('https://nutritionChat-ik32xiclqq-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        nutritionData
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API returned error');
    }

    console.log('✅ Got AI response:', result.response);
    return result.response;
  }

  // Add typing indicator
  addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="message-content">
        <i class="bi bi-robot"></i>
        <div class="message-text">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    this.scrollChatToBottom();
    return typingDiv;
  }

  // Add message to chat
  addChatMessage(message, sender) {
    const chatMessage = {
      id: Date.now() + Math.random(),
      message,
      sender,
      timestamp: new Date().toISOString()
    };

    this.chatHistory.push(chatMessage);
    this.displayChatMessage(chatMessage);
    this.scrollChatToBottom();
  }

  // Display chat message
  displayChatMessage(chatMessage) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${chatMessage.sender}-message`;
    
    const icon = chatMessage.sender === 'user' ? 'bi-person-circle' : 'bi-robot';
    
    // Format the message for better presentation
    const formattedMessage = this.formatChatMessage(chatMessage.message);
    
    messageDiv.innerHTML = `
      <div class="message-content">
        <i class="bi ${icon}"></i>
        <div class="message-text">${formattedMessage}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
  }

  // Format chat message for better presentation
  formatChatMessage(message) {
    return message
      // Bold text with **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text with *text*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Numbers with units (e.g., "95g", "1,847 calories")
      .replace(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(g|mg|calories?|kcal|lbs?)\b/g, '<strong>$1$2</strong>')
      // Percentages
      .replace(/(\d+(?:\.\d+)?)%/g, '<strong>$1%</strong>');
  }

  // Load chat history
  loadChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    // Clear existing messages except the welcome message
    const welcomeMessage = chatMessages.querySelector('.bot-message');
    chatMessages.innerHTML = '';
    chatMessages.appendChild(welcomeMessage);
    
    // Load saved messages
    this.chatHistory.forEach(message => {
      this.displayChatMessage(message);
    });
    
    this.scrollChatToBottom();
  }

  // Clear chat
  clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      this.chatHistory = [];
      this.saveToStorage('chatHistory', this.chatHistory);
      
      // Reset chat display
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.innerHTML = `
        <div class="chat-message bot-message">
          <div class="message-content">
            <i class="bi bi-robot"></i>
            <div class="message-text">
              Hey! I'm your nutrition coach. I can analyze your eating patterns, give you personalized advice, and answer questions about your nutrition data. What's on your mind?
            </div>
          </div>
        </div>
      `;
      
      this.showSuccessMessage('Chat cleared!');
    }
  }

  // COACH INSTRUCTIONS MANAGEMENT

  // Load instructions into form
  loadInstructions() {
    const instructions = this.coachInstructions;
    
    if (instructions.dietaryGoals) {
      document.getElementById('dietaryGoals').value = instructions.dietaryGoals;
    }
    if (instructions.dietaryRestrictions) {
      document.getElementById('dietaryRestrictions').value = instructions.dietaryRestrictions;
    }
    if (instructions.healthConditions) {
      document.getElementById('healthConditions').value = instructions.healthConditions;
    }
    if (instructions.preferences) {
      document.getElementById('preferences').value = instructions.preferences;
    }
  }

  // Save instructions
  saveInstructions() {
    const instructions = {
      dietaryGoals: document.getElementById('dietaryGoals').value.trim(),
      dietaryRestrictions: document.getElementById('dietaryRestrictions').value.trim(),
      healthConditions: document.getElementById('healthConditions').value.trim(),
      preferences: document.getElementById('preferences').value.trim()
    };

    this.coachInstructions = instructions;
    this.saveToStorage('coachInstructions', this.coachInstructions);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('instructionsModal'));
    if (modal) modal.hide();
    
    this.showSuccessMessage('Coach instructions saved! They will be included in all conversations.');
  }

  // Format instructions for API
  formatInstructionsForAPI() {
    const instructions = this.coachInstructions;
    let formatted = '';

    if (instructions.dietaryGoals) {
      formatted += `DIETARY GOALS: ${instructions.dietaryGoals}\n`;
    }
    if (instructions.dietaryRestrictions) {
      formatted += `DIETARY RESTRICTIONS: ${instructions.dietaryRestrictions}\n`;
    }
    if (instructions.healthConditions) {
      formatted += `HEALTH CONDITIONS: ${instructions.healthConditions}\n`;
    }
    if (instructions.preferences) {
      formatted += `COACHING PREFERENCES: ${instructions.preferences}\n`;
    }

    return formatted || null;
  }

  // Create dummy data for testing (only if no saved data exists)
  createDummyDataIfEmpty() {
    if (this.savedData.length === 0) {
      console.log('📊 Creating dummy nutrition data for testing...');
      
      const dummyData = [
        {
          id: Date.now() - 432000000, // 5 days ago
          name: "Lundi - Journée équilibrée",
          notes: "Bonne journée, exercice 45min",
          date: new Date(Date.now() - 432000000).toISOString(),
          items: [
            { id: 1, item: "Avocado toast avec œuf", calories: 340, protein: 14, carbs: 22, fat: 24, fiber: 8, sugar: 3, saturatedFat: 5, sodium: 380, source: 'ai', timestamp: new Date().toISOString() },
            { id: 2, item: "Café avec lait d'amande", calories: 25, protein: 1, carbs: 3, fat: 2, fiber: 0, sugar: 0, saturatedFat: 0, sodium: 95, source: 'ai', timestamp: new Date().toISOString() },
            { id: 3, item: "Salade de quinoa au poulet grillé", calories: 420, protein: 32, carbs: 45, fat: 12, fiber: 6, sugar: 8, saturatedFat: 3, sodium: 650, source: 'ai', timestamp: new Date().toISOString() },
            { id: 4, item: "Yaourt grec avec baies", calories: 150, protein: 15, carbs: 18, fat: 2, fiber: 4, sugar: 14, saturatedFat: 1, sodium: 65, source: 'ai', timestamp: new Date().toISOString() },
            { id: 5, item: "Saumon grillé avec légumes", calories: 380, protein: 35, carbs: 12, fat: 22, fiber: 5, sugar: 6, saturatedFat: 5, sodium: 420, source: 'ai', timestamp: new Date().toISOString() },
            { id: 6, item: "Riz brun", calories: 220, protein: 5, carbs: 45, fat: 2, fiber: 4, sugar: 1, saturatedFat: 0, sodium: 5, source: 'ai', timestamp: new Date().toISOString() }
          ],
          totals: { calories: 1535, protein: 102, carbs: 145, fat: 64, fiber: 27, sugar: 32, saturatedFat: 14, sodium: 1615 }
        },
        {
          id: Date.now() - 345600000, // 4 days ago
          name: "Mardi - Jour cheat modéré",
          notes: "Pizza entre amis, mais resté raisonnable",
          date: new Date(Date.now() - 345600000).toISOString(),
          items: [
            { id: 7, item: "Smoothie protéiné banane", calories: 280, protein: 25, carbs: 35, fat: 6, fiber: 4, sugar: 28, saturatedFat: 2, sodium: 150, source: 'ai', timestamp: new Date().toISOString() },
            { id: 8, item: "2 tranches pizza margherita", calories: 620, protein: 28, carbs: 78, fat: 22, fiber: 4, sugar: 8, saturatedFat: 12, sodium: 1350, source: 'ai', timestamp: new Date().toISOString() },
            { id: 9, item: "Salade verte vinaigrette", calories: 90, protein: 2, carbs: 8, fat: 6, fiber: 3, sugar: 4, saturatedFat: 1, sodium: 290, source: 'ai', timestamp: new Date().toISOString() },
            { id: 10, item: "Tiramisu (petite portion)", calories: 240, protein: 4, carbs: 28, fat: 12, fiber: 1, sugar: 24, saturatedFat: 8, sodium: 85, source: 'ai', timestamp: new Date().toISOString() },
            { id: 11, item: "Thé vert", calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, saturatedFat: 0, sodium: 2, source: 'ai', timestamp: new Date().toISOString() }
          ],
          totals: { calories: 1232, protein: 59, carbs: 149, fat: 46, fiber: 12, sugar: 64, saturatedFat: 23, sodium: 1877 }
        },
        {
          id: Date.now() - 259200000, // 3 days ago
          name: "Mercredi - Focus protéines",
          notes: "Entraînement intense, augmenté les protéines",
          date: new Date(Date.now() - 259200000).toISOString(),
          items: [
            { id: 12, item: "Omelette 3 œufs aux épinards", calories: 320, protein: 24, carbs: 4, fat: 22, fiber: 2, sugar: 2, saturatedFat: 7, sodium: 480, source: 'ai', timestamp: new Date().toISOString() },
            { id: 13, item: "Tranche de pain complet", calories: 80, protein: 4, carbs: 15, fat: 1, fiber: 3, sugar: 2, saturatedFat: 0, sodium: 135, source: 'ai', timestamp: new Date().toISOString() },
            { id: 14, item: "Shake protéiné post-workout", calories: 150, protein: 30, carbs: 5, fat: 2, fiber: 0, sugar: 3, saturatedFat: 1, sodium: 95, source: 'ai', timestamp: new Date().toISOString() },
            { id: 15, item: "Steak de bœuf grillé 200g", calories: 540, protein: 52, carbs: 0, fat: 35, fiber: 0, sugar: 0, saturatedFat: 14, sodium: 180, source: 'ai', timestamp: new Date().toISOString() },
            { id: 16, item: "Brocolis vapeur", calories: 55, protein: 5, carbs: 11, fat: 1, fiber: 5, sugar: 3, saturatedFat: 0, sodium: 65, source: 'ai', timestamp: new Date().toISOString() },
            { id: 17, item: "Patate douce rôtie", calories: 180, protein: 4, carbs: 41, fat: 0, fiber: 6, sugar: 8, saturatedFat: 0, sodium: 8, source: 'ai', timestamp: new Date().toISOString() },
            { id: 18, item: "Cottage cheese", calories: 120, protein: 14, carbs: 5, fat: 5, fiber: 0, sugar: 4, saturatedFat: 3, sodium: 380, source: 'ai', timestamp: new Date().toISOString() }
          ],
          totals: { calories: 1445, protein: 133, carbs: 81, fat: 66, fiber: 16, sugar: 22, saturatedFat: 25, sodium: 1343 }
        },
        {
          id: Date.now() - 172800000, // 2 days ago
          name: "Jeudi - Journée légère",
          notes: "Moins d'appétit, journée calme",
          date: new Date(Date.now() - 172800000).toISOString(),
          items: [
            { id: 19, item: "Porridge avoine avec fruits", calories: 250, protein: 8, carbs: 45, fat: 5, fiber: 8, sugar: 15, saturatedFat: 1, sodium: 125, source: 'ai', timestamp: new Date().toISOString() },
            { id: 20, item: "Thé avec miel", calories: 25, protein: 0, carbs: 7, fat: 0, fiber: 0, sugar: 6, saturatedFat: 0, sodium: 2, source: 'ai', timestamp: new Date().toISOString() },
            { id: 21, item: "Soupe de légumes maison", calories: 180, protein: 6, carbs: 35, fat: 3, fiber: 8, sugar: 12, saturatedFat: 1, sodium: 680, source: 'ai', timestamp: new Date().toISOString() },
            { id: 22, item: "Pain complet", calories: 80, protein: 4, carbs: 15, fat: 1, fiber: 3, sugar: 2, saturatedFat: 0, sodium: 135, source: 'ai', timestamp: new Date().toISOString() },
            { id: 23, item: "Poisson blanc grillé", calories: 220, protein: 45, carbs: 0, fat: 4, fiber: 0, sugar: 0, saturatedFat: 1, sodium: 180, source: 'ai', timestamp: new Date().toISOString() },
            { id: 24, item: "Légumes verts sautés", calories: 85, protein: 3, carbs: 12, fat: 3, fiber: 4, sugar: 6, saturatedFat: 0, sodium: 240, source: 'ai', timestamp: new Date().toISOString() },
            { id: 25, item: "Pomme", calories: 80, protein: 0, carbs: 21, fat: 0, fiber: 4, sugar: 16, saturatedFat: 0, sodium: 2, source: 'ai', timestamp: new Date().toISOString() }
          ],
          totals: { calories: 920, protein: 66, carbs: 135, fat: 16, fiber: 27, sugar: 57, saturatedFat: 3, sodium: 1364 }
        },
        {
          id: Date.now() - 86400000, // 1 day ago
          name: "Vendredi - Journée sociale",
          notes: "Resto avec collègues, quelques verres",
          date: new Date(Date.now() - 86400000).toISOString(),
          items: [
            { id: 26, item: "Café croissant", calories: 320, protein: 6, carbs: 35, fat: 18, fiber: 2, sugar: 8, saturatedFat: 11, sodium: 280, source: 'ai', timestamp: new Date().toISOString() },
            { id: 27, item: "Salade César avec poulet", calories: 480, protein: 32, carbs: 18, fat: 32, fiber: 4, sugar: 6, saturatedFat: 8, sodium: 920, source: 'ai', timestamp: new Date().toISOString() },
            { id: 28, item: "Frites (portion moyenne)", calories: 380, protein: 5, carbs: 48, fat: 19, fiber: 4, sugar: 2, saturatedFat: 3, sodium: 540, source: 'ai', timestamp: new Date().toISOString() },
            { id: 29, item: "Burger de bœuf", calories: 650, protein: 35, carbs: 45, fat: 38, fiber: 3, sugar: 8, saturatedFat: 16, sodium: 1200, source: 'ai', timestamp: new Date().toISOString() },
            { id: 30, item: "2 verres de vin rouge", calories: 250, protein: 0, carbs: 8, fat: 0, fiber: 0, sugar: 2, saturatedFat: 0, sodium: 12, source: 'ai', timestamp: new Date().toISOString() },
            { id: 31, item: "Part de gâteau chocolat", calories: 340, protein: 5, carbs: 45, fat: 16, fiber: 3, sugar: 35, saturatedFat: 9, sodium: 220, source: 'ai', timestamp: new Date().toISOString() }
          ],
          totals: { calories: 2420, protein: 83, carbs: 199, fat: 123, fiber: 16, sugar: 61, saturatedFat: 47, sodium: 3172 }
        }
      ];

      // Add dummy data to saved data
      this.savedData = dummyData;
      this.saveToStorage('savedData', this.savedData);
      this.updateHistoryDisplay();
      
      console.log('✅ Dummy data created! 5 days of nutrition history added.');
    }
  }

  // Scroll chat to bottom
  scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // SAVED DATA MANAGEMENT METHODS

  // Save current day
  saveCurrentDay() {
    if (this.foodItems.length === 0) {
      this.showError('No food items to save. Add some items first!');
      return;
    }

    // Set default name with current date
    const today = new Date().toLocaleDateString();
    document.getElementById('eventName').value = `Nutrition Data - ${today}`;
    
    const modal = new bootstrap.Modal(document.getElementById('saveDayModal'));
    modal.show();
  }

  // Confirm save day
  confirmSaveDay() {
    const eventName = document.getElementById('eventName').value.trim();
    const eventNotes = document.getElementById('eventNotes').value.trim();

    if (!eventName) {
      this.showError('Please enter an event name');
      return;
    }

    const savedEvent = {
      id: Date.now(),
      name: eventName,
      notes: eventNotes,
      date: new Date().toISOString(),
      items: [...this.foodItems],
      totals: this.calculateCurrentTotals()
    };

    this.savedData.push(savedEvent);
    this.saveToStorage('savedData', this.savedData);
    this.updateHistoryDisplay();
    
    // Clear the save form
    document.getElementById('saveDayForm').reset();
    
    this.showSuccessMessage(`Saved "${eventName}" with ${this.foodItems.length} items!`);

    const modal = bootstrap.Modal.getInstance(document.getElementById('saveDayModal'));
    if (modal) modal.hide();
  }

  // Delete saved event
  deleteSavedEvent(id) {
    const event = this.savedData.find(e => e.id === id);
    if (!event) return;

    if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
      this.savedData = this.savedData.filter(e => e.id !== id);
      this.saveToStorage('savedData', this.savedData);
      this.updateHistoryDisplay();
      this.showSuccessMessage('Saved data deleted successfully!');
    }
  }

  // Update history display
  updateHistoryDisplay() {
    const container = document.getElementById('savedDataList');
    
    if (this.savedData.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-5">
          <i class="bi bi-archive display-4 text-muted mb-3"></i>
          <p class="text-muted">No saved data yet. Use "Save Today" on the Home tab to save your daily nutrition!</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="saved-data-grid">
        ${this.savedData.map(event => this.createSavedDataCard(event)).join('')}
      </div>
    `;
    container.innerHTML = html;
  }

  // Create saved data card
  createSavedDataCard(event) {
    const date = new Date(event.date).toLocaleDateString();
    const itemCount = event.items.length;

    return `
      <div class="saved-data-card">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 class="card-title">${event.name}</h5>
                <small class="text-muted">
                  <i class="bi bi-calendar"></i> ${date} • ${itemCount} items
                </small>
              </div>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-info" onclick="nutritionTracker.exportEventToCSV(${event.id})" title="Export CSV">
                  <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="nutritionTracker.deleteSavedEvent(${event.id})" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            
            ${event.notes ? `
              <div class="saved-event-notes mb-3">
                <small class="text-muted">${event.notes}</small>
              </div>
            ` : ''}
            
            <div class="nutrition-summary-mini">
              <div class="row g-2 text-center">
                <div class="col-3">
                  <div class="mini-stat">
                    <strong>${Math.round(event.totals.calories)}</strong>
                    <small>cal</small>
                  </div>
                </div>
                <div class="col-3">
                  <div class="mini-stat">
                    <strong>${Math.round(event.totals.protein)}</strong>
                    <small>protein</small>
                  </div>
                </div>
                <div class="col-3">
                  <div class="mini-stat">
                    <strong>${Math.round(event.totals.carbs)}</strong>
                    <small>carbs</small>
                  </div>
                </div>
                <div class="col-3">
                  <div class="mini-stat">
                    <strong>${Math.round(event.totals.fat)}</strong>
                    <small>fat</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // EXPORT METHODS

  // Export current items to CSV
  exportToCSV() {
    if (this.foodItems.length === 0) {
      this.showError('No items to export');
      return;
    }

    const csvData = this.generateCSV(this.foodItems, `nutrition-${new Date().toISOString().split('T')[0]}`);
    this.downloadCSV(csvData.content, csvData.filename);
    this.showSuccessMessage('CSV exported successfully!');
  }

  // Export specific saved event to CSV
  exportEventToCSV(eventId) {
    const event = this.savedData.find(e => e.id === eventId);
    if (!event) {
      this.showError('Event not found');
      return;
    }

    const csvData = this.generateCSV(event.items, event.name.replace(/[^a-z0-9]/gi, '_'));
    this.downloadCSV(csvData.content, csvData.filename);
    this.showSuccessMessage(`CSV exported for "${event.name}"!`);
  }

  // Export all saved data to CSV
  exportAllDataToCSV() {
    if (this.savedData.length === 0) {
      this.showError('No saved data to export');
      return;
    }

    let allItems = [];
    this.savedData.forEach(event => {
      event.items.forEach(item => {
        allItems.push({
          ...item,
          eventName: event.name,
          eventDate: new Date(event.date).toLocaleDateString()
        });
      });
    });

    const csvData = this.generateCSV(allItems, 'all-nutrition-data', true);
    this.downloadCSV(csvData.content, csvData.filename);
    this.showSuccessMessage('All data exported to CSV!');
  }

  // Generate CSV content
  generateCSV(items, filename, includeEventInfo = false) {
    const headers = includeEventInfo 
      ? ['Event Name', 'Event Date', 'Food Item', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Sugar (g)', 'Saturated Fat (g)', 'Sodium (mg)', 'Source', 'Timestamp']
      : ['Food Item', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Sugar (g)', 'Saturated Fat (g)', 'Sodium (mg)', 'Source', 'Timestamp'];

    const csvRows = [headers.join(',')];

    items.forEach(item => {
      const row = includeEventInfo
        ? [
            `"${item.eventName || ''}"`,
            `"${item.eventDate || ''}"`,
            `"${item.item}"`,
            item.calories || 0,
            item.protein || 0,
            item.carbs || 0,
            item.fat || 0,
            item.fiber || 0,
            item.sugar || 0,
            item.saturatedFat || 0,
            item.sodium || 0,
            item.source || '',
            new Date(item.timestamp).toLocaleString()
          ]
        : [
            `"${item.item}"`,
            item.calories || 0,
            item.protein || 0,
            item.carbs || 0,
            item.fat || 0,
            item.fiber || 0,
            item.sugar || 0,
            item.saturatedFat || 0,
            item.sodium || 0,
            item.source || '',
            new Date(item.timestamp).toLocaleString()
          ];
      
      csvRows.push(row.join(','));
    });

    return {
      content: csvRows.join('\n'),
      filename: `${filename}.csv`
    };
  }

  // Download CSV file
  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // DISPLAY UPDATE METHODS

  // Update all displays
  updateDisplay() {
    this.updateItemsList();
    this.updateTotals();
    this.updateHistoryDisplay();
  }

  // Update items list
  updateItemsList() {
    const container = document.getElementById('foodItemsList');
    
    if (this.foodItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-5">
          <i class="bi bi-bowl display-4 text-muted mb-3"></i>
          <p class="text-muted">No food items added yet. Use the smart analysis above to get started!</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="food-items-grid">
        ${this.foodItems.map(item => this.createItemCard(item)).join('')}
      </div>
    `;
    container.innerHTML = html;
  }

  // Create individual item card
  createItemCard(item) {
    return `
      <div class="food-item-card mb-3" data-id="${item.id}">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <h6 class="card-title mb-1">
                  ${item.item}
                </h6>
              </div>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="nutritionTracker.editItem(${item.id})" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="nutritionTracker.deleteItem(${item.id})" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="nutrition-mini-grid">
              ${item.calories > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.calories)}</strong> cal
              </span>` : ''}
              ${item.protein > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.protein)}</strong>g protein
              </span>` : ''}
              ${item.carbs > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.carbs)}</strong>g carbs
              </span>` : ''}
              ${item.fat > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.fat)}</strong>g fat
              </span>` : ''}
              ${item.fiber > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.fiber)}</strong>g fiber
              </span>` : ''}
              ${item.sugar > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.sugar)}</strong>g sugar
              </span>` : ''}
              ${item.saturatedFat > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.saturatedFat)}</strong>g sat fat
              </span>` : ''}
              ${item.sodium > 0 ? `<span class="nutrition-mini-item">
                <strong>${Math.round(item.sodium)}</strong>mg sodium
              </span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Update nutrition totals
  updateTotals() {
    const totals = this.calculateCurrentTotals();

    document.getElementById('totalCalories').textContent = Math.round(totals.calories);
    document.getElementById('totalProtein').textContent = Math.round(totals.protein);
    document.getElementById('totalCarbs').textContent = Math.round(totals.carbs);
    document.getElementById('totalFat').textContent = Math.round(totals.fat);
    document.getElementById('totalFiber').textContent = Math.round(totals.fiber);
    document.getElementById('totalSugar').textContent = Math.round(totals.sugar);
    document.getElementById('totalSaturatedFat').textContent = Math.round(totals.saturatedFat);
    document.getElementById('totalSodium').textContent = Math.round(totals.sodium);
  }

  // Calculate current totals
  calculateCurrentTotals() {
    return this.foodItems.reduce((acc, item) => {
      acc.calories += Number(item.calories) || 0;
      acc.protein += Number(item.protein) || 0;
      acc.carbs += Number(item.carbs) || 0;
      acc.fat += Number(item.fat) || 0;
      acc.fiber += Number(item.fiber) || 0;
      acc.sugar += Number(item.sugar) || 0;
      acc.saturatedFat += Number(item.saturatedFat) || 0;
      acc.sodium += Number(item.sodium) || 0;
      return acc;
    }, {
      calories: 0, protein: 0, carbs: 0, fat: 0,
      fiber: 0, sugar: 0, saturatedFat: 0, sodium: 0
    });
  }

  // UTILITY METHODS

  showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (show) {
      loadingDiv.classList.remove('d-none');
    } else {
      loadingDiv.classList.add('d-none');
    }
  }

  showError(message) {
    this.showMessage(message, 'danger');
  }

  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showMessage(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 1050; max-width: 300px;';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }

  // Calorie deficit calculation (kept from original)
  calculateDeficit() {
    const gender = document.getElementById('gender').value;
    const weightLbs = parseFloat(document.getElementById('weight').value);
    const feet = parseInt(document.getElementById('feet').value);
    const inches = parseInt(document.getElementById('inches').value);
    const age = parseInt(document.getElementById('age').value);
    const activityFactor = parseFloat(document.getElementById('activity').value);

    if (isNaN(weightLbs) || isNaN(feet) || isNaN(inches) || isNaN(age)) {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<div class="alert alert-danger">Please fill in all fields correctly.</div>';
      resultDiv.classList.remove('d-none');
      return;
    }

    const weight = weightLbs * 0.453592;
    const height = (feet * 30.48) + (inches * 2.54);

    let bmr;
    if (gender === "male") {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const tdee = bmr * activityFactor;
    const mildDeficit = tdee - 250;
    const moderateDeficit = tdee - 500;
    const aggressiveDeficit = tdee - 750;

    const weeklyLossMild = (250 * 7) / 7700;
    const weeklyLossModerate = (500 * 7) / 7700;
    const weeklyLossAggressive = (750 * 7) / 7700;

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
      <div class="results-wrapper">
        <h3 class="results-title">
          <i class="bi bi-graph-up-arrow"></i>
          Your Results
        </h3>
        
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <div class="metric-card">
              <div class="metric-icon">
                <i class="bi bi-fire"></i>
              </div>
              <div class="metric-content">
                <h4>Base Metabolic Rate</h4>
                <div class="metric-value">${Math.round(bmr)}</div>
                <div class="metric-unit">calories/day</div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="metric-card">
              <div class="metric-icon">
                <i class="bi bi-lightning-charge"></i>
              </div>
              <div class="metric-content">
                <h4>Daily Energy Expenditure</h4>
                <div class="metric-value">${Math.round(tdee)}</div>
                <div class="metric-unit">calories/day</div>
              </div>
            </div>
          </div>
        </div>

        <h4 class="section-title">
          <i class="bi bi-calendar-check"></i>
          Weight Loss Plans
        </h4>
        
        <div class="row g-4">
          <div class="col-md-4">
            <div class="plan-card">
              <div class="plan-header mild">
                <i class="bi bi-feather"></i>
                <h5>Mild</h5>
              </div>
              <div class="plan-content">
                <div class="plan-calories">${Math.round(mildDeficit)}</div>
                <div class="plan-unit">calories/day</div>
                <div class="plan-loss">
                  <i class="bi bi-arrow-down-circle"></i>
                  ${(weeklyLossMild * 2.20462).toFixed(1)} lbs/week
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="plan-card">
              <div class="plan-header moderate">
                <i class="bi bi-stars"></i>
                <h5>Moderate</h5>
              </div>
              <div class="plan-content">
                <div class="plan-calories">${Math.round(moderateDeficit)}</div>
                <div class="plan-unit">calories/day</div>
                <div class="plan-loss">
                  <i class="bi bi-arrow-down-circle"></i>
                  ${(weeklyLossModerate * 2.20462).toFixed(1)} lbs/week
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="plan-card">
              <div class="plan-header aggressive">
                <i class="bi bi-rocket-takeoff"></i>
                <h5>Aggressive</h5>
              </div>
              <div class="plan-content">
                <div class="plan-calories">${Math.round(aggressiveDeficit)}</div>
                <div class="plan-unit">calories/day</div>
                <div class="plan-loss">
                  <i class="bi bi-arrow-down-circle"></i>
                  ${(weeklyLossAggressive * 2.20462).toFixed(1)} lbs/week
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    resultDiv.classList.remove('d-none');
    resultDiv.classList.add('fade-in');
  }
}

// Global functions for HTML onclick handlers
function clearAllItems() {
  nutritionTracker.clearAllItems();
}

function exportToCSV() {
  nutritionTracker.exportToCSV();
}

function exportAllDataToCSV() {
  nutritionTracker.exportAllDataToCSV();
}

function saveCurrentDay() {
  nutritionTracker.saveCurrentDay();
}

function clearChat() {
  nutritionTracker.clearChat();
}

function submitEditForm() {
  if (nutritionTracker) {
    nutritionTracker.submitEditForm();
  } else {
    console.error('nutritionTracker not initialized');
  }
}

// Initialize when DOM is loaded
let nutritionTracker;
document.addEventListener('DOMContentLoaded', () => {
  nutritionTracker = new NutritionTracker();
});