var email = "";

function hexToBase64(str) {
    return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

(() => {
    // ユーザープールの設定
    const poolData = {
        UserPoolId: "ap-northeast-1_bX1jgrpZQ",
        ClientId: "63ubgk2st9c0r6m7h49hb77q2c"
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser(); // 現在のユーザー

    const currentUserData = {}; // ユーザーの属性情報

    // Amazon Cognito 認証情報プロバイダーを初期化します
    AWS.config.region = "ap-northeast-1"; // リージョン
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: "ap-northeast-1:1d64aa86-ba4d-4ce0-9b8d-a8977e8bc43e"
    });

    // 現在のユーザーの属性情報を取得・表示する
    // 現在のユーザー情報が取得できているか？
    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.log(err);
                location.href = "signin.html";
            } else {
                // ユーザの属性を取得
                cognitoUser.getUserAttributes((err, result) => {
                    if (err) {
                        location.href = "signin.html";
                    }

                    // 取得した属性情報を連想配列に格納
                    for (i = 0; i < result.length; i++) {
                        currentUserData[result[i].getName()] = result[i].getValue();
                    }
                    document.getElementById("name").innerHTML =currentUserData["name"];
                    //document.getElementById("role").innerHTML ="Your Role is " + currentUserData["custom:custom:role"];
                    //document.getElementById("email").innerHTML ="Your E-Mail is " + currentUserData["email"];

                    // サインアウト処理
                    const signoutButton = document.getElementById("signout");
                    signoutButton.addEventListener("click", event => {
                        cognitoUser.signOut();
                        location.reload();
                    });
                    signoutButton.hidden = false;
                    email = currentUserData["email"];
                    console.log(currentUserData);

                    //現在位置の取得
                    // Geolocation APIに対応している
                    if (navigator.geolocation) {
                        // 現在地を取得
                        navigator.geolocation.getCurrentPosition(
                            // [第1引数] 取得に成功した場合の関数
                            function (position) {
                                // 取得したデータの整理
                                var data = position.coords;
                                // データの整理
                                var lat = data.latitude; //緯度
                                var lng = data.longitude;　//軽度
                                var formData = new FormData();
                                formData.append("lat", lat);
                                formData.append("lng", lng);
                                console.log(email);
                                console.log(currentUserData["email"],lat,lng);
                                var hash = CybozuLabs.MD5.calc(email);
                                formData.append("hash", hash);

                                $.ajax("https://cb4rvlwdl3.execute-api.ap-northeast-1.amazonaws.com/default/savepicture", {
                                    type: 'post',
                                    processData: false,
                                    contentType: false,
                                    data: formData,
                                    success: console.log("success!")
                                }).done(function (response) {
                                    let jsonbody = JSON.parse(response.body);
                                    console.log(jsonbody);
                                    const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
                                        const byteCharacters = atob(b64Data);
                                        const byteArrays = [];

                                        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                                            const slice = byteCharacters.slice(offset, offset + sliceSize);

                                            const byteNumbers = new Array(slice.length);
                                            for (let i = 0; i < slice.length; i++) {
                                                byteNumbers[i] = slice.charCodeAt(i);
                                            }

                                            const byteArray = new Uint8Array(byteNumbers);
                                            byteArrays.Push(byteArray);
                                        }

                                        const blob = new Blob(byteArrays, {type: contentType});
                                        return blob;
                                    }
                                    count = 0;
                                    for (var k in jsonbody) {
                                        console.log("項目："+k);
                                        var d = jsonbody[k];

                                        $("#"+count+"0").attr('src',d["tops"]);
                                        $("#"+count+"1").attr('src',d["bottoms"]);
                                        $("#"+count+"2").attr('src',d["shoes"]);
                                        $("#"+count+"i").attr('src',"http://openweathermap.org/img/w/"+d["icon"]+".png");
                                        $("#tmp"+count).html(parseInt(d["tmp"], 10)+"°C");
                                        $("#wea"+count).html(d["weather"]);
                                        $("#view_time"+count).html(d["day"]);
                                        $("#city").html(d["city"]);

                                        count++;
                                    }



                                }).fail(function () {
                                    console.log('error!'); // エラーが発生したとき
                                });
                            },

                            // [第2引数] 取得に失敗した場合の関数
                            function (error) {

                                // エラー番号に対応したメッセージ
                                var errorInfo = [
                                    "原因不明のエラーが発生しました…。",
                                    "位置情報の取得が許可されませんでした…。",
                                    "電波状況などで位置情報が取得できませんでした…。",
                                    "位置情報の取得に時間がかかり過ぎてタイムアウトしました…。"
                                ];

                                // エラー番号
                                var errorNo = error.code;

                                // エラーメッセージ
                                var errorMessage = "[エラー番号: " + errorNo + "]\n" + errorInfo[errorNo];

                                // アラート表示
                                alert(errorMessage);
                            },
                            // [第3引数] オプション
                            {
                                "enableHighAccuracy": false,
                                "timeout": 8000,
                                "maximumAge": 2000,
                            }
                        );
                    } else {
                        // 現在位置を取得できない場合の処理
                        alert("あなたの端末では、現在位置を取得できません。");
                    }
                });
            }

        });

    } else {
        location.href = "signin.html";
    }
})();

