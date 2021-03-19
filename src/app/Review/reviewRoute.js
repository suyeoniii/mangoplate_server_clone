module.exports = function (app) {
  const review = require("./reviewController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  app.get("/app/reviews/:reviewIdx", review.getReviewById);

  /*app.post(
    "/app/reviews/:reviewIdx/star",
    jwtMiddleware,
    review.postStar
  );*/
};
