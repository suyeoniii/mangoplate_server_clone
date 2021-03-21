const jwtMiddleware = require("../../../config/jwtMiddleware");
const eatDealProvider = require("../../app/EatDeal/eatDealProvider");
//const eatDealService = require("../../app/EatDeal/eatDealService");
const baseResponse = require("../../../config/baseResponseStatus");
const secret_config = require("../../../config//secret");
const { response, errResponse } = require("../../../config/response");
const jwt = require("jsonwebtoken");
const { emit } = require("nodemon");

/**
 * API No.
 * API Name : 잇딜 조회
 * [GET] /app/eatDeals
 */
exports.getEatDeals = async function (req, res) {
  /**
   * Query String : area, page, limit
   */
  const { area, page, limit } = req.query;
  const eatDealResult = await eatDealProvider.retrieveEatDeals(
    area,
    page,
    limit
  );

  return res.send(response(baseResponse.SUCCESS, eatDealResult));
};

/**
 * API No.
 * API Name : 리뷰 상세 조회
 * [GET] /app/eatDeals/:eatDealIdx
 */
exports.getEatDealById = async function (req, res) {
  /**
   * path variable : eatDealIdx
   */
  const eatDealIdx = req.params.eatDealIdx;

  if (!eatDealIdx) return res.send(response(baseResponse.REVIEW_ID_EMPTY));

  const eatDealResult = await eatDealProvider.retrieveEatDealById(
    eatDealIdx,
    userIdFromJWT
  );

  return res.send(response(baseResponse.SUCCESS, eatDealResult));
};
