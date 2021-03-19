module.exports = function (app) {
  const review = require("./reviewController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  //리뷰 조회 API
  app.get("/app/reviews/:reviewIdx", review.getReviewById);

  //리뷰 쓰기 API
  app.post("/app/reviews", jwtMiddleware, review.postReview);

  //리뷰 수정 API
  app.patch("/app/reviews/:reviewIdx", jwtMiddleware, review.patchReview);

  //리뷰 삭제 API
  //app.patch("/app/reviews/:reviewIdx", jwtMiddleware, review.patchReviewStatus);
};
