import { HStack, OutlinedButton, VStack } from './styles';
import { useEffect, useState } from 'react';
import Categories from './components/categories';
import Contracts from './contracts';

export default function CreateTask({ walletAddress, setErrors }) {
    const { taskManager } = Contracts;

    let [description, setDescription] = useState('');
    let [selectionCategoryId, setSelectionCategoryId] = useState(0);
    let [rewardFreelancer, setRewardFreelancer] = useState(1);
    let [rewardEvaluator, setRewardEvaluator] = useState(1);

    function createTask() {
        if (description == '') {
            setErrors(['Description cannot be empty']);
            return;
        }
        if (rewardFreelancer == '') {
            setErrors(['Reward Freelancer cannot be empty']);
            return;
        }
        if (rewardEvaluator == '') {
            setErrors(['Reward Evaluator cannot be empty']);
            return;
        }

        taskManager.addTask({
            description: description,
            rewardFreelancer: rewardFreelancer,
            rewardEvaluator: rewardEvaluator,
            category: selectionCategoryId
        })
            .then(async (tx) => {
                let rec = await tx.wait();
                console.log(rec.events.find(x => x.event == "TaskAdded"));
            })
            .catch((e) => setErrors([e]));
    }

    return (
        <VStack>
            <HStack
                style={{
                    marginBottom: "var(--space-16)",
                }}
            >
                <p>Description:</p>
                <pre> </pre>
                <input value={description} onChange={({ target: { value } }) => setDescription(value)} />
            </HStack>
            <Categories key={2}
                disValue={selectionCategoryId}
                onChange={setSelectionCategoryId}
            />
            <HStack
                style={{
                    marginBottom: "var(--space-16)",
                }}
            >
                <p>Reward freelancer:</p>
                <pre> </pre>
                <input value={rewardFreelancer} onChange={({ target: { value } }) => setRewardFreelancer(value)} />
            </HStack>
            <HStack
                style={{
                    marginBottom: "var(--space-16)",
                }}
            >
                <p>Reward Evaluator:</p>
                <pre> </pre>
                <input value={rewardEvaluator} onChange={({ target: { value } }) => setRewardEvaluator(value)} />
            </HStack>
            <OutlinedButton
                onClick={createTask}
            >
                Create task
            </OutlinedButton>
        </VStack>
    );
}