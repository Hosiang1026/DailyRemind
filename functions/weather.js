const { weather } = require('../input')
const axios = require('axios')
const publicIp = require('public-ip');

let umbrellaFlag = false;
let rainDayNum = 0;

//获取外网IP地址
const getPublicIPAddress = () => {
    return new Promise(async (resolve, reject) => {
        try {
            publicIp.v4(function (err, ipv4) {
                console.log('获取外网IP地址: ', ipv4);
                resolve(ipv4)
            });
        } catch (error) {
            console.log('获取外网IP地址失败', error.message || error);
            reject(error.message || error)
        }
    })
}


//获得天气数据
//IP地址获取天气 https://ip.help.bj.cn/?ip=${IPAddress}
//中国天气API: http://www.weather.com.cn/data/cityinfo/101210106.html
//高德天气未来三天API: https://restapi.amap.com/v3/weather/weatherInfo?city=330110&extensions=all&key=d8045d9dd3eb0db5dc3f2a807a6a64e0
//高德天气实况天气API：https://restapi.amap.com/v3/weather/weatherInfo?city=330110&extensions=base&key=d8045d9dd3eb0db5dc3f2a807a6a64e0
const getBaseWeather = (weatherKey, weatherCityCode, baseAppend) => {
    return new Promise(async (resolve, reject) => {
        try {
			let weatherContent = []
			//const IPAddress = await getPublicIPAddress()
			//const weatherReq = axios(`https://ip.help.bj.cn/?ip=${IPAddress}`)//这是四天的天气预报
            //const cityId = await getCityCode(cityName)
            //多请求并行 https://api.help.bj.cn/apis/weather2d/?id=杭州
			//这是实况天气预报，实况天气每小时更新多次，预报天气每天更新3次，分别在8、11、18点左右更新
			const weatherReq = axios(`https://restapi.amap.com/v3/weather/weatherInfo?key=${weatherKey}&extensions=base&city=${weatherCityCode}`)
			const weatherRes = await weatherReq //实况天气
			if (weatherRes.status == 200) {
				const dataArr = weatherRes.data.lives;
				let weatherData = dataArr[0];
				let weathers = weatherData.weather;
				var weatherIcon = '';
				switch (weathers) {
					case "晴":
						weatherIcon = "🌤";
						break;
					case "多云":
						weatherIcon = "🌥";
						break;
					case "阴":
						weatherIcon = "☁";
						break;
					case "小雨":
						weatherIcon = "🌨";
						umbrellaFlag = true;
						break;
					case "中雨":
						weatherIcon = "🌧";
						umbrellaFlag = true;
						break;
					case "大雨":
						weatherIcon = "⛈";
						umbrellaFlag = true;
						break;
				}
				console.log('获取今日实况天气成功', weatherData);
				weatherContent.push(`\n🎈${weatherData.province}${weatherData.city}`);
				weatherContent.push(`· 天气: ${weathers}${weatherIcon}`);
				weatherContent.push(`· 气温: ${weatherData.temperature}℃`);
				weatherContent.push(`· 风况: ${weatherData.winddirection}风${weatherData.windpower}级`);
				if (umbrellaFlag&&baseAppend){
					weatherContent.push(`\n🌂外面正在下雨, 记得带伞！`);
					umbrellaFlag = false;
				}
				resolve(weatherContent.join('\n'), umbrellaFlag)
		   } else {
			  reject(weatherRes.data.info)
		   }
        } catch (error) {
            console.log('获取今日天气失败', error.message || error);
            reject(error.message || error)
        }
    })
}

const getAllWeather = (weatherKey, weatherCityCode, allAppend) => {
	return new Promise(async (resolve, reject) => {
		try {
			let weatherContent = []
			//这是未来四天的天气预报
			const weatherReq = axios(`https://restapi.amap.com/v3/weather/weatherInfo?key=${weatherKey}&extensions=all&city=${weatherCityCode}`)
			const weatherRes = await weatherReq
			if (weatherRes.status == 200) {
				const dataArr = weatherRes.data.forecasts;
				let data = {
					province: dataArr[0].province,//省级
					city: dataArr[0].city,//区级
					casts: dataArr[0].casts //天气数据
				}
				console.log('获取未来四天的天气成功', data.casts);
				weatherContent.push(`\n🎈${data.province}${data.city}`);
				let weatherCastsArr = data.casts;
				for (let i = 0; i < weatherCastsArr.length; i++) {
					let weatherData = weatherCastsArr[i];
					let weatherWeek = weatherData.week;
					let weatherWeekName = '';
					switch (weatherWeek) {
						case "1":
							weatherWeekName = "周一";
							break;
						case "2":
							weatherWeekName = "周二";
							break;
						case "3":
							weatherWeekName = "周三";
							break;
						case "4":
							weatherWeekName = "周四";
							break;
						case "5":
							weatherWeekName = "周五";
							break;
						case "6":
							weatherWeekName = "周六";
							break;
						default:
							weatherWeekName = "周日";
					}

					let weathers = weatherData.dayweather;
					var weatherIcon = '';
					switch (weathers) {
						case "晴":
							weatherIcon = "🌤";
							break;
						case "阴":
							weatherIcon = "☁";
							break;
						case "多云":
							weatherIcon = "🌥";
							break;
						case "小雨":
							weatherIcon = "🌨";
							rainDayNum = rainDayNum+1;
							break;
						case "中雨":
							weatherIcon = "🌧";
							rainDayNum = rainDayNum+1;
							break;
						case "大雨":
							weatherIcon = "⛈";
							rainDayNum = rainDayNum+1;
							break;
					}
					weatherContent.push(`\n${weatherData.date} ${weatherWeekName}`);
					weatherContent.push(`· 天气: ${weathers}${weatherIcon}`);
					weatherContent.push(`· 气温: ${weatherData.nighttemp}℃ ~ ${weatherData.daytemp}℃`);
					weatherContent.push(`· 风况: ${weatherData.daywind}风${weatherData.daypower}级`);
				}

				if (rainDayNum > 0&&allAppend){
					weatherContent.push(`\n🌂未来${rainDayNum}天有雨, 记得带伞！`);
					rainDayNum = 0;
				}
				resolve(weatherContent.join('\n'))
			} else {
				reject(weatherRes.data.info)
			}
		} catch (error) {
			console.log('获取今日天气失败', error.message || error);
			reject(error.message || error)
		}
	})
}

//处理天气数据
module.exports = handleWeather = () => {
    return new Promise(async (resolve, reject) => {
        try {
			let weatherCityContent = []
			//获取当天是周几、此刻是上午OR下午
			let nowDate = new Date();
			let nowDay = nowDate.getDay();
            let nowHour = nowDate.getHours();
			let nowTime;
			if(nowHour < 11) {
				nowTime = "AM"; //小于就是AM
			} else if(nowHour <= 13) {
				nowTime = "MM"; //大于就是PM
			} else {
                nowTime = "PM"; //大于就是PM
            }
			const baseCityCodeArr = [];
			const allCityCodeArr = [];
            let weatherKey = weather.key;
			let weatherBaseDataArr = weather.base_data;
			let weatherAllDataArr = weather.all_data;
			//组装实况天气城市编码参数
		    for (let i = 0; i < weatherBaseDataArr.length; i++) {
				const weatherTimeArr = weatherBaseDataArr[i].time;
				for (let j = 0; j < weatherTimeArr.length; j++) {
					const weatherTime = weatherTimeArr[j];
					if(nowTime == weatherTime) {
						const weatherBaseDayArr = weatherBaseDataArr[i].day;
						for (let k = 0; k < weatherBaseDayArr.length; k++) {
							if (nowDay == weatherBaseDayArr[k]) {
								let weatherCityCode = weatherBaseDataArr[i].city_code;
								baseCityCodeArr.push(weatherCityCode);
							}
						}
					}
				}
		    }

			//组装未来天气城市编码参数
			for (let i = 0; i < weatherAllDataArr.length; i++) {
				const weatherTimeArr = weatherAllDataArr[i].time;
				for (let j = 0; j < weatherTimeArr.length; j++) {
					const weatherTime = weatherTimeArr[j];
					if(nowTime == weatherTime) {
						const weatherAllDayArr = weatherAllDataArr[i].day;
						for (let k = 0; k < weatherAllDayArr.length; k++) {
							if (nowDay == weatherAllDayArr[k]) {
								let weatherCityCode = weatherAllDataArr[i].city_code;
								allCityCodeArr.push(weatherCityCode);
							}
						}
					}
				}
			}

			//城市编码参数为空时，由IP地址获取
			if(baseCityCodeArr.length == 0&&allCityCodeArr.length == 0){
				//获取天气数据
				let IPAddress = await getPublicIPAddress()
				//let IPAddress = '112.10.223.108'
			    let weatherCityCode = await getWeatherCityCode(IPAddress)
				baseCityCodeArr.push(weatherCityCode);
			}

			//获取实况天气数据
			let baseAppend = false;
			if(baseCityCodeArr.length > 0){
				weatherCityContent.push(`🌍实时天气`);
				for (let i = 0; i < baseCityCodeArr.length; i++) {
					//获取天气数据
					let weatherCityCode = baseCityCodeArr[i]
					if(i+1 == baseCityCodeArr.length){
						baseAppend = true;
					}
					let cityContent = await getBaseWeather(weatherKey, weatherCityCode, baseAppend)
					weatherCityContent.push(cityContent);
				}
			}

			//获取未来天气数据
			let allAppend = false;
			if(allCityCodeArr.length > 0){
				weatherCityContent.push(`🌍天气预报`);
				for (let i = 0; i < allCityCodeArr.length; i++) {
					//获取天气数据
					let weatherCityCode = allCityCodeArr[i]
					if(i+1 == allCityCodeArr.length){
						allAppend = true;
					}
					let cityContent = await getAllWeather(weatherKey, weatherCityCode, allAppend)
					weatherCityContent.push(cityContent);
				}
			}

			if(baseCityCodeArr.length > 0||allCityCodeArr.length > 0) {
				if (nowDay != 6 && nowDay != 0) {
					if (nowTime == "AM") {
						weatherCityContent.push(`\n🕘9点上班，记得打卡!`)
					}

					if (nowTime == "PM") {
						weatherCityContent.push(`\n🕡18点30分下班，记得打卡!`)
					}
				}
			}

			resolve(weatherCityContent.join('\n'))
        } catch (error) {
            console.log('处理天气数据失败', error.message || error);
            reject(error.message || error)
        }
    })
}


//根据城市名获得城市代码
const getCityCode = (cityName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get(`https://geoapi.qweather.com/v2/city/lookup?location=${encodeURI(weather.city, 'gbk')}&key=${weather.key}`)
            // console.log('城市代码', res.data);
            if (res.data.code == 200) {
                resolve(res.data.weatherinfo[0].id)
            } else {
                reject(res.data)
            }
        } catch (error) {
            console.log('获取城市代码失败', error.message || error);
            reject(error.message || error)
        }
    })
}

//根据IP地址获得城市代码
const getWeatherCityCode = (IPAddress) => {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await axios.get(`https://restapi.amap.com/v3/ip?ip=${IPAddress}&key=${weather.key}`)
			// console.log('城市代码', res.data);
			if (res.status == 200) {
				resolve(res.data.adcode)
			} else {
				reject(res.data)
			}
		} catch (error) {
			console.log('获取城市代码失败', error.message || error);
			reject(error.message || error)
		}
	})
}

//获得天气数据
/*const getWeather = (cityName, index = 0) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cityId = await getCityCode(cityName)
            //多请求并行
            const weatherReq = axios(`https://devapi.qweather.com/v7/weather/3d?key=${weather.key}&location=${cityId}`)//这是三天的天气预报
            // const indicesReq = axios(`https://devapi.qweather.com/v7/indices/1d?key=${weather.key}&location=${cityId}&type=${'3'}`)//这是今天的天气指数
            const weatherRes = await weatherReq //三天天气
            // const indicesRes = await indicesReq//天气指数，暂时没发现有啥用

            if (weatherRes.data.code == 200) {// && indicesRes.data.code == 200
                let data = {
                    daily: weatherRes.data.daily[index],//index日天气
                    fxLink: weatherRes.data.fxLink,//天气网站
                }
                console.log('获取今日天气成功', data.fxLink);
                resolve(data)
            } else {
                reject(weatherRes.data)
            }

        } catch (error) {
            console.log('获取今日天气失败', error.message || error);
            reject(error.message || error)
        }
    })
}*/