# Neolectra Backend API

This is the FastAPI backend for the Neolectra project, providing comprehensive APIs for rooftop analysis, solar panel estimation, rainwater harvesting calculations, and BESCOM billing integration.

## Features

- **Rooftop Detection**: Analyze rooftop images to calculate roof area
- **Solar Panel Analysis**: Estimate solar panel capacity and placement on rooftops
- **Rainwater Harvesting**: Calculate rainwater collection potential with weather data
- **BESCOM Billing**: Fetch and parse BESCOM electricity billing data
- **RESTful API**: Well-documented FastAPI with automatic OpenAPI documentation

## Installation

1. Install Python 3.10 or higher
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the FastAPI server:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check

### Rooftop Analysis
- `POST /api/rooftop/analyze` - Analyze rooftop from uploaded image
  - **Input**: Image file (multipart/form-data)
  - **Output**: Roof area in square meters

### Solar Panel Analysis
- `POST /api/solar/analyze` - Analyze solar panel potential
  - **Input**: Image file (multipart/form-data)
  - **Output**: Panel area, estimated number of panels, efficiency metrics, overlay image

### Rainwater Harvesting
- `POST /api/rainwater/analyze` - Analyze rainwater potential from image + location
  - **Input**: Image file + query parameters (lat, lon, roof_type, etc.)
  - **Output**: Complete rainwater harvesting analysis with monthly/daily data

- `POST /api/rainwater/report` - Generate rainwater report from parameters only
  - **Input**: JSON with coordinates, roof area, and harvesting parameters
  - **Output**: Detailed rainwater harvesting report with weather data

### BESCOM Billing
- `POST /api/bescom/billing` - Fetch BESCOM billing data
  - **Input**: JSON with account_id
  - **Output**: Parsed billing history with amounts and dates

### Reference Data
- `GET /api/roof-types` - Get available roof types and coefficients
- `GET /api/connection-types` - Get BWSSB connection types

## Example Usage

### Rooftop Analysis
```bash
curl -X POST "http://localhost:8000/api/rooftop/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@rooftop_image.jpg"
```

### Rainwater Report
```bash
curl -X POST "http://localhost:8000/api/rainwater/report" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 12.9716,
    "lon": 77.5946,
    "roof_area_m2": 120,
    "roof_type": "concrete",
    "monthly_demand_liters": 32000,
    "tank_capacity_liters": 20000
  }'
```

### BESCOM Billing
```bash
curl -X POST "http://localhost:8000/api/bescom/billing" \
  -H "Content-Type: application/json" \
  -d '{"account_id": "3330427000"}'
```

## Testing

Run the test script to verify API functionality:

```bash
python test_api.py
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── rooftop_detection.py    # Computer vision for rooftop analysis
├── rainwater.py           # Rainwater harvesting calculations
├── bescom_scraper.py      # BESCOM billing scraper
├── test_api.py           # API test script
├── requirements.txt       # Python dependencies
└── readme.md             # This file
```

## Dependencies

Key dependencies include:
- **FastAPI**: Modern, fast web framework for building APIs
- **OpenCV**: Computer vision for image processing
- **Pandas**: Data manipulation for weather and billing data
- **Shapely**: Geometric calculations for rooftop analysis
- **Pillow**: Image processing
- **OpenMeteo**: Weather data API integration
- **Requests**: HTTP client for external APIs

## Configuration

The application uses environment variables for configuration:
- `BESCOM_APPSERVICEKEY`: BESCOM API service key
- `BESCOM_RESPONSE_KEY`: BESCOM response encryption key
- `BESCOM_BASE`: BESCOM API base URL

## Error Handling

The API includes comprehensive error handling:
- Input validation using Pydantic models
- Image format validation
- Graceful error responses with meaningful messages
- HTTP status codes following REST conventions

## CORS

CORS is configured to allow all origins for development. Configure appropriately for production use.

## Development

To extend the API:
1. Add new endpoints in `main.py`
2. Create Pydantic models for request/response validation
3. Add comprehensive error handling
4. Update tests in `test_api.py`
5. Document new endpoints in this README

## Production Deployment

For production deployment:
1. Configure CORS origins appropriately
2. Set up environment variables securely
3. Use a production ASGI server like Gunicorn with Uvicorn workers
4. Implement proper logging and monitoring
5. Add authentication if required

## License

This project is part of the Neolectra suite for sustainable energy and water management solutions.