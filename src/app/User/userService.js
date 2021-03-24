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
    const loginParams = [token, userInfoRows[0].idx];
    const loginRows = await userProvider.loginCheck(userInfoRows[0].idx);
    if (loginRows[0].length < 1) {
      //insert
      console.log("insert");
      const connection = await pool.getConnection(async (conn) => conn);
      const loginResult = await userDao.insertLoginUser(
        connection,
        loginParams
      );
      connection.release();
    } else {
      console.log("update");
      //update
      const connection = await pool.getConnection(async (conn) => conn);
      const loginResult = await userDao.updateJwtToken(connection, loginParams);
      connection.release();
    }

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
//자동로그인
exports.postAutoSignIn = async function (userIdx) {
  try {
    // 계정 상태 확인
    const userInfoRows = await userProvider.retrieveUser(userIdx);
    if (userInfoRows.length < 1)
      return errResponse(baseResponse.USER_ID_NOT_EXIST);
    if (userInfoRows.status === 1)
      return errResponse(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT);

    //로그인 테이블 확인
    const loginRows = await userProvider.retrieveLogin(userIdx);

    if (loginRows[0].length < 1)
      return errResponse(baseResponse.USER_LOGIN_EMPTY);
    if (loginRows[0][0].status === 1)
      return errResponse(baseResponse.USER_LOGIN_EMPTY);

    //토큰 생성 Service
    let token = await jwt.sign(
      {
        userIdx: userInfoRows.idx,
      }, // 토큰의 내용(payload)
      secret_config.jwtsecret, // 비밀키
      {
        expiresIn: "365d",
        subject: "userInfo",
      } // 유효 기간 365일
    );

    //로그인 추가
    const loginParams = [token, userIdx];
    const connection = await pool.getConnection(async (conn) => conn);
    const loginResult = await userDao.updateJwtToken(connection, loginParams);
    connection.release();

    return response(baseResponse.SUCCESS, {
      userIdx: userInfoRows.idx,
      jwt: token,
    });
  } catch (err) {
    logger.error(
      `App - postAutoSignIn Service error\n: ${err.message} \n${JSON.stringify(
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
//logout
exports.patchJwtStatus = async function (userIdx) {
  try {
    // jwt table status update
    const loginUserRows = await userProvider.loginCheck(userIdx);

    if (loginUserRows[0].length < 1)
      return errResponse(baseResponse.LOGIN_NOT_EXIST);
    if (loginUserRows[0][0].status === 1)
      return errResponse(baseResponse.LOGIN_NOT_EXIST);

    const connection = await pool.getConnection(async (conn) => conn);
    const userIdResult = await userDao.updateJwtStatus(connection, userIdx);
    connection.release();

    return response(baseResponse.SUCCESS);
  } catch (err) {
    logger.error(`App - Logout Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
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
    const loginParams = [token, userIdx];
    const loginRows = await userProvider.loginCheck(userIdx);
    if (loginRows[0].length < 1) {
      //insert
      const connection = await pool.getConnection(async (conn) => conn);
      const loginResult = await userDao.insertLoginUser(
        connection,
        loginParams
      );
      connection.release();
    } else {
      //update
      const connection = await pool.getConnection(async (conn) => conn);
      const loginResult = await userDao.updateJwtToken(connection, loginParams);
      connection.release();
    }

    return response(baseResponse.SUCCESS, {
      userIdx: userIdx,
      jwt: token,
    });
  } catch (err) {
    logger.error(`App - createNaverUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
exports.updateUserNickname = async function (userIdx, nickname) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    const connection = await pool.getConnection(async (conn) => conn);
    const userResult = await userDao.updateUserNickname(
      connection,
      userIdx,
      nickname
    );
    connection.release();

    return response(baseResponse.SUCCESS, { userIdx: userIdx });
  } catch (err) {
    logger.error(`App - patchUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};

exports.updateUserImage = async function (userIdx, profileImg) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);

    const connection = await pool.getConnection(async (conn) => conn);
    const userResult = await userDao.updateUserImage(
      connection,
      userIdx,
      profileImg
    );
    connection.release();

    return response(baseResponse.SUCCESS);
  } catch (err) {
    logger.error(`App - patchUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
exports.updateUserEmail = async function (userIdx, email) {
  try {
    //userIdx 확인
    const userRows = await userProvider.retrieveUser(userIdx);
    if (userRows.length < 1) return errResponse(baseResponse.USER_ID_NOT_EXIST);
    if (userRows.loginType == 0)
      return errResponse(baseResponse.USER_EMAIL_UPDATE_ERROR);

    const connection = await pool.getConnection(async (conn) => conn);
    const userResult = await userDao.updateUserEmail(
      connection,
      userIdx,
      email
    );
    connection.release();

    return response(baseResponse.SUCCESS);
  } catch (err) {
    logger.error(`App - patchUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
//팔로우
exports.createFollow = async function (followIdx, followerIdx) {
  try {
    //userIdx 확인
    const followRows = await userProvider.retrieveUser(followIdx);

    if (!followRows || followRows.length < 1)
      return errResponse(baseResponse.USER_ID_NOT_EXIST);
    const followerRows = await userProvider.retrieveUser(followerIdx);
    if (!followRows || followerRows.length < 1)
      return errResponse(baseResponse.USER_ID_NOT_EXIST);

    //팔로우 테이블 조회
    const isFollowRows = await userProvider.retrieveFollow(
      followIdx,
      followerIdx
    );
    if (!isFollowRows || isFollowRows.length < 1) {
      const connection = await pool.getConnection(async (conn) => conn);
      const userResult = await userDao.insertFollow(
        connection,
        followIdx,
        followerIdx
      );
      connection.release();
      return response(baseResponse.SUCCESS, { status: true });
    } else {
      const status = !isFollowRows.status;
      const connection = await pool.getConnection(async (conn) => conn);
      const userResult = await userDao.updateFollow(
        connection,
        followIdx,
        followerIdx,
        status
      );
      connection.release();
      return response(baseResponse.SUCCESS, { status: !status });
    }
  } catch (err) {
    logger.error(`App - patchUser Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }
};
