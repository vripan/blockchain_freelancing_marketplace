import { useEffect, useState } from 'react';
import Contracts from '../contracts';
import { VStack } from '../styles';

export default function Categories({ onChange, disValue }) {
    let { categoryManager } = Contracts;
    let [categories, setCategories] = useState(null);

    useEffect(() => {
        if (!categories) {
            (async () => {
                let res = await categoryManager.getCategories();
                setCategories(res);
            })();
        }
    });

    return (
        <VStack>
            <label
                style={{
                    marginBottom: "var(--space-16)",
                }}
            >Categories: </label>
            <select
                value={disValue}
                onChange={({ target: { value } }) => onChange(value)}
                style={{
                    marginBottom: "var(--space-16)",
                }}
            >
                {categories?.map((op, k) => <option key={k} value={k}>{op}</option>)}
            </select>
        </VStack>
    );
}