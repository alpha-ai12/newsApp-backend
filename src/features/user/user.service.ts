import { HttpCode, Injectable } from '@nestjs/common';
import { CreateUserDto, UserPreferenceDto, contactUsDetailsDto } from './dto/create-user.dto';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ContactUs, HelpCenter, User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { OAuthProvider } from './entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as randomstring from 'randomstring';
import { HttpStatusCode } from 'axios';
import {  News } from '../news/schemas/news.schema';
import { ObjectId } from 'mongodb';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    @InjectModel(News.name)
    private newsModel: mongoose.Model<News>,
    @InjectModel(HelpCenter.name)
    private helpCenter: mongoose.Model<HelpCenter>,
    @InjectModel(ContactUs.name)
    private contactUs: mongoose.Model<ContactUs>,
    private readonly mailerService: MailerService
  ){}

  async create( createUserDto: CreateUserDto ) {
    let {email, oAuth} = createUserDto
    email = email.toLowerCase()
    const user = await this.userModel.findOne({ email, oAuth});
    if(user && oAuth!== OAuthProvider.opennewsai) return user
    if(user && oAuth === OAuthProvider.opennewsai) return {message: `${email} is used by another account`}

    const result = await this.userModel.create({email,...createUserDto});
    return result
  }

  async authenticateUser(authCredsDto) {
    const {email, password} = authCredsDto
    let isPasswordValid: any;
    const user = await this.userModel.findOne({ email:email.toLowerCase() });
    if(!user) return { status: 401, message: "Your email or password was incorrect"}
    try{
      isPasswordValid = await bcrypt.compare(password, user.password)
      if(!isPasswordValid) return { status: 401, message: "Your username, email or password was incorrect"}
      return user
    } catch(error) {
      console.log(error.message)
      return { status: 401, message: "Your username, email or password was incorrect"}
    }
  }

  async forgotPassword(email: string) {
    try {      
      const user = await this.userModel.findOne({ email:email.toLowerCase(), oAuth:OAuthProvider.opennewsai });
      if(!user) return { status: 401, message: `No user found for email: ${email}`}

      const resetToken = randomstring.generate(20);
      const resetLink = `https://opennewsai.com/change-password/?nonce=${resetToken}`; // Replace with your reset password page URL
      await this.userModel.updateOne({ email: email.toLowerCase(), oAuth:'opennewsai' }, {$set:{ resetToken }})

      const result = await this.mailerService.sendMail({
        to: email,
        from: process.env.adminMail,
        subject: 'Password Reset Request ✔',
        html: `<p>Hello,</p>
        <p>We received a request to reset your password. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>`,
      })
      if(!result) return {status: HttpStatusCode.InternalServerError, message: "Something wen wrong"}
      return {status: 200, message:'email sent successfully'}
    } catch (error) {
      console.log(error)
    }
    
  }

  async verifyResetToken(token: string) {
    const user = await this.userModel.findOne({resetToken: token})
    if(!user ||  user.resetToken !== token) 
      return {status: 400 , message: 'Invalid or expired reset token.'}
    const response = {
      email:user.email
    }
    return {status: 200, message: 'verification successful', response}
  }

  async resetPassword(resetPasswordDto) {
    const { email, password }=resetPasswordDto
    try{
      const user = await this.userModel.findOne({email: email.toLowerCase()})
      if(!user)
        return {status: 400 , message: 'Invalid or expired reset token.'}
      user.password = password
      await user.save()
      return {status: 200, message: 'Password change successfully'}
    }catch (error) {
      throw new Error(error.message)
    }
  }

  async createUserPreference(userPreference: UserPreferenceDto): Promise<any> {
    const {userid, country, category } = userPreference
    try{
    const user = await this.userModel.findOne({ _id: userid});
    if(!user) return { status: 401, message: `No user found.`}
    await this.userModel.updateOne({_id:userid}, {$set:{preferredCountry: country, preferredCategory: category}})
    return {status: 200, message: "saved successfully"} 
    } catch(error) {
      return { status: 401, message: error?.message}
    }
  }
  async filterNews(filterCriteria, skipCount, resultLimit): Promise<any> {
    const result = await this.newsModel
                    .find(filterCriteria)
                    .skip(skipCount)
                    .limit(resultLimit)
                    .sort({createdAt: -1});
    const newsCount = await this.newsModel.countDocuments(filterCriteria);
    const newresult = [{count:newsCount, results:result}];
    return newresult
  }

  async getUserPreferenceNew(userid: string, page): Promise<any> {
    const startDate = new Date('2023-08-01');
    const currentDate = new Date();
    const userDetails = await this.userModel.findOne({ _id: userid})
    const preferredCategory = userDetails.preferredCategory;
    const preferredCountry = userDetails.preferredCountry;
    const resultLimit = 20;
    const skipCount = (page - 1) * resultLimit;
    if(preferredCategory.length > 0 && preferredCountry.length > 0 ) {
      const result = await this.newsModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: currentDate }, 
            category: { $in: preferredCategory },
            country: { $elemMatch: { $in: preferredCountry } }
          }
        },
        {
          $sort: { createdAt: -1 }  // Sort by createdAt in descending order
        },
        {
          $group: {
            _id: null,
            results: { $push: "$$ROOT" },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            results: { $slice: ["$results", skipCount, resultLimit] },
            count: 1
          }
        }
      ]);
      return result
    }
    if(preferredCategory.length > 0 && preferredCountry.length === 0) {
      const filterCriteria = {
        category: { $in: preferredCategory },
        createdAt: { $gte: startDate, $lte: currentDate },
      };
      return await this.filterNews(filterCriteria, skipCount, resultLimit)
    }
    
    if(preferredCategory.length === 0 && preferredCountry.length > 0) {
      const filterCriteria = {
        country: { $in: preferredCountry },
        createdAt: { $gte: startDate, $lte: currentDate },
      };
      return await this.filterNews(filterCriteria, skipCount, resultLimit)
    }
    if(preferredCategory.length === 0 && preferredCountry.length === 0) {
      return []
    }
  }

  async saveNews(userSaveNews): Promise<any> {
    try{
      await this.userModel.updateOne(
        { _id: userSaveNews.userid },
        { $addToSet: { saved_news: userSaveNews.newsid }}
      )
      return {
        status: 200, 
        message: "saved successfully"
      }
    } catch(e) {
      console.log(e)
      throw Error('Something went wrong.')
    }
  }

  async unSaveNews(inputData): Promise<any> {
    try {
      await this.userModel.updateOne(
        {_id: inputData.userid},
        { $pull: { saved_news: inputData.newsid } }
      )
      return {
        status: 200, 
        message: "unsaved successfully"
      }
    } catch (error) {
      throw Error('Something went wrong.')
    }
  }

  async fetchSavedNews(userid, page): Promise<any> {
    try {
      const size = 20;
      const skip = (page - 1) * size;
      const result = await this.userModel.findOne({_id: userid}).select('saved_news')
      const newsDetail = await this.newsModel
                              .find({_id: {$in: result.saved_news}})
                              .sort({ createdAt: -1 })
                              .skip(skip)
                              .limit(size)
      
      return {count:result.saved_news.length,  newsDetail}
    } catch (error) {
      console.log(error)
      throw Error('Something went wrong.')
    }
   
  }

  async userInfo(email, oAuth, id) {
    try {
      if(id) return await this.userModel.findOne({id})
      return await this.userModel.findOne({email,oAuth})  
    } catch (error) {
      throw Error('Something went wrong.')
    }
    
  }

  async userHelpCenter(helpCenterDetails): Promise<any> {
    try{
      await this.helpCenter.insertMany(helpCenterDetails)
      return {status: 200, message:' request sent successfully'}
    } catch(error) {
      console.log(error)
      throw Error('Something went wrong.')
    }
  }

  async contactUsPublic(contactUsDetails: contactUsDetailsDto): Promise<any> {
    try{
      await this.contactUs.insertMany(contactUsDetails)
      return {status: 200, message:' request sent successfully'}
    } catch(error) {
      console.log(error)
      throw Error('Something went wrong.')
    }
  }

  async keywordSearch(
    keyword: string,
    userid: string,
    page,
    category: string,
    orderBy,
    start_date,
    end_date,
  ): Promise<any> {
    const pageSize = 20;
    const savedNewsId = await this.userModel.findOne({_id: userid})
    const userNews = await this.newsModel.find({
      _id: {$in: savedNewsId.saved_news}
    })
    const filteredNews = userNews.filter((news) => {
      const titleMatch = news.newTitle.toLowerCase().includes(keyword.toLowerCase());
      const contentMatch = news.newContent.toLowerCase().includes(keyword.toLowerCase());
      const categoryMatch = news.category.includes(keyword.toLowerCase());

      if(titleMatch || contentMatch || categoryMatch) {
        return news//searchNewsArray.push(news)
      }
    })

    const totalItems = filteredNews.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
    const paginatedNews = filteredNews.slice(startIndex, endIndex + 1);

    // console.log(filteredNews)
    return {totalItems,totalPages, paginatedNews}
  }
}