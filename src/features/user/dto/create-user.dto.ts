import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import * as Joi from 'joi';
import { OAuthProvider, PreferenceType } from '../entities/user.entity';
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsString()
    @IsNotEmpty()
    profileImg: string

    @IsString()
    id: string

    @IsEnum(OAuthProvider)
    oAuth: string
}

export class AuthCredsDto {

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsString()
    password: string
}

export class UserPreferenceDto {
    @IsNotEmpty()
    @IsString()
    userid: string

    @IsArray()
    country: string[]

    @IsArray()
    category: string[]
}
export class UserSaveNewsDto {
    @IsNotEmpty()
    @IsString()
    userid: string

    @IsNotEmpty()
    @IsString()
    newsid: string

}

export class contactUsDetailsDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    message: string
    
}


export class helpCenterDetailDto {
    @IsNotEmpty()
    @IsString()
    userid: string

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    subject: string

    @IsNotEmpty()
    @IsString()
    description: string
    
}

// export const createUserDtoSchema = Joi.object({
//     name: Joi.string().required(),
//     email: Joi.string().email().required(),
//     profileImg: Joi.string().min(8).required(),
//     id: Joi.string(),
//     oAuth: Joi.string()
//   });