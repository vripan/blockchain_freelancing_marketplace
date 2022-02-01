import { HStack, OutlinedButton, VStack, Container } from './styles';
import { useEffect, useState } from 'react';
import Contracts from './contracts';
import { useParams } from 'react-router-dom';

function EvaluatorActions({ state, taskId, taskData, addMessage, walletAddress }) {
    let { taskManager, TaskStateM } = Contracts;

    const review = (acceptResults) => {
        taskManager.reviewAsEvaluator(taskId, acceptResults)
            .then(() => addMessage("Reviewed task succesfully"))
            .catch(addMessage);
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

function FreelancerCard({ info, onClick, isManager }) {
    return (
        <HStack
            onClick={onClick}
            style={isManager
                ? {
                    alignItems: 'space-between',
                    display: "flex",
                    justifyContent: "space-around",
                    flexDirection: "row",
                    cursor: "pointer",
                } : {}
            }
        >
            {'Name: ' + info.name}
            {' '}
            <span style={{ color: 'yellow' }}>
                {'Rep: ' + info.rep}
            </span>
            {isManager &&
                (<span style={{ color: 'greenyellow' }}>
                    Accept this frelancer
                </span>)
            }
        </HStack>
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

function ManagerActions({ state, categoryId, taskId, taskData, addMessage }) {
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
                let freeAdresses = taskData.freelancersData.freelancers;
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

    const deleteTask = () => {
        taskManager.removeTask(taskId)
            .then(() => {
                addMessage("Task Removed", "Home")
            })
            .catch(addMessage);
    };
    const chooseEvaluator = (evaluatorAddress) => {
        taskManager.linkEvaluatorToTask(taskId, evaluatorAddress)
            .then(() => {
                setEvaluators(null);
                addMessage("Evaluator chosen", "Success")
            })
            .catch(addMessage);
    };
    const chooseFreelancer = (freelancer) => {
        taskManager.hireFreelancer(taskId, freelancer.idx)
            .then(() => {
                setFreelancers(null);
                addMessage("Freelancer chosen", "Success");
            })
            .catch(addMessage);
    };
    const chooseAccept = (acceptResults) => {
        taskManager.reviewTask(taskId, acceptResults)
            .then(() => {
                if (acceptResults) {
                    addMessage("Accepted task", "Success")
                }
                else {
                    addMessage("Did not accept task", "Success")
                }
            })
            .catch(addMessage);
    }
    console.log('b');

    if (state == TaskStateM.NotFounded) {
        return (
            <Container>
                <VStack>
                    <p>
                        No actions required at this time.
                    </p>
                </VStack>
                <OutlinedButton
                    onClick={deleteTask}
                >
                    Delete task
                </OutlinedButton>
            </Container>
        );
    }
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
                    : ('No evaluators are available for this category or none have applied')
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
                            isManager={true}
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
function FreelancerActions({ walletAddress, state, taskData, addMessage }) {
    let { taskManager, TaskStateM, tokenC } = Contracts;
    let rewardEvaluator = taskData.data.rewardEvaluator;

    const apply = () => {
        tokenC.allowance(walletAddress, taskManager.address)
            .then((currentAllowance) => {
                const goApply = () => {
                    taskManager.applyForTask(taskData.taskId)
                        .then(() => {
                            addMessage("Applied for task Succesful", "Success");
                        })
                        .catch(addMessage);
                };

                if (currentAllowance.toNumber() < rewardEvaluator.toNumber()) {
                    tokenC.approve(taskManager.address, rewardEvaluator.toNumber())
                        .then(goApply)
                        .catch(addMessage);
                }
                else {
                    goApply();
                }
            })
            .catch(addMessage);
    };
    const finish = () => {
        taskManager.finishTask(taskData.taskId)
            .then(() => {
                addMessage("Notified finished task", "Success");
            })
            .catch(addMessage);
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

function SponsorActions({ walletAddress, taskData, state, addMessage }) {
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
                        .then(() => {
                            setTokenAmount("0");
                            addMessage("Sponsored task", "Success");
                        })
                        .catch(addMessage);
                }

                if (currentAllowance.toNumber() < parseInt(tokenAmount)) {
                    tokenC.approve(taskManager.address, parseInt(tokenAmount))
                        .then(goSponsor)
                        .catch(addMessage);
                }
                else {
                    goSponsor();
                }
            })
            .catch(addMessage);
    };
    const withdraw = () => {
        taskManager.withdrawSponsorship(taskData.taskId)
            .then(() => {
                addMessage("Withdrew from task", "Success");
                setTokenAmount("0");
            })
            .catch(addMessage);
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

export default function Task({ walletAddress, taskDatas, role, addMessage }) {
    let { memberManager, taskManager, TaskState, TaskStateM, categoryManager } = Contracts;
    const params = useParams();
    const { taskId } = params;
    const [managerName, setManagerName] = useState('Loading...');
    const [categoryName, setCategoryName] = useState('Loading...');
    const [evaluatorName, setEvaluatorName] = useState('Loading...');
    const [freelancers, setFreelancers] = useState(null);

    let taskData = taskDatas?.find(data => data.taskId == taskId);
    useEffect(() => {
        if (evaluatorName == 'Loading...' &&
            taskDatas &&
            taskData.evaluator == 0) {
            setEvaluatorName(undefined);
        }
    });
    useEffect(() => {
        if (freelancers == null && taskData) {
            (async () => {
                let freeAdresses = taskData.freelancersData.freelancers;
                let fr = [];

                for (let i = 0; i < freeAdresses.length; i++) {
                    let info = await memberManager.getFreelancerInfo(freeAdresses[i]);
                    let data = info.data;
                    data.address = freeAdresses[i];
                    data.rep = info.rep;
                    data.idx = i;
                    fr.push(data);
                }
                setFreelancers(fr);
            })();
        }
    });


    if (!taskData) {
        return 'Not found task';
    }

    let state = taskData.state;
    if (state == TaskStateM.Unknown) {
        return "This task has been deleted";
    }

    memberManager.getManagerInfo(taskData.manager)
        .then((info) => {
            setManagerName(info.data.name)
        })
        .catch(addMessage);

    categoryManager.getCategoryName(taskData.data.category)
        .then(setCategoryName)
        .catch(addMessage);

    if (taskData.evaluator != 0) {
        memberManager.getEvaluatorInfo(taskData.evaluator)
            .then(info => info && setEvaluatorName(info.data.name))
            .catch(addMessage);
    }
    console.log('c');

    return (
        <VStack>
            <Container
                style={{
                    backgroundColor: "var(--bg-default)",
                }}
            >
                <h1
                    style={{
                        color: 'orange'
                    }}
                >
                    {'Task #' + taskId}
                </h1>
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
                    {'Manager: ' + managerName + ' Adress: ' + taskData.manager}
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
                <p style={{
                    marginBottom: "var(--space-8)",
                }}>
                    {'Freelancers: '}
                </p>
                {freelancers && freelancers.map((info, k) => {
                    return (<FreelancerCard key={k} info={info} isManager={false} />);
                })}
            </Container>

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
                        addMessage={addMessage}
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
                            addMessage={addMessage}
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
                        addMessage={addMessage}
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
                        addMessage={addMessage}
                        walletAddress={walletAddress}
                    />
                </VStack>
            ) : null
            }
        </VStack >
    );
}