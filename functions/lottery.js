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
			//实际双色球号码数量大于200, 清空数据
			if (data.lottery.length > 200){
				data.lottery = [];
				fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
			}
			const oldLottery = data.lottery.filter(item => item.ssq_code === ssqCode);
			if (oldLottery.length == 0){
				// 自动生成新ID
				const newId = data.lottery.length ? Math.max(...data.lottery.map(item => item.id)) + 1 : 1;
				const newItem = {
					id: newId,
					ssq_code: ssqCode,
					ssq_red: ssqRed,
					ssq_blue: ssqBlue,
					ssq_date: ssqDate
				};
				data.lottery.push(newItem);
				fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
				console.log('writeLotteryCode success');
			}else{
				console.log('writeLotteryCode exist');
			}

			//比较中奖概率
			const winnings = calculateWinnings(data.lottery, data.predict);
			lotteryContent.push(`\n🎯本期预测双色球开奖\n`);
			winnings.forEach(result => {
				lotteryContent.push(`· 中奖情况: ${result.matchedPrize}`);
				lotteryContent.push(`· 中奖金额: ${result.matchedAmount}`);
				lotteryContent.push(`· 匹配红球数: ${result.matchedRedBalls}`);
				lotteryContent.push(`· 是否匹配蓝球: ${result.matchedBlueBall}`);
			});

			//预测双色球号码数量大于2, 删除最后一条数据
			if (data.predict.length > 1){
				const updatedPredict = data.predict.filter(item => item.id !== 1);
				data.predict = updatedPredict;
				fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
			}

			//预测下期双色球号码
			const newPredictId = data.predict.length ? Math.max(...data.predict.map(item => item.id)) + 1 : 1;
			const prediction = predictNextSSQ(data);
			lotteryContent.push(`\n💹预测下期双色球号码\n`);
			lotteryContent.push(`· 预测编号: ` + newPredictId);
			lotteryContent.push(`· 彩票期数: ` + data.lottery.length);
			lotteryContent.push(`· 红球号码: ` + prediction.redBalls);
			lotteryContent.push(`· 蓝球号码: ` + prediction.blueBall);
			console.log("Predicted Red Balls:", prediction.redBalls);
			console.log("Predicted Blue Ball:", prediction.blueBall);

			//写入预测双色球号码
			const oldPredict = data.predict.filter(oldItem => oldItem.pre_date === ssqDate);
			if (oldPredict.length == 0) {
				const newPrediction = {
					id: newPredictId,
					ssq_red: prediction.redBalls,
					ssq_blue: prediction.blueBall,
					pre_date: ssqDate
				}
				data.predict.push(newPrediction);
				fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
				console.log('writePredictLotteryCode success');
			}else{
				console.log('writePredictLotteryCode exist');
			}
		} else {
			console.log('Data file not found', error.message || error);
		}
	} catch (error) {
		console.error('写入彩票号码失败', error.message || error);
		reject(error.message || error)
	}
})
}

// 双色球的中奖规则和对应的中奖金额如下：
// 一等奖：6个红球+1个蓝球，奖金通常是浮动的，一般为数百万元或以上。
// 二等奖：6个红球，奖金通常也是浮动的，通常为数十万元。
// 三等奖：5个红球+1个蓝球，固定奖金3000元。
// 四等奖：5个红球或4个红球+1个蓝球，固定奖金200元。
// 五等奖：4个红球或3个红球+1个蓝球，固定奖金10元。
// 六等奖：1个蓝球，固定奖金5元。

// 计算中奖情况
function calculateWinnings(lottery, predict) {
	const matchRedBalls = (drawn, predicted) => {
		const drawnSet = new Set(drawn.split(',').map(Number));
		const predictedSet = new Set(predicted.split(',').map(Number));
		let matches = 0;
		predictedSet.forEach(num => {
			if (drawnSet.has(num)) matches++;
		});
		return matches;
	};

	const matchBlueBall = (drawn, predicted) => {
		return drawn === predicted;
	};

	const results = [];

	const lastLottery = lottery[lottery.length - 1];
	const lastPrediction = predict[predict.length - 1];

	const redMatches = matchRedBalls(lastLottery.ssq_red, lastPrediction.ssq_red);
	const blueMatch = matchBlueBall(lastLottery.ssq_blue, lastPrediction.ssq_blue);

	let prize;
	let prizeAmount;
	if (redMatches === 6 && blueMatch) {
		prize = '一等奖';
		prizeAmount = "100万元以上";
	} else if (redMatches === 6) {
		prize = '二等奖';
		prizeAmount = "10万元";
	} else if (redMatches === 5 && blueMatch) {
		prize = '三等奖';
		prizeAmount = "3000元";
	} else if (redMatches === 5 || (redMatches === 4 && blueMatch)) {
		prize = '四等奖';
		prizeAmount = "200元";
	} else if (redMatches === 4 || (redMatches === 3 && blueMatch)) {
		prize = '五等奖';
		prizeAmount = "10元";
	} else if (blueMatch) {
		prize = '六等奖';
		prizeAmount = "5元";
	} else {
		prize = '未中奖';
		prizeAmount = "0元";
	}

	results.push({
		matchedRedBalls: redMatches,
		matchedBlueBall: blueMatch,
		matchedPrize: prize,
		matchedAmount: prizeAmount
	});

	return results;
}


// 统计出现频率的函数
function countFrequency(arr) {
	return arr.reduce((acc, num) => {
		acc[num] = (acc[num] || 0) + 1;
		return acc;
	}, {});
}

// 获取出现频率最高的号码
// function getMostFrequentNumbers(counts, count) {
// 	return Object.entries(counts)
// 		.sort((a, b) => b[1] - a[1])
// 		.slice(0, count)
// 		.map(entry => parseInt(entry[0]));
// }

// 获取出现频率最高的号码，并随机填充剩余部分
function getMostFrequentNumbers(counts, count) {
	const entries = Object.entries(counts);

	// 如果 count 为 1，直接随机选择一个号码
	if (count === 1) {
		const randomIndex = Math.floor(Math.random() * entries.length);
		return [parseInt(entries[randomIndex][0])];
	}

	// 按频率排序
	entries.sort((a, b) => b[1] - a[1]);

	// 取一半出现频率最高的号码
	const halfCount = Math.ceil(count / 2);
	const mostFrequentNumbers = entries
		.slice(0, halfCount)
		.map(entry => parseInt(entry[0]));

	// 剩余号码池
	const remainingNumbers = entries
		.slice(halfCount)
		.map(entry => parseInt(entry[0]));

	// 随机填充剩余部分，确保不重复
	while (mostFrequentNumbers.length < count) {
		const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
		const randomNumber = remainingNumbers[randomIndex];
		if (!mostFrequentNumbers.includes(randomNumber)) {
			mostFrequentNumbers.push(randomNumber);
		}
	}

	return mostFrequentNumbers;
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
		redBalls: predictedReds.join(', '),
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
				lotteryContent.push(`· 中奖号码: ` + SD.red);
				if (SD.content != ''&&SD.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + SD.content);
				}
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
				lotteryContent.push(`· 中奖号码: ` + KL8.red);
				if (KL8.content != ''&&KL8.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + KL8.content);
				}
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
				lotteryContent.push(`· 红球号码: ` + QLC.red);
				lotteryContent.push(`· 蓝球号码: ` + QLC.blue);
				if (QLC.content != ''&&QLC.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + QLC.content);
				}
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
				lotteryContent.push(`· 红球号码: ` + SSQ.red);
				lotteryContent.push(`· 蓝球号码: ` + SSQ.blue);
				if (SSQ.content != ''&&SSQ.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + SSQ.content);
				}
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
