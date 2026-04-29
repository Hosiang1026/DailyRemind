const { gasoline } = require('../scripts/qinglong/sh/input')
const axios = require('axios');
const cheerio = require('cheerio');
var calendar = require("../utils/calendar");
const fs = require('fs');
const path = require('path');
const dataFilePath = path.join(__dirname, '..', 'db', 'gasoline.json');

require("dotenv").config();

const oilDbg = (...a) => {
  const v = (process.env.OIL_DEBUG || '').toLowerCase()
  if (v === '0' || v === 'false') return
  console.log('[油价]', ...a)
}

function normOilPrice(v) {
  const n = parseFloat(String(v ?? '').replace(/\s*\(元\)\s*/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : 0
}

const httpGetOpts = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
};

let provinces = [];
try {
    if (Array.isArray(gasoline.oil_provinces) && gasoline.oil_provinces.length > 0) {
        provinces = gasoline.oil_provinces;
    } else {
        const provincesJson = process.env.OIL_PROVINCES;
        if (provincesJson != undefined && provincesJson !== '') {
            provinces = JSON.parse(provincesJson);
        }
    }
} catch (error) {
    console.error("省份汽油编码配置错误:", error);
}

//汽油价格API: https://api.help.bj.cn/apis/youjia/
//抓取各个城市的汽油价格
async function fetchContent(url) {
    try {
        oilDbg('GET', url)
        const { data } = await axios.get(url, httpGetOpts);
        oilDbg('省份页字节', typeof data === 'string' ? data.length : 0)
        const $ = cheerio.load(data);

        const oilPrices = [];
        let $rows = $('.content_youjia dl');
        if (!$rows.length) {
            $rows = $('#youjia dl');
        }
        $rows.each((index, element) => {
            let fuelType = $(element).find('dt').text();
            fuelType = fuelType.replace(/^[\u4e00-\u9fa5]+/, '').replace('#', '号').trim();
            const price = $(element).find('dd').text().replace(/\s*\(元\)\s*/g, '').trim();
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
        oilDbg('调价页', url)
        const { data } = await axios.get(url, httpGetOpts);
        oilDbg('调价页字节', typeof data === 'string' ? data.length : 0)
        const $ = cheerio.load(data);

        // Extract specific text about oil price changes
        var priceUpdateText = $('#rightTop').text().trim().split('\n').filter(line => line.includes('相互转告')).join(' ');
		//console.log('priceUpdateText:' ,  priceUpdateText);
        if(priceUpdateText == ''){
		   priceUpdateText = $('#rightTop').text().trim().split('\n').filter(line => line.includes('调整')).join(' ');
		}

        const $tishi = $('.tishi').first().clone();
        $tishi.find('script, style').remove();
        let tishiText = $tishi.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/当前微信公众号油价已更新。?/g, '').replace(/\s+/g, ' ').trim();
        if (tishiText) {
            const parts = [priceUpdateText, tishiText].filter(Boolean);
            return parts.join('\n');
        }
        return priceUpdateText;
    } catch (error) {
        throw new Error('An error occurred while fetching the update text: ' + error.message);
    }
}

async function fetchRestrictionInfo(url) {
    try {
        // 替换为实际的目标URL
        const { data } = await axios.get(url, httpGetOpts);
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

function writeGasoline(provinceName, oilPrice92, oilPrice95, oilPrice98, oilPrice0) {
    return new Promise(async (resolve, reject) => {
        try{
            const p92 = normOilPrice(oilPrice92);
            const p95 = normOilPrice(oilPrice95);
            const p98 = normOilPrice(oilPrice98);
            const p0 = normOilPrice(oilPrice0);
            if (!fs.existsSync(dataFilePath)) {
                fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
                fs.writeFileSync(dataFilePath, JSON.stringify({ gasoline: [] }, null, 2));
            }
            data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            if (!Array.isArray(data.gasoline)) data.gasoline = [];
            const index = data.gasoline.findIndex(item => item.province_name === provinceName);
            if (data.gasoline.length == 0 || index == -1){
                    if (!(p92 || p95 || p98 || p0)) {
                        return;
                    }
                    const newId = data.gasoline.length ? Math.max(...data.gasoline.map(item => item.id)) + 1 : 1;
                    const newItem = {
                        id: newId,
                        province_name: provinceName,
                        oilPrice_92: p92,
                        oilPrice_95: p95,
                        oilPrice_98: p98,
                        oilPrice_0: p0,
                        update_date: updateDate
                    }
                    data.gasoline.push(newItem);
                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                }else{
                    const oldGasoline = data.gasoline[index];
                    let flag = false;
                    let index92 = oldGasoline.oilPrice_92;
                    let index95 = oldGasoline.oilPrice_95;
                    let index98 = oldGasoline.oilPrice_98;
                    let index0 = oldGasoline.oilPrice_0;
                    let oldUpdateDate = oldGasoline.update_date;

                    if (p92 > 0 && Number(oldGasoline.oilPrice_92) > p92) {
                        index92 = p92;
                        flag = true;
                    }

                    if (p95 > 0 && Number(oldGasoline.oilPrice_95) > p95) {
                        index95 = p95;
                        flag = true;
                    }

                    if (p98 > 0 && Number(oldGasoline.oilPrice_98) > p98) {
                        index98 = p98;
                        flag = true;
                    }

                    if (p0 > 0 && Number(oldGasoline.oilPrice_0) > p0) {
                        index0 = p0;
                        flag = true;
                    }

                    if(flag){
                        oldUpdateDate = updateDate;
                        const updatedGasolineItem = {
                            id: oldGasoline.id,
                            province_name: provinceName,
                            oilPrice_92: index92,
                            oilPrice_95: index95,
                            oilPrice_98: index98,
                            oilPrice_0: index0,
                            update_date: oldUpdateDate
                        }
                        data.gasoline[index] = { ...data.gasoline[index], ...updatedGasolineItem };
                        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                        console.log('writeOilPrice success');
                    }

                }

        } catch (error) {
            console.error('写入汽油价格失败', error.message || error);
            reject(error.message || error)
        }
    })
}

async function sendMqttMsg(gasolineContent) {
	const mqtt_host = process.env.mqtt_host || '';
	const mqtt_port = process.env.mqtt_port || '';
	const mqtt_username = process.env.mqtt_username || '';
	const mqtt_password = process.env.mqtt_password || '';

	if (!mqtt_host || !mqtt_port) {
		oilDbg('未配置 mqtt_host/mqtt_port, 跳过 MQTT')
		return;
	}

	oilDbg('MQTT', `mqtt://${mqtt_host}:${mqtt_port}`)
	const mqtt = require('mqtt');
	const clientId = 'mqtt_gasoline';
	const connectUrl = `mqtt://${mqtt_host}:${mqtt_port}`;
	const client = mqtt.connect(connectUrl, {
		clientId,
		clean: true,
		connectTimeout: 2000,
		username: mqtt_username,
		password: mqtt_password,
		reconnectPeriod: 1000,
	});

	const topic = 'qinglong/gasoline';
	const now = new Date();
	const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
	const data = {
		content: gasolineContent,
		timestamp: timestamp
	};

	return new Promise((resolve, reject) => {
		client.on('connect', async () => {
			oilDbg('mqtt 已连接')
			try {
				const result = await new Promise((pubResolve, pubReject) => {
					client.publish(topic, JSON.stringify(data), { qos: 0, retain: true }, (error) => {
						if (error) {
							pubReject(error);
						} else {
							pubResolve();
						}
					});
				});
				oilDbg('mqtt 已发布')
				setTimeout(() => {
					client.end();
					resolve();
				}, 500);
			} catch (error) {
				console.error('mqtt:Publish error', error);
				client.end();
				reject(error);
			}
		});

		client.on('error', (error) => {
			console.error('mqtt:Connection error', error);
			client.end();
			reject(error);
		});

		setTimeout(() => {
			if (client.connected === false) {
				client.end();
				reject(new Error('mqtt:Connection timeout'));
			}
		}, 2000);
	});
}

// Define handleGasoline function to use fetchContent
module.exports = handleGasoline = async () => {
    const textUrl = 'http://m.qiyoujiage.com';
    const oilUrl = 'http://m.qiyoujiage.com/{province_code}.shtml';
    const restricUrl = 'https://m.hz.bendibao.com/news/ztfeizheAhaopaixiaokechexianxing/?area=';

    try {
        oilDbg('开始, 省份数', provinces.length)
        //内容数组
        let content = [];
        content.push('⛽今日油价');

        const now = new Date();
        const startDate = new Date(now.getFullYear(), 4, 1); // 5月1日 00:00:00
        const endDate = new Date(now.getFullYear(), 4, 7, 23, 59, 59); // 5月7日 23:59:59
        if(now >= startDate && now <= endDate){
            const fujianData = { province_name: "福建", province_code: "fujian" }
            provinces.push(fujianData);
        }

        const newYearStartDate = new Date(now.getFullYear(), 1, 1); // 1月15日 00:00:00
        const newYearEndDate = new Date(now.getFullYear(), 1, 30, 23, 59, 59); // 2月25日 23:59:59
        if(now >= newYearStartDate && now <= newYearEndDate){
            const anhuiData = { province_name: "安徽", province_code: "anhui" }
            provinces.push(anhuiData);
        }

        let curr_price = 0;
        const scrapedByProvince = {};
        for(let province of provinces) {
            console.log(`正在获取 ${province.province_name} 的今日油价数据...`);
            const url = oilUrl.replace("{province_code}", province.province_code);
            const oilPriceArr = await fetchContent(url);
            if(oilPriceArr){
                oilDbg(province.province_name, '条数', oilPriceArr.length)
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

                        // 只在找到浙江时计算一次
                        if (province.province_name === "浙江" && curr_price === 0) {
                            curr_price = normOilPrice(oilPrice_95);
                        }

                    }
                    if(oilPrice.fuelType == '98号汽油'){
                        oilPrice_98 = oilPrice.price;
                    }
                    if(oilPrice.fuelType == '0号柴油'){
                        oilPrice_0 = oilPrice.price;
                    }


                }

                scrapedByProvince[province.province_name] = {
                    oilPrice_92: normOilPrice(oilPrice_92),
                    oilPrice_95: normOilPrice(oilPrice_95),
                    oilPrice_98: normOilPrice(oilPrice_98),
                    oilPrice_0: normOilPrice(oilPrice_0),
                };
                const g = scrapedByProvince[province.province_name];
                console.log('[油价]', province.province_name, `92=${g.oilPrice_92} 95=${g.oilPrice_95} 98=${g.oilPrice_98} 0#=${g.oilPrice_0}`);
                oilDbg(province.province_name, 'writeGasoline')
                writeGasoline(province.province_name, oilPrice_92, oilPrice_95, oilPrice_98, oilPrice_0);
            } else {
                console.warn('[油价]', province.province_name, '未解析到油价')
            }
        }
        oilDbg('省份循环结束')

        content.push(`\n🎯最低油价`);
        oilDbg('db', fs.existsSync(dataFilePath) ? '有' : '无')
        let low_price = 0;
        if (fs.existsSync(dataFilePath)) {
            data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            const list = Array.isArray(data.gasoline) ? data.gasoline : [];
            const zjDb = list.find((r) => r.province_name === '浙江');
            if (zjDb) {
                const raw = String(zjDb.oilPrice_95 ?? '').replace(/\s*\(元\)\s*/g, '').trim();
                const n = parseFloat(raw);
                if (Number.isFinite(n) && n > 0) low_price = n;
            }
            const zjSc = scrapedByProvince['浙江'];
            if (!low_price && zjSc && zjSc.oilPrice_95) low_price = zjSc.oilPrice_95;
            const mix = (dbVal, alt) => {
                const d = Number(dbVal);
                if (Number.isFinite(d) && d > 0) return String(dbVal).replace(/\s*\(元\)\s*/g, '').trim();
                if (alt > 0) return String(alt);
                return String(dbVal ?? 0).replace(/\s*\(元\)\s*/g, '').trim();
            };
            for (let province of provinces) {
                list.forEach((result) => {
                    if (result.province_name == province.province_name) {
                        const sc = scrapedByProvince[result.province_name] || {};
                        content.push(`\n🚘${result.province_name}\n`);
                        content.push(`· 92号汽油: ${mix(result.oilPrice_92, sc.oilPrice_92)}`);
                        content.push(`· 95号汽油: ${mix(result.oilPrice_95, sc.oilPrice_95)}`);
                        content.push(`· 98号汽油: ${mix(result.oilPrice_98, sc.oilPrice_98)}`);
                        content.push(`· 0号柴油: ${mix(result.oilPrice_0, sc.oilPrice_0)}`);
                        content.push(`· 更新时间: ${result.update_date}`);
                    }
                });
            }
        }
        if (!curr_price && low_price) curr_price = low_price;
        var updateText = await fetchUpdateText(textUrl);
        oilDbg('调价摘要', (updateText || '').slice(0, 80))

        let lunarDate = calendar.solar2lunar();
        oilDbg('农历', lunarDate.ncWeek)
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

        //汽油换算
        const curr_cost_30 = curr_price * 30;
        const curr_cost_50 = curr_price * 50;

        const low_cost_30 = low_price * 30;
        const low_cost_50 = low_price * 50;

        const diff_cost_30 = curr_cost_30 - low_cost_30;
        const diff_cost_50 = curr_cost_50 - low_cost_50;

        content.push(`\n🚖浙江95号汽油换算\n`);
        content.push(`· 油箱容积: 60升`);
        content.push(`· 30L油费: ${curr_cost_30.toFixed(2)}元`);
        content.push(`· 30L差价: ${diff_cost_30.toFixed(2)}元`);
        content.push(`· 50L油费: ${curr_cost_50.toFixed(2)}元`);
        content.push(`· 50L差价: ${diff_cost_50.toFixed(2)}元`);
        const ut = (updateText || '').trim();
        if (ut) content.push('\n' + ut);

        await sendMqttMsg(content.join('\n'));

        console.log('[油价] 完成, 行数', content.length)

        return content.join('\n');

    } catch (error) {
        console.error('[油价] 失败', error.message || error);
        throw new Error(error.message || error);
    }
};
