(() => {
  // ユーザープールの設定
  const poolData = {
    UserPoolId: "ap-northeast-1_bX1jgrpZQ",
    ClientId: "63ubgk2st9c0r6m7h49hb77q2c"
  };
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  const cognitoUser = userPool.getCurrentUser(); // 現在のユーザー

  // Amazon Cognito 認証情報プロバイダーを初期化します
  AWS.config.region = "ap-northeast-1"; // リージョン
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "ap-northeast-1:1d64aa86-ba4d-4ce0-9b8d-a8977e8bc43e"
  });
  
  // 現在のユーザーの属性情報を取得・表示する
  // 現在のユーザー情報が取得できているか？
  if (cognitoUser != null) {
    location.href = "index.html";
  }

  /**
   * サインイン処理
   */
  document.getElementById("signinButton").addEventListener("click", () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 何か1つでも未入力の項目がある場合、メッセージを表示して処理を中断
    const message = document.getElementById('message-span');
    if (!email | !password) {
      message.innerHTML = "All fields are required.";
      return false;
    }

    // 認証データの作成
    const authenticationData = {
      Username: email,
      Password: password
    };
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
      authenticationData
    );

    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    // 認証処理
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => {
        const idToken = result.getIdToken().getJwtToken(); // IDトークン
        const accessToken = result.getAccessToken().getJwtToken(); // アクセストークン
        const refreshToken = result.getRefreshToken().getToken(); // 更新トークン

        console.log("idToken : " + idToken);
        console.log("accessToken : " + accessToken);
        console.log("refreshToken : " + refreshToken);

        // サインイン成功の場合、次の画面へ遷移
        location.href = "index.html";
      },

      onFailure: err => {
        // サインイン失敗の場合、エラーメッセージを画面に表示
        console.log(err);
        message.innerHTML = err.message;
      }
    });
  });
})();