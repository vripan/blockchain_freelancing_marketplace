import { Link } from "react-router-dom";
import { HStack, VStack } from '../styles';
import Contracts from '../contracts';

export default function TaskCard({ taskData }) {
    const { TaskState } = Contracts;

    return (
        <Link
            style={{
                textDecoration: 'none'
            }}
            to={"/tasks/" + taskData.taskId}
        >
            <VStack
                style={{
                    backgroundColor: "var(--bg-default)",
                    border: "1px solid var(--outline-dimmest)",
                    borderRadius: "var(--br-8)",
                    marginBottom: "var(--space-16)",
                    overflow: "hidden",
                }}
            >
                {/* CONTRACT CONTENTS */}
                <HStack
                    style={{
                        alignItems: "center",
                        width: "100%",
                        cursor: "pointer",
                        gap: "var(--space-8)",
                        justifyContent: "space-between",
                        padding: "var(--space-8)",
                    }}
                    onClick={null}
                >
                    <h2>{'Task #' + taskData.taskId}</h2>
                    <span
                        style={{ color: 'green' }}
                    >
                        {'Status: ' + TaskState[taskData.state]}
                    </span>
                </HStack>

                <HStack
                    style={{
                        padding: "var(--space-8)",
                        borderBottom: "1px solid var(--outline-dimmest)"
                    }}
                >
                    <h3>{taskData.data.description}</h3>
                </HStack>

            </VStack>
        </Link>
    );
}