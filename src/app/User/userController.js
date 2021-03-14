const jwtMiddleware = require("../../../config/jwtMiddleware");
const userProvider = require("../../app/User/userProvider");
const userService = require("../../app/User/userService");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { smtpTransport } = require("../../../config/email.js");

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
  //passport.authenticate("naver", null);

  const { email, password } = req.body;

  const signInResponse = await userService.postSignIn(email, password);
  return res.send(signInResponse);
};

/**
 * API No.
 * API Name : 이메일 인증 API
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
