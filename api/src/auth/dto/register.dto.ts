import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MinLength as MinTextLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  @Matches(/[a-z]/, { message: 'Password must include a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must include an uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must include a digit' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password must include a special character',
  })
  password: string;

  @IsString()
  @MinTextLength(1, { message: 'First name is required' })
  firstName: string;

  @IsString()
  @MinTextLength(1, { message: 'Last name is required' })
  lastName: string;
}
