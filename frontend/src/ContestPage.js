import React, {useEffect, useState} from "react";
import {Button, Tab, Tabs, Form, Table} from "react-bootstrap";
import {
  getContestInfo,
  getContestProblems,
  getRankingInfo,
  getSubmission,
  postSubmission
} from "./share-func/HttpRequest";
import PropTypes from 'prop-types';
import './ContestPage.css';
import getCookieArray from "./share-func/GetCookieArray";
import PagingElement from "./share-element/PagingElement";
const KEY_OF_MY_SUBMISSIONS = "mySubmit";

// URL: /contest/$shortContestName
function createEnglishIndex(index, num) {
  const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const ALPHABETS_NUM = 26;
  let res = ALPHABETS[index % ALPHABETS_NUM];
  if (num > ALPHABETS_NUM) {
    res += index / ALPHABETS_NUM;
  }
  return res;
}
function getShortContestName() {
  const splitPath = window.location.pathname.split("/");
  return splitPath.slice(-1)[0];
}
function RankingTable(props) {
  const problemsNum = props.problems.length;
  const problemTr = () => {
    const items = [];
    for(let i = 0; i < problemsNum ; i++) {
      items.push(<th>{createEnglishIndex(i, problemsNum)}</th>);
    }
    return items;
  };
  const rankingInfo = () => {
    /**
     * @param {Object} account - 順位表に表示するためのアカウント情報
     * @param {String} account.accountName - アカウント名
     * @param {Array} account.acceptList - ACした問題リスト firstには問題インデックス、secondには時間
     * @param {ranking} account.ranking - このアカウントの現在順位
     * @param {Number} account.penalty - ペナルティ
     */
    return props.rankingList.map((account, idx) => {
      const probElement = [];
      let sumScore = 0;
      for(let i = 0; i < problemsNum ; i++) {
        if (account.acceptList.some(ac => ac.first === i)) {
          probElement.push(<td>AC</td>);
          sumScore++;
        } else {
          probElement.push(<td> </td>);
        }
      }
      return (
        <tr key={account.accountName + idx}>
          <td>{account.ranking}</td>
          <td>{account.accountName}</td>
          <td>{sumScore}</td>
          {probElement}
          <td>{account.penalty}</td>
        </tr>
      );
    });
  };
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>順位</th>
          <th>アカウント</th>
          <th>総得点</th>
          {problemTr()}
          <th>ペナルティ</th>
        </tr>
      </thead>
      <tbody>
        {rankingInfo()}
      </tbody>
    </Table>
  );
}
RankingTable.propTypes = {
  rankingList: PropTypes.array,
  problems: PropTypes.array
};
function SubmissionTable(props) {
  const [displaySubmissions, setDisplaySubmissions] = useState([]);
  if (props.submissions.length === 0) {
    return <div/>;
  }
  const SUBMISSIONS_IN_ONE_PAGE = 5;
  const pageNum = Math.ceil(props.submissions.length / SUBMISSIONS_IN_ONE_PAGE);
  const changeDisplaySubmissions = (page) => {
    const newSubmissions = props.submissions.filter((_, idx) =>
      page * SUBMISSIONS_IN_ONE_PAGE <= idx && idx < (page + 1) * SUBMISSIONS_IN_ONE_PAGE);
    setDisplaySubmissions(newSubmissions);
  };
  const createTableBody = () => {
    /**
     * @param {Object} submit - 提出情報
     * @param {String} submit.statement - 提出した際の答案
     * @param {String} submit.result - 提出結果
     * @param {String} submit.submitTimeAMPM - 提出時間のフォーマット済の文字列
     */
    return displaySubmissions.map((submit, idx) => {
      return(
        <tr key={idx}>
          <td key={idx + "idx"}>{createEnglishIndex(submit.indexOfContest, props.problemNum)}</td>
          <td key={idx + "stm"}>{submit.statement}</td>
          <td key={idx + "res"}>{submit.result}</td>
          <td key={idx + "time"}>{submit.submitTimeAMPM}</td>
        </tr>
      );
    });
  };
  return (
    <div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>問題</th>
            <th>提出</th>
            <th>結果</th>
            <th>提出時間</th>
          </tr>
        </thead>
        <tbody>
          {createTableBody()}
        </tbody>
      </Table>
      <PagingElement pageNum={pageNum} pageChanged={changeDisplaySubmissions}/>
    </div>
  );
}
SubmissionTable.propTypes = {
  submissions: PropTypes.array,
  problemNum: PropTypes.number
};
function RankingElement(props) {
  const [partNum, setPartNum] = useState(0);
  const [rankingList, setRankingList] = useState([]);
  const [accountRank, setAccountRank] = useState();
  const ACCOUNTS_IN_ONE_PAGE = 20;
  const getRanking = (newPage) => {
    getRankingInfo(newPage, getShortContestName())
      .then((rankingInfo) => {
        setPartNum(rankingInfo.partAccountNum);
        setRankingList(rankingInfo.rankingList);
        setAccountRank(rankingInfo.requestAccountRank);
      });
  };
  useEffect(() => {
    getRanking(0);
  }, []);
  const pageNum = Math.ceil(partNum / ACCOUNTS_IN_ONE_PAGE);
  const rankingTable = <RankingTable problems={props.problems} rankingList={rankingList} />;
  let myRank = "";
  if (accountRank) {
    myRank = `順位: ${accountRank}`;
  }
  return (
    <div>
      <p>{myRank}</p>
      {rankingTable}
      <PagingElement pageNum={pageNum} pageChanged={getRanking} reloadButton={true}/>
    </div>
  );
}
RankingElement.propTypes = {
  problems: this.props.problems
};
function ProblemsTab(props) {
  const answerInput = React.createRef();
  const [comment, setComment] = useState("");
  const [key, setKey] = useState(KEY_OF_MY_SUBMISSIONS);
  const [changeColor, setChangeColor] = useState(true);
  const [firstTabRender, setFirstTabRender] = useState(false);
  const [nowSubmissions, setNowSubmission] = useState([]);
  const TAB_ID = 'tabId';

  useEffect(() => {
    const getSubmitResultArray = () => {
      //初期化時はprops、そうでない場合nowSubmissionsが新しい値 更新されている場合、要素数が多い
      let useSubmissions;
      if (nowSubmissions.length < props.submissions.length) {
        useSubmissions = props.submissions;
      } else {
        useSubmissions = nowSubmissions;
      }
      const tryingArray = new Array(props.problems.length);
      tryingArray.fill("NO_SUB");
      useSubmissions.map(submit => {
        if (submit.result === "ACCEPTED") {
          tryingArray[submit.indexOfContest] = "ACCEPTED";
        } else if (submit.result === "WRONG_ANSWER") {
          if (tryingArray[submit.indexOfContest] === "NO_SUB") {
            tryingArray[submit.indexOfContest] = "WRONG_ANSWER";
          }
        }
      });
      return tryingArray;
    };
    const setColor = () => {
      const submitResult = getSubmitResultArray();
      props.problems.map((_, index) => {
        const element = document.getElementById(TAB_ID + "-tab-" + index);
        if (submitResult) {
          switch(submitResult[index]) {
          case "ACCEPTED":
            element.classList.add("bg-success");
            element.classList.add("text-white");
            break;
          case "WRONG_ANSWER":
            element.classList.add("bg-warning");
            element.classList.add("text-white");
            break;
          }
        }
      });
    };
    setColor();
    setChangeColor(false);
    setFirstTabRender(false);
    //初期化時のみ
    if (nowSubmissions.length === 0) {
      setNowSubmission(props.submissions);
    }
  }, [changeColor, firstTabRender]);

  if (props.problems.length === 0 && props.submissions.length === 0) {
    return <div/>;
    // 最初の色つけタイミングのみこの様に処理する必要がある
  } else if (props.problems.length !== 0 && props.submissions.length !== 0 && !firstTabRender) {
    setFirstTabRender(true);
  }

  const getElement = () => {
    if (key !== KEY_OF_MY_SUBMISSIONS) {
      return (
        <div>
          <Form.Label>答え</Form.Label>
          <Form.Control type={"text"} ref={answerInput} />
          <Button type={"primary"} onClick={submitAnswer}>提出</Button>
        </div>
      );
    } else{
      return (
        <SubmissionTable submissions={nowSubmissions} problemNum={props.problems.length}/>
      );
    }
  };
  const submitAnswer = () => {
    if (answerInput.current.value === "") {
      setComment("答えが空です");
      return;
    }
    if (answerInput.current.value.indexOf(':') !== -1) {
      setComment(": を含む答えは提出できません");
      return;
    }
    setComment("");
    postSubmission(getShortContestName(), key, answerInput.current.value)
      .then((submitResult) => {
        const newSubmissions = nowSubmissions.slice();
        newSubmissions.unshift(submitResult);
        setNowSubmission(newSubmissions);
        setComment(submitResult.result);
      })
      .catch((e) => {
        if (e.message === "403") {
          setComment("10秒間隔を空けて提出して下さい");
        } else if(e.message === "400") {
          setComment("ログインして下さい");
        } else {
          setComment("提出に失敗しました 再ログインを試してみて下さい");
        }
      });
  };
  const getProblemTabList = () => {
    return props.problems.map((problem, index) => {
      const problemTitle = createEnglishIndex(index, props.problems.size);
      return (
        <Tab
          eventKey={index} key={problem.indexOfContest} title={problemTitle}>
          <p>{problem.statement}</p>
        </Tab>
      );
    });
  };
  const selectTab = (key) => {
    setComment("");
    setChangeColor(true);
    setKey(key);
    if (answerInput.current) {
      answerInput.current.value = "";
    }
  };
  return (
    <div>
      <Tabs
        id={TAB_ID}
        activeKey={key}
        onSelect={selectTab}>
        {getProblemTabList()}
        <Tab
          eventKey={"mySubmit"} key={"mySubmit"} title={"自分の提出"}>
        </Tab>
      </Tabs>
      {getElement()}
      <p>{comment}</p>
    </div>
  );
}
ProblemsTab.propTypes = {
  problems: PropTypes.array,
  submissions: PropTypes.array,
  contestName: PropTypes.string
};


export function ContestPage() {
  const [contestName, setContestName] = useState("コンテストが見つかりません");
  const [statement, setStatement] = useState("");
  const [time, setTime] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [problems, setProblems] = useState([]);
  useEffect(() => {
    const shortContestName = getShortContestName();
    (async () => {
      const contestInfo = await getContestInfo(shortContestName).catch(() => null);
      if (contestInfo === null) {
        setContestName("コンテストが見つかりません");
        return;
      }
      const problems = await getContestProblems(shortContestName)
        .catch(() => []);
      let submissions;
      const cookieArray = getCookieArray();
      if (cookieArray["_sforce_account_name"]) {
        submissions = await getSubmission(getShortContestName(), cookieArray["_sforce_account_name"])
          .catch(() => []);
      } else {
        submissions = [];
      }
      setContestName(contestInfo.name);
      setStatement(contestInfo.statement);
      setTime(`${contestInfo.startTimeAMPM} ~ ${contestInfo.endTimeAMPM}`);
      setProblems(problems);
      setSubmissions(submissions);
    })();
  }, []);
  return(
    <div>
      <p id={"contestPage-contestName"}>{}</p>
      <p><pre>{statement}</pre></p>
      <p id={"contestPage-timeSpan"}>{time}</p>
      <ProblemsTab
        problems={problems}
        contestName={contestName}
        submissions={submissions}/>
      <RankingElement problems={problems}/>
    </div>
  );
}
