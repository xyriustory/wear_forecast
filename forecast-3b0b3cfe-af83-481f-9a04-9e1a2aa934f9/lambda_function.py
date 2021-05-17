import json
import boto3
import urllib.parse
import base64
from datetime import datetime
import re
import requests
import json
from logging import getLogger, INFO
from pytz import timezone
import traceback

import math
import random

logger = getLogger(__name__)
logger.setLevel(INFO)

REKOGNITION = boto3.client('rekognition')
REGION = "ap-northeast-1"

def lambda_handler(event, context):
    data = event['body-json']
    
    values = data.split('\r\n')#必要な部分だけをsplitで切り取る

    lat = values[3]
    lng = values[7]
    hash = values[11]
    
    API_KEY = "bb5e36ae6e1dbcafd217d7f0411b2523"

    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lng}&units=metric&appid={API_KEY}"
    
    response = requests.get(url)
    forecastData = json.loads(response.text)
    if not ('list' in forecastData):
        print('error')
        return
    
    #画像データjson読み出し
    try:
        s3 = boto3.resource('s3')
        content_object = s3.Object('group8test', hash+"/data.json")
        file_content = content_object.get()['Body'].read().decode('utf-8')
        data = json.loads(file_content)
    except:
        print(traceback.format_exc())
        print("can't find json file.")
        data = {}
    
    city = forecastData["city"]["name"]
    
    wetherdata = []
    for item in forecastData['list']:
        dateinfo = timezone(
            'Asia/Tokyo').localize(datetime.fromtimestamp(item['dt']))
        time = dateinfo.strftime('%-H')
        date = dateinfo.strftime('%-m/%-d')
        
        if time == "9":
            weather = item['weather'][0]['main']
            weatherDescription = item['weather'][0]['description']
            icon = item['weather'][0]['icon']
            temperature = item['main']['temp']
            rainfall = 0
            if 'rain' in item and '3h' in item['rain']:
                rainfall = item['rain']['3h']
            wetherdata.append([date,weather,temperature,rainfall,icon,city])
        
    # result
    result = make_forecast(data,wetherdata)

    return_dict = {}
    for count,x in enumerate(result):
        tops = get_img_from_s3(x[0],data,hash)
        bottoms = get_img_from_s3(x[1],data,hash)
        shoes = get_img_from_s3(x[2],data,hash)
        return_dict[count] = {"tops":tops,"bottoms":bottoms,"shoes":shoes,"day":wetherdata[count][0],"icon":wetherdata[count][4],"tmp":wetherdata[count][2],"weather":wetherdata[count][1],"city":wetherdata[count][5]}
        print(return_dict[count])
    text = json.dumps(return_dict)
    logger.info(text)

    #戻り値
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin' : '*' ,
        'Content-Type' :'application/json'},
        'body': text
    }
    
def get_img_from_s3(num,data,hash):
    return "https://group8test.s3-ap-northeast-1.amazonaws.com/"+hash+"/"+data[num]["name"]


def make_forecast(jsn, weather):
    weather_level = []
    weather_cond = []
    for i in range(len(weather)):
        lev = math.floor(int(weather[i][2]) / 6)
        if lev <= 0:
            lev = 1;
        elif lev >= 6:
            lev = 5;
        weather_level.append(str(lev))
    for i in range(len(weather)):
        if weather[i][1] == "Clear" or weather[i][1] == "Clouds":
            weather_cond.append("0")
        else:
            weather_cond.append("1")

    tops_item = []
    bottoms_item = []
    shoes_item = []

    for key in jsn:
        if jsn[key]["type"] == "トップス":
            tops_item.append(key)
        elif jsn[key]["type"] == "ボトムス":
            bottoms_item.append(key)
        else:
            shoes_item.append(key)

    tops_level_items = [[] for i in range(5)]


    bottoms_level_items = [[] for i in range(5)]

    shoes_level_items = [[] for i in range(2)]

    for key in tops_item:
        index = int(jsn[key]["level"]) - 1
        tops_level_items[index].append(key)

    for key in bottoms_item:
        index = int(jsn[key]["level"]) - 1
        bottoms_level_items[index].append(key)

    for key in shoes_item:
        index = int(jsn[key]["level"])

        shoes_level_items[index].append(key)

    result = [[] for i in range(5)]
    result_prev = []

    for i in range(len(weather)):
        result[i].append(random.choice(tops_level_items[int(weather_level[i]) - 1]))
        result[i].append(random.choice(bottoms_level_items[int(weather_level[i]) - 1]))

        result[i].append(random.choice(shoes_level_items[int(weather_cond[i])]))
        tops_level_items[int(weather_level[i]) - 1].remove(result[i][0])
        bottoms_level_items[int(weather_level[i]) - 1].remove(result[i][1])
        if i >= 1:
            tops_level_items[int(weather_level[i - 1]) - 1].append(result_prev[0])
            bottoms_level_items[int(weather_level[i - 1]) - 1].append(result_prev[1])
        result_prev = result[i]

    return result