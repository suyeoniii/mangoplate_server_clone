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
 * API Name : 리뷰 등록
 * [POST] /app/reviews
 */
exports.postReview = async function (req, res) {
  /**
   * Body : restaurantIdx, imgUrl, score, contents
   */
  const userIdFromJWT = req.verifiedToken.userIdx;

  const { restaurantIdx, img, contents } = req.body;
  var score = req.body.score;

  if (!restaurantIdx)
    return res.send(response(baseResponse.RESTAURANT_ID_EMPTY));
  if (!score) score = 0;
  if (!contents) return res.send(response(baseResponse.REVIEW_CONTENTS_EMPTY));

  if (score < 0 || score > 2)
    return res.send(response(baseResponse.REVIEW_SCORE_ERROR_TYPE));
  if (contents.length > 10000)
    return res.send(response(baseResponse.REVIEW_CONTENTS_LENGTH));
  if (img && img.length > 30)
    return res.send(response(baseResponse.REVIEW_IMAGE_LENGTH));

  const postReviewResponse = await reviewService.createReview(
    userIdFromJWT,
    restaurantIdx,
    img,
    score,
    contents
  );
  return res.send(postReviewResponse);
};

/**
 * API No.
 * API Name : 리뷰 수정
 * [PATCH] /app/reviews/review/:reviewIdx
 */
exports.patchReview = async function (req, res) {
  /**
   * path variable : reviewIdx
   * Body : imgUrl, score, contents
   */
  const userIdFromJWT = req.verifiedToken.userIdx;

  const reviewIdx = req.params.reviewIdx;
  const { img, contents } = req.body;
  var score = req.body.score;

  if (!reviewIdx) return res.send(response(baseResponse.REVIEW_ID_EMPTY));
  if (!score) score = 0;
  if (!contents) return res.send(response(baseResponse.REVIEW_CONTENTS_EMPTY));

  if (score < 0 || score > 2)
    return res.send(response(baseResponse.REVIEW_SCORE_ERROR_TYPE));
  if (contents.length > 10000)
    return res.send(response(baseResponse.REVIEW_CONTENTS_LENGTH));
  if (img && img.length > 30)
    return res.send(response(baseResponse.REVIEW_IMAGE_LENGTH));

  const patchReviewResponse = await reviewService.updateReview(
    userIdFromJWT,
    reviewIdx,
    img,
    score,
    contents
  );

  return res.send(patchReviewResponse);
};
/**
 * API No.
 * API Name : 리뷰 삭제
 * [PATCH] /app/reviews/review/:reviewIdx/status
 */
exports.patchReviewStatus = async function (req, res) {
  /**
   * path variable : reviewIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;

  const reviewIdx = req.params.reviewIdx;

  if (!reviewIdx) return res.send(response(baseResponse.REVIEW_ID_EMPTY));

  const patchReviewResponse = await reviewService.updateReviewStatus(
    userIdFromJWT,
    reviewIdx
  );

  return res.send(patchReviewResponse);
};
