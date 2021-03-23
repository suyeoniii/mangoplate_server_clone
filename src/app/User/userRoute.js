module.exports = function (app) {
  const user = require("./userController");
  const jwtMiddleware = require("../../../config/jwtMiddleware");

  // 1. 유저 생성 (회원가입) API
  app.post("/app/users", user.postUsers);

  // 2. 유저 조회 API (+ 검색)
  //app.get('/app/users',user.getUsers);

  // 3. 특정 유저 조회 API
  //app.get('/app/users/:userId', user.getUserById);

  // 로그인 하기 API (JWT 생성)
  app.post("/app/login", user.login);

  //이메일 인증 전송 API
  app.post("/app/email-check", user.sendEmail);

  //이메일 인증 확인 API
  app.get("/app/email-check", user.emailVerify);

  //회원가입 - 이메일, 비밀번호 확인
  app.post("/app/users/check", user.postUsersCheck);

  //네이버 로그인
  app.post("/app/login/naver", user.naverLogin);

  //자동로그인
  app.get("/app/login/auto", jwtMiddleware, user.autoLogin);

  //로그아웃
  app.patch("/app/logout", jwtMiddleware, user.logout);

  //사용자 프로필(마이페이지 조회) 조회
  app.get("/app/users/:userIdx", user.getUser);

  //가봤어요 조회 API
  app.get("/app/users/:userIdx/visited", user.getUserVisited);

  //가고싶다 조회
  app.get("/app/users/:userIdx/star", user.getUserStar);

  //사용자 리뷰 조회
  app.get("/app/users/:userIdx/review", user.getUserReview);

  // 회원 정보 수정 API (JWT 검증 및 Validation - 메소드 체이닝 방식으로 jwtMiddleware 사용)
  //app.patch('/app/users/:userId', jwtMiddleware, user.patchUsers)
};

// TODO: 자동로그인 API (JWT 검증 및 Payload 내뱉기)
// JWT 검증 API
// app.get('/app/auto-login', jwtMiddleware, user.check);
// TODO: 탈퇴하기 API
