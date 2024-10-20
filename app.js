
const axios = require('axios')
axios.defaults.timeout = 40 * 1000

//处理要发送的天气内容
const handleWeatherContent = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let content = []
      const { start, weather, classTable, lottery, end} = require('./functions/input')

      //根据不同的配置，增加不同的内容
      //开头语模块
      if (start.open) {
        content.push(`${start.content}`)
      }

      //福利彩票模块
      // if (lottery.open) {
      //   const handleLottery = require('./functions/lottery')
      //   const lotteryContent = await handleLottery()
      //   if ('' != lotteryContent) {
      //     content.push(`\n\n${lotteryContent}`)
      //   }
      // }

      // 天气模块
      // if (weather.open) {
      //   const handleWeather = require('./functions/weather')
      //   const weatherContent = await handleWeather()
      //   if ('' != weatherContent) {
      //     content.push(`\n\n${weatherContent}`)
      //   }
      // }

      // 生活指数
      if (weather.open) {
        const handleShenghuoZS = require('./functions/shenghuozs')
        const shenghuozsContent = await handleShenghuoZS()
        if ('' != shenghuozsContent) {
          content.push(`\n\n${shenghuozsContent}`)
        }
      }

      //课表模块
      if (classTable.open) {
        const handleClassTable = require('./functions/classTable')
        const classTableContent = await handleClassTable()
        if ('' != classTableContent) {
          content.push(`\n\n${classTableContent}`)
        }
      }

      //结束模块
      if (end.open) {
        let date = new Date()
        let nowTime = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1):(date.getMonth() + 1)}-${(date.getDate()) < 10 ? '0' + (date.getDate()) : (date.getDate())} ${(date.getHours()) < 10 ? '0' + (date.getHours()) : (date.getHours())}:${(date.getMinutes()) < 10 ? '0' + (date.getMinutes()) : (date.getMinutes())}:${(date.getSeconds()) < 10 ? '0' + (date.getSeconds()) : (date.getSeconds())}`
        content.push(`\n\n${end.content}`)
        content.push(`\n${end.time} ${nowTime}`)
      }

      //如果啥都没输入的话
      if (content.length == 0) {
        content.push('请最少配置一个模块内容,没有内容无法推送')
      }
      resolve(content.join(''))//转字符串
    } catch (error) {
      console.log('处理内容失败', error.message || error);
      reject(error.message || error)
    }
  })
}

//处理要发送的新闻内容
const handleNewsContent = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let content = []
      const { start, news, sentence, daily, end} = require('./functions/input')

      //根据不同的配置，增加不同的内容
      //开头语模块
      if (start.open) {
        content.push(`${start.content}`)
      }

      //纪念日模块
      if (daily.open) {
        const handleTimeList = require('./functions/daily')
        const handleTimeContent = await handleTimeList()
        if (handleTimeContent.length > 0) {
          content.push(`\n\n${handleTimeContent}`)
        }
      }

      //彩虹屁
      if (sentence.open) {
        const res = await axios.get('https://api.shadiao.pro/chp')
        content.push(`\n\n💘${res.data.data.text}`)
      }

      // 新闻模块
      if (news.open) {
        const handleNews = require('./functions/news')
        const newsContent = await handleNews()
        if ('' != newsContent) {
          content.push(`\n\n${newsContent}`)
        }
      }

      //结束模块
      if (end.open) {
        let date = new Date()
        let nowTime = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1):(date.getMonth() + 1)}-${(date.getDate()) < 10 ? '0' + (date.getDate()) : (date.getDate())} ${(date.getHours()) < 10 ? '0' + (date.getHours()) : (date.getHours())}:${(date.getMinutes()) < 10 ? '0' + (date.getMinutes()) : (date.getMinutes())}:${(date.getSeconds()) < 10 ? '0' + (date.getSeconds()) : (date.getSeconds())}`
        content.push(`\n\n${end.content}`)
        content.push(`\n${end.time} ${nowTime}`)
      }
      //如果啥都没输入的话
      if (content.length == 0) {
        content.push('请最少配置一个模块内容,没有内容无法推送')
      }
      resolve(content.join(''))//转字符串
    } catch (error) {
      console.log('处理内容失败', error.message || error);
      reject(error.message || error)
    }
  })
}

//处理要发送的油价内容
const handleGasolineContent = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let content = []
      const { start, gasoline, end } = require('./functions/input')

      //根据不同的配置，增加不同的内容
      //开头语模块
      if (start.open) {
        content.push(`${start.content}`)
      }
      //汽油价格模块
      if (gasoline.open) {
        const handleGasoline = require('./functions/gasoline')
        const gasolineContent = await handleGasoline()
        if (gasolineContent.length > 0) {
          content.push(`\n\n${gasolineContent}`)
        }
      }
      //结束模块
      if (end.open) {
        let date = new Date()
        let nowTime = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1):(date.getMonth() + 1)}-${(date.getDate()) < 10 ? '0' + (date.getDate()) : (date.getDate())} ${(date.getHours()) < 10 ? '0' + (date.getHours()) : (date.getHours())}:${(date.getMinutes()) < 10 ? '0' + (date.getMinutes()) : (date.getMinutes())}:${(date.getSeconds()) < 10 ? '0' + (date.getSeconds()) : (date.getSeconds())}`
        content.push(`\n\n${end.content}`)
        content.push(`\n${end.time} ${nowTime}`)
      }
      //如果啥都没输入的话
      if (content.length == 0) {
        content.push('请最少配置一个模块内容,没有内容无法推送')
      }
      resolve(content.join(''))//转字符串
    } catch (error) {
      console.log('处理内容失败', error.message || error);
      reject(error.message || error)
    }
  })
}

const schedule = require('node-schedule');

//天气定时任务
const scheduleCronstyle = ()=>{
     //周一至周五执行执行的任务上午7:20/中午12:20/下午18:20触发
     schedule.scheduleJob('0 20 7,18 ? * MON-FRI',  async () => {
       const pushRes = await weatherPush()
       res.send(pushRes)
       console.log('weatherScheduleJob1 Success:' + new Date())
     })
     //周末执行执行的任务上午9:20/中午12:20/下午17:20触发
     schedule.scheduleJob('0 20 9,12,17 ? * SAT,SUN',  async () => {
       const pushRes = await weatherPush()
       res.send(pushRes)
     console.log('weatherScheduleJob2 Success:' + new Date())
    })
};
  scheduleCronstyle()  //  调用函数

module.exports = weatherPush = async (ctx) => {
  try {
    const content = await handleWeatherContent()
    const handleRobotPush = require('./functions/robotPush')
    const res = await handleRobotPush(content)
    return JSON.stringify({ success: true, data: res });
  } catch (error) {
    return JSON.stringify({ success: false, errMsg: error.message || error });
  }
};

//新闻定时任务: 周一至周五执行的任务上午7:10触发
schedule.scheduleJob('0 10 7 ? * MON-FRI',  async () => {
  const pushRes = await newsPush()
  res.send(pushRes)
  console.log('newsScheduleJob Success:' + new Date())
});

module.exports = newsPush = async (ctx) => {
  try {
    const content = await handleNewsContent()
    const handleRobotPush = require('./functions/robotPush')
    const res = await handleRobotPush(content)
    return JSON.stringify({ success: true, data: res });
  } catch (error) {
    return JSON.stringify({ success: false, errMsg: error.message || error });
  }
};

//油价定时任务: 周末执行的任务上午10:20触发
schedule.scheduleJob('0 20 10 ? * SAT,SUN',  async () => {
  const pushRes = await gasolinePush()
  res.send(pushRes)
  console.log('gasolineScheduleJob Success:' + new Date())
});

module.exports = gasolinePush = async (ctx) => {
  try {
    const content = await handleGasolineContent()
    const robot = require('./functions/robotPush')
    const res = await robot(content)
    return JSON.stringify({ success: true, data: res });
  } catch (error) {
    return JSON.stringify({ success: false, errMsg: error.message || error });
  }
};

//#region ——————本地测试部分
const express = require('express');
var childProcess = require('child_process');
const app = express();

// 启动 web 服务器
const hostname = getIPAddress()
const port = 8096

app.listen(port, hostname, function (err) {
  if (err) {
    console.error('启动服务器失败！')
  } else {
    console.log(`web server running at http://${hostname}:${port}`)
    // 浏览器打开
    childProcess.exec(`start http://${hostname}:${port}`)
  }
})

app.get('/', async (req, res) => {
  const pushRes = 'push推送服务 - 启动成功： http://192.168.1.2:8096 ';
  const appRes = await newsPush()
  //const appRes = await weatherPush()
  //const appRes = await gasolinePush()
  console.log(appRes);
  res.send(pushRes + appRes + " " + new Date())
})

// 获取内网ip地址
function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName]
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i]
      if (
          alias.family === 'IPv4' &&
          alias.address !== '127.0.0.1' &&
          !alias.internal
      ) {
        return alias.address
      }
    }
  }
}

//#endregion
