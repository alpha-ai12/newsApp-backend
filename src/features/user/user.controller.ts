import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthCredsDto, CreateUserDto, UserPreferenceDto, UserSaveNewsDto, contactUsDetailsDto, helpCenterDetailDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Post('login')
  async authenticatUser(@Body() authCredsDto: AuthCredsDto) {
    return await this.userService.authenticateUser(authCredsDto);
  }

  @Get('forgot-password/:email')
  async forgotPassword(@Param('email') email: string) {
    return await this.userService.forgotPassword(email);
  }

  @Get('verify-token/:nonce')
  async verifyResetToken(@Param('nonce') nonce: string) {
    return await this.userService.verifyResetToken(nonce);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: AuthCredsDto) {
    return await this.userService.resetPassword(resetPasswordDto);
  }

  @Post('preference')
  async userPreference(@Body() userPreferences: UserPreferenceDto ) {
    return await this.userService.createUserPreference(userPreferences);
  }

  @Get('preference')
  async getUserPreferenceNew(
    @Query('userid') userid,
    @Query('page') page) {
    return await this.userService.getUserPreferenceNew(userid, page);
  }

  @Post('save-news')
  async saveNews(
    @Body() saveNews:UserSaveNewsDto
  ) {
    return await this.userService.saveNews(saveNews);
  }

  @Put('unsave-news')
  async unSaveNews(
    @Body() unSaveNews:UserSaveNewsDto
  ) {
    return await this.userService.unSaveNews(unSaveNews);
  }

  @Get('save-news/:userid')
  async fetchSavedNews(@Param('userid') userid,
  @Query('page') page
  ) {
    return await this.userService.fetchSavedNews(userid,page);
  }

  @Get()
  async userInfo(
    @Query('email') email: string,
    @Query('oAuth') oAuth: string,
    @Query('id') id?:string
  ) {
    return await this.userService.userInfo(email, oAuth,id);
  }

  @Post('help-center')
  async helpCenter(
  @Body() helpCenterDetail: helpCenterDetailDto,
  ) {
    return await this.userService.userHelpCenter(helpCenterDetail);
  }

  @Post('contact-us')
  async contactUsPublic(
  @Body() contactUsDetails: contactUsDetailsDto,
  ) {
    return await this.userService.contactUsPublic(contactUsDetails);
  }

  @Get('keyword/:word')
  async keywordSearch(
    @Param('word') word: string,
    @Query('userid') userid,
    @Query('page') page: string,
    @Query('category') category: string,
    @Query('orderBy') orderBy: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
  ): Promise<any> {
    console.log(word, userid)
    return await this.userService.keywordSearch(
      word,
      userid,
      page,
      category,
      orderBy,
      start_date,
      end_date,
    );
  }
 }
