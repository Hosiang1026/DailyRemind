const { lottery } = require('./input')
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const dataFilePath = path.join(__dirname, '..', 'db', 'lottery.json');

require("dotenv").config();

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.57";
const options = { headers: { "User-Agent": UA }, rejectUnauthorized: false };
const lotteryURLs = [
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&pageNo=1&pageSize=1&systemType=PC",
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=3d&pageNo=1&pageSize=1&systemType=PC",
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=kl8&pageNo=1&pageSize=1&systemType=PC",
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=qlc&pageNo=1&pageSize=1&systemType=PC"
];

async function getLotteryData(url) {
	const response = await axios.get(url, options);
	return response.data.result[0];
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 写入彩票号码
function writeLotteryCode(ssqCode, ssqRed, ssqBlue, ssqDate, lotteryContent) {
	return new Promise(async (resolve, reject) => {
	try{
		if (fs.existsSync(dataFilePath)) {
			const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

			// 自动生成新ID
			const newId = data.lottery.length ? Math.max(...data.lottery.map(item => item.id)) + 1 : 1;

			const newItem = {
				id: newId,
				ssq_code: ssqCode,
				ssq_red: ssqRed,
				ssq_blue: ssqBlue,
				ssq_date: ssqDate
			};
			const oldLottery = data.lottery.filter(item => item.ssq_code === ssqCode);
			if (oldLottery.length == 0){
				data.lottery.push(newItem);
				fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
				console.log('writeLotteryCode success');
			}else{
				console.log('writeLotteryCode exist');
			}

			const prediction = predictNextSSQ(data);
			lotteryContent.push(`\n🎯预测下一期双色球号码\n`);
			lotteryContent.push(`· 红球号码: ` + prediction.redBalls);
			lotteryContent.push(`· 蓝球号码: ` + prediction.blueBall);
			console.log("Predicted Red Balls:", prediction.redBalls);
			console.log("Predicted Blue Ball:", prediction.blueBall);

		} else {
			console.log('Data file not found', error.message || error);
		}
	} catch (error) {
		console.error('写入彩票号码失败', error.message || error);
		reject(error.message || error)
	}
})
}

// 统计出现频率的函数
function countFrequency(arr) {
	return arr.reduce((acc, num) => {
		acc[num] = (acc[num] || 0) + 1;
		return acc;
	}, {});
}

// 获取出现频率最高的号码
function getMostFrequentNumbers(counts, count) {
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, count)
		.map(entry => parseInt(entry[0]));
}

//预测下一个双色球号码, 基于统计频率的简单预测算法
function predictNextSSQ(data) {
	const redBalls = [];
	const blueBalls = [];

	// 将所有的红球号码和蓝球号码加入列表
	data.lottery.forEach(entry => {
		redBalls.push(...entry.ssq_red.split(','));
		blueBalls.push(entry.ssq_blue);
	});

	// 统计每个红球号码和蓝球号码的出现频率
	const redCounts = countFrequency(redBalls);
	const blueCounts = countFrequency(blueBalls);

	// 选择出现频率最高的红球号码和蓝球号码
	let predictedReds = getMostFrequentNumbers(redCounts, 6);
	let predictedBlue = getMostFrequentNumbers(blueCounts, 1)[0];

	// 如果红球号码少于6个，则随机补充
	while (predictedReds.length < 6) {
		const randomRed = Math.floor(Math.random() * 33) + 1;
		if (!predictedReds.includes(randomRed)) {
			predictedReds.push(randomRed);
		}
	}

	// 确保红球号码排序
	predictedReds.sort((a, b) => a - b);

	return {
		redBalls: predictedReds,
		blueBall: predictedBlue
	};
}

function getLotteryCookie() {
	return new Promise(async (resolve, reject) => {
	try{
	    const response = await axios.get("http://www.cwl.gov.cn", { headers: { "User-Agent": UA } });
		options.headers.Cookie = response.headers["set-cookie"][0];
		process.env.ck = options.headers.Cookie;
		resolve(process.env.ck)
	} catch (error) {
		console.log('处理cookie失败', error.message || error);
		reject(error.message || error)
	}
})
}

//处理福利彩票数据
module.exports = handleLottery = () => {
	return new Promise(async (resolve, reject) => {
	try {
		getLotteryCookie();
		// 等待 5000 毫秒（5 秒）
		await sleep(5000);
		let lotteryContent = [];
		const cookieString = process.env.ck;
		const expiresString = cookieString.match(/Expires=([^;]+)/)[1];
		const isExpired = new Date().getTime() > new Date(expiresString).getTime();

		if (isExpired) {
			const response = await axios.get("http://www.cwl.gov.cn", { headers: { "User-Agent": UA } });
			options.headers.Cookie = response.headers["set-cookie"][0];
			process.env.ck = options.headers.Cookie;
		} else {
			options.headers.Cookie = cookieString;
		}

		const [SSQ, SD, KL8, QLC] = await Promise.all(lotteryURLs.map(getLotteryData));

		lotteryContent.push(`📈福利彩票`);

		let nowDate = new Date();
		let nowDay = nowDate.getDay();

		let SDArr = lottery.SD;
		for (let i = 0; i < SDArr.length; i++) {
			if (SDArr[i] == nowDay){
				lotteryContent.push(`\n🎱福彩3D\n`);
				lotteryContent.push(`· 开奖期号: ` + SD.code);
				lotteryContent.push(`· 开奖日期: ` + SD.date);
				if (SD.sales != ''&&SD.sales != '_'&&SD.sales != '0'){
					lotteryContent.push(`· 销售金额: ` + SD.sales + '元');
				}
				if (SD.poolmoney != ''&&SD.poolmoney != '_'&&SD.poolmoney != '0'){
					lotteryContent.push(`· 奖池金额: ` + SD.poolmoney + '元');
				}
				if (SD.content != ''&&SD.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + SD.content);
				}
				lotteryContent.push(`· 中奖号码: ` + SD.red);
			}
		}

		let KL8Arr = lottery.KL8;
		for (let i = 0; i < KL8Arr.length; i++) {
			if (KL8Arr[i] == nowDay){
				lotteryContent.push(`\n🎱快乐8\n`);
				lotteryContent.push(`· 开奖期号: ` + KL8.code);
				lotteryContent.push(`· 开奖日期: ` + KL8.date);
				if (KL8.sales != ''&&KL8.sales != '_'&&KL8.sales != '0'){
					lotteryContent.push(`· 销售金额: ` + KL8.sales + '元');
				}
				if (KL8.poolmoney != ''&&KL8.poolmoney != '_'&&KL8.poolmoney != '0'){
					lotteryContent.push(`· 奖池金额: ` + KL8.poolmoney + '元');
				}
				if (KL8.content != ''&&KL8.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + KL8.content);
				}
				lotteryContent.push(`· 中奖号码: ` + KL8.red);
			}
		}

		let QLCArr = lottery.QLC;
		for (let i = 0; i < QLCArr.length; i++) {
			if (QLCArr[i] == nowDay){
				lotteryContent.push(`\n🎱七乐彩\n`);
				lotteryContent.push(`· 开奖期号: ` + QLC.code);
				lotteryContent.push(`· 开奖日期: ` + QLC.date);
				if (QLC.sales != ''&&QLC.sales != '_'&&QLC.sales != '0'){
					lotteryContent.push(`· 销售金额: ` + QLC.sales + '元');
				}
				if (QLC.poolmoney != ''&&QLC.poolmoney != '_'&&QLC.poolmoney != '0'){
					lotteryContent.push(`· 奖池金额: ` + QLC.poolmoney + '元');
				}
				if (QLC.content != ''&&QLC.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + QLC.content);
				}
				lotteryContent.push(`· 红球号码: ` + QLC.red);
				lotteryContent.push(`· 蓝球号码: ` + QLC.blue);
			}
		}

		let SSQArr = lottery.SSQ;
		for (let i = 0; i < SSQArr.length; i++) {
			if (SSQArr[i] == nowDay){
				lotteryContent.push(`\n🎱双色球\n`);
				lotteryContent.push(`· 开奖期号: ` + SSQ.code);
				lotteryContent.push(`· 开奖日期: ` + SSQ.date);
				if (SSQ.sales != ''&&SSQ.sales != '_'&&SSQ.sales != '0'){
					lotteryContent.push(`· 销售金额: ` + SSQ.sales + '元');
				}
				if (SSQ.poolmoney != ''&&SSQ.poolmoney != '_'&&SSQ.poolmoney != '0'){
					lotteryContent.push(`· 奖池金额: ` + SSQ.poolmoney + '元');
				}
				if (SSQ.content != ''&&SSQ.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + SSQ.content);
				}
				lotteryContent.push(`· 红球号码: ` + SSQ.red);
				lotteryContent.push(`· 蓝球号码: ` + SSQ.blue);

				// 双色球 - 写入彩票号码
				writeLotteryCode(SSQ.code, SSQ.red, SSQ.blue, SSQ.date, lotteryContent);
			}
		}

		//lotteryContent.push(`\n🎉备注\n`);
		//lotteryContent.push(`· 福彩3D、快乐8: 每日开奖`);
		//lotteryContent.push(`· 七乐彩: 每周一、三、五开奖`);
		//lotteryContent.push(`· 双色球: 每周二、四、日开奖`);

		resolve(lotteryContent.join('\n'))
		console.log("获取福利彩票结果" + lotteryContent.join('\n'));
	} catch (error) {
		console.log('处理福利彩票数据失败', error.message || error);
		reject(error.message || error)
	}
	})
}
