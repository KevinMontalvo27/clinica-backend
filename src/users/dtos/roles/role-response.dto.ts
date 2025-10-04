import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";


@Exclude()
export class RoleResponseDto {

    @ApiProperty({ example: 'uuid-21213', description: 'Role ID' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'admin', description: 'Role name' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'Administrator role with full permissions', description: 'Role description', required: false })
    @Expose()
    description?: string;

    @ApiProperty({ example: '2023-10-05T14:48:00.000Z', description: 'Role creation date' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ example: '2023-10-10T09:30:00.000Z', description: 'Role last update date' })
    @Expose()
    updatedAt: Date;
} 