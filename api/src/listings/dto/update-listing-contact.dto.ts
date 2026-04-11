import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateListingContactDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phoneCountry!: string;

  @IsOptional()
  @IsString()
  phoneNumber!: string;

  @IsOptional()
  @IsBoolean()
  privacyConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  termsConsent?: boolean;
}
