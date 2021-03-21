module.exports = function (app) {
  const eatDeal = require("./eatDealController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  //잇딜 조회
  app.get("/app/eat-deals", eatDeal.getEatDeals);

  //잇딜 상세 조회
  app.get("/app/eat-deals/:eatDealIdx", eatDeal.getEatDealById);
};
