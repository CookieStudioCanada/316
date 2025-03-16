function calculateDeficit() {
  const gender = document.getElementById('gender').value;
  const weightLbs = parseFloat(document.getElementById('weight').value);
  const feet = parseInt(document.getElementById('feet').value);
  const inches = parseInt(document.getElementById('inches').value);
  const age = parseInt(document.getElementById('age').value);
  const activityFactor = parseFloat(document.getElementById('activity').value);

  if (isNaN(weightLbs) || isNaN(feet) || isNaN(inches) || isNaN(age)) {
    document.getElementById('result').innerHTML = '<p class="error-message">Please fill in all fields correctly.</p>';
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

  const weeklyLossMild = (250 * 7) / 7700; // kcal deficit to kg, then to lbs
  const weeklyLossModerate = (500 * 7) / 7700;
  const weeklyLossAggressive = (750 * 7) / 7700;

  document.getElementById('result').innerHTML = `
    <p><strong>Base Metabolic Rate (BMR):</strong> ${Math.round(bmr)} calories/day</p>
    <p><strong>Total Daily Energy Expenditure (TDEE):</strong> ${Math.round(tdee)} calories/day</p>
    <hr style="border: 1px solid #e9ecef; margin: 15px 0;">
    <p><strong>Weight Loss Plans:</strong></p>
    <p>🌱 <strong>Mild Deficit:</strong> ${Math.round(mildDeficit)} calories/day<br>
    <small>Expected loss: ${(weeklyLossMild * 2.20462).toFixed(1)} lbs/week</small></p>
    <p>⭐ <strong>Moderate Deficit:</strong> ${Math.round(moderateDeficit)} calories/day<br>
    <small>Expected loss: ${(weeklyLossModerate * 2.20462).toFixed(1)} lbs/week</small></p>
    <p>🔥 <strong>Aggressive Deficit:</strong> ${Math.round(aggressiveDeficit)} calories/day<br>
    <small>Expected loss: ${(weeklyLossAggressive * 2.20462).toFixed(1)} lbs/week</small></p>
  `;
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
    alert('Please enter what you ate today');
    return;
  }

  // Show loading state
  const loading = document.getElementById('loading');
  const resultDiv = document.getElementById('foodResult');
  loading.style.display = 'block';
  resultDiv.innerHTML = '';

  try {
    const response = await fetch('https://analyzenutrition-ik32xiclqq-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: foodInput })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze food intake');
    }

    // Display results in a grid of cards
    resultDiv.innerHTML = `
      <div class="nutrition-result">
        <div class="nutrition-card">
          <h3>Total Calories</h3>
          <div class="value">${Math.round(data.calories || 0)}</div>
          <div class="unit">kcal</div>
        </div>
        <div class="nutrition-card">
          <h3>Protein</h3>
          <div class="value">${Math.round(data.protein || 0)}</div>
          <div class="unit">g</div>
        </div>
        <div class="nutrition-card">
          <h3>Carbohydrates</h3>
          <div class="value">${Math.round(data.carbs || 0)}</div>
          <div class="unit">g</div>
        </div>
        <div class="nutrition-card">
          <h3>Fat</h3>
          <div class="value">${Math.round(data.fat || 0)}</div>
          <div class="unit">g</div>
        </div>
      </div>
      <p style="text-align: center; margin-top: 20px; color: #666;">
        <small>Request ID: ${data.requestId}</small>
      </p>
    `;

  } catch (error) {
    resultDiv.innerHTML = `
      <p class="error-message">
        Sorry, there was an error analyzing your food intake. Please try again.<br>
        <small>${error.message}</small>
      </p>
    `;
  } finally {
    loading.style.display = 'none';
  }
} 