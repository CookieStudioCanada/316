// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', () => {
  // Add form submission handlers
  document.getElementById('deficitForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.checkValidity()) {
      calculateDeficit();
    }
    e.target.classList.add('was-validated');
  });

  document.getElementById('foodForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.checkValidity()) {
      analyzeFoodIntake();
    }
    e.target.classList.add('was-validated');
  });

  // Initialize help modal content
  const helpContent = document.querySelector('.nutrition-help-content');
  if (helpContent) {
    let modalHtml = `
      <div class="help-intro mb-4">
        <h4 class="help-intro-title">
          <i class="bi bi-info-circle"></i>
          Understanding Your Nutrition
        </h4>
        <p class="help-intro-text">
          Welcome to your comprehensive nutrition guide! This calculator helps you understand your daily caloric needs
          and provides personalized weight management plans. Below you'll find detailed information about each nutritional
          component and recommended values based on scientific research and health guidelines.
        </p>
        <div class="help-quick-tips">
          <h5><i class="bi bi-lightning"></i> Quick Tips:</h5>
          <ul>
            <li>Your caloric needs are unique to your body and lifestyle</li>
            <li>Choose a sustainable plan that fits your daily routine</li>
            <li>Combine diet changes with regular physical activity</li>
            <li>Monitor your progress and adjust as needed</li>
          </ul>
        </div>
      </div>
      <div class="accordion" id="nutritionAccordion">
    `;
    
    Object.entries(nutritionGuide).forEach(([key, info], index) => {
      modalHtml += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${key}" aria-expanded="${index === 0}">
              ${info.title}
            </button>
          </h2>
          <div id="collapse${key}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#nutritionAccordion">
            <div class="accordion-body">
              <p class="mb-3">${info.description}</p>
              <p class="fw-medium mb-2">${info.recommendations.general}</p>
              <ul class="mb-3">
                ${info.recommendations.ranges.map(range => `<li>${range}</li>`).join('')}
              </ul>
              <p class="fst-italic mb-0"><strong>Tip:</strong> ${info.recommendations.tips}</p>
            </div>
          </div>
        </div>
      `;
    });
    
    modalHtml += '</div>';
    helpContent.innerHTML = modalHtml;
  }
});

function calculateDeficit() {
  const gender = document.getElementById('gender').value;
  const weightLbs = parseFloat(document.getElementById('weight').value);
  const feet = parseInt(document.getElementById('feet').value);
  const inches = parseInt(document.getElementById('inches').value);
  const age = parseInt(document.getElementById('age').value);
  const activityFactor = parseFloat(document.getElementById('activity').value);

  if (isNaN(weightLbs) || isNaN(feet) || isNaN(inches) || isNaN(age)) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="error-message">Please fill in all fields correctly.</div>';
    resultDiv.classList.remove('d-none');
    return;
  }

  // Convert pounds to kg and feet/inches to cm
  const weight = weightLbs * 0.453592; // Convert lbs to kg
  const height = (feet * 30.48) + (inches * 2.54); // Convert feet and inches to cm

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
        <!-- Base Rate Card -->
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

        <!-- Daily Energy Card -->
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
        <!-- Mild Plan -->
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

        <!-- Moderate Plan -->
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

        <!-- Aggressive Plan -->
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

function showCalculator(type, event) {
  // Hide all calculator sections
  document.querySelectorAll('.calculator-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected calculator and activate tab
  document.getElementById(type + 'Calculator').classList.add('active');
  event.target.classList.add('active');
}

async function analyzeFoodIntake() {
  const foodInput = document.getElementById('foodInput').value.trim();
  
  if (!foodInput) {
    showError('Please enter what you ate today.');
    return;
  }

  // Show loading state
  const loadingDiv = document.getElementById('loading');
  const foodResult = document.getElementById('foodResult');
  loadingDiv.classList.remove('d-none');
  foodResult.classList.add('d-none');

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

    const data = await response.json();
    displayFoodResults(data);
  } catch (error) {
    showError('Failed to analyze food intake. Please try again.');
  } finally {
    loadingDiv.classList.add('d-none');
  }
}

function displayFoodResults(response) {
  const foodResult = document.getElementById('foodResult');
  const data = response.data;
  
  let html = `
    <div class="results-container">
      <h3 class="mb-4">Food Analysis Results</h3>
      
      <!-- Itemized List Section -->
      <div class="section-card mb-4">
        <h4>Itemized Foods</h4>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Item</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fat</th>
              </tr>
            </thead>
            <tbody>
              ${data.itemizedList.map(item => `
                <tr>
                  <td>${item.item}</td>
                  <td>${Math.round(item.calories)} kcal</td>
                  <td>${Math.round(item.protein)}g</td>
                  <td>${Math.round(item.carbs)}g</td>
                  <td>${Math.round(item.fat)}g</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Nutrition Summary Section -->
      <div class="section-card mb-4">
        <h4>Nutrition Summary</h4>
        <div class="nutrition-grid">
          <div class="nutrition-item">
            <h5>Calories</h5>
            <p>${Math.round(data.nutritionSummary.calories)} kcal</p>
          </div>
          <div class="nutrition-item">
            <h5>Protein</h5>
            <p>${Math.round(data.nutritionSummary.protein)}g</p>
          </div>
          <div class="nutrition-item">
            <h5>Carbs</h5>
            <p>${Math.round(data.nutritionSummary.carbs)}g</p>
          </div>
          <div class="nutrition-item">
            <h5>Fat</h5>
            <p>${Math.round(data.nutritionSummary.fat)}g</p>
          </div>
          <div class="nutrition-item">
            <h5>Fiber</h5>
            <p>${Math.round(data.nutritionSummary.fiber)}g</p>
          </div>
          <div class="nutrition-item">
            <h5>Sugar</h5>
            <p>${Math.round(data.nutritionSummary.sugar)}g</p>
          </div>
          <div class="nutrition-item">
            <h5>Saturated Fat</h5>
            <p>${Math.round(data.nutritionSummary.saturatedFat)}g</p>
          </div>
          <div class="nutrition-item">
            <h5>Sodium</h5>
            <p>${Math.round(data.nutritionSummary.sodium)}mg</p>
          </div>
        </div>
      </div>

      <!-- Recommendations Section -->
      <div class="section-card">
        <h4>Recommendations</h4>
        <ul class="recommendations-list">
          ${data.recommendations.map(rec => `
            <li class="recommendation-item">
              <i class="bi bi-lightbulb"></i>
              ${rec}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

  foodResult.innerHTML = html;
  foodResult.classList.remove('d-none');
  foodResult.classList.add('fade-in');
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message fade-in';
  errorDiv.textContent = message;
  
  const form = document.getElementById('foodForm');
  const existingError = form.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  form.appendChild(errorDiv);
}

// Detailed Nutrition Guide Information
const nutritionGuide = {
  calories: {
    title: 'Calories',
    description: 'Calories are units of energy that your body needs for all its functions. Daily energy needs depend on factors such as age, gender, weight, metabolism, and physical activity level.',
    recommendations: {
      general: 'General daily calorie needs vary:',
      ranges: [
        'Adult women: ~1,600–2,400 calories per day',
        'Adult men: ~2,000–3,000 calories per day',
        'Athletes or very active individuals may require more'
      ],
      tips: 'For weight loss, a typical strategy is to create a daily deficit of 500–750 calories from your maintenance level, though individual needs may differ.'
    }
  },
  protein: {
    title: 'Protein',
    description: 'Protein is crucial for building and repairing tissues, supporting immune function, and producing enzymes and hormones.',
    recommendations: {
      general: 'Protein needs vary based on body weight and activity level:',
      ranges: [
        'Sedentary adults: ~0.8 grams per kilogram of body weight',
        'Active adults: ~1.2–1.7 grams per kilogram',
        'Athletes: ~1.4–2.0 grams per kilogram (or more based on training demands)'
      ],
      tips: 'Distribute protein intake evenly throughout the day to support muscle repair and growth.'
    }
  },
  carbs: {
    title: 'Carbohydrates',
    description: "Carbohydrates are the body's primary energy source, vital for brain function and fueling physical activity.",
    recommendations: {
      general: 'Carbohydrate needs depend on your activity level and overall calorie goals:',
      ranges: [
        'Minimum for basic brain function: ~130 grams per day',
        'General intake: 45–65% of total daily calories should come from carbohydrates',
        'Endurance athletes: ~6–10 grams per kilogram of body weight'
      ],
      tips: 'Prioritize complex carbohydrates from whole grains, fruits, and vegetables over refined sugars.'
    }
  },
  fat: {
    title: 'Fat',
    description: 'Dietary fat is essential for hormone production, nutrient absorption, and cell health. Focus on healthy, unsaturated fats.',
    recommendations: {
      general: 'Aim for fats to comprise 20–35% of your total daily calories:',
      ranges: [
        'Minimum: ~0.5–1 gram per kilogram of body weight',
        'For a 2,000-calorie diet: roughly 44–78 grams of fat per day',
        'Adjustments may be necessary for athletes or those with higher energy needs'
      ],
      tips: 'Include sources like avocados, nuts, olive oil, and fatty fish to boost intake of healthy fats.'
    }
  },
  fiber: {
    title: 'Fiber',
    description: 'Fiber aids digestion, helps maintain blood sugar levels, and supports heart health by promoting satiety and reducing cholesterol.',
    recommendations: {
      general: 'Daily fiber intake recommendations:',
      ranges: [
        'Adult women: ~25 grams per day',
        'Adult men: ~38 grams per day',
        'Individuals over 50: Women ~21 grams; Men ~30 grams per day'
      ],
      tips: 'Increase fiber gradually in your diet and drink plenty of water to help prevent digestive discomfort.'
    }
  },
  sugar: {
    title: 'Sugar',
    description: 'Sugars can be naturally occurring (in fruits and dairy) or added during processing. Limiting added sugars is key to maintaining overall health.',
    recommendations: {
      general: 'Limit intake of added sugars:',
      ranges: [
        'Women: No more than ~25 grams of added sugar per day',
        'Men: No more than ~36 grams of added sugar per day',
        'Children: Aim for less than 25 grams per day'
      ],
      tips: 'Choose whole fruits and natural sources of sugar over processed foods with added sugars.'
    }
  },
  saturatedFat: {
    title: 'Saturated Fat',
    description: 'Saturated fats are found primarily in animal products and certain tropical oils. High intake is associated with increased heart disease risk.',
    recommendations: {
      general: 'Keep saturated fat intake low:',
      ranges: [
        'Less than 10% of total daily calories',
        'For a 2,000-calorie diet: approximately 22 grams or less per day',
        'Individuals at risk for heart disease should aim for even lower levels'
      ],
      tips: 'Opt for lean protein sources and reduce processed foods to minimize saturated fat intake.'
    }
  },
  sodium: {
    title: 'Sodium',
    description: 'Sodium is essential for fluid balance and nerve function, but too much can contribute to high blood pressure and other health issues.',
    recommendations: {
      general: 'Daily sodium guidelines are:',
      ranges: [
        'Healthy adults: Less than 2,300 mg per day',
        'At-risk individuals (e.g., high blood pressure): Less than 1,500 mg per day',
        'Athletes may require more to compensate for sodium loss through sweat'
      ],
      tips: 'Cook meals at home and choose low-sodium options to better manage your intake.'
    }
  },
};