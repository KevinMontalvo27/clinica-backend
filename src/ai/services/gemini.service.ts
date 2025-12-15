import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiGenerateOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY no está configurada');
      throw new Error('GEMINI_API_KEY es requerida para usar el servicio de IA');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Usar modelo Gemini Pro por defecto
    const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';
    this.model = this.genAI.getGenerativeModel({ model: modelName });

    this.logger.log(`GeminiService inicializado con modelo: ${modelName}`);
  }

  /**
   * Genera texto usando Gemini
   * @param options - Opciones de generación
   * @returns Respuesta de Gemini
   */
  async generateContent(options: GeminiGenerateOptions): Promise<GeminiResponse> {
    try {
      this.logger.debug(`Generando contenido con prompt de ${options.prompt.length} caracteres`);

      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
        maxOutputTokens: options.maxTokens ?? 8192,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      this.logger.debug(`Contenido generado exitosamente: ${text.length} caracteres`);

      return {
        text,
        usage: {
          promptTokens: 0, // Gemini no proporciona conteo de tokens en la respuesta
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error al generar contenido con Gemini: ${error.message}`, error.stack);

      // Manejar errores específicos de la API
      if (error.message?.includes('API key')) {
        throw new HttpException(
          'Error de configuración de API de Gemini',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new HttpException(
          'Límite de uso de API excedido. Intente más tarde',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error.message?.includes('timeout')) {
        throw new HttpException(
          'Timeout al comunicarse con Gemini API',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        'Error al generar contenido con IA',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Genera contenido de forma segura con reintentos
   * @param options - Opciones de generación
   * @param retries - Número de reintentos
   * @returns Respuesta de Gemini
   */
  async generateContentWithRetry(
    options: GeminiGenerateOptions,
    retries: number = 3,
  ): Promise<GeminiResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`Intento ${attempt}/${retries} de generar contenido`);
        return await this.generateContent(options);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Intento ${attempt} fallido: ${error.message}`);

        // No reintentar si es un error de configuración o autenticación
        if (error.status === HttpStatus.INTERNAL_SERVER_ERROR) {
          throw error;
        }

        // Esperar antes de reintentar (exponential backoff)
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          this.logger.debug(`Esperando ${waitTime}ms antes del siguiente intento`);
          await this.sleep(waitTime);
        }
      }
    }

    this.logger.error(`Todos los intentos fallaron después de ${retries} reintentos`);
    throw lastError || new Error('Error desconocido al generar contenido');
  }

  /**
   * Valida que el servicio esté correctamente configurado
   * @returns true si está configurado correctamente
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const testPrompt = 'Responde solo con "OK"';
      const response = await this.generateContent({ 
        prompt: testPrompt,
        maxTokens: 10,
      });
      
      return response.text.length > 0;
    } catch (error) {
      this.logger.error('Validación de configuración fallida', error.stack);
      return false;
    }
  }

  /**
   * Obtiene información del modelo actual
   * @returns Información del modelo
   */
  getModelInfo(): { name: string; provider: string } {
    const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';
    return {
      name: modelName,
      provider: 'Google Gemini',
    };
  }

  /**
   * Función auxiliar para esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}