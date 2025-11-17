interface ApiConfig {
  baseUrl: string;
  appName: string;
  appVersion: string;
  features: {
    streaming: boolean;
  };
  timeout: number;
  retryAttempts: number;
}

class ApiConfigValidator {
  private getEnv(key: string, defaultValue?: string): string {
    const value = import.meta.env[key];
    if (!value && !defaultValue) {
      console.error(`Missing required environment variable: ${key}`);
      throw new Error(`Configuration error: ${key} is required`);
    }
    return value || defaultValue || '';
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value === 'true' || value === true;
  }

  validate(): ApiConfig {
    const baseUrl = this.getEnv('VITE_API_BASE_URL');

    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      throw new Error('VITE_API_BASE_URL must start with http:// or https://');
    }

    const config: ApiConfig = {
      baseUrl,
      appName: this.getEnv('VITE_APP_NAME', 'Avon Health RAG'),
      appVersion: this.getEnv('VITE_APP_VERSION', '1.0.0'),
      features: {
        streaming: this.getEnvBoolean('VITE_ENABLE_STREAMING', false),
      },
      timeout: 30000,
      retryAttempts: 3,
    };

    return config;
  }
}

const validator = new ApiConfigValidator();
const apiConfig = validator.validate();

export default apiConfig;

export const API_ENDPOINTS = {
  health: '/health',
  query: '/api/query',
  emr: {
    carePlans: '/api/emr/care_plans',
    medications: '/api/emr/medications',
    notes: '/api/emr/notes',
    all: '/api/emr/all',
  },
  queries: {
    recent: '/api/queries/recent',
  },
  index: {
    patient: (patientId: string) => `/api/index/patient/${patientId}`,
  },
  metrics: '/api/metrics',
} as const;
