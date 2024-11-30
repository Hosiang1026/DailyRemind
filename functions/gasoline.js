const { gasoline } = require('./input')
const axios = require('axios');
const cheerio = require('cheerio');
var calendar = require("./calendar");
const fs = require('fs');
const path = require('path');
const dataFilePath = path.join(__dirname, '..', 'db', 'gasoline.json');

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

// 写入油价
let date = new Date();
let currentYear = date.getFullYear();
let currentMonth = date.getMonth();
let currentDate = date.getDate();
let updateDate = `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${(currentDate) < 10 ? '0' + (currentDate) : (currentDate)}`;
let data = [];
if (fs.existsSync(dataFilePath)) {
    data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
} else {
    console.log('Data file not found', error.message || error);
}
function writeGasoline(provinceName, oilPrice92, oilPrice95, oilPrice98, oilPrice0) {
    return new Promise(async (resolve, reject) => {
        try{
            const historyGasoline = data.gasoline.filter(item => item.province_name === provinceName);
            //不存在这个省份，就生成新记录
            if (data.gasoline.length == 0 || historyGasoline.length == 0){
                // 自动生成新ID
                const newId = data.gasoline.length ? Math.max(...data.gasoline.map(item => item.id)) + 1 : 1;
                const newItem = {
                    id: newId,
                    province_name: provinceName,
                    oilPrice_92: oilPrice92,
                    oilPrice_95: oilPrice95,
                    oilPrice_98: oilPrice98,
                    oilPrice_0: oilPrice0,
                    update_date: updateDate
                }
                data.gasoline.push(newItem);
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
            }

            //若当前油价小于最低油价，则更新油价记录
            //92号
            const index92 = data.gasoline.findIndex(item => item.province_name === provinceName && item.oilPrice_92 < oilPrice92);
            if (index92 > 0) {
                const oldGasoline = data.gasoline[index92];
                const updatedGasolineItem = {
                    id: oldGasoline.id,
                    province_name: provinceName,
                    oilPrice_92: oilPrice92,
                    oilPrice_95: oldGasoline.oilPrice_95,
                    oilPrice_98: oldGasoline.oilPrice_98,
                    oilPrice_0: oldGasoline.oilPrice_0,
                    update_date: updateDate
                }
                data.gasoline[index92] = { ...data.gasoline[index92], ...updatedGasolineItem };
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                console.log('#92 writeOilPrice success');
            }


            //95号
            const index95 = data.gasoline.findIndex(item => item.province_name === provinceName && item.oilPrice_95 < oilPrice95);
            if (index95 > 0) {
                const oldGasoline = data.gasoline[index95];
                const updatedGasolineItem = {
                    id: oldGasoline.id,
                    province_name: provinceName,
                    oilPrice_92: oldGasoline.oilPrice_92,
                    oilPrice_95: oilPrice95,
                    oilPrice_98: oldGasoline.oilPrice_98,
                    oilPrice_0: oldGasoline.oilPrice_0,
                    update_date: updateDate
                }
                data.gasoline[index95] = { ...data.gasoline[index95], ...updatedGasolineItem };
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                console.log('#95 writeOilPrice success');
            }


            //98号
            const index98 = data.gasoline.findIndex(item => item.province_name === provinceName && item.oilPrice_98 < oilPrice98);
            if (index98 > 0) {
                const oldGasoline = data.gasoline[index98];
                const updatedGasolineItem = {
                    id: oldGasoline.id,
                    province_name: provinceName,
                    oilPrice_92: oldGasoline.oilPrice_92,
                    oilPrice_95: oldGasoline.oilPrice_95,
                    oilPrice_98: oilPrice98,
                    oilPrice_0: oldGasoline.oilPrice_0,
                    update_date: updateDate
                }
                data.gasoline[index98] = { ...data.gasoline[index98], ...updatedGasolineItem };
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                console.log('#98 writeOilPrice success');
            }

            //0号
            const index0 = data.gasoline.findIndex(item => item.province_name === provinceName && item.oilPrice_98 < oilPrice0);
            if (index0 > 0) {
                const oldGasoline = data.gasoline[index0];
                const updatedGasolineItem = {
                    id: oldGasoline.id,
                    province_name: provinceName,
                    oilPrice_92: oldGasoline.oilPrice_92,
                    oilPrice_95: oldGasoline.oilPrice_95,
                    oilPrice_98: oldGasoline.oilPrice_98,
                    oilPrice_0: oilPrice0,
                    update_date: updateDate
                }
                data.gasoline[index0] = { ...data.gasoline[index0], ...updatedGasolineItem };
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                console.log('#0 writeOilPrice success');
            }
        } catch (error) {
            console.error('写入汽油价格失败', error.message || error);
            reject(error.message || error)
        }
    })
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

        const newYearStartDate = new Date(now.getFullYear(), 1, 15); // 1月15日 00:00:00
        const newYearEndDate = new Date(now.getFullYear(), 2, 25, 23, 59, 59); // 2月25日 23:59:59
        if(now >= newYearStartDate && now <= newYearEndDate){
            const anhuiData = { province_name: "安徽", province_code: "anhui" }
            provinces.push(anhuiData);
        }

        for(let province of provinces) {
            console.log(`正在获取 ${province.province_name} 的今日油价数据...`);
            const url = oilUrl.replace("{province_code}", province.province_code);
            const oilPriceArr = await fetchContent(url);
            if(oilPriceArr){
                content.push(`\n🚘${province.province_name}\n`);
                let oilPrice_92 = 0;
                let oilPrice_95 = 0;
                let oilPrice_98 = 0;
                let oilPrice_0 = 0;
                for (let i = 0; i < oilPriceArr.length; i++) {
                    const oilPrice = oilPriceArr[i];
                    content.push(`· ${oilPrice.fuelType}: ${oilPrice.price}`);
                    if(oilPrice.fuelType == '92号汽油'){
                        oilPrice_92 = oilPrice.price;
                    }
                    if(oilPrice.fuelType == '95号汽油'){
                        oilPrice_95 = oilPrice.price;
                    }
                    if(oilPrice.fuelType == '98号汽油'){
                        oilPrice_98 = oilPrice.price;
                    }
                    if(oilPrice.fuelType == '0号柴油'){
                        oilPrice_0 = oilPrice.price;
                    }
                }
                writeGasoline(province.province_name, oilPrice_92, oilPrice_95, oilPrice_98, oilPrice_0);
            }
        }

        //近期最低油价
        content.push(`\n🎯最低油价\n`);
        for(let province of provinces) {
            data.gasoline.forEach(result => {
                if(result.province_name == province.province_name){
                    content.push(`🚘${result.province_name}\n`);
                    content.push(`· 92号汽油: ${result.oilPrice_92}`);
                    content.push(`· 95号汽油: ${result.oilPrice_95}`);
                    content.push(`· 98号汽油: ${result.oilPrice_98}`);
                    content.push(`· 0号柴油: ${result.oilPrice_0}`);
                    content.push(`· 更新时间: ${result.update_date}`);
                }
            });
        }

        var updateText = await fetchUpdateText(textUrl);
        content.push('\n'+ updateText);
        console.log('获取汽油调价情况成功：\n',  updateText);

        let lunarDate = calendar.solar2lunar();
        if(lunarDate.ncWeek == '星期一'){
            content.push('\n🚗非浙A号牌小客车');
            content.push('\n🚥限行规则：\n');
            content.push('1.地面道路不限行');
            content.push('2.高架快速路按规定限行');
            content.push('3.错峰时段内全号段限行\n');
            content.push('错峰时段为工作日的7:00—10:00和16:00—19:00，绕城高速公路内所有高架路、快速路(含匝道以及附属桥梁、隧道)，具体包括彩虹快速路、之江大桥、紫之隧道、紫金港路隧道、紫金港路南隧道、留石高架路、东湖快速路、九堡大桥、通城高架路、时代高架、中河高架路、上塘高架路、秋石高架路、西兴大桥、复兴大桥、钱塘快速路、德胜快速路、文一路隧道等');
        }

        // var restrictionText = await fetchRestrictionInfo(restricUrl);
        // content.push('\n'+ restrictionText);
        // console.log('获取汽车限行规则成功：\n',  restrictionText);

        console.log('获取汽油价格成功：\n', content);

        return content.join('\n');

    } catch (error) {
        console.log('获取汽油价格失败', error.message || error);
        throw new Error(error.message || error);
    }
};
