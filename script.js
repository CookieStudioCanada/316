// Food Items Management System
class FoodTracker {
  constructor() {
    this.foodItems = this.loadFromStorage() || [];
    this.initializeEventListeners();
    this.updateDisplay();
  }

  // Storage methods
  saveToStorage() {
    localStorage.setItem('nutritionTracker', JSON.stringify(this.foodItems));
  }

  loadFromStorage() {
    const data = localStorage.getItem('nutritionTracker');
    if (!data) return [];
    
    const items = JSON.parse(data);
    
    // Ensure all items have the required fields (fix legacy data)
    return items.map(item => ({
      id: item.id,
      item: item.item,
      quantity: item.quantity,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      fiber: Number(item.fiber) || 0,
      sugar: Number(item.sugar) || 0,
      saturatedFat: Number(item.saturatedFat) || 0,
      sodium: Number(item.sodium) || 0,
      source: item.source || 'unknown',
      timestamp: item.timestamp || new Date().toISOString()
    }));
  }

  // Initialize all event listeners
  initializeEventListeners() {
    // AI Analysis form
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
  }

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
    this.saveToStorage();
    this.updateDisplay();
    this.clearManualForm();
    this.showSuccessMessage('Item added successfully!');
  }

  // Submit manual form from modal
  submitManualForm() {
    const form = document.getElementById('manualAddForm');
    if (form.checkValidity()) {
      this.addManualItem();
      // Close modal
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
      // Add individual items (now with complete nutrition data)
      data.itemizedList.forEach(aiItem => {
        const item = {
          id: Date.now() + Math.random(),
          item: aiItem.item,
          quantity: '1 serving', // You could parse this from the item name if needed
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

      this.saveToStorage();
      this.updateDisplay();
      
      this.showSuccessMessage(`Successfully added ${addedCount} food items with complete nutrition data from smart analysis!`);
      
    } else {
      this.showError('No food items were identified in your description. Try being more specific.');
    }
  }

  // Update all displays
  updateDisplay() {
    this.updateItemsList();
    this.updateTotals();
    this.updateItemCount();
  }

  // Update items list
  updateItemsList() {
    const container = document.getElementById('foodItemsList');
    
    if (this.foodItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-5">
          <i class="bi bi-bowl display-4 text-muted mb-3"></i>
          <p class="text-muted">No food items added yet. Use smart analysis or add items manually above.</p>
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
                <button class="btn btn-outline-primary" onclick="foodTracker.editItem(${item.id})" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="foodTracker.deleteItem(${item.id})" title="Delete">
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
    const totals = this.foodItems.reduce((acc, item) => {
      // Ensure all values exist and are numbers
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

    document.getElementById('totalCalories').textContent = Math.round(totals.calories);
    document.getElementById('totalProtein').textContent = Math.round(totals.protein);
    document.getElementById('totalCarbs').textContent = Math.round(totals.carbs);
    document.getElementById('totalFat').textContent = Math.round(totals.fat);
    document.getElementById('totalFiber').textContent = Math.round(totals.fiber);
    document.getElementById('totalSugar').textContent = Math.round(totals.sugar);
    document.getElementById('totalSaturatedFat').textContent = Math.round(totals.saturatedFat);
    document.getElementById('totalSodium').textContent = Math.round(totals.sodium);
  }

  // Update item count
  updateItemCount() {
    document.getElementById('itemCount').textContent = this.foodItems.length;
  }

  // Edit item
  editItem(id) {
    const item = this.foodItems.find(item => item.id === id);
    if (!item) {
      this.showError('Item not found');
      return;
    }

    // Clear any previous validation state
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

    // Show the modal
    try {
      const modalElement = document.getElementById('editItemModal');
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } catch (error) {
      console.error('Error showing modal:', error);
      this.showError('Error opening edit form');
    }
  }

  // Submit edit form from modal
  submitEditForm() {
    const form = document.getElementById('editItemForm');
    const id = parseFloat(document.getElementById('editItemId').value);
    
    // Find the item
    const item = this.foodItems.find(item => item.id === id);
    if (!item) {
      this.showError('Item not found');
      return;
    }
    
    // Get form values
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
    
    // Validate required fields
    if (!formData.item || formData.calories < 0) {
      form.classList.add('was-validated');
      this.showError('Please fill in all required fields correctly');
      return;
    }
    
    // Update item
    Object.assign(item, formData);
    
    // Save and update display
    this.saveToStorage();
    this.updateDisplay();
    this.showSuccessMessage('Item updated successfully!');
    
    // Close modal
    try {
      const modalElement = document.getElementById('editItemModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        // Create new instance if none exists
        const newModal = new bootstrap.Modal(modalElement);
        newModal.hide();
      }
    } catch (error) {
      console.error('Error closing modal:', error);
    }
    
    // Clear form validation
    form.classList.remove('was-validated');
  }

  // Delete item
  deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.foodItems = this.foodItems.filter(item => item.id !== id);
      this.saveToStorage();
      this.updateDisplay();
      this.showSuccessMessage('Item deleted successfully!');
    }
  }

  // Clear all items
  clearAllItems() {
    if (confirm('Are you sure you want to clear all items? This cannot be undone.')) {
      this.foodItems = [];
      this.saveToStorage();
      this.updateDisplay();
      this.showSuccessMessage('All items cleared!');
    }
  }

  // Export data
  exportData() {
    const data = {
      exportDate: new Date().toISOString(),
      totalItems: this.foodItems.length,
      items: this.foodItems,
      totals: this.calculateCurrentTotals()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showSuccessMessage('Data exported successfully!');
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

  // Utility methods
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
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 300px;';
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
  foodTracker.clearAllItems();
}

function exportData() {
  foodTracker.exportData();
}

function submitEditForm() {
  if (foodTracker) {
    foodTracker.submitEditForm();
  } else {
    console.error('foodTracker not initialized');
  }
}

// Initialize when DOM is loaded
let foodTracker;
document.addEventListener('DOMContentLoaded', () => {
  foodTracker = new FoodTracker();
});