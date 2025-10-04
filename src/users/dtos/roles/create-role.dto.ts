import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Max } from "class-validator";

export class CreateRoleDto {
    @ApiProperty({
        example: 'admin',
        description: 'role name',
        maxLength: 50
    })

    @IsString()
    @IsNotEmpty({ message: 'El nombre del rol es requerido' })
    @Max(50, { message: 'El nombre del rol no puede tener más de 50 caracteres' })
    name: string;

    @ApiPropertyOptional({
        example: 'Administrator role with full permissions',
        description: 'Role description',
    })
    @IsString()
    @IsOptional()
    description?: string;
}