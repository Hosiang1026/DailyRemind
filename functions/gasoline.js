const { gasoline } = require('./input')
const axios = require('axios');
const cheerio = require('cheerio');

// 获取省份汽油编码
const provincesJson = process.env.OIL_PROVINCES;

// 解析 JSON 数据
let provinces = [];
try {
    if(provincesJson!=undefined){
        provinces = JSON.parse(provincesJson);
    }else{
        provinces = [
            { province_name: "浙江", province_code: "zhejiang" },
            { province_name: "安徽", province_code: "anhui" },
            { province_name: "福建", province_code: "fujian" }
        ];
    }
} catch (error) {
    console.error("环境变量-省份汽油编码配置错误:", error);
}

//汽油价格API: https://api.help.bj.cn/apis/youjia/
//抓取各个城市的汽油价格
async function fetchContent(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const oilPrices = [];
        $('#youjia dl').each((index, element) => {
            let fuelType = $(element).find('dt').text();
            // 去掉前两个字并替换 # 为 号
            fuelType = fuelType.substring(2).replace('#', '号').trim();
            const price = $(element).find('dd').text();
            oilPrices.push({ fuelType, price });
        });
        return oilPrices;
    } catch (error) {
        throw new Error('An error occurred while fetching the content: ' + error.message);
    }
}

//抓取汽油调价情况
async function fetchUpdateText(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract specific text about oil price changes
        var priceUpdateText = $('#rightTop').text().trim().split('\n').filter(line => line.includes('相互转告')).join(' ');
		//console.log('priceUpdateText:' ,  priceUpdateText);
        if(priceUpdateText == ''){
		   priceUpdateText = $('#rightTop').text().trim().split('\n').filter(line => line.includes('调整')).join(' ');
		}

        return priceUpdateText;
    } catch (error) {
        throw new Error('An error occurred while fetching the update text: ' + error.message);
    }
}

async function fetchRestrictionInfo(url) {
    try {
        // 替换为实际的目标URL
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // 提取限行时间和限行路段
        const restrictionText = $('.graphicmodule-box .text p').text().trim();

        // 分割和格式化
        const [timeInfo, areaInfo] = restrictionText.split('限行路段：');
        const formattedText = `${timeInfo.trim()}\n\n限行路段：${(areaInfo || '').trim()}`;

        return formattedText;
    } catch (error) {
        console.error('Error fetching restriction info:', error);
        return null;
    }
}

// Define handleGasoline function to use fetchContent
module.exports = handleGasoline = async () => {
    const textUrl = 'http://www.qiyoujiage.com';
    const oilUrl = 'http://www.qiyoujiage.com/{province_code}.shtml';
    const restricUrl = 'https://m.hz.bendibao.com/news/ztfeizheAhaopaixiaokechexianxing/?area=';

    try {
        //内容数组
        let content = [];
        content.push('⛽今日油价');

        const now = new Date();
        const startDate = new Date(now.getFullYear(), 9, 1); // 10月1日 00:00:00
        const endDate = new Date(now.getFullYear(), 9, 7, 23, 59, 59); // 10月7日 23:59:59
        if(now >= startDate && now <= endDate){
            const fujianData = { province_name: "福建", province_code: "fujian" }
            provinces.push(fujianData);
        }

        for(let province of provinces) {
            console.log(`正在获取 ${province.province_name} 的今日油价数据...`);
            const url = oilUrl.replace("{province_code}", province.province_code);
            const oilPriceArr = await fetchContent(url);
            if(oilPriceArr){
                content.push(`\n🚘${province.province_name}`);
                for (let i = 0; i < oilPriceArr.length; i++) {
                    const oilPrice = oilPriceArr[i];
                    content.push(`· ${oilPrice.fuelType}: ${oilPrice.price}`);
                }
            }
        }

        console.log('获取汽油价格成功：\n', content);

        var updateText = await fetchUpdateText(textUrl);
        content.push('\n'+ updateText);
        console.log('获取汽油调价情况成功：\n',  updateText);

        var restrictionText = await fetchRestrictionInfo(restricUrl);
        content.push('\n'+ restrictionText);
        console.log('获取汽车限行规则成功：\n',  restrictionText);
        return content.join('\n');

    } catch (error) {
        console.log('获取汽油价格失败', error.message || error);
        throw new Error(error.message || error);
    }
};
