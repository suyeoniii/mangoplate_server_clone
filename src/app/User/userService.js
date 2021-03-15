const { logger } = require("../../../config/winston");
const { pool } = require("../../../config/database");
const secret_config = require("../../../config/secret");
const userProvider = require("./userProvider");
const userDao = require("./userDao");
const baseResponse = require("../../../config/baseResponseStatus");
const { response } = require("../../../config/response");
const { errResponse } = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connect } = require("http2");

// Service: Create, Update, Delete 비즈니스 로직 처리

exports.createUser = async function (
  email,
  password,
  phone,
  nickname,
  profile_img
) {
  try {
    // 이메일 중복 확인
    const emailRows = await userProvider.emailCheck(email);
    if (emailRows.length > 0)
      return errResponse(baseResponse.SIGNUP_REDUNDANT_EMAIL);

    //이메일 인증 여부 확인
    const emailVerifyRows = await userProvider.emailVerifyCheck(email);
    if (emailVerifyRows.length < 1)
      return errResponse(baseResponse.SIGNUP_EMAIL_NOT_VERIFIED);
    if (emailVerifyRows[0].isVerified === 0 || emailVerifyRows[0].time === 1)
      return errResponse(baseResponse.SIGNUP_EMAIL_NOT_VERIFIED);

    // 비밀번호 암호화
    const hashedPassword = await crypto
      .createHash("sha512")
      .update(password)
      .digest("hex");

    const insertUserInfoParams = [
      email,
      hashedPassword,
      phone,
      nickname,
      profile_img,
    ];

    const connection = await pool.getConnection(async (conn) => conn);

    const userIdResult = await userDao.insertUser(
      connection,
      insertUserInfoParams
    );
    connection.release();
    return response(baseResponse.SUCCESS, {
      userIdx: userIdResult[0].insertId,
    });
  } catch (err) {
    logger.error(`App - createUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};

// TODO: After 로그인 인증 방법 (JWT)
exports.postSignIn = async function (email, password) {
  try {
    // 이메일 여부 확인
    const emailRows = await userProvider.emailCheck(email);
    if (emailRows.length < 1)
      return errResponse(baseResponse.SIGNIN_EMAIL_WRONG);

    const selectEmail = emailRows[0].userEmail;

    // 비밀번호 확인
    const hashedPassword = await crypto
      .createHash("sha512")
      .update(password)
      .digest("hex");

    const selectUserPasswordParams = [selectEmail, hashedPassword];
    const passwordRows = await userProvider.passwordCheck(
      selectUserPasswordParams
    );

    if (passwordRows.length < 1)
      return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
    if (passwordRows[0].password !== hashedPassword) {
      return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
    }

    // 계정 상태 확인
    const userInfoRows = await userProvider.accountCheck(email);

    if (userInfoRows[0].status === 1)
      return errResponse(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT);

    console.log(userInfoRows[0].idx); // DB의 userId

    //토큰 생성 Service
    let token = await jwt.sign(
      {
        userIdx: userInfoRows[0].idx,
      }, // 토큰의 내용(payload)
      secret_config.jwtsecret, // 비밀키
      {
        expiresIn: "365d",
        subject: "userInfo",
      } // 유효 기간 365일
    );
    return response(baseResponse.SUCCESS, {
      userIdx: userInfoRows[0].idx,
      jwt: token,
    });
  } catch (err) {
    logger.error(
      `App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(
        err
      )}`
    );
    return errResponse(baseResponse.DB_ERROR);
  }
};

exports.editUser = async function (id, nickname) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const editUserResult = await userDao.updateUserInfo(
      connection,
      id,
      nickname
    );
    connection.release();

    return response(baseResponse.SUCCESS);
  } catch (err) {
    logger.error(`App - editUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};

//이메일 인증
exports.postEmailVerify = async function (email) {
  try {
    // 이메일 여부 확인
    const emailRows = await userProvider.emailVerifyCheck(email);
    if (emailRows.length > 1) {
      //update
      const connection = await pool.getConnection(async (conn) => conn);
      const emailVerifyResult = await userDao.updateEmailVerify(
        connection,
        email
      );
      connection.release();
    } else {
      //create
      const connection = await pool.getConnection(async (conn) => conn);
      const emailVerifyResult = await userDao.insertEmailVerify(
        connection,
        email
      );
      connection.release();
    }
    return response({ message: "이메일 인증이 완료되었습니다" });
  } catch (err) {
    logger.error(`App - EmailVerify Service error\n: ${err.message}`);
    return errResponse({ message: "이메일 인증에 실패했습니다" });
  }
};

exports.createNaverUser = async function (email, nickname, phone, profile_img) {
  try {
    // 가입여부
    const emailRows = await userProvider.naverEmailCheck(email);
    var userIdx;
    if (emailRows.length < 1) {
      //소셜 회원가입
      phone = phone.replace(/-/gi, ""); //하이픈 제거
      const insertUserParams = [email, nickname, phone, profile_img];
      const connection = await pool.getConnection(async (conn) => conn);

      const userIdResult = await userDao.insertNaverUser(
        connection,
        insertUserParams
      );
      connection.release();
      userIdx = userIdResult[0].insertId;
    } else {
      userIdx = emailRows[0].idx;
    }
    //토큰 생성 Service
    let token = await jwt.sign(
      {
        userIdx: userIdx,
      }, // 토큰의 내용(payload)
      secret_config.jwtsecret, // 비밀키
      {
        expiresIn: "365d",
        subject: "userInfo",
      } // 유효 기간 365일
    );
    return response(baseResponse.SUCCESS, {
      userIdx: userIdx,
      jwt: token,
    });
  } catch (err) {
    logger.error(`App - createNaverUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
