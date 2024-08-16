import axios from 'axios';
import cheerio from 'cheerio';
import Jimp from 'jimp';
export const findBlurImage = async (imageUrl) => {
  const minWidth = 350;
  const minHeight = 350;
  try{
  const imageDetail = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
  });
  const imageBuffer = imageDetail.data;
  const image = await Jimp.read(imageBuffer);
  const imageWidth = image.bitmap.width;
  const imageHeight = image.bitmap.height;

  if (imageWidth < minWidth || imageHeight < minHeight) {
    //code to execute if resolution is below 350x350
    return true;
  } else {
    return false;
  }
 } catch(error) {
  console.log(error.message,"????///")
 }
};

export const findLargestResolutionImage = async (pageContent): Promise<any> => {
  let imgTags, $;
  try {
  $ = cheerio.load(pageContent);
  imgTags = $('img');
  } catch (error) {
    console.log('cheerio error')
  }
  let largestImageUrl = null;
  let maxResolution = 0;

  try{
    for (let i = 0; i < imgTags.length; i++) {
      const imgTag = $(imgTags[i]);
      const imgUrl = imgTag.attr('src');
      if (imgUrl) {
          const response = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
          });
          const img = await Jimp.read(response.data);
          const resolution = img.getWidth() * img.getHeight();
          if (resolution > maxResolution) {
            maxResolution = resolution;
            largestImageUrl = imgUrl;
          }
      }
    }
  } catch(error) {
    console.log(`Error processing image: ${error}`)
  }
  return { largestImageUrl, maxResolution };
};

const fetchPageContent = async (url): Promise<any> => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {}
};

export const imageScrapper = async (url: string): Promise<any> => {
  const pageContent = await fetchPageContent(url);
  const { largestImageUrl } = await findLargestResolutionImage(pageContent);

  if (largestImageUrl) {
    return largestImageUrl;
  } else {
    console.log('No images found on the page.');
  }
};

// const imageQualityScripts = async(): Promise<any> => {
//     console.log('===============');
//     const res = await this.newsModel.find({
//       image_url: 'https://cdn.openpr.com/W/8/W807581837_k.jpg',
//     });
//     const result = await this.newsModel.updateMany(
//       {
//         image_url: { $regex: /_k\./ },
//       },
//       [
//         {
//           $set: {
//             image_url: {
//               $replaceAll: {
//                 input: '$image_url',
//                 find: '_k.',
//                 replacement: '_g.',
//               },
//             },
//           },
//         },
//       ],
//       { limit: 5, sort: { updatedAt: -1 } },
//     );
//     return res;
// }
// const base64ToImage = async (base64String) => {
//     // Create a buffer from the Base64 data
//     const imageBuffer = Buffer.from(base64String, 'base64');
//     const result = await this.awsService.uploadFile(imageBuffer);
//     return result;
// }
