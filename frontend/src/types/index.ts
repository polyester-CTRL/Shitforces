export interface ContestCreator {
  accountName: string;
  contestId: string;
  position: string;
}
export interface AccountInfo {
  name: string;
  rating: number;
  partNum: number;
  auth: string;
}

export interface SubmissionResult {
  result: string;
  statement: string;
  submitTime: string;
}

export interface ContestStandingsInfo {
  /**
   * 参加者数
   */
  partAccountNum: number;
  /**
   * 順位表
   */
  accountStandings: AccountInfoOnContestStandings[];
  /**
   * リクエストしたユーザーの順位
   */
  requestAccountRank: number;
  /**
   * AC/Submitの数 .firstにAC人数、.secondに提出人数
   */
  acPerSubmit: { first: number; second: number }[];
  /**
   * FAリスト
   */
  firstAcceptedList: AccountInfo[];
}

/**
 * 順位表に表示するためのアカウント情報
 */
export interface AccountInfoOnContestStandings {
  accountName: string;
  /**
   * ACした問題リスト
   */
  acceptList: boolean[];
  /**
   * このアカウントの現在順位
   */
  rank: number;
  /**
   * 提出までに経過した秒数
   */
  acceptTimeList: (number | null)[];
  score: number;
  penalty: number;
}

export interface ContestInfo {
  id: string;
  name: string;
  /**
   * ペナルティ(秒単位)
   */
  penalty: number;
  /**
   * コンテストの説明
   */
  statement: string;
  /**
   * コンテスト開始時間のフォーマット済文字列
   */
  startTimeAMPM: string;
  /**
   * コンテスト終了時間のフォーマット済文字列
   */
  endTimeAMPM: string;
  /**
   * コンテスト形式 ICPC,AtCoder形式など
   */
  contestType: string;
  /**
   * rated上限 0ならばunrated
   */
  ratedBound: number;
  /**
   * Unix時間でのコンテスト開始時間
   */
  unixStartTime: number;
  /**
   * Unix時間でのコンテスト終了時間
   */
  unixEndTime: number;
  /**
   * レート計算済みかどうか
   */
  ratingCalculated: boolean;
  /**
   * コンテスト編集者
   */
  contestCreators: ContestCreator[];
}

export interface LatestContestsInfo {
  contests: ContestInfo[];
  allContestNum: number;
}

export interface SubmissionInfo {
  contestId: string;
  indexOfContest: number;
  accountName: string;
  /**
   * 答案
   */
  statement: string;
  /**
   * 提出時間
   */
  submitTime: string;
  submitTimeAMPM: string;
  result: string;
}

export interface ProblemInfo {
  contestId: string;
  id: number;
  /**
   * 問題の得点
   */
  point: number;
  /**
   * 問題文
   */
  statement: string;
  /**
   * コンテストの何番目の問題か
   */
  indexOfContest: number;
  /**
   * 問題形式がQuiz(有効な提出が一度のみ) かどうか
   */
  quiz: boolean;
}

export interface AccountRankingInfo {
  accounts: AccountInfo[];
  validAccountNum: number;
}

export interface AccountContestPartHistory {
  accountName: string;
  /**
   * コンテスト名(IDではない)
   */
  contestName: string;
  /**
   * 何回目の参加履歴か
   */
  indexOfParticipation: number;
  /**
   * 一つ前のレーティング
   */
  prevRating: number;
  /**
   * 新しいレーティング
   */
  newRating: number;
  /**
   * パフォ
   */
  performance: number;
  /**
   * 順位
   */
  rank: number;
}

export interface ContestSubmissionOfRaid {
  statement: string;
  submitCount: number;
  accepted: boolean;
}
