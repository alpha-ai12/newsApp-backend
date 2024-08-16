import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsResponse } from './entities/news.entity';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('duplicate')
  async removeDuplicates () {
    console.log("removeDuplicates")
    return await this.newsService.removeDuplicates();
  }
  
  @Get('scrape')
  async imageScraping(@Query('url') url: string): Promise<any> {
    return await this.newsService.imageScraping(url);
  }

  @Get()
  async filterNews(
    @Query('category') category: string,
    @Query('page') page: string,
    @Query('country') country: string,
  ): Promise<any> {
    return await this.newsService.filterNews(category, country, page);
  }

  @Get('slugdetail')
  async updateSlug() {
    console.log('SLUG>>>>>>>>>>>>>>>>>>>>>>>');
    return await this.newsService.updateSlug();
  }

  @Get('filter')
  async filterImageNews(
    @Query('image') image: boolean,
    @Query('page') page: string,
  ): Promise<any> {
    return await this.newsService.filterImageNews(image, page);
  }

  @Get('feature')
  async featureNews(@Query('country') country: string): Promise<NewsResponse> {
    return await this.newsService.featureNews(country);
  }

  @Get('region')
  async regionNews(
    @Query('country') country: string,
    @Query('image') image: string,
    @Query('page') page: number,
  ): Promise<NewsResponse> {
    return await this.newsService.regionNews(country, image, page);
  }

  //Retrive the details return by News Api
  @Get('newsapi')
  async getApiNews() {
    return await this.getNews('business');
  }

  @Get('mostrecent')
  async recentNews(@Query('country') country: string) {
    return await this.newsService.recentNews(country);
  }

  async getNews(category: string): Promise<any> {
    const response = await fetch(
      `https://newsdata.io/api/1/news?apikey=pub_2517314ff49a9993eed8fdde0118614a1e085&category=${category}&language=en`,
    );
    const result = await response.json();
    // const res =result.results
    return result;
  }

  async getCountryNews(country: string): Promise<any> {
    const response = await fetch(
      `https://newsdata.io/api/1/news?apikey=pub_2517314ff49a9993eed8fdde0118614a1e085&country=${country}&language=en`,
    );
    const result = await response.json();
    // const res =result.results
    return result;
  }

  //####################### JOB APIS FOR UPDATE REGION AND SPORTS ############
  @Post('us-job')
  async usjob(): Promise<any> {
    const news = await this.getCountryNews('us');
    console.log(news);
    // return await this.newsService.addNewsJobCategory(news);
  }

  @Post('in-job')
  async inNews(): Promise<any> {
    const news = await this.getCountryNews('in');
    // return await this.newsService.addNewsJobCategory(news);
  }
  //########################## END #######################################

  //NOTE: This uses gpt-3.5-turbo model because the token limit is more
  @Post('feed-job')
  async feedWithGptTurbo(): Promise<any> {
    return await this.newsService.feedWithGptTurbo();
  }

  @Get(':slugid')
  async getBySlugId(@Param('slugid') slugid: string): Promise<any> {
    return await this.newsService.getBySlugId(slugid);
  }

  @Get('keyword/:word')
  async keywordSearch(
    @Param('word') word: string,
    @Query('page') page: string,
    @Query('category') category: string,
    @Query('orderBy') orderBy: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
  ): Promise<any> {
    return await this.newsService.keywordSearch(
      word,
      page,
      category,
      orderBy,
      start_date,
      end_date,
    );
  }

  

  @Post('trading')
  async tradingApi(
    @Body('title') title:string,
    @Body('price') price,
  ) {
    console.log("Title>>>>>>>>", title)
    console.log("Price++++++++", price)
    return {success: true}
  }
}
