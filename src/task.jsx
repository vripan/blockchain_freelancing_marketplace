import { HStack, OutlinedButton, VStack, Container } from './styles';
import { useEffect, useState } from 'react';
import Contracts from './contracts';
import { useParams } from 'react-router-dom';

function EvaluatorActions({ state, taskId, taskData, setErrors, walletAddress }) {
    let { taskManager, TaskStateM } = Contracts;

    const review = (acceptResults) => {
        taskManager.reviewAsEvaluator(taskId, acceptResults)
            .then(null)
            .catch(e => setErrors([e]));
    }

    if (state == TaskStateM.WaitingForEvaluation && walletAddress.toUpperCase() == taskData.evaluator.toUpperCase()) {
        return (
            <Container>
                <HStack
                    style={{
                        alignItems: 'space-between',
                        display: "flex",
                        justifyContent: "space-around",
                        flexDirection: "row",
                    }}
                >
                    <span
                        style={{
                            cursor: "pointer",
                            color: "green"
                        }}
                        onClick={() => review(true)}
                    >
                        Accept
                    </span>
                    <span
                        style={{
                            cursor: "pointer",
                            color: "red"
                        }}
                        onClick={() => review(false)}
                    >
                        Reject
                    </span>
                </HStack>
            </Container>
        )
    }
    return 'No actions to take at this time';
}

function FreelancerCard({ info, onClick }) {
    return (
        <VStack
            onClick={onClick}
            style={{
                alignItems: 'space-between',
                display: "flex",
                justifyContent: "space-around",
                flexDirection: "row",
                cursor: "pointer",
            }}
        >
            {'Name: ' + info.name}
            <span style={{ color: 'yellow' }}>
                {'Rep: ' + info.rep}
            </span>
            <span style={{ color: 'greenyellow' }}>
                Accept this frelancer
            </span>
        </VStack>
    );
}

function EvaluatorCard({ info, onClick }) {
    return (
        <HStack
            onClick={onClick}
            style={{
                alignItems: 'space-between',
                display: "flex",
                justifyContent: "space-around",
                flexDirection: "row",
                cursor: "pointer",
            }}
        >
            {'Name: ' + info.name}
            <span style={{ color: 'greenyellow' }}>
                Assign this evaluator
            </span>
        </HStack>
    );
}

function ManagerActions({ state, categoryId, taskId, taskData, setErrors }) {
    let { taskManager, TaskStateM, memberManager } = Contracts;
    const [evaluators, setEvaluators] = useState(null);
    const [freelancers, setFreelancers] = useState(null);

    useEffect(() => {
        if (evaluators == null) {
            (async () => {
                let evalAdresses = await memberManager.getEvaluatorsArray();
                let ea = [];

                for (let i = 0; i < evalAdresses.length; i++) {
                    let info = await memberManager.getEvaluatorInfo(evalAdresses[i]);
                    if (info.data.categoryId.toNumber() == categoryId) {
                        let data = info.data;
                        data.address = evalAdresses[i];
                        ea.push(data);
                    }
                }
                setEvaluators(ea);
            })();
        }
        if (freelancers == null) {
            (async () => {
                let freeAdresses = await taskData.freelancersData.freelancers;
                let fr = [];

                for (let i = 0; i < freeAdresses.length; i++) {
                    let info = await memberManager.getFreelancerInfo(freeAdresses[i]);
                    if (info.data.categoryId.toNumber() == categoryId) {
                        let data = info.data;
                        data.address = freeAdresses[i];
                        data.rep = info.rep;
                        data.idx = i;
                        fr.push(data);
                    }
                }
                setFreelancers(fr);
            })();
        }
    });

    const chooseEvaluator = (evaluatorAddress) => {
        taskManager.linkEvaluatorToTask(taskId, evaluatorAddress)
            .then(() => setEvaluators(null))
            .catch(e => setErrors([e]));
    };
    const chooseFreelancer = (freelancer) => {
        taskManager.hireFreelancer(taskId, freelancer.idx)
            .then(() => setFreelancers(null))
            .catch(e => setErrors([e]));
    };
    const chooseAccept = (acceptResults) => {
        taskManager.reviewTask(taskId, acceptResults)
            .then(null)
            .catch(e => setErrors([e]));
    }
    console.log('b');

    if (state == TaskStateM.Funded) {
        return (
            <Container>
                {evaluators && (evaluators.length != 0
                    ? (evaluators.map((el, k) =>
                        <EvaluatorCard
                            key={k}
                            info={el}
                            onClick={() => chooseEvaluator(el.address)}
                        />))
                    : ('No evaluators are available for this category')
                )}
            </Container>
        );
    }
    if (state == TaskStateM.Ready) {
        return (
            <Container>
                {freelancers && (freelancers.length != 0
                    ? (freelancers.map((el, k) =>
                        <FreelancerCard
                            key={k}
                            info={el}
                            onClick={() => chooseFreelancer(el)}
                        />))
                    : ('No freelancers are available for this category')
                )}
            </Container>
        );
    }
    if (state == TaskStateM.Finished) {
        return (
            <Container>
                <HStack
                    style={{
                        alignItems: 'space-between',
                        display: "flex",
                        justifyContent: "space-around",
                        flexDirection: "row",
                    }}
                >
                    <span
                        style={{
                            cursor: "pointer",
                            color: "green"
                        }}
                        onClick={() => chooseAccept(true)}
                    >Accept</span>
                    <span
                        style={{
                            cursor: "pointer",
                            color: "red"
                        }}
                        onClick={() => chooseAccept(false)}
                    >
                        Reject
                    </span>
                </HStack>
            </Container>
        )
    }
    return 'No actions to take at this time';
}

// de testat freelancer-ul
function FreelancerActions({ walletAddress, state, taskData, setErrors }) {
    let { taskManager, TaskStateM, tokenC } = Contracts;
    let rewardEvaluator = taskData.data.rewardEvaluator;

    const apply = () => {
        tokenC.allowance(walletAddress, taskManager.address)
            .then((currentAllowance) => {
                const goApply = () => {
                    taskManager.applyForTask(taskData.taskId)
                        .then((res) => {
                            console.log(res);
                        })
                        .catch((e) => setErrors([e]));
                };

                if (currentAllowance.toNumber() < rewardEvaluator.toNumber()) {
                    tokenC.approve(taskManager.address, rewardEvaluator.toNumber())
                        .then(goApply)
                        .catch((e) => setErrors([e]));
                }
                else {
                    goApply();
                }
            })
            .catch((e) => setErrors([e]));
    };
    const finish = () => {
        taskManager.finishTask(taskData.taskId)
            .then((res) => {
                console.log(res);
            })
            .catch((e) => setErrors([e]));
    };
    if (state == TaskStateM.Ready && undefined == taskData.freelancersData.freelancers.find(el => el.toUpperCase() == walletAddress.toUpperCase())) {
        return (
            <Container>
                <VStack
                    style={{
                        marginBottom: "var(--space-8)",
                    }}
                >
                    <OutlinedButton
                        onClick={apply}
                        style={{
                            marginBottom: "var(--space-8)",
                        }}
                    >
                        Apply
                    </OutlinedButton>
                </VStack>
            </Container>
        )
    }
    if (state == TaskStateM.WorkingOnIt && walletAddress.toUpperCase() == taskData.freelancersData.chosen.toUpperCase()) {
        return (
            <Container>
                <VStack
                    style={{
                        marginBottom: "var(--space-8)",
                    }}
                >
                    <OutlinedButton
                        onClick={finish}
                        style={{
                            marginBottom: "var(--space-8)",
                        }}
                    >
                        Finish
                    </OutlinedButton>
                </VStack>
            </Container>
        )
    }
    return 'No actions to take at this time';
}

function SponsorActions({ walletAddress, taskData, state, setErrors }) {
    let { taskManager, TaskStateM, tokenC } = Contracts;
    const [tokenAmount, setTokenAmount] = useState('0');

    const sponsorData = taskData.sponsorshipData.sponsors.find((el) => el.sponsorAddr.toUpperCase() == walletAddress.toUpperCase());
    const isSponsor = sponsorData != undefined;
    const prevTokens = isSponsor ? sponsorData.sponsorshipAmount : 0;

    const sponsor = () => {
        tokenC.allowance(walletAddress, taskManager.address)
            .then((currentAllowance) => {

                const goSponsor = () => {
                    taskManager.sponsorTask(taskData.taskId, parseInt(tokenAmount))
                        .then((res) => {
                            console.log(res);
                            setTokenAmount("0");
                        })
                        .catch((e) => setErrors([e]));
                }

                if (currentAllowance.toNumber() < parseInt(tokenAmount)) {
                    tokenC.approve(taskManager.address, parseInt(tokenAmount))
                        .then(goSponsor)
                        .catch((e) => setErrors([e]));
                }
                else {
                    goSponsor();
                }
            })
            .catch((e) => setErrors([e]));
    };
    const withdraw = () => {
        taskManager.withdrawSponsorship(taskData.taskId)
            .then((res) => {
                console.log(res);
                setTokenAmount("0");
            })
            .catch((e) => setErrors([e]));
    };

    if (state == TaskStateM.NotFounded) {
        return (
            <VStack
                style={{
                    marginBottom: "var(--space-8)",
                }}
            >
                <p style={{
                    marginBottom: "var(--space-8)",
                }}>
                    {'Invested tokens: ' + prevTokens}
                </p>

                <Container>
                    <HStack
                        style={{
                            marginBottom: "var(--space-8)",
                        }}
                    >
                        <p>Amount:</p>
                        <pre> </pre>
                        <input value={tokenAmount} onChange={({ target: { value } }) => setTokenAmount(value)} />
                    </HStack>
                    <OutlinedButton
                        onClick={sponsor}
                        style={{
                            marginBottom: "var(--space-8)",
                        }}
                    >
                        Sponsor
                    </OutlinedButton>
                </Container>

                {isSponsor ? (
                    <Container>
                        <OutlinedButton
                            onClick={withdraw}
                            style={{
                                marginBottom: "var(--space-8)",
                            }}
                        >
                            Withdraw All
                        </OutlinedButton>
                    </Container>) : null}

            </VStack>
        )
    }
    return 'No actions to take at this time';
}

export default function Task({ walletAddress, taskDatas, role, setErrors }) {
    let { memberManager, taskManager, TaskState, TaskStateM, categoryManager } = Contracts;
    const params = useParams();
    const { taskId } = params;
    const [managerName, setManagerName] = useState('Loading...');
    const [categoryName, setCategoryName] = useState('Loading...');
    const [evaluatorName, setEvaluatorName] = useState('Loading...');

    useEffect(() => {
        if (evaluatorName == 'Loading...' &&
            (taskDatas && taskId < taskDatas[taskId].length) &&
            taskData.evaluator == 0) {
            setEvaluatorName(undefined);
        }
    });

    if (!taskDatas || taskId >= taskDatas.length) {
        return 'Not found task';
    }
    let taskData = taskDatas[taskId];
    let state = taskData.state;

    memberManager.getManagerInfo(taskData.manager)
        .then((info) => setManagerName(info.data.name))
        .catch(e => setErrors([e]));

    categoryManager.getCategoryName(taskData.data.category)
        .then(setCategoryName)
        .catch(e => setErrors([e]));

    if (taskData.evaluator != 0) {
        memberManager.getEvaluatorInfo(taskData.evaluator)
            .then(info => info && setEvaluatorName(info.data.name))
            .catch(e => setErrors([e]));
    }
    console.log('a');
    return (
        <VStack>
            <h1>{'Task #' + taskId}</h1>
            <h3
                style={{
                    color: 'gray'
                }}
            >
                Description: {' ' + taskData.data.description}
            </h3>
            <p style={{
                marginBottom: "var(--space-8)",
            }}>
                {'Category: ' + categoryName}
            </p>
            <p style={{
                marginBottom: "var(--space-8)",
            }}>
                {'State: ' + TaskState[state]}
            </p>
            <p style={{
                marginBottom: "var(--space-8)",
            }}>
                {'Manager: ' + managerName}
            </p>
            <p style={{
                marginBottom: "var(--space-8)",
            }}>
                {'Funding goal: ' + (taskData.data.rewardFreelancer.toNumber() + taskData.data.rewardEvaluator.toNumber())}
            </p>
            <p style={{
                marginBottom: "var(--space-8)",
            }}>
                {'Funded: ' + taskData.sponsorshipData.totalAmount}
            </p>
            {evaluatorName && (
                <p style={{
                    marginBottom: "var(--space-8)",
                }}>
                    {'Evaluator: ' + evaluatorName}
                </p>
            )}

            {/* Action section */}
            {role == memberManager.Role.Freelancer ? (
                <VStack>
                    <h4
                        style={{
                            alignSelf: 'center'
                        }}
                    >
                        Freelancer panel:
                    </h4>
                    <FreelancerActions
                        state={state}
                        setErrors={setErrors}
                        taskData={taskData}
                        walletAddress={walletAddress}
                    />
                </VStack>
            ) : null
            }
            {
                role == memberManager.Role.Sponsor ? (
                    <VStack>
                        <h4
                            style={{
                                alignSelf: 'center'
                            }}
                        >
                            Sponsor panel:
                        </h4>
                        <SponsorActions
                            walletAddress={walletAddress}
                            taskData={taskData}
                            state={state}
                            setErrors={setErrors}
                        />
                    </VStack>
                ) : null
            }
            {role == memberManager.Role.Manager ? (
                <VStack>
                    <h4
                        style={{
                            alignSelf: 'center'
                        }}
                    >
                        Manager panel:
                    </h4>
                    <ManagerActions
                        taskId={taskId}
                        taskData={taskData}
                        categoryId={taskData.data.category}
                        state={state}
                        setErrors={setErrors}
                    />
                </VStack>
            ) : null}
            {role == memberManager.Role.Evaluator ? (
                <VStack>
                    <h4
                        style={{
                            alignSelf: 'center'
                        }}
                    >
                        Evaluator panel:
                    </h4>
                    <EvaluatorActions
                        taskId={taskId}
                        taskData={taskData}
                        state={state}
                        setErrors={setErrors}
                        walletAddress={walletAddress}
                    />
                </VStack>
            ) : null
            }
        </VStack >
    );
}