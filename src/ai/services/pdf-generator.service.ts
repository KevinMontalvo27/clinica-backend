import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Genera un PDF a partir de contenido en markdown
   * @param markdownContent - Contenido en formato markdown
   * @param options - Opciones de configuración del PDF
   * @returns Buffer del PDF generado
   */
  async generatePdfFromMarkdown(
  markdownContent: string,
  options?: {
    patientName?: string;
    generatedDate?: Date;
    clinicName?: string;
    generatedBy?: string;
    documentId?: string;
  },
): Promise<Buffer> {
  this.logger.log('Iniciando generación de PDF');

  try {
    // 1. Convertir markdown a HTML
    const rawHtml = await marked(markdownContent);
    this.logger.debug(`Markdown convertido a HTML: ${rawHtml.length} caracteres`);

    // 2. Sanitizar HTML para seguridad
    const cleanHtml = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr', 'strong', 'em', 'u',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ]),
      allowedAttributes: {
        '*': ['class', 'id'],
        'table': ['border', 'cellpadding', 'cellspacing'],
      },
    });
    this.logger.debug('HTML sanitizado correctamente');

    // 3. Construir HTML completo con template
    const fullHtml = this.buildHtmlTemplate(cleanHtml, options);

    // 4. Generar PDF con Puppeteer
    const pdfBuffer = await this.generatePdfWithPuppeteer(fullHtml);

    this.logger.log(`PDF generado exitosamente: ${pdfBuffer.length} bytes`);
    return pdfBuffer;

  } catch (error) {
    this.logger.error('Error al generar PDF', error.stack);
    throw new InternalServerErrorException(
      'No se pudo generar el PDF. Por favor intente nuevamente.',
    );
  }
}

   /**
   * Lee el template HTML del archivo
   */
  private getHtmlTemplate(): string {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'medical-history.template.html',
    );

    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error('Error al leer template HTML', error.stack);
      throw new InternalServerErrorException('Template HTML no encontrado');
    }
  }

  /**
   * Construye el HTML completo reemplazando variables en el template
   */
  private buildHtmlTemplate(
  content: string,
  options?: {
    patientName?: string;
    generatedDate?: Date;
    clinicName?: string;
    generatedBy?: string;
    documentId?: string;
  },
): string {
  const template = this.getHtmlTemplate();

  const patientName = options?.patientName || 'Paciente sin nombre';
  const clinicName = options?.clinicName || 'Sistema de Gestión Médica';
  const generatedDate = options?.generatedDate || new Date();
  const generatedBy = options?.generatedBy || 'Sistema Automático';
  const documentId = options?.documentId || this.generateDocumentId();

  const formattedDate = generatedDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Reemplazar variables en el template
  return template
    .replace(/\{\{PATIENT_NAME\}\}/g, this.escapeHtml(patientName))
    .replace(/\{\{CLINIC_NAME\}\}/g, this.escapeHtml(clinicName))
    .replace(/\{\{GENERATED_DATE\}\}/g, this.escapeHtml(formattedDate))
    .replace(/\{\{GENERATED_BY\}\}/g, this.escapeHtml(generatedBy))
    .replace(/\{\{DOCUMENT_ID\}\}/g, this.escapeHtml(documentId))
    .replace(/\{\{CONTENT\}\}/g, content);
}

   /**
   * Genera un ID único para el documento
   */
  private generateDocumentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MH-${timestamp}-${random}`;
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  private async generatePdfWithPuppeteer(html: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.debug('Iniciando navegador Puppeteer');

      // Usar configuración centralizada
      const browserConfig = this.getPuppeteerConfig();
      browser = await puppeteer.launch(browserConfig);
      this.logger.debug('Navegador iniciado correctamente');

      const page = await browser.newPage();
      
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      this.logger.debug('Página creada con viewport configurado');

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      this.logger.debug('HTML cargado en la página');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Usar configuración centralizada del PDF
      const pdfConfig = this.getPdfConfig();
      const pdfBuffer = await page.pdf(pdfConfig);

      this.logger.debug(`PDF generado correctamente: ${pdfBuffer.length} bytes`);
      
      return Buffer.from(pdfBuffer);

    } catch (error) {
      this.logger.error('Error en Puppeteer', error.stack);
      
      if (error.message.includes('timeout')) {
        throw new InternalServerErrorException(
          'Timeout al generar PDF. El documento es muy grande o el servidor está sobrecargado.',
        );
      } else if (error.message.includes('Protocol error')) {
        throw new InternalServerErrorException(
          'Error de comunicación con el navegador. Intente nuevamente.',
        );
      } else {
        throw new InternalServerErrorException(
          'Error al generar el PDF. Por favor intente nuevamente.',
        );
      }

    } finally {
      if (browser) {
        try {
          await browser.close();
          this.logger.debug('Navegador cerrado correctamente');
        } catch (closeError) {
          this.logger.warn('Error al cerrar navegador', closeError);
        }
      }
    }
  }

  /**
   * Obtiene la configuración de Puppeteer según el entorno
   */
  private getPuppeteerConfig(): puppeteer.LaunchOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDocker = process.env.DOCKER === 'true';

    const config: puppeteer.LaunchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--no-first-run',
        '--no-zygote',
        '--hide-scrollbars',
        '--disable-translate',
        '--disable-background-networking',
        '--disable-default-apps',
        '--mute-audio',
      ],
      protocolTimeout: 60000,
    };

    // Configuración específica para Docker
    if (isDocker) {
      config.args?.push('--single-process');
      config.executablePath = '/usr/bin/google-chrome-stable';
    }

    // Configuración específica para desarrollo
    if (!isProduction) {
      // En desarrollo, puedes ver el navegador descomentando esto:
      // config.headless = false;
      // config.devtools = true;
      this.logger.debug('Puppeteer en modo desarrollo');
    }

    return config;
  }

  /**
   * Obtiene la configuración del PDF
   */
  private getPdfConfig(): puppeteer.PDFOptions {
    return {
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: {
        top: '25mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm',
      },
      preferCSSPageSize: false,
      scale: 1,
      displayHeaderFooter: true,
      headerTemplate: this.getHeaderTemplate(),
      footerTemplate: this.getFooterTemplate(),
      tagged: true,
      timeout: 60000,
    };
  }

  /**
   * Template del header
   */
  private getHeaderTemplate(): string {
    return `
      <div style="width: 100%; font-size: 9px; color: #999; 
                  text-align: center; padding: 0 20px;">
        <span style="color: #2980b9; font-weight: bold;">
          Sistema de Gestión Médica
        </span>
      </div>
    `;
  }

  /**
   * Template del footer
   */
  private getFooterTemplate(): string {
    const currentDate = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <div style="width: 100%; font-size: 9px; color: #999; 
                  text-align: center; padding: 0 20px;
                  display: flex; justify-content: space-between;">
        <span>Documento Confidencial</span>
        <span>
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </span>
        <span>${currentDate}</span>
      </div>
    `;
  }
}