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
          document.getElementById("name").innerHTML = "Welcome！" + currentUserData["name"];
          document.getElementById("email").innerHTML = "Your E-Mail is " + currentUserData["email"];

          // サインアウト処理
          const signoutButton = document.getElementById("signout");
          signoutButton.addEventListener("click", event => {
            cognitoUser.signOut();
            location.reload();
          });
          signoutButton.hidden = false;
          console.log(currentUserData);
        });
      }
    });
  } else {
    location.href = "signin.html";
  }
})();