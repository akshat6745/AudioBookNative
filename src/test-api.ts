import ky from 'ky';
import { API_URL } from './utils/config';

// Simple function to test API connection
const testApiConnection = async () => {
  try {
    const response = await ky.get(`${API_URL}/novels`);
    const data = await response.json();
    return true;
  } catch (error) {
    console.error('API connection failed:');
    if (error instanceof Error) {
      console.error(' - Error:', error.message);
      
      // Check if it's a response error (ky.HTTPError)
      if ('response' in error) {
        const httpError = error as { response: Response };
        console.error(' - Status:', httpError.response.status);
        console.error(' - Status Text:', httpError.response.statusText);
      } else {
        console.error(' - No response received. Server might be down.');
      }
    } else {
      console.error(' - Unexpected error:', error);
    }
    return false;
  }
};

// Execute the test
testApiConnection(); 