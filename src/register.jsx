import { HStack, OutlinedButton, VStack } from './styles';
import { useEffect, useState } from 'react';
import Contracts from './contracts';

export default function Register({ walletAddress }) {
    let { memberManager } = Contracts;

    let [role, setRole] = useState(null);
    let [selectionRoleId, setSelectionRoleId] = useState(0);
    let [name, setName] = useState('Steve');
    let [category, setCategory] = useState('0');

    // Form Stuff
    const NameForm = () => (
        <HStack
            style={{
                marginBottom: "var(--space-16)",
            }}
        >
            <p>Name:</p>
            <pre> </pre>
            <input value={name} onChange={({ target: { value } }) => setName(value)} />
        </HStack>
    );
    const CategoryForm = () => (
        <HStack
            style={{
                marginBottom: "var(--space-16)",
            }}
        >
            <p>CategoryId:</p>
            <pre> </pre>
            <input value={category} onChange={({ target: { value } }) => setCategory(value)} />
        </HStack>
    );
    const roleOptions = [
        { value: 0, label: "Unknown" },
        {
            value: 1, label: "Freelancer",
            comp: (
                <VStack key={1}>
                    <NameForm />
                    <CategoryForm />
                </VStack>
            )
        },
        {
            value: 2, label: "Manager",
            comp: (
                <VStack key={2}>
                    <NameForm />
                </VStack>
            )
        },
        {
            value: 3, label: "Sponsor", comp: (
                <VStack key={3}>
                    <NameForm />
                </VStack>
            )
        },
        {
            value: 4, label: "Evaluator", comp: (
                <VStack key={4}>
                    <NameForm />
                    <CategoryForm />
                </VStack>
            )
        },
    ];

    async function joinAsRole() {
        let result;
        if (selectionRoleName == "Freelancer") {
            result = await memberManager.joinAsFreelancer({ name: name, categoryId: parseInt(category) });
        }
        else if (selectionRoleName == "Manager") {
            result = await memberManager.joinAsManager({ name: name })
        }
        else if (selectionRoleName == "Sponsor") {
            result = await memberManager.joinAsSponsor({ name: name })
        }
        else if (selectionRoleName == "Evaluator") {
            result = await memberManager.joinAsEvaluator({ name: name, categoryId: parseInt(category) })
        }
        else {
            return;
        }

        setRole(selectionRoleId);
    }

    // Actual code
    let selectionRoleName = roleOptions.find((el) => el.value == selectionRoleId).label;
    useEffect(() => {
        if (walletAddress) {
            (async () => {
                let res = await memberManager.getRole(walletAddress);
                if (res != 0) {
                    setRole(res);
                    setSelectionRoleId(res);
                }
            })();
        }
    });

    // Rendering
    return (role && role != 0) ? ('Your role is ' + roleOptions.find((el) => el.value == role).label) : (
        <VStack
            style={{
                justifyContent: "space-between",
                paddingBottom: "var(--space-16)",
            }}
        >
            <p>Choose a role</p>

            <select
                value={selectionRoleId}
                onChange={({ target: { value } }) => setSelectionRoleId(value)}
                style={{
                    marginBottom: "var(--space-16)",
                }}
            >
                {roleOptions.map((op, k) => <option key={k} value={op.value}>{op.label}</option>)}
            </select>

            {roleOptions.map(op => selectionRoleName == op.label ? op.comp : null)}

            {selectionRoleName != "Unknown"
                ? (
                    <OutlinedButton
                        onClick={joinAsRole}
                    >
                        Join as {selectionRoleName}
                    </OutlinedButton>
                )
                : null}

        </VStack >
    );
}