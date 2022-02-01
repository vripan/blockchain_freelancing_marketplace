import { HStack, VStack } from '../styles';
import TaskCard from './taskcard';

export default function Tasks({ taskDatas }) {
    return taskDatas && (
        <VStack>
            {/* TASKS */}
            <HStack
                className="marketplace-header"
                style={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "var(--space-16)",
                }}
            >
                <h2>Marketplace Tasks</h2>
                <p>{taskDatas.length + ' tasks'}</p>
            </HStack>

            <VStack
                className="marketplace-tasks"
                style={{
                    width: "100%",
                    justifyContent: "space-between",
                    paddingBottom: "var(--space-16)",
                }}
            >
                {taskDatas.map((taskData, k) => <TaskCard taskData={taskData} key={k} />)}
            </VStack>
        </VStack>
    )
}