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

# 获取黄金价格
def getGold():
    try:
        _content = "👑今日金价\n\n"
        domestic_content = "🏅国内价格\n"
        international_content = "🏅国际价格\n"
        store_content = "🏅金店价格\n"
        conver_content = "⚖金价换算\n"
        bdurl = "http://www.huangjinjiage.cn"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62'}

        r = requests.get(bdurl, headers=headers)
        r.encoding = r.apparent_encoding
        soup = BeautifulSoup(r.text, 'html.parser')

        #国内银价
        tr_tag = soup.find('tr', id='jiage5')
        domestic_silver = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1]

        #国内金价
        tr_tag = soup.find('tr', class_='bg', id='jiage4')
        domestic_gold = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1]

        domestic_content = domestic_content + "· 白银：" + domestic_silver + "元/克\n";
        domestic_content = domestic_content + "· 黄金：" + domestic_gold + "元/克\n\n";

        #国际银价
        tr_tag = soup.find('tr', class_='bg', id='jiage3')
        international_silver = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1]

        #国际金价
        # 定位到<tr>标签
        tr_tag = soup.find('tr', class_='bg', id='jiage1')
        # 提取<tr>标签下的所有<td>标签的文本内容
        international_gold = [td.get_text(strip=True) for td in tr_tag.find_all('td')][1]

        international_content = international_content + "· 白银：" + international_silver + "美元/盎司\n";
        international_content = international_content + "· 黄金：" + international_gold + "美元/盎司\n\n";

        #金店 - 周大福
        zhoudafu_brand = soup.select('.tabtitle')[11].text.replace("内地", "")
        zhoudafu_gold = soup.select('.tabtitle')[11].find_next('td').text

        #金店 - 周六福
        zhouliufu_brand = soup.select('.tabtitle')[21].text
        zhouliufu_gold = soup.select('.tabtitle')[21].find_next('td').text

        #金店 - 周生生
        zhoushengsheng_brand = soup.select('.tabtitle')[12].text.replace("内地", "")
        zhoushengsheng_gold = soup.select('.tabtitle')[12].find_next('td').text

        #金店 - 老凤祥
        laofengxiang_brand = soup.select('.tabtitle')[19].text
        laofengxiang_gold = soup.select('.tabtitle')[19].find_next('td').text

        #金店 - 六福珠宝
        lfzb_brand = soup.select('.tabtitle')[13].text.replace("内地", "")
        lfzb_gold = soup.select('.tabtitle')[13].find_next('td').text

        #金店 - 老庙黄金
        lmhj_brand = soup.select('.tabtitle')[18].text
        lmhj_gold = soup.select('.tabtitle')[18].find_next('td').text

        #金店 - 中国黄金
        zghj_brand = soup.select('.tabtitle')[20].text
        zghj_gold = soup.select('.tabtitle')[20].find_next('td').text

        store_content = store_content + "· " + zhoudafu_brand + "：" + zhoudafu_gold + "元/克\n";
        store_content = store_content + "· " + zhouliufu_brand + "：" + zhouliufu_gold + "元/克\n";
        store_content = store_content + "· " + zhoushengsheng_brand + "：" + zhoushengsheng_gold + "元/克\n";
        store_content = store_content + "· " + laofengxiang_brand + "：" + laofengxiang_gold + "元/克\n";
        store_content = store_content + "· " + lfzb_brand + "：" + lfzb_gold + "元/克\n";
        store_content = store_content + "· " + lmhj_brand + "：" + lmhj_gold + "元/克\n";
        store_content = store_content + "· " + zghj_brand + "：" + zghj_gold + "元/克\n\n";

        #金价换算
        usdcny_url = "https://www.exchange-rates.org/zh/converter/usd-cny"
        usdcny_r = requests.get(usdcny_url, headers=headers)
        usdcny_r.encoding = usdcny_r.apparent_encoding
        usdcny_soup = BeautifulSoup(usdcny_r.text, 'html.parser')
        usdcny_price = usdcny_soup.select('.rate-to')[0].text.replace("CNY", "").strip()
        conver_gold = float(international_gold) / 31.1035 * float(usdcny_price);
        difference_gold = float(domestic_gold) - conver_gold;

        conver_content = conver_content + "· 国际换算：" + str(round(conver_gold, 2)) + "元/克\n";
        conver_content = conver_content + "· 1克差价：" + str(round(difference_gold, 2)) + "元\n";
        conver_content = conver_content + "· 50克价格：" + str(round(float(domestic_gold) * 50, 2)) + "元\n";
        conver_content = conver_content + "· 金衡盎司：" + "1盎司 = 31.1035克\n";
        conver_content = conver_content + "· 兑换汇率：" + "1美元 ≈ " + usdcny_price +"人民币\n\n";

        #拼接所有价格信息
        _content = _content + domestic_content + international_content + store_content + conver_content;

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
    title = '大家好😻'
    checkUpdate()
    if load_send():
        newcontent = getGold()
        if newcontent != '':
            print('获取黄金价格成功！\n'+ newcontent)
            send(title, newcontent)
        else:
            print('获取黄金价格失败！')
