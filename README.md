# DailyRemind 日常提醒库

#### ql repo命令拉取脚本

```
ql repo https://github.com/Hosiang1026/DailyRemind.git "_task.js" "app.js|sendNotify.js|qlApi.js|/functions/|ql.js" "functions|sendNotify.js|qlApi.js|ql_table_task.js" "master"
```

#### 依赖库

```
https://github.com/Hosiang1026/DailyRemindScripts.git
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




