import PropTypes from 'prop-types';
import {
  VFC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEventHandler,
  ChangeEvent,
  ChangeEventHandler,
} from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Tab from 'react-bootstrap/Tab';
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { useAuthentication } from '../contexts/AuthenticationContext';
import { isValidAccountNameOrPassWord } from '../functions/AccountInfoSubmitValidation';
import {
  getAccountInformation,
  createContest,
  getAccountContestPartHistory,
} from '../functions/HttpRequest';
import { getCookie } from '../functions/getCookie';
import { getRatingColor } from '../functions/getRatingColor';
import { AccountContestPartHistory } from '../types';

// URL: /account/$accountName

const CreateContestElement: VFC = () => {
  class ContestCreator {
    accountName: string;
    position: string;
    id: number;
    constructor(accountName: string, position: string, id: number) {
      this.accountName = accountName;
      this.position = position;
      this.id = id;
    }
  }
  const contestIdRef = useRef<HTMLInputElement>(null);
  const contestNameRef = useRef<HTMLInputElement>(null);
  const ratedBoundRef = useRef<HTMLInputElement>(null);
  const penaltyRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const [contestType, setContestType] = useState<String>('AtCoder');
  const initCreatorArray = [new ContestCreator('', 'Coordinator', 0)];
  const [creatorList, setCreatorList] = useState<Array<ContestCreator>>(
    initCreatorArray
  );
  const submitNewContest = () => {
    const contestId = contestIdRef?.current?.value ?? null;
    const contestName = contestNameRef.current!.value;
    const ratedBound = parseInt(ratedBoundRef.current!.value);
    const penalty = parseInt(penaltyRef.current!.value);
    const contestStartTime = new Date(Date.parse(startTimeRef.current!.value));
    const contestEndTime = new Date(Date.parse(endTimeRef.current!.value));
    const adjustedCreatorList = creatorList
      .filter((creator) => creator.accountName !== '')
      .map((creator) => {
        return {
          accountName: creator.accountName,
          contestId: contestId,
          position: creator.position,
        };
      });
    if (
      !contestId ||
      !contestName ||
      isNaN(ratedBound) ||
      isNaN(penalty) ||
      !contestType ||
      !contestStartTime ||
      !contestEndTime
    ) {
      alert('不正な入力があります');
      return;
    }
    if (
      adjustedCreatorList.filter(
        (creator) => creator.position === 'Coordinator'
      ).length === 0
    ) {
      alert('最低一人Coordinatorを指定して下さい');
      return;
    }
    createContest(
      contestId,
      contestName,
      new Date(contestStartTime),
      new Date(contestEndTime),
      penalty,
      ratedBound,
      contestType.toString(),
      adjustedCreatorList
    )
      .then(() => {
        alert('コンテストの作成に成功しました');
        window.location.href = '/';
      })
      .catch((e) => {
        console.log(e);
        alert('コンテストの作成に失敗しました');
      });
  };
  const creatorsFormRows = () => {
    const addNewCreator = () => {
      const newCreatorList = creatorList.slice();
      const newId = creatorList[creatorList.length - 1].id + 1;
      newCreatorList.push(new ContestCreator('', 'Coordinator', newId));
      setCreatorList(newCreatorList);
    };
    const eraseCreator = (index: number) => {
      if (index === 0) return;
      const newCreatorList = creatorList.slice();
      newCreatorList.splice(index, 1);
      setCreatorList(newCreatorList);
    };
    const changeName = (newName: string, idx: number) => {
      const newCreatorList = creatorList.slice();
      newCreatorList[idx].accountName = newName;
      setCreatorList(newCreatorList);
    };
    const changePosition = (newPosition: string, idx: number) => {
      const newCreatorList = creatorList.slice();
      newCreatorList[idx].position = newPosition;
      setCreatorList(newCreatorList);
    };
    const listGroups = creatorList.map((creator, idx) => {
      return (
        <Form.Row key={creator.id}>
          <Col>
            <InputGroup className={'mb-3'}>
              <Form.Control
                placeholder={'shop_one'}
                onChange={(e) => changeName(e.target.value, idx)}
              />
            </InputGroup>
          </Col>
          <Col>
            <Form.Group
              controlId={'creatorPosition'}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                changePosition(e.target.value, idx)
              }
            >
              <Form.Control as={'select'}>
                <option>Coordinator</option>
                <option>Writer</option>
              </Form.Control>
            </Form.Group>
          </Col>
          <Col>
            <button type={'button'} onClick={addNewCreator}>
              +
            </button>
            <button type={'button'} onClick={() => eraseCreator(idx)}>
              -
            </button>
          </Col>
        </Form.Row>
      );
    });
    return (
      <div>
        <label>コンテスト関係者</label>
        {listGroups}
      </div>
    );
  };
  return (
    <div>
      <Form.Row>
        <Col>
          <label>コンテストID</label>
          <InputGroup className={'mb-3'}>
            <Form.Control placeholder={'kbc001'} ref={contestIdRef} />
          </InputGroup>
        </Col>
        <Col>
          <label>コンテスト名</label>
          <InputGroup className={'mb-3'}>
            <Form.Control
              placeholder={'くそなぞなぞBeginnerContest001'}
              ref={contestNameRef}
            />
          </InputGroup>
        </Col>
      </Form.Row>
      <Form.Row>
        <Col>
          <label>開始日時</label>
          <InputGroup className={'mb-3'}>
            <Form.Control
              placeholder={'2021-1-10 21:00:00'}
              type="datetime-local"
              ref={startTimeRef}
              pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
              required
            />
          </InputGroup>
        </Col>
        <Col>
          <label>終了日時</label>
          <InputGroup className={'mb-3'}>
            <Form.Control
              placeholder={'2021-1-10 21:30:00'}
              type="datetime-local"
              ref={endTimeRef}
              pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
              required
            />
          </InputGroup>
        </Col>
      </Form.Row>
      <Form.Row>
        <Col>
          <label>レート上限</label>
          <InputGroup className={'mb-3'}>
            <Form.Control
              placeholder={'0'}
              aria-label={'ratedBound'}
              ref={ratedBoundRef}
              type={'number'}
            />
          </InputGroup>
        </Col>
        <Col>
          <label>ペナルティ</label>
          <InputGroup className={'mb-3'}>
            <Form.Control
              placeholder={'0'}
              aria-label={'penalty'}
              ref={penaltyRef}
              type={'number'}
            />
          </InputGroup>
        </Col>
        <Col>
          <InputGroup className={'mb-3'}>
            <Form>
              <Form.Label>コンテスト形式</Form.Label>
              <Form.Group
                controlId={'contestTypeForm'}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setContestType(e.target.value)
                }
              >
                <Form.Control as={'select'}>
                  <option>AtCoder</option>
                  <option>ICPC</option>
                  <option>RAID</option>
                </Form.Control>
              </Form.Group>
            </Form>
          </InputGroup>
        </Col>
      </Form.Row>
      {creatorsFormRows()}
      <Button variant={'primary'} onClick={submitNewContest}>
        コンテスト生成
      </Button>
    </div>
  );
};

interface AccountInformationBodyProps {
  name: string;
  rating: number;
}

const AccountInformationBody: VFC<AccountInformationBodyProps> = ({
  name,
  rating,
}) => {
  const { accountName, signOut } = useAuthentication();
  const ratingColor = getRatingColor(rating);

  return (
    <div>
      <p>アカウント名: {name}</p>
      <p>
        レート: <span style={{ color: ratingColor }}>{rating}</span>
      </p>
      {accountName !== null && (
        <Button variant="primary" onClick={signOut}>
          ログアウト
        </Button>
      )}
    </div>
  );
};

interface AccountRatingChangeHistoryProps {
  name: string;
}
const AccountRatingChangeHistory: VFC<AccountRatingChangeHistoryProps> = (
  props
) => {
  const [histories, setHistories] = useState<AccountContestPartHistory[]>([]);
  const getHistory: () => Promise<AccountContestPartHistory[]> = async () => {
    const rawHistories = await getAccountContestPartHistory(props.name);
    return rawHistories.sort(
      (a: AccountContestPartHistory, b: AccountContestPartHistory) => {
        return b.indexOfParticipation - a.indexOfParticipation;
      }
    );
  };
  useEffect(() => {
    (async () => {
      setHistories(await getHistory());
    })();
  }, []);
  const historyTableBody = () => {
    return histories.map((history: AccountContestPartHistory) => {
      const diff = history.newRating - history.prevRating;
      let sign;
      if (diff > 0) sign = '+';
      else if (diff < 0) sign = '-';
      else sign = '±';
      const diffText = sign + diff;
      const resultText =
        `${props.name}さんの${history.contestName}の結果\n` +
        `パフォーマンス: ${history.performance}\n` +
        `レーティング: ${history.prevRating} → ${history.newRating}(${diffText})`;
      return (
        <tr style={{ textAlign: 'center' }} key={history.indexOfParticipation}>
          <td>{history.rank}</td>
          <td>{history.contestName}</td>
          <td>{history.performance}</td>
          <td>{history.newRating}</td>
          <td>{sign + diff}</td>
          <td>
            <TwitterShareButton
              url={window.location.href}
              title={resultText}
              hashtags={['Shitforces', 'くそなぞなぞ']}
            >
              <TwitterIcon size={32} round />
            </TwitterShareButton>
          </td>
        </tr>
      );
    });
  };
  return (
    <div>
      <Table striped bordered hover>
        <thead>
          <tr style={{ textAlign: 'center' }}>
            <th>順位</th>
            <th>コンテスト名</th>
            <th>パフォーマンス</th>
            <th>新レーティング</th>
            <th>差分</th>
          </tr>
        </thead>
        <tbody>{historyTableBody()}</tbody>
      </Table>
      <p>
        HackerRankからShitforcesへレートの引き継ぎをした場合、初回の差分は正しく表示されません。ご了承下さい。
      </p>
    </div>
  );
};

AccountInformationBody.propTypes = {
  name: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
};

const AccountNameChangeForm: VFC = () => {
  const { accountName, changeAccountName } = useAuthentication();

  const [newAccountName, setNewAccountName] = useState('');
  const [password, setPassword] = useState('');

  const onChangeNewAccountName = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >((event) => {
    setNewAccountName(event.target.value);
  }, []);

  const onChangePassword = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      setPassword(event.target.value);
    },
    []
  );

  const canSubmit = useMemo(
    () =>
      accountName !== newAccountName &&
      isValidAccountNameOrPassWord(newAccountName) &&
      isValidAccountNameOrPassWord(password),
    [accountName, newAccountName, password]
  );

  const onSubmit = useCallback<FormEventHandler<HTMLElement>>(
    (event) => {
      event.preventDefault();

      if (!accountName || !canSubmit) return;

      changeAccountName(accountName, newAccountName, password)
        .then(() => {
          alert('アカウント名の変更が完了しました');
        })
        .catch((e) => {
          console.error(e);
          alert(
            'アカウント名の変更に失敗しました。名前が重複しているかパスワードが間違っています。'
          );
        });
    },
    [accountName, changeAccountName, canSubmit, newAccountName, password]
  );

  return (
    <Form onSubmit={onSubmit}>
      <Form.Group>
        <Form.Label>新しいアカウント名</Form.Label>
        <Form.Control
          value={newAccountName}
          onChange={onChangeNewAccountName}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>パスワード</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={onChangePassword}
        />
      </Form.Group>
      <Button type="submit" variant="primary" disabled={!canSubmit}>
        アカウント名変更
      </Button>
    </Form>
  );
};

interface AccountInfoTabsProps {
  name: string;
  rating: number;
  auth: string;
}
const AccountInfoTabs: VFC<AccountInfoTabsProps> = (props) => {
  const [key, setKey] = useState<string | null>('profile');
  const cookie = getCookie();
  const tabs = [];

  tabs.push(
    <Tab eventKey={'profile'} title={'プロフィール'}>
      <AccountInformationBody name={props.name} rating={props.rating} />
    </Tab>
  );

  tabs.push(
    <Tab eventKey={'history'} title={'参加履歴'}>
      <AccountRatingChangeHistory name={props.name} />
    </Tab>
  );
  if (cookie['_sforce_account_name'] === props.name) {
    tabs.push(
      <Tab eventKey={'changeName'} title={'アカウント名の変更'}>
        <AccountNameChangeForm />
      </Tab>
    );
    if (props.auth === 'ADMINISTER') {
      tabs.push(
        <Tab eventKey={'createContest'} title={'コンテスト作成'}>
          <CreateContestElement />
        </Tab>
      );
    }
  }
  return (
    <Tabs id={'account-info-tab'} activeKey={key} onSelect={(k) => setKey(k)}>
      {tabs}
    </Tabs>
  );
};
AccountInfoTabs.propTypes = {
  name: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
  auth: PropTypes.string.isRequired,
};

const AccountNotFound: VFC = () => {
  return (
    <div>
      <p>アカウントが見つかりませんでした</p>
    </div>
  );
};

const AccountPage: VFC = () => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const getAccountName = () => {
    const splitUrl = window.location.href.split('/');
    return splitUrl[splitUrl.length - 1];
  };
  const getAccount = useCallback(() => {
    getAccountInformation(getAccountName())
      .then((account) => {
        setName(account.name);
        setRating(account.rating);
        setAuth(account.auth);
      })
      .catch(() => {
        setName('');
        setRating(null);
      });
  }, []);

  useEffect(() => {
    getAccount();
  }, [getAccountName()]);

  let page;
  if (name !== '' && rating !== null) {
    page = <AccountInfoTabs name={name} rating={rating} auth={auth!} />;
  } else {
    page = <AccountNotFound />;
  }

  return <div>{page}</div>;
};

// eslint-disable-next-line import/no-default-export
export default AccountPage;
