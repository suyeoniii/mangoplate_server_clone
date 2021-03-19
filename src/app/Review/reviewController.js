const jwtMiddleware = require("../../../config/jwtMiddleware");
const reviewProvider = require("../../app/Review/reviewProvider");
const reviewService = require("../../app/Review/reviewService");
const baseResponse = require("../../../config/baseResponseStatus");
const secret_config = require("../../../config//secret");
const { response, errResponse } = require("../../../config/response");
const jwt = require("jsonwebtoken");
const request = require("request");

const regexEmail = require("regex-email");
const { emit } = require("nodemon");

/**
 * API No.
 * API Name : 리뷰 상세 조회
 * [GET] /app/reviews/:reviewIdx
 */
exports.getReviewById = async function (req, res) {
  /**
   * path variable : reviewIdx
   */
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  const reviewIdx = req.params.reviewIdx;

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

  if (!reviewIdx) return res.send(response(baseResponse.REVIEW_ID_EMPTY));

  const reviewResult = await reviewProvider.retrieveReviewById(
    reviewIdx,
    userIdFromJWT
  );

  return res.send(response(baseResponse.SUCCESS, reviewResult));
};

/**
 * API No.
 * API Name : 가고싶다 등록, 수정, 삭제
 * [POST] /app/reviews/:reviewIdx/star
 */
exports.postStar = async function (req, res) {
  /**
   * path variable : reviewIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const reviewIdx = req.params.reviewIdx;
  const { contents, status } = req.body;

  if (!reviewIdx) return res.send(response(baseResponse.RESTAURANT_ID_EMPTY));

  const postStarResponse = await reviewService.updateStars(
    userIdFromJWT,
    reviewIdx,
    contents,
    status
  );
  return res.send(postStarResponse);
};

/**
 * API No.
 * API Name : 가봤어요 등록
 * [POST] /app/reviews/:reviewIdx/visited
 */
exports.postVisited = async function (req, res) {
  /**
   * path variable : reviewIdx
   * Body : contents, isPrivate
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const reviewIdx = req.params.reviewIdx;
  const contents = req.body.contents;
  var isPrivate = req.body.isPrivate;

  if (!reviewIdx) return res.send(response(baseResponse.RESTAURANT_ID_EMPTY));
  if (!isPrivate) isPrivate = 0;

  const postVisitedResponse = await reviewService.createVisited(
    userIdFromJWT,
    reviewIdx,
    contents,
    isPrivate
  );
  return res.send(postVisitedResponse);
};

/**
 * API No.
 * API Name : 가봤어요 수정
 * [PATCH] /app/reviews/visited/:visitedIdx
 */
exports.patchVisited = async function (req, res) {
  /**
   * path variable : visitedIdx
   * Body : contents, isPrivate
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const visitedIdx = req.params.visitedIdx;
  const contents = req.body.contents;
  var isPrivate = req.body.isPrivate;

  if (!visitedIdx) return res.send(response(baseResponse.VISITED_ID_EMPTY));
  if (!isPrivate) isPrivate = 0;

  const patchVisitedResponse = await reviewService.updateVisited(
    userIdFromJWT,
    visitedIdx,
    contents,
    isPrivate
  );
  return res.send(patchVisitedResponse);
};
/**
 * API No.
 * API Name : 가봤어요 삭제
 * [PATCH] /app/reviews/visited/:visitedIdx/status
 */
exports.patchVisitedStatus = async function (req, res) {
  /**
   * path variable : visitedIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const visitedIdx = req.params.visitedIdx;

  if (!visitedIdx) return res.send(response(baseResponse.VISITED_ID_EMPTY));

  const patchVisitedResponse = await reviewService.updateVisitedStatus(
    userIdFromJWT,
    visitedIdx
  );
  return res.send(patchVisitedResponse);
};
