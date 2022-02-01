import { HStack, OutlinedButton, VStack, Container } from './styles';
import { useEffect, useState } from 'react';
import Contracts from './contracts';
import { useParams } from 'react-router-dom';

function EvaluatorCard({ info, onClick }) {
    return (
        <HStack
            onClick={onClick}
            style={{
                alignItems: 'space-between',
            }}
        >
            {'Name: ' + info.name}
        </HStack>
    );
}

function ManagerActions({ state, categoryId, taskId, setErrors }) {
    let { taskManager, TaskStateM, memberManager } = Contracts;
    const [evaluators, setEvaluators] = useState(null);

    (async () => {
        let evalAdresses = await memberManager.getEvaluatorsArray();
        let ea = [];
        for (let i = 0; i < evalAdresses.length; i++) {
            let info = await memberManager.getEvaluatorInfo(evalAdresses[i]);
            if (info.data.categoryId == categoryId) {
                let data = info.data;
                data.address = evalAdresses[i];
                ea.push(data);
            }
        }
        setEvaluators(ea);
    })();

    const chooseEvaluator = (evaluatorAddress) => {
        taskManager.linkEvaluatorToTask(taskId, evaluatorAddress)
            .then(() => setEvaluators(null))
            .error(e => setErrors([e]));
    };
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
    return null;
}

// de testat freelancer-ul
function FreelancerActions({ walletAddress, state, taskData, setErrors }) {
    let { taskManager, TaskStateM, tokenC } = Contracts;
    let rewardEvaluator = taskData.data.rewardEvaluator;

    const apply = () => {
        tokenC.allowance(walletAddress, taskManager.address)
            .then((currentAllowance) => {
                if (currentAllowance.toNumber() < rewardEvaluator.toNumber()) {
                    tokenC.approve(taskManager.address, rewardEvaluator.toNumber())
                        .then(goApply)
                        .catch((e) => setErrors([e]));
                }
                else {
                    goApply();
                }

                const goApply = () => {
                    taskManager.applyTask(taskData.taskId)
                        .then((res) => {
                            console.log(res);
                        })
                        .catch((e) => setErrors([e]));
                };
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

    if (state == TaskStateM.Ready) {
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

                    <OutlinedButton
                        onClick={finish}
                        style={{
                            marginBottom: "var(--space-8)",
                        }}
                    >
                        Withdraw All
                    </OutlinedButton>
                </VStack>
            </Container>
        )
    }
    return null;
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

                if (currentAllowance.toNumber() < parseInt(tokenAmount)) {
                    tokenC.approve(taskManager.address, parseInt(tokenAmount))
                        .then(goSponsor)
                        .catch((e) => setErrors([e]));
                }
                else {
                    goSponsor();
                }

                const goSponsor = () => {
                    taskManager.sponsorTask(taskData.taskId, parseInt(tokenAmount))
                        .then((res) => {
                            console.log(res);
                            setTokenAmount("0");
                        })
                        .catch((e) => setErrors([e]));
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
    return null;
}

export default function Task({ walletAddress, taskDatas, role, setErrors }) {
    let { memberManager, taskManager, TaskState, TaskStateM } = Contracts;
    const params = useParams();
    const { taskId } = params;
    const [managerName, setManagerName] = useState('Loading...');

    if (!taskDatas || taskId >= taskDatas.length) {
        return 'Not found task';
    }
    let taskData = taskDatas[taskId];
    let state = taskData.state;

    memberManager.getManagerInfo(taskDatas[taskId].manager)
        .then((info) => setManagerName(info.data.name))
        .catch(e => setErrors([e]));

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
            {role == memberManager.Role.Freelancer ? (
                <FreelancerActions
                    state={state}
                    setErrors={setErrors}
                    taskData={taskData}
                    walletAddress={walletAddress}
                />) : null
            }
            {
                role == memberManager.Role.Sponsor ? (
                    <SponsorActions
                        walletAddress={walletAddress}
                        taskData={taskData}
                        state={state}
                        setErrors={setErrors}
                    />) : null
            }
            {role == memberManager.Role.Manager ? (
                <ManagerActions
                    taskId={taskId}
                    categoryId={taskData.data.category}
                    state={state}
                    setErrors={setErrors}
                />) : null
            }
            {//role == memberManager.Role.Evaluator ? (<EvaluatorActions />) : null
            }
        </VStack >
    );
}