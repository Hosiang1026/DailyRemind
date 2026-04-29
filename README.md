# DailyRemind 日常提醒

#### 订阅仓库

```
ql repo https://github.com/Hosiang1026/DailyRemind.git "_task.js" "app.js|sendNotify.js|qlApi.js|/functions/|ql.js" "functions|sendNotify.js|qlApi.js|ql_table_task.js" "master"
```

#### 配置文件

```sh
export SENTENCE='{"open":false}'
export AT_ALL='false'
export START='{"open":false,"content":""}'
export END='{"open":false,"content":"","time":""}'
export ROBOT_PUSH='{"open":false,"key":""}'
export LOTTERY='{"open":false,"SD":[],"KL8":[],"QLC":[],"SSQ":[]}'
export WEATHER='{"open":false,"key":"","base_data":[],"all_data":[],"clothes":[]}'
export DAILY='{"open":false,"marriage":[],"anniversary":[],"birthday":[],"legal":[],"sFtv":[],"lFtv":[],"term":[],"special":[],"internation":[],"license":[]}'
export GASOLINE='{"open":false,"province":[],"model":[],"oil_provinces":[]}'
export CLASS_TABLE='{"open":false,"graduate":"","homework":"","computer":[],"hr":[]}'
```

#### 任务列表

| 脚本名称 | 作用 | 执行规则 | 是否可用 |
| --- | --- | --- | --- |
| `ql_weather_task.js` | 实况天气 | `5 7 * * *` | 是 |
| `js/ql_next_weather_task.js` | 未来预报 | `12 7 * * *` | 是 |
| `js/ql_shenghuozs_task.js` | 生活指数 | `18 7 * * *` | 是 |
| `js/ql_daily_task.js` | 节日提醒 | `0 8 * * *` | 是 |
| `js/ql_gasoline_task.js` | 汽油价格 | `25 10 * * 0,6` | 是 |
| `js/ql_lottery_task.js` | 福利彩票 | `35 21 * * *` | 是 |
| `js/ql_table_task.js` | 网课提醒 | `40 7 * * 1-5` | 是 |
| `py/ql_gold_task.py` | 金银价格 | `11 8 * * *` | 是 |




