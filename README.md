# Nutrition Calculator

A modern web application that helps users calculate their caloric needs and analyze their food intake. Built with HTML, Bootstrap, and JavaScript.

## Features

- **Calorie Deficit Calculator**: Calculate your BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure)
- **Food Analysis**: Get detailed nutritional information about your meals using AI
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technologies Used

- HTML5
- Bootstrap 5.3.3
- JavaScript
- Google Fonts (Inter)
- Cloud Run API for nutrition analysis

## Setup

1. Clone the repository
2. Open `index.html` in your browser
3. No build process required - it's ready to use!

## API Integration

The application uses a Cloud Run API endpoint for food analysis:
- Endpoint: `https://analyzenutrition-ik32xiclqq-uc.a.run.app`
- Method: POST
- Request format: `{ "text": "your food description" }`
- Response format: `{ "calories": number, "protein": number, "carbs": number, "fat": number }`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License 