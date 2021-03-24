module.exports = function (app) {
  const eatDeal = require("./eatDealController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  //잇딜 조회
  app.get("/app/eat-deals", eatDeal.getEatDeals);

  //잇딜 상세 조회
  app.get("/app/eat-deals/:eatDealIdx", eatDeal.getEatDealById);

  //잇딜 결제
  app.post(
    "/app/eat-deals/:eatDealIdx/payment",
    jwtMiddleware,
    eatDeal.payEatDeals
  );
  app.get("/app/eat-deals/payment/callback", eatDeal.orderEatDeals);
};
