const { lottery } = require('../sh/input')
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const dataFilePath = path.join(__dirname, '..', 'db', 'lottery.json');

require("dotenv").config();

async function sendMqttMsg(lotteryContent) {
	const mqtt_host = process.env.mqtt_host || '';
	const mqtt_port = process.env.mqtt_port || '';
	const mqtt_username = process.env.mqtt_username || '';
	const mqtt_password = process.env.mqtt_password || '';

	if (!mqtt_host || !mqtt_port) {
		return;
	}

	const mqtt = require('mqtt');
	const clientId = 'mqtt_lottery';
	const connectUrl = `mqtt://${mqtt_host}:${mqtt_port}`;
	const client = mqtt.connect(connectUrl, {
		clientId,
		clean: true,
		connectTimeout: 2000,
		username: mqtt_username,
		password: mqtt_password,
		reconnectPeriod: 1000,
	});

	const topic = 'qinglong/lottery';
	const now = new Date();
	const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
	const data = {
		content: '🎰福利彩票\n\n' + lotteryContent,
		timestamp: timestamp
	};

	return new Promise((resolve, reject) => {
		client.on('connect', async () => {
			console.log('mqtt:Connected');
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
				console.log('mqtt:Published');
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
function writeLotteryCode(ssqCode, ssqRed, ssqBlue, ssqDate, lotteryContent, nowDay) {
	return new Promise(async (resolve, reject) => {
	try{
		if (!fs.existsSync(dataFilePath)) {
			fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
			fs.writeFileSync(dataFilePath, JSON.stringify({ lottery: [], predict: [] }, null, 2));
		}
		const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
		if (!Array.isArray(data.lottery)) data.lottery = [];
		if (!Array.isArray(data.predict)) data.predict = [];
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

			const showSsqPredict = Array.isArray(lottery.SSQ) && lottery.SSQ.includes(nowDay);
			//比较中奖概率
			if(showSsqPredict && data.lottery.length > 0 && data.predict.length > 0){
				const lastPrediction = data.predict[data.predict.length - 1];
				const winnings = calculateWinnings(data.lottery, data.predict);
				lotteryContent.push(`\n🎯本期预测开奖\n`);
				winnings.forEach(result => {
					lotteryContent.push(`· 匹配红球数: ${result.matchedRedBalls}`);
					lotteryContent.push(`· 是否匹配蓝球: ${result.matchedBlueBall ? '是' : '否'}`);
					lotteryContent.push(`· 中奖情况: ${result.matchedPrize}`);
					lotteryContent.push(`· 中奖金额: ${result.matchedAmount}`);
					lotteryContent.push(`· 预测蓝球号码: ` + lastPrediction.ssq_blue);
					lotteryContent.push(`· 预测红球号码: ` + lastPrediction.ssq_red);
				});
			}

			//预测双色球号码数量大于2, 删除最后一条数据
			if (data.predict.length > 1){
				const updatedPredict = data.predict.filter(item => item.id !== data.predict[0].id);
				data.predict = updatedPredict;
				fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
			}

			//预测下期双色球号码
			const newPredictId = data.predict.length ? Math.max(...data.predict.map(item => item.id)) + 1 : 1;
			const prediction = predictNextSSQ(data);
			if (showSsqPredict) {
				lotteryContent.push(`\n💹下期预测号码\n`);
				lotteryContent.push(`· 彩票期数: ` + data.lottery.length);
				lotteryContent.push(`· 蓝球号码: ` + prediction.blueBall);
				lotteryContent.push(`· 红球号码: ` + prediction.redBalls);
			}
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
		return drawn == predicted;
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

// 统计频率的函数
function countFrequency(numbers) {
	const counts = {};
	numbers.forEach(number => {
		counts[number] = (counts[number] || 0) + 1;
	});
	return counts;
}

// 获取热号（出现频率最高的号码）
function getHotNumbers(counts, num) {
	return Object.keys(counts)
		.sort((a, b) => counts[b] - counts[a])
		.slice(0, num)
		.map(Number);
}

// 获取冷号（出现频率最低的号码）
function getColdNumbers(counts, num) {
	return Object.keys(counts)
		.sort((a, b) => counts[a] - counts[b])
		.slice(0, num)
		.map(Number);
}

function sortedNumericPercentile(arr, p) {
	const s = [...arr].sort((a, b) => a - b);
	if (s.length === 0) return 0;
	const x = (s.length - 1) * p;
	const i = Math.floor(x);
	const j = Math.ceil(x);
	if (i === j) return s[i];
	return s[i] + (s[j] - s[i]) * (x - i);
}

function selectRedNumbers(hotReds, coldReds, num, recentLottery, redCounts) {
	const allNumbers = Array.from({ length: 33 }, (_, i) => i + 1);
	const pool = [...new Set([...hotReds, ...coldReds, ...allNumbers])];
	const draws = recentLottery && recentLottery.length ? recentLottery.length : 1;
	const maxFreq = Math.max(1, ...Object.values(redCounts || {}));

	const weights = {};
	pool.forEach(num => {
		let weight = 1;
		if (redCounts && redCounts[num]) {
			weight += (redCounts[num] / maxFreq) * 2.5;
		}
		if (hotReds.includes(num)) weight += 3;
		if (coldReds.includes(num)) weight += 1;
		if (recentLottery && recentLottery.some(entry => entry.ssq_red.split(',').map(Number).includes(num))) {
			weight += 2 + (1 / draws) * 3;
		}
		weights[num] = weight;
	});

	const selected = [];
	const maxAttempts = 1000;
	let attempts = 0;

	while (selected.length < num && attempts < maxAttempts) {
		const totalWeight = pool.reduce((sum, num) => sum + (selected.includes(num) ? 0 : weights[num]), 0);
		let random = Math.random() * totalWeight;
		
		for (const number of pool) {
			if (selected.includes(number)) continue;
			random -= weights[number];
			if (random <= 0) {
				selected.push(number);
				break;
			}
		}
		attempts++;
	}

	if (selected.length < num) {
		const remaining = pool.filter(n => !selected.includes(n));
		while (selected.length < num && remaining.length > 0) {
			const randomIndex = Math.floor(Math.random() * remaining.length);
			selected.push(remaining.splice(randomIndex, 1)[0]);
		}
	}

	return selected;
}

function selectBlueNumber(hotBlues, coldBlues, recentLottery, blueCounts) {
	const allNumbers = Array.from({ length: 16 }, (_, i) => i + 1);
	const pool = [...new Set([...hotBlues, ...coldBlues, ...allNumbers])];
	const draws = recentLottery && recentLottery.length ? recentLottery.length : 1;
	const maxFreq = Math.max(1, ...Object.values(blueCounts || {}));

	const weights = {};
	pool.forEach(num => {
		let weight = 1;
		if (blueCounts && blueCounts[num]) {
			weight += (blueCounts[num] / maxFreq) * 3;
		}
		if (hotBlues.includes(num)) weight += 3;
		if (coldBlues.includes(num)) weight += 1;
		if (recentLottery && recentLottery.some(entry => Number(entry.ssq_blue) === num)) {
			weight += 2 + (1 / draws) * 2;
		}
		weights[num] = weight;
	});

	const totalWeight = pool.reduce((sum, num) => sum + weights[num], 0);
	let random = Math.random() * totalWeight;
	
	for (const number of pool) {
		random -= weights[number];
		if (random <= 0) {
			return number;
		}
	}
	return pool[0];
}

// 格式化号码：个位数补零
function formatNumber(num) {
	return num < 10 ? `0${num}` : `${num}`;
}

function predictNextSSQ(data) {
	const redBalls = [];
	const blueBalls = [];
	const histLen = data.lottery.length;
	const recentN = Math.min(30, Math.max(12, Math.floor(histLen * 0.15) || 20));
	const recentLottery = data.lottery.slice(-recentN);

	data.lottery.forEach(entry => {
		redBalls.push(...entry.ssq_red.split(',').map(Number));
		blueBalls.push(Number(entry.ssq_blue));
	});

	const redCounts = countFrequency(redBalls);
	const blueCounts = countFrequency(blueBalls);

	const hotReds = getHotNumbers(redCounts, 15);
	const coldReds = getColdNumbers(redCounts, 15);
	const hotBlues = getHotNumbers(blueCounts, 8);
	const coldBlues = getColdNumbers(blueCounts, 8);

	const historicalSums = [];
	const historicalOdds = [];
	const historicalBigs = [];
	const historicalSpans = [];
	const historicalConsec = [];
	data.lottery.forEach(entry => {
		const reds = entry.ssq_red.split(',').map(Number).sort((a, b) => a - b);
		historicalSums.push(reds.reduce((a, b) => a + b, 0));
		historicalOdds.push(reds.filter(n => n % 2 === 1).length);
		historicalBigs.push(reds.filter(n => n > 16).length);
		historicalSpans.push(reds[reds.length - 1] - reds[0]);
		historicalConsec.push(reds.filter((n, i) => i > 0 && n === reds[i - 1] + 1).length);
	});

	const lo = 0.12;
	const hi = 0.88;
	let sumRange = [sortedNumericPercentile(historicalSums, lo), sortedNumericPercentile(historicalSums, hi)];
	let oddRange = [sortedNumericPercentile(historicalOdds, lo), sortedNumericPercentile(historicalOdds, hi)];
	let bigRange = [sortedNumericPercentile(historicalBigs, lo), sortedNumericPercentile(historicalBigs, hi)];
	let spanRange = [sortedNumericPercentile(historicalSpans, lo), sortedNumericPercentile(historicalSpans, hi)];
	let consecRange = [sortedNumericPercentile(historicalConsec, lo), sortedNumericPercentile(historicalConsec, hi)];
	if (historicalSums.length < 8) {
		const avgSum = historicalSums.reduce((a, b) => a + b, 0) / Math.max(1, historicalSums.length);
		sumRange = [avgSum - 30, avgSum + 30];
		oddRange = [2, 4];
		bigRange = [2, 4];
		spanRange = [20, 28];
		consecRange = [0, 2];
	}

	const maxAttempts = 120;
	let bestReds = null;
	let bestScore = -1;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const candidateReds = selectRedNumbers(hotReds, coldReds, 6, recentLottery, redCounts);
		candidateReds.sort((a, b) => a - b);

		const sum = candidateReds.reduce((a, b) => a + b, 0);
		const oddCount = candidateReds.filter(n => n % 2 === 1).length;
		const bigCount = candidateReds.filter(n => n > 16).length;
		const span = candidateReds[candidateReds.length - 1] - candidateReds[0];
		const z1 = candidateReds.filter(n => n <= 11).length;
		const z2 = candidateReds.filter(n => n > 11 && n <= 22).length;
		const z3 = candidateReds.filter(n => n > 22).length;
		const zoneMin = Math.min(z1, z2, z3);
		const zoneMax = Math.max(z1, z2, z3);

		let score = 0;
		if (sum >= sumRange[0] && sum <= sumRange[1]) score += 3;
		if (oddCount >= oddRange[0] && oddCount <= oddRange[1]) score += 2;
		if (bigCount >= bigRange[0] && bigCount <= bigRange[1]) score += 2;
		if (span >= spanRange[0] && span <= spanRange[1]) score += 2;

		const consecutiveCount = candidateReds.filter((n, i) => i > 0 && n === candidateReds[i - 1] + 1).length;
		if (consecutiveCount >= consecRange[0] && consecutiveCount <= consecRange[1]) score += 1;
		if (zoneMin >= 1 && zoneMax <= 4) score += 2;

		if (score > bestScore) {
			bestScore = score;
			bestReds = candidateReds;
		}

		if (score >= 10) break;
	}

	const predictedReds = bestReds || selectRedNumbers(hotReds, coldReds, 6, recentLottery, redCounts).sort((a, b) => a - b);
	const predictedBlue = selectBlueNumber(hotBlues, coldBlues, recentLottery, blueCounts);

	const formattedReds = predictedReds.map(num => formatNumber(num));
	const formattedBlue = formatNumber(predictedBlue);

	return {
		redBalls: formattedReds.join(','),
		blueBall: formattedBlue
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

		let nowDate = new Date("2025-02-13");
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
				lotteryContent.push(`· 蓝球号码: ` + SSQ.blue);
				lotteryContent.push(`· 红球号码: ` + SSQ.red);
				if (SSQ.content != ''&&SSQ.content != '_'){
					lotteryContent.push(`· 中奖情况: ` + SSQ.content);
				}
				// 双色球 - 写入彩票号码
				writeLotteryCode(SSQ.code, SSQ.red, SSQ.blue, SSQ.date, lotteryContent, nowDay);
			}
		}

		//lotteryContent.push(`\n🎉备注\n`);
		//lotteryContent.push(`· 福彩3D、快乐8: 每日开奖`);
		//lotteryContent.push(`· 七乐彩: 每周一、三、五开奖`);
		//lotteryContent.push(`· 双色球: 每周二、四、日开奖`);

		const content = lotteryContent.join('\n');
		const mqttContent = lotteryContent.filter(line => !line.includes('📈福利彩票')).join('\n');
		await sendMqttMsg(mqttContent);
		resolve(content);
		console.log("获取福利彩票结果" + content);
	} catch (error) {
		console.log('处理福利彩票数据失败', error.message || error);
		reject(error.message || error)
	}
	})
}
