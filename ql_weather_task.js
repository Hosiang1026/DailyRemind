/*
天气预报任务:脚本更新地址 jd_fruit_task.js
*/

const axios = require('axios')
axios.defaults.timeout = 40 * 1000

const $ = new Env('天气预报任务');
let cookiesArr = [],
    cookie = '',
    jdFruitShareArr = [],
    isBox = false,
    notify, newShareCodes, allMessage = '';
//助力好友分享码(最多3个,否则后面的助力失败),原因:京东农场每人每天只有3次助力机会
//此此内容是IOS用户下载脚本到本地使用，填写互助码的地方，同一京东账号的好友互助码请使用@符号隔开。
//下面给出两个账号的填写示例（iOS只支持2个京东账号）
let shareCodes = [ // 这个列表填入你要助力的好友的shareCode
    //     //账号一的好友shareCode,不同好友的shareCode中间用@符号隔开
    //     '5853550f71014282912b76d95beb84c0@b58ddba3317b44ceb0ac86ea8952998c@8d724eb95e3847b6a1526587d1836f27@a80b7d1db41a4381b742232da9d22443@ce107b8f64d24f62a92292180f764018@c73ea563a77d4464b273503d3838fec1@0dd9a7fd1feb449fb1bf854a3ec0e801',
    //     //账号二的好友shareCode,不同好友的shareCode中间用@符号隔开
    //     '5853550f71014282912b76d95beb84c0@b58ddba3317b44ceb0ac86ea8952998c@8d724eb95e3847b6a1526587d1836f27@a80b7d1db41a4381b742232da9d22443@ce107b8f64d24f62a92292180f764018@c73ea563a77d4464b273503d3838fec1@0dd9a7fd1feb449fb1bf854a3ec0e801',
]
let message = '',
    subTitle = '',
    option = {},
    isFruitFinished = false;
const retainWater = $.isNode() ? (process.env.retainWater ? process.env.retainWater : 100) : ($.getdata('retainWater') ? $.getdata('retainWater') : 100); //保留水滴大于多少g,默认100g;
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
let jdFruitBeanCard = false; //农场使用水滴换豆卡(如果出现限时活动时100g水换20豆,此时比浇水划算,推荐换豆),true表示换豆(不浇水),false表示不换豆(继续浇水),脚本默认是浇水
let randomCount = $.isNode() ? 20 : 5;
const JD_API_HOST = 'https://api.m.jd.com/client.action';
const urlSchema = `openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/3KSjXqQabiTuD1cJ28QskrpWoBKT/index.html%22%20%7D`;
let lnrun = 0;

//处理要发送的天气内容
const handleWeatherContent = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let content = []
      const { start, weather, classTable, end} = require('./input')

      //根据不同的配置，增加不同的内容
      //开头语模块
      if (start.open) {
        content.push(`${start.content}`)
      }

      //课表模块
      if (classTable.open) {
        const handleClassTable = require('./functions/classTable')
        const classTableContent = await handleClassTable()
        if ('' != classTableContent) {
          content.push(`\n\n${classTableContent}`)
        }
      }

      // 天气模块
      if (weather.open) {
        const handleWeather = require('./functions/weather')
        const weatherContent = await handleWeather()
        if ('' != weatherContent) {
          content.push(`\n\n${weatherContent}`)
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

!(async() => {
     const content = await handleWeatherContent();
	  console.log('处理内容结果', content);
    if ($.isNode() && allMessage && $.ctrTemp) {
        await notify.sendNotify(`${$.name}`, `${allMessage}`)
    }
})()
.catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })
async function jdFruit() {
    subTitle = `【京东账号${$.index}】${$.nickName || $.UserName}`;
    try {
        await initForFarm();
        if ($.farmInfo.farmUserPro) {
                // option['media-url'] = $.farmInfo.farmUserPro.goodsImage;
            message = `【水果名称】${$.farmInfo.farmUserPro.name}\n`;
            //console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${$.farmInfo.farmUserPro.shareCode}\n`);
            console.log(`\n【已成功兑换水果】${$.farmInfo.farmUserPro.winTimes}次\n`);
            message += `【已兑换水果】${$.farmInfo.farmUserPro.winTimes}次\n`;
            //await masterHelpShare(); //助力好友
            if ($.farmInfo.treeState === 2 || $.farmInfo.treeState === 3) {
                option['open-url'] = urlSchema;
                $.msg($.name, ``, `【京东账号${$.index}】${$.nickName || $.UserName}\n【提醒⏰】${$.farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
                if ($.isNode()) {
                    await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}水果已可领取`, `【京东账号${$.index}】${$.nickName || $.UserName}\n【提醒⏰】${$.farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看`);
                }
                return
            } else if ($.farmInfo.treeState === 1) {
                console.log(`\n${$.farmInfo.farmUserPro.name}种植中...\n`)
            } else if ($.farmInfo.treeState === 0) {
                //已下单购买, 但未开始种植新的水果
                option['open-url'] = urlSchema;
                $.msg($.name, ``, `【京东账号${$.index}】 ${$.nickName || $.UserName}\n【提醒⏰】您忘了种植新的水果\n请去京东APP或微信小程序选购并种植新的水果\n点击弹窗即达`, option);
                if ($.isNode()) {
                    await notify.sendNotify(`${$.name} - 您忘了种植新的水果`, `京东账号${$.index} ${$.nickName || $.UserName}\n【提醒⏰】您忘了种植新的水果\n请去京东APP或微信小程序选购并种植新的水果`);
                }
                return
            }
            await doDailyTask();
            await doTenWater(); //浇水十次
            await getFirstWaterAward(); //领取首次浇水奖励
            await getTenWaterAward(); //领取10浇水奖励
            await getWaterFriendGotAward(); //领取为2好友浇水奖励
            await duck();
            if (!process.env.DO_TEN_WATER_AGAIN) {
                console.log('执行再次浇水')
                await doTenWaterAgain(); //再次浇水
            } else {
                console.log('不执行再次浇水，攒水滴')
            }
            await predictionFruit(); //预测水果成熟时间
        } else {
            console.log(`初始化农场数据异常, 请登录京东 app查看农场0元水果功能是否正常。`);
            if ($.retry < 2) {
                $.retry++
                    console.log(`等待3秒后重试,第:${$.retry}次`);
                await $.wait(3000);
                await jdFruit();
            }
        }
    } catch (e) {
        console.log(`任务执行异常，请检查执行日志 ‼️‼️`);
        $.logErr(e);
        // const errMsg = `京东账号${$.index} ${$.nickName || $.UserName}\n任务执行异常，请检查执行日志 ‼️‼️`;
        // if ($.isNode()) await notify.sendNotify(`${$.name}`, errMsg);
        // $.msg($.name, '', `${errMsg}`)
    }
    await showMsg();
}
async function doDailyTask() {
    await taskInitForFarm();
    console.log(`开始签到`);
    if (!$.farmTask.signInit.todaySigned) {
        await signForFarm(); //签到
        if ($.signResult.code === "0") {
            console.log(`【签到成功】获得${$.signResult.amount}g💧\\n`)
                //message += `【签到成功】获得${$.signResult.amount}g💧\n`//连续签到${signResult.signDay}天
        } else {
            // message += `签到失败,详询日志\n`;
            console.log(`签到结果:  ${JSON.stringify($.signResult)}`);
        }
    } else {
        console.log(`今天已签到,连续签到${$.farmTask.signInit.totalSigned},下次签到可得${$.farmTask.signInit.signEnergyEachAmount}g\n`);
    }
    // 被水滴砸中
    console.log(`被水滴砸中： ${$.farmInfo.todayGotWaterGoalTask.canPop ? '是' : '否'}`);
    if ($.farmInfo.todayGotWaterGoalTask.canPop) {
        await gotWaterGoalTaskForFarm();
        if ($.goalResult.code === '0') {
            console.log(`【被水滴砸中】获得${$.goalResult.addEnergy}g💧\\n`);
            // message += `【被水滴砸中】获得${$.goalResult.addEnergy}g💧\n`
        }
    }
    console.log(`签到结束,开始广告浏览任务`);
    if (!$.farmTask.gotBrowseTaskAdInit.f) {
        let adverts = $.farmTask.gotBrowseTaskAdInit.userBrowseTaskAds
        let browseReward = 0
        let browseSuccess = 0
        let browseFail = 0
        for (let advert of adverts) { //开始浏览广告
            if (advert.limit <= advert.hadFinishedTimes) {
                // browseReward+=advert.reward
                console.log(`${advert.mainTitle}+ ' 已完成`); //,获得${advert.reward}g
                continue;
            }
            console.log('正在进行广告浏览任务: ' + advert.mainTitle);
            await browseAdTaskForFarm(advert.advertId, 0);
            if ($.browseResult.code === '0') {
                console.log(`${advert.mainTitle}浏览任务完成`);
                //领取奖励
                await browseAdTaskForFarm(advert.advertId, 1);
                if ($.browseRwardResult.code === '0') {
                    console.log(`领取浏览${advert.mainTitle}广告奖励成功,获得${$.browseRwardResult.amount}g`)
                    browseReward += $.browseRwardResult.amount
                    browseSuccess++
                } else {
                    browseFail++
                    console.log(`领取浏览广告奖励结果:  ${JSON.stringify($.browseRwardResult)}`)
                }
            } else {
                browseFail++
                console.log(`广告浏览任务结果:   ${JSON.stringify($.browseResult)}`);
            }
        }
        if (browseFail > 0) {
            console.log(`【广告浏览】完成${browseSuccess}个,失败${browseFail},获得${browseReward}g💧\\n`);
            // message += `【广告浏览】完成${browseSuccess}个,失败${browseFail},获得${browseReward}g💧\n`;
        } else {
            console.log(`【广告浏览】完成${browseSuccess}个,获得${browseReward}g💧\n`);
            // message += `【广告浏览】完成${browseSuccess}个,获得${browseReward}g💧\n`;
        }
    } else {
        console.log(`今天已经做过浏览广告任务\n`);
    }
    //定时领水
    if (!$.farmTask.gotThreeMealInit.f) {
        //
        await gotThreeMealForFarm();
        if ($.threeMeal.code === "0") {
            console.log(`【定时领水】获得${$.threeMeal.amount}g💧\n`);
            // message += `【定时领水】获得${$.threeMeal.amount}g💧\n`;
        } else {
            // message += `【定时领水】失败,详询日志\n`;
            console.log(`定时领水成功结果:  ${JSON.stringify($.threeMeal)}`);
        }
    } else {
        console.log('当前不在定时领水时间断或者已经领过\n')
    }
    //给好友浇水
    if (!$.farmTask.waterFriendTaskInit.f) {
        if ($.farmTask.waterFriendTaskInit.waterFriendCountKey < $.farmTask.waterFriendTaskInit.waterFriendMax) {
            await doFriendsWater();
        }
    } else {
        console.log(`给${$.farmTask.waterFriendTaskInit.waterFriendMax}个好友浇水任务已完成\n`)
    }
    // await Promise.all([
    //   clockInIn(),//打卡领水
    //   executeWaterRains(),//水滴雨
    //   masterHelpShare(),//助力好友
    //   getExtraAward(),//领取额外水滴奖励
    //   turntableFarm()//天天抽奖得好礼
    // ])
    //await getAwardInviteFriend();
    await getTreasureBoxAwardTask(); //去首页逛逛“领京豆”
		await clockInIn(); //打卡领水
    await executeWaterRains(); //水滴雨
    await getExtraAward(); //领取额外水滴奖励
    await turntableFarm() //天天抽奖得好礼
}
async function getTreasureBoxAwardTask() {
  await taskInitForFarm();
  const treasureBox = $.farmTask['treasureBoxInit-getBean'];
  if (!treasureBox) {
    console.log(`此帐号不支持去首页逛逛“领京豆”任务`);
    return;
  }

  if (!treasureBox.f) {
    console.log(`正在进行任务：${treasureBox.taskMainTitle}`);
    await ddnc_getTreasureBoxAward(1);
    if ($.treasureResult.code == '0') {
      await beanTaskList();
      await $.wait(1000);
      await ddnc_getTreasureBoxAward(2);
      if ($.treasureRwardResult.code == '0') {
        console.log(`领取${treasureBox.taskMainTitle}奖励：${$.treasureRwardResult.waterGram}g水滴`);
      } else {
        console.log(`领取${treasureBox.taskMainTitle}奖励失败`);
      }
    }
  } else {
    console.log(`${treasureBox.taskMainTitle} 已完成`);
  }

}
async function predictionFruit() {
    console.log('开始预测水果成熟时间\n');
    await initForFarm();
    await taskInitForFarm();
    let waterEveryDayT = $.farmTask.totalWaterTaskInit.totalWaterTaskTimes; //今天到到目前为止，浇了多少次水
    message += `【今日共浇水】${waterEveryDayT}次\n`;
    message += `【剩余 水滴】${$.farmInfo.farmUserPro.totalEnergy}g💧\n`;
    message += `【水果🍉进度】${(($.farmInfo.farmUserPro.treeEnergy / $.farmInfo.farmUserPro.treeTotalEnergy) * 100).toFixed(2)}%，已浇水${$.farmInfo.farmUserPro.treeEnergy / 10}次,还需${($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy) / 10}次\n`
    if ($.farmInfo.toFlowTimes > ($.farmInfo.farmUserPro.treeEnergy / 10)) {
        message += `【开花进度】再浇水${$.farmInfo.toFlowTimes - $.farmInfo.farmUserPro.treeEnergy / 10}次开花\n`
    } else if ($.farmInfo.toFruitTimes > ($.farmInfo.farmUserPro.treeEnergy / 10)) {
        message += `【结果进度】再浇水${$.farmInfo.toFruitTimes - $.farmInfo.farmUserPro.treeEnergy / 10}次结果\n`
    }
    // 预测n天后水果课可兑换功能
    let waterTotalT = ($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy - $.farmInfo.farmUserPro.totalEnergy) / 10; //一共还需浇多少次水

    let waterD = Math.ceil(waterTotalT / waterEveryDayT);

    message += `【预测】${waterD === 1 ? '明天' : waterD === 2 ? '后天' : waterD + '天之后'}(${timeFormat(24 * 60 * 60 * 1000 * waterD + Date.now())}日)可兑换水果🍉`
}
//浇水十次
async function doTenWater() {
    jdFruitBeanCard = $.getdata('jdFruitBeanCard') ? $.getdata('jdFruitBeanCard') : jdFruitBeanCard;
    if ($.isNode() && process.env.FRUIT_BEAN_CARD) {
        jdFruitBeanCard = process.env.FRUIT_BEAN_CARD;
    }
    await myCardInfoForFarm();
    const { fastCard, doubleCard, beanCard, signCard } = $.myCardInfoRes;
    if (`${jdFruitBeanCard}` === 'true' && JSON.stringify($.myCardInfoRes).match(`限时翻倍`) && beanCard > 0) {
        console.log(`您设置的是使用水滴换豆卡，且背包有水滴换豆卡${beanCard}张, 跳过10次浇水任务`)
        return
    }
    if ($.farmTask.totalWaterTaskInit.totalWaterTaskTimes < $.farmTask.totalWaterTaskInit.totalWaterTaskLimit) {
        console.log(`\n准备浇水十次`);
        let waterCount = 0;
        isFruitFinished = false;
        for (; waterCount < $.farmTask.totalWaterTaskInit.totalWaterTaskLimit - $.farmTask.totalWaterTaskInit.totalWaterTaskTimes; waterCount++) {
            console.log(`第${waterCount + 1}次浇水`);
            await waterGoodForFarm();
			await $.wait(2000);
            console.log(`本次浇水结果:   ${JSON.stringify($.waterResult)}`);
            if ($.waterResult.code === '0') {
                console.log(`剩余水滴${$.waterResult.totalEnergy}g`);
                if ($.waterResult.finished) {
                    // 已证实，waterResult.finished为true，表示水果可以去领取兑换了
                    isFruitFinished = true;
                    break
                } else {
                    if ($.waterResult.totalEnergy < 10) {
                        console.log(`水滴不够，结束浇水`)
                        break
                    }
                    await gotStageAward(); //领取阶段性水滴奖励
                }
            } else {
                console.log('浇水出现失败异常,跳出不在继续浇水')
                break;
            }
        }
        if (isFruitFinished) {
            option['open-url'] = urlSchema;
            $.msg($.name, ``, `【京东账号${$.index}】${$.nickName || $.UserName}\n【提醒⏰】${$.farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
            $.done();
            if ($.isNode()) {
                await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}水果已可领取`, `京东账号${$.index} ${$.nickName || $.UserName}\n${$.farmInfo.farmUserPro.name}已可领取`);
            }
        }
    } else {
        console.log('\n今日已完成10次浇水任务\n');
    }
}
//领取首次浇水奖励
async function getFirstWaterAward() {
    await taskInitForFarm();
    //领取首次浇水奖励
    if (!$.farmTask.firstWaterInit.f && $.farmTask.firstWaterInit.totalWaterTimes > 0) {
        await firstWaterTaskForFarm();
        if ($.firstWaterReward.code === '0') {
            console.log(`【首次浇水奖励】获得${$.firstWaterReward.amount}g💧\n`);
            // message += `【首次浇水奖励】获得${$.firstWaterReward.amount}g💧\n`;
        } else {
            // message += '【首次浇水奖励】领取奖励失败,详询日志\n';
            console.log(`领取首次浇水奖励结果:  ${JSON.stringify($.firstWaterReward)}`);
        }
    } else {
        console.log('首次浇水奖励已领取\n')
    }
}
//领取十次浇水奖励
async function getTenWaterAward() {
    //领取10次浇水奖励
    if (!$.farmTask.totalWaterTaskInit.f && $.farmTask.totalWaterTaskInit.totalWaterTaskTimes >= $.farmTask.totalWaterTaskInit.totalWaterTaskLimit) {
        await totalWaterTaskForFarm();
        if ($.totalWaterReward.code === '0') {
            console.log(`【十次浇水奖励】获得${$.totalWaterReward.totalWaterTaskEnergy}g💧\n`);
            // message += `【十次浇水奖励】获得${$.totalWaterReward.totalWaterTaskEnergy}g💧\n`;
        } else {
            // message += '【十次浇水奖励】领取奖励失败,详询日志\n';
            console.log(`领取10次浇水奖励结果:  ${JSON.stringify($.totalWaterReward)}`);
        }
    } else if ($.farmTask.totalWaterTaskInit.totalWaterTaskTimes < $.farmTask.totalWaterTaskInit.totalWaterTaskLimit) {
        // message += `【十次浇水奖励】任务未完成，今日浇水${$.farmTask.totalWaterTaskInit.totalWaterTaskTimes}次\n`;
        console.log(`【十次浇水奖励】任务未完成，今日浇水${$.farmTask.totalWaterTaskInit.totalWaterTaskTimes}次\n`);
    }
    console.log('finished 水果任务完成!');
}
//再次浇水
async function doTenWaterAgain() {
    console.log('开始检查剩余水滴能否再次浇水再次浇水\n');
    await initForFarm();
    let totalEnergy = $.farmInfo.farmUserPro.totalEnergy;
    console.log(`剩余水滴${totalEnergy}g\n`);
    await myCardInfoForFarm();
    const { fastCard, doubleCard, beanCard, signCard } = $.myCardInfoRes;
    console.log(`背包已有道具:\n快速浇水卡:${fastCard === -1 ? '未解锁': fastCard + '张'}\n水滴翻倍卡:${doubleCard === -1 ? '未解锁': doubleCard + '张'}\n水滴换京豆卡:${beanCard === -1 ? '未解锁' : beanCard + '张'}\n加签卡:${signCard === -1 ? '未解锁' : signCard + '张'}\n`)
    if (totalEnergy >= 100 && doubleCard > 0) {
        //使用翻倍水滴卡
        for (let i = 0; i < new Array(doubleCard).fill('').length; i++) {
            await userMyCardForFarm('doubleCard');
            console.log(`使用翻倍水滴卡结果:${JSON.stringify($.userMyCardRes)}`);
        }
        await initForFarm();
        totalEnergy = $.farmInfo.farmUserPro.totalEnergy;
    }
    if (signCard > 0) {
        //使用加签卡
        for (let i = 0; i < new Array(signCard).fill('').length; i++) {
            await userMyCardForFarm('signCard');
            console.log(`使用加签卡结果:${JSON.stringify($.userMyCardRes)}`);
        }
        await initForFarm();
        totalEnergy = $.farmInfo.farmUserPro.totalEnergy;
    }
    jdFruitBeanCard = $.getdata('jdFruitBeanCard') ? $.getdata('jdFruitBeanCard') : jdFruitBeanCard;
    if ($.isNode() && process.env.FRUIT_BEAN_CARD) {
        jdFruitBeanCard = process.env.FRUIT_BEAN_CARD;
    }
    if (`${jdFruitBeanCard}` === 'true' && JSON.stringify($.myCardInfoRes).match('限时翻倍')) {
        console.log(`\n您设置的是水滴换豆功能,现在为您换豆`);
        if (totalEnergy >= 100 && $.myCardInfoRes.beanCard > 0) {
            //使用水滴换豆卡
            await userMyCardForFarm('beanCard');
            console.log(`使用水滴换豆卡结果:${JSON.stringify($.userMyCardRes)}`);
            if ($.userMyCardRes.code === '0') {
                message += `【水滴换豆卡】获得${$.userMyCardRes.beanCount}个京豆\n`;
                return
            }
        } else {
            console.log(`您目前水滴:${totalEnergy}g,水滴换豆卡${$.myCardInfoRes.beanCard}张,暂不满足水滴换豆的条件,为您继续浇水`)
        }
    }
    // if (totalEnergy > 100 && $.myCardInfoRes.fastCard > 0) {
    //   //使用快速浇水卡
    //   await userMyCardForFarm('fastCard');
    //   console.log(`使用快速浇水卡结果:${JSON.stringify($.userMyCardRes)}`);
    //   if ($.userMyCardRes.code === '0') {
    //     console.log(`已使用快速浇水卡浇水${$.userMyCardRes.waterEnergy}g`);
    //   }
    //   await initForFarm();
    //   totalEnergy  = $.farmInfo.farmUserPro.totalEnergy;
    // }
    // 所有的浇水(10次浇水)任务，获取水滴任务完成后，如果剩余水滴大于等于60g,则继续浇水(保留部分水滴是用于完成第二天的浇水10次的任务)
  if (totalEnergy < retainWater) {
    console.log('保留水滴不足,停止继续浇水')
    return
  }
    let overageEnergy = totalEnergy - retainWater;
  if (overageEnergy >= ($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy)) {
        //如果现有的水滴，大于水果可兑换所需的对滴(也就是把水滴浇完，水果就能兑换了)
        isFruitFinished = false;
        for (let i = 0; i < ($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy) / 10; i++) {
            await waterGoodForFarm();
            console.log(`本次浇水结果(水果马上就可兑换了):   ${JSON.stringify($.waterResult)}`);
            if ($.waterResult.code === '0') {
                console.log('\n浇水10g成功\n');
                if ($.waterResult.finished) {
                    // 已证实，waterResult.finished为true，表示水果可以去领取兑换了
                    isFruitFinished = true;
                    break
                } else {
                    console.log(`目前水滴【${$.waterResult.totalEnergy}】g,继续浇水，水果马上就可以兑换了`)
                }
            } else {
                console.log('浇水出现失败异常,跳出不在继续浇水')
                break;
            }
        }
        if (isFruitFinished) {
            option['open-url'] = urlSchema;
            $.msg($.name, ``, `【京东账号${$.index}】${$.nickName || $.UserName}\n【提醒⏰】${$.farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
            $.done();
            if ($.isNode()) {
                await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}水果已可领取`, `京东账号${$.index} ${$.nickName || $.UserName}\n${$.farmInfo.farmUserPro.name}已可领取`);
            }
        }
    } else if (overageEnergy >= 10) {
        console.log("目前剩余水滴：【" + totalEnergy + "】g，可继续浇水");
        isFruitFinished = false;
        for (let i = 0; i < parseInt(overageEnergy / 10); i++) {
            await waterGoodForFarm();
            console.log(`本次浇水结果:   ${JSON.stringify($.waterResult)}`);
            if ($.waterResult.code === '0') {
                console.log(`\n浇水10g成功,剩余${$.waterResult.totalEnergy}\n`)
                if ($.waterResult.finished) {
                    // 已证实，waterResult.finished为true，表示水果可以去领取兑换了
                    isFruitFinished = true;
                    break
                } else {
                    await gotStageAward()
                }
            } else {
                console.log('浇水出现失败异常,跳出不在继续浇水')
                break;
            }
        }
        if (isFruitFinished) {
            option['open-url'] = urlSchema;
            $.msg($.name, ``, `【京东账号${$.index}】${$.nickName || $.UserName}\n【提醒⏰】${$.farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
            $.done();
            if ($.isNode()) {
                await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}水果已可领取`, `京东账号${$.index} ${$.nickName || $.UserName}\n${$.farmInfo.farmUserPro.name}已可领取`);
            }
        }
    } else {
        console.log("目前剩余水滴：【" + totalEnergy + "】g,不再继续浇水,保留部分水滴用于完成第二天【十次浇水得水滴】任务")
    }
}
//领取阶段性水滴奖励
function gotStageAward() {
    return new Promise(async resolve => {
        if ($.waterResult.waterStatus === 0 && $.waterResult.treeEnergy === 10) {
            console.log('果树发芽了,奖励30g水滴');
            await gotStageAwardForFarm('1');
            console.log(`浇水阶段奖励1领取结果 ${JSON.stringify($.gotStageAwardForFarmRes)}`);
            if ($.gotStageAwardForFarmRes.code === '0') {
                // message += `【果树发芽了】奖励${$.gotStageAwardForFarmRes.addEnergy}\n`;
                console.log(`【果树发芽了】奖励${$.gotStageAwardForFarmRes.addEnergy}\n`);
            }
        } else if ($.waterResult.waterStatus === 1) {
            console.log('果树开花了,奖励40g水滴');
            await gotStageAwardForFarm('2');
            console.log(`浇水阶段奖励2领取结果 ${JSON.stringify($.gotStageAwardForFarmRes)}`);
            if ($.gotStageAwardForFarmRes.code === '0') {
                // message += `【果树开花了】奖励${$.gotStageAwardForFarmRes.addEnergy}g💧\n`;
                console.log(`【果树开花了】奖励${$.gotStageAwardForFarmRes.addEnergy}g💧\n`);
            }
        } else if ($.waterResult.waterStatus === 2) {
            console.log('果树长出小果子啦, 奖励50g水滴');
            await gotStageAwardForFarm('3');
            console.log(`浇水阶段奖励3领取结果 ${JSON.stringify($.gotStageAwardForFarmRes)}`)
            if ($.gotStageAwardForFarmRes.code === '0') {
                // message += `【果树结果了】奖励${$.gotStageAwardForFarmRes.addEnergy}g💧\n`;
                console.log(`【果树结果了】奖励${$.gotStageAwardForFarmRes.addEnergy}g💧\n`);
            }
        }
        resolve()
    })
}
//天天抽奖活动
async function turntableFarm() {
    await initForTurntableFarm();
    if ($.initForTurntableFarmRes.code === '0') {
        //领取定时奖励 //4小时一次
        let { timingIntervalHours, timingLastSysTime, sysTime, timingGotStatus, remainLotteryTimes, turntableInfos } = $.initForTurntableFarmRes;

        if (!timingGotStatus) {
            console.log(`是否到了领取免费赠送的抽奖机会----${sysTime > (timingLastSysTime + 60*60*timingIntervalHours*1000)}`)
            if (sysTime > (timingLastSysTime + 60 * 60 * timingIntervalHours * 1000)) {
                await timingAwardForTurntableFarm();
                console.log(`领取定时奖励结果${JSON.stringify($.timingAwardRes)}`);
                await initForTurntableFarm();
                remainLotteryTimes = $.initForTurntableFarmRes.remainLotteryTimes;
            } else {
                console.log(`免费赠送的抽奖机会未到时间`)
            }
        } else {
            console.log('4小时候免费赠送的抽奖机会已领取')
        }
        if ($.initForTurntableFarmRes.turntableBrowserAds && $.initForTurntableFarmRes.turntableBrowserAds.length > 0) {
            for (let index = 0; index < $.initForTurntableFarmRes.turntableBrowserAds.length; index++) {
                if (!$.initForTurntableFarmRes.turntableBrowserAds[index].status) {
                    console.log(`开始浏览天天抽奖的第${index + 1}个逛会场任务`)
                    await browserForTurntableFarm(1, $.initForTurntableFarmRes.turntableBrowserAds[index].adId);
                    if ($.browserForTurntableFarmRes.code === '0' && $.browserForTurntableFarmRes.status) {
                        console.log(`第${index + 1}个逛会场任务完成，开始领取水滴奖励\n`)
                        await browserForTurntableFarm(2, $.initForTurntableFarmRes.turntableBrowserAds[index].adId);
                        if ($.browserForTurntableFarmRes.code === '0') {
                            console.log(`第${index + 1}个逛会场任务领取水滴奖励完成\n`)
                            await initForTurntableFarm();
                            remainLotteryTimes = $.initForTurntableFarmRes.remainLotteryTimes;
                        }
                    }
                } else {
                    console.log(`浏览天天抽奖的第${index + 1}个逛会场任务已完成`)
                }
            }
        }
        console.log(`---天天抽奖次数----${remainLotteryTimes}次`)
            //抽奖
        if (remainLotteryTimes > 0) {
            console.log('开始抽奖')
            let lotteryResult = '';
            for (let i = 0; i < new Array(remainLotteryTimes).fill('').length; i++) {
                await lotteryForTurntableFarm()
                console.log(`第${i + 1}次抽奖结果${JSON.stringify($.lotteryRes)}`);
                if ($.lotteryRes.code === '0') {
                    turntableInfos.map((item) => {
                            if (item.type === $.lotteryRes.type) {
                                console.log(`lotteryRes.type${$.lotteryRes.type}`);
                                if ($.lotteryRes.type.match(/bean/g) && $.lotteryRes.type.match(/bean/g)[0] === 'bean') {
                                    lotteryResult += `${item.name}个，`;
                                } else if ($.lotteryRes.type.match(/water/g) && $.lotteryRes.type.match(/water/g)[0] === 'water') {
                                    lotteryResult += `${item.name}，`;
                                } else {
                                    lotteryResult += `${item.name}，`;
                                }
                            }
                        })
                        //没有次数了
                    if ($.lotteryRes.remainLotteryTimes === 0) {
                        break
                    }
                }
            }
            if (lotteryResult) {
                console.log(`【天天抽奖】${lotteryResult.substr(0, lotteryResult.length - 1)}\n`)
                    // message += `【天天抽奖】${lotteryResult.substr(0, lotteryResult.length - 1)}\n`;
            }
        } else {
            console.log('天天抽奖--抽奖机会为0次')
        }
    } else {
        console.log('初始化天天抽奖得好礼失败')
    }
}
//领取额外奖励水滴
async function getExtraAward() {
  await farmAssistInit();
  if ($.farmAssistResult.code === "0") {
    if ($.farmAssistResult.assistFriendList && $.farmAssistResult.assistFriendList.length >= 2) {
      if ($.farmAssistResult.status === 2) {
        let num = 0;
        for (let key of Object.keys($.farmAssistResult.assistStageList)) {
          let vo = $.farmAssistResult.assistStageList[key]
          if (vo.stageStaus === 2) {
            await receiveStageEnergy()
            if ($.receiveStageEnergy.code === "0") {
              console.log(`已成功领取第${key + 1}阶段好友助力奖励：【${$.receiveStageEnergy.amount}】g水`)
              num += $.receiveStageEnergy.amount
            }
          }
        }
        message += `【额外奖励】${num}g水领取成功\n`;
      } else if ($.farmAssistResult.status === 3) {
        console.log("已经领取过8好友助力额外奖励");
        message += `【额外奖励】已被领取过\n`;
      }
    } else {
      console.log("助力好友未达到2个");
      message += `【额外奖励】领取失败,原因：给您助力的人未达2个\n`;
    }
    if ($.farmAssistResult.assistFriendList && $.farmAssistResult.assistFriendList.length > 0) {
      let str = '';
      $.farmAssistResult.assistFriendList.map((item, index) => {
        if (index === ($.farmAssistResult.assistFriendList.length - 1)) {
          str += item.nickName || "匿名用户";
        } else {
          str += (item.nickName || "匿名用户") + ',';
        }
        let date = new Date(item.time);
        let time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getMinutes();
        console.log(`\n京东昵称【${item.nickName || "匿名用户"}】 在 ${time} 给您助过力\n`);
      })
      message += `【助力您的好友】${str}\n`;
    }
    console.log('领取额外奖励水滴结束\n');
  } else {
    await masterHelpTaskInitForFarm();
    if ($.masterHelpResult.code === '0') {
      if ($.masterHelpResult.masterHelpPeoples && $.masterHelpResult.masterHelpPeoples.length >= 5) {
        // 已有五人助力。领取助力后的奖励
        if (!$.masterHelpResult.masterGotFinal) {
          await masterGotFinishedTaskForFarm();
          if ($.masterGotFinished.code === '0') {
            console.log(`已成功领取好友助力奖励：【${$.masterGotFinished.amount}】g水`);
            message += `【额外奖励】${$.masterGotFinished.amount}g水领取成功\n`;
          }
        } else {
          console.log("已经领取过5好友助力额外奖励");
          message += `【额外奖励】已被领取过\n`;
        }
      } else {
        console.log("助力好友未达到5个");
        message += `【额外奖励】领取失败,原因：给您助力的人未达5个\n`;
        }
        if ($.masterHelpResult.masterHelpPeoples && $.masterHelpResult.masterHelpPeoples.length > 0) {
            let str = '';
            $.masterHelpResult.masterHelpPeoples.map((item, index) => {
                if (index === ($.masterHelpResult.masterHelpPeoples.length - 1)) {
                    str += item.nickName || "匿名用户";
                } else {
                    str += (item.nickName || "匿名用户") + ',';
                }
                let date = new Date(item.time);
                let time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getMinutes();
                console.log(`\n京东昵称【${item.nickName || "匿名用户"}】 在 ${time} 给您助过力\n`);
            })
            message += `【助力您的好友】${str}\n`;
        }
        console.log('领取额外奖励水滴结束\n');
    }
  }
}

//水滴雨
async function executeWaterRains() {
    let executeWaterRain = !$.farmTask.waterRainInit.f;
    if (executeWaterRain) {
        console.log(`水滴雨任务，每天两次，最多可得10g水滴`);
        console.log(`两次水滴雨任务是否全部完成：${$.farmTask.waterRainInit.f ? '是' : '否'}`);
        if ($.farmTask.waterRainInit.lastTime) {
            if (Date.now() < ($.farmTask.waterRainInit.lastTime + 3 * 60 * 60 * 1000)) {
                executeWaterRain = false;
                // message += `【第${$.farmTask.waterRainInit.winTimes + 1}次水滴雨】未到时间，请${new Date($.farmTask.waterRainInit.lastTime + 3 * 60 * 60 * 1000).toLocaleTimeString()}再试\n`;
                console.log(`【第${$.farmTask.waterRainInit.winTimes + 1}次水滴雨】未到时间，请${new Date($.farmTask.waterRainInit.lastTime + 3 * 60 * 60 * 1000).toLocaleTimeString()}再试\n`);
            }
        }
        if (executeWaterRain) {
            console.log(`开始水滴雨任务,这是第${$.farmTask.waterRainInit.winTimes + 1}次，剩余${2 - ($.farmTask.waterRainInit.winTimes + 1)}次`);
            await waterRainForFarm();
            console.log('水滴雨waterRain');
            if ($.waterRain.code === '0') {
                console.log('水滴雨任务执行成功，获得水滴：' + $.waterRain.addEnergy + 'g');
                console.log(`【第${$.farmTask.waterRainInit.winTimes + 1}次水滴雨】获得${$.waterRain.addEnergy}g水滴\n`);
                // message += `【第${$.farmTask.waterRainInit.winTimes + 1}次水滴雨】获得${$.waterRain.addEnergy}g水滴\n`;
            }
        }
    } else {
        // message += `【水滴雨】已全部完成，获得20g💧\n`;
    }
}
//打卡领水活动
async function clockInIn() {
    console.log('开始打卡领水活动（签到，关注，领券）');
    await clockInInitForFarm();
    if ($.clockInInit.code === '0') {
        // 签到得水滴
        if (!$.clockInInit.todaySigned) {
            console.log('开始今日签到');
            await clockInForFarm();
            console.log(`打卡结果${JSON.stringify($.clockInForFarmRes)}`);
            if ($.clockInForFarmRes.code === '0') {
                // message += `【第${$.clockInForFarmRes.signDay}天签到】获得${$.clockInForFarmRes.amount}g💧\n`;
                console.log(`【第${$.clockInForFarmRes.signDay}天签到】获得${$.clockInForFarmRes.amount}g💧\n`)
                if ($.clockInForFarmRes.signDay === 7) {
                    //可以领取惊喜礼包
                    console.log('开始领取--惊喜礼包38g水滴');
                    await gotClockInGift();
                    if ($.gotClockInGiftRes.code === '0') {
                        // message += `【惊喜礼包】获得${$.gotClockInGiftRes.amount}g💧\n`;
                        console.log(`【惊喜礼包】获得${$.gotClockInGiftRes.amount}g💧\n`);
                    }
                }
            }
        }
        if ($.clockInInit.todaySigned && $.clockInInit.totalSigned === 7) {
            console.log('开始领取--惊喜礼包38g水滴');
            await gotClockInGift();
            if ($.gotClockInGiftRes.code === '0') {
                // message += `【惊喜礼包】获得${$.gotClockInGiftRes.amount}g💧\n`;
                console.log(`【惊喜礼包】获得${$.gotClockInGiftRes.amount}g💧\n`);
            }
        }
        // 限时关注得水滴
        if ($.clockInInit.themes && $.clockInInit.themes.length > 0) {
            for (let item of $.clockInInit.themes) {
                if (!item.hadGot) {
                    console.log(`关注ID${item.id}`);
                    await clockInFollowForFarm(item.id, "theme", "1");
                    console.log(`themeStep1--结果${JSON.stringify($.themeStep1)}`);
                    if ($.themeStep1.code === '0') {
                        await clockInFollowForFarm(item.id, "theme", "2");
                        console.log(`themeStep2--结果${JSON.stringify($.themeStep2)}`);
                        if ($.themeStep2.code === '0') {
                            console.log(`关注${item.name}，获得水滴${$.themeStep2.amount}g`);
                        }
                    }
                }
            }
        }
        // 限时领券得水滴
        if ($.clockInInit.venderCoupons && $.clockInInit.venderCoupons.length > 0) {
            for (let item of $.clockInInit.venderCoupons) {
                if (!item.hadGot) {
                    console.log(`领券的ID${item.id}`);
                    await clockInFollowForFarm(item.id, "venderCoupon", "1");
                    console.log(`venderCouponStep1--结果${JSON.stringify($.venderCouponStep1)}`);
                    if ($.venderCouponStep1.code === '0') {
                        await clockInFollowForFarm(item.id, "venderCoupon", "2");
                        if ($.venderCouponStep2.code === '0') {
                            console.log(`venderCouponStep2--结果${JSON.stringify($.venderCouponStep2)}`);
                            console.log(`从${item.name}领券，获得水滴${$.venderCouponStep2.amount}g`);
                        }
                    }
                }
            }
        }
    }
    console.log('开始打卡领水活动（签到，关注，领券）结束\n');
}

//给好友浇水
async function doFriendsWater() {
    await friendListInitForFarm();
    console.log('开始给好友浇水...');
    await taskInitForFarm();
    const { waterFriendCountKey, waterFriendMax } = $.farmTask.waterFriendTaskInit;
    console.log(`今日已给${waterFriendCountKey}个好友浇水`);
    if (waterFriendCountKey < waterFriendMax) {
        let needWaterFriends = [];
        if ($.friendList.friends && $.friendList.friends.length > 0) {
            $.friendList.friends.map((item, index) => {
                if (item.friendState === 1) {
                    if (needWaterFriends.length < (waterFriendMax - waterFriendCountKey)) {
                        needWaterFriends.push(item.shareCode);
                    }
                }
            });
            console.log(`需要浇水的好友列表shareCodes:${JSON.stringify(needWaterFriends)}`);
            let waterFriendsCount = 0,
                cardInfoStr = '';
            for (let index = 0; index < needWaterFriends.length; index++) {
                await waterFriendForFarm(needWaterFriends[index]);
                console.log(`为第${index+1}个好友浇水结果:${JSON.stringify($.waterFriendForFarmRes)}\n`)
                if ($.waterFriendForFarmRes.code === '0') {
                    waterFriendsCount++;
                    if ($.waterFriendForFarmRes.cardInfo) {
                        console.log('为好友浇水获得道具了');
                        if ($.waterFriendForFarmRes.cardInfo.type === 'beanCard') {
                            console.log(`获取道具卡:${$.waterFriendForFarmRes.cardInfo.rule}`);
                            cardInfoStr += `水滴换豆卡,`;
                        } else if ($.waterFriendForFarmRes.cardInfo.type === 'fastCard') {
                            console.log(`获取道具卡:${$.waterFriendForFarmRes.cardInfo.rule}`);
                            cardInfoStr += `快速浇水卡,`;
                        } else if ($.waterFriendForFarmRes.cardInfo.type === 'doubleCard') {
                            console.log(`获取道具卡:${$.waterFriendForFarmRes.cardInfo.rule}`);
                            cardInfoStr += `水滴翻倍卡,`;
                        } else if ($.waterFriendForFarmRes.cardInfo.type === 'signCard') {
                            console.log(`获取道具卡:${$.waterFriendForFarmRes.cardInfo.rule}`);
                            cardInfoStr += `加签卡,`;
                        }
                    }
                } else if ($.waterFriendForFarmRes.code === '11') {
                    console.log('水滴不够,跳出浇水')
                }
            }
            // message += `【好友浇水】已给${waterFriendsCount}个好友浇水,消耗${waterFriendsCount * 10}g水\n`;
            console.log(`【好友浇水】已给${waterFriendsCount}个好友浇水,消耗${waterFriendsCount * 10}g水\n`);
            if (cardInfoStr && cardInfoStr.length > 0) {
                // message += `【好友浇水奖励】${cardInfoStr.substr(0, cardInfoStr.length - 1)}\n`;
                console.log(`【好友浇水奖励】${cardInfoStr.substr(0, cardInfoStr.length - 1)}\n`);
            }
        } else {
            console.log('您的好友列表暂无好友,快去邀请您的好友吧!')
        }
    } else {
        console.log(`今日已为好友浇水量已达${waterFriendMax}个`)
    }
}
//领取给3个好友浇水后的奖励水滴
async function getWaterFriendGotAward() {
    await taskInitForFarm();
    const { waterFriendCountKey, waterFriendMax, waterFriendSendWater, waterFriendGotAward } = $.farmTask.waterFriendTaskInit
    if (waterFriendCountKey >= waterFriendMax) {
        if (!waterFriendGotAward) {
            await waterFriendGotAwardForFarm();
            console.log(`领取给${waterFriendMax}个好友浇水后的奖励水滴::${JSON.stringify($.waterFriendGotAwardRes)}`)
            if ($.waterFriendGotAwardRes.code === '0') {
                // message += `【给${waterFriendMax}好友浇水】奖励${$.waterFriendGotAwardRes.addWater}g水滴\n`;
                console.log(`【给${waterFriendMax}好友浇水】奖励${$.waterFriendGotAwardRes.addWater}g水滴\n`);
            }
        } else {
            console.log(`给好友浇水的${waterFriendSendWater}g水滴奖励已领取\n`);
            // message += `【给${waterFriendMax}好友浇水】奖励${waterFriendSendWater}g水滴已领取\n`;
        }
    } else {
        console.log(`暂未给${waterFriendMax}个好友浇水\n`);
    }
}

async function duck() {
    for (let i = 0; i < 10; i++) {
        //这里循环十次
        await getFullCollectionReward();
        if ($.duckRes.code === '0') {
            if (!$.duckRes.hasLimit) {
                console.log(`小鸭子游戏:${$.duckRes.title}`);
                // if ($.duckRes.type !== 3) {
                //   console.log(`${$.duckRes.title}`);
                //   if ($.duckRes.type === 1) {
                //     message += `【小鸭子】为你带回了水滴\n`;
                //   } else if ($.duckRes.type === 2) {
                //     message += `【小鸭子】为你带回快速浇水卡\n`
                //   }
                // }
            } else {
                console.log(`${$.duckRes.title}`)
                break;
            }
        } else if ($.duckRes.code === '10') {
            console.log(`小鸭子游戏达到上限`)
            break;
        }
    }
}
async function collect() {
    try {
        await initForFarm();
        if ($.farmInfo.farmUserPro) {
            console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${$.farmInfo.farmUserPro.shareCode}\n`);
            jdFruitShareArr.push($.farmInfo.farmUserPro.shareCode)
        } else {
            //console.log(`初始化农场数据异常, 请登录京东 app查看农场0元水果功能是否正常。`);
        }
    } catch (e) {
        $.logErr(e);
    }
}
// ========================API调用接口========================
//鸭子，点我有惊喜
async function getFullCollectionReward() {
    return new Promise(resolve => {
        const body = { "type": 2, "version": 6, "channel": 2 };
        $.post(taskUrl("getFullCollectionReward", body), (err, resp, data) => {
            try {
                if (err) {
                    console.log('\n东东农场: API查询请求失败 ‼️‼️');
                    console.log(JSON.stringify(err));
                    $.logErr(err);
                } else {
                    if (safeGet(data)) {
                        $.duckRes = JSON.parse(data);
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function beanTaskList() {
  return new Promise(resolve => {
    const options = {
      "url": "https://api.m.jd.com/client.action?functionId=beanTaskList",
      "body": "body=%7B%22viewChannel%22%3A%22AppHome%22%7D&build=167853&client=apple&clientVersion=10.2.0&d_brand=apple&d_model=iPhone11%2C8&ef=1&eid=eidIf12a8121eas2urxgGc%2BzS5%2BUYGu1Nbed7bq8YY%2BgPd0Q0t%2BiviZdQsxnK/HTA7AxZzZBrtu1ulwEviYSV3QUuw2XHHC%2BPFHdNYx1A/3Zt8xYR%2Bd3&ep=%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22screen%22%3A%22ENS4AtO3EJS%3D%22%2C%22osVersion%22%3A%22CJGkDy4n%22%2C%22openudid%22%3A%22ENq3CzTwENGmYtc3ENSnYtC0DWTwCNdwZNcnZtYmEWU2ZwYnCwY0Cm%3D%3D%22%2C%22area%22%3A%22CJvpCJYmCV81CNS1EP82Ctq1EK%3D%3D%22%2C%22uuid%22%3A%22aQf1ZRdxb2r4ovZ1EJZhcxYlVNZSZz09%22%7D%2C%22ts%22%3A1637625634%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D&ext=%7B%22prstate%22%3A%220%22%7D&isBackground=N&joycious=117&lang=zh_CN&networkType=4g&networklibtype=JDNetworkBaseAF&partner=apple&rfs=0000&scope=11&sign=778b3d3d83e0d3f45508a958f306abda&st=1637627411874&sv=101&uemps=0-0&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJ1DpIH6AlcMry0eQsMwEN/GgP2FpcEJvoNVODK8ho6G6xfFEYSmOOdwauVOUqIQFPdxhcdWdM05U%2BMN5h6umteQ78SpJGXOymjKiTiGjvSOiTpoqO8k%2BT6stsfe0WS9QQ41HfWeVF6cdpDTzsmufz0XDdJ6CcltPUazK5UqRSuo0UyDMBmw/oWg%3D%3D",
      "headers": {
        "Cookie": cookie,
        "Host": "api.m.jd.com",
        "Accept": "*/*",
        "Connection": "keep-alive",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Accept-Language": "zh-Hans-CN;q=1,en-CN;q=0.9",
        "Accept-Encoding": "gzip,deflate,br",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} beanTaskList API请求失败，请检查网路重试`)
        } else {
          // console.log('data-----beanTaskList', data)
          data = $.toObj(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
/**
 * 领取10次浇水奖励API
 */
async function totalWaterTaskForFarm() {
    const functionId = arguments.callee.name.toString();
    $.totalWaterReward = await request(functionId);
}
//领取首次浇水奖励API
async function firstWaterTaskForFarm() {
    const functionId = arguments.callee.name.toString();
    $.firstWaterReward = await request(functionId);
}
//领取给3个好友浇水后的奖励水滴API
async function waterFriendGotAwardForFarm() {
    const functionId = arguments.callee.name.toString();
    $.waterFriendGotAwardRes = await request(functionId, { "version": 4, "channel": 1 });
}
// 查询背包道具卡API
async function myCardInfoForFarm() {
    const functionId = arguments.callee.name.toString();
    $.myCardInfoRes = await request(functionId, { "version": 5, "channel": 1 });
}
//使用道具卡API
async function userMyCardForFarm(cardType) {
    const functionId = arguments.callee.name.toString();
    $.userMyCardRes = await request(functionId, { "cardType": cardType });
}
/**
 * 领取浇水过程中的阶段性奖励
 * @param type
 * @returns {Promise<void>}
 */
async function gotStageAwardForFarm(type) {
    $.gotStageAwardForFarmRes = await request(arguments.callee.name.toString(), { 'type': type });
}
//浇水API
async function waterGoodForFarm() {
    await $.wait(3000);
    console.log('等待了3秒');

    const functionId = arguments.callee.name.toString();
    $.waterResult = await request(functionId);
}
// 初始化集卡抽奖活动数据API
async function initForTurntableFarm() {
    $.initForTurntableFarmRes = await request(arguments.callee.name.toString(), { version: 4, channel: 1 });
}
async function lotteryForTurntableFarm() {
    await $.wait(2000);
    console.log('等待了2秒');
    $.lotteryRes = await request(arguments.callee.name.toString(), { type: 1, version: 4, channel: 1 });
}

async function timingAwardForTurntableFarm() {
    $.timingAwardRes = await request(arguments.callee.name.toString(), { version: 4, channel: 1 });
}

async function browserForTurntableFarm(type, adId) {
    if (type === 1) {
        console.log('浏览爆品会场');
    }
    if (type === 2) {
        console.log('天天抽奖浏览任务领取水滴');
    }
    const body = { "type": type, "adId": adId, "version": 4, "channel": 1 };
    $.browserForTurntableFarmRes = await request(arguments.callee.name.toString(), body);
    // 浏览爆品会场8秒
}
//天天抽奖浏览任务领取水滴API
async function browserForTurntableFarm2(type) {
    const body = { "type": 2, "adId": type, "version": 4, "channel": 1 };
    $.browserForTurntableFarm2Res = await request('browserForTurntableFarm', body);
}
/**
 * 天天抽奖拿好礼-助力API(每人每天三次助力机会)
 */
async function lotteryMasterHelp() {
    $.lotteryMasterHelpRes = await request(`initForFarm`, {
        imageUrl: "",
        nickName: "",
        shareCode: arguments[0] + '-3',
        babelChannel: "3",
        version: 4,
        channel: 1
    });
}

//领取5人助力后的额外奖励API
async function masterGotFinishedTaskForFarm() {
    const functionId = arguments.callee.name.toString();
    $.masterGotFinished = await request(functionId);
}
//助力好友信息API
async function masterHelpTaskInitForFarm() {
    const functionId = arguments.callee.name.toString();
    $.masterHelpResult = await request(functionId);
}
//新版助力好友信息API
async function farmAssistInit() {
  const functionId = arguments.callee.name.toString();
  $.farmAssistResult = await request(functionId, {"version":14,"channel":1,"babelChannel":"120"});
}
//新版领取助力奖励API
async function receiveStageEnergy() {
  const functionId = arguments.callee.name.toString();
  $.receiveStageEnergy = await request(functionId, {"version":14,"channel":1,"babelChannel":"120"});
}
//接受对方邀请,成为对方好友的API
async function inviteFriend() {
    $.inviteFriendRes = await request(`initForFarm`, {
        imageUrl: "",
        nickName: "",
        shareCode: arguments[0] + '-inviteFriend',
        version: 4,
        channel: 2
    });
}
// 助力好友API
async function masterHelp() {
    $.helpResult = await request(`initForFarm`, {
        imageUrl: "",
        nickName: "",
        shareCode: arguments[0],
        babelChannel: "3",
        version: 2,
        channel: 1
    });
}
/**
 * 水滴雨API
 */
async function waterRainForFarm() {
    const functionId = arguments.callee.name.toString();
    const body = { "type": 1, "hongBaoTimes": 100, "version": 3 };
    $.waterRain = await request(functionId, body);
}
/**
 * 打卡领水API
 */
async function clockInInitForFarm() {
    const functionId = arguments.callee.name.toString();
    $.clockInInit = await request(functionId);
}

// 连续签到API
async function clockInForFarm() {
    const functionId = arguments.callee.name.toString();
    $.clockInForFarmRes = await request(functionId, { "type": 1 });
}

//关注，领券等API
async function clockInFollowForFarm(id, type, step) {
    const functionId = arguments.callee.name.toString();
    let body = {
        id,
        type,
        step
    }
    if (type === 'theme') {
        if (step === '1') {
            $.themeStep1 = await request(functionId, body);
        } else if (step === '2') {
            $.themeStep2 = await request(functionId, body);
        }
    } else if (type === 'venderCoupon') {
        if (step === '1') {
            $.venderCouponStep1 = await request(functionId, body);
        } else if (step === '2') {
            $.venderCouponStep2 = await request(functionId, body);
        }
    }
}

// 领取连续签到7天的惊喜礼包API
async function gotClockInGift() {
    $.gotClockInGiftRes = await request('clockInForFarm', { "type": 2 })
}

//定时领水API
async function gotThreeMealForFarm() {
    const functionId = arguments.callee.name.toString();
    $.threeMeal = await request(functionId);
}
/**
 * 浏览广告任务API
 * type为0时, 完成浏览任务
 * type为1时, 领取浏览任务奖励
 */
async function browseAdTaskForFarm(advertId, type) {
  const functionId = arguments.callee.name.toString();
  if (type === 0) {
    $.browseResult = await request(functionId, {advertId, type});
  } else if (type === 1) {
    $.browseRwardResult = await request(functionId, {advertId, type});
  }
}

/**
 * 去首页逛逛“领京豆”API
 * type为1时, 完成任务
 * type为2时, 领取任务奖励
 */
 async function ddnc_getTreasureBoxAward(type) {
  const functionId = arguments.callee.name.toString();
  const body = {"type":type,"babelChannel":"45","line":"getBean","version":18,"channel":1};
  if (type === 1) {
    $.treasureResult = await request(functionId, body);
  } else if (type === 2) {
    $.treasureRwardResult = await request(functionId, body);
  }
}
// 被水滴砸中API
async function gotWaterGoalTaskForFarm() {
    $.goalResult = await request(arguments.callee.name.toString(), { type: 3 });
}
//签到API
async function signForFarm() {
    const functionId = arguments.callee.name.toString();
    $.signResult = await request(functionId);
}
/**
 * 初始化农场, 可获取果树及用户信息API
 */
async function initForFarm() {
  const functionId = arguments.callee.name.toString();
  $.farmInfo = await request(functionId, {"babelChannel":"121","sid":"3c52b5f17ab2a42398939a27887eaf8w","version":18,"channel":1});
  // return new Promise(resolve => {
  //   const option =  {
  //     url: `${JD_API_HOST}?functionId=initForFarm`,
  //     body: `body=${escape(JSON.stringify({"version":4}))}&appid=wh5&clientVersion=9.1.0`,
  //     headers: {
  //       "accept": "*/*",
  //       "accept-encoding": "gzip, deflate, br",
  //       "accept-language": "zh-CN,zh;q=0.9",
  //       "cache-control": "no-cache",
  //       "cookie": cookie,
  //       "origin": "https://home.m.jd.com",
  //       "pragma": "no-cache",
  //       "referer": "https://home.m.jd.com/myJd/newhome.action",
  //       "sec-fetch-dest": "empty",
  //       "sec-fetch-mode": "cors",
  //       "sec-fetch-site": "same-site",
  //       "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
  //       "Content-Type": "application/x-www-form-urlencoded"
  //     },
  //     timeout: 10000,
  //   };
  //   $.post(option, (err, resp, data) => {
  //     try {
  //       if (err) {
  //         console.log('\n东东农场: API查询请求失败 ‼️‼️');
  //         console.log(JSON.stringify(err));
  //         $.logErr(err);
  //       } else {
  //         if (safeGet(data)) {
  //           $.farmInfo = JSON.parse(data)
  //         }
  //       }
  //     } catch (e) {
  //       $.logErr(e, resp)
  //     } finally {
  //       resolve();
  //     }
  //   })
  // })
}

// 初始化任务列表API
async function taskInitForFarm() {
  console.log('\n初始化任务列表')
  const functionId = arguments.callee.name.toString();
  $.farmTask = await request(functionId, {"version":18,"channel":1,"babelChannel":"121"});
}
//获取好友列表API
async function friendListInitForFarm() {
  $.friendList = await request('friendListInitForFarm', {"version": 18,"channel": 1,"babelChannel":"45"});
  // console.log('aa', aa);
}
// 领取邀请好友的奖励API
async function awardInviteFriendForFarm() {
  $.awardInviteFriendRes = await request('awardInviteFriendForFarm');
}
//为好友浇水API
async function waterFriendForFarm(shareCode) {
  const body = {"shareCode": shareCode, "version": 18, "channel": 1, "babelChannel":"121"};
  $.waterFriendForFarmRes = await request('waterFriendForFarm', body);
}
async function showMsg() {
    if ($.isNode() && process.env.FRUIT_NOTIFY_CONTROL) {
        $.ctrTemp = `${process.env.FRUIT_NOTIFY_CONTROL}` === 'false';
    } else if ($.getdata('jdFruitNotify')) {
        $.ctrTemp = $.getdata('jdFruitNotify') === 'false';
    } else {
        $.ctrTemp = `${jdNotify}` === 'false';
    }
    if ($.ctrTemp) {
        $.msg($.name, subTitle, message, option);
        if ($.isNode()) {
            allMessage += `${subTitle}\n${message}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
            // await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}`, `${subTitle}\n${message}`);
        }
    } else {
        $.log(`\n${message}\n`);
    }
}

function timeFormat(time) {
    let date;
    if (time) {
        date = new Date(time)
    } else {
        date = new Date();
    }
    return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}
function requireConfig() {
  return new Promise(resolve => {
    console.log('开始获取配置文件\n')
    notify = $.isNode() ? require('./sendNotify') : '';
    //Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';   
    //IOS等用户直接用NobyDa的jd cookie
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item])
        }
      })
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => { };
    } else {
      cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
    }
    console.log(`共${cookiesArr.length}个京东账号\n`)
    $.shareCodesArr = [];
    resolve()
  })
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if (data['retcode'] === 0 && data.base && data.base.nickname) {
                            $.nickName = data.base.nickname;
                        }
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e)
            } finally {
                resolve();
            }
        })
    })
}

function request(function_id, body = {}, timeout = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            $.get(taskUrl(function_id, body), (err, resp, data) => {
                try {
                    if (err) {
                        console.log('\n东东农场: API查询请求失败 ‼️‼️')
                        console.log(JSON.stringify(err));
                        console.log(`function_id:${function_id}`)
                        $.logErr(err);
                    } else {
                        if (safeGet(data)) {
                            data = JSON.parse(data);
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve(data);
                }
            })
        }, timeout)
    })
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${encodeURIComponent(JSON.stringify(body))}&appid=wh5`,
    headers: {
      "Host": "api.m.jd.com",
      "Accept": "*/*",
      "Origin": "https://carry.m.jd.com",
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent": $.UA,
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "Referer": "https://carry.m.jd.com/",
      "Cookie": cookie
    },
    timeout: 10000
  }
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
// prettier-ignore
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }