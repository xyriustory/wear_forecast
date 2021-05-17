import json
import boto3
import urllib.parse
import base64
from datetime import datetime, timezone
import re
import traceback

REKOGNITION = boto3.client('rekognition')
REGION = "ap-northeast-1"

def lambda_handler(event, context):
    #画像保存場所の設定
    s3 = boto3.resource('s3')
    bucket = s3.Bucket('group8test')

    # バイナリがBase64にエンコードされているので、ここでデコード
    imageBody = base64.b64decode(event['body-json'])
    images = imageBody.split(b'\r\n',4)#必要な部分だけをsplitで切り取る
    
    getdata = re.findall(r'name=\"(.+?)/(\d+)\-(\d)\"', images[1].decode())[0]
    hash = getdata[0]
    count = getdata[1]
    lev = getdata[2]
    ext = re.findall(r'/(.+)', images[2].decode())[0]
    print(hash,count,lev,ext)
    
    key = f"{hash}/{count}.{ext}"
    
    bucket.put_object(
        Body = images[4],
        Key = key
    )
    
    #画像処理をかけてレスポンスを受け取る
    results = detect_labels('group8test',key)["Labels"]
    
    labels = [x["Name"] for x in results]
    
    print(labels)
    data = {}
    
    if "Pants" in labels:
        label = "ボトムス"
    elif "Shoe" in labels or "Shoes" in labels:
        label = "シューズ"
    else:
        label = "トップス"
    try: 
        content_object = s3.Object('group8test', hash+"/data.json")
        file_content = content_object.get()['Body'].read().decode('utf-8')
        data = json.loads(file_content)
    except:
        print(traceback.format_exc())
        print("can't find json file.")
    
    data[count] = {"name":f"{count}.{ext}","type":label,"level":lev}
    body = json.dumps(data).encode('utf-8')
    print(data)
    
    if lev != "6":
        object = boto3.resource('s3').Object("group8test", hash+"/data.json")
        #ファイルの書き出し
        object.put(Body=body)
    
    if lev == "6":
        s3.Object('group8test', key).delete()
    
    #画像名を Web側で取得するための戻り値
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin' : '*' ,
        'Content-Type' :'application/json'},
        'body': '{"message":"'+ label + '"}'
    }

#ラベルの取得
def detect_labels(b,i):
    client=boto3.client('rekognition',REGION)
    response = client.detect_labels(Image={'S3Object':{'Bucket':b,'Name':i}})
    return response