# DailyRemind 日常提醒

#### 订阅仓库

```
ql repo https://github.com/Hosiang1026/DailyRemind.git "task/" "app.js|ql_table_task.js|ql_huzhou_water_task.js" "functions/|db/|utils/|sh/|node_modules/" "master"
```

#### 安装依赖

```
cd /ql/data/repo/Hosiang1026_DailyRemind_master && npm install&&pip install -r py/requirements.txt
```

注： 配置文件，参考/sh/exports.sh


#### 任务列表

| 脚本名称 | 作用 | 执行规则 | 是否可用 |
| --- | --- | --- | --- |
| `task/ql_weather_task.js` | 实况天气 | `5 7 * * *` | 是 |
| `task/ql_next_weather_task.js` | 未来预报 | `12 7 * * *` | 是 |
| `task/ql_shenghuozs_task.js` | 生活指数 | `18 7 * * *` | 是 |
| `task/ql_daily_task.js` | 节日提醒 | `0 8 * * *` | 是 |
| `task/ql_state_grid_task.js` | 国家电网 | `30 8 * * *` | 是 |
| `task/ql_gasoline_task.js` | 汽油价格 | `25 6 * * *` | 是 |
| `task/ql_lottery_task.js` | 福利彩票 | `35 21 * * *` | 是 |
| `task/ql_table_task.js` | 网课提醒 | `40 7 * * 1-5` | 是 |
| `task/ql_gold_task.js` | 金银价格 | `11 10 * * *` | 是 |
| `task/ql_telecom_task.js` | 电信套餐 | `0 20 * * *` | 是 |

