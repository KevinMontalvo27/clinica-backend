import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  Headers,
  Res,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiProduces
} from '@nestjs/swagger';
import { MedicalHistoryAIService } from './services/medical-history-ai.service';
import { GenerateMedicalHistoryDto } from './dtos/generate-medical-history.dto';
import { GeneratedMedicalHistoryResponseDto } from './dtos/generated-medical-history-response.dto';
import { GeneratedMedicalHistory } from './generated-medical-history.entity';
import type { Response } from 'express';

@ApiTags('medical-history-ai')
@Controller('medical-history')
// @ApiBearerAuth() // Descomentar cuando implementes JWT
// @UseGuards(JwtAuthGuard) // Descomentar cuando implementes guards
export class MedicalHistoryController {
  private readonly logger = new Logger(MedicalHistoryController.name);
  constructor(
    private readonly medicalHistoryAIService: MedicalHistoryAIService,
  ) {}

  /**
   * Genera un historial médico usando IA
   * POST /api/medical-history/patient/:patientId/generate
   */
  @Post('patient/:patientId/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar historial médico con IA',
    description:
      'Genera un historial médico completo del paciente usando inteligencia artificial. ' +
      'Recopila todas las citas, consultas y datos médicos del paciente para crear un informe narrativo.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID del paciente',
    example: 'uuid-patient-123',
  })
  @ApiResponse({
    status: 201,
    description: 'Historial médico generado exitosamente',
    type: GeneratedMedicalHistoryResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a este historial',
  })
  @ApiResponse({
    status: 404,
    description: 'Paciente no encontrado',
  })
  @ApiResponse({
    status: 503,
    description: 'Servicio de IA no disponible',
  })
  @ApiResponse({
    status: 429,
    description: 'Límite de uso de API excedido',
  })
  async generateMedicalHistory(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() generateDto: GenerateMedicalHistoryDto,
    @Headers('x-user-id') userId: string,
    // @CurrentUser('id') userId: string // Descomentar cuando implementes decorador de usuario
  ): Promise<GeneratedMedicalHistory> {
  
    
    return await this.medicalHistoryAIService.generateMedicalHistory(
      patientId,
      generateDto,
      userId,
    );
  }

  /**
   * Obtiene historiales generados previamente
   * GET /api/medical-history/patient/:patientId
   */
  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historiales generados',
    description: 'Lista todos los historiales médicos generados previamente para un paciente.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID del paciente',
    example: 'uuid-patient-123',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de historiales a obtener',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de historiales generados',
    type: [GeneratedMedicalHistoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Paciente no encontrado',
  })
  async getGeneratedHistories(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<GeneratedMedicalHistory[]> {
    return await this.medicalHistoryAIService.getGeneratedHistories(
      patientId,
      limit || 10,
    );
  }

  /**
   * Obtiene un historial específico por ID
   * GET /api/medical-history/:historyId
   */
  @Get(':historyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial por ID',
    description: 'Retorna un historial médico generado específico.',
  })
  @ApiParam({
    name: 'historyId',
    description: 'UUID del historial generado',
    example: 'uuid-history-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial encontrado',
    type: GeneratedMedicalHistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Historial no encontrado',
  })
  async getHistoryById(
    @Param('historyId', new ParseUUIDPipe()) historyId: string,
  ): Promise<GeneratedMedicalHistory> {
    return await this.medicalHistoryAIService.getHistoryById(historyId);
  }

  /**
   * Elimina un historial generado
   * DELETE /api/medical-history/:historyId
   */
  @Delete(':historyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar historial generado',
    description: 'Elimina permanentemente un historial médico generado.',
  })
  @ApiParam({
    name: 'historyId',
    description: 'UUID del historial a eliminar',
    example: 'uuid-history-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Historial médico eliminado exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Historial no encontrado',
  })
  // @Roles('ADMIN', 'DOCTOR') // Descomentar cuando implementes guards
  async deleteHistory(
    @Param('historyId', new ParseUUIDPipe()) historyId: string,
  ): Promise<{ message: string }> {
    await this.medicalHistoryAIService.deleteHistory(historyId);
    return { message: 'Historial médico eliminado exitosamente' };
  }

  /**
   * Vista previa de datos para generación
   * GET /api/medical-history/patient/:patientId/preview
   */
  @Get('patient/:patientId/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vista previa de datos',
    description:
      'Muestra un resumen de los datos que se usarán para generar el historial, ' +
      'sin realizar la llamada a la API de IA. Útil para verificar la información disponible.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID del paciente',
    example: 'uuid-patient-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Vista previa de datos',
    schema: {
      type: 'object',
      properties: {
        patient: { type: 'object' },
        medicalRecord: { type: 'object' },
        appointmentsCount: { type: 'number' },
        consultationsCount: { type: 'number' },
        statistics: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Paciente no encontrado',
  })
  async previewData(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
  ): Promise<any> {
    // Esta funcionalidad se puede implementar en el servicio si lo deseas
    // Por ahora, retorna un mensaje indicando que esta funcionalidad está disponible
    return {
      message:
        'Esta funcionalidad permite ver los datos antes de generar el historial',
      patientId,
      note:
        'Implementar lógica en el servicio para mostrar resumen de datos sin llamar a Gemini',
    };
  }

  /**
 * Descarga un historial médico en formato PDF
 * GET /api/medical-history/:historyId/pdf
 */
@Get(':historyId/pdf')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Descargar historial médico en PDF',
  description:
    'Genera y descarga un PDF profesional del historial médico. ' +
    'Si ya existe en caché, lo devuelve inmediatamente.',
})
@ApiParam({
  name: 'historyId',
  description: 'UUID del historial médico generado',
  example: 'uuid-history-123',
})
@ApiProduces('application/pdf')
@ApiResponse({
  status: 200,
  description: 'PDF generado y descargado exitosamente',
  schema: {
    type: 'string',
    format: 'binary',
  },
})
@ApiResponse({
  status: 404,
  description: 'Historial no encontrado',
})
@ApiResponse({
  status: 500,
  description: 'Error al generar el PDF',
})
async downloadPdf(
  @Param('historyId', new ParseUUIDPipe()) historyId: string,
  @Res() res: Response,
): Promise<void> {
  this.logger.log(`Solicitud de PDF para historial: ${historyId}`);

  try {
    // Verificar si existe en caché
    const cachedPdf = await this.medicalHistoryAIService.getPdfFromCache(historyId);

    let pdfBuffer: Buffer;
    let filename: string;
    let patientName: string;

    if (cachedPdf) {
      this.logger.log('PDF encontrado en caché');
      pdfBuffer = cachedPdf;

      // Obtener metadata del historial para el filename
      const history = await this.medicalHistoryAIService.getHistoryById(historyId);
      const patient = await this.medicalHistoryAIService['patientsService'].findById(
        history.patientId,
      );
      patientName = `${patient.user.firstName} ${patient.user.lastName}`;

      const sanitizedName = patientName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      const dateStr = history.generatedAt.toISOString().split('T')[0].replace(/-/g, '');
      filename = `Historial_Medico_${sanitizedName}_${dateStr}.pdf`;
    } else {
      // Generar PDF nuevo
      this.logger.log('Generando nuevo PDF');
      const result = await this.medicalHistoryAIService.generatePdf(historyId);
      pdfBuffer = result.buffer;
      filename = result.filename;

      // Guardar en caché (opcional)
      if (process.env.PDF_CACHE_ENABLED === 'true') {
        await this.medicalHistoryAIService.savePdfToCache(historyId, pdfBuffer);
      }
    }

    // Configurar headers de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache por 1 hora

    // Enviar PDF
    res.send(pdfBuffer);
  } catch (error) {
    this.logger.error('Error al generar/descargar PDF', error.stack);
    throw new InternalServerErrorException('Error al generar el PDF');
  }
}

/**
 * Previsualiza el historial en HTML (sin descargar)
 * GET /api/medical-history/:historyId/preview
 */
@Get(':historyId/preview')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Previsualizar historial médico en HTML',
  description: 'Muestra el historial médico en formato HTML para vista rápida en navegador.',
})
@ApiParam({
  name: 'historyId',
  description: 'UUID del historial médico',
  example: 'uuid-history-123',
})
@ApiProduces('text/html')
@ApiResponse({
  status: 200,
  description: 'HTML del historial',
})
@ApiResponse({
  status: 404,
  description: 'Historial no encontrado',
})
async previewHtml(
  @Param('historyId', new ParseUUIDPipe()) historyId: string,
  @Res() res: Response,
): Promise<void> {
  const history = await this.medicalHistoryAIService.getHistoryById(historyId);
  const patient = await this.medicalHistoryAIService['patientsService'].findById(
    history.patientId,
  );

  const patientName = `${patient.user.firstName} ${patient.user.lastName}`;

  // Generar HTML usando el mismo servicio de PDF pero solo la parte HTML
  const marked = require('marked');
  const sanitizeHtml = require('sanitize-html');

  const rawHtml = await marked.parse(history.content);
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'strong', 'em', 'u',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ]),
  });

  // Leer template y reemplazar
  const fs = require('fs');
  const path = require('path');
  const templatePath = path.join(__dirname, '..', 'templates', 'medical-history.template.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  html = html
    .replace(/\{\{PATIENT_NAME\}\}/g, patientName)
    .replace(/\{\{CLINIC_NAME\}\}/g, 'Sistema de Gestión Médica')
    .replace(/\{\{GENERATED_DATE\}\}/g, history.generatedAt.toLocaleString('es-MX'))
    .replace(/\{\{GENERATED_BY\}\}/g, 'Sistema IA')
    .replace(/\{\{DOCUMENT_ID\}\}/g, history.id)
    .replace(/\{\{CONTENT\}\}/g, cleanHtml);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

/**
 * Elimina el PDF del caché
 * DELETE /api/medical-history/:historyId/pdf-cache
 */
@Delete(':historyId/pdf-cache')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Eliminar PDF del caché',
  description: 'Elimina el PDF cacheado. Útil cuando se actualiza el historial.',
})
@ApiParam({
  name: 'historyId',
  description: 'UUID del historial',
  example: 'uuid-history-123',
})
@ApiResponse({
  status: 200,
  description: 'PDF eliminado del caché',
})
async deletePdfCache(
  @Param('historyId', new ParseUUIDPipe()) historyId: string,
): Promise<{ message: string }> {
  await this.medicalHistoryAIService.deletePdfFromCache(historyId);
  return { message: 'PDF eliminado del caché exitosamente' };
}
}