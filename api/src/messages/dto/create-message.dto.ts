import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @IsString()
  @IsOptional()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
