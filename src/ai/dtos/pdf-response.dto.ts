import { ApiProperty } from '@nestjs/swagger';

export class PdfGenerationResponseDto {
    @ApiProperty({
        description: 'Nombre del archivo PDF generado',
        example: 'Historial_Medico_Juan_Perez_20251213.pdf',
    })
    filename: string;

    @ApiProperty({
        description: 'Tamaño del archivo en bytes',
        example: 245632,
    })
    size: number;

    @ApiProperty({
        description: 'Fecha de generación',
        example: '2025-12-13T06:30:00.000Z',
    })
    generatedAt: Date;

    @ApiProperty({
        description: 'ID del historial médico',
        example: 'uuid-123-456',
    })
    historyId: string;
}