# -*- coding: UTF-8 -*-
# Version: v1.1
# Created by howe on 2022/05/08
# Crontab：8 8 * * *

import os
import re
import sys
import requests
from bs4 import BeautifulSoup

'''
v1.1更新记录：
1、新增脚本自动更新
'''

# 更新检测
def checkUpdate():
    print("当前运行的脚本版本：" + str(version))
    try:
        r1 = requests.get("https://gitee.com/hosiang1026/DailyRemind/raw/master/ql_gold_task.py").text
        r2 = re.findall(re.compile("version = \d.\d"), r1)[0].split("=")[1].strip()
        if float(r2) > version:
            print("发现新版本：" + r2)
            print("正在自动更新脚本...")
            os.system("ql raw https://gitee.com/hosiang1026/DailyRemind/raw/master/ql_gold_task.py &")
    except:
        pass

    #今日金价

    #国内价格
    #白银：5.834元/克
    #黄金：468.31元/克

    #国际价格
    #白银：23.06美元/盎司
    #黄金：1925.70美元/盎司
    #铂金：934.570美元/盎司
    #钯金：1244.650美元/盎司

    #金店金价
    #谢瑞麟：608元/克
    #金至尊：608元/克
    #潮宏基：608元/克
    #菜百首饰：608元/克

    #周大福：608元/克
    #周六福：608元/克
    #周生生：608元/克
    #老凤祥：608元/克
    #六福珠宝：608元/克
    #老庙黄金：608元/克
    #中国黄金：608元/克

# 获取黄金价格
def getGold():
    try:
        _content = ""
        domestic_content = "🏅国内价格\n"
        international_content = "🏅国际价格\n"
        bdurl = "http://www.huangjinjiage.cn"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62'}

        r = requests.get(bdurl, headers=headers)
        r.encoding = r.apparent_encoding
        soup = BeautifulSoup(r.text, 'html.parser')

        #国内银价
        tr_tag = soup.find('tr', id='jiage5')
        domestic_silver = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1].strip()

        #国内金价
        tr_tag = soup.find('tr', class_='bg', id='jiage4')
        domestic_gold = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1].strip()

        domestic_content = domestic_content + "白银：" + domestic_silver + "元/克\n";
        domestic_content = domestic_content + "黄金：" + domestic_gold + "元/克\n\n";

        #国际银价
        tr_tag = soup.find('tr', class_='bg', id='jiage3')
        international_silver = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1].strip()

        #国际金价
        # 定位到<tr>标签
        tr_tag = soup.find('tr', class_='bg', id='jiage1')
        # 提取<tr>标签下的所有<td>标签的文本内容
        international_gold = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1].strip()

        international_content = international_content + "白银：" + international_silver + "美元/盎司\n";
        international_content = international_content + "黄金：" + international_gold + "美元/盎司\n\n";

        _content = _content + domestic_content + international_content;

        return _content

    except Exception as e:
        return e

# 推送
def load_send():
    global send
    cur_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(cur_path)
    sendNotifPath = cur_path + "/sendNotify.py"
    if not os.path.exists(sendNotifPath):
        res = requests.get("https://gitee.com/lstcml/qinglongscripts/raw/master/sendNotify.py")
        with open(sendNotifPath, "wb") as f:
            f.write(res.content)

    try:
        from sendNotify import send
        return True
    except:
        print("加载通知服务失败！")
        return False


if __name__ == '__main__':
    version = 1.1
    title = '今日金价'
    checkUpdate()
    if load_send():
        newcontent = getGold()
        if newcontent != '':
            print('获取黄金价格成功！\n'+ newcontent)
            send("今日金价", newcontent)
        else:
            print('获取黄金价格失败！')
