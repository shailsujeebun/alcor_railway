import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportListingsCsvDto {
  @IsString()
  csvContent!: string;

  @IsOptional()
  @IsUUID()
  defaultCompanyId?: string;
}
