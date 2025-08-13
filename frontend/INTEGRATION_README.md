# Neolectra - Frontend Backend Integration

This document outlines the backend integration implementation for the Neolectra frontend application.

## Backend Integration Overview

The frontend has been successfully integrated with the FastAPI backend to provide:

1. **Solar Analysis**: Upload roof images and get comprehensive solar panel analysis with optional BESCOM integration
2. **Rainwater Harvesting**: Upload roof images and analyze rainwater harvesting potential based on location and configuration
3. **Real-time Results**: Display analysis results with beautiful, responsive UI components

## New Features Added

### 1. API Service Layer (`lib/api.ts`)
- Centralized API client with axios
- Type-safe interfaces for all API responses
- Error handling and timeout configuration
- Support for both solar and rainwater analysis endpoints

### 2. Enhanced User Input Pages
- **Solar Input** (`/userinput`): Image upload, BESCOM ID input, and real-time analysis
- **Rainwater Input** (`/rainwater-input`): Image upload, location input, and configuration options

### 3. Results Display Components
- **SolarResultsDisplay**: Comprehensive solar analysis results with ROI calculations
- **RainwaterResultsDisplay**: Detailed rainwater harvesting analysis with monthly breakdowns

### 4. Utility Functions (`lib/utils.ts`)
- Image handling utilities
- Geolocation services
- Data formatting helpers
- Currency and number formatting for Indian locale

## Environment Configuration

### Backend Base URL
The backend URL is now configurable via environment variables:

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## API Integration Details

### Solar Analysis Endpoint
```typescript
POST /api/solar/analyze
- Form data with image file
- Optional BESCOM account ID parameter
- Returns comprehensive solar analysis including:
  - Roof area detection
  - Panel placement optimization
  - Energy generation calculations
  - Financial ROI analysis (if BESCOM ID provided)
  - Environmental impact metrics
```

### Rainwater Analysis Endpoint
```typescript
POST /api/rainwater/analyze
- Form data with image file
- Location coordinates (lat, lng)
- Configuration parameters (roof type, efficiency, etc.)
- Returns detailed rainwater analysis including:
  - Roof area detection
  - Rainfall data analysis
  - Monthly water collection estimates
  - Financial savings calculations
  - Tank sizing recommendations
```

## Key Components

### 1. Solar Analysis Flow
1. User uploads roof image on `/userinput`
2. Optional BESCOM ID for personalized analysis
3. Image processed by backend for roof detection
4. Solar panel placement optimization
5. Comprehensive results display with ROI calculations

### 2. Rainwater Analysis Flow
1. User uploads roof image on `/rainwater-input`
2. Location coordinates (auto-detected or manual)
3. Configuration parameters (roof type, efficiency, etc.)
4. Backend processes image and fetches rainfall data
5. Detailed analysis with monthly breakdowns

## Error Handling

- Network error handling with user-friendly messages
- Image validation before upload
- Form validation for required fields
- Loading states during analysis
- Fallback for missing environment variables

## Responsive Design

- Mobile-first responsive design
- Touch-friendly interface
- Optimized for tablets and desktops
- Progressive enhancement

## Data Storage

- Local storage for configuration backup
- Session persistence for form data
- Results caching for performance

## Performance Optimizations

- Image compression before upload
- Lazy loading of components
- Debounced API calls
- Optimized bundle size

## Testing the Integration

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend development server running on `http://localhost:3000`

### Test Solar Analysis
1. Navigate to `/userinput`
2. Upload a clear roof image
3. Optionally enter BESCOM ID for financial analysis
4. Click "Analyze Solar Potential"
5. View comprehensive results

### Test Rainwater Analysis
1. Navigate to `/rainwater-input`
2. Upload a clear roof image
3. Ensure location coordinates are filled
4. Configure harvesting parameters
5. Click "Analyze Rainwater Potential"
6. View detailed monthly analysis

## Deployment Considerations

### Environment Variables
```bash
# Production
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com

# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend CORS Configuration
Ensure backend allows requests from your frontend domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Future Enhancements

1. **Real-time Progress**: WebSocket integration for analysis progress
2. **Batch Processing**: Multiple image uploads
3. **Advanced Filters**: Additional roof types and configurations
4. **Export Features**: PDF reports generation
5. **User Authentication**: Save and manage multiple projects
6. **Notifications**: Email reports and reminders

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check backend CORS configuration
2. **Environment Variables**: Ensure `.env.local` file is created
3. **Image Upload Fails**: Check file size and format
4. **API Timeout**: Increase timeout in api client configuration

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Security Considerations

1. API key protection via environment variables
2. Image validation and sanitization
3. HTTPS enforcement in production
4. Rate limiting on backend endpoints
5. Input validation on all form fields

## Performance Monitoring

Monitor these key metrics:
- Image upload time
- API response time
- Results rendering time
- User engagement metrics

## Support

For technical support or questions about the integration:
- Check backend logs for API errors
- Verify environment configuration
- Test with smaller image files if uploads fail
- Ensure stable internet connection for location services
