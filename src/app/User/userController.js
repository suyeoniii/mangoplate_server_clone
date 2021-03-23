const jwtMiddleware = require("../../../config/jwtMiddleware");
const userProvider = require("../../app/User/userProvider");
const userService = require("../../app/User/userService");
const baseResponse = require("../../../config/baseResponseStatus");
const secret_config = require("../../../config//secret");
const { response, errResponse } = require("../../../config/response");
const { smtpTransport } = require("../../../config/email.js");
var request = require("request");
const jwt = require("jsonwebtoken");

const regexEmail = require("regex-email");
const { emit } = require("nodemon");

/**
 * API No. 1
 * API Name : 유저 생성 (회원가입) API
 * [POST] /app/users
 */
exports.postUsers = async function (req, res) {
  /**
   * Body: email, password, phone, nickname, profile_img
   */
  const {
    email,
    password,
    password_check,
    phone,
    nickname,
    profile_img,
  } = req.body;

  // 빈 값 체크
  if (!email) return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
  if (!password) return res.send(response(baseResponse.SIGNUP_PASSWORD_EMPTY));
  if (!password_check)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_CHECK_EMPTY));
  if (!nickname) return res.send(response(baseResponse.SIGNUP_NICKNAME_EMPTY));

  // 길이 체크
  if (email.length > 30)
    return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));
  if (password.length < 6 || password.length > 12)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
  if (password_check.length < 6 || password_check.length > 12)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
  if (nickname.length < 2)
    return res.send(response(baseResponse.SIGNUP_NICKNAME_LENGTH));

  //비밀번호 일치 확인
  if (password !== password_check)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_NOT_MATCH));

  // 형식 체크 (by 정규표현식)
  if (!regexEmail.test(email))
    return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

  var checkNumber = password.search(/[0-9]/g);
  var checkEnglish = password.search(/[a-z]/gi);

  if (checkNumber < 0 || checkEnglish < 0) {
    return res.send(response(baseResponse.SIGNUP_PASSWORD_ERROR_TYPE));
  }
  //번호 정규표현식 체크
  var regPhone = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!regPhone.test(phone))
    return res.send(response(baseResponse.SIGNUP_PHONE_ERROR_TYPE));

  const signUpResponse = await userService.createUser(
    email,
    password,
    phone,
    nickname,
    profile_img
  );

  return res.send(signUpResponse);
};

/**
 * API No. 2
 * API Name : 유저 조회 API (+ 이메일로 검색 조회)
 * [GET] /app/users
 */
exports.getUsers = async function (req, res) {
  /**
   * Query String: email
   */
  const email = req.query.email;

  if (!email) {
    // 유저 전체 조회
    const userListResult = await userProvider.retrieveUserList();
    return res.send(response(baseResponse.SUCCESS, userListResult));
  } else {
    // 유저 검색 조회
    const userListByEmail = await userProvider.retrieveUserList(email);
    return res.send(response(baseResponse.SUCCESS, userListByEmail));
  }
};

/**
 * API No. 3
 * API Name : 특정 유저 조회 API
 * [GET] /app/users/{userId}
 */
exports.getUserById = async function (req, res) {
  /**
   * Path Variable: userId
   */
  const userId = req.params.userId;

  if (!userId) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

  const userByUserId = await userProvider.retrieveUser(userId);
  return res.send(response(baseResponse.SUCCESS, userByUserId));
};

// TODO: After 로그인 인증 방법 (JWT)
/**
 * API No. 4
 * API Name : 로그인 API
 * [POST] /app/login
 * body : email, passsword
 */
exports.login = async function (req, res) {
  const { email, password } = req.body;

  // 빈 값 체크
  if (!email) return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
  if (!password) return res.send(response(baseResponse.SIGNUP_PASSWORD_EMPTY));
  // 길이 체크
  if (email.length > 30)
    return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));
  if (password.length < 6 || password.length > 12) {
    return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
  }
  // 형식 체크 (by 정규표현식)
  if (!regexEmail.test(email))
    return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

  const signInResponse = await userService.postSignIn(email, password);

  return res.send(signInResponse);
};

/**
 * API No. 5
 * API Name : 회원 정보 수정 API + JWT + Validation
 * [PATCH] /app/users/:userId
 * path variable : userId
 * body : nickname
 */
exports.patchUsers = async function (req, res) {
  // jwt - userId, path variable :userId

  const userIdFromJWT = req.verifiedToken.userId;

  const userId = req.params.userId;
  const nickname = req.body.nickname;

  if (userIdFromJWT != userId) {
    res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
  } else {
    if (!nickname)
      return res.send(errResponse(baseResponse.USER_NICKNAME_EMPTY));

    const editUserInfo = await userService.editUser(userId, nickname);
    return res.send(editUserInfo);
  }
};

/** JWT 토큰 검증 API
 * [GET] /app/auto-login
 */
exports.check = async function (req, res) {
  const userIdResult = req.verifiedToken.userId;
  console.log(userIdResult);
  return res.send(response(baseResponse.TOKEN_VERIFICATION_SUCCESS));
};

/**
 * API No.
 * API Name : 네이버 로그인 API
 * [GET] /app/login/naver
 */
exports.naverLogin = async function (req, res) {
  const token = req.body.accessToken;
  const header = "Bearer " + token; //Bearer 다음에 공백 추가
  const api_url = "https://openapi.naver.com/v1/nid/me";
  const options = {
    url: api_url,
    headers: { Authorization: header },
  };
  request.get(options, async function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const obj = JSON.parse(body);
      const email = obj.response.email;
      const profile_img = obj.response.profile_image;
      const phone = obj.response.mobile;
      const name = obj.response.name;

      if (!email) return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
      if (!name) return res.send(response(baseResponse.SIGNUP_NICKNAME_EMPTY));

      const signUpResponse = await userService.createNaverUser(
        email,
        name,
        phone,
        profile_img
      );

      return res.send(signUpResponse);
    } else {
      if (response != null) {
        res.send(errResponse(baseResponse.NAVER_LOGIN_FAIL));
      }
    }
  });
};

/**
 * API No.
 * API Name : 인증 메일 전송 API
 * [GET] /app/email-check
 */
exports.sendEmail = async function (req, res) {
  const email = req.body.email;

  // 빈 값 체크
  if (!email) return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
  // 길이 체크
  if (email.length > 30)
    return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));
  // 형식 체크 (by 정규표현식)
  if (!regexEmail.test(email))
    return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

  const mailOptions = {
    from: "ssy4230@naver.com",
    to: email,
    subject: "[망고플레이트_모의외주]회원가입 이메일 인증 메일입니다.",
    html: `<html><head></head><body><h3>망고플레이트 이메일 가입을 위해 이메일 인증을 진행해주세요. <h3><h5>(24시간 이내로 확인해주셔야 합니다)</h5><a href="https://dev.mangoplate.shop/app/email-check?email=${email}" rel="noreferrer noopener" target="_blank">이메일 인증</a></body></html>`,
  };

  const result = await smtpTransport.sendMail(
    mailOptions,
    (error, responses) => {
      if (error) {
        res.send(errResponse(baseResponse.SIGNUP_SENDEMAIL_FAIL));
      } else {
        res.send(response(baseResponse.SUCCESS));
      }
      smtpTransport.close();
    }
  );
  return;
};

//이메일 인증 API
exports.emailVerify = async function (req, res) {
  const email = req.query.email;

  const emailVerifyResponse = await userService.postEmailVerify(email);
  return res.send(emailVerifyResponse);
};

/**
 * API No. 아이디,비밀번호 확인
 * [POST] /app/users/check
 */
exports.postUsersCheck = async function (req, res) {
  /**
   * Body: email, password, password_check
   */
  const { email, password, password_check } = req.body;

  // 빈 값 체크
  if (!email) return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
  if (!password) return res.send(response(baseResponse.SIGNUP_PASSWORD_EMPTY));
  if (!password_check)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_CHECK_EMPTY));

  // 길이 체크
  if (email.length > 30)
    return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));
  if (password.length < 6 || password.length > 12)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
  if (password_check.length < 6 || password_check.length > 12)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));

  //비밀번호 일치 확인
  if (password !== password_check)
    return res.send(response(baseResponse.SIGNUP_PASSWORD_NOT_MATCH));

  // 형식 체크 (by 정규표현식)
  if (!regexEmail.test(email))
    return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

  // 이메일 중복 확인
  const emailRows = await userProvider.emailCheck(email);
  if (emailRows.length > 0)
    return res.send(errResponse(baseResponse.SIGNUP_REDUNDANT_EMAIL));
  //이메일 인증 여부 확인
  const emailVerifyRows = await userProvider.emailVerifyCheck(email);
  if (emailVerifyRows.length < 1)
    return res.send(errResponse(baseResponse.SIGNUP_EMAIL_NOT_VERIFIED));
  if (emailVerifyRows[0].isVerified === 0 || emailVerifyRows[0].time === 1)
    return res.send(errResponse(baseResponse.SIGNUP_EMAIL_NOT_VERIFIED));

  return res.send(response(baseResponse.SUCCESS));
};

/**
 * API No. 자동로그인
 * [POST] /app/login/auto
 */
exports.autoLogin = async function (req, res) {
  const userIdFromJWT = req.verifiedToken.userIdx;

  const signInResponse = await userService.postAutoSignIn(userIdFromJWT);

  return res.send(signInResponse);
};

/**
 * API No. 로그아웃
 * [PATCH] /app/logout
 */
exports.logout = async function (req, res) {
  const userIdFromJWT = req.verifiedToken.userIdx;

  const logoutResponse = await userService.patchJwtStatus(userIdFromJWT);

  return res.send(logoutResponse);
};

/**
 * API No. 마이페이지 조회
 * [GET] /app/users/:userIdx
 */
exports.getUserInfo = async function (req, res) {
  const userIdx = req.params.userIdx;
  const userIdFromJWT = req.verifiedToken.userIdx;

  if (userIdx != userIdFromJWT)
    return res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));

  const getUserResponse = await userProvider.retrieveUserInfo(userIdx);
  return res.send(response(baseResponse.SUCCESS, getUserResponse));
};
/**
 * API No. 마이페이지 조회
 * [GET] /app/users/:userIdx
 */
exports.getUser = async function (req, res) {
  const userIdx = req.params.userIdx;

  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;

  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }
  if (userIdFromJWT == userIdx) {
    const getUserResponse = await userProvider.retrieveUserInfo(userIdx);
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  } else {
    const getUserResponse = await userProvider.retrieveUserProfile(
      userIdx,
      userIdFromJWT
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  }
};
/**
 * API No. 가봤어요 조회
 * [GET] /app/users/:userIdx/visited
 */
exports.getUserVisited = async function (req, res) {
  /*
   *Query String : area, sort, food, price, parking, page, limit, lat, long
   */
  const userIdx = req.params.userIdx;
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  if (!userIdx) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

  const userResult = await userProvider.retrieveUser(userIdx);
  if (!userResult || userResult.length < 1)
    return res.send(response(baseResponse.USER_ID_NOT_EXIST));

  const {
    area,
    sort,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long,
  } = req.query;
  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (sort > 1 || sort < 0)
    return res.send(response(baseResponse.RESTAURANT_SORT_ERROR_TYPE));

  if (sort == 1 && (!lat || !long))
    return res.send(response(baseResponse.DISTANCE_NEED_LOCATION));

  if (typeof food === "string") {
    if (food > 8 || food < 0)
      return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
  } else {
    for (var element in food) {
      if (food[element] > 8 || food[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
    }
  }
  if (typeof price === "string") {
    if (price > 4 || price < 0)
      return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
  } else {
    for (var element in price) {
      if (price[element] > 4 || price[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
    }
  }
  if (parking > 2 || parking < 0)
    return res.send(response(baseResponse.RESTAURANT_PARKING_ERROR_TYPE));

  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (userIdFromJWT == userIdx) {
    //내 가봤어요 조회
    const getUserResponse = await userProvider.retrieveMyVisited(
      userIdFromJWT,
      area,
      sort,
      food,
      price,
      parking,
      page,
      limit,
      lat,
      long
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  } else {
    //다른유저 가봤어요 조회
    const getUserResponse = await userProvider.retrieveUserVisited(
      userIdx,
      userIdFromJWT,
      area,
      sort,
      food,
      price,
      parking,
      page,
      limit,
      lat,
      long
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  }
};
/**
 * API 가고싶다 조회
 * [GET] /app/users/:userIdx/star
 */
exports.getUserStar = async function (req, res) {
  /*
   *Query String : area, sort, food, price, parking, page, limit, lat, long
   */
  const userIdx = req.params.userIdx;
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  if (!userIdx) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

  const userResult = await userProvider.retrieveUser(userIdx);
  if (!userResult || userResult.length < 1)
    return res.send(response(baseResponse.USER_ID_NOT_EXIST));

  const {
    area,
    sort,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long,
  } = req.query;

  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (sort > 3 || sort < 0)
    return res.send(response(baseResponse.RESTAURANT_SORT_ERROR_TYPE));

  if (sort == 3 && (!lat || !long))
    return res.send(response(baseResponse.DISTANCE_NEED_LOCATION));

  if (typeof food === "string") {
    if (food > 8 || food < 0)
      return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
  } else {
    for (var element in food) {
      if (food[element] > 8 || food[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
    }
  }
  if (typeof price === "string") {
    if (price > 4 || price < 0)
      return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
  } else {
    for (var element in price) {
      if (price[element] > 4 || price[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
    }
  }
  if (parking > 2 || parking < 0)
    return res.send(response(baseResponse.RESTAURANT_PARKING_ERROR_TYPE));

  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (userIdFromJWT == userIdx) {
    //내 가고싶다 조회
    const getUserResponse = await userProvider.retrieveMyStar(
      userIdFromJWT,
      area,
      sort,
      food,
      price,
      parking,
      page,
      limit,
      lat,
      long
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  } else {
    //다른유저 가고싶다 조회
    const getUserResponse = await userProvider.retrieveUserStar(
      userIdx,
      userIdFromJWT,
      area,
      sort,
      food,
      price,
      parking,
      page,
      limit,
      lat,
      long
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  }
};
/**
 * API 사용자 리뷰 조회
 * [GET] /app/users/:userIdx/review
 */
exports.getUserReview = async function (req, res) {
  /*
   *Query String : area, sort, food, price, parking, page, limit, lat, long, score
   */
  const userIdx = req.params.userIdx;
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  if (!userIdx) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

  const userResult = await userProvider.retrieveUser(userIdx);
  if (!userResult || userResult.length < 1)
    return res.send(response(baseResponse.USER_ID_NOT_EXIST));

  const {
    area,
    sort,
    food,
    price,
    parking,
    page,
    limit,
    lat,
    long,
    score,
  } = req.query;

  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (sort > 1 || sort < 0)
    return res.send(response(baseResponse.RESTAURANT_SORT_ERROR_TYPE));

  if (sort == 1 && (!lat || !long))
    return res.send(response(baseResponse.DISTANCE_NEED_LOCATION));

  if (typeof food === "string") {
    if (food > 8 || food < 0)
      return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
  } else {
    for (var element in food) {
      if (food[element] > 8 || food[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_FOOD_ERROR_TYPE));
    }
  }
  if (typeof price === "string") {
    if (price > 4 || price < 0)
      return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
  } else {
    for (var element in price) {
      if (price[element] > 4 || price[element] < 0)
        return res.send(response(baseResponse.RESTAURANT_PRICE_ERROR_TYPE));
    }
  }
  if (parking > 2 || parking < 0)
    return res.send(response(baseResponse.RESTAURANT_PARKING_ERROR_TYPE));

  if (score > 2 || score < 0)
    return res.send(response(baseResponse.RESTAURANT_SCORE_ERROR_TYPE));
  if (score != 0 && !score)
    return res.send(response(baseResponse.REVIEW_SCORE_EMPTY));

  //토큰 받은 경우
  if (token) {
    jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
      if (verifiedToken) {
        userIdFromJWT = verifiedToken.userIdx;
      }
    });
    if (!userIdFromJWT) {
      return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }
  }

  if (userIdFromJWT == userIdx) {
    //내 가고싶다 조회
    const getUserResponse = await userProvider.retrieveMyReview(
      userIdFromJWT,
      area,
      sort,
      food,
      price,
      parking,
      page,
      limit,
      lat,
      long,
      score
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  } else {
    //다른유저 가고싶다 조회
    const getUserResponse = await userProvider.retrieveUserReview(
      userIdx,
      userIdFromJWT,
      area,
      sort,
      food,
      price,
      parking,
      page,
      limit,
      lat,
      long,
      score
    );
    return res.send(response(baseResponse.SUCCESS, getUserResponse));
  }
};
