import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { News, NewsDocument, Page } from './schemas/news.schema';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Country,
  FilterForSearchQuery,
  NewsResponse,
} from './entities/news.entity';
import { Cron } from '@nestjs/schedule';
import { AwsService } from 'src/aws/aws.service';
import axios from 'axios';
import { findBlurImage, imageScrapper } from 'src/utils';
const cheerio = require('cheerio');
const Jimp = require('jimp');
const slugify = require('slugify');
const LanguageDetect = require('languagedetect');
// import { Configuration, OpenAIApi } from "openai";
const fs = require('fs');
// const configuration = new Configuration({
//   // organization: "YOUR_ORG_ID",
//   apiKey: process.env.OPENAI_API_KEY,
// });

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name)
    private newsModel: mongoose.Model<News>,
    @InjectModel(Page.name)
    private pageModel: mongoose.Model<Page>,
    private config: ConfigService,
    private awsService: AwsService,
  ) {}

  async getApiNews(apiKey:string): Promise<any> {
    const response = await fetch(
      `https://newsdata.io/api/1/news?apikey=${apiKey}&language=en`,
    );
    const result = await response.json();
    // const res =result.results
    return result;
  }
  //check if data exist in DB
  async isDataExists(title: string): Promise<boolean> {
    const count = await this.newsModel.countDocuments({ title });
    return count > 0 ? true : false;
  }

  async getOgImage(url): Promise<any> {
    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // Find the og:image meta tag
      const ogImageTag = $('meta[property="og:image"]');

      if (ogImageTag.length > 0) {
        const imageUrl = ogImageTag.attr('content');
        console.log('og:image URL:', imageUrl);
        return imageUrl;
      } else {
        console.log('og:image meta tag not found on the page.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async uploadIntoS3(imageUrl : string) {
    const result = await axios.get( imageUrl , { responseType: 'arraybuffer' })
    const pathComponents = imageUrl.split('/');
    const fileName = pathComponents[pathComponents.length - 1];
    const data = Buffer.from(result.data, 'binary');
    const detail = await this.awsService.uploadFile(data, fileName)
    return { detail }
  }

  async languageDetact(title) : Promise<any> {
    const lngDetector = new LanguageDetect();
    const lang = lngDetector.detect(title)
    return lang[0][0]=== "english" ? true : false
  }

  //og:image-- latestly, dailymailuk, (getting wrong image)
  //corrupt : news24, telanganatoday, (getting corrupt image )
  //TODO: ehnace: 'dailymailuk', 'dailymirror, businesslend'
  async gptTurbo(newsDetails) {
    try {
      if (!await this.languageDetact(newsDetails.title)) return
      const expectedFormat = 'https://cdn.openpr.com/';
      const wrongImageList = [
        'latestly',
        'dailymailuk',
        'nation.pk',
        'businesslend',
        'newindianexpress',
        'Telecom_economictimes',
        'gamezebo',
        'indiatvnews',
        'theepochtimes',
        'thewillnigeria',
        'informalnewz',
        'telanganatoday',
        'bostonglobe',
        'cbsnews',
        'gulfbusiness',
        'businessworld',
        'zeenews',
        'soccerladuma',
        'allbanaadir',
        'eventindustrynews',
        'freepressseries',
        'blueprint',
        'peeblesshirenews',
        'theolivepress',
        'nigerianobservernews',
        'dailynews',
        'forbescrypto',
        'arynews',
        'independentng',
        'tdpelmedia',
        'theboltonnews',
        'bimaloan',
        'bordercountiesadvertiser',
        'newsweek',
        'dailymirror',
        'nwahomepage',
        'promptnewsonline',
        'knowledia',
        'economictimes_indiatimes',
        'rollingstoneindia'
      ]; //ogImage
      const corruptImageList = [
        'news24',
        'soccerladuma',
        'snl24',
        'goodisonnews',
        'nwahomepage',
        'fin24',
        'vogue',
        'videogamer',
        'thehill',
        'phys',
        'bloombergquint',
        'cryptopress',
        'malaymail',
        'hydrogencentral',
      ];
      if (newsDetails.image_url === null) {
        if (wrongImageList.includes(newsDetails.source_id)) {
          const url = await this.getOgImage(newsDetails.link);
          newsDetails.image_url = url;
        } else {
          const url = await imageScrapper(newsDetails.link);
          newsDetails.image_url = url;
        }
      }
      if (newsDetails.image_url && newsDetails.image_url.startsWith(expectedFormat)) {
        const modifiedUrl = newsDetails.image_url.replace('_k.', '_g.');
        newsDetails.image_url = modifiedUrl;
      }
      if ( corruptImageList.includes(newsDetails.source_id) ) {
        const url = await imageScrapper(newsDetails.link);
        newsDetails.image_url = url;
      }
      if(newsDetails.image_url ) {
        const isBlur = await findBlurImage(newsDetails?.image_url);
        if (newsDetails.image_url.startsWith('data') || isBlur) {
          const url = await this.getOgImage(newsDetails.link);
          newsDetails.image_url = url;
        }
        const API_URL = process.env.CHATGPT_API_URL;
        const API_KEY = process.env.API_KEY;
        const message = {
          title: newsDetails.title,
          content: newsDetails.content,
          description: newsDetails.description,
        };

        const feedMessage =
          JSON.stringify(message) +
          '1.Rephrase the title, description, content 2. convert content data to html format 3. return title, description and content  in only JSON format and no other extra text';
        const body = {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: feedMessage }],
        };
        let jsonResponse;
        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(body),
          });
          const news = await res.json();
          jsonResponse = news.choices[0].message.content;
        } catch (error) {
          console.log('ERROR!!!!1=======', error);
        }
        try {
          // const jsonStartIndex = jsonResponse.indexOf('{');
          // const jsonEndIndex = jsonResponse.lastIndexOf('}');
          // const jsonString = jsonResponse.substring(
          //   jsonStartIndex,
          //   jsonEndIndex + 1,
          // );
          const jsonData = JSON.parse(jsonResponse);
          
          //store image in s3
          const {detail}: any = await this.uploadIntoS3(newsDetails.image_url)
          const dbData = {
            ...newsDetails,
            title: newsDetails.title,
            content: newsDetails.content,
            description: newsDetails.description,
            newTitle: jsonData.title,
            newContent: jsonData.content,
            newDescription: jsonData.description,
            slugid: slugify(jsonData.title, { replacement: '-', lower: true }),
            image_url: detail.url
          };
          return dbData;
        } catch (err) {
          // console.log("ERROR==================", err,"=============>>>>>>>")
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  async filterImageNews(image: boolean, pagenumber): Promise<any> {
    const size = 20;
    const skip = (pagenumber - 1) * size;
    if (image === true) {
      const result = await this.newsModel
        .find({ image_url: { $ne: null } })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(size)
        .exec();
      return result;
    }
    const result = await this.newsModel
      .find({ image_url: { $eq: null } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(size)
      .exec();
    return result;
  }

  async filterNews(
    category: string,
    country: string,
    pagenumber,
  ): Promise<any> {
    const size = 20;
    const skip = (pagenumber - 1) * size;
    const startDate = new Date('2023-08-01');
    const currentDate = new Date();
    const quotedCategories = category.split(',');
    const newCountry = Country[country];
    let query = {};
    if (newCountry) {
      query = {
        country: { $in: [newCountry] },
        category: { $in: quotedCategories },
        createdAt: { $gte: startDate, $lte: currentDate },
      };
    } else {
      query = {
        createdAt: { $gte: startDate, $lte: currentDate },
        category: { $in: quotedCategories },
      };
    }
    try {
      if (category === 'all') {
        try {
          const newsArticles = await this.newsModel
            .find({
              createdAt: { $gte: startDate, $lte: currentDate },
            })
            .select('slugid createdAt')
            .exec();
          return newsArticles;
        } catch (error) {
          console.log(error);
        }
      }
      // if (category === 'video') {
      //   const result = await this.newsModel
      //     .find({ video_url: { $exists: true, $ne: null } })
      //     .sort({ createdAt: -1 })
      //     .limit(5)
      //     .exec();
      //   return result;
      // }
      const result = await this.newsModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .exec();
      return result;
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //returns the 10 news for each category
  async featureNews(country): Promise<NewsResponse> {
    const categories = [
      'business',
      'entertainment',
      'environment',
      'food',
      'health',
      'politics',
      'science',
      'sports',
      'technology',
      'top',
      'tourism',
      'world',
    ];
    const newCountry = Country[country];
    let query = {};
    if (newCountry) {
      query = {
        createdAt: {
          $gte: new Date('2023-08-01'),
          $lte: new Date(),
        },
        category: {
          $in: categories,
          $size: 1,
        },
        country: {
          $in: [newCountry],
        },
      };
    } else {
      query = {
        createdAt: {
          $gte: new Date('2023-08-01'),
          $lte: new Date(),
        },
        category: {
          $in: categories,
          $size: 1,
        },
      };
    }
    const featureNews = [];
    try {
      const result = await this.newsModel.aggregate([
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: 3000,
        },
        {
          $match: query,
        },

        {
          $group: {
            _id: '$category',
            news: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            news: { $slice: ['$news', 10] },
          },
        },
      ]);
      await Promise.all(
        result.map((item) => {
          const categoryName = item.category[0];
          const news = {};
          news[categoryName] = item.news;
          featureNews.push(news);
        }),
      );
      const response = {
        statusCode: 200,
        data: featureNews,
      };
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async regionNews(
    country: string,
    image,
    page: number,
  ): Promise<NewsResponse> {
    const size = 20;
    const skip = (page - 1) * size;
    const newCountry = Country[country];
    console.log(newCountry);
    const query = {};
    try {
      const result = await this.newsModel
        .find({ country: { $in: [newCountry] } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .exec();
      const response: NewsResponse = {
        statusCode: 200,
        data: result,
      };
      return response;
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async recentNews(country: string): Promise<any> {
    const newCountry = Country[country];
    let query = {};
    if (newCountry) {
      query = { country: { $in: [newCountry] } };
    }
    const result = await this.newsModel
      .find(query)
      .sort({ pubDate: -1 })
      .limit(10);
    return result;
  }

  async imageScraping(url: string): Promise<any> {
    return await imageScrapper(url);
  }


//########################START################################
  // async processNews(newsData, index = 0): Promise<any> {
  //   if (index < newsData.length) {
  //     const item = newsData[index];
  //     const isExist = await this.isDataExists(item.title);
  //     console.log(isExist);
  //     if (!isExist) {
  //       try {
  //         const dbData = await this.gptTurbo(item);
  //         if (dbData) {
  //           await this.newsModel.insertMany(dbData);
  //           console.log('SUCCESS++++++++++++++++');
  //         }
  //       } catch (error) {
  //         console.log(error);
  //       }
  //     }
  //     await this.processNews(newsData, index + 1);
  //   }
  // }

  async validNewsDataApiKey ( apiKeyIndex = 0): Promise<any> {
    let apiKey = [process.env.NewsDataAPIKey1, process.env.NewsDataAPIKey2, process.env.NewsDataAPIKey3, process.env.NewsDataAPIKey4]
    const details = await this.getApiNews(apiKey[apiKeyIndex]);
    if (details.status === "success") {
      return {details, workingApiKey: apiKey[apiKeyIndex]};
    }
    apiKeyIndex = (apiKeyIndex + 1) % apiKey.length;
    return await this.validNewsDataApiKey(apiKeyIndex)
  }

  // @Cron('*/15 * * * *')
  async feedWithGptTurbo(): Promise<any> {
    try {
      let count = 0;
      // const details = await this.getApiNews(apiKey[0]);
      // return details.results.code
      const result = await this.validNewsDataApiKey();
      console.log(result.workingApiKey, "validNewsDataApiKey")
      const pageDetail = await this.pageModel.find({});
      let iteratePage = result.details.nextPage;
      while (count < 2) {
        let news;
        const response = await fetch(
         `https://newsdata.io/api/1/news?apikey=${result.workingApiKey}&page=${iteratePage}&language=en`,
        );
        news = await response.json();
        news = count === 0 ? result.details : news;
        const newsResults = news.results;
        for (const item of newsResults) {;
          try{
            if(item.source_id !== 'sports_hankooki') {
              const isExist = await this.isDataExists(item.title);
              console.log(isExist);
              if (!isExist) {
                const dbData = await this.gptTurbo(item);
                await this.removeDuplicates()
                if (dbData && dbData.image_url) {
                  await this.newsModel.insertMany(dbData);
                  console.log('SUCCESS++++++++++++++++');
                }
              } 
            } else {

            }
          } catch(error) {
            console.log(error)
          }
        }
        // await Promise.all(
        //   news.results.map(async (item) => {
        //     const isExist = await this.isDataExists(item.title);
        //     console.log(isExist);
        //     if (!isExist) {
        //       const dbData = await this.gptTurbo(item);
        //       if (dbData) {
        //         await this.newsModel.insertMany(dbData);
        //         console.log('SUCCESS++++++++++++++++');
        //       }
        //     }
        //   }),
        // );
        count++;
        iteratePage = news.nextPage;
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
      await this.pageModel.updateOne({ pageNumber: result.details.nextPage });
      return result.details.nextPage;
    } catch (error) {
      console.log(error);
    }
  }
//##################################END#######################



// async  processPage(iteratePage, count, workingApiKey) {
//   try {
//     console.log('+++++++++++++++', iteratePage);
//     const response = await fetch(`https://newsdata.io/api/1/news?apikey=${workingApiKey}&page=${iteratePage}&language=en`);
//     const news = await response.json();

//     const newsResults = news.results;
//     for (const item of newsResults) {
//       try {
//         const isExist = await this.isDataExists(item.title);
//         console.log(isExist);
        
//         if (!isExist) {
//           const dbData = await this.gptTurbo(item);
//           if (dbData && dbData.image_url) {
//             await this.newsModel.insertMany(dbData);
//             console.log('SUCCESS++++++++++++++++');
//           }
//         }
//       } catch(error) {
//         console.log(error);
//       }
//     }

//     count++;
//     if (count < 2) {
//       await new Promise((resolve) => setTimeout(resolve, 60000 * 2));
//       await this.processPage(news.nextPage, count, workingApiKey);
//     } else {
//       await this.pageModel.updateOne({ pageNumber: news.nextPage });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }

// @Cron('*/15 * * * *')
// async feedWithGptTurbo() {
//   try {
//     const result = await this.validNewsDataApiKey();
//     console.log(result.workingApiKey, "validNewsDataApiKey");
//     const pageDetail = await this.pageModel.find({});
//     const iteratePage = result.details.nextPage;
//     console.log(iteratePage, pageDetail[0].pageNumber);
    
//     await this.processPage(iteratePage, 0, result.workingApiKey);

//     return result.details.nextPage;
//   } catch (error) {
//     console.log(error);
//   }
// }



  async getBySlugId(slugid: string): Promise<any> {
    try {
      const newsDetail = await this.newsModel.find({ slugid });
      return newsDetail;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateSlug() {
    console.log('UPDATESLUG=======================');
    const startDate = new Date('2023-08-13');
    const currentDate = new Date();

    const documentsToUpdate = await this.newsModel
      .find({
        createdAt: {
          $gte: startDate,
          $lte: currentDate,
        },
        slugid: { $exists: false },
        newTitle: { $exists: true },
      })
      .sort({ updatedAt: -1 })
      .select('_id newTitle');
    console.log(documentsToUpdate.length);
    // return documentsToUpdate
    for (const document of documentsToUpdate) {
      // slugify(newsDetails.title, {replacement: '-', lower: true})
      const slugid = slugify(document.newTitle, {
        replacement: '-',
        lower: true,
      });

      await this.newsModel.updateMany(
        { _id: document._id },
        { $set: { slugid: slugid } },
      );
    }

    console.log('Documents updated successfully.');
  }

  async keywordSearch(
    keyword: string,
    page,
    category: string,
    orderBy,
    start_date,
    end_date,
  ): Promise<any> {
    const defaultStartDate = new Date('2023-08-01');
    const defaultCurrentDate = new Date();
    let endDate = new Date(end_date);
    // check for any time & past year count mismatch
    endDate =
      endDate.toLocaleDateString() === defaultCurrentDate.toLocaleDateString()
        ? defaultCurrentDate
        : endDate;
    const size = 20;
    const skip = (page - 1) * size;
    let newsCount;
    let newsData;
    let startDate = new Date(start_date);
    if (startDate < defaultStartDate) {
      startDate = defaultStartDate;
    }
    const query: FilterForSearchQuery = {
      createdAt: {
        $gte: start_date ? startDate : defaultStartDate,
        $lte: end_date ? endDate : defaultCurrentDate,
      },
      title: {
        $regex: keyword,
        $options: 'i',
      },
    };
    if (category) {
      query.category = {
        $in: `${category}`,
      };
    }
    console.log(query);
    const sort = orderBy === 'asc' ? 1 : -1;
    try {
      newsCount = await this.newsModel.countDocuments(query);
    } catch (error) {
      console.log(error);
    }
    try {
      newsData = await this.newsModel
        .find(query)
        .sort({ createdAt: sort })
        .skip(skip)
        .limit(size);
    } catch (error) {
      console.log(error);
    }
    return { newsCount, newsData };
  }

  async removeDuplicates() {
    const startDate = new Date('2023-08-20'); // Replace with your actual start date
    const currentDate = new Date(); // Current date
    const result = await this.newsModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: currentDate }
        }
      },
      {
        $group: {
          _id: "$title",
          count: { $sum: 1 },
          duplicates: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ])

    result.forEach(async (data) => {
      await this.newsModel.deleteOne({ title: data._id });
    })
    return result
  }
}
