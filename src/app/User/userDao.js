// 모든 유저 조회
async function selectUser(connection) {
  const selectUserListQuery = `
                SELECT email, nickname 
                FROM User;
                `;
  const [userRows] = await connection.query(selectUserListQuery);
  return userRows;
}

// 이메일로 회원 조회
async function selectUserEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT idx, userEmail
                FROM User 
                WHERE userEmail = ? AND loginType=0;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}
// 이메일로 회원 조회
async function selectNaverUserEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT idx, userEmail, loginType
                FROM User 
                WHERE userEmail = ? AND loginType=1;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}
//이메일 인증 조회
async function selectVerifiedEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT idx, email, case
                when TIMESTAMPDIFF(Hour, updatedAt, current_timestamp()) > 24
                    then 1
                end  as isExpired, isVerified
                FROM EmailCheck
                WHERE email = ?;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}

// userId 회원 조회
async function selectUserId(connection, userId) {
  const selectUserIdQuery = `
                 SELECT idx, userEmail, nickname, status
                 FROM User 
                 WHERE idx = ?;
                 `;
  const [userRow] = await connection.query(selectUserIdQuery, userId);
  return userRow;
}

// 유저 생성
async function insertUser(connection, insertUserParams) {
  const insertUserQuery = `
        INSERT INTO User(userEmail, password, phone, nickname, profileImg)
        VALUES (?, ?, ?, ?, ?);
    `;
  const insertUserRow = await connection.query(
    insertUserQuery,
    insertUserParams
  );

  return insertUserRow;
}

// 패스워드 체크
async function selectUserPassword(connection, selectUserPasswordParams) {
  const selectUserPasswordQuery = `
        SELECT userEmail, nickname, password
        FROM User 
        WHERE userEmail = ? AND password = ?;`;
  const selectUserPasswordRow = await connection.query(
    selectUserPasswordQuery,
    selectUserPasswordParams
  );

  return selectUserPasswordRow;
}

// 유저 계정 상태 체크 (jwt 생성 위해 id 값도 가져온다.)
async function selectUserAccount(connection, email) {
  const selectUserAccountQuery = `
        SELECT status, idx
        FROM User 
        WHERE userEmail = ?;`;
  const selectUserAccountRow = await connection.query(
    selectUserAccountQuery,
    email
  );
  return selectUserAccountRow[0];
}

async function updateUser(connection, id, nickname) {
  const updateUserQuery = `
  UPDATE User 
  SET nickname = ?
  WHERE id = ?;`;
  const updateUserRow = await connection.query(updateUserQuery, [nickname, id]);
  return updateUserRow[0];
}

async function updateEmailVerify(connection, email) {
  const updateEmailQuery = `
  UPDATE EmailCheck
  SET isVerified = 1
  WHERE email = ?;`;
  const updateEmailRow = await connection.query(updateEmailQuery, email);
  return updateEmailRow[0];
}

async function insertEmailVerify(connection, email) {
  const insertEmailQuery = `
  INSERT INTO EmailCheck(email, isVerified)
  VALUES(?, 1);
  `;
  const insertEmailRow = await connection.query(insertEmailQuery, email);
  return insertEmailRow[0];
}

//네이버 로그인 회원조회
async function insertNaverUser(connection, insertUserParams) {
  const insertEmailQuery = `
  INSERT INTO User(userEmail, nickname, phone, profileImg, loginType)
  VALUES(?, ?, ?, ?, 1);
  `;
  const insertEmailRow = await connection.query(
    insertEmailQuery,
    insertUserParams
  );
  return insertEmailRow;
}
//jwt status 업데이트
async function updateJwtStatus(connection, userIdx) {
  const updateJwtStatusQuery = `
  UPDATE Jwt SET status=1 where userIdx=?
  `;
  const updateJwtStatusRow = await connection.query(
    updateJwtStatusQuery,
    userIdx
  );
  return updateJwtStatusRow;
}

//jwt token 업데이트
async function updateJwtToken(connection, updateJwtTokenParams) {
  const updateJwtTokenQuery = `
  UPDATE Jwt SET token=?, status=0 where userIdx=?
  `;
  const updateJwtTokenRow = await connection.query(
    updateJwtTokenQuery,
    updateJwtTokenParams
  );
  return updateJwtTokenRow;
}
//login user 조회
async function selectLoginUser(connection, userIdx) {
  const selectJwtQuery = `
  SELECT userIdx, status FROM Jwt WHERE userIdx=?;
  `;
  const selectJwtRow = await connection.query(selectJwtQuery, userIdx);
  return selectJwtRow;
}
//login 추가
async function insertLoginUser(connection, updateJwtTokenParams) {
  const insertJwtQuery = `
  INSERT INTO Jwt(token, userIdx) VALUES(?,?);
  `;
  const insertJwtRow = await connection.query(
    insertJwtQuery,
    updateJwtTokenParams
  );
  return insertJwtRow;
}

module.exports = {
  selectUser,
  selectUserEmail,
  selectUserId,
  insertUser,
  selectUserPassword,
  selectUserAccount,
  updateUser,
  updateEmailVerify,
  insertEmailVerify,
  selectVerifiedEmail,
  insertNaverUser,
  selectNaverUserEmail,
  updateJwtStatus,
  updateJwtToken,
  selectLoginUser,
  insertLoginUser,
};
