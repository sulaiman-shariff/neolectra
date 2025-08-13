# 🌱 Neolectra - Sustainable Energy & Water Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.4-green)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Problem Statement

In today's world, sustainable energy and water management are critical challenges that require innovative solutions:

### Energy Challenges
- **High Electricity Costs**: Rising electricity bills and dependency on non-renewable sources
- **Limited Solar Adoption**: Lack of accessible tools for solar potential assessment
- **Complex ROI Calculations**: Difficulty in understanding solar investment returns
- **BESCOM Integration**: Manual billing analysis and consumption tracking

### Water Management Challenges
- **Water Scarcity**: Increasing water stress in urban areas
- **Rainwater Waste**: Untapped potential of rainwater harvesting
- **Complex Calculations**: Difficulty in estimating rainwater collection potential
- **Weather Dependency**: Need for accurate weather data integration

### Technical Barriers
- **Limited Accessibility**: Complex technical solutions not accessible to general users
- **Data Integration**: Lack of unified platform for energy and water analysis
- **Real-time Analysis**: Need for immediate insights and recommendations

## 🚀 Our Solution

Neolectra is a comprehensive platform that addresses these challenges through an integrated approach combining **artificial intelligence**, **computer vision**, and **data analytics** to provide sustainable solutions for both energy and water management.

### Core Capabilities

#### 🌞 Solar Power Analysis
- **Rooftop Detection**: AI-powered image analysis to calculate roof area and solar potential
- **Panel Optimization**: Smart placement algorithms for maximum efficiency
- **ROI Calculator**: Comprehensive financial analysis with payback period calculations
- **BESCOM Integration**: Real-time electricity consumption analysis and solar savings projection

#### 💧 Rainwater Harvesting
- **Weather Integration**: OpenMeteo API integration for accurate rainfall data
- **Collection Optimization**: Smart calculations considering roof type, efficiency, and demand
- **Tank Sizing**: Intelligent tank capacity recommendations based on usage patterns
- **Monthly Analysis**: Detailed monthly and daily collection potential

#### 🏠 Smart Building Analysis
- **Computer Vision**: Advanced image processing for building analysis
- **Geometric Calculations**: Precise area and volume calculations
- **Multi-format Support**: Handles various image formats and building types

## ✨ Key Features

### 🔍 Intelligent Analysis
- **AI-Powered Detection**: Computer vision algorithms for accurate rooftop analysis
- **Real-time Calculations**: Instant results with comprehensive data visualization
- **Multi-format Support**: Handles JPG, PNG, and other image formats
- **Batch Processing**: Analyze multiple images simultaneously

### 📊 Comprehensive Reporting
- **Detailed Analytics**: In-depth analysis with charts and graphs
- **Financial Projections**: ROI calculations and payback period analysis
- **Environmental Impact**: Carbon footprint reduction estimates
- **Customizable Reports**: Tailored recommendations based on user requirements

### 🌐 Modern Web Interface
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Interactive Maps**: Google Maps integration for location-based analysis
- **Real-time Updates**: Live data updates and progress tracking
- **Accessibility**: Designed for users of all technical levels

### 🔌 API-First Architecture
- **RESTful APIs**: Well-documented endpoints for third-party integration
- **OpenAPI Documentation**: Interactive API documentation with Swagger UI
- **CORS Support**: Cross-origin resource sharing for web applications
- **Rate Limiting**: Built-in protection against abuse

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15.4.6](https://nextjs.org/) - React-based full-stack framework
- **Language**: [TypeScript 5.0](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS 3.3.0](https://tailwindcss.com/) - Utility-first CSS framework
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) - Modern Redux with RTK
- **UI Components**: [Framer Motion](https://www.framer.com/motion/) - Animation library
- **3D Graphics**: [Three.js](https://threejs.org/) - 3D visualization library
- **Maps**: [Google Maps React](https://www.npmjs.com/package/@vis.gl/react-google-maps) - Interactive mapping

### Backend
- **Framework**: [FastAPI 0.115.4](https://fastapi.tiangolo.com/) - Modern Python web framework
- **Language**: [Python 3.10+](https://www.python.org/) - High-level programming language
- **Server**: [Uvicorn](https://www.uvicorn.org/) - Lightning-fast ASGI server
- **Image Processing**: [OpenCV 4.8.1](https://opencv.org/) - Computer vision library
- **Data Analysis**: [Pandas 2.2.3](https://pandas.pydata.org/) - Data manipulation library
- **Geometric Calculations**: [Shapely 2.0.6](https://shapely.readthedocs.io/) - Spatial analysis
- **Weather API**: [OpenMeteo](https://open-meteo.com/) - Free weather data service

### DevOps & Tools
- **Package Manager**: npm (Node.js) and pip (Python)
- **Build Tool**: Next.js built-in build system
- **Linting**: ESLint with Next.js configuration
- **Code Formatting**: Prettier (via Tailwind CSS)
- **Version Control**: Git with GitHub workflow

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  External APIs  │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (OpenMeteo,    │
│                 │    │                 │    │   BESCOM)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── calculate/         # Solar calculation page
│   ├── crop/             # Image cropping interface
│   ├── map/              # Interactive map view
│   ├── rainwater-input/  # Rainwater analysis input
│   ├── results/          # Analysis results display
│   ├── suggestions/      # AI-powered recommendations
│   └── userinput/        # User input forms
├── components/            # Reusable React components
│   ├── Loading/          # Loading states and animations
│   ├── MapAPIProvider/   # Google Maps integration
│   ├── ReduxProvider/    # State management
│   └── SolarPanel/       # 3D solar panel visualization
└── lib/                  # Utility functions and helpers
```

### Backend Architecture
```
backend/
├── main.py               # FastAPI application entry point
├── rooftop_detection.py  # Computer vision algorithms
├── rainwater.py          # Rainwater harvesting calculations
├── bescom_scraper.py     # BESCOM billing integration
├── requirements.txt      # Python dependencies
└── readme.md            # Backend documentation
```

### Data Flow
1. **User Input**: Image upload + location/parameters
2. **Image Processing**: Computer vision analysis using OpenCV
3. **Data Integration**: Weather data from OpenMeteo API
4. **Calculations**: Mathematical models for solar/water potential
5. **Results**: Comprehensive analysis with visualizations
6. **Storage**: Optional data persistence for user accounts

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 18+** and **npm** for frontend
- **Python 3.10+** and **pip** for backend
- **Git** for version control

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/neolectra.git
cd neolectra/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Backend Setup
```bash
# Navigate to backend directory
cd ../backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the server
python main.py
# Or using uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Backend (.env)
BESCOM_APPSERVICEKEY=your_bescom_key
BESCOM_RESPONSE_KEY=your_bescom_response_key
BESCOM_BASE=https://bescom.org/api
```

## 📖 Usage

### Web Interface
1. **Upload Image**: Upload a rooftop or building image
2. **Set Parameters**: Configure location, roof type, and requirements
3. **Analyze**: Get instant AI-powered analysis
4. **Review Results**: Comprehensive reports with visualizations
5. **Export**: Download reports or share results

### API Usage
```bash
# Solar panel analysis
curl -X POST "http://localhost:8000/api/solar/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@rooftop_image.jpg"

# Rainwater harvesting report
curl -X POST "http://localhost:8000/api/rainwater/report" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 12.9716,
    "lon": 77.5946,
    "roof_area_m2": 120,
    "roof_type": "concrete"
  }'
```

## 📚 API Documentation

### Core Endpoints

#### Solar Analysis
- `POST /api/solar/analyze` - Analyze solar potential from image
- `POST /api/solar/roi` - Calculate solar ROI and payback period

#### Rainwater Harvesting
- `POST /api/rainwater/analyze` - Analyze rainwater potential
- `POST /api/rainwater/report` - Generate detailed rainwater report

#### Rooftop Detection
- `POST /api/rooftop/analyze` - Detect and measure rooftop area

#### BESCOM Integration
- `POST /api/bescom/billing` - Fetch and analyze electricity bills

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 📁 Project Structure

```
neolectra/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utility functions
│   ├── public/              # Static assets
│   │   ├── images/          # Image assets
│   │   └── models/          # 3D models
│   ├── package.json         # Node.js dependencies
│   └── tailwind.config.ts   # Tailwind configuration
├── backend/                  # FastAPI backend application
│   ├── main.py              # Main application file
│   ├── rooftop_detection.py # Computer vision module
│   ├── rainwater.py         # Rainwater calculations
│   ├── bescom_scraper.py    # BESCOM integration
│   ├── requirements.txt     # Python dependencies
│   └── readme.md           # Backend documentation
├── readme.md                # This file
└── .gitignore              # Git ignore patterns
```

## 🔧 Development

### Code Quality
- **TypeScript**: Strict type checking for frontend
- **Pydantic**: Data validation for backend APIs
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🌟 Key Benefits

### For Users
- **Accessibility**: No technical expertise required
- **Accuracy**: AI-powered analysis with high precision
- **Comprehensive**: Complete solution for energy and water management
- **Cost-effective**: Free platform with premium features

### For Developers
- **Modern Stack**: Latest technologies and best practices
- **Scalable**: Microservices architecture for easy scaling
- **Extensible**: Plugin-based system for new features
- **Well-documented**: Comprehensive API documentation

### For Environment
- **Carbon Reduction**: Promotes renewable energy adoption
- **Water Conservation**: Encourages rainwater harvesting
- **Sustainable Living**: Educates users on green practices
- **Data-driven**: Evidence-based recommendations

## 🚀 Future Roadmap

### Phase 1 (Current)
- ✅ Core solar analysis functionality
- ✅ Rainwater harvesting calculations
- ✅ BESCOM integration
- ✅ Basic web interface

### Phase 2 (Next)
- 🔄 Advanced AI models for better accuracy
- 🔄 Mobile application development
- 🔄 User authentication and data persistence
- 🔄 Integration with more utility providers

### Phase 3 (Future)
- 📋 Machine learning for predictive analysis
- 📋 IoT device integration
- 📋 Community features and sharing
- 📋 Advanced financial modeling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenMeteo** for free weather data
- **BESCOM** for electricity billing integration
- **OpenCV** community for computer vision tools
- **Next.js** and **FastAPI** teams for excellent frameworks

---

**Made with ❤️ for a sustainable future**

*Neolectra - Empowering sustainable living through intelligent technology*
