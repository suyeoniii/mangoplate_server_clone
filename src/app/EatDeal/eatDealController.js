const jwtMiddleware = require("../../../config/jwtMiddleware");
const eatDealProvider = require("../../app/EatDeal/eatDealProvider");
const userProvider = require("../../app/User/userProvider");
const eatDealService = require("../../app/EatDeal/eatDealService");
const baseResponse = require("../../../config/baseResponseStatus");
const secret_config = require("../../../config//secret");
const { response, errResponse } = require("../../../config/response");
const jwt = require("jsonwebtoken");
const { emit } = require("nodemon");
const request = require("request");
const axios = require("axios");

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
 * API Name : 잇딜 상세 조회
 * [GET] /app/eatDeals/:eatDealIdx
 */
exports.getEatDealById = async function (req, res) {
  /**
   * path variable : eatDealIdx
   */

  const eatDealIdx = req.params.eatDealIdx;

  if (!eatDealIdx) return res.send(response(baseResponse.EATDEAL_ID_EMPTY));

  const eatDealResult = await eatDealProvider.retrieveEatDealById(eatDealIdx);

  return res.send(response(baseResponse.SUCCESS, eatDealResult));
};
/**
 * API No.
 * API Name : 잇딜 결제
 * [GET] /app/eat-deals/payment
 */
exports.payEatDeals = async function (req, res) {
  /**
   * header:jwt
   * Path variable : eatDealIdx
   */
  const userIdFromJWT = req.verifiedToken.userIdx;
  const eatDealIdx = req.params.eatDealIdx;

  if (!eatDealIdx) return res.send(response(baseResponse.EATDEAL_ID_EMPTY));
  const eatDealResult = await eatDealProvider.eatDealCheck(eatDealIdx);
  if (eatDealResult.length < 1)
    return res.send(response(baseResponse.EatDeal_ID_NOT_EXIST));
  const userResult = await userProvider.retrieveUser(userIdFromJWT);
  if (userResult.length < 1)
    return res.send(response(baseResponse.USER_ID_NOT_EXIST));

  let isSet;
  //주문번호 생성
  while (!isSet) {
    var now = new Date();
    var date = "S";
    date +=
      String(now.getYear()) + String(now.getDate()) + String(now.getSeconds());

    const number = Math.floor(Math.random() * (999999 - 100000)) + 100000;

    var orderNo = date + String(number);

    //중복확인
    const orderNoResult = await eatDealProvider.orderNoCheck(orderNo);
    console.log(orderNoResult);
    if (!orderNoResult) isSet = 1;
  }

  var tid;
  var url;

  //카카오 API 호출
  const header = `KakaoAK ${secret_config.KAKAO_ADMIN_KEY}`;
  const api_url = `https://kapi.kakao.com/v1/payment/ready`;
  const cid = "TC0ONETIME";
  axios({
    url: api_url,
    method: "post",
    headers: {
      Authorization: header,
    },
    params: {
      cid: cid,
      partner_order_id: orderNo,
      partner_user_id: userResult.idx,
      item_name: eatDealResult.menu,
      quantity: 1,
      total_amount: eatDealResult.salePrice,
      tax_free_amount: 0,
      approval_url: `http://localhost:3000/app/eat-deals/payment/callback?o=${orderNo}`,
      cancel_url: "http://localhost:3000/app/eat-deals/payment/callback",
      fail_url: "http://localhost:3000/app/eat-deals/payment/callback",
    },
  })
    .then((res) => {
      tid = res.data.tid;
      url = res.data.next_redirect_pc_url;
      console.log(url);
      //return res.data;
    })
    .catch((error) => {
      //return error;
    });
  if (!tid) {
    setTimeout(binding, 1000);
  } else {
    binding();
  }

  async function binding() {
    console.log(tid);
    const postOrderResponse = await eatDealService.createOrder(
      orderNo,
      userIdFromJWT,
      eatDealIdx,
      tid
    );
    return res.send(response(baseResponse.SUCCESS, { url: url }));
  }
};
/**
 * API No.
 * API Name : 주문 진행 API
 * [GET] /app/eat-deals/payment/callback
 */
exports.orderEatDeals = async function (req, res) {
  /**
   * query : pg_token
   */
  const pg_token = req.query.pg_token;
  const o = req.query.o;
  console.log(o);
  const orderResult = await eatDealProvider.orderCheck(o);

  console.log(orderResult);
  if (!orderResult) return res.send(response(baseResponse.ORDERNO_NOT_EXIST));
  const tid = orderResult.tid;
  const orderNo = orderResult.orderNo;
  const userIdx = orderResult.userIdx;

  //카카오 API 호출
  const header = `KakaoAK ${secret_config.KAKAO_ADMIN_KEY}`;
  const api_url = `https://kapi.kakao.com/v1/payment/approve`;
  const cid = "TC0ONETIME";
  axios({
    url: api_url,
    method: "post",
    headers: {
      Authorization: header,
    },
    params: {
      cid: cid,
      tid: tid,
      partner_order_id: orderNo,
      partner_user_id: userIdx,
      pg_token: pg_token,
    },
  })
    .then((res) => {
      console.log(res.data);
    })
    .catch((error) => {
      console.error(error);
    });
  setTimeout(binding, 1000);

  async function binding() {
    const postOrderResponse = await eatDealService.updateOrderStatus(
      orderNo,
      1
    );
    return res.send(response(baseResponse.SUCCESS));
  }
};
