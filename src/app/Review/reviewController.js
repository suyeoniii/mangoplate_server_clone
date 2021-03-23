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

  let imgRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

  for (i in img) {
    if (!regex.test(img[i].imgUrl)) {
      return res.send(response(baseResponse.IMAGE_URL_ERROR_TYPE));
    }
  }

  //올바른 url이 맞다면 해당 url로 이동
  if (regex.test(url)) {
    location.href = url;
  }

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
 * [PATCH] /app/reviews/:reviewIdx/status
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

/**
 * API No.
 * API Name : 리뷰 좋아요
 * [POST] /app/reviews/:reviewIdx/like
 */
exports.postReviewLike = async function (req, res) {
  /**
   * path variable : reviewIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const reviewIdx = req.params.reviewIdx;

  if (!reviewIdx) return res.send(response(baseResponse.REVIEW_ID_EMPTY));

  const postReviewResponse = await reviewService.createReviewLike(
    userIdFromJWT,
    reviewIdx
  );

  return res.send(postReviewResponse);
};
/**
 * API No.
 * API Name : 리뷰 댓글 API
 * [POST] /app/reviews/:reviewIdx/comment
 */
exports.postReviewComment = async function (req, res) {
  /**
   * path variable : reviewIdx
   * Body : contents
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const reviewIdx = req.params.reviewIdx;
  const contents = req.body.contents;

  if (!reviewIdx) return res.send(response(baseResponse.REVIEW_ID_EMPTY));
  if (!contents) return res.send(response(baseResponse.COMMENT_CONTENTS_EMPTY));
  if (contents.length > 100)
    return res.send(response(baseResponse.COMMENT_CONTENTS_LENGTH));

  const postReviewCommentResponse = await reviewService.createReviewComment(
    userIdFromJWT,
    reviewIdx,
    contents
  );

  return res.send(postReviewCommentResponse);
};

/**
 * API No.
 * API Name : 리뷰 댓글 수정 API
 * [PATCH] /app/reviews/comment/:commentIdx
 */
exports.patchReviewComment = async function (req, res) {
  /**
   * path variable : reviewIdx
   * Body : contents
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const commentIdx = req.params.commentIdx;
  const contents = req.body.contents;

  if (!commentIdx) return res.send(response(baseResponse.COMMENT_ID_EMPTY));
  if (!contents) return res.send(response(baseResponse.COMMENT_CONTENTS_EMPTY));
  if (contents.length > 100)
    return res.send(response(baseResponse.COMMENT_CONTENTS_LENGTH));

  const patchReviewCommentResponse = await reviewService.updateReviewComment(
    userIdFromJWT,
    commentIdx,
    contents
  );

  return res.send(patchReviewCommentResponse);
};
/**
 * API No.
 * API Name : 리뷰 댓글 수정 API
 * [PATCH] /app/reviews/comment/:commentIdx
 */
exports.patchReviewCommentStatus = async function (req, res) {
  /**
   * path variable : reviewIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const commentIdx = req.params.commentIdx;

  if (!commentIdx) return res.send(response(baseResponse.COMMENT_ID_EMPTY));

  const patchReviewCommentResponse = await reviewService.updateReviewCommentStatus(
    userIdFromJWT,
    commentIdx
  );

  return res.send(patchReviewCommentResponse);
};
/**
 * API No.
 * API Name : 리뷰 전체 조회
 * [GET] /app/reviews/:reviewIdx
 */
exports.getReviews = async function (req, res) {
  /**
   * Query String : area, category, score, page, limit
   */
  const token = req.headers["x-access-token"] || req.query.token;
  var userIdFromJWT;
  const { area, category, score, page, limit } = req.query;

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

  if (category && category != 1)
    return res.send(errResponse(baseResponse.REVIEW_CATEGORY_ERROR_TYPE));
  if (!score) return res.send(errResponse(baseResponse.REVIEW_SCORE_EMPTY));
  for (var element in score) {
    if (score[element] > 3 || score[element] < 1)
      return res.send(response(baseResponse.REVIEW_SCORE_ERROR_TYPE));
  }

  const reviewResult = await reviewProvider.retrieveReviews(
    userIdFromJWT,
    area,
    category,
    score,
    page,
    limit
  );

  return res.send(response(baseResponse.SUCCESS, reviewResult));
};
